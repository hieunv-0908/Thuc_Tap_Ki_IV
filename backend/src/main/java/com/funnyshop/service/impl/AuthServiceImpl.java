package com.funnyshop.service.impl;

import com.funnyshop.dto.request.LoginRequest;
import com.funnyshop.dto.request.RefreshTokenRequest;
import com.funnyshop.dto.request.RegisterRequest;
import com.funnyshop.dto.response.AuthResponse;
import com.funnyshop.dto.response.UserResponse;
import com.funnyshop.entity.User;
import com.funnyshop.exception.AppException;
import com.funnyshop.exception.ResourceAlreadyExistsException;
import com.funnyshop.exception.ResourceNotFoundException;
import com.funnyshop.repository.UserRepository;
import com.funnyshop.security.JwtTokenProvider;
import com.funnyshop.security.blacklist.TokenBlacklistService;
import com.funnyshop.service.AuthService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpStatus;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.userdetails.UsernameNotFoundException;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;

@Service
@RequiredArgsConstructor
@Slf4j
public class AuthServiceImpl implements AuthService {

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;
    private final AuthenticationManager authenticationManager;
    private final JwtTokenProvider jwtTokenProvider;
    private final TokenBlacklistService tokenBlacklistService;

    @Override
    public UserResponse register(RegisterRequest registerRequest) {
        log.info("Registering new user with username: {}", registerRequest.getUsername());

        // Kiểm tra trùng lặp username
        if (userRepository.existsByUsername(registerRequest.getUsername())) {
            throw new ResourceAlreadyExistsException("Username đã tồn tại!");
        }

        // Kiểm tra trùng lặp email
        if (userRepository.existsByEmail(registerRequest.getEmail())) {
            throw new ResourceAlreadyExistsException("Email đã tồn tại!");
        }

        // Tạo user mới
        User user = User.builder()
                .username(registerRequest.getUsername())
                .email(registerRequest.getEmail())
                .password(passwordEncoder.encode(registerRequest.getPassword()))
                .fullName(registerRequest.getFullName())
                .phone(registerRequest.getPhone())
                .role(User.Role.CUSTOMER)
                .status(User.Status.ACTIVE)
                .build();

        // Lưu vào database
        User savedUser = userRepository.save(user);
        log.info("User registered successfully with ID: {}", savedUser.getId());

        // Chuyển đổi sang UserResponse (không bao gồm password)
        return mapToUserResponse(savedUser);
    }

    @Override
    public AuthResponse login(LoginRequest loginRequest) {
        log.info("Attempting login for username: {}", loginRequest.getUsername());

        // Xác thực username và password
        Authentication authentication = authenticationManager.authenticate(
                new UsernamePasswordAuthenticationToken(
                        loginRequest.getUsername(),
                        loginRequest.getPassword()
                )
        );

        // Lấy user details từ authentication
        User user = userRepository.findByUsername(loginRequest.getUsername())
                .orElseThrow(() -> new UsernameNotFoundException("User không tìm thấy!"));

        // Sinh cặp Access Token và Refresh Token
        String accessToken = jwtTokenProvider.generateAccessToken(user, user.getId(), user.getRole().name());
        String refreshToken = jwtTokenProvider.generateRefreshToken(user, user.getId());

        log.info("User logged in successfully: {}", loginRequest.getUsername());

        return AuthResponse.builder()
                .accessToken(accessToken)
                .refreshToken(refreshToken)
                .tokenType("Bearer")
                .expiresIn(jwtTokenProvider.getAccessExpirationMillis())
                .user(mapToUserResponse(user))
                .build();
    }

    @Override
    public AuthResponse refreshToken(RefreshTokenRequest request) {
        String refreshToken = request.getRefreshToken();
        if (refreshToken == null || refreshToken.isBlank()) {
            throw new AppException("Refresh token không được để trống!", HttpStatus.BAD_REQUEST);
        }

        // 1. Kiểm tra tính hợp lệ cơ bản của token (chữ ký & hạn dùng)
        if (!jwtTokenProvider.validateToken(refreshToken)) {
            throw new AppException("Refresh token không hợp lệ hoặc đã hết hạn!", HttpStatus.UNAUTHORIZED);
        }

        // 2. Kiểm tra token có đúng type REFRESH không
        if (!jwtTokenProvider.isRefreshToken(refreshToken)) {
            throw new AppException("Token cung cấp không phải là Refresh Token hợp lệ!", HttpStatus.BAD_REQUEST);
        }

        // 3. Kiểm tra token có nằm trong blacklist không
        if (tokenBlacklistService.isBlacklisted(refreshToken)) {
            throw new AppException("Refresh token đã bị thu hồi (đã đăng xuất hoặc đã được làm mới trước đó)!", HttpStatus.UNAUTHORIZED);
        }

        // 4. Lấy thông tin user từ token
        String username = jwtTokenProvider.getUsernameFromToken(refreshToken);
        User user = userRepository.findByUsername(username)
                .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy người dùng với username: " + username));

        if (user.getStatus() != User.Status.ACTIVE) {
            throw new AppException("Tài khoản của bạn đã bị khóa hoặc không hoạt động!", HttpStatus.FORBIDDEN);
        }

        // 5. Cấp cặp Access Token mới và Refresh Token mới (Token Rotation chống replay)
        String newAccessToken = jwtTokenProvider.generateAccessToken(user, user.getId(), user.getRole().name());
        String newRefreshToken = jwtTokenProvider.generateRefreshToken(user, user.getId());

        // Thu hồi Refresh Token cũ
        long oldTtl = jwtTokenProvider.getRemainingExpirationMillis(refreshToken);
        if (oldTtl > 0) {
            tokenBlacklistService.blacklistToken(refreshToken, oldTtl);
            log.debug("Đã đưa Refresh Token cũ vào Blacklist. TTL: {} ms", oldTtl);
        }

        return AuthResponse.builder()
                .accessToken(newAccessToken)
                .refreshToken(newRefreshToken)
                .tokenType("Bearer")
                .expiresIn(jwtTokenProvider.getAccessExpirationMillis())
                .user(mapToUserResponse(user))
                .build();
    }

    @Override
    public void logout(String accessToken, String refreshToken) {
        // Thu hồi Access Token
        if (accessToken != null && !accessToken.isBlank()) {
            long accessTtl = jwtTokenProvider.getRemainingExpirationMillis(accessToken);
            if (accessTtl > 0) {
                tokenBlacklistService.blacklistToken(accessToken, accessTtl);
                log.info("Access Token đã được đưa vào Blacklist với TTL: {} ms", accessTtl);
            }
        }

        // Thu hồi Refresh Token
        if (refreshToken != null && !refreshToken.isBlank()) {
            long refreshTtl = jwtTokenProvider.getRemainingExpirationMillis(refreshToken);
            if (refreshTtl > 0) {
                tokenBlacklistService.blacklistToken(refreshToken, refreshTtl);
                log.info("Refresh Token đã được đưa vào Blacklist với TTL: {} ms", refreshTtl);
            }
        }
    }

    private UserResponse mapToUserResponse(User user) {
        return UserResponse.builder()
                .id(user.getId())
                .username(user.getUsername())
                .email(user.getEmail())
                .fullName(user.getFullName())
                .phone(user.getPhone())
                .role(user.getRole().name())
                .status(user.getStatus().name())
                .build();
    }
}
