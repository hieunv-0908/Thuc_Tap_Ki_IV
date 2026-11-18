package com.funnyshop.repository;

import com.funnyshop.entity.NotificationRecipient;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.Optional;

@Repository
public interface NotificationRecipientRepository extends JpaRepository<NotificationRecipient, Long> {

    Optional<NotificationRecipient> findByNotificationIdAndUserId(Long notificationId, Long userId);

    @Query("SELECT nr.notification.id FROM NotificationRecipient nr WHERE nr.user.id = :userId AND nr.isRead = true")
    List<Long> findReadNotificationIdsByUserId(@Param("userId") Long userId);

    @Modifying
    @Transactional
    void deleteAllByNotificationId(Long notificationId);
}

