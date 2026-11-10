package com.funnyshop.dto.request;

import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotNull;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class OrderCheckoutItemRequest {

    // Mã biến thể sản phẩm (Khuyên dùng)
    private Long variantId;

    // Giữ productId để tương thích ngược nếu client cũ gọi
    private Long productId;

    @NotNull(message = "Số lượng không được để trống")
    @Min(value = 1, message = "Số lượng sản phẩm phải lớn hơn 0")
    private Integer quantity;

    public Long getResolvedVariantId() {
        if (variantId != null) {
            return variantId;
        }
        return productId;
    }
}
