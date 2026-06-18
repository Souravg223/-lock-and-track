package com.aoop.aooplost.controller;

import com.aoop.aooplost.dto.ApiResponse;
import com.aoop.aooplost.entity.User;
import com.aoop.aooplost.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@RestController
@RequestMapping("/api/users")
@RequiredArgsConstructor
public class UserController {

    private final UserRepository userRepository;

    @GetMapping("/leaderboard")
    public ResponseEntity<ApiResponse<List<User>>> getLeaderboard() {
        List<User> topUsers = userRepository.findTop5ByOrderByTrustScoreDesc();
        return ResponseEntity.ok(ApiResponse.success(topUsers, "Leaderboard retrieved successfully"));
    }
}
