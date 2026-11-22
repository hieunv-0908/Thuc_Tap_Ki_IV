package com.funnyshop.service.impl;

import com.cloudinary.Cloudinary;
import com.cloudinary.utils.ObjectUtils;
import com.funnyshop.dto.request.AdminReviewReplyRequest;
import com.funnyshop.dto.request.ReviewCreateRequest;
import com.funnyshop.dto.request.ReviewUpdateRequest;
import com.funnyshop.dto.response.ProductReviewSummaryResponse;
import com.funnyshop.dto.response.ReviewHelpfulResponse;
import com.funnyshop.dto.response.ReviewResponse;
import com.funnyshop.entity.Product;
import com.funnyshop.entity.Review;
import com.funnyshop.entity.ReviewHelpfulVote;
import com.funnyshop.entity.User;
import com.funnyshop.exception.AppException;
import com.funnyshop.exception.ResourceNotFoundException;
import com.funnyshop.repository.OrderItemRepository;
import com.funnyshop.repository.ProductRepository;
import com.funnyshop.repository.ReviewHelpfulVoteRepository;
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
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.LocalDateTime;
import java.util.*;

@Service
@RequiredArgsConstructor
@Slf4j
public class ReviewServiceImpl implements ReviewService {

    private final ReviewRepository reviewRepository;
    private final ProductRepository productRepository;
    private final UserRepository userRepository;
    private final OrderItemRepository orderItemRepository;
    private final ReviewHelpfulVoteRepository reviewHelpfulVoteRepository;
    private final Cloudinary cloudinary;

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
    public Page<ReviewResponse> getProductReviews(Long productId, Integer ratingFilter, Long currentUserId, Pageable pageable) {
        if (!productRepository.existsById(productId)) {
            throw new ResourceNotFoundException("Sản phẩm không tồn tại với ID: " + productId);
        }

        Page<Review> page;
        if (ratingFilter != null && ratingFilter >= 1 && ratingFilter <= 5) {
            page = reviewRepository.findByProductIdAndRating(productId, ratingFilter, pageable);
        } else {
            page = reviewRepository.findByProductId(productId, pageable);
        }

        Set<Long> votedSet = new HashSet<>();
        if (currentUserId != null && !page.isEmpty()) {
            List<Long> reviewIds = page.getContent().stream().map(Review::getId).toList();
            votedSet.addAll(reviewHelpfulVoteRepository.findVotedReviewIdsByUserIdAndReviewIds(currentUserId, reviewIds));
        }

        return page.map(rev -> ReviewResponse.fromEntity(rev, votedSet.contains(rev.getId())));
    }

    @Override
    @Transactional(readOnly = true)
    public ReviewResponse getMyReviewForProduct(Long userId, Long productId) {
        return reviewRepository.findByProductIdAndUserId(productId, userId)
                .map(rev -> ReviewResponse.fromEntity(rev, false))
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

        List<String> images = request.getImages() != null ? new ArrayList<>(request.getImages()) : new ArrayList<>();

        if (review != null) {
            // Update existing review
            review.setRating(request.getRating());
            review.setComment(request.getComment().trim());
            review.setImages(images);
            review.setIsVerifiedPurchase(isVerified);
            review.setUpdatedAt(LocalDateTime.now());
        } else {
            // Create new review
            review = Review.builder()
                    .user(user)
                    .product(product)
                    .rating(request.getRating())
                    .comment(request.getComment().trim())
                    .images(images)
                    .isVerifiedPurchase(isVerified)
                    .helpfulCount(0)
                    .build();
        }

        Review saved = reviewRepository.save(review);
        log.info("User {} reviewed product {} with rating {} and {} images", userId, productId, request.getRating(), images.size());
        return ReviewResponse.fromEntity(saved, false);
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
        if (request.getImages() != null) {
            review.setImages(new ArrayList<>(request.getImages()));
        }
        review.setUpdatedAt(LocalDateTime.now());

        Review saved = reviewRepository.save(review);
        boolean isVoted = reviewHelpfulVoteRepository.existsByReviewIdAndUserId(reviewId, userId);
        return ReviewResponse.fromEntity(saved, isVoted);
    }

    @Override
    @Transactional
    public void deleteReview(Long userId, Long reviewId, boolean isAdmin) {
        Review review = reviewRepository.findById(reviewId)
                .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy đánh giá với ID: " + reviewId));

        if (!isAdmin && !review.getUser().getId().equals(userId)) {
            throw new AppException("Bạn không có quyền xóa đánh giá này!", HttpStatus.FORBIDDEN);
        }

        reviewHelpfulVoteRepository.deleteByReviewId(reviewId);
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

    @Override
    @Transactional
    public ReviewHelpfulResponse toggleHelpfulVote(Long userId, Long reviewId) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new ResourceNotFoundException("Người dùng không tồn tại với ID: " + userId));

        Review review = reviewRepository.findById(reviewId)
                .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy đánh giá với ID: " + reviewId));

        Optional<ReviewHelpfulVote> existingVote = reviewHelpfulVoteRepository.findByReviewIdAndUserId(reviewId, userId);

        boolean isHelpful;
        int currentCount = review.getHelpfulCount() != null ? review.getHelpfulCount() : 0;

        if (existingVote.isPresent()) {
            // Đã vote -> Bỏ vote
            reviewHelpfulVoteRepository.delete(existingVote.get());
            currentCount = Math.max(0, currentCount - 1);
            isHelpful = false;
        } else {
            // Chưa vote -> Thêm vote
            ReviewHelpfulVote vote = ReviewHelpfulVote.builder()
                    .user(user)
                    .review(review)
                    .build();
            reviewHelpfulVoteRepository.save(vote);
            currentCount += 1;
            isHelpful = true;
        }

        review.setHelpfulCount(currentCount);
        reviewRepository.save(review);

        return ReviewHelpfulResponse.builder()
                .reviewId(reviewId)
                .helpfulCount(currentCount)
                .isHelpful(isHelpful)
                .build();
    }

    @Override
    public List<String> uploadReviewImages(List<MultipartFile> files) {
        if (files == null || files.isEmpty()) {
            return Collections.emptyList();
        }

        if (files.size() > 3) {
            throw new AppException("Chỉ được tải lên tối đa 3 hình ảnh cho mỗi đánh giá!", HttpStatus.BAD_REQUEST);
        }

        List<String> imageUrls = new ArrayList<>();
        for (MultipartFile file : files) {
            if (file == null || file.isEmpty()) continue;
            try {
                Map<?, ?> uploadResult = cloudinary.uploader().upload(file.getBytes(),
                        ObjectUtils.asMap(
                                "folder", "funnyshop/reviews",
                                "resource_type", "image",
                                "quality", "auto:good",
                                "fetch_format", "auto"
                        ));
                String url = (String) uploadResult.get("secure_url");
                if (url != null) {
                    imageUrls.add(url);
                }
            } catch (IOException e) {
                log.error("Lỗi khi upload ảnh đánh giá: {}", e.getMessage());
                throw new AppException("Upload ảnh thất bại: " + e.getMessage(), HttpStatus.INTERNAL_SERVER_ERROR);
            }
        }
        return imageUrls;
    }
}
