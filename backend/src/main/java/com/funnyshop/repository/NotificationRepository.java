package com.funnyshop.repository;

import com.funnyshop.entity.Notification;
import com.funnyshop.enums.NotificationTarget;
import com.funnyshop.enums.NotificationType;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface NotificationRepository extends JpaRepository<Notification, Long> {

    // Lấy thông báo active hiển thị cho một người dùng cụ thể
    @Query("""
        SELECT n FROM Notification n
        WHERE n.isActive = true
          AND (n.target = com.funnyshop.enums.NotificationTarget.ALL OR (n.target = com.funnyshop.enums.NotificationTarget.SPECIFIC AND n.user.id = :userId))
        ORDER BY n.createdAt DESC
    """)
    Page<Notification> findActiveNotificationsForUser(@Param("userId") Long userId, Pageable pageable);

    // Lấy danh sách ID các thông báo active cho user
    @Query("""
        SELECT n.id FROM Notification n
        WHERE n.isActive = true
          AND (n.target = com.funnyshop.enums.NotificationTarget.ALL OR (n.target = com.funnyshop.enums.NotificationTarget.SPECIFIC AND n.user.id = :userId))
    """)
    List<Long> findActiveNotificationIdsForUser(@Param("userId") Long userId);

    // Đếm số thông báo active cho user mà user chưa đọc
    @Query("""
        SELECT COUNT(n) FROM Notification n
        WHERE n.isActive = true
          AND (n.target = com.funnyshop.enums.NotificationTarget.ALL OR (n.target = com.funnyshop.enums.NotificationTarget.SPECIFIC AND n.user.id = :userId))
          AND NOT EXISTS (
              SELECT 1 FROM NotificationRecipient nr
              WHERE nr.notification.id = n.id
                AND nr.user.id = :userId
                AND nr.isRead = true
          )
    """)
    long countUnreadNotificationsForUser(@Param("userId") Long userId);

    // Admin tìm kiếm và lọc thông báo
    @Query("""
        SELECT n FROM Notification n
        WHERE (:type IS NULL OR n.type = :type)
          AND (:target IS NULL OR n.target = :target)
          AND (:isActive IS NULL OR n.isActive = :isActive)
          AND (:keyword IS NULL OR LOWER(n.title) LIKE LOWER(CONCAT('%', :keyword, '%')) OR LOWER(n.content) LIKE LOWER(CONCAT('%', :keyword, '%')))
        ORDER BY n.createdAt DESC
    """)
    Page<Notification> searchNotifications(
            @Param("type") NotificationType type,
            @Param("target") NotificationTarget target,
            @Param("isActive") Boolean isActive,
            @Param("keyword") String keyword,
            Pageable pageable
    );
}

