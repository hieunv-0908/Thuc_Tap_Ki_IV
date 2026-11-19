package com.funnyshop.service;

import com.funnyshop.dto.request.DashboardAiCompareRequest;
import com.funnyshop.dto.response.DashboardAiCompareResponse;
import com.funnyshop.dto.response.DashboardDailyStatsResponse;

import java.time.LocalDate;

public interface DashboardAnalyticsService {
    DashboardDailyStatsResponse getDailyStats(Integer days, LocalDate startDate, LocalDate endDate, LocalDate singleDate);

    DashboardAiCompareResponse comparePeriodsWithAi(DashboardAiCompareRequest request);
}


