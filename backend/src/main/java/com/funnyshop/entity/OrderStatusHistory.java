package com.funnyshop.entity;

import com.funnyshop.enums.OrderStatus;
import jakarta.persistence.*;
import lombok.*;

import java.time.LocalDateTime;

/**
 * OrderStatusHistory
 *
 * Ghi nhận lịch sử chuyển trạng thái đơn hàng (Audit Trail / Timeline).
 * Đảm bảo tính minh bạch, có thể truy vết ai đã đổi trạng thái, vào thời gian nào và lý do gì.
 */
@Entity
@Table(
        name = "order_status_history",
        indexes = {
                @Index(name = "idx_history_order_id", columnList = "order_id"),
                @Index(name = "idx_history_created_at", columnList = "created_at")
        }
)
@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
@ToString(onlyExplicitlyIncluded = true)
public class OrderStatusHistory {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @ToString.Include
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "order_id", nullable = false)
    private Order order;

    @Enumerated(EnumType.STRING)
    @Column(name = "old_status", length = 30)
    @ToString.Include
    private OrderStatus oldStatus;

    @Enumerated(EnumType.STRING)
    @Column(name = "new_status", length = 30, nullable = false)
    @ToString.Include
    private OrderStatus newStatus;

    @Column(name = "changed_by", length = 100)
    @ToString.Include
    private String changedBy; // Username, hoặc "SYSTEM" / "ADMIN"

    @Column(columnDefinition = "TEXT")
    private String note;

    @Column(name = "created_at", updatable = false)
    @ToString.Include
    private LocalDateTime createdAt;

    @PrePersist
    protected void onCreate() {
        this.createdAt = LocalDateTime.now();
    }
}

