package com.aoop.aooplost.entity;

import com.aoop.aooplost.entity.enums.ItemStatus;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.FetchType;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.Table;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.time.LocalDateTime;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
@Entity
@Table(name = "found_items")
@JsonIgnoreProperties({"hibernateLazyInitializer", "handler"})
public class FoundItem extends BaseEntity {

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id", nullable = false)
    private User user;

    @Column(nullable = false)
    private String title;

    @Column(nullable = false)
    private String category;

    private String brand;
    private String color;

    @Column(columnDefinition = "TEXT")
    private String description;

    @Column(name = "found_location")
    private String foundLocation;

    private Double latitude;
    private Double longitude;

    @Column(name = "date_found", nullable = false)
    private LocalDateTime dateFound;

    @Column(name = "safe_storage_info", columnDefinition = "TEXT")
    private String safeStorageInfo;

    @Enumerated(EnumType.STRING)
    @Builder.Default
    private ItemStatus status = ItemStatus.UNCLAIMED;

    @Column(name = "contact_phone_number")
    private String contactPhoneNumber;

    @Column(name = "facebook_profile")
    private String facebookProfile;

    @Column(name = "recovery_instructions", columnDefinition = "TEXT")
    private String recoveryInstructions;

    @Column(name = "image_url", columnDefinition = "TEXT")
    private String imageUrl;
}
