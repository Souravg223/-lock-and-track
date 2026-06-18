package com.aoop.aooplost.controller;

import com.aoop.aooplost.dto.ApiResponse;
import com.aoop.aooplost.dto.ReviewRequest;
import com.aoop.aooplost.entity.Match;
import com.aoop.aooplost.entity.Review;
import com.aoop.aooplost.entity.User;
import com.aoop.aooplost.entity.enums.MatchStatus;
import com.aoop.aooplost.repository.MatchRepository;
import com.aoop.aooplost.repository.ReviewRepository;
import com.aoop.aooplost.repository.UserRepository;
import com.aoop.aooplost.service.AutoBlockService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/reviews")
@RequiredArgsConstructor
@Slf4j
public class ReviewController {

    private final ReviewRepository    reviewRepository;
    private final MatchRepository     matchRepository;
    private final UserRepository      userRepository;
    private final AutoBlockService    autoBlockService;   // ← NEW

    @PostMapping
    @Transactional
    public ResponseEntity<ApiResponse<Review>> submitReview(
            @Valid @RequestBody ReviewRequest request,
            Authentication authentication) {

        Match match = matchRepository.findById(request.getMatchId())
                .orElseThrow(() -> new RuntimeException("Match not found"));

        if (match.getStatus() != MatchStatus.SUCCESSFULLY_RETURNED) {
            return ResponseEntity.status(400).body(ApiResponse.error(
                    "Reviews can only be submitted for successfully completed handovers"));
        }

        String email = authentication.getName();
        User reviewer = userRepository.findByEmail(email)
                .orElseThrow(() -> new RuntimeException("User not found"));

        // Identify reviewee
        User reviewee = null;
        if (match.getLostItem().getUser().getId().equals(reviewer.getId())) {
            reviewee = match.getFoundItem().getUser();
        } else if (match.getFoundItem().getUser().getId().equals(reviewer.getId())) {
            reviewee = match.getLostItem().getUser();
        }

        if (reviewee == null) {
            return ResponseEntity.status(403).body(ApiResponse.error(
                    "You are not authorized to review this match"));
        }

        // Prevent double reviewing
        if (reviewRepository.existsByMatch_IdAndReviewer_Id(match.getId(), reviewer.getId())) {
            return ResponseEntity.status(400).body(ApiResponse.error(
                    "You have already submitted a review for this transaction"));
        }

        // ── Trust score calculation ──────────────────────────────────────────
        int trustScoreChange = switch (request.getRating()) {
            case 5 -> 10;
            case 4 -> 5;
            case 3 -> 0;
            case 2 -> -15;
            case 1 -> -30;
            default -> 0;
        };

        // Bonus: +3 if high rating AND meaningful comment (≥20 chars)
        boolean hasMeaningfulComment = request.getComment() != null
                && request.getComment().trim().length() >= 20;
        boolean isHighRating = request.getRating() >= 4;
        int commentBonus = (isHighRating && hasMeaningfulComment) ? 3 : 0;
        trustScoreChange += commentBonus;

        Integer currentScore = reviewee.getTrustScore() == null ? 100 : reviewee.getTrustScore();
        int newScore = Math.max(0, Math.min(1000, currentScore + trustScoreChange));
        reviewee.setTrustScore(newScore);
        userRepository.save(reviewee);

        // ── Save review ──────────────────────────────────────────────────────
        Review review = Review.builder()
                .match(match)
                .reviewer(reviewer)
                .reviewee(reviewee)
                .rating(request.getRating())
                .comment(request.getComment())
                .build();

        Review savedReview = reviewRepository.save(review);

        log.info("Review submitted by {} for {} | rating={}★ | bonus=+{} | score: {}→{}",
                reviewer.getEmail(), reviewee.getEmail(),
                request.getRating(), commentBonus, currentScore, newScore);

        // ── AUTO-BLOCK EVALUATION ────────────────────────────────────────────
        boolean wasAutoBlocked = autoBlockService.evaluate(reviewee, savedReview);
        if (wasAutoBlocked) {
            log.warn("User {} was AUTO-BLOCKED after review by {}", reviewee.getEmail(), reviewer.getEmail());
        }

        // Build response message
        String message = "Feedback submitted successfully.";
        if (wasAutoBlocked) {
            message += " ⚠️ The reviewed user has been automatically blocked due to repeated violations.";
        }

        return ResponseEntity.ok(ApiResponse.success(savedReview, message));
    }

    @GetMapping("/user/{userId}")
    public ResponseEntity<ApiResponse<List<Review>>> getUserReviews(@PathVariable UUID userId) {
        List<Review> reviews = reviewRepository.findByReviewee_Id(userId);
        return ResponseEntity.ok(ApiResponse.success(reviews, "User reviews retrieved successfully"));
    }

    @GetMapping("/admin/all")
    public ResponseEntity<ApiResponse<List<Review>>> getAllReviews(Authentication authentication) {
        String email = authentication.getName();
        User currentUser = userRepository.findByEmail(email)
                .orElseThrow(() -> new RuntimeException("User not found"));

        if (!"ROLE_ADMIN".equals(currentUser.getRole().name())) {
            return ResponseEntity.status(403).body(ApiResponse.error("Unauthorized: Admin privilege required"));
        }

        List<Review> reviews = reviewRepository.findAll();
        return ResponseEntity.ok(ApiResponse.success(reviews, "All reviews retrieved successfully"));
    }
}
