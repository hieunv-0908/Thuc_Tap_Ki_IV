package com.funnyshop.exception;

import com.funnyshop.dto.response.ApiResponse;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.AccessDeniedException;

import static org.junit.jupiter.api.Assertions.*;

class GlobalHandleExceptionTest {

    private GlobalHandleException handler;

    @BeforeEach
    void setUp() {
        handler = new GlobalHandleException();
    }

    @Test
    @DisplayName("handleAppException - Trả đúng mã status và code từ AppException")
    void handleAppException_Success() {
        AppException ex = new AppException("Tài nguyên không hợp lệ", HttpStatus.CONFLICT, 409);

        ResponseEntity<ApiResponse<Object>> response = handler.handleAppException(ex);

        assertEquals(HttpStatus.CONFLICT, response.getStatusCode());
        assertNotNull(response.getBody());
        assertEquals(409, response.getBody().getCode());
        assertEquals("Tài nguyên không hợp lệ", response.getBody().getMessage());
    }

    @Test
    @DisplayName("handleIllegalArgumentException - Trả về mã 400 Bad Request")
    void handleIllegalArgumentException_Success() {
        IllegalArgumentException ex = new IllegalArgumentException("Tham số page không hợp lệ");

        ResponseEntity<ApiResponse<Object>> response = handler.handleIllegalArgumentException(ex);

        assertEquals(HttpStatus.BAD_REQUEST, response.getStatusCode());
        assertNotNull(response.getBody());
        assertEquals(400, response.getBody().getCode());
        assertEquals("Tham số page không hợp lệ", response.getBody().getMessage());
    }

    @Test
    @DisplayName("handleAccessDeniedException - Trả về mã 403 Forbidden")
    void handleAccessDeniedException_Success() {
        AccessDeniedException ex = new AccessDeniedException("Từ chối truy cập");

        ResponseEntity<ApiResponse<Object>> response = handler.handleAccessDeniedException(ex);

        assertEquals(HttpStatus.FORBIDDEN, response.getStatusCode());
        assertNotNull(response.getBody());
        assertEquals(403, response.getBody().getCode());
        assertEquals("Bạn không có quyền truy cập tài nguyên này!", response.getBody().getMessage());
    }

    @Test
    @DisplayName("handleGeneralException - Trả về mã 500 Internal Server Error")
    void handleGeneralException_Success() {
        RuntimeException ex = new RuntimeException("Database timeout");

        ResponseEntity<ApiResponse<Object>> response = handler.handleGeneralException(ex);

        assertEquals(HttpStatus.INTERNAL_SERVER_ERROR, response.getStatusCode());
        assertNotNull(response.getBody());
        assertEquals(500, response.getBody().getCode());
        assertTrue(response.getBody().getMessage().contains("Database timeout"));
    }
}

