package com.funnyshop.controller.admin;

import com.funnyshop.dto.request.NotificationCreateRequest;
import com.funnyshop.dto.request.NotificationUpdateRequest;
import com.funnyshop.dto.response.ApiResponse;
import com.funnyshop.dto.response.NotificationResponse;
import com.funnyshop.enums.NotificationTarget;
import com.funnyshop.enums.NotificationType;
import com.funnyshop.service.NotificationService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping({"/api/v1/admin/notifications", "/api/admin/notifications"})
@RequiredArgsConstructor
@PreAuthorize("hasRole('ADMIN')")
public class AdminNotificationController {

    private final NotificationService notificationService;

    @GetMapping
    public ResponseEntity<ApiResponse<Page<NotificationResponse>>> getAllNotifications(
            @RequestParam(required = false) NotificationType type,
            @RequestParam(required = false) NotificationTarget target,
            @RequestParam(required = false) Boolean isActive,
            @RequestParam(required = false) String keyword,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size,
            @RequestParam(defaultValue = "createdAt") String sortBy,
            @RequestParam(defaultValue = "desc") String sortDir
    ) {
        Sort sort = sortDir.equalsIgnoreCase("asc") ? Sort.by(sortBy).ascending() : Sort.by(sortBy).descending();
        Pageable pageable = PageRequest.of(page, size, sort);

        Page<NotificationResponse> result = notificationService.getAllNotifications(type, target, isActive, keyword, pageable);
        return ResponseEntity.ok(
                ApiResponse.<Page<NotificationResponse>>builder()
                        .code(HttpStatus.OK.value())
                        .message("Lấy danh sách thông báo thành công!")
                        .data(result)
                        .build()
        );
    }

    @GetMapping("/{id}")
    public ResponseEntity<ApiResponse<NotificationResponse>> getNotificationById(@PathVariable Long id) {
        NotificationResponse response = notificationService.getNotificationById(id);
        return ResponseEntity.ok(
                ApiResponse.<NotificationResponse>builder()
                        .code(HttpStatus.OK.value())
                        .message("Lấy thông tin thông báo thành công!")
                        .data(response)
                        .build()
        );
    }

    @PostMapping
    public ResponseEntity<ApiResponse<NotificationResponse>> createNotification(
            @Valid @RequestBody NotificationCreateRequest request
    ) {
        NotificationResponse response = notificationService.createNotification(request);
        return ResponseEntity.status(HttpStatus.CREATED).body(
                ApiResponse.<NotificationResponse>builder()
                        .code(HttpStatus.CREATED.value())
                        .message("Tạo và phát thông báo thành công!")
                        .data(response)
                        .build()
        );
    }

    @PutMapping("/{id}")
    public ResponseEntity<ApiResponse<NotificationResponse>> updateNotification(
            @PathVariable Long id,
            @Valid @RequestBody NotificationUpdateRequest request
    ) {
        NotificationResponse response = notificationService.updateNotification(id, request);
        return ResponseEntity.ok(
                ApiResponse.<NotificationResponse>builder()
                        .code(HttpStatus.OK.value())
                        .message("Cập nhật thông báo thành công!")
                        .data(response)
                        .build()
        );
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<ApiResponse<Void>> deleteNotification(@PathVariable Long id) {
        notificationService.deleteNotification(id);
        return ResponseEntity.ok(
                ApiResponse.<Void>builder()
                        .code(HttpStatus.OK.value())
                        .message("Xóa thông báo thành công!")
                        .data(null)
                        .build()
        );
    }

    @PatchMapping("/{id}/toggle-status")
    public ResponseEntity<ApiResponse<NotificationResponse>> toggleStatus(@PathVariable Long id) {
        NotificationResponse response = notificationService.toggleNotificationStatus(id);
        String msg = Boolean.TRUE.equals(response.getIsActive()) ? "Đã kích hoạt phát thông báo!" : "Đã tạm dừng phát thông báo!";
        return ResponseEntity.ok(
                ApiResponse.<NotificationResponse>builder()
                        .code(HttpStatus.OK.value())
                        .message(msg)
                        .data(response)
                        .build()
        );
    }
}

