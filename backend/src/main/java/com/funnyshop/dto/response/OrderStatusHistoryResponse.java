package com.funnyshop.dto.response;

import com.funnyshop.entity.OrderStatusHistory;
import com.funnyshop.enums.OrderStatus;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class OrderStatusHistoryResponse {
    private Long id;
    private Long orderId;
    private OrderStatus oldStatus;
    private OrderStatus newStatus;
    private String changedBy;
    private String note;
    private LocalDateTime createdAt;

    public static OrderStatusHistoryResponse fromEntity(OrderStatusHistory history) {
        if (history == null) return null;
        return OrderStatusHistoryResponse.builder()
                .id(history.getId())
                .orderId(history.getOrder() != null ? history.getOrder().getId() : null)
                .oldStatus(history.getOldStatus())
                .newStatus(history.getNewStatus())
                .changedBy(history.getChangedBy())
                .note(history.getNote())
                .createdAt(history.getCreatedAt())
                .build();
    }
}

