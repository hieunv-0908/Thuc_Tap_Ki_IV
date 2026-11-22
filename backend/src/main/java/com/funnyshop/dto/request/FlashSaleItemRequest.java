package com.funnyshop.dto.request;

import jakarta.validation.constraints.Max;
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
public class FlashSaleItemRequest {

    @NotNull(message = "ID sản phẩm không được để trống")
    private Long productId;

    @Min(value = 1, message = "% giảm giá tối thiểu 1%")
    @Max(value = 99, message = "% giảm giá tối đa 99%")
    private Integer discountPercent;

    @Min(value = 1, message = "Số lượng mở bán tối thiểu là 1")
    @Builder.Default
    private Integer flashSaleStock = 50;
}

