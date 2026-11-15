package com.funnyshop.event;

import lombok.Builder;
import lombok.Getter;
import lombok.ToString;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;

/**
 * OrderCreatedEvent
 *
 * Sự kiện Đơn hàng mới được tạo thành công.
 * Thiết kế theo chuẩn Zero-Lazy Loading: Chứa đầy đủ dữ liệu phẳng bất biến,
 * tuyệt đối không phụ thuộc vào Hibernate Session của luồng chính.
 */
@Getter
@Builder
@ToString
public class OrderCreatedEvent {
    private final Long orderId;
    private final Long userId;
    private final String customerName;
    private final String userEmail;
    private final String phone;
    private final String shippingAddress;
    private final BigDecimal totalAmount;
    private final String paymentMethod;
    private final LocalDateTime createdAt;
    private final List<OrderItemEventDto> items;
}

