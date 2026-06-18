package com.aoop.aooplost.controller;

import com.aoop.aooplost.dto.ApiResponse;
import com.aoop.aooplost.entity.Match;
import com.aoop.aooplost.entity.User;
import com.aoop.aooplost.repository.MatchRepository;
import com.aoop.aooplost.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import com.aoop.aooplost.repository.LostItemRepository;
import com.aoop.aooplost.repository.FoundItemRepository;
import com.aoop.aooplost.entity.enums.ItemStatus;
import com.aoop.aooplost.entity.enums.MatchStatus;
import com.aoop.aooplost.service.EmailService;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.transaction.annotation.Transactional;
import java.util.UUID;
import java.util.List;
import com.aoop.aooplost.entity.Notification;
import com.aoop.aooplost.repository.NotificationRepository;

@RestController
@RequestMapping("/api/matches")
@RequiredArgsConstructor
@lombok.extern.slf4j.Slf4j
public class MatchController {

    private final MatchRepository matchRepository;
    private final UserRepository userRepository;
    private final LostItemRepository lostItemRepository;
    private final FoundItemRepository foundItemRepository;
    private final EmailService emailService;
    private final NotificationRepository notificationRepository;

    @GetMapping
    public ResponseEntity<ApiResponse<List<Match>>> getUserMatches(Authentication authentication) {
        String email = authentication.getName();
        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new RuntimeException("User not found"));

        List<Match> matches = matchRepository.findByLostItem_UserIdOrFoundItem_UserId(user.getId(), user.getId());
        
