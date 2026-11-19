package com.funnyshop.service;

import com.funnyshop.dto.response.DashboardDailyStatsResponse;

import java.time.LocalDate;

public interface DashboardAnalyticsService {
    DashboardDailyStatsResponse getDailyStats(Integer days, LocalDate startDate, LocalDate endDate, LocalDate singleDate);
}

