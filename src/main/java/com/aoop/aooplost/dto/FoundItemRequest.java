package com.aoop.aooplost.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.Data;

import java.time.LocalDateTime;

@Data
public class FoundItemRequest {
    @NotBlank
    private String title;

    @NotBlank
    private String category;

    private String brand;
    private String color;
    private String description;
    private String foundLocation;
    private Double latitude;
    private Double longitude;

    @NotNull
    private LocalDateTime dateFound;

    private String safeStorageInfo;

    private String contactPhoneNumber;
    private String facebookProfile;
    private String recoveryInstructions;
    private String imageUrl;
}
