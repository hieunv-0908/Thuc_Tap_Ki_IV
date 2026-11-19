package com.funnyshop.service.impl;

import com.funnyshop.dto.response.DailyStatItemResponse;
import com.funnyshop.dto.response.DashboardDailyStatsResponse;
import com.funnyshop.entity.Order;
import com.funnyshop.enums.OrderStatus;
import com.funnyshop.repository.OrderRepository;
import com.funnyshop.service.DashboardAnalyticsService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.DayOfWeek;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.LocalTime;
import java.time.format.DateTimeFormatter;
import java.util.*;
import java.util.stream.Collectors;

@Slf4j
@Service
@RequiredArgsConstructor
public class DashboardAnalyticsServiceImpl implements DashboardAnalyticsService {

    private final OrderRepository orderRepository;

    private static final DateTimeFormatter DATE_FORMATTER = DateTimeFormatter.ofPattern("dd/MM/yyyy");
    private static final DateTimeFormatter SHORT_DATE_FORMATTER = DateTimeFormatter.ofPattern("dd/MM");

    @Override
    @Transactional(readOnly = true)
    public DashboardDailyStatsResponse getDailyStats(
            Integer days,
            LocalDate startDate,
            LocalDate endDate,
            LocalDate singleDate
    ) {
        LocalDate today = LocalDate.now();

        // 1. Xác định khoảng ngày
        LocalDate resolvedStart;
        LocalDate resolvedEnd;

        if (singleDate != null) {
            resolvedStart = singleDate;
            resolvedEnd = singleDate;
        } else if (startDate != null && endDate != null) {
            if (startDate.isAfter(endDate)) {
                resolvedStart = endDate;
                resolvedEnd = startDate;
            } else {
                resolvedStart = startDate;
                resolvedEnd = endDate;
            }
        } else if (days != null && days > 0) {
            resolvedEnd = today;
            resolvedStart = today.minusDays(days - 1);
        } else {
            // Mặc định 7 ngày gần nhất
            resolvedEnd = today;
            resolvedStart = today.minusDays(6);
        }

        LocalDateTime startDateTime = resolvedStart.atStartOfDay();
        LocalDateTime endDateTime = resolvedEnd.atTime(LocalTime.MAX);

        // 2. Lấy dữ liệu đơn hàng trong khoảng ngày
        List<Order> orders = orderRepository.findOrdersBetweenDates(startDateTime, endDateTime);

        // Group đơn hàng theo ngày
        Map<LocalDate, List<Order>> ordersByDate = orders.stream()
                .filter(o -> o.getCreatedAt() != null)
                .collect(Collectors.groupingBy(o -> o.getCreatedAt().toLocalDate()));

        // 3. Xây dựng danh sách thống kê chi tiết cho từng ngày
        List<DailyStatItemResponse> dailyList = new ArrayList<>();
        LocalDate currentDate = resolvedStart;

        BigDecimal totalPeriodRevenue = BigDecimal.ZERO;
        BigDecimal completedPeriodRevenue = BigDecimal.ZERO;
        long totalPeriodOrders = 0;
        long totalCompletedOrders = 0;
        long totalShippingOrders = 0;
        long totalConfirmedOrders = 0;
        long totalPendingOrders = 0;
        long totalCancelledOrders = 0;
        long totalValidOrders = 0;

        while (!currentDate.isAfter(resolvedEnd)) {
            List<Order> dayOrders = ordersByDate.getOrDefault(currentDate, Collections.emptyList());

            long totalDayOrders = dayOrders.size();
            long completedCount = 0;
            long shippingCount = 0;
            long confirmedCount = 0;
            long pendingCount = 0;
            long cancelledCount = 0;
            long validCount = 0;

            BigDecimal dayRevenue = BigDecimal.ZERO;
            BigDecimal dayCompletedRevenue = BigDecimal.ZERO;

            for (Order o : dayOrders) {
                OrderStatus status = o.getStatus() != null ? o.getStatus() : OrderStatus.PENDING;
                BigDecimal amount = o.getTotalAmount() != null ? o.getTotalAmount() : BigDecimal.ZERO;

                switch (status) {
                    case COMPLETED -> {
                        completedCount++;
                        validCount++;
                        dayRevenue = dayRevenue.add(amount);
                        dayCompletedRevenue = dayCompletedRevenue.add(amount);
                    }
                    case SHIPPING -> {
                        shippingCount++;
                        validCount++;
                        dayRevenue = dayRevenue.add(amount);
                    }
                    case PROCESSING -> {
                        confirmedCount++;
                        validCount++;
                        dayRevenue = dayRevenue.add(amount);
                    }
                    case PENDING -> {
                        pendingCount++;
                        validCount++;
                        dayRevenue = dayRevenue.add(amount);
                    }
                    case CANCELLED -> cancelledCount++;
                    default -> {
                        validCount++;
                        dayRevenue = dayRevenue.add(amount);
                    }
                }
            }

            BigDecimal aov = validCount > 0
                    ? dayRevenue.divide(BigDecimal.valueOf(validCount), 0, RoundingMode.HALF_UP)
                    : BigDecimal.ZERO;

            int completionRate = totalDayOrders > 0
                    ? (int) Math.round(((double) completedCount / totalDayOrders) * 100)
                    : 0;

            dailyList.add(DailyStatItemResponse.builder()
                    .date(currentDate)
                    .dateLabel(formatDateLabel(currentDate, today))
                    .dayOfWeek(formatDayOfWeek(currentDate.getDayOfWeek()))
                    .totalRevenue(dayRevenue)
                    .completedRevenue(dayCompletedRevenue)
                    .totalOrders(totalDayOrders)
                    .completedOrders(completedCount)
                    .shippingOrders(shippingCount)
                    .confirmedOrders(confirmedCount)
                    .pendingOrders(pendingCount)
                    .cancelledOrders(cancelledCount)
                    .averageOrderValue(aov)
                    .completionRate(completionRate)
                    .build());

            // Cộng dồn tổng hợp giai đoạn
            totalPeriodRevenue = totalPeriodRevenue.add(dayRevenue);
            completedPeriodRevenue = completedPeriodRevenue.add(dayCompletedRevenue);
            totalPeriodOrders += totalDayOrders;
            totalCompletedOrders += completedCount;
            totalShippingOrders += shippingCount;
            totalConfirmedOrders += confirmedCount;
            totalPendingOrders += pendingCount;
            totalCancelledOrders += cancelledCount;
            totalValidOrders += validCount;

            currentDate = currentDate.plusDays(1);
        }

        int totalDays = dailyList.size();
        BigDecimal averageDailyRevenue = totalDays > 0
                ? totalPeriodRevenue.divide(BigDecimal.valueOf(totalDays), 0, RoundingMode.HALF_UP)
                : BigDecimal.ZERO;

        BigDecimal periodAov = totalValidOrders > 0
                ? totalPeriodRevenue.divide(BigDecimal.valueOf(totalValidOrders), 0, RoundingMode.HALF_UP)
                : BigDecimal.ZERO;

        int periodCompletionRate = totalPeriodOrders > 0
                ? (int) Math.round(((double) totalCompletedOrders / totalPeriodOrders) * 100)
                : 0;

        String periodLabel = makePeriodLabel(resolvedStart, resolvedEnd, today, totalDays);

        return DashboardDailyStatsResponse.builder()
                .periodLabel(periodLabel)
                .startDate(resolvedStart)
                .endDate(resolvedEnd)
                .totalDays(totalDays)
                .totalRevenue(totalPeriodRevenue)
                .completedRevenue(completedPeriodRevenue)
                .totalOrders(totalPeriodOrders)
                .completedOrders(totalCompletedOrders)
                .shippingOrders(totalShippingOrders)
                .confirmedOrders(totalConfirmedOrders)
                .pendingOrders(totalPendingOrders)
                .cancelledOrders(totalCancelledOrders)
                .averageDailyRevenue(averageDailyRevenue)
                .averageOrderValue(periodAov)
                .completionRate(periodCompletionRate)
                .dailyList(dailyList)
                .build();
    }

