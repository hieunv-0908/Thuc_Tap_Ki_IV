package com.funnyshop.dto.response;

import lombok.*;

import java.math.BigDecimal;
import java.util.List;

@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class DashboardAiCompareResponse {
    private DashboardPeriodStat periodA;
    private DashboardPeriodStat periodB;

    private BigDecimal revenueDiff;
    private Double revenueGrowthRate; // % tăng trưởng doanh thu (+/-)

    private Long ordersDiff;
    private Double ordersGrowthRate; // % tăng trưởng số đơn (+/-)

    private Double completionRateDiff; // chênh lệch % hoàn thành

    // AI Analysis
    private String aiSummary;
    private String aiDetailedAnalysis;
    private List<String> aiHighlights;
    private List<String> aiWarnings;
    private List<String> aiRecommendations;
    private String provider; // "Gemini AI" hoặc "FunnyShop AI Analyst"
}

