package com.funnyshop.security.blacklist;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.data.redis.core.StringRedisTemplate;
import org.springframework.data.redis.core.ValueOperations;

import java.util.concurrent.TimeUnit;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class RedisTokenBlacklistServiceTest {

    @Mock
    private StringRedisTemplate redisTemplate;

    @Mock
    private ValueOperations<String, String> valueOperations;

    @InjectMocks
    private RedisTokenBlacklistService redisTokenBlacklistService;

    @BeforeEach
    void setUp() {
        lenient().when(redisTemplate.opsForValue()).thenReturn(valueOperations);
    }

    @Test
    @DisplayName("blacklistToken - Lưu key vào Redis với TTL tương ứng")
    void blacklistToken_Success() {
        String token = "sample.redis.jwt";
        long ttl = 10000;

        redisTokenBlacklistService.blacklistToken(token, ttl);

        verify(valueOperations, times(1)).set("blacklist:token:" + token, "revoked", ttl, TimeUnit.MILLISECONDS);
    }

    @Test
    @DisplayName("isBlacklisted - Kiểm tra key tồn tại trong Redis")
    void isBlacklisted_Exists_ReturnsTrue() {
        String token = "sample.redis.jwt";
        when(redisTemplate.hasKey("blacklist:token:" + token)).thenReturn(true);

        assertTrue(redisTokenBlacklistService.isBlacklisted(token));
        verify(redisTemplate, times(1)).hasKey("blacklist:token:" + token);
    }

    @Test
    @DisplayName("isBlacklisted - Key không tồn tại trả về false")
    void isBlacklisted_NotExists_ReturnsFalse() {
        String token = "non.existent.jwt";
        when(redisTemplate.hasKey("blacklist:token:" + token)).thenReturn(false);

        assertFalse(redisTokenBlacklistService.isBlacklisted(token));
    }
}

