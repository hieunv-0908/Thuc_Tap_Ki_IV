package com.funnyshop.service.impl;

import com.funnyshop.config.GeminiProperties;
import com.funnyshop.dto.request.DashboardAiCompareRequest;
import com.funnyshop.dto.response.DailyStatItemResponse;
import com.funnyshop.dto.response.DashboardAiCompareResponse;
import com.funnyshop.dto.response.DashboardDailyStatsResponse;
import com.funnyshop.dto.response.DashboardPeriodStat;
import com.funnyshop.entity.Order;
import com.funnyshop.entity.OrderItem;
import com.funnyshop.enums.OrderStatus;
import com.funnyshop.repository.OrderRepository;
import com.funnyshop.service.DashboardAnalyticsService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpEntity;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.client.RestTemplate;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.text.NumberFormat;
import java.time.DayOfWeek;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.LocalTime;
import java.time.format.DateTimeFormatter;
import java.util.*;
import java.util.regex.Matcher;
import java.util.regex.Pattern;
import java.util.stream.Collectors;

@Slf4j
@Service
@RequiredArgsConstructor
public class DashboardAnalyticsServiceImpl implements DashboardAnalyticsService {

    private final OrderRepository orderRepository;
    private final GeminiProperties geminiProperties;
    private final RestTemplate restTemplate = new RestTemplate();

    private static final String GEMINI_API_BASE_URL = "https://generativelanguage.googleapis.com/v1beta/models/";
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

