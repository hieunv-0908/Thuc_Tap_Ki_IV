package com.funnyshop.dto.request;

import com.fasterxml.jackson.annotation.JsonAlias;
import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ProductUpdateRequest {

    @NotBlank(message = "Tên sản phẩm không được để trống")
    @Size(max = 200, message = "Tên sản phẩm tối đa 200 ký tự")
    private String name;

    private String description;

    @Size(max = 100, message = "Thương hiệu tối đa 100 ký tự")
    private String brand;

    @Size(max = 100, message = "Chất liệu tối đa 100 ký tự")
    private String material;

    @Size(max = 50, message = "Giới tính mục tiêu tối đa 50 ký tự")
    private String genderType;

    @DecimalMin(value = "0.0", message = "Giá sản phẩm phải lớn hơn hoặc bằng 0")
    private BigDecimal price;

    @Min(value = 0, message = "Số lượng tồn kho phải lớn hơn hoặc bằng 0")
    private Integer stockQuantity;

    @NotNull(message = "Danh mục không được để trống")
    private Long categoryId;

    @Size(max = 500, message = "Đường dẫn ảnh tối đa 500 ký tự")
    private String imageUrl;

    @JsonAlias({"is_deleted", "deleted"})
    private Boolean isDeleted;
}
