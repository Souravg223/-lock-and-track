package com.aoop.aooplost.service;

import com.aoop.aooplost.dto.FoundItemRequest;
import com.aoop.aooplost.dto.LostItemRequest;
import com.aoop.aooplost.entity.FoundItem;
import com.aoop.aooplost.entity.LostItem;
import com.aoop.aooplost.entity.User;
import com.aoop.aooplost.entity.enums.ItemStatus;
import com.aoop.aooplost.repository.FoundItemRepository;
import com.aoop.aooplost.repository.LostItemRepository;
import com.aoop.aooplost.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
@RequiredArgsConstructor
public class ItemService {

    private final LostItemRepository lostItemRepository;
    private final FoundItemRepository foundItemRepository;
    private final UserRepository userRepository;
    private final AiMatchingService aiMatchingService;

    @Transactional
    public LostItem reportLostItem(LostItemRequest request, String email) {
        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new RuntimeException("User not found"));

        LostItem lostItem = LostItem.builder()
                .user(user)
                .title(request.getTitle())
                .category(request.getCategory())
                .brand(request.getBrand())
                .color(request.getColor())
                .description(request.getDescription())
                .lastSeenLocation(request.getLastSeenLocation())
                .latitude(request.getLatitude())
                .longitude(request.getLongitude())
                .dateLost(request.getDateLost())
                .rewardAmount(request.getRewardAmount())
                .serialNumber(request.getSerialNumber())
                .status(ItemStatus.LOST)
                .contactPhoneNumber(request.getContactPhoneNumber())
                .facebookProfile(request.getFacebookProfile())
                .recoveryInstructions(request.getRecoveryInstructions())
                .imageUrl(request.getImageUrl())
                .build();

        LostItem savedItem = lostItemRepository.save(lostItem);
        aiMatchingService.triggerMatchingForLostItem(savedItem);
        return savedItem;
    }

    @Transactional
    public FoundItem reportFoundItem(FoundItemRequest request, String email) {
        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new RuntimeException("User not found"));

        FoundItem foundItem = FoundItem.builder()
                .user(user)
                .title(request.getTitle())
                .category(request.getCategory())
                .brand(request.getBrand())
                .color(request.getColor())
                .description(request.getDescription())
                .foundLocation(request.getFoundLocation())
                .latitude(request.getLatitude())
                .longitude(request.getLongitude())
                .dateFound(request.getDateFound())
                .safeStorageInfo(request.getSafeStorageInfo())
                .status(ItemStatus.UNCLAIMED)
                .contactPhoneNumber(request.getContactPhoneNumber())
                .facebookProfile(request.getFacebookProfile())
                .recoveryInstructions(request.getRecoveryInstructions())
                .imageUrl(request.getImageUrl())
                .build();

        FoundItem savedItem = foundItemRepository.save(foundItem);
        aiMatchingService.triggerMatchingForFoundItem(savedItem);
        return savedItem;
    }

    @Transactional(readOnly = true)
    public List<LostItem> getAllLostItems() {
        return lostItemRepository.findAllByOrderByCreatedAtDesc();
    }

    @Transactional(readOnly = true)
    public List<FoundItem> getAllFoundItems() {
        return foundItemRepository.findAllByOrderByCreatedAtDesc();
    }

    @Transactional(readOnly = true)
    public List<LostItem> getActiveLostItems() {
        return lostItemRepository.findByStatusOrderByCreatedAtDesc(ItemStatus.LOST);
    }

    @Transactional(readOnly = true)
    public List<FoundItem> getActiveFoundItems() {
        return foundItemRepository.findByStatusOrderByCreatedAtDesc(ItemStatus.UNCLAIMED);
    }
}
