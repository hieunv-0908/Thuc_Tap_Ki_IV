package com.funnyshop.entity;

import com.funnyshop.enums.DiscountType;
import jakarta.persistence.*;
import lombok.*;

import java.math.BigDecimal;
import java.time.LocalDateTime;

@Entity
@Table(
        name = "vouchers",
        indexes = {
                @Index(name = "idx_vouchers_code", columnList = "code", unique = true),
                @Index(name = "idx_vouchers_status_dates", columnList = "is_active, start_date, end_date")
        }
)
@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
@ToString(onlyExplicitlyIncluded = true)
public class Voucher {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @ToString.Include
    private Long id;

    @Column(nullable = false, unique = true, length = 50)
    @ToString.Include
    private String code;

    @Column(nullable = false, length = 255)
    @ToString.Include
    private String name;

    @Column(columnDefinition = "TEXT")
    private String description;

    @Enumerated(EnumType.STRING)
    @Column(name = "discount_type", nullable = false, length = 20)
    @ToString.Include
    private DiscountType discountType;

    @Column(name = "discount_value", nullable = false, precision = 12, scale = 2)
    @ToString.Include
    private BigDecimal discountValue;

    @Column(name = "max_discount_amount", precision = 12, scale = 2)
    private BigDecimal maxDiscountAmount;

    @Column(name = "min_order_value", nullable = false, precision = 12, scale = 2)
    @Builder.Default
    private BigDecimal minOrderValue = BigDecimal.ZERO;

    @Column(name = "usage_limit")
    private Integer usageLimit;

    @Column(name = "used_count", nullable = false)
    @Builder.Default
    @ToString.Include
    private Integer usedCount = 0;

    @Column(name = "per_user_limit", nullable = false)
    @Builder.Default
    private Integer perUserLimit = 1;

    @Column(name = "start_date", nullable = false)
    @ToString.Include
    private LocalDateTime startDate;

    @Column(name = "end_date", nullable = false)
    @ToString.Include
    private LocalDateTime endDate;

    @Column(name = "is_active", nullable = false)
    @Builder.Default
    @ToString.Include
    private Boolean isActive = true;

    @Column(name = "created_at", updatable = false)
    private LocalDateTime createdAt;

    @Column(name = "updated_at")
    private LocalDateTime updatedAt;

    @PrePersist
    protected void onCreate() {
        this.createdAt = LocalDateTime.now();
        this.updatedAt = LocalDateTime.now();
        if (this.usedCount == null) {
            this.usedCount = 0;
        }
        if (this.perUserLimit == null) {
            this.perUserLimit = 1;
        }
        if (this.minOrderValue == null) {
            this.minOrderValue = BigDecimal.ZERO;
        }
        if (this.isActive == null) {
            this.isActive = true;
        }
        if (this.code != null) {
            this.code = this.code.trim().toUpperCase();
        }
    }

    @PreUpdate
    protected void onUpdate() {
        this.updatedAt = LocalDateTime.now();
        if (this.code != null) {
            this.code = this.code.trim().toUpperCase();
        }
    }

    @Override
    public boolean equals(Object o) {
        if (this == o) return true;
        if (o == null || org.hibernate.Hibernate.getClass(this) != org.hibernate.Hibernate.getClass(o)) {
            return false;
        }
        Voucher other = (Voucher) o;
        return id != null && id.equals(other.id);
    }

    @Override
    public int hashCode() {
        return org.hibernate.Hibernate.getClass(this).hashCode();
    }
}

