package com.funnyshop.dto.response;

import com.fasterxml.jackson.annotation.JsonInclude;
import com.funnyshop.entity.Voucher;
import com.funnyshop.enums.DiscountType;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.time.LocalDateTime;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
@JsonInclude(JsonInclude.Include.NON_NULL)
public class VoucherResponse {

    private Long id;
    private String code;
    private String name;
    private String description;
    private DiscountType discountType;
    private BigDecimal discountValue;
    private BigDecimal maxDiscountAmount;
    private BigDecimal minOrderValue;
    private Integer usageLimit;
    private Integer usedCount;
    private Integer perUserLimit;
    private LocalDateTime startDate;
    private LocalDateTime endDate;
    private Boolean isActive;
    private Boolean isExpired;
    private Boolean isUsable;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;

    public static VoucherResponse fromEntity(Voucher voucher) {
        if (voucher == null) {
            return null;
        }

        LocalDateTime now = LocalDateTime.now();
        boolean expired = voucher.getEndDate() != null && voucher.getEndDate().isBefore(now);
        boolean started = voucher.getStartDate() == null || !voucher.getStartDate().isAfter(now);
        boolean limitReached = voucher.getUsageLimit() != null && voucher.getUsedCount() >= voucher.getUsageLimit();
        boolean active = Boolean.TRUE.equals(voucher.getIsActive());

        boolean usable = active && !expired && started && !limitReached;

        return VoucherResponse.builder()
                .id(voucher.getId())
                .code(voucher.getCode())
                .name(voucher.getName())
                .description(voucher.getDescription())
                .discountType(voucher.getDiscountType())
                .discountValue(voucher.getDiscountValue())
                .maxDiscountAmount(voucher.getMaxDiscountAmount())
                .minOrderValue(voucher.getMinOrderValue())
                .usageLimit(voucher.getUsageLimit())
                .usedCount(voucher.getUsedCount())
                .perUserLimit(voucher.getPerUserLimit())
                .startDate(voucher.getStartDate())
                .endDate(voucher.getEndDate())
                .isActive(voucher.getIsActive())
                .isExpired(expired)
                .isUsable(usable)
                .createdAt(voucher.getCreatedAt())
                .updatedAt(voucher.getUpdatedAt())
                .build();
    }
}

