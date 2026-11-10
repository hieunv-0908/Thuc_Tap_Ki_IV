package com.funnyshop.controller.admin;

import com.funnyshop.dto.request.UserCreateRequest;
import com.funnyshop.dto.request.UserRoleUpdateRequest;
import com.funnyshop.dto.response.ApiResponse;
import com.funnyshop.dto.response.UserResponse;
import com.funnyshop.service.UserService;

import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;

import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/v1/admin/users")
@RequiredArgsConstructor
@PreAuthorize("hasRole('ADMIN')")
public class AdminUserController {

    private final UserService userService;

    // POST /api/v1/admin/users
    // Admin tạo tài khoản CUSTOMER
    @PostMapping
    public ResponseEntity<ApiResponse<UserResponse>> createUser(
            @Valid @RequestBody UserCreateRequest request) {

        UserResponse userResponse = userService.createUser(request);

        return ResponseEntity.status(HttpStatus.CREATED).body(
                ApiResponse.<UserResponse>builder()
                        .code(HttpStatus.CREATED.value())
                        .message("Tạo tài khoản người dùng thành công!")
                        .data(userResponse)
                        .build()
        );
    }

    // PUT /api/v1/admin/users/{id}/role
    // Thay đổi vai trò người dùng
    @PutMapping("/{id}/role")
    public ResponseEntity<ApiResponse<UserResponse>> updateUserRole(
            @PathVariable Long id,
            @Valid @RequestBody UserRoleUpdateRequest request) {

        UserResponse userResponse =
                userService.updateUserRole(id, request.getRole());

        return ResponseEntity.ok(
                ApiResponse.<UserResponse>builder()
                        .code(HttpStatus.OK.value())
                        .message("Cập nhật vai trò người dùng thành công!")
                        .data(userResponse)
                        .build()
        );
    }
}
