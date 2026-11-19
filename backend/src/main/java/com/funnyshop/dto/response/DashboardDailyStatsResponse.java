package com.funnyshop.dto.response;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class DashboardDailyStatsResponse {
    private String periodLabel;
    private LocalDate startDate;
    private LocalDate endDate;
    private int totalDays;

    // Tổng hợp chung (Gộp các ngày trong khoảng lựa chọn)
    private BigDecimal totalRevenue;
    private BigDecimal completedRevenue;
    private long totalOrders;
    private long completedOrders;
    private long shippingOrders;
    private long confirmedOrders;
    private long pendingOrders;
    private long cancelledOrders;
    private BigDecimal averageDailyRevenue;
    private BigDecimal averageOrderValue;
    private int completionRate;

    // Chi tiết từng ngày riêng lẻ
    private List<DailyStatItemResponse> dailyList;
}

