package com.funnyshop.security.blacklist;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;

import static org.junit.jupiter.api.Assertions.*;

class InMemoryTokenBlacklistServiceTest {

    private InMemoryTokenBlacklistService blacklistService;

    @BeforeEach
    void setUp() {
        blacklistService = new InMemoryTokenBlacklistService();
    }

    @Test
    @DisplayName("blacklistToken - Đưa token vào danh sách đen và kiểm tra isBlacklisted trả về true")
    void blacklistToken_Success() {
        String token = "sample.jwt.token";
        blacklistService.blacklistToken(token, 5000);

        assertTrue(blacklistService.isBlacklisted(token));
    }

    @Test
    @DisplayName("isBlacklisted - Token không có trong blacklist trả về false")
    void isBlacklisted_NotFound_ReturnsFalse() {
        assertFalse(blacklistService.isBlacklisted("non.existent.token"));
        assertFalse(blacklistService.isBlacklisted(null));
        assertFalse(blacklistService.isBlacklisted(""));
    }

    @Test
    @DisplayName("isBlacklisted - Token hết hạn TTL tự động bị xóa khỏi blacklist (lazy eviction)")
    void isBlacklisted_ExpiredToken_ReturnsFalse() throws InterruptedException {
        String shortLivedToken = "short.lived.token";
        // Đặt TTL cực ngắn: 50ms
        blacklistService.blacklistToken(shortLivedToken, 50);

        assertTrue(blacklistService.isBlacklisted(shortLivedToken));

        // Chờ 70ms để token hết hạn
        Thread.sleep(70);

        assertFalse(blacklistService.isBlacklisted(shortLivedToken));
    }

    @Test
    @DisplayName("cleanupExpiredTokens - Quét dọn các token hết hạn thành công")
    void cleanupExpiredTokens_Success() throws InterruptedException {
        String token1 = "token.expire.quick";
        String token2 = "token.stay.alive";

        blacklistService.blacklistToken(token1, 50);
        blacklistService.blacklistToken(token2, 60000);

        Thread.sleep(70);

        // Chạy hàm cleanup định kỳ
        blacklistService.cleanupExpiredTokens();

        assertFalse(blacklistService.isBlacklisted(token1));
        assertTrue(blacklistService.isBlacklisted(token2));
    }
}

