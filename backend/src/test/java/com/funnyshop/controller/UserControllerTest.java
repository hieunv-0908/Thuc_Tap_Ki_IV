package com.funnyshop.controller;

import com.funnyshop.dto.request.UserUpdateRequest;
import com.funnyshop.dto.response.UserResponse;
import com.funnyshop.exception.GlobalHandleException;
import com.funnyshop.security.JwtTokenProvider;
import com.funnyshop.service.UserService;
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
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.put;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@ExtendWith(MockitoExtension.class)
class UserControllerTest {

    private MockMvc mockMvc;

    @Mock
    private UserService userService;

    @Mock
    private JwtTokenProvider jwtTokenProvider;

    @InjectMocks
    private UserController userController;

    private UserResponse sampleUserResponse;

    @BeforeEach
    void setUp() {
        mockMvc = MockMvcBuilders.standaloneSetup(userController)
                .setControllerAdvice(new GlobalHandleException())
                .build();

        sampleUserResponse = UserResponse.builder()
                .id(1L)
                .username("nguyen_van_a")
                .fullName("Nguyễn Văn A")
                .email("an@gmail.com")
                .phone("0912345678")
                .status("ACTIVE")
                .role("CUSTOMER")
                .build();
    }

    @Test
    @DisplayName("GET /api/v1/users/me - Lấy hồ sơ cá nhân của người dùng thành công 200 OK")
    void getCurrentUserProfile_Success() throws Exception {
        when(jwtTokenProvider.getUserIdFromToken("mock_jwt_token")).thenReturn(1L);
        when(userService.getCurrentUserProfile(1L)).thenReturn(sampleUserResponse);

        mockMvc.perform(get("/api/v1/users/me")
                        .header("Authorization", "Bearer mock_jwt_token")
                        .contentType(MediaType.APPLICATION_JSON))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.code", is(200)))
                .andExpect(jsonPath("$.message", is("Lấy thông tin người dùng thành công!")))
                .andExpect(jsonPath("$.data.username", is("nguyen_van_a")))
                .andExpect(jsonPath("$.data.email", is("an@gmail.com")));
    }

    @Test
    @DisplayName("PUT /api/v1/users/me - Cập nhật thông tin cá nhân thành công 200 OK")
    void updateUserProfile_Success() throws Exception {
        when(jwtTokenProvider.getUserIdFromToken("mock_jwt_token")).thenReturn(1L);
        when(userService.updateUserProfile(eq(1L), any(UserUpdateRequest.class))).thenReturn(sampleUserResponse);

        String json = """
            {
                "fullName": "Nguyễn Văn A Cập Nhật",
                "phone": "0912345678"
            }
            """;

        mockMvc.perform(put("/api/v1/users/me")
                        .header("Authorization", "Bearer mock_jwt_token")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(json))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.code", is(200)))
                .andExpect(jsonPath("$.message", is("Cập nhật thông tin người dùng thành công!")))
                .andExpect(jsonPath("$.data.username", is("nguyen_van_a")));
    }
}
