package com.funnyshop.dto.response;

import com.funnyshop.entity.ReturnRequest;
import com.funnyshop.enums.ReturnStatus;
import lombok.*;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.Arrays;
import java.util.Collections;
import java.util.List;

@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ReturnResponse {

    private Long id;
    private Long orderId;
    private Long userId;
    private String customerName;
    private String customerPhone;
    private String reason;
    private String description;
    private List<String> evidenceImages;
    private String bankName;
    private String bankAccountNumber;
    private String bankAccountName;
    private BigDecimal refundAmount;
    private ReturnStatus status;
    private String adminNote;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;

    public static ReturnResponse fromEntity(ReturnRequest entity) {
        if (entity == null) {
            return null;
        }

        List<String> images = Collections.emptyList();
        if (entity.getEvidenceImages() != null && !entity.getEvidenceImages().isBlank()) {
            images = Arrays.stream(entity.getEvidenceImages().split(","))
                    .map(String::trim)
                    .filter(s -> !s.isEmpty())
                    .toList();
        }

        return ReturnResponse.builder()
                .id(entity.getId())
                .orderId(entity.getOrder() != null ? entity.getOrder().getId() : null)
                .userId(entity.getUser() != null ? entity.getUser().getId() : null)
                .customerName(entity.getOrder() != null ? entity.getOrder().getCustomerName()
                        : (entity.getUser() != null ? entity.getUser().getFullName() : null))
                .customerPhone(entity.getOrder() != null ? entity.getOrder().getPhone()
                        : (entity.getUser() != null ? entity.getUser().getPhone() : null))
                .reason(entity.getReason())
                .description(entity.getDescription())
                .evidenceImages(images)
                .bankName(entity.getBankName())
                .bankAccountNumber(entity.getBankAccountNumber())
                .bankAccountName(entity.getBankAccountName())
                .refundAmount(entity.getRefundAmount())
                .status(entity.getStatus())
                .adminNote(entity.getAdminNote())
                .createdAt(entity.getCreatedAt())
                .updatedAt(entity.getUpdatedAt())
                .build();
    }
}

