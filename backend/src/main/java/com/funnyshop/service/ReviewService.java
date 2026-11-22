package com.funnyshop.service;

import com.funnyshop.dto.request.AdminReviewReplyRequest;
import com.funnyshop.dto.request.ReviewCreateRequest;
import com.funnyshop.dto.request.ReviewUpdateRequest;
import com.funnyshop.dto.response.ProductReviewSummaryResponse;
import com.funnyshop.dto.response.ReviewHelpfulResponse;
import com.funnyshop.dto.response.ReviewResponse;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.web.multipart.MultipartFile;

import java.util.List;

public interface ReviewService {

    ProductReviewSummaryResponse getProductReviewSummary(Long productId);

    Page<ReviewResponse> getProductReviews(Long productId, Integer ratingFilter, Long currentUserId, Pageable pageable);

    ReviewResponse getMyReviewForProduct(Long userId, Long productId);

    ReviewResponse createOrUpdateReview(Long userId, Long productId, ReviewCreateRequest request);

    ReviewResponse updateReview(Long userId, Long reviewId, ReviewUpdateRequest request);

    void deleteReview(Long userId, Long reviewId, boolean isAdmin);

    Page<ReviewResponse> getAllReviewsForAdmin(Long productId, Integer rating, String keyword, Pageable pageable);

    ReviewResponse replyReview(Long adminId, Long reviewId, AdminReviewReplyRequest request);

    ReviewHelpfulResponse toggleHelpfulVote(Long userId, Long reviewId);

    List<String> uploadReviewImages(List<MultipartFile> files);
}
