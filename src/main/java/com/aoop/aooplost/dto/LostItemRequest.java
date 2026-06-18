package com.aoop.aooplost.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.Data;

import java.math.BigDecimal;
import java.time.LocalDateTime;

@Data
public class LostItemRequest {
    @NotBlank
    private String title;

    @NotBlank
    private String category;

    private String brand;
    private String color;
    private String description;
    private String lastSeenLocation;
    private Double latitude;
    private Double longitude;

    @NotNull
    private LocalDateTime dateLost;

    private BigDecimal rewardAmount;
    private String serialNumber;

    private String contactPhoneNumber;
    private String facebookProfile;
    private String recoveryInstructions;
    private String imageUrl;
}
