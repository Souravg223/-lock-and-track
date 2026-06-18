package com.aoop.aooplost.service;

import com.aoop.aooplost.dto.RegisterRequest;
import com.aoop.aooplost.dto.ProfileUpdateRequest;
import com.aoop.aooplost.entity.User;
import com.aoop.aooplost.entity.PasswordResetOtp;
import com.aoop.aooplost.entity.enums.Role;
import com.aoop.aooplost.repository.UserRepository;
import com.aoop.aooplost.repository.PasswordResetOtpRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import java.time.LocalDateTime;
import java.util.Random;

@Service
@RequiredArgsConstructor
public class UserService {

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;
    private final PasswordResetOtpRepository passwordResetOtpRepository;
    private final EmailService emailService;

    @Transactional
    public User registerUser(RegisterRequest request) {
        if (userRepository.existsByEmail(request.getEmail())) {
            throw new RuntimeException("Error: Email is already in use!");
        }

        User user = User.builder()
                .firstName(request.getFirstName())
                .lastName(request.getLastName())
                .email(request.getEmail())
                .password(passwordEncoder.encode(request.getPassword()))
                .role(Role.ROLE_USER)
                .build();

        return userRepository.save(user);
    }

    @Transactional
    public User updateUserProfile(String email, ProfileUpdateRequest request) {
        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new RuntimeException("User not found"));

        if (request.getFirstName() != null) user.setFirstName(request.getFirstName());
        if (request.getLastName() != null) user.setLastName(request.getLastName());
        if (request.getPhoneNumber() != null) user.setPhoneNumber(request.getPhoneNumber());
        if (request.getAvatarUrl() != null) user.setAvatarUrl(request.getAvatarUrl());
        if (request.getBio() != null) user.setBio(request.getBio());

        return userRepository.save(user);
    }

    public User findByEmail(String email) {
        return userRepository.findByEmail(email)
                .orElseThrow(() -> new RuntimeException("User not found"));
    }

    @Transactional
    public void generateForgotPasswordOtp(String email) {
        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new RuntimeException("Email address not registered."));

        // Delete any existing OTPs first
        passwordResetOtpRepository.deleteByEmail(email);

        // Generate 6-digit OTP
        String otp = String.format("%06d", new Random().nextInt(999999));

        PasswordResetOtp resetOtp = PasswordResetOtp.builder()
                .email(email)
                .otp(otp)
                .expiryTime(LocalDateTime.now().plusMinutes(5))
                .build();

        passwordResetOtpRepository.save(resetOtp);

        // Trigger secure async email notification
        emailService.sendPasswordResetOtp(user, otp);
    }

    @Transactional
    public void resetPasswordWithOtp(String email, String otp, String newPassword) {
        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new RuntimeException("User not found"));

        PasswordResetOtp resetOtp = passwordResetOtpRepository.findByEmailAndOtp(email, otp)
                .orElseThrow(() -> new RuntimeException("Invalid OTP code or email."));

        if (resetOtp.getExpiryTime().isBefore(LocalDateTime.now())) {
            passwordResetOtpRepository.delete(resetOtp);
            throw new RuntimeException("OTP has expired. Please request a new one.");
        }

        // OTP is valid! Update user password
        user.setPassword(passwordEncoder.encode(newPassword));
        userRepository.save(user);

        // Delete verified OTP
        passwordResetOtpRepository.delete(resetOtp);
    }
}
