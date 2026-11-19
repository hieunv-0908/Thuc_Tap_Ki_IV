package com.funnyshop.controller.admin;

import com.funnyshop.dto.request.FeedbackReplyRequest;
import com.funnyshop.dto.request.FeedbackStatusUpdateRequest;
import com.funnyshop.dto.response.ApiResponse;
import com.funnyshop.dto.response.FeedbackResponse;
import com.funnyshop.entity.User;
import com.funnyshop.enums.FeedbackStatus;
import com.funnyshop.enums.FeedbackType;
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
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
@RequestMapping({"/api/v1/admin/feedbacks", "/api/admin/feedbacks"})
@RequiredArgsConstructor
@PreAuthorize("hasRole('ADMIN')")
public class AdminFeedbackController {

    private final FeedbackService feedbackService;
    private final JwtTokenProvider jwtTokenProvider;

    private Long resolveAdminId(HttpServletRequest request) {
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
    public ResponseEntity<ApiResponse<Page<FeedbackResponse>>> getAllFeedbacks(
            @RequestParam(required = false) FeedbackStatus status,
            @RequestParam(required = false) FeedbackType type,
            @RequestParam(required = false) String keyword,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size,
            @RequestParam(defaultValue = "createdAt") String sortBy,
            @RequestParam(defaultValue = "desc") String sortDir
    ) {
        Sort sort = sortDir.equalsIgnoreCase("asc") ? Sort.by(sortBy).ascending() : Sort.by(sortBy).descending();
        Pageable pageable = PageRequest.of(page, size, sort);

        Page<FeedbackResponse> result = feedbackService.getAllFeedbacks(status, type, keyword, pageable);
        return ResponseEntity.ok(
                ApiResponse.<Page<FeedbackResponse>>builder()
                        .code(HttpStatus.OK.value())
                        .message("Lấy danh sách phản hồi thành công!")
                        .data(result)
                        .build()
        );
    }

    @GetMapping("/stats")
    public ResponseEntity<ApiResponse<Map<String, Long>>> getFeedbackStats() {
        Map<String, Long> stats = feedbackService.getFeedbackStats();
        return ResponseEntity.ok(
                ApiResponse.<Map<String, Long>>builder()
                        .code(HttpStatus.OK.value())
                        .message("Lấy thống kê phản hồi thành công!")
                        .data(stats)
                        .build()
        );
    }

    @GetMapping("/{id}")
    public ResponseEntity<ApiResponse<FeedbackResponse>> getFeedbackById(@PathVariable Long id) {
        FeedbackResponse response = feedbackService.getFeedbackById(id);
        return ResponseEntity.ok(
                ApiResponse.<FeedbackResponse>builder()
                        .code(HttpStatus.OK.value())
                        .message("Lấy thông tin phản hồi thành công!")
                        .data(response)
                        .build()
        );
    }

    @PostMapping("/{id}/reply")
    public ResponseEntity<ApiResponse<FeedbackResponse>> replyFeedback(
            @PathVariable Long id,
            @Valid @RequestBody FeedbackReplyRequest requestBody,
            HttpServletRequest request
    ) {
        Long adminId = resolveAdminId(request);
        if (adminId == null) {
            throw new AppException("Vui lòng đăng nhập với quyền Admin!", HttpStatus.UNAUTHORIZED);
        }

        FeedbackResponse response = feedbackService.replyFeedback(adminId, id, requestBody);
        return ResponseEntity.ok(
                ApiResponse.<FeedbackResponse>builder()
                        .code(HttpStatus.OK.value())
                        .message("Đã gửi câu trả lời và thông báo tới người dùng thành công!")
                        .data(response)
                        .build()
        );
    }

    @PatchMapping("/{id}/status")
    public ResponseEntity<ApiResponse<FeedbackResponse>> updateFeedbackStatus(
            @PathVariable Long id,
            @Valid @RequestBody FeedbackStatusUpdateRequest requestBody
    ) {
        FeedbackResponse response = feedbackService.updateStatus(id, requestBody);
        return ResponseEntity.ok(
                ApiResponse.<FeedbackResponse>builder()
                        .code(HttpStatus.OK.value())
                        .message("Cập nhật trạng thái phản hồi thành công!")
                        .data(response)
                        .build()
        );
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<ApiResponse<Void>> deleteFeedback(@PathVariable Long id) {
        feedbackService.deleteFeedback(id);
        return ResponseEntity.ok(
                ApiResponse.<Void>builder()
                        .code(HttpStatus.OK.value())
                        .message("Xóa phản hồi thành công!")
                        .build()
        );
    }
}

