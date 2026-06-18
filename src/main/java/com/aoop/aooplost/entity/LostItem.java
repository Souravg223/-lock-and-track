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

import java.math.BigDecimal;
import java.time.LocalDateTime;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
@Entity
@Table(name = "lost_items")
@JsonIgnoreProperties({"hibernateLazyInitializer", "handler"})
public class LostItem extends BaseEntity {

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

    @Column(name = "last_seen_location")
    private String lastSeenLocation;

    private Double latitude;
    private Double longitude;

    @Column(name = "date_lost", nullable = false)
    private LocalDateTime dateLost;

    @Column(name = "reward_amount")
    @Builder.Default
    private BigDecimal rewardAmount = BigDecimal.ZERO;

    @Column(name = "serial_number")
    private String serialNumber;

    @Enumerated(EnumType.STRING)
    @Builder.Default
    private ItemStatus status = ItemStatus.LOST;

    @Column(name = "contact_phone_number")
    private String contactPhoneNumber;

    @Column(name = "facebook_profile")
    private String facebookProfile;

    @Column(name = "recovery_instructions", columnDefinition = "TEXT")
    private String recoveryInstructions;

    @Column(name = "image_url", columnDefinition = "TEXT")
    private String imageUrl;
}
