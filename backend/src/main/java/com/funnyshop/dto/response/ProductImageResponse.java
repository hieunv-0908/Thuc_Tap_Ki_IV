package com.funnyshop.dto.response;

import com.fasterxml.jackson.annotation.JsonInclude;
import com.funnyshop.entity.ProductImage;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
@JsonInclude(JsonInclude.Include.NON_NULL)
public class ProductImageResponse {
    private Long id;
    private Long productId;
    private Long variantId;
    private String imageUrl;
    private Boolean isPrimary;

    public static ProductImageResponse fromEntity(ProductImage image) {
        if (image == null) {
            return null;
        }
        return ProductImageResponse.builder()
                .id(image.getId())
                .productId(image.getProduct() != null ? image.getProduct().getId() : null)
                .variantId(image.getVariant() != null ? image.getVariant().getId() : null)
                .imageUrl(image.getImageUrl())
                .isPrimary(image.getIsPrimary())
                .build();
    }
}

