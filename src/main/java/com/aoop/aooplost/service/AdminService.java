package com.aoop.aooplost.service;

import com.aoop.aooplost.entity.Notification;
import com.aoop.aooplost.entity.User;
import com.aoop.aooplost.entity.enums.Role;
import com.aoop.aooplost.repository.NotificationRepository;
import com.aoop.aooplost.repository.AdminActivityRepository;
import com.aoop.aooplost.entity.AdminActivity;
import com.aoop.aooplost.repository.ReviewRepository;
import com.aoop.aooplost.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.security.core.context.SecurityContextHolder;
import java.util.UUID;
import org.springframework.security.core.Authentication;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.stereotype.Service;
import java.util.List;

@Service
@RequiredArgsConstructor
public class AdminService {

    private final UserRepository userRepository;
    private final NotificationRepository notificationRepository;
    private final AdminActivityRepository adminActivityRepository;
    private final ReviewRepository reviewRepository;
    // Use @Lazy to avoid circular dependency (AutoBlockService -> AdminService chain)
    private final com.aoop.aooplost.service.AutoBlockService autoBlockService;

    public List<User> getAllUsers() {
        return userRepository.findAll();
    }

    @Transactional
    public User toggleBlockUser(java.util.UUID userId, boolean block) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new RuntimeException("User not found"));
        
        // Cannot block an admin
        if (block && user.getRole() == Role.ROLE_ADMIN) {
            throw new RuntimeException("Cannot block an admin user");
        }

        user.setIsBlocked(block);
        User savedUser = userRepository.save(user);
        // Log block/unblock activity
        UUID adminId = getCurrentAdminId();
        logActivity(adminId, (block ? "Blocked" : "Unblocked") + " user " + user.getId());
        return savedUser;
    }

    @Transactional
    public User changeUserRole(java.util.UUID userId, Role newRole) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new RuntimeException("User not found"));
        user.setRole(newRole);
        User savedUser = userRepository.save(user);
        // Log role change activity
        UUID adminId = getCurrentAdminId();
        logActivity(adminId, "Changed role of user " + user.getId() + " to " + newRole);
        return savedUser;
    }

    @Transactional
    public User verifyOrganization(java.util.UUID userId, boolean verify) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new RuntimeException("User not found"));
        
        user.setIsVerified(verify);
        if (verify && user.getRole() == Role.ROLE_USER) {
            user.setRole(Role.ROLE_ORGANIZATION);
        }
        User savedUser = userRepository.save(user);
        // Log organization verification activity
        UUID adminId = getCurrentAdminId();
        logActivity(adminId, (verify ? "Verified" : "Unverified") + " organization for user " + user.getId());
        return savedUser;
    }

    @Transactional
    public void broadcastNotification(String message, String type) {
        List<User> users = userRepository.findAll();
        for (User user : users) {
            Notification notification = Notification.builder()
                    .user(user)
                    .message(message)
                    .type(type)
                    .isRead(false)
                    .build();
            notificationRepository.save(notification);
        }
        // Log admin broadcast activity using helper
        UUID adminId = getCurrentAdminId();
        logActivity(adminId, "Broadcast Notification: " + message);
    }

    @Transactional
    public void logActivity(UUID adminId, String action) {
        AdminActivity activity = new AdminActivity();
        activity.setAdminId(adminId);
        activity.setAction(action);
        adminActivityRepository.save(activity);
    }

    @Transactional(readOnly = true)
    public List<AdminActivity> getAllActivities() {
        return adminActivityRepository.findAllByOrderByTimestampDesc();
    }

    /** Returns only AUTO-BLOCK entries (system-generated) */
    @Transactional(readOnly = true)
    public List<AdminActivity> getAutoBlockLogs() {
        return adminActivityRepository.findByActionContainingOrderByTimestampDesc("AUTO-BLOCK");
    }

    /**
     * Manual scan: re-evaluates every non-admin, non-blocked user
     * against their existing reviews and auto-blocks if thresholds exceeded.
     * Returns how many users were newly blocked.
     */
    @Transactional
    public int runManualAutoBlockScan() {
        int count = 0;
        List<com.aoop.aooplost.entity.Review> allReviews = reviewRepository.findAll();
        // Collect distinct reviewees
        java.util.Set<java.util.UUID> seen = new java.util.HashSet<>();
        for (com.aoop.aooplost.entity.Review rev : allReviews) {
            if (rev.getReviewee() == null) continue;
            java.util.UUID uid = rev.getReviewee().getId();
            if (seen.contains(uid)) continue;
            seen.add(uid);
            boolean blocked = autoBlockService.evaluate(rev.getReviewee(), rev);
            if (blocked) count++;
        }
        return count;
    }

    private UUID getCurrentAdminId() {
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        if (auth == null) {
            return null;
        }
        String email = auth.getName();
        return userRepository.findByEmail(email)
                .orElseThrow(() -> new RuntimeException("Admin user not found"))
                .getId();
    }
}
