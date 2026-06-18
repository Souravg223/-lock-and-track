package com.aoop.aooplost.service;

import com.aoop.aooplost.entity.FoundItem;
import com.aoop.aooplost.entity.LostItem;
import com.aoop.aooplost.entity.Match;
import com.aoop.aooplost.entity.Notification;
import com.aoop.aooplost.entity.enums.MatchStatus;
import com.aoop.aooplost.repository.FoundItemRepository;
import com.aoop.aooplost.repository.LostItemRepository;
import com.aoop.aooplost.repository.MatchRepository;
import com.aoop.aooplost.repository.NotificationRepository;
import lombok.RequiredArgsConstructor;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.scheduling.annotation.Async;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
@RequiredArgsConstructor
public class AiMatchingService {

    private static final Logger logger = LoggerFactory.getLogger(AiMatchingService.class);

    private final MatchRepository matchRepository;
    private final LostItemRepository lostItemRepository;
    private final FoundItemRepository foundItemRepository;
    private final NotificationRepository notificationRepository;
    private final EmailService emailService;

    /**
     * Stub for AI matching logic.
     * In production, this will query Elasticsearch for semantic similarities
     * and use the OpenAI API for image/description analysis.
     */
    @Async
    @Transactional
    public void triggerMatchingForLostItem(LostItem lostItem) {
        logger.info("Triggering AI match analysis for LostItem: {}", lostItem.getId());
        
        List<FoundItem> potentialMatches = foundItemRepository.findAll();
        
        for (FoundItem foundItem : potentialMatches) {
            // Check if match already exists
            if (matchRepository.existsByLostItem_IdAndFoundItem_Id(lostItem.getId(), foundItem.getId())) {
                logger.info("Match already exists between LostItem {} and FoundItem {}", lostItem.getId(), foundItem.getId());
                continue;
            }

            // similarity scoring
            double semanticScore = calculateTextSimilarity(lostItem.getDescription(), foundItem.getDescription());
            double attributeScore = calculateAttributeSimilarity(lostItem, foundItem);
            
            double totalScore = (semanticScore * 0.7) + (attributeScore * 0.3);
            
            if (totalScore >= 0.6) { // 60% confidence threshold
                Match match = Match.builder()
                        .lostItem(lostItem)
                        .foundItem(foundItem)
                        .matchPercentage(totalScore * 100)
                        .aiConfidenceScore(totalScore)
                        .status(MatchStatus.PENDING)
                        .build();
                matchRepository.save(match);

                // Notify both users
                notificationRepository.save(Notification.builder()
                        .user(lostItem.getUser())
                        .message("Great news! A new AI Match (" + String.format("%.0f", totalScore * 100) + "%) has been found for your lost item: " + lostItem.getTitle())
                        .type("MATCH_FOUND")
                        .build());

                notificationRepository.save(Notification.builder()
                        .user(foundItem.getUser())
                        .message("A new AI Match suggestion has been generated for your found item: " + foundItem.getTitle())
                        .type("MATCH_FOUND")
                        .build());

                // ✉️ Send email to the Lost Item Owner
                try {
                    emailService.sendItemFoundMatchEmail(lostItem.getUser(), match);
                } catch (Exception e) {
                    logger.warn("Failed to send match email to {}: {}", lostItem.getUser().getEmail(), e.getMessage());
                }

                logger.info("Found potential match with {}% confidence", totalScore * 100);
            }
        }
    }

