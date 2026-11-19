package com.funnyshop.service;

import com.funnyshop.dto.request.NotificationCreateRequest;
import com.funnyshop.dto.request.NotificationUpdateRequest;
import com.funnyshop.dto.response.NotificationResponse;
import com.funnyshop.enums.NotificationTarget;
import com.funnyshop.enums.NotificationType;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;

public interface NotificationService {

    // Khách hàng
    Page<NotificationResponse> getMyNotifications(Long userId, Pageable pageable);
    long getUnreadCount(Long userId);
    void markAsRead(Long userId, Long notificationId);
    void markAllAsRead(Long userId);

    // Quản trị viên
    Page<NotificationResponse> getAllNotifications(
            NotificationType type,
            NotificationTarget target,
            Boolean isActive,
            String keyword,
            Pageable pageable
    );
    NotificationResponse getNotificationById(Long id);
    NotificationResponse createNotification(NotificationCreateRequest request);
    NotificationResponse updateNotification(Long id, NotificationUpdateRequest request);
    void deleteNotification(Long id);
    NotificationResponse toggleNotificationStatus(Long id);
}

