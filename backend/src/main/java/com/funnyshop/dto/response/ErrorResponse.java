package com.funnyshop.dto.response;

import com.fasterxml.jackson.annotation.JsonInclude;
import lombok.Builder;
import lombok.Data;

import java.util.Map;

@Data
@Builder
@JsonInclude(JsonInclude.Include.NON_NULL)
public class ErrorResponse {
    private int status;          // Mã HTTP Status (400, 404, 500,...)
    private String error;        // Tên loại lỗi (Bad Request, Internal Server Error,...)
    private String message;      // Thông báo lỗi thân thiện bằng tiếng Việt
    private String path;         // Đường dẫn API xảy ra lỗi
    private long timestamp;      // Thời gian xảy ra lỗi
    private Map<String, String> errors; // Danh sách chi tiết lỗi (thường dùng cho Validation đầu vào)
}
