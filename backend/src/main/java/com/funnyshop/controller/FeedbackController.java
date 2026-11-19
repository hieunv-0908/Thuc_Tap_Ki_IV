package com.funnyshop.controller;

import com.funnyshop.dto.request.FeedbackCreateRequest;
import com.funnyshop.dto.response.ApiResponse;
import com.funnyshop.dto.response.FeedbackResponse;
import com.funnyshop.entity.User;
import com.funnyshop.enums.FeedbackStatus;
import com.funnyshop.exception.AppException;
import com.funnyshop.security.JwtTokenProvider;
import com.funnyshop.service.FeedbackService;
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
@RequestMapping({"/api/v1/feedbacks", "/api/feedbacks"})
@RequiredArgsConstructor
public class FeedbackController {

    private final FeedbackService feedbackService;
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

    @PostMapping
    public ResponseEntity<ApiResponse<FeedbackResponse>> createFeedback(
            @Valid @RequestBody FeedbackCreateRequest requestBody,
            HttpServletRequest request
    ) {
        Long userId = resolveUserId(request);
        if (userId == null) {
            throw new AppException("Vui lòng đăng nhập để gửi góp ý!", HttpStatus.UNAUTHORIZED);
        }

        FeedbackResponse response = feedbackService.createFeedback(userId, requestBody);
        return ResponseEntity.status(HttpStatus.CREATED).body(
                ApiResponse.<FeedbackResponse>builder()
                        .code(HttpStatus.CREATED.value())
                        .message("Gửi phản hồi thành công! Cảm ơn bạn đã đóng góp ý kiến.")
                        .data(response)
                        .build()
        );
    }

    @GetMapping("/my")
    public ResponseEntity<ApiResponse<Page<FeedbackResponse>>> getMyFeedbacks(
            @RequestParam(required = false) FeedbackStatus status,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size,
            @RequestParam(defaultValue = "createdAt") String sortBy,
            @RequestParam(defaultValue = "desc") String sortDir,
            HttpServletRequest request
    ) {
        Long userId = resolveUserId(request);
        if (userId == null) {
            throw new AppException("Vui lòng đăng nhập để xem danh sách phản hồi!", HttpStatus.UNAUTHORIZED);
        }

        Sort sort = sortDir.equalsIgnoreCase("asc") ? Sort.by(sortBy).ascending() : Sort.by(sortBy).descending();
        Pageable pageable = PageRequest.of(page, size, sort);

        Page<FeedbackResponse> result = feedbackService.getMyFeedbacks(userId, status, pageable);
        return ResponseEntity.ok(
                ApiResponse.<Page<FeedbackResponse>>builder()
                        .code(HttpStatus.OK.value())
                        .message("Lấy danh sách phản hồi của bạn thành công!")
                        .data(result)
                        .build()
        );
    }

    @GetMapping("/{id}")
    public ResponseEntity<ApiResponse<FeedbackResponse>> getMyFeedbackDetail(
            @PathVariable Long id,
            HttpServletRequest request
    ) {
        Long userId = resolveUserId(request);
        if (userId == null) {
            throw new AppException("Vui lòng đăng nhập để xem chi tiết phản hồi!", HttpStatus.UNAUTHORIZED);
        }

        FeedbackResponse response = feedbackService.getMyFeedbackDetail(userId, id);
        return ResponseEntity.ok(
                ApiResponse.<FeedbackResponse>builder()
                        .code(HttpStatus.OK.value())
                        .message("Lấy chi tiết phản hồi thành công!")
                        .data(response)
                        .build()
        );
    }
}

