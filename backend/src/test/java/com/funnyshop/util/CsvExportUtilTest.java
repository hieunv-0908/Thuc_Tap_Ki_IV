package com.funnyshop.util;

import com.funnyshop.enums.OrderStatus;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;

import java.io.IOException;
import java.io.StringWriter;
import java.math.BigDecimal;
import java.time.LocalDateTime;

import static org.junit.jupiter.api.Assertions.*;

class CsvExportUtilTest {

    @Test
    @DisplayName("writeBom: Ghi ký tự BOM \\uFEFF chính xác vào đầu luồng")
    void testWriteBom() throws IOException {
        StringWriter writer = new StringWriter();
        CsvExportUtil.writeBom(writer);
        assertEquals("\uFEFF", writer.toString());
    }

    @Test
    @DisplayName("escapeCsv: Escape dấu phẩy, nháy kép và xuống dòng chuẩn RFC 4180")
    void testEscapeCsv() {
        // Chuỗi bình thường không cần escape
        assertEquals("Funny T-Shirt", CsvExportUtil.escapeCsv("Funny T-Shirt"));

        // Null an toàn trả về rỗng
        assertEquals("", CsvExportUtil.escapeCsv(null));

        // Chuỗi có dấu phẩy phải được bọc trong nháy kép
        assertEquals("\"Số 10, Cầu Giấy, Hà Nội\"", CsvExportUtil.escapeCsv("Số 10, Cầu Giấy, Hà Nội"));

        // Chuỗi có nháy kép phải nhân đôi nháy kép và bọc trong nháy
        assertEquals("\"Áo thun \"\"Funny\"\" 100% Cotton\"", CsvExportUtil.escapeCsv("Áo thun \"Funny\" 100% Cotton"));

        // Chuỗi có xuống dòng
        assertEquals("\"Dòng 1\nDòng 2\"", CsvExportUtil.escapeCsv("Dòng 1\nDòng 2"));
    }

    @Test
    @DisplayName("writeRow: Ghi đầy đủ các cột và kết thúc bằng \\r\\n")
    void testWriteRow() throws IOException {
        StringWriter writer = new StringWriter();
        CsvExportUtil.writeRow(writer, 1, "Nguyễn Văn A", "0912345678", "Hà Nội, VN");

        String expected = "1,Nguyễn Văn A,0912345678,\"Hà Nội, VN\"\r\n";
        assertEquals(expected, writer.toString());
    }

    @Test
    @DisplayName("getOrderStatusLabel: Việt hóa chính xác các trạng thái đơn hàng")
    void testGetOrderStatusLabel() {
        assertEquals("Chờ xử lý", CsvExportUtil.getOrderStatusLabel(OrderStatus.PENDING));
        assertEquals("Đang giao hàng", CsvExportUtil.getOrderStatusLabel(OrderStatus.SHIPPING));
        assertEquals("Hoàn thành", CsvExportUtil.getOrderStatusLabel(OrderStatus.COMPLETED));
        assertEquals("Đã hủy", CsvExportUtil.getOrderStatusLabel(OrderStatus.CANCELLED));
    }

    @Test
    @DisplayName("formatCurrency: Định dạng BigDecimal chuẩn xác không thừa số 0")
    void testFormatCurrency() {
        assertEquals("500000", CsvExportUtil.formatCurrency(BigDecimal.valueOf(500000.00)));
        assertEquals("0", CsvExportUtil.formatCurrency(null));
    }
}

