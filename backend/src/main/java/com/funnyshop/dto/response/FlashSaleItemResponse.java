package com.funnyshop.dto.response;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class FlashSaleItemResponse {
    private Long id;
    private Long productId;
    private String productName;
    private String imageUrl;
    private Long categoryId;
    private String categoryName;
    private BigDecimal originalPrice;
    private BigDecimal flashSalePrice;
    private Integer discountPercent;
    private Integer flashSaleStock;
    private Integer soldCount;
    private Integer progressPercent;
    private Boolean isOutOfStock;
}

