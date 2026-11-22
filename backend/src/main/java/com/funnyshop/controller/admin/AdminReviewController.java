package com.funnyshop.controller.admin;

import com.funnyshop.dto.request.AdminReviewReplyRequest;
import com.funnyshop.dto.response.ApiResponse;
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
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping({"/api/v1/admin/reviews", "/api/admin/reviews"})
@RequiredArgsConstructor
@PreAuthorize("hasRole('ADMIN')")
public class AdminReviewController {

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

    @GetMapping
    public ResponseEntity<ApiResponse<Page<ReviewResponse>>> getAllReviews(
            @RequestParam(required = false) Long productId,
            @RequestParam(required = false) Integer rating,
            @RequestParam(required = false) String keyword,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size,
            @RequestParam(defaultValue = "createdAt") String sortBy,
            @RequestParam(defaultValue = "desc") String sortDir
    ) {
        Sort sort = sortDir.equalsIgnoreCase("asc") ? Sort.by(sortBy).ascending() : Sort.by(sortBy).descending();
        Pageable pageable = PageRequest.of(page, size, sort);

        Page<ReviewResponse> result = reviewService.getAllReviewsForAdmin(productId, rating, keyword, pageable);
        return ResponseEntity.ok(
                ApiResponse.<Page<ReviewResponse>>builder()
                        .code(HttpStatus.OK.value())
                        .message("Lấy danh sách đánh giá thành công!")
                        .data(result)
                        .build()
        );
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<ApiResponse<Void>> deleteReview(
            @PathVariable Long id,
            HttpServletRequest request
    ) {
        Long adminId = resolveUserId(request);
        if (adminId == null) {
            throw new AppException("Vui lòng đăng nhập với quyền Admin!", HttpStatus.UNAUTHORIZED);
        }

        reviewService.deleteReview(adminId, id, true);
        return ResponseEntity.ok(
                ApiResponse.<Void>builder()
                        .code(HttpStatus.OK.value())
                        .message("Admin đã xóa đánh giá thành công!")
                        .build()
        );
    }

    @PostMapping("/{id}/reply")
    public ResponseEntity<ApiResponse<ReviewResponse>> replyReview(
            @PathVariable Long id,
            @Valid @RequestBody AdminReviewReplyRequest requestBody,
            HttpServletRequest request
    ) {
        Long adminId = resolveUserId(request);
        if (adminId == null) {
            throw new AppException("Vui lòng đăng nhập với quyền Admin!", HttpStatus.UNAUTHORIZED);
        }

        ReviewResponse response = reviewService.replyReview(adminId, id, requestBody);
        return ResponseEntity.ok(
                ApiResponse.<ReviewResponse>builder()
                        .code(HttpStatus.OK.value())
                        .message("Đã gửi phản hồi đánh giá thành công!")
                        .data(response)
                        .build()
        );
    }
}

