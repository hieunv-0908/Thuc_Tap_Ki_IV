package com.funnyshop.dto.response;

import com.fasterxml.jackson.annotation.JsonInclude;
import com.funnyshop.entity.Order;
import com.funnyshop.enums.OrderStatus;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import lombok.extern.slf4j.Slf4j;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.Collections;
import java.util.List;
import java.util.Objects;

@Slf4j
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
@JsonInclude(JsonInclude.Include.NON_NULL)
public class OrderResponse {
    private Long id;
    private Long userId;
    private String customerName;
    private String fullName;
    private String phone;
    private String shippingAddress;
    private String address;
    private BigDecimal totalAmount;
    private BigDecimal totalPrice;
    private String paymentMethod;
    private OrderStatus status;
    private List<OrderItemResponse> items;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;

    public static OrderResponse fromEntity(Order order) {
        if (order == null) {
            return null;
        }

        List<OrderItemResponse> items = Collections.emptyList();
        try {
            if (order.getOrderItems() != null) {
                items = order.getOrderItems().stream()
                        .map(OrderItemResponse::fromEntity)
                        .filter(Objects::nonNull)
                        .toList();
            }
        } catch (Exception ex) {
            log.warn("Không thể tải danh sách orderItems cho Order ID: {}. Lỗi: {}", order.getId(), ex.getMessage());
        }

        Long uid = order.getUser() != null ? order.getUser().getId() : null;

        return OrderResponse.builder()
                .id(order.getId())
                .userId(uid)
                .customerName(order.getCustomerName())
                .fullName(order.getCustomerName())
                .phone(order.getPhone())
                .shippingAddress(order.getShippingAddress())
                .address(order.getShippingAddress())
                .totalAmount(order.getTotalAmount())
                .totalPrice(order.getTotalAmount())
                .paymentMethod(order.getPaymentMethod())
                .status(order.getStatus())
                .items(items)
                .createdAt(order.getCreatedAt())
                .updatedAt(order.getUpdatedAt())
                .build();
    }
}

