package com.funnyshop.dto.response;

import com.fasterxml.jackson.annotation.JsonInclude;
import com.funnyshop.entity.Review;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
@JsonInclude(JsonInclude.Include.NON_NULL)
public class ReviewResponse {

    private Long id;
    private Long productId;
    private String productName;
    private String productImageUrl;
    private Long userId;
    private String userName;
    private String userEmail;
    private Integer rating;
    private String comment;
    private List<String> images;
    private Boolean isVerifiedPurchase;
    private Integer helpfulCount;
    private Boolean isHelpfulByCurrentUser;
    private String adminReply;
    private LocalDateTime adminReplyAt;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;

    public static ReviewResponse fromEntity(Review review) {
        return fromEntity(review, false);
    }

    public static ReviewResponse fromEntity(Review review, boolean isHelpfulByCurrentUser) {
        if (review == null) {
            return null;
        }

        String displayName = "Khách hàng";
        if (review.getUser() != null) {
            if (review.getUser().getFullName() != null && !review.getUser().getFullName().isBlank()) {
                displayName = review.getUser().getFullName();
            } else if (review.getUser().getUsername() != null && !review.getUser().getUsername().isBlank()) {
                displayName = review.getUser().getUsername();
            }
        }

        String primaryImg = null;
        String prodName = null;
        Long prodId = null;
        if (review.getProduct() != null) {
            prodId = review.getProduct().getId();
            prodName = review.getProduct().getName();
            primaryImg = review.getProduct().getImageUrl();
        }

        return ReviewResponse.builder()
                .id(review.getId())
                .productId(prodId)
                .productName(prodName)
                .productImageUrl(primaryImg)
                .userId(review.getUser() != null ? review.getUser().getId() : null)
                .userName(displayName)
                .userEmail(review.getUser() != null ? maskEmail(review.getUser().getEmail()) : null)
                .rating(review.getRating())
                .comment(review.getComment())
                .images(review.getImages() != null ? new ArrayList<>(review.getImages()) : new ArrayList<>())
                .isVerifiedPurchase(review.getIsVerifiedPurchase())
                .helpfulCount(review.getHelpfulCount() != null ? review.getHelpfulCount() : 0)
                .isHelpfulByCurrentUser(isHelpfulByCurrentUser)
                .adminReply(review.getAdminReply())
                .adminReplyAt(review.getAdminReplyAt())
                .createdAt(review.getCreatedAt())
                .updatedAt(review.getUpdatedAt())
                .build();
    }

    private static String maskEmail(String email) {
        if (email == null || !email.contains("@")) return email;
        int atIndex = email.indexOf("@");
        if (atIndex <= 2) return email;
        return email.charAt(0) + "***" + email.substring(atIndex - 1);
    }
}
