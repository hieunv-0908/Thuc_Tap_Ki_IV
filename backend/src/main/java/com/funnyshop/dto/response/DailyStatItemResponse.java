package com.funnyshop.dto.response;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.time.LocalDate;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class DailyStatItemResponse {
    private LocalDate date;
    private String dateLabel;
    private String dayOfWeek;
    private BigDecimal totalRevenue;
    private BigDecimal completedRevenue;
    private long totalOrders;
    private long completedOrders;
    private long shippingOrders;
    private long confirmedOrders;
    private long pendingOrders;
    private long cancelledOrders;
    private BigDecimal averageOrderValue;
    private int completionRate;
}

