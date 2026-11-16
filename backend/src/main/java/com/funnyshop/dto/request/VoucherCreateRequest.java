package com.funnyshop.dto.request;

import com.funnyshop.enums.DiscountType;
import jakarta.validation.constraints.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.time.LocalDateTime;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class VoucherCreateRequest {

    @NotBlank(message = "Mã voucher không được để trống")
    @Size(min = 3, max = 50, message = "Mã voucher phải từ 3 đến 50 ký tự")
    @Pattern(regexp = "^[A-Za-z0-9_-]+$", message = "Mã voucher chỉ được chứa chữ cái, số, gạch ngang và gạch dưới")
    private String code;

    @NotBlank(message = "Tên voucher không được để trống")
    @Size(max = 255, message = "Tên voucher không được vượt quá 255 ký tự")
    private String name;

    private String description;

    @NotNull(message = "Loại giảm giá không được để trống")
    private DiscountType discountType;

    @NotNull(message = "Giá trị giảm giá không được để trống")
    @DecimalMin(value = "0.01", message = "Giá trị giảm giá phải lớn hơn 0")
    private BigDecimal discountValue;

    @DecimalMin(value = "0.00", message = "Mức giảm tối đa không được âm")
    private BigDecimal maxDiscountAmount;

    @DecimalMin(value = "0.00", message = "Giá trị đơn tối thiểu không được âm")
    @Builder.Default
    private BigDecimal minOrderValue = BigDecimal.ZERO;

    @Min(value = 1, message = "Tổng lượt dùng tối thiểu là 1")
    private Integer usageLimit;

    @NotNull(message = "Giới hạn mỗi khách hàng không được để trống")
    @Min(value = 1, message = "Giới hạn mỗi khách hàng tối thiểu là 1")
    @Builder.Default
    private Integer perUserLimit = 1;

    @NotNull(message = "Ngày bắt đầu không được để trống")
    private LocalDateTime startDate;

    @NotNull(message = "Ngày kết thúc không được để trống")
    private LocalDateTime endDate;

    @Builder.Default
    private Boolean isActive = true;
}

