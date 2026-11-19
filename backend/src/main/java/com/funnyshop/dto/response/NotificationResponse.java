package com.funnyshop.dto.response;

import com.funnyshop.entity.Notification;
import com.funnyshop.enums.NotificationTarget;
import com.funnyshop.enums.NotificationType;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class NotificationResponse {

    private Long id;
    private String title;
    private String content;
    private NotificationType type;
    private NotificationTarget target;
    private Long userId;
    private String userFullName;
    private String userEmail;
    private String targetUrl;
    private String imageUrl;
    private Boolean isActive;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;

    // Trạng thái đối với user xem
    private Boolean isRead;
    private LocalDateTime readAt;

    public static NotificationResponse fromEntity(Notification notification) {
        if (notification == null) return null;

        return NotificationResponse.builder()
                .id(notification.getId())
                .title(notification.getTitle())
                .content(notification.getContent())
                .type(notification.getType())
                .target(notification.getTarget())
                .userId(notification.getUser() != null ? notification.getUser().getId() : null)
                .userFullName(notification.getUser() != null ? notification.getUser().getFullName() : null)
                .userEmail(notification.getUser() != null ? notification.getUser().getEmail() : null)
                .targetUrl(notification.getTargetUrl())
                .imageUrl(notification.getImageUrl())
                .isActive(notification.getIsActive())
                .createdAt(notification.getCreatedAt())
                .updatedAt(notification.getUpdatedAt())
                .isRead(false)
                .build();
    }

    public static NotificationResponse fromEntityWithReadStatus(Notification notification, boolean isRead, LocalDateTime readAt) {
        NotificationResponse res = fromEntity(notification);
        if (res != null) {
            res.setIsRead(isRead);
            res.setReadAt(readAt);
        }
        return res;
    }
}