    @Override
    @Transactional(readOnly = true)
    public DashboardAiCompareResponse comparePeriodsWithAi(DashboardAiCompareRequest request) {
        LocalDate today = LocalDate.now();

        LocalDate startA;
        LocalDate endA;
        LocalDate startB;
        LocalDate endB;
        String labelA = request.getLabelA();
        String labelB = request.getLabelB();

        String preset = request.getPreset() != null ? request.getPreset().toUpperCase() : "TODAY_VS_YESTERDAY";

        switch (preset) {
            case "TODAY_VS_YESTERDAY" -> {
                // Kỳ B: Hôm nay, Kỳ A: Hôm qua
                startB = today;
                endB = today;
                startA = today.minusDays(1);
                endA = today.minusDays(1);
                if (labelA == null || labelA.isBlank()) labelA = "Hôm qua (" + startA.format(SHORT_DATE_FORMATTER) + ")";
                if (labelB == null || labelB.isBlank()) labelB = "Hôm nay (" + startB.format(SHORT_DATE_FORMATTER) + ")";
            }
            case "THIS_WEEK_VS_LAST_WEEK" -> {
                // Kỳ B: 7 ngày qua, Kỳ A: 7 ngày trước đó
                startB = today.minusDays(6);
                endB = today;
                startA = today.minusDays(13);
                endA = today.minusDays(7);
                if (labelA == null || labelA.isBlank()) labelA = "7 ngày trước (" + startA.format(SHORT_DATE_FORMATTER) + " - " + endA.format(SHORT_DATE_FORMATTER) + ")";
                if (labelB == null || labelB.isBlank()) labelB = "7 ngày qua (" + startB.format(SHORT_DATE_FORMATTER) + " - " + endB.format(SHORT_DATE_FORMATTER) + ")";
            }
            case "THIS_MONTH_VS_LAST_MONTH" -> {
                // Kỳ B: 30 ngày qua, Kỳ A: 30 ngày trước đó
                startB = today.minusDays(29);
                endB = today;
                startA = today.minusDays(59);
                endA = today.minusDays(30);
                if (labelA == null || labelA.isBlank()) labelA = "30 ngày trước (" + startA.format(SHORT_DATE_FORMATTER) + " - " + endA.format(SHORT_DATE_FORMATTER) + ")";
                if (labelB == null || labelB.isBlank()) labelB = "30 ngày qua (" + startB.format(SHORT_DATE_FORMATTER) + " - " + endB.format(SHORT_DATE_FORMATTER) + ")";
            }
            case "THIS_YEAR_VS_LAST_YEAR" -> {
                // Kỳ B: Năm nay, Kỳ A: Cùng kỳ năm trước
                startB = today.withDayOfYear(1);
                endB = today;
                startA = today.minusYears(1).withDayOfYear(1);
                endA = today.minusYears(1).withDayOfYear(Math.min(today.getDayOfYear(), today.minusYears(1).lengthOfYear()));
                if (labelA == null || labelA.isBlank()) labelA = "Năm " + (today.getYear() - 1) + " (cùng kỳ)";
                if (labelB == null || labelB.isBlank()) labelB = "Năm nay (" + today.getYear() + ")";
            }
            default -> {
                startA = request.getStartDateA() != null ? request.getStartDateA() : today.minusDays(1);
                endA = request.getEndDateA() != null ? request.getEndDateA() : startA;
                startB = request.getStartDateB() != null ? request.getStartDateB() : today;
                endB = request.getEndDateB() != null ? request.getEndDateB() : startB;

                if (labelA == null || labelA.isBlank()) {
                    labelA = startA.isEqual(endA) ? "Ngày " + startA.format(SHORT_DATE_FORMATTER) : startA.format(SHORT_DATE_FORMATTER) + " - " + endA.format(SHORT_DATE_FORMATTER);
                }
                if (labelB == null || labelB.isBlank()) {
                    labelB = startB.isEqual(endB) ? "Ngày " + startB.format(SHORT_DATE_FORMATTER) : startB.format(SHORT_DATE_FORMATTER) + " - " + endB.format(SHORT_DATE_FORMATTER);
                }
            }
        }

        // 2. Tính số liệu thực tế từng kỳ
        DashboardPeriodStat statA = calculatePeriodStat(labelA, startA, endA);
        DashboardPeriodStat statB = calculatePeriodStat(labelB, startB, endB);

        // 3. Tính độ lệch và % tăng trưởng
        BigDecimal revenueDiff = statB.getTotalRevenue().subtract(statA.getTotalRevenue());
        Double revenueGrowthRate = calculateGrowthRate(statA.getTotalRevenue(), statB.getTotalRevenue());

        long ordersDiff = statB.getTotalOrders() - statA.getTotalOrders();
        Double ordersGrowthRate = calculateOrdersGrowthRate(statA.getTotalOrders(), statB.getTotalOrders());

        double completionRateDiff = Math.round((statB.getCompletionRate() - statA.getCompletionRate()) * 10.0) / 10.0;

        // 4. Sinh nhận định và đánh giá từ AI
        AiAnalysisResult aiAnalysis = generateAiEvaluation(statA, statB, revenueDiff, revenueGrowthRate, ordersDiff, ordersGrowthRate, completionRateDiff);

        return DashboardAiCompareResponse.builder()
                .periodA(statA)
                .periodB(statB)
                .revenueDiff(revenueDiff)
                .revenueGrowthRate(revenueGrowthRate)
                .ordersDiff(ordersDiff)
                .ordersGrowthRate(ordersGrowthRate)
                .completionRateDiff(completionRateDiff)
                .aiSummary(aiAnalysis.summary)
                .aiDetailedAnalysis(aiAnalysis.detailedAnalysis)
                .aiHighlights(aiAnalysis.highlights)
                .aiWarnings(aiAnalysis.warnings)
                .aiRecommendations(aiAnalysis.recommendations)
                .provider(aiAnalysis.provider)
                .build();
    }

