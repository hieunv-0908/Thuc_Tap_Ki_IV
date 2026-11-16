package com.funnyshop.util;

import com.funnyshop.enums.OrderStatus;

import java.io.IOException;
import java.io.Writer;
import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;

public final class CsvExportUtil {

    // Ký tự Byte Order Mark (BOM) định dạng UTF-8 (0xEF, 0xBB, 0xBF)
    // Giúp Microsoft Excel trên Windows nhận diện đúng bảng mã UTF-8 tiếng Việt
    public static final String UTF8_BOM = "\uFEFF";

    private static final DateTimeFormatter DATE_TIME_FORMATTER = DateTimeFormatter.ofPattern("yyyy-MM-dd HH:mm:ss");
    private static final DateTimeFormatter FILE_TIMESTAMP_FORMATTER = DateTimeFormatter.ofPattern("yyyyMMdd_HHmmss");

    private CsvExportUtil() {
    }

    public static void writeBom(Writer writer) throws IOException {
        writer.write(UTF8_BOM);
    }

    public static String escapeCsv(Object value) {
        if (value == null) {
            return "";
        }
        String str = String.valueOf(value);
        boolean containsSpecialChar = str.contains(",") || str.contains("\"")
                || str.contains("\n") || str.contains("\r");

        if (containsSpecialChar) {
            return "\"" + str.replace("\"", "\"\"") + "\"";
        }
        return str;
    }

    public static void writeRow(Writer writer, Object... values) throws IOException {
        StringBuilder sb = new StringBuilder();
        for (int i = 0; i < values.length; i++) {
            if (i > 0) {
                sb.append(",");
            }
            sb.append(escapeCsv(values[i]));
        }
        sb.append("\r\n");
        writer.write(sb.toString());
    }

    public static String formatDateTime(LocalDateTime dt) {
        if (dt == null) {
            return "";
        }
        return dt.format(DATE_TIME_FORMATTER);
    }

    public static String formatCurrency(BigDecimal amount) {
        if (amount == null) {
            return "0";
        }
        return amount.stripTrailingZeros().toPlainString();
    }

    public static String formatFileTimestamp(LocalDateTime dt) {
        if (dt == null) {
            dt = LocalDateTime.now();
        }
        return dt.format(FILE_TIMESTAMP_FORMATTER);
    }

    public static String getOrderStatusLabel(OrderStatus status) {
        if (status == null) {
            return "";
        }
        return switch (status) {
            case PENDING -> "Chờ xử lý";
            case PROCESSING -> "Đang đóng gói";
            case SHIPPING -> "Đang giao hàng";
            case COMPLETED -> "Hoàn thành";
            case CANCELLED -> "Đã hủy";
        };
    }
}
