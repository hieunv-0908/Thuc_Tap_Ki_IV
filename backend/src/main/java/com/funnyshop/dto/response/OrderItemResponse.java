package com.funnyshop.dto.response;

import com.fasterxml.jackson.annotation.JsonInclude;
import com.funnyshop.entity.OrderItem;
import com.funnyshop.entity.Product;
import com.funnyshop.entity.ProductVariant;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import lombok.extern.slf4j.Slf4j;

import java.math.BigDecimal;

@Slf4j
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

        try {
            ProductVariant variant = item.getProductVariant();
            if (variant != null) {
                varId = variant.getId();
                try { sku = variant.getSku(); } catch (Exception ignored) {}
                try { color = variant.getColor(); } catch (Exception ignored) {}
                try { size = variant.getSize(); } catch (Exception ignored) {}

                try {
                    Product variantProduct = variant.getProduct();
                    if (variantProduct != null) {
                        prodId = variantProduct.getId();
                        prodName = variantProduct.getName();
                    }
                } catch (Exception ex) {
                    log.warn("Không thể tải thông tin Product cha của variant ID: {} tại OrderItem ID: {}. Lỗi: {}",
                            varId, item.getId(), ex.getMessage());
                }

                try {
                    prodImg = variant.getImageUrl();
                } catch (Exception ex) {
                    log.warn("Không thể tải ảnh của variant ID: {} tại OrderItem ID: {}. Lỗi: {}",
                            varId, item.getId(), ex.getMessage());
                }
            }

            // Fallback sang Product trực tiếp trên OrderItem (cho dữ liệu cũ tạo trước khi có variant)
            if (prodName == null || prodId == null) {
                try {
                    Product directProduct = item.getProduct();
                    if (directProduct != null) {
                        if (prodId == null) prodId = directProduct.getId();
                        if (prodName == null) prodName = directProduct.getName();
                        if (prodImg == null) {
                            try {
                                prodImg = directProduct.getImageUrl();
                            } catch (Exception ignored) {}
                        }
                    }
                } catch (Exception ex) {
                    log.warn("Không thể tải thông tin Product trực tiếp tại OrderItem ID: {}. Lỗi: {}",
                            item.getId(), ex.getMessage());
                }
            }
        } catch (Exception ex) {
            log.warn("Phát hiện dữ liệu mồ côi hoặc lỗi truy cập entity tại OrderItem ID: {}, Order ID: {}. Chi tiết: {}",
                    item.getId(), (item.getOrder() != null ? item.getOrder().getId() : null), ex.getMessage());
        }

        String finalName = (prodName != null && !prodName.isBlank()) ? prodName : "Sản phẩm không khả dụng";

        return OrderItemResponse.builder()
                .id(item.getId())
                .variantId(varId)
                .productId(prodId)
                .sku(sku)
                .color(color)
                .size(size)
                .name(finalName)
                .productName(finalName)
                .imageUrl(prodImg)
                .quantity(item.getQuantity())
                .price(item.getPriceAtOrder())
                .priceAtOrder(item.getPriceAtOrder())
                .build();
    }
}
