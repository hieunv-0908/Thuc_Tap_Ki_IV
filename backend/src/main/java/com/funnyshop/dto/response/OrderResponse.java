package com.funnyshop.dto.response;

import com.fasterxml.jackson.annotation.JsonInclude;
import com.funnyshop.entity.Order;
import com.funnyshop.enums.OrderStatus;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.Collections;
import java.util.List;

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

        List<OrderItemResponse> items = order.getOrderItems() != null
                ? order.getOrderItems().stream().map(OrderItemResponse::fromEntity).toList()
                : Collections.emptyList();

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

