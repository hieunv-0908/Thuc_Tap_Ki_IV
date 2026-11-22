package com.funnyshop.entity;

import jakarta.persistence.*;
import lombok.*;

@Entity
@Table(
        name = "flash_sale_items",
        uniqueConstraints = {
                @UniqueConstraint(name = "uk_flash_sale_product", columnNames = {"flash_sale_id", "product_id"})
        }
)
@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class FlashSaleItem {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "flash_sale_id", nullable = false)
    private FlashSale flashSale;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "product_id", nullable = false)
    private Product product;

    /**
     * % giảm giá riêng cho sản phẩm này. Nếu null thì lấy theo discountPercent của FlashSale cha.
     */
    @Column(name = "discount_percent")
    private Integer discountPercent;

    @Column(name = "flash_sale_stock", nullable = false)
    @Builder.Default
    private Integer flashSaleStock = 50;

    @Column(name = "sold_count", nullable = false)
    @Builder.Default
    private Integer soldCount = 0;
}