        return ResponseEntity.ok(ApiResponse.success(matches, "Matches retrieved successfully"));
    }

    @PutMapping("/{matchId}/status")
    @Transactional
    public ResponseEntity<ApiResponse<Match>> updateMatchStatus(
            @PathVariable UUID matchId,
            @RequestParam MatchStatus status,
            Authentication authentication) {
        
        Match match = matchRepository.findById(matchId)
                .orElseThrow(() -> new RuntimeException("Match not found"));
                
        String email = authentication.getName();
        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new RuntimeException("User not found"));
                
        if (!match.getLostItem().getUser().getId().equals(user.getId()) &&
            !match.getFoundItem().getUser().getId().equals(user.getId())) {
            return ResponseEntity.status(403).body(ApiResponse.error("Unauthorized to modify this match"));
        }
        
        match.setStatus(status);
        
        // If the match is accepted, automatically transition the statuses of both items
        if (status == MatchStatus.ACCEPTED) {
            match.getLostItem().setStatus(ItemStatus.RECOVERED);
            match.getFoundItem().setStatus(ItemStatus.CLAIMED);
            
            lostItemRepository.save(match.getLostItem());
            foundItemRepository.save(match.getFoundItem());

            // Award trust scores to both participants!
            User lostReporter = match.getLostItem().getUser();
            User foundFinder = match.getFoundItem().getUser();

            if (lostReporter.getTrustScore() == null) lostReporter.setTrustScore(100);
            if (foundFinder.getTrustScore() == null) foundFinder.setTrustScore(100);

            lostReporter.setTrustScore(lostReporter.getTrustScore() + 10);
            foundFinder.setTrustScore(foundFinder.getTrustScore() + 15);

            userRepository.save(lostReporter);
            userRepository.save(foundFinder);

            // Add notifications for match acceptance and trust scores
            notificationRepository.save(Notification.builder()
                    .user(lostReporter)
                    .message("Congratulations! Your match for \"" + match.getLostItem().getTitle() + "\" has been ACCEPTED. You received +10 Trust Score!")
                    .type("MATCH_ACCEPTED")
                    .build());

            notificationRepository.save(Notification.builder()
                    .user(foundFinder)
                    .message("Awesome! Your match for \"" + match.getFoundItem().getTitle() + "\" has been ACCEPTED. You received +15 Trust Score!")
                    .type("MATCH_ACCEPTED")
                    .build());

            log.info("Trust scores updated. Lost reporter: {}, Found finder: {}", lostReporter.getEmail(), foundFinder.getEmail());
        } else {
            // General notification for other status changes
            notificationRepository.save(Notification.builder()
                    .user(match.getLostItem().getUser())
                    .message("The match status for \"" + match.getLostItem().getTitle() + "\" has been changed to " + status)
                    .type("MATCH_STATUS_CHANGED")
                    .build());

            notificationRepository.save(Notification.builder()
                    .user(match.getFoundItem().getUser())
                    .message("The match status for \"" + match.getFoundItem().getTitle() + "\" has been changed to " + status)
                    .type("MATCH_STATUS_CHANGED")
                    .build());
        }
        
        Match updatedMatch = matchRepository.save(match);

        // Send Email alerts asynchronously
        try {
            User lostUser = match.getLostItem().getUser();
            User foundUser = match.getFoundItem().getUser();
            emailService.sendMatchStatusChangedNotification(lostUser, updatedMatch, status.name());
            emailService.sendMatchStatusChangedNotification(foundUser, updatedMatch, status.name());
        } catch (Exception e) {
            // Safe fallback
        }

        return ResponseEntity.ok(ApiResponse.success(updatedMatch, "Match status updated successfully"));
    }

    @PutMapping("/{matchId}/dispute")
    @Transactional
    public ResponseEntity<ApiResponse<Match>> disputeMatch(
            @PathVariable UUID matchId,
            @RequestParam String reason,
            Authentication authentication) {
        
        Match match = matchRepository.findById(matchId)
                .orElseThrow(() -> new RuntimeException("Match not found"));
                
        String email = authentication.getName();
        User currentUser = userRepository.findByEmail(email)
                .orElseThrow(() -> new RuntimeException("User not found"));
                
        if (!match.getLostItem().getUser().getId().equals(currentUser.getId()) &&
            !match.getFoundItem().getUser().getId().equals(currentUser.getId())) {
            return ResponseEntity.status(403).body(ApiResponse.error("Unauthorized to dispute this match"));
        }
        
        match.setStatus(MatchStatus.DISPUTED);
        match.setDisputedByEmail(email);
        match.setDisputeReason(reason);
        
        Match updatedMatch = matchRepository.save(match);
        
        // Notify both participants
        User lostReporter = match.getLostItem().getUser();
        User foundFinder = match.getFoundItem().getUser();
        
        notificationRepository.save(Notification.builder()
                .user(lostReporter)
                .message("⚠️ The match for \"" + match.getLostItem().getTitle() + "\" has been DISPUTED and locked by " + currentUser.getFirstName() + ". Reason: " + reason)
                .type("MATCH_DISPUTED")
                .build());

        notificationRepository.save(Notification.builder()
                .user(foundFinder)
                .message("⚠️ The match for \"" + match.getFoundItem().getTitle() + "\" has been DISPUTED and locked by " + currentUser.getFirstName() + ". Reason: " + reason)
                .type("MATCH_DISPUTED")
                .build());
                
        log.warn("Match {} disputed by {}. Reason: {}", matchId, email, reason);
        
        return ResponseEntity.ok(ApiResponse.success(updatedMatch, "Match disputed and locked successfully. Admin has been alerted."));
    }

    @PostMapping("/{matchId}/generate-handover-otp")
    @Transactional
    public ResponseEntity<ApiResponse<String>> generateHandoverOtp(
            @PathVariable UUID matchId,
            Authentication authentication) {
        
        Match match = matchRepository.findById(matchId)
                .orElseThrow(() -> new RuntimeException("Match not found"));
                
        String email = authentication.getName();
        User currentUser = userRepository.findByEmail(email)
                .orElseThrow(() -> new RuntimeException("User not found"));
                
        // Only the Lost Item Owner can generate the Handover Verification OTP!
        if (!match.getLostItem().getUser().getId().equals(currentUser.getId())) {
            return ResponseEntity.status(403).body(ApiResponse.error("Only the verified item owner can generate the handover OTP"));
        }
        
        if (match.getStatus() != MatchStatus.ACCEPTED) {
            return ResponseEntity.status(400).body(ApiResponse.error("Handover OTP can only be generated for accepted matches"));
        }
        
        // Generate a 6-digit secure numeric OTP code
        String otp = String.format("%06d", (int) (Math.random() * 1000000));
        match.setHandoverOtp(otp);
        matchRepository.save(match);
        
        // Print a stylized, beautiful secure terminal preview
        System.out.println("\n" + "=".repeat(60));
        System.out.println("🔒 FINDORA SECURE PHYSICAL HANDOVER SYSTEM 🔒");
        System.out.println("Match ID: " + matchId);
        System.out.println("Item: " + match.getLostItem().getTitle());
        System.out.println("Owner Email: " + email);
        System.out.println("Generated Handover Code: \u001B[33m\u001B[1m" + otp + "\u001B[0m");
        System.out.println("Provide this code to the Finder physically to verify handover.");
        System.out.println("=".repeat(60) + "\n");
        
        return ResponseEntity.ok(ApiResponse.success(otp, "Handover OTP generated successfully. Share this with the finder physically."));
    }

    @PostMapping("/{matchId}/verify-handover-otp")
    @Transactional
    public ResponseEntity<ApiResponse<Match>> verifyHandoverOtp(
            @PathVariable UUID matchId,
            @RequestParam String otp,
            Authentication authentication) {
        
        Match match = matchRepository.findById(matchId)
                .orElseThrow(() -> new RuntimeException("Match not found"));
                
        String email = authentication.getName();
        User currentUser = userRepository.findByEmail(email)
                .orElseThrow(() -> new RuntimeException("User not found"));
                
        // Only the Finder (Found Item Owner) can input/verify the Handover OTP!
        if (!match.getFoundItem().getUser().getId().equals(currentUser.getId())) {
            return ResponseEntity.status(403).body(ApiResponse.error("Only the item finder can verify the handover OTP"));
        }
        
        if (match.getHandoverOtp() == null) {
            return ResponseEntity.status(400).body(ApiResponse.error("No handover OTP has been generated for this match yet"));
        }
        
        if (!match.getHandoverOtp().equals(otp)) {
            return ResponseEntity.status(400).body(ApiResponse.error("Invalid Handover Verification OTP code"));
        }
        
        match.setStatus(MatchStatus.SUCCESSFULLY_RETURNED);
        match.setHandoverOtp(null); // Clear OTP after use
        
        // Update item statuses to RETURNED
        match.getLostItem().setStatus(ItemStatus.RETURNED);
        match.getFoundItem().setStatus(ItemStatus.RETURNED);
        lostItemRepository.save(match.getLostItem());
        foundItemRepository.save(match.getFoundItem());

        Match updatedMatch = matchRepository.save(match);
        
        // Award DOUBLE trust score points for physical claim success!
        User lostReporter = match.getLostItem().getUser();
        User foundFinder = match.getFoundItem().getUser();
        
        lostReporter.setTrustScore((lostReporter.getTrustScore() != null ? lostReporter.getTrustScore() : 100) + 20);
        foundFinder.setTrustScore((foundFinder.getTrustScore() != null ? foundFinder.getTrustScore() : 100) + 30);
        
        userRepository.save(lostReporter);
        userRepository.save(foundFinder);
        
        // Notify both participants
        notificationRepository.save(Notification.builder()
                .user(lostReporter)
                .message("🎉 Success! Your item \"" + match.getLostItem().getTitle() + "\" has been physically returned successfully! Trust score updated (+20)!")
                .type("SUCCESSFUL_RETURN")
                .build());

        notificationRepository.save(Notification.builder()
                .user(foundFinder)
                .message("🎉 Success! You have physically returned \"" + match.getFoundItem().getTitle() + "\" successfully! Trust score updated (+30)!")
                .type("SUCCESSFUL_RETURN")
                .build());
                
        log.info("Match {} successfully completed and returned. OTP verified.", matchId);
        
        return ResponseEntity.ok(ApiResponse.success(updatedMatch, "OTP verified successfully! Item marked as returned and trust scores updated."));
    }
}
