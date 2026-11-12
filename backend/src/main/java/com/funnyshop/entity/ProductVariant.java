package com.funnyshop.entity;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import lombok.ToString;
import org.hibernate.annotations.BatchSize;
import org.hibernate.annotations.SQLDelete;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;
import java.util.Objects;

@Entity
@Table(
        name = "product_variants",
        indexes = {
                @Index(name = "idx_variants_product", columnList = "product_id"),
                @Index(name = "idx_variants_color_size", columnList = "color, size")
        }
)
@SQLDelete(sql = "UPDATE product_variants SET is_deleted = true WHERE id = ?")
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ProductVariant {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "product_id", nullable = false)
    @ToString.Exclude
    private Product product;

    @OneToMany(mappedBy = "variant", cascade = CascadeType.ALL, orphanRemoval = true)
    @BatchSize(size = 20)
    @Builder.Default
    private List<ProductImage> images = new ArrayList<>();

    @Column(nullable = false, unique = true, length = 100)
    private String sku;

    @Column(nullable = false, length = 50)
    private String color;

    @Column(nullable = false, length = 20)
    private String size;

    @Column(nullable = false, precision = 12, scale = 2)
    private BigDecimal price;

    @Column(name = "stock_quantity", nullable = false)
    @Builder.Default
    private Integer stockQuantity = 0;

    @Column(name = "is_deleted", nullable = false)
    @Builder.Default
    private Boolean isDeleted = false;

    @Column(name = "created_at", updatable = false)
    private LocalDateTime createdAt;

    @Column(name = "updated_at")
    private LocalDateTime updatedAt;

    @PrePersist
    protected void onCreate() {
        this.createdAt = LocalDateTime.now();
        this.updatedAt = LocalDateTime.now();
        if (this.isDeleted == null) {
            this.isDeleted = false;
        }
        if (this.stockQuantity == null) {
            this.stockQuantity = 0;
        }
    }

    @PreUpdate
    protected void onUpdate() {
        this.updatedAt = LocalDateTime.now();
    }

    // Helper method to get image URL from variant's images
    @Transient
    public String getImageUrl() {
        if (images == null || images.isEmpty()) {
            // Fallback to product's image if variant has no images
            if (product != null) {
                return product.getImageUrl();
            }
            return null;
        }
        return images.stream()
                .filter(img -> Boolean.TRUE.equals(img.getIsPrimary()))
                .findFirst()
                .map(ProductImage::getImageUrl)
                .orElseGet(() -> images.get(0).getImageUrl());
    }
}

