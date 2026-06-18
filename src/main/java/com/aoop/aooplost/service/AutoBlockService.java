package com.aoop.aooplost.service;

import com.aoop.aooplost.entity.AdminActivity;
import com.aoop.aooplost.entity.Notification;
import com.aoop.aooplost.entity.Review;
import com.aoop.aooplost.entity.User;
import com.aoop.aooplost.entity.enums.Role;
import com.aoop.aooplost.repository.AdminActivityRepository;
import com.aoop.aooplost.repository.NotificationRepository;
import com.aoop.aooplost.repository.ReviewRepository;
import com.aoop.aooplost.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.Arrays;
import java.util.List;

/**
 * AutoBlockService — automatically evaluates a user's reviews after each
 * new review submission and blocks them if they exceed safety thresholds.
 *
 * THRESHOLDS (any one triggers auto-block):
 *   • 2+ reviews containing scam-indicator keywords
 *   • 3+ reviews with rating ≤ 2 stars
 *   • Trust score drops to ≤ 30
 */
@Service
@RequiredArgsConstructor
@Slf4j
public class AutoBlockService {

    private final ReviewRepository     reviewRepository;
    private final UserRepository       userRepository;
    private final NotificationRepository notificationRepository;
    private final AdminActivityRepository adminActivityRepository;

    // ── Scam / fraud indicator keywords ───────
    public static final List<String> SCAM_KEYWORDS = Arrays.asList(
            "scam", "scammer", "fake", "cheat", "cheater", "fraud", "fraudulent",
            "liar", "lied", "stole", "stolen", "robbery", "rob", "robbed",
            "money", "demanded", "demand", "payment", "extort", "extortion",
            "hostile", "rude", "threat", "threatening", "blackmail",
            "fake item", "never returned", "never came", "never showed"
    );

    // ── Thresholds ────────────────────────────────────────────────────────────
    private static final int SCAM_KEYWORD_THRESHOLD  = 2;   // 2+ scam-keyword reviews
    private static final int NEGATIVE_REVIEW_THRESHOLD = 3; // 3+ reviews with rating ≤ 2
    private static final int TRUST_SCORE_THRESHOLD   = 30;  // trust score ≤ 30

    /**
     * Call this AFTER saving a new review.
     * Evaluates the reviewee and auto-blocks if any threshold is exceeded.
     *
     * @param reviewee     the user being reviewed
     * @param latestReview the review just submitted (already persisted)
     * @return true if the user was auto-blocked, false otherwise
     */
    @Transactional
    public boolean evaluate(User reviewee, Review latestReview) {

        // Skip if already blocked or if they are an admin
        if (Boolean.TRUE.equals(reviewee.getIsBlocked())
                || reviewee.getRole() == Role.ROLE_ADMIN) {
            return false;
        }

        // Fetch all reviews for this reviewee
        List<Review> allReviews = reviewRepository.findByReviewee_Id(reviewee.getId());

        long scamFlagCount = allReviews.stream()
                .filter(r -> containsScamKeyword(r.getComment()))
                .count();

        long negativeReviewCount = allReviews.stream()
                .filter(r -> r.getRating() != null && r.getRating() <= 2)
                .count();

        Integer trustScore = reviewee.getTrustScore() == null ? 100 : reviewee.getTrustScore();

        boolean shouldBlock = scamFlagCount  >= SCAM_KEYWORD_THRESHOLD
                           || negativeReviewCount >= NEGATIVE_REVIEW_THRESHOLD
                           || trustScore <= TRUST_SCORE_THRESHOLD;

        if (!shouldBlock) return false;

        // ── Block the user ────────────────────────────────────────────────────
        reviewee.setIsBlocked(true);
        userRepository.save(reviewee);

        // Build reason string
        String reason = buildReason(scamFlagCount, negativeReviewCount, trustScore);
        log.warn("AUTO-BLOCK triggered for user {} ({}). Reason: {}",
                reviewee.getEmail(), reviewee.getId(), reason);

        // ── Log in AdminActivity ──────────────────────────────────────────────
        AdminActivity activity = new AdminActivity();
        activity.setAdminId(null); // null means system-triggered
        activity.setAction("🤖 AUTO-BLOCK: " + reviewee.getEmail()
                + " | " + reason
                + " | TrustScore=" + trustScore);
        adminActivityRepository.save(activity);

        // ── Notify all admins ─────────────────────────────────────────────────
        List<User> admins = userRepository.findAll().stream()
                .filter(u -> u.getRole() == Role.ROLE_ADMIN)
                .toList();

        for (User admin : admins) {
            Notification notification = Notification.builder()
                    .user(admin)
                    .message("🚨 Auto-Block Alert: " + reviewee.getFirstName() + " "
                            + reviewee.getLastName() + " (" + reviewee.getEmail()
                            + ") was automatically blocked. Reason: " + reason)
                    .type("SYSTEM_ALERT")
                    .isRead(false)
                    .build();
            notificationRepository.save(notification);
        }

        // ── Notify the blocked user themselves ────────────────────────────────
        Notification userNotification = Notification.builder()
                .user(reviewee)
                .message("⚠️ Your account has been suspended due to multiple negative "
                        + "reviews or scam-related reports. Please contact support to appeal.")
                .type("SYSTEM_ALERT")
                .isRead(false)
                .build();
        notificationRepository.save(userNotification);

        return true;
    }

    // ── Helper: check if comment contains any scam keyword ───────────────────
    public static boolean containsScamKeyword(String comment) {
        if (comment == null || comment.isBlank()) return false;
        String lower = comment.toLowerCase();
        return SCAM_KEYWORDS.stream().anyMatch(lower::contains);
    }

    // ── Helper: build human-readable reason string ───────────────────────────
    private String buildReason(long scamCount, long negCount, int trustScore) {
        StringBuilder sb = new StringBuilder();
        if (scamCount >= SCAM_KEYWORD_THRESHOLD)
            sb.append(scamCount).append(" scam-keyword report(s)");
        if (negCount >= NEGATIVE_REVIEW_THRESHOLD) {
            if (sb.length() > 0) sb.append(", ");
            sb.append(negCount).append(" negative review(s)");
        }
        if (trustScore <= TRUST_SCORE_THRESHOLD) {
            if (sb.length() > 0) sb.append(", ");
            sb.append("trust score=").append(trustScore);
        }
        return sb.toString();
    }
}
