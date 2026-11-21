package com.funnyshop.service.impl;

import com.funnyshop.dto.request.AdminReviewReplyRequest;
import com.funnyshop.dto.request.ReviewCreateRequest;
import com.funnyshop.dto.request.ReviewUpdateRequest;
import com.funnyshop.dto.response.ProductReviewSummaryResponse;
import com.funnyshop.dto.response.ReviewResponse;
import com.funnyshop.entity.Product;
import com.funnyshop.entity.Review;
import com.funnyshop.entity.User;
import com.funnyshop.exception.AppException;
import com.funnyshop.exception.ResourceNotFoundException;
import com.funnyshop.repository.OrderItemRepository;
import com.funnyshop.repository.ProductRepository;
import com.funnyshop.repository.ReviewRepository;
import com.funnyshop.repository.UserRepository;
import com.funnyshop.service.ReviewService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.LocalDateTime;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

@Service
@RequiredArgsConstructor
@Slf4j
public class ReviewServiceImpl implements ReviewService {

    private final ReviewRepository reviewRepository;
    private final ProductRepository productRepository;
    private final UserRepository userRepository;
    private final OrderItemRepository orderItemRepository;

    @Override
    @Transactional(readOnly = true)
    public ProductReviewSummaryResponse getProductReviewSummary(Long productId) {
        if (!productRepository.existsById(productId)) {
            throw new ResourceNotFoundException("Sản phẩm không tồn tại với ID: " + productId);
        }

        Double rawAvg = reviewRepository.getAverageRatingByProductId(productId);
        double avg = 0.0;
        if (rawAvg != null) {
            avg = BigDecimal.valueOf(rawAvg).setScale(1, RoundingMode.HALF_UP).doubleValue();
        }

        long total = reviewRepository.countByProductId(productId);

        Map<Integer, Long> ratingCounts = new HashMap<>();
        Map<Integer, Double> ratingPercentages = new HashMap<>();

        for (int star = 1; star <= 5; star++) {
            ratingCounts.put(star, 0L);
            ratingPercentages.put(star, 0.0);
        }

        List<Object[]> grouped = reviewRepository.countGroupByRatingByProductId(productId);
        if (grouped != null) {
            for (Object[] row : grouped) {
                if (row != null && row.length >= 2 && row[0] != null && row[1] != null) {
                    int star = ((Number) row[0]).intValue();
                    long count = ((Number) row[1]).longValue();
                    if (star >= 1 && star <= 5) {
                        ratingCounts.put(star, count);
                        if (total > 0) {
                            double pct = BigDecimal.valueOf((count * 100.0) / total)
                                    .setScale(1, RoundingMode.HALF_UP)
                                    .doubleValue();
                            ratingPercentages.put(star, pct);
                        }
                    }
                }
            }
        }

        return ProductReviewSummaryResponse.builder()
                .averageRating(avg)
                .totalReviews(total)
                .ratingCounts(ratingCounts)
                .ratingPercentages(ratingPercentages)
                .build();
    }

    @Override
    @Transactional(readOnly = true)
    public Page<ReviewResponse> getProductReviews(Long productId, Integer ratingFilter, Pageable pageable) {
        if (!productRepository.existsById(productId)) {
            throw new ResourceNotFoundException("Sản phẩm không tồn tại với ID: " + productId);
        }

        Page<Review> page;
        if (ratingFilter != null && ratingFilter >= 1 && ratingFilter <= 5) {
            page = reviewRepository.findByProductIdAndRating(productId, ratingFilter, pageable);
        } else {
            page = reviewRepository.findByProductId(productId, pageable);
        }

        return page.map(ReviewResponse::fromEntity);
    }

    @Override
    @Transactional(readOnly = true)
    public ReviewResponse getMyReviewForProduct(Long userId, Long productId) {
        return reviewRepository.findByProductIdAndUserId(productId, userId)
                .map(ReviewResponse::fromEntity)
                .orElse(null);
    }

    @Override
    @Transactional
    public ReviewResponse createOrUpdateReview(Long userId, Long productId, ReviewCreateRequest request) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new ResourceNotFoundException("Người dùng không tồn tại với ID: " + userId));

        Product product = productRepository.findById(productId)
                .orElseThrow(() -> new ResourceNotFoundException("Sản phẩm không tồn tại với ID: " + productId));

        if (Boolean.TRUE.equals(product.getIsDeleted())) {
            throw new AppException("Không thể đánh giá sản phẩm đã bị xóa hoặc ngừng kinh doanh!", HttpStatus.BAD_REQUEST);
        }

        boolean isVerified = orderItemRepository.existsCompletedPurchaseByUserIdAndProductId(userId, productId);

        Review review = reviewRepository.findByProductIdAndUserId(productId, userId)
                .orElse(null);

        if (review != null) {
            // Update existing review
            review.setRating(request.getRating());
            review.setComment(request.getComment().trim());
            review.setIsVerifiedPurchase(isVerified);
            review.setUpdatedAt(LocalDateTime.now());
        } else {
            // Create new review
            review = Review.builder()
                    .user(user)
                    .product(product)
                    .rating(request.getRating())
                    .comment(request.getComment().trim())
                    .isVerifiedPurchase(isVerified)
                    .build();
        }

        Review saved = reviewRepository.save(review);
        log.info("User {} reviewed product {} with rating {}", userId, productId, request.getRating());
        return ReviewResponse.fromEntity(saved);
    }

    @Override
    @Transactional
    public ReviewResponse updateReview(Long userId, Long reviewId, ReviewUpdateRequest request) {
        Review review = reviewRepository.findById(reviewId)
                .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy đánh giá với ID: " + reviewId));

        if (!review.getUser().getId().equals(userId)) {
            throw new AppException("Bạn không có quyền chỉnh sửa đánh giá này!", HttpStatus.FORBIDDEN);
        }

        review.setRating(request.getRating());
        review.setComment(request.getComment().trim());
        review.setUpdatedAt(LocalDateTime.now());

        Review saved = reviewRepository.save(review);
        return ReviewResponse.fromEntity(saved);
    }

    @Override
    @Transactional
    public void deleteReview(Long userId, Long reviewId, boolean isAdmin) {
        Review review = reviewRepository.findById(reviewId)
                .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy đánh giá với ID: " + reviewId));

        if (!isAdmin && !review.getUser().getId().equals(userId)) {
            throw new AppException("Bạn không có quyền xóa đánh giá này!", HttpStatus.FORBIDDEN);
        }

        reviewRepository.delete(review);
        log.info("Review {} deleted by user {} (isAdmin={})", reviewId, userId, isAdmin);
    }

    @Override
    @Transactional(readOnly = true)
    public Page<ReviewResponse> getAllReviewsForAdmin(Long productId, Integer rating, String keyword, Pageable pageable) {
        String cleanKeyword = (keyword != null && !keyword.isBlank()) ? keyword.trim() : null;
        return reviewRepository.searchReviewsForAdmin(productId, rating, cleanKeyword, pageable)
                .map(ReviewResponse::fromEntity);
    }

    @Override
    @Transactional
    public ReviewResponse replyReview(Long adminId, Long reviewId, AdminReviewReplyRequest request) {
        Review review = reviewRepository.findById(reviewId)
                .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy đánh giá với ID: " + reviewId));

        review.setAdminReply(request.getReply().trim());
        review.setAdminReplyAt(LocalDateTime.now());

        Review saved = reviewRepository.save(review);
        log.info("Admin {} replied to review {}", adminId, reviewId);
        return ReviewResponse.fromEntity(saved);
    }
}

