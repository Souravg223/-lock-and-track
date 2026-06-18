package com.aoop.aooplost.controller;

import com.aoop.aooplost.dto.ApiResponse;
import com.aoop.aooplost.dto.FoundItemRequest;
import com.aoop.aooplost.dto.LostItemRequest;
import com.aoop.aooplost.entity.FoundItem;
import com.aoop.aooplost.entity.LostItem;
import com.aoop.aooplost.service.ItemService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.bind.annotation.RequestParam;

import java.util.List;

@RestController
@RequestMapping("/api/items")
@RequiredArgsConstructor
public class ItemController {

    private final ItemService itemService;

    @PostMapping("/lost")
    public ResponseEntity<ApiResponse<LostItem>> reportLostItem(
            @Valid @RequestBody LostItemRequest request,
            Authentication authentication) {

        String email = authentication.getName();
        LostItem lostItem = itemService.reportLostItem(request, email);
        return ResponseEntity.ok(ApiResponse.success(lostItem, "Lost item reported successfully"));
    }

    @PostMapping("/found")
    public ResponseEntity<ApiResponse<FoundItem>> reportFoundItem(
            @Valid @RequestBody FoundItemRequest request,
            Authentication authentication) {

        String email = authentication.getName();
        FoundItem foundItem = itemService.reportFoundItem(request, email);
        return ResponseEntity.ok(ApiResponse.success(foundItem, "Found item reported successfully"));
    }

    @GetMapping("/lost")
    public ResponseEntity<ApiResponse<List<LostItem>>> getAllLostItems(@RequestParam(required = false) Boolean all) {
        List<LostItem> items = (all != null && all) ? itemService.getAllLostItems() : itemService.getActiveLostItems();
        return ResponseEntity.ok(ApiResponse.success(items, "Lost items retrieved successfully"));
    }

    @GetMapping("/found")
    public ResponseEntity<ApiResponse<List<FoundItem>>> getAllFoundItems(@RequestParam(required = false) Boolean all) {
        List<FoundItem> items = (all != null && all) ? itemService.getAllFoundItems() : itemService.getActiveFoundItems();
        return ResponseEntity.ok(ApiResponse.success(items, "Found items retrieved successfully"));
    }
}