    private DashboardPeriodStat calculatePeriodStat(String label, LocalDate start, LocalDate end) {
        LocalDateTime startDt = start.atStartOfDay();
        LocalDateTime endDt = end.atTime(LocalTime.MAX);

        List<Order> orders = orderRepository.findOrdersBetweenDates(startDt, endDt);

        long totalOrders = orders.size();
        long completedOrders = 0;
        long cancelledOrders = 0;
        BigDecimal totalRevenue = BigDecimal.ZERO;
        Map<String, Integer> productCountMap = new HashMap<>();

        for (Order o : orders) {
            if (o.getStatus() == OrderStatus.CANCELLED) {
                cancelledOrders++;
            } else {
                BigDecimal orderPrice = o.getTotalAmount() != null ? o.getTotalAmount() : BigDecimal.ZERO;
                totalRevenue = totalRevenue.add(orderPrice);

                if (o.getStatus() == OrderStatus.COMPLETED) {
                    completedOrders++;
                }

                if (o.getOrderItems() != null) {
                    for (OrderItem item : o.getOrderItems()) {
                        String name = (item.getProduct() != null && item.getProduct().getName() != null)
                                ? item.getProduct().getName()
                                : "Sản phẩm #" + (item.getProduct() != null ? item.getProduct().getId() : item.getId());
                        int qty = item.getQuantity() != null ? item.getQuantity() : 1;
                        productCountMap.put(name, productCountMap.getOrDefault(name, 0) + qty);
                    }
                }
            }
        }

        double completionRate = totalOrders > 0
                ? Math.round((completedOrders * 1000.0) / totalOrders) / 10.0
                : 0.0;

        long validCount = totalOrders - cancelledOrders;
        BigDecimal aov = validCount > 0
                ? totalRevenue.divide(BigDecimal.valueOf(validCount), 0, RoundingMode.HALF_UP)
                : BigDecimal.ZERO;

        List<String> topSelling = productCountMap.entrySet().stream()
                .sorted((e1, e2) -> Integer.compare(e2.getValue(), e1.getValue()))
                .limit(3)
                .map(e -> e.getKey() + " (" + e.getValue() + " sp)")
                .toList();

        return DashboardPeriodStat.builder()
                .label(label)
                .startDate(start)
                .endDate(end)
                .totalRevenue(totalRevenue)
                .totalOrders(totalOrders)
                .completedOrders(completedOrders)
                .cancelledOrders(cancelledOrders)
                .completionRate(completionRate)
                .averageOrderValue(aov)
                .topSellingProducts(topSelling)
                .build();
    }

    private Double calculateGrowthRate(BigDecimal valA, BigDecimal valB) {
        if (valA == null || valB == null) return 0.0;
        if (valA.compareTo(BigDecimal.ZERO) == 0) {
            return valB.compareTo(BigDecimal.ZERO) > 0 ? 100.0 : 0.0;
        }
        BigDecimal diff = valB.subtract(valA);
        BigDecimal rate = diff.multiply(BigDecimal.valueOf(100)).divide(valA, 1, RoundingMode.HALF_UP);
        return rate.doubleValue();
    }

    private Double calculateOrdersGrowthRate(long countA, long countB) {
        if (countA == 0) {
            return countB > 0 ? 100.0 : 0.0;
        }
        double rate = ((double) (countB - countA) * 100.0) / countA;
        return Math.round(rate * 10.0) / 10.0;
    }

    private record AiAnalysisResult(
            String summary,
            String detailedAnalysis,
            List<String> highlights,
            List<String> warnings,
            List<String> recommendations,
            String provider
    ) {}

