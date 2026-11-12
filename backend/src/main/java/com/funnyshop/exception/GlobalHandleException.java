package com.funnyshop.exception;

import com.funnyshop.dto.response.ApiResponse;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.validation.FieldError;
import org.springframework.web.bind.MethodArgumentNotValidException;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;
import org.springframework.web.server.ResponseStatusException;
import org.springframework.http.converter.HttpMessageNotReadableException;

import java.util.HashMap;
import java.util.Map;

@Slf4j
@RestControllerAdvice
public class GlobalHandleException {

    @ExceptionHandler(AppException.class)
    public ResponseEntity<ApiResponse<Object>> handleAppException(AppException ex) {
        log.error("AppException: {}", ex.getMessage());
        ApiResponse<Object> response = ApiResponse.builder()
                .code(ex.getCode())
                .message(ex.getMessage())
                .build();
        return ResponseEntity.status(ex.getStatus()).body(response);
    }

    @ExceptionHandler(IllegalArgumentException.class)
    public ResponseEntity<ApiResponse<Object>> handleIllegalArgumentException(IllegalArgumentException ex) {
        log.error("IllegalArgumentException: {}", ex.getMessage());
        ApiResponse<Object> response = ApiResponse.builder()
                .code(HttpStatus.BAD_REQUEST.value())
                .message(ex.getMessage())
                .build();
        return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(response);
    }

    @ExceptionHandler(MethodArgumentNotValidException.class)
    public ResponseEntity<ApiResponse<Map<String, String>>> handleValidationException(MethodArgumentNotValidException ex) {
        log.error("Validation failed: {}", ex.getMessage());
        Map<String, String> errors = new HashMap<>();
        ex.getBindingResult().getAllErrors().forEach(error -> {
            String fieldName = ((FieldError) error).getField();
            String errorMessage = error.getDefaultMessage();
            errors.put(fieldName, errorMessage);
        });

        ApiResponse<Map<String, String>> response = ApiResponse.<Map<String, String>>builder()
                .code(HttpStatus.BAD_REQUEST.value())
                .message("Dữ liệu đầu vào không hợp lệ!")
                .data(errors)
                .build();
        return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(response);
    }

    @ExceptionHandler(AccessDeniedException.class)
    public ResponseEntity<ApiResponse<Object>> handleAccessDeniedException(AccessDeniedException ex) {
        log.error("AccessDeniedException: {}", ex.getMessage());
        ApiResponse<Object> response = ApiResponse.builder()
                .code(HttpStatus.FORBIDDEN.value())
                .message("Bạn không có quyền truy cập tài nguyên này!")
                .build();
        return ResponseEntity.status(HttpStatus.FORBIDDEN).body(response);
    }

    @ExceptionHandler(ResponseStatusException.class)
    public ResponseEntity<ApiResponse<Object>> handleResponseStatusException(
            ResponseStatusException ex) {

        log.warn("ResponseStatusException: {}", ex.getReason());

        HttpStatus status = HttpStatus.valueOf(ex.getStatusCode().value());

        ApiResponse<Object> response = ApiResponse.builder()
                .code(status.value())
                .message(ex.getReason())
                .build();

        return ResponseEntity.status(status).body(response);
    }

    @ExceptionHandler({
            org.springframework.dao.PessimisticLockingFailureException.class,
            org.springframework.dao.CannotAcquireLockException.class
    })
    public ResponseEntity<ApiResponse<Object>> handleLockTimeoutException(Exception ex) {
        log.warn("Xung đột khóa bản ghi hoặc Lock Timeout: {}", ex.getMessage());
        ApiResponse<Object> response = ApiResponse.builder()
                .code(HttpStatus.CONFLICT.value())
                .message("Đơn hàng đang được hệ thống xử lý, vui lòng thử lại sau ít giây.")
                .build();
        return ResponseEntity.status(HttpStatus.CONFLICT).body(response);
    }

    @ExceptionHandler(Exception.class)
    public ResponseEntity<ApiResponse<Object>> handleGeneralException(Exception ex) {
        log.error("Unhandled Exception: ", ex);
        ApiResponse<Object> response = ApiResponse.builder()
                .code(HttpStatus.INTERNAL_SERVER_ERROR.value())
                .message("Đã xảy ra lỗi hệ thống: " + ex.getMessage())
                .build();
        return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(response);
    }

    @ExceptionHandler(HttpMessageNotReadableException.class)
    public ResponseEntity<ApiResponse<Void>> handleHttpMessageNotReadable(
            HttpMessageNotReadableException ex) {

        ApiResponse<Void> response = new ApiResponse<>();
        response.setCode(400);
        response.setMessage("Dữ liệu gửi lên không hợp lệ!");

        return ResponseEntity.badRequest().body(response);
    }
}
