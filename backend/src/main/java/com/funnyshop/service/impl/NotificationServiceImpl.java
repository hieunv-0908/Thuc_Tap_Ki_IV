package com.funnyshop.service.impl;

import com.funnyshop.dto.request.NotificationCreateRequest;
import com.funnyshop.dto.request.NotificationUpdateRequest;
import com.funnyshop.dto.response.NotificationResponse;
import com.funnyshop.entity.Notification;
import com.funnyshop.entity.NotificationRecipient;
import com.funnyshop.entity.User;
import com.funnyshop.enums.NotificationTarget;
import com.funnyshop.enums.NotificationType;
import com.funnyshop.exception.AppException;
import com.funnyshop.exception.ResourceNotFoundException;
import com.funnyshop.repository.NotificationRecipientRepository;
import com.funnyshop.repository.NotificationRepository;
import com.funnyshop.repository.UserRepository;
import com.funnyshop.service.NotificationService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.*;

@Service
@RequiredArgsConstructor
@Slf4j
public class NotificationServiceImpl implements NotificationService {

    private final NotificationRepository notificationRepository;
    private final NotificationRecipientRepository recipientRepository;
    private final UserRepository userRepository;

    @Override
    @Transactional(readOnly = true)
    public Page<NotificationResponse> getMyNotifications(Long userId, Pageable pageable) {
        Page<Notification> notiPage = notificationRepository.findActiveNotificationsForUser(userId, pageable);
        List<Long> readIds = recipientRepository.findReadNotificationIdsByUserId(userId);
        Set<Long> readSet = new HashSet<>(readIds);

        return notiPage.map(noti -> {
            boolean isRead = readSet.contains(noti.getId());
            return NotificationResponse.fromEntityWithReadStatus(noti, isRead, isRead ? noti.getUpdatedAt() : null);
        });
    }

    @Override
    @Transactional(readOnly = true)
    public long getUnreadCount(Long userId) {
        return notificationRepository.countUnreadNotificationsForUser(userId);
    }

    @Override
    @Transactional
    public void markAsRead(Long userId, Long notificationId) {
        Notification notification = notificationRepository.findById(notificationId)
                .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy thông báo với ID: " + notificationId));

        User user = userRepository.findById(userId)
                .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy người dùng!"));

        // Nếu thông báo là SPECIFIC cho người khác thì không cho phép
        if (notification.getTarget() == NotificationTarget.SPECIFIC
                && (notification.getUser() == null || !notification.getUser().getId().equals(userId))) {
            throw new AppException("Bạn không có quyền truy cập thông báo này!", HttpStatus.FORBIDDEN);
        }

        var optRecipient = recipientRepository.findByNotificationIdAndUserId(notificationId, userId);
        if (optRecipient.isPresent()) {
            NotificationRecipient nr = optRecipient.get();
            if (!nr.isRead()) {
                nr.setRead(true);
                nr.setReadAt(LocalDateTime.now());
                recipientRepository.save(nr);
            }
        } else {
            NotificationRecipient nr = NotificationRecipient.builder()
                    .notification(notification)
                    .user(user)
                    .isRead(true)
                    .readAt(LocalDateTime.now())
                    .build();
            recipientRepository.save(nr);
        }
    }

    @Override
    @Transactional
    public void markAllAsRead(Long userId) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy người dùng!"));

        List<Long> activeIds = notificationRepository.findActiveNotificationIdsForUser(userId);
        List<Long> readIds = recipientRepository.findReadNotificationIdsByUserId(userId);
        Set<Long> readSet = new HashSet<>(readIds);

        List<NotificationRecipient> toSave = new ArrayList<>();
        LocalDateTime now = LocalDateTime.now();

        for (Long notiId : activeIds) {
            if (!readSet.contains(notiId)) {
                Notification notiRef = notificationRepository.getReferenceById(notiId);
                toSave.add(NotificationRecipient.builder()
                        .notification(notiRef)
                        .user(user)
                        .isRead(true)
                        .readAt(now)
                        .build());
            }
        }

