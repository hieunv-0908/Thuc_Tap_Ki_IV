package com.funnyshop.event;

import lombok.Builder;
import lombok.Getter;
import lombok.ToString;

import java.math.BigDecimal;

/**
 * DTO bất biến đại diện cho từng sản phẩm trong sự kiện Đơn hàng.
 * Phẳng 100%, không mang tham chiếu JPA Entity để an toàn khi chuyển qua Thread khác.
 */
@Getter
@Builder
@ToString
public class OrderItemEventDto {
    private final Long variantId;
    private final String productName;
    private final String color;
    private final String size;
    private final Integer quantity;
    private final BigDecimal price;
}