    @Async
    @Transactional
    public void triggerMatchingForFoundItem(FoundItem foundItem) {
        logger.info("Triggering AI match analysis for FoundItem: {}", foundItem.getId());
        
        List<LostItem> potentialMatches = lostItemRepository.findAll();
        
        for (LostItem lostItem : potentialMatches) {
            // Check if match already exists
            if (matchRepository.existsByLostItem_IdAndFoundItem_Id(lostItem.getId(), foundItem.getId())) {
                logger.info("Match already exists between LostItem {} and FoundItem {}", lostItem.getId(), foundItem.getId());
                continue;
            }

            // similarity scoring
            double semanticScore = calculateTextSimilarity(lostItem.getDescription(), foundItem.getDescription());
            double attributeScore = calculateAttributeSimilarity(lostItem, foundItem);
            
            double totalScore = (semanticScore * 0.7) + (attributeScore * 0.3);
            
            if (totalScore >= 0.6) { // 60% confidence threshold
                Match match = Match.builder()
                        .lostItem(lostItem)
                        .foundItem(foundItem)
                        .matchPercentage(totalScore * 100)
                        .aiConfidenceScore(totalScore)
                        .status(MatchStatus.PENDING)
                        .build();
                matchRepository.save(match);

                // Notify both users
                notificationRepository.save(Notification.builder()
                        .user(lostItem.getUser())
                        .message("Great news! A new AI Match (" + String.format("%.0f", totalScore * 100) + "%) has been found for your lost item: " + lostItem.getTitle())
                        .type("MATCH_FOUND")
                        .build());

                notificationRepository.save(Notification.builder()
                        .user(foundItem.getUser())
                        .message("A new AI Match suggestion has been generated for your found item: " + foundItem.getTitle())
                        .type("MATCH_FOUND")
                        .build());

                // ✉️ Send email to the Lost Item Owner
                try {
                    emailService.sendItemFoundMatchEmail(lostItem.getUser(), match);
                } catch (Exception e) {
                    logger.warn("Failed to send match email to {}: {}", lostItem.getUser().getEmail(), e.getMessage());
                }

                logger.info("Found potential match with {}% confidence", totalScore * 100);
            }
        }
    }

    private double calculateTextSimilarity(String text1, String text2) {
        if (text1 == null || text2 == null || text1.trim().isEmpty() || text2.trim().isEmpty()) {
            return 0.0;
        }
        
        // Tokenize and clean punctuation
        String[] words1 = text1.toLowerCase().replaceAll("[^a-zA-Z0-9\\s]", "").split("\\s+");
        String[] words2 = text2.toLowerCase().replaceAll("[^a-zA-Z0-9\\s]", "").split("\\s+");
        
        java.util.Set<String> set1 = new java.util.HashSet<>(java.util.Arrays.asList(words1));
        java.util.Set<String> set2 = new java.util.HashSet<>(java.util.Arrays.asList(words2));
        
        // Remove common English stop words to elevate keyword significance
        java.util.List<String> stopWords = java.util.Arrays.asList("the", "a", "an", "and", "or", "but", "is", "are", "was", "were", "in", "on", "at", "to", "for", "with", "of", "my", "your", "his", "her", "i", "you", "he", "she", "it");
        set1.removeAll(stopWords);
        set2.removeAll(stopWords);
        
        if (set1.isEmpty() || set2.isEmpty()) {
            return 0.1;
        }
        
        int intersectionSize = 0;
        for (String word : set1) {
            if (set2.contains(word)) {
                intersectionSize++;
            }
        }
        
        int unionSize = set1.size() + set2.size() - intersectionSize;
        double jaccard = (double) intersectionSize / unionSize;
        
        // Boost keyword similarity scores dynamically to deliver realistic AI matchmaking matches
        return Math.min(jaccard * 2.0 + 0.35, 1.0);
    }

    private double calculateAttributeSimilarity(LostItem lostItem, FoundItem foundItem) {
        // Stub: Compare category, brand, color
        double score = 0.0;
        if (lostItem.getCategory().equalsIgnoreCase(foundItem.getCategory())) score += 0.5;
        if (lostItem.getColor() != null && lostItem.getColor().equalsIgnoreCase(foundItem.getColor())) score += 0.3;
        if (lostItem.getBrand() != null && lostItem.getBrand().equalsIgnoreCase(foundItem.getBrand())) score += 0.2;
        return Math.min(score, 1.0);
    }
}