    private AiAnalysisResult generateAiEvaluation(
            DashboardPeriodStat a,
            DashboardPeriodStat b,
            BigDecimal revDiff,
            Double revRate,
            long orderDiff,
            Double orderRate,
            double compDiff
    ) {
        String apiKey = geminiProperties != null ? geminiProperties.getApiKey() : null;
        if (apiKey != null && !apiKey.isBlank()) {
            try {
                String model = (geminiProperties.getModel() != null && !geminiProperties.getModel().isBlank())
                        ? geminiProperties.getModel()
                        : "gemini-3.5-flash";

                String prompt = buildAiComparisonPrompt(a, b, revDiff, revRate, orderDiff, orderRate, compDiff);
                String url = GEMINI_API_BASE_URL + model + ":generateContent?key=" + apiKey;

                Map<String, Object> textPart = new HashMap<>();
                textPart.put("text", prompt);

                Map<String, Object> contentMap = new HashMap<>();
                contentMap.put("parts", Collections.singletonList(textPart));

                Map<String, Object> requestBody = new HashMap<>();
                requestBody.put("contents", Collections.singletonList(contentMap));

                HttpHeaders headers = new HttpHeaders();
                headers.setContentType(MediaType.APPLICATION_JSON);

                HttpEntity<Map<String, Object>> requestEntity = new HttpEntity<>(requestBody, headers);

                @SuppressWarnings("rawtypes")
                ResponseEntity<Map> response = restTemplate.postForEntity(url, requestEntity, Map.class);

                if (response.getStatusCode().is2xxSuccessful() && response.getBody() != null) {
                    String rawText = extractTextFromGeminiResponse(response.getBody());
                    if (rawText != null && !rawText.isBlank()) {
                        AiAnalysisResult result = parseGeminiComparisonText(rawText);
                        if (result != null) {
                            return result;
                        }
                    }
                }
            } catch (Exception e) {
                log.warn("[Gemini AI] Lỗi phân tích so sánh dashboard: {}", e.getMessage());
            }
        }

        // Fallback rule-based engine
        return buildRuleBasedAiEvaluation(a, b, revDiff, revRate, orderDiff, orderRate, compDiff);
    }

    private String buildAiComparisonPrompt(
            DashboardPeriodStat a,
            DashboardPeriodStat b,
            BigDecimal revDiff,
            Double revRate,
            long orderDiff,
            Double orderRate,
            double compDiff
    ) {
        NumberFormat nf = NumberFormat.getInstance(new Locale("vi", "VN"));
        return "BẠN LÀ CHUYÊN GIA CỐ VẤN KINH DOANH VÀ TĂNG TRƯỞNG E-COMMERCE CAO CẤP CỦA THƯƠNG HIỆU THỜI TRANG FUNNYSHOP.\n" +
                "Nhiệm vụ của bạn là đánh giá, so sánh hai mốc/khoảng thời gian kinh doanh dưới đây để giúp Admin đưa ra quyết định kinh doanh chuẩn xác.\n\n" +
                "--- DỮ LIỆU ĐỐI SOÁT ---\n" +
                "- KỲ A (Gốc): " + a.getLabel() + " [" + a.getStartDate() + " đến " + a.getEndDate() + "]\n" +
                "  + Doanh thu: " + nf.format(a.getTotalRevenue()) + " VNĐ\n" +
                "  + Tổng số đơn: " + a.getTotalOrders() + " (Thành công: " + a.getCompletedOrders() + ", Hủy: " + a.getCancelledOrders() + ")\n" +
                "  + Tỷ lệ hoàn thành: " + a.getCompletionRate() + "%\n" +
                "  + Giá trị đơn TB (AOV): " + nf.format(a.getAverageOrderValue()) + " VNĐ\n" +
                "  + Top sản phẩm bán chạy: " + String.join(", ", a.getTopSellingProducts()) + "\n\n" +
                "- KỲ B (So sánh): " + b.getLabel() + " [" + b.getStartDate() + " đến " + b.getEndDate() + "]\n" +
                "  + Doanh thu: " + nf.format(b.getTotalRevenue()) + " VNĐ\n" +
                "  + Tổng số đơn: " + b.getTotalOrders() + " (Thành công: " + b.getCompletedOrders() + ", Hủy: " + b.getCancelledOrders() + ")\n" +
                "  + Tỷ lệ hoàn thành: " + b.getCompletionRate() + "%\n" +
                "  + Giá trị đơn TB (AOV): " + nf.format(b.getAverageOrderValue()) + " VNĐ\n" +
                "  + Top sản phẩm bán chạy: " + String.join(", ", b.getTopSellingProducts()) + "\n\n" +
                "- BIẾN ĐỘNG:\n" +
                "  + Chênh lệch doanh thu: " + (revDiff.compareTo(BigDecimal.ZERO) >= 0 ? "+" : "") + nf.format(revDiff) + " VNĐ (" + (revRate >= 0 ? "+" : "") + revRate + "%)\n" +
                "  + Chênh lệch đơn hàng: " + (orderDiff >= 0 ? "+" : "") + orderDiff + " đơn (" + (orderRate >= 0 ? "+" : "") + orderRate + "%)\n" +
                "  + Chênh lệch tỷ lệ hoàn thành: " + (compDiff >= 0 ? "+" : "") + compDiff + "%\n\n" +
                "YÊU CẦU ĐẦU RA:\n" +
                "Chỉ trả về DUY NHẤT một chuỗi JSON hợp lệ (không kèm markdown ```json ... ```) có cấu trúc sau:\n" +
                "{\n" +
                "  \"summary\": \"Tóm tắt đánh giá ngắn gọn trong 2-3 câu về xu hướng chung (tăng trưởng tích cực, chững lại hay giảm sút).\",\n" +
                "  \"detailedAnalysis\": \"Đoạn văn phân tích cụ thể 3-5 câu về biến động doanh thu, sức mua đơn hàng, giá trị giỏ hàng AOV và các mặt hàng dẫn dắt doanh số.\",\n" +
                "  \"highlights\": [\"Điểm sáng 1\", \"Điểm sáng 2\"],\n" +
                "  \"warnings\": [\"Cảnh báo hoặc điểm cần lưu tâm (nếu có)\"],\n" +
                "  \"recommendations\": [\"Khuyến nghị chiến lược 1 (tiếp thị/khuyến mãi)\", \"Khuyến nghị 2 (kho/sản phẩm)\", \"Khuyến nghị 3 (chăm sóc khách/vận hành)\"]\n" +
                "}";
    }

