package com.aoop.aooplost.service;

import com.aoop.aooplost.entity.AdminActivity;
import com.aoop.aooplost.entity.User;
import com.aoop.aooplost.entity.enums.Role;
import com.aoop.aooplost.repository.AdminActivityRepository;
import com.aoop.aooplost.repository.UserRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.MockitoAnnotations;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;

import java.util.Collections;
import java.util.Optional;
import java.util.UUID;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

class AdminServiceTest {

    @Mock
    private UserRepository userRepository;
    @Mock
    private AdminActivityRepository adminActivityRepository;
    @InjectMocks
    private AdminService adminService;

    private UUID adminUuid = UUID.randomUUID();
    private User adminUser;

    @BeforeEach
    void setUp() {
        MockitoAnnotations.openMocks(this);
        adminUser = new User();
        adminUser.setId(adminUuid);
        adminUser.setEmail("admin@example.com");
        adminUser.setRole(Role.ROLE_ADMIN);
        // Mock SecurityContextHolder to return an Authentication with admin email
        Authentication auth = mock(Authentication.class);
        when(auth.getName()).thenReturn(adminUser.getEmail());
        SecurityContextHolder.getContext().setAuthentication(auth);
        // User repository to find admin by email
        when(userRepository.findByEmail(adminUser.getEmail())).thenReturn(Optional.of(adminUser));
    }

    @Test
    void testBlockUserLogsActivity() {
        UUID targetUserId = UUID.randomUUID();
        User target = new User();
        target.setId(targetUserId);
        target.setRole(Role.ROLE_USER);
        when(userRepository.findById(targetUserId)).thenReturn(Optional.of(target));
        when(userRepository.save(any(User.class))).thenReturn(target);
        adminService.toggleBlockUser(targetUserId, true);
        // Verify activity saved with correct adminId and description
        verify(adminActivityRepository, times(1)).save(argThat(activity ->
                activity.getAdminId().equals(adminUuid) &&
                activity.getAction().contains("Blocked") &&
                activity.getAction().contains(targetUserId.toString())));
    }

    @Test
    void testChangeUserRoleLogsActivity() {
        UUID targetUserId = UUID.randomUUID();
        User target = new User();
        target.setId(targetUserId);
        target.setRole(Role.ROLE_USER);
        when(userRepository.findById(targetUserId)).thenReturn(Optional.of(target));
        when(userRepository.save(any(User.class))).thenReturn(target);
        adminService.changeUserRole(targetUserId, Role.ROLE_ORGANIZATION);
        verify(adminActivityRepository, times(1)).save(argThat(activity ->
                activity.getAdminId().equals(adminUuid) &&
                activity.getAction().contains("Changed role") &&
                activity.getAction().contains(targetUserId.toString())));
    }
}
