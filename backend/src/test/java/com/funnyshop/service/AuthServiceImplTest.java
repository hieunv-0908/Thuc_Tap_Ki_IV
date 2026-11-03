package com.funnyshop.service;

import com.funnyshop.dto.request.LoginRequest;
import com.funnyshop.dto.request.RefreshTokenRequest;
import com.funnyshop.dto.request.RegisterRequest;
import com.funnyshop.dto.response.AuthResponse;
import com.funnyshop.dto.response.UserResponse;
import com.funnyshop.entity.User;
import com.funnyshop.exception.AppException;
import com.funnyshop.exception.ResourceAlreadyExistsException;
import com.funnyshop.repository.UserRepository;
import com.funnyshop.security.JwtTokenProvider;
import com.funnyshop.security.blacklist.TokenBlacklistService;
import com.funnyshop.service.impl.AuthServiceImpl;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.crypto.password.PasswordEncoder;

import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class AuthServiceImplTest {

    @Mock
    private UserRepository userRepository;

    @Mock
    private PasswordEncoder passwordEncoder;

    @Mock
    private AuthenticationManager authenticationManager;

    @Mock
    private JwtTokenProvider jwtTokenProvider;

    @Mock
    private TokenBlacklistService tokenBlacklistService;

    @InjectMocks
    private AuthServiceImpl authService;

    private User sampleUser;

    @BeforeEach
    void setUp() {
        sampleUser = User.builder()
                .id(1L)
                .username("testuser")
                .email("test@example.com")
                .password("encoded_password")
                .fullName("Test User")
                .role(User.Role.CUSTOMER)
                .status(User.Status.ACTIVE)
                .build();
    }

    @Test
    @DisplayName("register - Đăng ký thành công trả về UserResponse")
    void register_Success() {
        RegisterRequest request = RegisterRequest.builder()
                .username("newuser")
                .email("new@example.com")
                .password("123456")
                .fullName("New User")
                .phone("0987654321")
                .build();

        when(userRepository.existsByUsername("newuser")).thenReturn(false);
        when(userRepository.existsByEmail("new@example.com")).thenReturn(false);
        when(passwordEncoder.encode("123456")).thenReturn("hashed_password");
        when(userRepository.save(any(User.class))).thenAnswer(i -> {
            User u = i.getArgument(0);
            u.setId(2L);
            return u;
        });

        UserResponse response = authService.register(request);

        assertNotNull(response);
        assertEquals("newuser", response.getUsername());
        verify(userRepository).save(any(User.class));
    }

    @Test
    @DisplayName("register - Trùng username ném ResourceAlreadyExistsException")
    void register_DuplicateUsername_ThrowsException() {
        RegisterRequest request = RegisterRequest.builder()
                .username("testuser")
                .email("new@example.com")
                .password("123456")
                .build();

        when(userRepository.existsByUsername("testuser")).thenReturn(true);

        assertThrows(ResourceAlreadyExistsException.class, () -> authService.register(request));
    }

    @Test
    @DisplayName("login - Đăng nhập thành công trả về cả AccessToken và RefreshToken")
    void login_Success_ReturnsBothTokens() {
        LoginRequest request = LoginRequest.builder()
                .username("testuser")
                .password("123456")
                .build();

        when(authenticationManager.authenticate(any(UsernamePasswordAuthenticationToken.class))).thenReturn(null);
        when(userRepository.findByUsername("testuser")).thenReturn(Optional.of(sampleUser));
        when(jwtTokenProvider.generateAccessToken(eq(sampleUser), eq(1L), eq("CUSTOMER"))).thenReturn("access.token.jwt");
        when(jwtTokenProvider.generateRefreshToken(eq(sampleUser), eq(1L))).thenReturn("refresh.token.jwt");
        when(jwtTokenProvider.getAccessExpirationMillis()).thenReturn(1800000L);

        AuthResponse response = authService.login(request);

        assertNotNull(response);
        assertEquals("access.token.jwt", response.getAccessToken());
        assertEquals("refresh.token.jwt", response.getRefreshToken());
        assertEquals("Bearer", response.getTokenType());
        assertEquals(1800000L, response.getExpiresIn());
    }

    @Test
    @DisplayName("refreshToken - Refresh thành công cấp AccessToken và RefreshToken mới")
    void refreshToken_Success() {
        String oldRefreshToken = "valid.refresh.token";
        RefreshTokenRequest request = RefreshTokenRequest.builder()
                .refreshToken(oldRefreshToken)
                .build();

        when(jwtTokenProvider.validateToken(oldRefreshToken)).thenReturn(true);
        when(jwtTokenProvider.isRefreshToken(oldRefreshToken)).thenReturn(true);
        when(tokenBlacklistService.isBlacklisted(oldRefreshToken)).thenReturn(false);
        when(jwtTokenProvider.getUsernameFromToken(oldRefreshToken)).thenReturn("testuser");
        when(userRepository.findByUsername("testuser")).thenReturn(Optional.of(sampleUser));
        when(jwtTokenProvider.generateAccessToken(eq(sampleUser), eq(1L), eq("CUSTOMER"))).thenReturn("new.access.token");
        when(jwtTokenProvider.generateRefreshToken(eq(sampleUser), eq(1L))).thenReturn("new.refresh.token");
        when(jwtTokenProvider.getRemainingExpirationMillis(oldRefreshToken)).thenReturn(500000L);
        when(jwtTokenProvider.getAccessExpirationMillis()).thenReturn(1800000L);

        AuthResponse response = authService.refreshToken(request);

        assertNotNull(response);
        assertEquals("new.access.token", response.getAccessToken());
        assertEquals("new.refresh.token", response.getRefreshToken());

        // Xác nhận Refresh Token cũ bị thu hồi vào blacklist
        verify(tokenBlacklistService).blacklistToken(oldRefreshToken, 500000L);
    }

    @Test
    @DisplayName("refreshToken - Token không đúng loại REFRESH ném lỗi BadRequest")
    void refreshToken_WrongTokenType_ThrowsException() {
        String fakeToken = "access.token.pretending.refresh";
        RefreshTokenRequest request = RefreshTokenRequest.builder()
                .refreshToken(fakeToken)
                .build();

        when(jwtTokenProvider.validateToken(fakeToken)).thenReturn(true);
        when(jwtTokenProvider.isRefreshToken(fakeToken)).thenReturn(false);

        assertThrows(AppException.class, () -> authService.refreshToken(request));
    }

    @Test
    @DisplayName("refreshToken - Refresh Token đã bị thu hồi trong Blacklist ném lỗi 401")
    void refreshToken_Blacklisted_ThrowsException() {
        String blacklistedToken = "revoked.refresh.token";
        RefreshTokenRequest request = RefreshTokenRequest.builder()
                .refreshToken(blacklistedToken)
                .build();

        when(jwtTokenProvider.validateToken(blacklistedToken)).thenReturn(true);
        when(jwtTokenProvider.isRefreshToken(blacklistedToken)).thenReturn(true);
        when(tokenBlacklistService.isBlacklisted(blacklistedToken)).thenReturn(true);

        assertThrows(AppException.class, () -> authService.refreshToken(request));
    }

    @Test
    @DisplayName("logout - Đưa cả Access Token và Refresh Token vào Blacklist")
    void logout_Success() {
        String accessToken = "current.access.token";
        String refreshToken = "current.refresh.token";

        when(jwtTokenProvider.getRemainingExpirationMillis(accessToken)).thenReturn(1000000L);
        when(jwtTokenProvider.getRemainingExpirationMillis(refreshToken)).thenReturn(600000000L);

        authService.logout(accessToken, refreshToken);

        verify(tokenBlacklistService).blacklistToken(accessToken, 1000000L);
        verify(tokenBlacklistService).blacklistToken(refreshToken, 600000000L);
    }
}