    private String extractTextFromGeminiResponse(Map<?, ?> body) {
        try {
            List<?> candidates = (List<?>) body.get("candidates");
            if (candidates != null && !candidates.isEmpty()) {
                Map<?, ?> candidate = (Map<?, ?>) candidates.get(0);
                Map<?, ?> content = (Map<?, ?>) candidate.get("content");
                if (content != null) {
                    List<?> parts = (List<?>) content.get("parts");
                    if (parts != null && !parts.isEmpty()) {
                        Map<?, ?> part = (Map<?, ?>) parts.get(0);
                        Object text = part.get("text");
                        return text != null ? String.valueOf(text) : "";
                    }
                }
            }
        } catch (Exception e) {
            log.warn("[Gemini AI] Lỗi trích xuất text phản hồi: {}", e.getMessage());
        }
        return null;
    }

    private AiAnalysisResult parseGeminiComparisonText(String rawText) {
        try {
            String text = rawText.trim();
            if (text.startsWith("```json")) {
                text = text.substring(7);
            } else if (text.startsWith("```")) {
                text = text.substring(3);
            }
            if (text.endsWith("```")) {
                text = text.substring(0, text.length() - 3);
            }
            text = text.trim();

            String summary = extractJsonField(text, "summary");
            String detailed = extractJsonField(text, "detailedAnalysis");
            List<String> highlights = extractJsonArray(text, "highlights");
            List<String> warnings = extractJsonArray(text, "warnings");
            List<String> recommendations = extractJsonArray(text, "recommendations");

            if (summary != null && !summary.isBlank()) {
                return new AiAnalysisResult(
                        summary,
                        (detailed != null && !detailed.isBlank()) ? detailed : summary,
                        highlights,
                        warnings,
                        recommendations,
                        "Gemini AI"
                );
            }
        } catch (Exception e) {
            log.warn("[Gemini AI] Lỗi phân tích chuỗi JSON AI: {}", e.getMessage());
        }
        return null;
    }