    private String formatDateLabel(LocalDate date, LocalDate today) {
        if (date.isEqual(today)) {
            return "Hôm nay (" + date.format(SHORT_DATE_FORMATTER) + ")";
        }
        if (date.isEqual(today.minusDays(1))) {
            return "Hôm qua (" + date.format(SHORT_DATE_FORMATTER) + ")";
        }
        return formatDayOfWeek(date.getDayOfWeek()) + " (" + date.format(SHORT_DATE_FORMATTER) + ")";
    }

    private String formatDayOfWeek(DayOfWeek day) {
        return switch (day) {
            case MONDAY -> "T2";
            case TUESDAY -> "T3";
            case WEDNESDAY -> "T4";
            case THURSDAY -> "T5";
            case FRIDAY -> "T6";
            case SATURDAY -> "T7";
            case SUNDAY -> "CN";
        };
    }

    private String makePeriodLabel(LocalDate start, LocalDate end, LocalDate today, int totalDays) {
        if (start.isEqual(end)) {
            if (start.isEqual(today)) return "Hôm nay (" + start.format(DATE_FORMATTER) + ")";
            if (start.isEqual(today.minusDays(1))) return "Hôm qua (" + start.format(DATE_FORMATTER) + ")";
            return "Ngày " + start.format(DATE_FORMATTER);
        }
        if (end.isEqual(today)) {
            return totalDays + " ngày gần nhất (" + start.format(DATE_FORMATTER) + " - " + end.format(DATE_FORMATTER) + ")";
        }
        return "Từ " + start.format(DATE_FORMATTER) + " đến " + end.format(DATE_FORMATTER) + " (" + totalDays + " ngày)";
    }
}
