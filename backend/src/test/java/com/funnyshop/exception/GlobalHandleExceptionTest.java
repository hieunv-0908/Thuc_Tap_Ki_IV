package com.funnyshop.exception;

import com.funnyshop.dto.response.ApiResponse;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.security.authentication.BadCredentialsException;

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
        IllegalArgumentException ex = new IllegalArgumentException("Tham số không hợp lệ");

        ResponseEntity<ApiResponse<Object>> response = handler.handleIllegalArgumentException(ex);

        assertEquals(HttpStatus.BAD_REQUEST, response.getStatusCode());
        assertNotNull(response.getBody());
        assertEquals(400, response.getBody().getCode());
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
    @DisplayName("handleBadCredentialsException - Trả về mã 401 Unauthorized và thông báo chuẩn")
    void handleBadCredentialsException_Success() {
        BadCredentialsException ex = new BadCredentialsException("Bad credentials");

        ResponseEntity<ApiResponse<Object>> response = handler.handleBadCredentialsException(ex);

        assertEquals(HttpStatus.UNAUTHORIZED, response.getStatusCode());
        assertNotNull(response.getBody());
        assertEquals(401, response.getBody().getCode());
        assertEquals("Tên đăng nhập hoặc mật khẩu không chính xác!", response.getBody().getMessage());
    }

    @Test
    @DisplayName("handleDataIntegrityViolationException - Trả về mã 409 Conflict và thông báo chuẩn")
    void handleDataIntegrityViolationException_Success() {
        DataIntegrityViolationException ex = new DataIntegrityViolationException("FK constraint violation");

        ResponseEntity<ApiResponse<Object>> response = handler.handleDataIntegrityViolationException(ex);

        assertEquals(HttpStatus.CONFLICT, response.getStatusCode());
        assertNotNull(response.getBody());
        assertEquals(409, response.getBody().getCode());
        assertFalse(response.getBody().getMessage().contains("FK constraint"));
    }

    @Test
    @DisplayName("handleGeneralException - Trả về mã 500 và không làm lộ thông tin lỗi hệ thống ra ngoài")
    void handleGeneralException_Success() {
        RuntimeException ex = new RuntimeException("Sensitive database timeout info");

        ResponseEntity<ApiResponse<Object>> response = handler.handleGeneralException(ex);

        assertEquals(HttpStatus.INTERNAL_SERVER_ERROR, response.getStatusCode());
        assertNotNull(response.getBody());
        assertEquals(500, response.getBody().getCode());
        assertEquals("Đã có lỗi xảy ra từ hệ thống, vui lòng thử lại sau!", response.getBody().getMessage());
        assertFalse(response.getBody().getMessage().contains("Sensitive database timeout info"));
    }
}
