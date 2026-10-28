package com.funnyshop.security;

import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.web.authentication.WebAuthenticationDetailsSource;
import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;

import java.io.IOException;

@Component
@RequiredArgsConstructor
@Slf4j
public class JwtAuthenticationFilter extends OncePerRequestFilter {

    private final JwtTokenProvider jwtTokenProvider;
    private final CustomUserDetailsService customUserDetailsService;

    @Override
    protected void doFilterInternal(
            HttpServletRequest request,
            HttpServletResponse response,
            FilterChain filterChain
    ) throws ServletException, IOException {
        try {
            // 1. Trích xuất Token từ Header Authorization
            String jwt = getJwtFromRequest(request);

            // 2. Kiểm tra Token có tồn tại và hợp lệ không
            if (jwt != null && jwtTokenProvider.validateToken(jwt)) {
                // 3. Trích xuất username từ Token
                String username = jwtTokenProvider.getUsernameFromToken(jwt);

                // 4. Nạp thông tin UserDetails từ database
                UserDetails userDetails = customUserDetailsService.loadUserByUsername(username);

                // 5. Nếu chưa có authentication trong context, tạo mới
                if (SecurityContextHolder.getContext().getAuthentication() == null) {
                    UsernamePasswordAuthenticationToken authentication =
                            new UsernamePasswordAuthenticationToken(
                                    userDetails,
                                    null,
                                    userDetails.getAuthorities()
                            );

                    // 6. Gán WebAuthenticationDetails vào Authentication
                    authentication.setDetails(new WebAuthenticationDetailsSource().buildDetails(request));

                    // 7. Đặt Authentication vào SecurityContextHolder
                    SecurityContextHolder.getContext().setAuthentication(authentication);
                    log.debug("Set Authentication for user: {}", username);
                }
            }
        } catch (Exception e) {
            log.error("Cannot set user authentication: {}", e.getMessage());
        }

        // 8. Luôn chuyển tiếp filter chain
        filterChain.doFilter(request, response);
    }

    /**
     * Trích xuất JWT từ Header Authorization
     * Header format: "Bearer <token>"
     */
    private String getJwtFromRequest(HttpServletRequest request) {
        String bearerToken = request.getHeader("Authorization");

        // Kiểm tra header có tồn tại và bắt đầu bằng "Bearer "
        if (bearerToken != null && bearerToken.startsWith("Bearer ")) {
            // Bóc tách token sau prefix "Bearer "
            return bearerToken.substring(7);
        }

        return null;
    }
}
