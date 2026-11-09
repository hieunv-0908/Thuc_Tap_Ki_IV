package com.funnyshop.controller.admin;

import com.funnyshop.dto.request.UserStatusUpdateRequest;
import com.funnyshop.dto.request.UserUpdateRequest;
import com.funnyshop.dto.response.UserResponse;
import com.funnyshop.entity.User;
import com.funnyshop.exception.GlobalHandleException;
import com.funnyshop.service.UserService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageImpl;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.web.PageableHandlerMethodArgumentResolver;
import org.springframework.http.MediaType;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.setup.MockMvcBuilders;

import java.util.List;

import static org.hamcrest.Matchers.is;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.*;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@ExtendWith(MockitoExtension.class)
class AdminUserControllerTest {

    private MockMvc mockMvc;

    @Mock
    private UserService userService;

    @InjectMocks
    private AdminUserController adminUserController;

    private UserResponse sampleUserResponse;

    @BeforeEach
    void setUp() {
        mockMvc = MockMvcBuilders.standaloneSetup(adminUserController)
                .setCustomArgumentResolvers(new PageableHandlerMethodArgumentResolver())
                .setControllerAdvice(new GlobalHandleException())
                .build();

        sampleUserResponse = UserResponse.builder()
                .id(1L)
                .username("admin")
                .fullName("Quản trị viên")
                .email("admin@funnyshop.com")
                .phone("0987654321")
                .status("ACTIVE")
                .role("ADMIN")
                .build();
    }

    @Test
    @DisplayName("GET /api/v1/admin/users - Admin lấy danh sách người dùng thành công 200 OK")
    void getAllUsers_Success() throws Exception {
        Page<UserResponse> page = new PageImpl<>(List.of(sampleUserResponse), PageRequest.of(0, 10), 1);
        when(userService.getAllUsers(any(), any(Pageable.class))).thenReturn(page);

        mockMvc.perform(get("/api/v1/admin/users")
                        .contentType(MediaType.APPLICATION_JSON))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.code", is(200)))
                .andExpect(jsonPath("$.data.content[0].username", is("admin")));
    }

    @Test
    @DisplayName("GET /api/v1/admin/users/{id} - Lấy chi tiết người dùng thành công 200 OK")
    void getUserById_Success() throws Exception {
        when(userService.getUserById(1L)).thenReturn(sampleUserResponse);

        mockMvc.perform(get("/api/v1/admin/users/1")
                        .contentType(MediaType.APPLICATION_JSON))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.code", is(200)))
                .andExpect(jsonPath("$.data.username", is("admin")));
    }

    @Test
    @DisplayName("PUT /api/v1/admin/users/{id} - Cập nhật người dùng thành công 200 OK")
    void updateUser_Success() throws Exception {
        when(userService.updateUser(eq(1L), any(UserUpdateRequest.class))).thenReturn(sampleUserResponse);

        String json = """
            {
                "fullName": "Quản trị viên cập nhật",
                "phone": "0987654321"
            }
            """;

        mockMvc.perform(put("/api/v1/admin/users/1")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(json))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.code", is(200)))
                .andExpect(jsonPath("$.message", is("Cập nhật người dùng thành công!")));
    }

    @Test
    @DisplayName("PUT /api/v1/admin/users/{id}/status - Cập nhật trạng thái người dùng bằng PUT thành công 200 OK")
    void updateUserStatus_PutMethod_Success() throws Exception {
        when(userService.updateUserStatus(eq(1L), eq(User.Status.INACTIVE))).thenReturn(
                UserResponse.builder()
                        .id(1L)
                        .username("admin")
                        .status("INACTIVE")
                        .build()
        );

        String json = """
            {
                "status": "INACTIVE"
            }
            """;

        mockMvc.perform(put("/api/v1/admin/users/1/status")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(json))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.code", is(200)))
                .andExpect(jsonPath("$.data.status", is("INACTIVE")));
    }

    @Test
    @DisplayName("PATCH /api/v1/admin/users/{id}/status - Cập nhật trạng thái người dùng bằng PATCH thành công 200 OK")
    void updateUserStatus_PatchMethod_Success() throws Exception {
        when(userService.updateUserStatus(eq(1L), eq(User.Status.ACTIVE))).thenReturn(sampleUserResponse);

        String json = """
            {
                "status": "ACTIVE"
            }
            """;

        mockMvc.perform(patch("/api/v1/admin/users/1/status")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(json))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.code", is(200)))
                .andExpect(jsonPath("$.data.status", is("ACTIVE")));
    }

    @Test
    @DisplayName("DELETE /api/v1/admin/users/{id} - Khóa/xóa mềm người dùng 200 OK")
    void deleteUser_Success() throws Exception {
        doNothing().when(userService).deleteUser(1L);

        mockMvc.perform(delete("/api/v1/admin/users/1")
                        .contentType(MediaType.APPLICATION_JSON))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.code", is(200)))
                .andExpect(jsonPath("$.message", is("Xóa người dùng thành công!")));
    }
}

