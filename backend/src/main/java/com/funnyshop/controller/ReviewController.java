package com.funnyshop.controller;

import com.funnyshop.dto.request.ReviewCreateRequest;
import com.funnyshop.dto.request.ReviewUpdateRequest;
import com.funnyshop.dto.response.ApiResponse;
import com.funnyshop.dto.response.ProductReviewSummaryResponse;
import com.funnyshop.dto.response.ReviewResponse;
import com.funnyshop.entity.User;
import com.funnyshop.exception.AppException;
import com.funnyshop.security.JwtTokenProvider;
import com.funnyshop.service.ReviewService;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.*;

@RestController
@RequiredArgsConstructor
public class ReviewController {

    private final ReviewService reviewService;
    private final JwtTokenProvider jwtTokenProvider;

    private Long resolveUserId(HttpServletRequest request) {
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        if (authentication != null && authentication.getPrincipal() instanceof User user) {
            return user.getId();
        }

        String bearerToken = request.getHeader("Authorization");
        if (bearerToken != null && bearerToken.startsWith("Bearer ")) {
            String jwt = bearerToken.substring(7);
            return jwtTokenProvider.getUserIdFromToken(jwt);
        }

        return null;
    }

    private boolean isUserAdmin() {
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        if (authentication != null && authentication.getPrincipal() instanceof User user) {
            return user.getRole() == User.Role.ADMIN;
        }
        return false;
    }

    @GetMapping({"/api/v1/products/{productId}/reviews", "/api/products/{productId}/reviews"})
    public ResponseEntity<ApiResponse<Page<ReviewResponse>>> getProductReviews(
            @PathVariable Long productId,
            @RequestParam(required = false) Integer rating,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size,
            @RequestParam(defaultValue = "createdAt") String sortBy,
            @RequestParam(defaultValue = "desc") String sortDir
    ) {
        Sort sort = sortDir.equalsIgnoreCase("asc") ? Sort.by(sortBy).ascending() : Sort.by(sortBy).descending();
        Pageable pageable = PageRequest.of(page, size, sort);

        Page<ReviewResponse> result = reviewService.getProductReviews(productId, rating, pageable);
        return ResponseEntity.ok(
                ApiResponse.<Page<ReviewResponse>>builder()
                        .code(HttpStatus.OK.value())
                        .message("Lấy danh sách đánh giá sản phẩm thành công!")
                        .data(result)
                        .build()
        );
    }

    @GetMapping({"/api/v1/products/{productId}/reviews/summary", "/api/products/{productId}/reviews/summary"})
    public ResponseEntity<ApiResponse<ProductReviewSummaryResponse>> getProductReviewSummary(
            @PathVariable Long productId
    ) {
        ProductReviewSummaryResponse summary = reviewService.getProductReviewSummary(productId);
        return ResponseEntity.ok(
                ApiResponse.<ProductReviewSummaryResponse>builder()
                        .code(HttpStatus.OK.value())
                        .message("Lấy thống kê đánh giá sản phẩm thành công!")
                        .data(summary)
                        .build()
        );
    }

    @GetMapping({"/api/v1/products/{productId}/reviews/my", "/api/products/{productId}/reviews/my"})
    public ResponseEntity<ApiResponse<ReviewResponse>> getMyReview(
            @PathVariable Long productId,
            HttpServletRequest request
    ) {
        Long userId = resolveUserId(request);
        if (userId == null) {
            throw new AppException("Vui lòng đăng nhập để kiểm tra đánh giá của bạn!", HttpStatus.UNAUTHORIZED);
        }

        ReviewResponse response = reviewService.getMyReviewForProduct(userId, productId);
        return ResponseEntity.ok(
                ApiResponse.<ReviewResponse>builder()
                        .code(HttpStatus.OK.value())
                        .message(response != null ? "Đã tìm thấy đánh giá của bạn!" : "Bạn chưa đánh giá sản phẩm này.")
                        .data(response)
                        .build()
        );
    }

    @PostMapping({"/api/v1/products/{productId}/reviews", "/api/products/{productId}/reviews"})
    public ResponseEntity<ApiResponse<ReviewResponse>> createReview(
            @PathVariable Long productId,
            @Valid @RequestBody ReviewCreateRequest requestBody,
            HttpServletRequest request
    ) {
        Long userId = resolveUserId(request);
        if (userId == null) {
            throw new AppException("Vui lòng đăng nhập để gửi đánh giá sản phẩm!", HttpStatus.UNAUTHORIZED);
        }

        ReviewResponse response = reviewService.createOrUpdateReview(userId, productId, requestBody);
        return ResponseEntity.status(HttpStatus.CREATED).body(
                ApiResponse.<ReviewResponse>builder()
                        .code(HttpStatus.CREATED.value())
                        .message("Gửi đánh giá sản phẩm thành công! Cảm ơn bạn đã phản hồi.")
                        .data(response)
                        .build()
        );
    }

    @PutMapping({"/api/v1/reviews/{id}", "/api/reviews/{id}"})
    public ResponseEntity<ApiResponse<ReviewResponse>> updateReview(
            @PathVariable Long id,
            @Valid @RequestBody ReviewUpdateRequest requestBody,
            HttpServletRequest request
    ) {
        Long userId = resolveUserId(request);
        if (userId == null) {
            throw new AppException("Vui lòng đăng nhập để chỉnh sửa đánh giá!", HttpStatus.UNAUTHORIZED);
        }

        ReviewResponse response = reviewService.updateReview(userId, id, requestBody);
        return ResponseEntity.ok(
                ApiResponse.<ReviewResponse>builder()
                        .code(HttpStatus.OK.value())
                        .message("Cập nhật đánh giá thành công!")
                        .data(response)
                        .build()
        );
    }

    @DeleteMapping({"/api/v1/reviews/{id}", "/api/reviews/{id}"})
    public ResponseEntity<ApiResponse<Void>> deleteReview(
            @PathVariable Long id,
            HttpServletRequest request
    ) {
        Long userId = resolveUserId(request);
        if (userId == null) {
            throw new AppException("Vui lòng đăng nhập để thực hiện thao tác này!", HttpStatus.UNAUTHORIZED);
        }

        boolean isAdmin = isUserAdmin();
        reviewService.deleteReview(userId, id, isAdmin);

        return ResponseEntity.ok(
                ApiResponse.<Void>builder()
                        .code(HttpStatus.OK.value())
                        .message("Đã xóa đánh giá thành công!")
                        .build()
        );
    }
}