        if (!toSave.isEmpty()) {
            recipientRepository.saveAll(toSave);
        }
    }

    @Override
    @Transactional(readOnly = true)
    public Page<NotificationResponse> getAllNotifications(
            NotificationType type,
            NotificationTarget target,
            Boolean isActive,
            String keyword,
            Pageable pageable
    ) {
        Page<Notification> notiPage = notificationRepository.searchNotifications(type, target, isActive, keyword, pageable);
        return notiPage.map(NotificationResponse::fromEntity);
    }

    @Override
    @Transactional(readOnly = true)
    public NotificationResponse getNotificationById(Long id) {
        Notification noti = notificationRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy thông báo với ID: " + id));
        return NotificationResponse.fromEntity(noti);
    }

    @Override
    @Transactional
    public NotificationResponse createNotification(NotificationCreateRequest request) {
        User targetUser = null;
        if (request.getTarget() == NotificationTarget.SPECIFIC) {
            if (request.getUserId() == null) {
                throw new AppException("Vui lòng chọn người dùng nhận thông báo!", HttpStatus.BAD_REQUEST);
            }
            targetUser = userRepository.findById(request.getUserId())
                    .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy người dùng nhận thông báo với ID: " + request.getUserId()));
        }

        Notification notification = Notification.builder()
                .title(request.getTitle().trim())
                .content(request.getContent().trim())
                .type(request.getType())
                .target(request.getTarget())
                .user(targetUser)
                .targetUrl(request.getTargetUrl() != null ? request.getTargetUrl().trim() : null)
                .imageUrl(request.getImageUrl() != null ? request.getImageUrl().trim() : null)
                .isActive(request.getIsActive() != null ? request.getIsActive() : true)
                .build();

        Notification saved = notificationRepository.save(notification);
        log.info("[Notification] Created notification ID: {} with type: {}, target: {}", saved.getId(), saved.getType(), saved.getTarget());

        return NotificationResponse.fromEntity(saved);
    }

    @Override
    @Transactional
    public NotificationResponse updateNotification(Long id, NotificationUpdateRequest request) {
        Notification notification = notificationRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy thông báo với ID: " + id));

        User targetUser = null;
        if (request.getTarget() == NotificationTarget.SPECIFIC) {
            if (request.getUserId() == null) {
                throw new AppException("Vui lòng chọn người dùng nhận thông báo!", HttpStatus.BAD_REQUEST);
            }
            targetUser = userRepository.findById(request.getUserId())
                    .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy người dùng với ID: " + request.getUserId()));
        }

        notification.setTitle(request.getTitle().trim());
        notification.setContent(request.getContent().trim());
        notification.setType(request.getType());
        notification.setTarget(request.getTarget());
        notification.setUser(targetUser);
        notification.setTargetUrl(request.getTargetUrl() != null ? request.getTargetUrl().trim() : null);
        notification.setImageUrl(request.getImageUrl() != null ? request.getImageUrl().trim() : null);
        if (request.getIsActive() != null) {
            notification.setIsActive(request.getIsActive());
        }

        Notification updated = notificationRepository.save(notification);
        return NotificationResponse.fromEntity(updated);
    }

    @Override
    @Transactional
    public void deleteNotification(Long id) {
        if (!notificationRepository.existsById(id)) {
            throw new ResourceNotFoundException("Không tìm thấy thông báo với ID: " + id);
        }
        recipientRepository.deleteAllByNotificationId(id);
        notificationRepository.deleteById(id);
        log.info("[Notification] Deleted notification ID: {}", id);
    }

    @Override
    @Transactional
    public NotificationResponse toggleNotificationStatus(Long id) {
        Notification notification = notificationRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy thông báo với ID: " + id));

        notification.setIsActive(!Boolean.TRUE.equals(notification.getIsActive()));
        Notification updated = notificationRepository.save(notification);
        log.info("[Notification] Toggled notification ID: {} active: {}", id, updated.getIsActive());
        return NotificationResponse.fromEntity(updated);
    }
}

