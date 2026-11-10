package com.funnyshop.dto.response;

import com.fasterxml.jackson.annotation.JsonInclude;
import com.funnyshop.entity.Product;
import com.funnyshop.entity.ProductImage;
import com.funnyshop.entity.ProductVariant;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.Collections;
import java.util.List;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
@JsonInclude(JsonInclude.Include.NON_NULL)
public class ProductResponse {
    private Long id;
    private String name;
    private String description;
    private String brand;
    private String material;
    private String genderType;
    private BigDecimal price;
    private BigDecimal minPrice;
    private BigDecimal maxPrice;
    private Integer stockQuantity;
    private Integer stock;
    private CategoryResponse category;
    private String imageUrl;
    private List<ProductImageResponse> images;
    private List<ProductVariantResponse> variants;
    private Boolean isDeleted;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;

    public static ProductResponse fromEntity(Product product) {
        if (product == null) {
            return null;
        }

        BigDecimal minPrice = BigDecimal.ZERO;
        BigDecimal maxPrice = BigDecimal.ZERO;
        int totalStock = 0;
        List<ProductVariantResponse> variantResponses = new ArrayList<>();

        if (product.getVariants() != null && !product.getVariants().isEmpty()) {
            List<ProductVariant> activeVariants = product.getVariants().stream()
                    .filter(v -> !Boolean.TRUE.equals(v.getIsDeleted()))
                    .toList();

            if (!activeVariants.isEmpty()) {
                minPrice = activeVariants.stream()
                        .map(ProductVariant::getPrice)
                        .min(BigDecimal::compareTo)
                        .orElse(BigDecimal.ZERO);
                maxPrice = activeVariants.stream()
                        .map(ProductVariant::getPrice)
                        .max(BigDecimal::compareTo)
                        .orElse(BigDecimal.ZERO);
                totalStock = activeVariants.stream()
                        .mapToInt(v -> v.getStockQuantity() != null ? v.getStockQuantity() : 0)
                        .sum();
            }

            variantResponses = product.getVariants().stream()
                    .map(ProductVariantResponse::fromEntity)
                    .toList();
        }

        List<ProductImageResponse> imageResponses = new ArrayList<>();
        String primaryImage = null;

        if (product.getImages() != null && !product.getImages().isEmpty()) {
            imageResponses = product.getImages().stream()
                    .map(ProductImageResponse::fromEntity)
                    .toList();

            primaryImage = product.getImages().stream()
                    .filter(img -> Boolean.TRUE.equals(img.getIsPrimary()))
                    .findFirst()
                    .map(ProductImage::getImageUrl)
                    .orElseGet(() -> product.getImages().get(0).getImageUrl());
        }

        return ProductResponse.builder()
                .id(product.getId())
                .name(product.getName())
                .description(product.getDescription())
                .brand(product.getBrand())
                .material(product.getMaterial())
                .genderType(product.getGenderType())
                .price(minPrice) // Mặc định hiển thị giá thấp nhất của biến thể
                .minPrice(minPrice)
                .maxPrice(maxPrice)
                .stockQuantity(totalStock)
                .stock(totalStock)
                .category(CategoryResponse.fromEntity(product.getCategory()))
                .imageUrl(primaryImage)
                .images(imageResponses)
                .variants(variantResponses)
                .isDeleted(product.getIsDeleted())
                .createdAt(product.getCreatedAt())
                .updatedAt(product.getUpdatedAt())
                .build();
    }
}
