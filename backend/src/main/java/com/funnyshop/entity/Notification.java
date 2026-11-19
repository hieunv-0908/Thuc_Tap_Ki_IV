package com.funnyshop.entity;

import com.funnyshop.enums.NotificationTarget;
import com.funnyshop.enums.NotificationType;
import jakarta.persistence.*;
import lombok.*;

import java.time.LocalDateTime;

@Entity
@Table(
        name = "notifications",
        indexes = {
                @Index(name = "idx_noti_type", columnList = "type"),
                @Index(name = "idx_noti_target", columnList = "target"),
                @Index(name = "idx_noti_active", columnList = "is_active"),
                @Index(name = "idx_noti_created_at", columnList = "created_at")
        }
)
@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class Notification {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false, length = 200)
    private String title;

    @Column(nullable = false, columnDefinition = "TEXT")
    private String content;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 30)
    private NotificationType type;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 30)
    @Builder.Default
    private NotificationTarget target = NotificationTarget.ALL;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id")
    private User user; // Chỉ dùng khi target = SPECIFIC

    @Column(name = "target_url", length = 500)
    private String targetUrl; // Link chuyển hướng khi click, ví dụ /vouchers, /products/123

    @Column(name = "image_url", length = 500)
    private String imageUrl; // Ảnh thumbnail / banner nếu có

    @Column(name = "is_active", nullable = false)
    @Builder.Default
    private Boolean isActive = true; // Admin có thể bật/tắt phát thông báo này

    @Column(name = "created_at", nullable = false, updatable = false)
    private LocalDateTime createdAt;

    @Column(name = "updated_at")
    private LocalDateTime updatedAt;

    @PrePersist
    protected void onCreate() {
        if (this.createdAt == null) {
            this.createdAt = LocalDateTime.now();
        }
        if (this.updatedAt == null) {
            this.updatedAt = LocalDateTime.now();
        }
        if (this.isActive == null) {
            this.isActive = true;
        }
        if (this.target == null) {
            this.target = NotificationTarget.ALL;
        }
    }

    @PreUpdate
    protected void onUpdate() {
        this.updatedAt = LocalDateTime.now();
    }
}

