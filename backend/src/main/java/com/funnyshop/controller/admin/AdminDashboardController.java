package com.funnyshop.controller.admin;

import com.funnyshop.dto.request.DashboardAiCompareRequest;
import com.funnyshop.dto.response.ApiResponse;
import com.funnyshop.dto.response.DashboardAiCompareResponse;
import com.funnyshop.dto.response.DashboardDailyStatsResponse;
import com.funnyshop.service.DashboardAnalyticsService;
import lombok.RequiredArgsConstructor;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDate;

@RestController
@RequestMapping({"/api/v1/admin/dashboard", "/api/admin/dashboard"})
@RequiredArgsConstructor
@PreAuthorize("hasRole('ADMIN')")
public class AdminDashboardController {

    private final DashboardAnalyticsService dashboardAnalyticsService;

    @GetMapping("/daily-stats")
    public ResponseEntity<ApiResponse<DashboardDailyStatsResponse>> getDailyStats(
            @RequestParam(required = false) Integer days,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate startDate,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate endDate,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate singleDate
    ) {
        DashboardDailyStatsResponse response = dashboardAnalyticsService.getDailyStats(days, startDate, endDate, singleDate);

        return ResponseEntity.ok(
                ApiResponse.<DashboardDailyStatsResponse>builder()
                        .code(HttpStatus.OK.value())
                        .message("Lấy thống kê theo ngày thành công!")
                        .data(response)
                        .build()
        );
    }

    @PostMapping("/ai-comparison")
    public ResponseEntity<ApiResponse<DashboardAiCompareResponse>> comparePeriodsWithAi(
            @RequestBody DashboardAiCompareRequest request
    ) {
        DashboardAiCompareResponse response = dashboardAnalyticsService.comparePeriodsWithAi(request);

        return ResponseEntity.ok(
                ApiResponse.<DashboardAiCompareResponse>builder()
                        .code(HttpStatus.OK.value())
                        .message("Đánh giá so sánh AI thành công!")
                        .data(response)
                        .build()
        );
    }
}

