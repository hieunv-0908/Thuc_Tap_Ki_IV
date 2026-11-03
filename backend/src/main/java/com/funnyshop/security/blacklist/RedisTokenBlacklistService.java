package com.funnyshop.security.blacklist;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.data.redis.core.StringRedisTemplate;
import org.springframework.stereotype.Service;

import java.util.concurrent.TimeUnit;

@Service
@ConditionalOnProperty(name = "app.security.token-blacklist.provider", havingValue = "redis")
@RequiredArgsConstructor
@Slf4j
public class RedisTokenBlacklistService implements TokenBlacklistService {

    private final StringRedisTemplate redisTemplate;
    private static final String KEY_PREFIX = "blacklist:token:";

    @Override
    public void blacklistToken(String token, long ttlInMillis) {
        if (token == null || token.isBlank() || ttlInMillis <= 0) {
            return;
        }
        String key = KEY_PREFIX + token;
        redisTemplate.opsForValue().set(key, "revoked", ttlInMillis, TimeUnit.MILLISECONDS);
        log.debug("Token đưa vào Redis Blacklist thành công. Key: {}, TTL: {} ms", key, ttlInMillis);
    }

    @Override
    public boolean isBlacklisted(String token) {
        if (token == null || token.isBlank()) {
            return false;
        }
        String key = KEY_PREFIX + token;
        Boolean exists = redisTemplate.hasKey(key);
        return Boolean.TRUE.equals(exists);
    }
}

