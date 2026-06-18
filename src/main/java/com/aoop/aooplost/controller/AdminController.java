package com.aoop.aooplost.controller;

import com.aoop.aooplost.dto.AdminStatsDto;
import com.aoop.aooplost.entity.AdminActivity;
import java.util.List;
import com.aoop.aooplost.dto.ApiResponse;
import com.aoop.aooplost.entity.User;
import com.aoop.aooplost.repository.FoundItemRepository;
import com.aoop.aooplost.repository.LostItemRepository;
import com.aoop.aooplost.repository.MatchRepository;
import com.aoop.aooplost.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/admin")
@RequiredArgsConstructor
public class AdminController {

    private final UserRepository userRepository;
    private final LostItemRepository lostItemRepository;
    private final FoundItemRepository foundItemRepository;
    private final MatchRepository matchRepository;
    private final com.aoop.aooplost.service.AdminService adminService;

    @GetMapping("/stats")
    public ResponseEntity<ApiResponse<AdminStatsDto>> getAdminStats(Authentication authentication) {
        requireAdmin(authentication);

        long totalUsers = userRepository.count();
        long totalLost = lostItemRepository.count();
        long totalFound = foundItemRepository.count();
        long totalMatches = matchRepository.count();

        AdminStatsDto stats = AdminStatsDto.builder()
                .totalUsers(totalUsers)
                .totalLostItems(totalLost)
                .totalFoundItems(totalFound)
                .totalMatches(totalMatches)
                .build();

        return ResponseEntity.ok(ApiResponse.success(stats, "Admin analytics statistics retrieved successfully"));
    }

    // --- User Management ---

    @GetMapping("/users")
    public ResponseEntity<ApiResponse<java.util.List<User>>> getAllUsers(Authentication authentication) {
        requireAdmin(authentication);
        return ResponseEntity.ok(ApiResponse.success(adminService.getAllUsers(), "Users retrieved successfully"));
    }

    @PutMapping("/users/{id}/block")
    public ResponseEntity<ApiResponse<User>> toggleBlockUser(@org.springframework.web.bind.annotation.PathVariable java.util.UUID id, @org.springframework.web.bind.annotation.RequestParam boolean block, Authentication authentication) {
        requireAdmin(authentication);
        User user = adminService.toggleBlockUser(id, block);
        return ResponseEntity.ok(ApiResponse.success(user, "User block status updated"));
    }

    @PutMapping("/users/{id}/role")
    public ResponseEntity<ApiResponse<User>> changeUserRole(@org.springframework.web.bind.annotation.PathVariable java.util.UUID id, @org.springframework.web.bind.annotation.RequestParam String role, Authentication authentication) {
        requireAdmin(authentication);
        User user = adminService.changeUserRole(id, com.aoop.aooplost.entity.enums.Role.valueOf(role));
        return ResponseEntity.ok(ApiResponse.success(user, "User role updated"));
    }

    @PutMapping("/users/{id}/verify-org")
    public ResponseEntity<ApiResponse<User>> verifyOrganization(@org.springframework.web.bind.annotation.PathVariable java.util.UUID id, @org.springframework.web.bind.annotation.RequestParam boolean verify, Authentication authentication) {
        requireAdmin(authentication);
        User user = adminService.verifyOrganization(id, verify);
        return ResponseEntity.ok(ApiResponse.success(user, "User verification status updated"));
    }

    // --- Item Moderation ---
    @GetMapping("/items/lost")
    public ResponseEntity<ApiResponse<java.util.List<com.aoop.aooplost.entity.LostItem>>> getAllLostItems(Authentication authentication) {
        requireAdmin(authentication);
        return ResponseEntity.ok(ApiResponse.success(lostItemRepository.findAllByOrderByCreatedAtDesc(), "Lost items retrieved"));
    }

    @GetMapping("/items/found")
    public ResponseEntity<ApiResponse<java.util.List<com.aoop.aooplost.entity.FoundItem>>> getAllFoundItems(Authentication authentication) {
        requireAdmin(authentication);
        return ResponseEntity.ok(ApiResponse.success(foundItemRepository.findAllByOrderByCreatedAtDesc(), "Found items retrieved"));
    }

    @org.springframework.web.bind.annotation.DeleteMapping("/items/lost/{id}")
    public ResponseEntity<ApiResponse<String>> deleteLostItem(@org.springframework.web.bind.annotation.PathVariable java.util.UUID id, Authentication authentication) {
        requireAdmin(authentication);
        lostItemRepository.deleteById(id);
        return ResponseEntity.ok(ApiResponse.success(null, "Lost item deleted successfully"));
    }

    @org.springframework.web.bind.annotation.DeleteMapping("/items/found/{id}")
    public ResponseEntity<ApiResponse<String>> deleteFoundItem(@org.springframework.web.bind.annotation.PathVariable java.util.UUID id, Authentication authentication) {
        requireAdmin(authentication);
        foundItemRepository.deleteById(id);
        return ResponseEntity.ok(ApiResponse.success(null, "Found item deleted successfully"));
    }

    // --- Notifications ---
    @lombok.Data
    public static class BroadcastRequest {
        private String message;
        private String type;
    }

    @org.springframework.web.bind.annotation.PostMapping("/notifications/broadcast")
    public ResponseEntity<ApiResponse<String>> broadcastNotification(@org.springframework.web.bind.annotation.RequestBody BroadcastRequest request, Authentication authentication) {
        requireAdmin(authentication);
        adminService.broadcastNotification(request.getMessage(), request.getType());
        return ResponseEntity.ok(ApiResponse.success(null, "Broadcast notification sent to all users"));
    }

    @GetMapping("/activity")
    public ResponseEntity<ApiResponse<List<AdminActivity>>> getAllActivities(Authentication authentication) {
        requireAdmin(authentication);
        List<AdminActivity> activities = adminService.getAllActivities();
        return ResponseEntity.ok(ApiResponse.success(activities, "Admin activities retrieved successfully"));
    }

    // ── Auto-Block Log: returns only system AUTO-BLOCK entries ─────────────────
    @GetMapping("/auto-block-logs")
    public ResponseEntity<ApiResponse<List<AdminActivity>>> getAutoBlockLogs(Authentication authentication) {
        requireAdmin(authentication);
        List<AdminActivity> logs = adminService.getAutoBlockLogs();
        return ResponseEntity.ok(ApiResponse.success(logs, "Auto-block logs retrieved successfully"));
    }

    // ── Manual trigger: re-evaluate all existing users based on their reviews ──
    @PutMapping("/auto-block/run")
    public ResponseEntity<ApiResponse<String>> runAutoBlockScan(Authentication authentication) {
        requireAdmin(authentication);
        int blocked = adminService.runManualAutoBlockScan();
        return ResponseEntity.ok(ApiResponse.success(
                blocked + " user(s) newly auto-blocked.",
                "Auto-block scan complete"));
    }

    private void requireAdmin(Authentication authentication) {
        String email = authentication.getName();
        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new RuntimeException("User not found"));

        if (user.getRole() != com.aoop.aooplost.entity.enums.Role.ROLE_ADMIN) {
            throw new RuntimeException("Access denied. Admin role required.");
        }
    }
}
