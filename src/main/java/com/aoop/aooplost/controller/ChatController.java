package com.aoop.aooplost.controller;

import com.aoop.aooplost.dto.ApiResponse;
import com.aoop.aooplost.entity.ChatMessage;
import com.aoop.aooplost.entity.Match;
import com.aoop.aooplost.entity.User;
import com.aoop.aooplost.repository.ChatMessageRepository;
import com.aoop.aooplost.repository.MatchRepository;
import com.aoop.aooplost.repository.UserRepository;
import lombok.Data;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;
import java.util.List;
import java.util.UUID;
import com.aoop.aooplost.entity.Notification;
import com.aoop.aooplost.repository.NotificationRepository;

@RestController
@RequestMapping("/api/chat")
@RequiredArgsConstructor
public class ChatController {

    private final ChatMessageRepository chatMessageRepository;
    private final MatchRepository matchRepository;
    private final UserRepository userRepository;
    private final NotificationRepository notificationRepository;

    @Data
    public static class MessageRequest {
        private String matchId;
        private String message;
    }

    @PostMapping("/send")
    public ResponseEntity<ApiResponse<ChatMessage>> sendMessage(
            @RequestBody MessageRequest request,
            Authentication authentication) {
        
        UUID matchId = UUID.fromString(request.getMatchId());
        Match match = matchRepository.findById(matchId)
                .orElseThrow(() -> new RuntimeException("Match not found"));

        String email = authentication.getName();
        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new RuntimeException("User not found"));

        // Verify participant
        if (!match.getLostItem().getUser().getId().equals(user.getId()) &&
            !match.getFoundItem().getUser().getId().equals(user.getId())) {
            return ResponseEntity.status(403).body(ApiResponse.error("Unauthorized to chat in this match"));
        }

        ChatMessage message = ChatMessage.builder()
                .matchId(matchId)
                .senderEmail(user.getEmail())
                .senderName(user.getFirstName() + " " + user.getLastName())
                .message(request.getMessage())
                .build();

        ChatMessage saved = chatMessageRepository.save(message);

        // Notify the receiver about the new message
        User receiver = match.getLostItem().getUser().getId().equals(user.getId()) ?
                match.getFoundItem().getUser() :
                match.getLostItem().getUser();

        notificationRepository.save(Notification.builder()
                .user(receiver)
                .message("New message from " + user.getFirstName() + ": \"" + request.getMessage() + "\"")
                .type("NEW_MESSAGE")
                .build());

        return ResponseEntity.ok(ApiResponse.success(saved, "Message sent successfully"));
    }

    @GetMapping("/history/{matchId}")
    public ResponseEntity<ApiResponse<List<ChatMessage>>> getChatHistory(
            @PathVariable UUID matchId,
            Authentication authentication) {

        Match match = matchRepository.findById(matchId)
                .orElseThrow(() -> new RuntimeException("Match not found"));

        String email = authentication.getName();
        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new RuntimeException("User not found"));

        // Verify participant
        if (!match.getLostItem().getUser().getId().equals(user.getId()) &&
            !match.getFoundItem().getUser().getId().equals(user.getId())) {
            return ResponseEntity.status(403).body(ApiResponse.error("Unauthorized to view this chat history"));
        }

        List<ChatMessage> history = chatMessageRepository.findByMatchIdOrderByCreatedAtAsc(matchId);
        return ResponseEntity.ok(ApiResponse.success(history, "Chat history retrieved successfully"));
    }
}
