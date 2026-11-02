package com.funnyshop.security;

import io.jsonwebtoken.*;
import io.jsonwebtoken.io.Decoders;
import io.jsonwebtoken.security.Keys;
import io.jsonwebtoken.security.SignatureException;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.stereotype.Component;

import javax.crypto.SecretKey;
import java.util.Date;
import java.util.HashMap;
import java.util.Map;
import java.util.function.Function;

@Component
@Slf4j
public class JwtTokenProvider {

    @Value("${jwt.secret}")
    private String jwtSecret;

    @Value("${jwt.access-expiration:${jwt.expiration:1800000}}")
    private long jwtAccessExpiration;

    @Value("${jwt.refresh-expiration:604800000}")
    private long jwtRefreshExpiration;

    // Chuyển đổi secret string thành SecretKey HMAC-SHA256
    private SecretKey getSigningKey() {
        byte[] keyBytes = Decoders.BASE64.decode(jwtSecret);
        return Keys.hmacShaKeyFor(keyBytes);
    }

    /**
     * Sinh JWT Token mặc định (Access Token) từ UserDetails + Custom Claims (userId, role)
     */
    public String generateToken(UserDetails userDetails, Long userId, String role) {
        return generateAccessToken(userDetails, userId, role);
    }

    /**
     * Sinh Access Token có thời hạn ngắn (mặc định 30 phút), kèm claim tokenType = "ACCESS"
     */
    public String generateAccessToken(UserDetails userDetails, Long userId, String role) {
        Map<String, Object> claims = new HashMap<>();
        claims.put("userId", userId);
        claims.put("role", role);
        claims.put("tokenType", "ACCESS");

        Date currentDate = new Date();
        Date expireDate = new Date(currentDate.getTime() + jwtAccessExpiration);

        return Jwts.builder()
                .claims(claims)
                .subject(userDetails.getUsername())
                .issuedAt(currentDate)
                .expiration(expireDate)
                .signWith(getSigningKey(), Jwts.SIG.HS256)
                .compact();
    }

    /**
     * Sinh Refresh Token có thời hạn dài (mặc định 7 ngày), kèm claim tokenType = "REFRESH"
     */
    public String generateRefreshToken(UserDetails userDetails, Long userId) {
        Map<String, Object> claims = new HashMap<>();
        claims.put("userId", userId);
        claims.put("tokenType", "REFRESH");

        Date currentDate = new Date();
        Date expireDate = new Date(currentDate.getTime() + jwtRefreshExpiration);

        return Jwts.builder()
                .claims(claims)
                .subject(userDetails.getUsername())
                .issuedAt(currentDate)
                .expiration(expireDate)
                .signWith(getSigningKey(), Jwts.SIG.HS256)
                .compact();
    }

    /**
     * Trích xuất Username/Email từ Token
     */
    public String getUsernameFromToken(String token) {
        return getClaimFromToken(token, Claims::getSubject);
    }

    /**
     * Trích xuất UserId từ Token
     */
    public Long getUserIdFromToken(String token) {
        Claims claims = getAllClaimsFromToken(token);
        return claims.get("userId", Long.class);
    }

    /**
     * Trích xuất Role từ Token
     */
    public String getRoleFromToken(String token) {
        Claims claims = getAllClaimsFromToken(token);
        return claims.get("role", String.class);
    }

    /**
     * Trích xuất loại Token (ACCESS hoặc REFRESH)
     */
    public String getTokenTypeFromToken(String token) {
        Claims claims = getAllClaimsFromToken(token);
        return claims.get("tokenType", String.class);
    }

    /**
     * Kiểm tra xem token có phải là Refresh Token không
     */
    public boolean isRefreshToken(String token) {
        try {
            String type = getTokenTypeFromToken(token);
            return "REFRESH".equalsIgnoreCase(type);
        } catch (Exception e) {
            return false;
        }
    }

    /**
     * Lấy thời gian sống còn lại của Token tính bằng mili-giây (cho Blacklist TTL)
     */
    public long getRemainingExpirationMillis(String token) {
        try {
            Date expiration = getClaimFromToken(token, Claims::getExpiration);
            long diff = expiration.getTime() - System.currentTimeMillis();
            return Math.max(0, diff);
        } catch (Exception e) {
            return 0;
        }
    }

    public long getAccessExpirationMillis() {
        return jwtAccessExpiration;
    }

    public long getRefreshExpirationMillis() {
        return jwtRefreshExpiration;
    }

    /**
     * Hàm Generic trích xuất một Claim cụ thể
     */
    public <T> T getClaimFromToken(String token, Function<Claims, T> claimsResolver) {
        final Claims claims = getAllClaimsFromToken(token);
        return claimsResolver.apply(claims);
    }

    /**
     * Giải mã và lấy toàn bộ Payload Claims từ Token
     */
    private Claims getAllClaimsFromToken(String token) {
        return Jwts.parser()
                .verifyWith(getSigningKey())
                .build()
                .parseSignedClaims(token)
                .getPayload();
    }

    /**
     * Kiểm tra tính hợp lệ của Token
     */
    public boolean validateToken(String token) {
        try {
            Jwts.parser()
                    .verifyWith(getSigningKey())
                    .build()
                    .parseSignedClaims(token);
            return true;
        } catch (SignatureException e) {
            log.error("Chữ ký JWT không hợp lệ: {}", e.getMessage());
        } catch (MalformedJwtException e) {
            log.error("Cấu trúc Token JWT không đúng định dạng: {}", e.getMessage());
        } catch (ExpiredJwtException e) {
            log.error("Token JWT đã hết hạn: {}", e.getMessage());
        } catch (UnsupportedJwtException e) {
            log.error("Token JWT không được hỗ trợ: {}", e.getMessage());
        } catch (IllegalArgumentException e) {
            log.error("Chuỗi Claims JWT bị rỗng: {}", e.getMessage());
        }
        return false;
    }
}