    private String extractJsonField(String json, String field) {
        Pattern pattern = Pattern.compile("\"" + field + "\"\\s*:\\s*\"(.*?)(?<!\\\\)\"", Pattern.DOTALL);
        Matcher matcher = pattern.matcher(json);
        if (matcher.find()) {
            return matcher.group(1).replace("\\\"", "\"").replace("\\n", "\n").trim();
        }
        return null;
    }

    private List<String> extractJsonArray(String json, String field) {
        List<String> result = new ArrayList<>();
        Pattern pattern = Pattern.compile("\"" + field + "\"\\s*:\\s*\\[(.*?)\\]", Pattern.DOTALL);
        Matcher matcher = pattern.matcher(json);
        if (matcher.find()) {
            String arrayContent = matcher.group(1);
            Pattern itemPattern = Pattern.compile("\"(.*?)(?<!\\\\)\"", Pattern.DOTALL);
            Matcher itemMatcher = itemPattern.matcher(arrayContent);
            while (itemMatcher.find()) {
                result.add(itemMatcher.group(1).replace("\\\"", "\"").replace("\\n", "\n").trim());
            }
        }
        return result;
    }

    private AiAnalysisResult buildRuleBasedAiEvaluation(
            DashboardPeriodStat a,
            DashboardPeriodStat b,
            BigDecimal revDiff,
            Double revRate,
            long orderDiff,
            Double orderRate,
            double compDiff
    ) {
        NumberFormat nf = NumberFormat.getInstance(new Locale("vi", "VN"));
        String diffSign = revDiff.compareTo(BigDecimal.ZERO) >= 0 ? "+" : "";
        String rateSign = revRate >= 0 ? "+" : "";

        String summary;
        String detailed;
        List<String> highlights = new ArrayList<>();
        List<String> warnings = new ArrayList<>();
        List<String> recs = new ArrayList<>();

        if (revRate > 10.0) {
            summary = String.format("Hiệu suất kinh doanh tại %s bứt phá vượt bậc so với %s, ghi nhận doanh thu tăng trưởng ấn tượng %s%s%% (tương ứng %s%s VNĐ). Lực mua của khách hàng có xu hướng gia tăng mạnh mẽ.",
                    b.getLabel(), a.getLabel(), rateSign, revRate, diffSign, nf.format(revDiff));
            highlights.add(String.format("Doanh thu tăng trưởng mạnh mẽ đạt mốc %s VNĐ (%s%s%%).", nf.format(b.getTotalRevenue()), rateSign, revRate));
            if (orderRate > 0) {
                highlights.add(String.format("Số lượng đơn hàng tăng thêm %d đơn (+%.1f%%), phản ánh sức hấp dẫn của các chiến dịch xúc tiến.", orderDiff, orderRate));
            }
            if (b.getAverageOrderValue().compareTo(a.getAverageOrderValue()) > 0) {
                highlights.add(String.format("Giá trị trung bình mỗi đơn (AOV) tăng lên %s VNĐ, cho thấy khách hàng có xu hướng chọn giỏ hàng giá trị cao hơn.", nf.format(b.getAverageOrderValue())));
            }
            recs.add("Duy trì đà tăng trưởng bằng cách tiếp tục đẩy mạnh các sản phẩm chủ lực và chạy quảng cáo nhắm mục tiêu vào các khung giờ vàng.");
            recs.add("Chủ động rà soát tồn kho để đảm bảo nguồn cung cho các mẫu trang phục đang bán chạy nhất.");
            recs.add("Tận dụng tệp khách hàng mua mới trong kỳ để gửi voucher tri ân thông qua hệ thống thông báo FunnyShop.");
        } else if (revRate >= -5.0 && revRate <= 10.0) {
            summary = String.format("Chỉ số kinh doanh giữa %s và %s duy trì ở mức tương đối ổn định (biến động %s%s%% doanh thu). Hoạt động bán hàng diễn ra đều đặn, không có đột biến bất thường.",
                    b.getLabel(), a.getLabel(), rateSign, revRate);
            highlights.add(String.format("Doanh thu giữ nhịp ổn định ở mức %s VNĐ với tổng cộng %d đơn hàng phát sinh.", nf.format(b.getTotalRevenue()), b.getTotalOrders()));
            if (b.getCompletionRate() >= 80.0) {
                highlights.add(String.format("Tỷ lệ đơn hàng hoàn thành đạt %.1f%%, chứng minh khâu đóng gói và vận chuyển hoạt động hiệu quả.", b.getCompletionRate()));
            }
            warnings.add("Doanh thu chưa có bước đột phá rõ rệt; cần thêm các cú hích về khuyến mãi chớp nhoáng (Flash Sale) để kích thích nhu cầu mua sắm.");
            recs.add("Tạo thêm các combo ưu đãi (mua kèm áo + quần hoặc mua 2 giảm giá) để tăng giá trị đơn hàng trung bình (AOV).");
            recs.add("Thử nghiệm phát hành voucher giảm giá khung giờ giới hạn để kích cầu người mua.");
        } else {
            summary = String.format("Kết quả kinh doanh tại %s có dấu hiệu suy giảm so với %s, doanh thu sụt giảm %s%s%% (hụt %s VNĐ). Quản trị viên cần nhanh chóng rà soát các khâu tiếp thị và chuyển đổi đơn hàng.",
                    b.getLabel(), a.getLabel(), rateSign, revRate, nf.format(revDiff.abs()));
            warnings.add(String.format("Doanh thu giảm %s VNĐ so với kỳ trước; lượng đơn hàng biến động %s%s đơn.", nf.format(revDiff.abs()), orderDiff >= 0 ? "+" : "", orderDiff));
            if (b.getCancelledOrders() > 0) {
                warnings.add(String.format("Ghi nhận %d đơn hàng bị hủy trong kỳ này. Cần kiểm tra nguyên nhân do thời gian xác nhận chậm hay do phí vận chuyển.", b.getCancelledOrders()));
            }
            if (b.getTopSellingProducts() != null && !b.getTopSellingProducts().isEmpty()) {
                highlights.add("Vẫn duy trì được lượt mua ở nhóm sản phẩm chủ lực: " + String.join(", ", b.getTopSellingProducts()));
            }
            recs.add("Kích hoạt ngay chương trình khuyến mãi đặc quyền, giảm giá sâu cho top sản phẩm có tỷ lệ quan tâm cao.");
            recs.add("Gửi thông báo ưu đãi hấp dẫn tới toàn bộ người dùng thông qua trang Quản lý thông báo.");
            recs.add("Tối ưu hóa quy trình xác nhận đơn hàng để giảm thiểu tỷ lệ hủy đơn.");
        }

        detailed = String.format("So sánh chi tiết cho thấy tại %s, shop thu về %s VNĐ từ %d đơn hàng (AOV đạt %s VNĐ/đơn) so với %s VNĐ từ %d đơn tại %s. Tỷ lệ hoàn thành đạt %.1f%% (chênh lệch %s%.1f%%). Việc điều chỉnh chiến lược tiếp thị kịp thời sẽ là chìa khóa để tối ưu doanh số trong giai đoạn tiếp theo.",
                b.getLabel(), nf.format(b.getTotalRevenue()), b.getTotalOrders(), nf.format(b.getAverageOrderValue()),
                nf.format(a.getTotalRevenue()), a.getTotalOrders(), a.getLabel(), b.getCompletionRate(), compDiff >= 0 ? "+" : "", compDiff);

        return new AiAnalysisResult(summary, detailed, highlights, warnings, recs, "FunnyShop AI Analyst");
    }
}
