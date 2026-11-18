package com.funnyshop.controller;

import com.funnyshop.dto.response.ApiResponse;
import com.funnyshop.dto.response.NotificationResponse;
import com.funnyshop.entity.User;
import com.funnyshop.exception.AppException;
import com.funnyshop.security.JwtTokenProvider;
import com.funnyshop.service.NotificationService;
import jakarta.servlet.http.HttpServletRequest;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/v1/notifications")
@RequiredArgsConstructor
public class NotificationController {

    private final NotificationService notificationService;
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
    public ResponseEntity<ApiResponse<Page<NotificationResponse>>> getMyNotifications(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size,
            HttpServletRequest request
    ) {
        Long userId = resolveUserId(request);
        if (userId == null) {
            throw new AppException("Vui lòng đăng nhập để xem thông báo!", HttpStatus.UNAUTHORIZED);
        }

        Page<NotificationResponse> result = notificationService.getMyNotifications(userId, PageRequest.of(page, size));
        return ResponseEntity.ok(
                ApiResponse.<Page<NotificationResponse>>builder()
                        .code(HttpStatus.OK.value())
                        .message("Lấy danh sách thông báo thành công!")
                        .data(result)
                        .build()
        );
    }

    @GetMapping("/unread-count")
    public ResponseEntity<ApiResponse<Long>> getUnreadCount(HttpServletRequest request) {
        Long userId = resolveUserId(request);
        if (userId == null) {
            return ResponseEntity.ok(
                    ApiResponse.<Long>builder()
                            .code(HttpStatus.OK.value())
                            .message("Chưa đăng nhập")
                            .data(0L)
                            .build()
            );
        }

        long unreadCount = notificationService.getUnreadCount(userId);
        return ResponseEntity.ok(
                ApiResponse.<Long>builder()
                        .code(HttpStatus.OK.value())
                        .message("Số lượng thông báo chưa đọc")
                        .data(unreadCount)
                        .build()
        );
    }

    @PutMapping("/{id}/read")
    public ResponseEntity<ApiResponse<Void>> markAsRead(
            @PathVariable Long id,
            HttpServletRequest request
    ) {
        Long userId = resolveUserId(request);
        if (userId == null) {
            throw new AppException("Vui lòng đăng nhập để thực hiện thao tác này!", HttpStatus.UNAUTHORIZED);
        }

        notificationService.markAsRead(userId, id);
        return ResponseEntity.ok(
                ApiResponse.<Void>builder()
                        .code(HttpStatus.OK.value())
                        .message("Đã đánh dấu thông báo là đã đọc!")
                        .data(null)
                        .build()
        );
    }

    @PutMapping("/read-all")
    public ResponseEntity<ApiResponse<Void>> markAllAsRead(HttpServletRequest request) {
        Long userId = resolveUserId(request);
        if (userId == null) {
            throw new AppException("Vui lòng đăng nhập để thực hiện thao tác này!", HttpStatus.UNAUTHORIZED);
        }

        notificationService.markAllAsRead(userId);
        return ResponseEntity.ok(
                ApiResponse.<Void>builder()
                        .code(HttpStatus.OK.value())
                        .message("Đã đánh dấu tất cả thông báo là đã đọc!")
                        .data(null)
                        .build()
        );
    }
}

