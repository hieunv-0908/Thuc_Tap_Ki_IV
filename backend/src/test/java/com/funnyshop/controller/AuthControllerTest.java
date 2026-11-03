package com.funnyshop.controller;

import com.funnyshop.dto.request.LoginRequest;
import com.funnyshop.dto.request.LogoutRequest;
import com.funnyshop.dto.request.RefreshTokenRequest;
import com.funnyshop.dto.request.RegisterRequest;
import com.funnyshop.dto.response.AuthResponse;
import com.funnyshop.dto.response.UserResponse;
import com.funnyshop.exception.GlobalHandleException;
import com.funnyshop.service.AuthService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.http.MediaType;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.setup.MockMvcBuilders;

import static org.hamcrest.Matchers.is;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.*;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@ExtendWith(MockitoExtension.class)
class AuthControllerTest {

    private MockMvc mockMvc;

    @Mock
    private AuthService authService;

    @InjectMocks
    private AuthController authController;

    private AuthResponse sampleAuthResponse;

    @BeforeEach
    void setUp() {
        mockMvc = MockMvcBuilders.standaloneSetup(authController)
                .setControllerAdvice(new GlobalHandleException())
                .build();

        sampleAuthResponse = AuthResponse.builder()
                .accessToken("mock.access.token")
                .refreshToken("mock.refresh.token")
                .tokenType("Bearer")
                .expiresIn(1800000L)
                .build();
    }

    @Test
    @DisplayName("POST /api/v1/auth/register - Đăng ký tài khoản thành công 201 Created")
    void register_Success() throws Exception {
        UserResponse userResponse = UserResponse.builder()
                .id(1L)
                .username("newuser")
                .email("new@example.com")
                .build();

        when(authService.register(any(RegisterRequest.class))).thenReturn(userResponse);

        String json = """
            {
                "username": "newuser",
                "email": "new@example.com",
                "password": "password123",
                "fullName": "New User"
            }
            """;

        mockMvc.perform(post("/api/v1/auth/register")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(json))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.code", is(201)))
                .andExpect(jsonPath("$.message", is("Đăng ký tài khoản thành công!")))
                .andExpect(jsonPath("$.data.username", is("newuser")));
    }

    @Test
    @DisplayName("POST /api/v1/auth/login - Đăng nhập thành công trả về cả 2 token 200 OK")
    void login_Success() throws Exception {
        when(authService.login(any(LoginRequest.class))).thenReturn(sampleAuthResponse);

        String json = """
            {
                "username": "testuser",
                "password": "password123"
            }
            """;

        mockMvc.perform(post("/api/v1/auth/login")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(json))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.code", is(200)))
                .andExpect(jsonPath("$.data.accessToken", is("mock.access.token")))
                .andExpect(jsonPath("$.data.refreshToken", is("mock.refresh.token")));
    }

    @Test
    @DisplayName("POST /api/v1/auth/refresh - Làm mới token thành công 200 OK")
    void refresh_Success() throws Exception {
        when(authService.refreshToken(any(RefreshTokenRequest.class))).thenReturn(sampleAuthResponse);

        String json = """
            {
                "refreshToken": "valid.refresh.token"
            }
            """;

        mockMvc.perform(post("/api/v1/auth/refresh")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(json))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.code", is(200)))
                .andExpect(jsonPath("$.message", is("Làm mới token thành công!")))
                .andExpect(jsonPath("$.data.accessToken", is("mock.access.token")));
    }

    @Test
    @DisplayName("POST /api/v1/auth/logout - Đăng xuất thành công thu hồi token 200 OK")
    void logout_Success() throws Exception {
        doNothing().when(authService).logout(eq("current.access.token"), eq("current.refresh.token"));

        String json = """
            {
                "refreshToken": "current.refresh.token"
            }
            """;

        mockMvc.perform(post("/api/v1/auth/logout")
                        .header("Authorization", "Bearer current.access.token")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(json))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.code", is(200)))
                .andExpect(jsonPath("$.message", is("Đăng xuất thành công, token đã bị thu hồi!")));

        verify(authService, times(1)).logout(eq("current.access.token"), eq("current.refresh.token"));
    }
}

