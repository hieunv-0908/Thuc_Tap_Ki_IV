package com.funnyshop.entity;

import jakarta.persistence.*;
import lombok.*;

import java.time.LocalDateTime;

@Entity
@Table(
        name = "addresses",
        indexes = {
                @Index(name = "idx_addresses_user_id", columnList = "user_id"),
                @Index(name = "idx_addresses_is_default", columnList = "is_default")
        }
)
@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class Address {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id", nullable = false)
    private User user;

    @Column(name = "recipient_name", nullable = false, length = 100)
    private String recipientName;

    @Column(nullable = false, length = 20)
    private String phone;

    @Column(nullable = false, length = 100)
    private String province;

    @Column(nullable = false, length = 100)
    private String district;

    @Column(nullable = false, length = 100)
    private String ward;

    @Column(name = "detail_address", nullable = false, length = 255)
    private String detailAddress;

    @Column(name = "full_address", columnDefinition = "TEXT")
    private String fullAddress;

    @Column(name = "is_default", nullable = false)
    @Builder.Default
    private Boolean isDefault = false;

    @Column(name = "address_type", length = 30)
    @Builder.Default
    private String addressType = "HOME"; // HOME, OFFICE, OTHER

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
        if (this.isDefault == null) {
            this.isDefault = false;
        }
        if (this.addressType == null) {
            this.addressType = "HOME";
        }
        generateFullAddress();
    }

    @PreUpdate
    protected void onUpdate() {
        this.updatedAt = LocalDateTime.now();
        generateFullAddress();
    }

    private void generateFullAddress() {
        StringBuilder sb = new StringBuilder();
        if (detailAddress != null && !detailAddress.isBlank()) sb.append(detailAddress.trim());
        if (ward != null && !ward.isBlank()) {
            if (sb.length() > 0) sb.append(", ");
            sb.append(ward.trim());
        }
        if (district != null && !district.isBlank()) {
            if (sb.length() > 0) sb.append(", ");
            sb.append(district.trim());
        }
        if (province != null && !province.isBlank()) {
            if (sb.length() > 0) sb.append(", ");
            sb.append(province.trim());
        }
        this.fullAddress = sb.toString();
    }
}

