package com.aoop.aooplost.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class AdminStatsDto {
    private long totalLostItems;
    private long totalFoundItems;
    private long totalMatches;
    private long totalUsers;
}
