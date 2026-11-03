package com.funnyshop.security.blacklist;

import lombok.extern.slf4j.Slf4j;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;

import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;

@Service
@ConditionalOnProperty(name = "app.security.token-blacklist.provider", havingValue = "in-memory", matchIfMissing = true)
@Slf4j
public class InMemoryTokenBlacklistService implements TokenBlacklistService {

    // Lưu token -> thời điểm hết hạn (epoch milliseconds)
    private final Map<String, Long> blacklistMap = new ConcurrentHashMap<>();

    @Override
    public void blacklistToken(String token, long ttlInMillis) {
        if (token == null || token.isBlank() || ttlInMillis <= 0) {
            return;
        }
        long expireAt = System.currentTimeMillis() + ttlInMillis;
        blacklistMap.put(token, expireAt);
        log.debug("Token đưa vào InMemory Blacklist thành công. TTL: {} ms. Tổng số token: {}", ttlInMillis, blacklistMap.size());
    }

    @Override
    public boolean isBlacklisted(String token) {
        if (token == null || token.isBlank()) {
            return false;
        }
        Long expireAt = blacklistMap.get(token);
        if (expireAt == null) {
            return false;
        }

        // Lazy eviction: Nếu token đã quá hạn trong map thì xóa luôn
        if (System.currentTimeMillis() >= expireAt) {
            blacklistMap.remove(token);
            return false;
        }

        return true;
    }

    /**
     * Quét và dọn dẹp các token đã hết hạn tự nhiên trong RAM định kỳ mỗi 10 phút
     */
    @Scheduled(fixedRate = 600000)
    public void cleanupExpiredTokens() {
        long now = System.currentTimeMillis();
        int initialSize = blacklistMap.size();
        blacklistMap.entrySet().removeIf(entry -> entry.getValue() <= now);
        int removedCount = initialSize - blacklistMap.size();
        if (removedCount > 0) {
            log.info("Dọn dẹp InMemory Blacklist: Đã xóa {} token hết hạn. Còn lại: {}", removedCount, blacklistMap.size());
        }
    }
}

