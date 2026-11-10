package com.funnyshop.dto.response;

import com.fasterxml.jackson.annotation.JsonInclude;
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
public class ProductVariantResponse {
    private Long id;
    private Long productId;
    private String sku;
    private String color;
    private String size;
    private BigDecimal price;
    private Integer stockQuantity;
    private Boolean isDeleted;

    public static ProductVariantResponse fromEntity(ProductVariant variant) {
        if (variant == null) {
            return null;
        }
        return ProductVariantResponse.builder()
                .id(variant.getId())
                .productId(variant.getProduct() != null ? variant.getProduct().getId() : null)
                .sku(variant.getSku())
                .color(variant.getColor())
                .size(variant.getSize())
                .price(variant.getPrice())
                .stockQuantity(variant.getStockQuantity())
                .isDeleted(variant.getIsDeleted())
                .build();
    }
}

