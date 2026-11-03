package com.funnyshop.security.blacklist;

public interface TokenBlacklistService {

    /**
     * Đưa token vào danh sách đen với thời gian sống TTL còn lại (mili-giây)
     * @param token Chuỗi JWT
     * @param ttlInMillis Thời gian sống còn lại
     */
    void blacklistToken(String token, long ttlInMillis);

    /**
     * Kiểm tra xem token có nằm trong danh sách đen không
     * @param token Chuỗi JWT
     * @return true nếu token đã bị thu hồi / nằm trong danh sách đen
     */
    boolean isBlacklisted(String token);
}

