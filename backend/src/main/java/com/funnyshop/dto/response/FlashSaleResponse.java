package com.funnyshop.dto.response;

import com.funnyshop.enums.FlashSaleScope;
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
public class FlashSaleResponse {
    private Long id;
    private String name;
    private String description;
    private LocalDateTime startTime;
    private LocalDateTime endTime;
    private Integer discountPercent;
    private FlashSaleScope scope;
    private List<Long> categoryIds;
    private Boolean isActive;
    private String status; // UPCOMING, ONGOING, ENDED
    private Long remainingSeconds; // Số giây còn lại nếu đang ONGOING hoặc đếm ngược tới START nếu UPCOMING
    @Builder.Default
    private List<FlashSaleItemResponse> items = new ArrayList<>();
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
}

