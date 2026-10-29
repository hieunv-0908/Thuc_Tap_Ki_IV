package com.funnyshop.dto.response;

import com.fasterxml.jackson.annotation.JsonInclude;
import com.funnyshop.entity.OrderItem;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
@JsonInclude(JsonInclude.Include.NON_NULL)
public class OrderItemResponse {
    private Long id;
    private Long productId;
    private String name;
    private String productName;
    private String imageUrl;
    private Integer quantity;
    private BigDecimal price;
    private BigDecimal priceAtOrder;

    public static OrderItemResponse fromEntity(OrderItem item) {
        if (item == null) {
            return null;
        }

        Long prodId = null;
        String prodName = null;
        String prodImg = null;

        if (item.getProduct() != null) {
            prodId = item.getProduct().getId();
            prodName = item.getProduct().getName();
            prodImg = item.getProduct().getImageUrl();
        }

        return OrderItemResponse.builder()
                .id(item.getId())
                .productId(prodId)
                .name(prodName)
                .productName(prodName)
                .imageUrl(prodImg)
                .quantity(item.getQuantity())
                .price(item.getPriceAtOrder())
                .priceAtOrder(item.getPriceAtOrder())
                .build();
    }
}

