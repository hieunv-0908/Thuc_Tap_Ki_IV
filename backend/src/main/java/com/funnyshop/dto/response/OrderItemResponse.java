package com.funnyshop.dto.response;

import com.fasterxml.jackson.annotation.JsonInclude;
import com.funnyshop.entity.OrderItem;
import com.funnyshop.entity.ProductVariant;
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
    private Long variantId;
    private Long productId;
    private String sku;
    private String color;
    private String size;
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

        Long varId = null;
        Long prodId = null;
        String prodName = null;
        String prodImg = null;
        String sku = null;
        String color = null;
        String size = null;

        ProductVariant variant = item.getProductVariant();
        if (variant != null) {
            varId = variant.getId();
            sku = variant.getSku();
            color = variant.getColor();
            size = variant.getSize();

            if (variant.getProduct() != null) {
                prodId = variant.getProduct().getId();
                prodName = variant.getProduct().getName();
                // Get imageUrl from variant's images instead of product's transient method
                prodImg = variant.getImageUrl();
            }
        } else if (item.getProduct() != null) {
            prodId = item.getProduct().getId();
            prodName = item.getProduct().getName();
            prodImg = item.getProduct().getImageUrl();
        }

        return OrderItemResponse.builder()
                .id(item.getId())
                .variantId(varId)
                .productId(prodId)
                .sku(sku)
                .color(color)
                .size(size)
                .name(prodName)
                .productName(prodName)
                .imageUrl(prodImg)
                .quantity(item.getQuantity())
                .price(item.getPriceAtOrder())
                .priceAtOrder(item.getPriceAtOrder())
                .build();
    }
}
