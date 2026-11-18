package com.funnyshop.entity;

import com.funnyshop.enums.ReturnStatus;
import jakarta.persistence.*;
import lombok.*;

import java.math.BigDecimal;
import java.time.LocalDateTime;

@Entity
@Table(
        name = "return_requests",
        indexes = {
                @Index(name = "idx_return_order_id", columnList = "order_id"),
                @Index(name = "idx_return_user_id", columnList = "user_id"),
                @Index(name = "idx_return_status", columnList = "status")
        }
)
@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ReturnRequest {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "order_id", nullable = false)
    private Order order;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id", nullable = false)
    private User user;

    @Column(nullable = false, length = 100)
    private String reason; // Lý do trả hàng

    @Column(columnDefinition = "TEXT")
    private String description; // Mô tả chi tiết

    @Column(name = "evidence_images", columnDefinition = "TEXT")
    private String evidenceImages; // Chuỗi URLs ảnh cách nhau bởi dấu phẩy

    @Column(name = "bank_name", length = 100)
    private String bankName; // Tên ngân hàng nhận hoàn tiền

    @Column(name = "bank_account_number", length = 50)
    private String bankAccountNumber; // Số tài khoản ngân hàng

    @Column(name = "bank_account_name", length = 100)
    private String bankAccountName; // Tên chủ tài khoản

    @Column(name = "refund_amount", precision = 12, scale = 2)
    private BigDecimal refundAmount; // Số tiền hoàn

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 30)
    @Builder.Default
    private ReturnStatus status = ReturnStatus.PENDING;

    @Column(name = "admin_note", columnDefinition = "TEXT")
    private String adminNote; // Ghi chú hoặc lý do từ chối từ phía Admin

    @Column(name = "created_at", updatable = false)
    private LocalDateTime createdAt;

    @Column(name = "updated_at")
    private LocalDateTime updatedAt;

    @PrePersist
    protected void onCreate() {
        this.createdAt = LocalDateTime.now();
        this.updatedAt = LocalDateTime.now();
        if (this.status == null) {
            this.status = ReturnStatus.PENDING;
        }
    }

    @PreUpdate
    protected void onUpdate() {
        this.updatedAt = LocalDateTime.now();
    }
}

