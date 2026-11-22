package com.funnyshop.dto.request;

import com.funnyshop.enums.FlashSaleScope;
import jakarta.validation.Valid;
import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class FlashSaleRequest {

    @NotBlank(message = "Tên chiến dịch Flash Sale không được để trống")
    private String name;

    private String description;

    @NotNull(message = "Thời gian bắt đầu không được để trống")
    private LocalDateTime startTime;

    @NotNull(message = "Thời gian kết thúc không được để trống")
    private LocalDateTime endTime;

    @NotNull(message = "% giảm giá chung không được để trống")
    @Min(value = 1, message = "% giảm giá tối thiểu 1%")
    @Max(value = 99, message = "% giảm giá tối đa 99%")
    private Integer discountPercent;

    @NotNull(message = "Phạm vi áp dụng không được để trống")
    private FlashSaleScope scope;

    @Builder.Default
    private List<Long> categoryIds = new ArrayList<>();

    @Builder.Default
    private Boolean isActive = true;

    @Builder.Default
    private List<@Valid FlashSaleItemRequest> items = new ArrayList<>();
}

