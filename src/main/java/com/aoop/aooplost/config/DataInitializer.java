package com.aoop.aooplost.config;

import com.aoop.aooplost.entity.User;
import com.aoop.aooplost.entity.enums.Role;
import com.aoop.aooplost.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.boot.CommandLineRunner;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;

@Component
@RequiredArgsConstructor
public class DataInitializer implements CommandLineRunner {

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;

    @Override
    public void run(String... args) throws Exception {
        User admin = userRepository.findByEmail("admin@findora.com")
                .orElseGet(() -> User.builder().email("admin@findora.com").build());
        
        admin.setFirstName("Admin");
        admin.setLastName("User");
        admin.setPassword(passwordEncoder.encode("admin123"));
        admin.setRole(Role.ROLE_ADMIN);
        
        userRepository.save(admin);
        System.out.println("Admin user created/updated successfully.");
    }
}
