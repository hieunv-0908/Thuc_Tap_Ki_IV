package com.funnyshop.dto.request;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ProductImageCreateRequest {

    @NotBlank(message = "Đường dẫn hình ảnh không được để trống")
    @Size(max = 500, message = "Đường dẫn ảnh tối đa 500 ký tự")
    private String imageUrl;

    @Builder.Default
    private Boolean isPrimary = false;

    private Long variantId;
}

