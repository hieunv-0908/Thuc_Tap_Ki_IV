package com.funnyshop.dto.response;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.Map;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ProductReviewSummaryResponse {

    private Double averageRating;
    private Long totalReviews;
    private Map<Integer, Long> ratingCounts;
    private Map<Integer, Double> ratingPercentages;
}

