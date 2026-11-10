package com.funnyshop.controller;

import com.funnyshop.dto.request.UserUpdateRequest;
import com.funnyshop.dto.request.UserStatusUpdateRequest;
import com.funnyshop.dto.response.ApiResponse;
import com.funnyshop.dto.response.UserResponse;
import com.funnyshop.security.JwtTokenProvider;
import com.funnyshop.service.UserService;
import com.funnyshop.dto.request.UserCreateRequest;

import jakarta.servlet.http.HttpServletRequest;
import jakarta.validation.Valid;

import lombok.RequiredArgsConstructor;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.web.PageableDefault;
import org.springframework.data.domain.Sort;

import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;

import org.springframework.security.access.prepost.PreAuthorize;

import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/v1/users")
@RequiredArgsConstructor
public class UserController {

    private final UserService userService;
    private final JwtTokenProvider jwtTokenProvider;

    // Lấy JWT từ Header
    private String getJwtFromRequest(HttpServletRequest request) {
        String bearerToken = request.getHeader("Authorization");

        if (bearerToken != null && bearerToken.startsWith("Bearer ")) {
            return bearerToken.substring(7);
        }

        return null;
    }

    // ==========================================
    // 1. HỒ SƠ CÁ NHÂN
    // ==========================================

    // GET /api/v1/users/me
    @GetMapping("/me")
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<ApiResponse<UserResponse>> getCurrentUserProfile(
            HttpServletRequest request) {

        String jwt = getJwtFromRequest(request);
        Long userId = jwtTokenProvider.getUserIdFromToken(jwt);

        UserResponse userResponse =
                userService.getCurrentUserProfile(userId);

        return ResponseEntity.ok(
                ApiResponse.<UserResponse>builder()
                        .code(HttpStatus.OK.value())
                        .message("Lấy thông tin người dùng thành công!")
                        .data(userResponse)
                        .build()
        );
    }

    // PUT /api/v1/users/me
    @PutMapping("/me")
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<ApiResponse<UserResponse>> updateUserProfile(
            @Valid @RequestBody UserUpdateRequest request,
            HttpServletRequest httpRequest) {

        String jwt = getJwtFromRequest(httpRequest);
        Long userId = jwtTokenProvider.getUserIdFromToken(jwt);

        UserResponse userResponse =
                userService.updateUserProfile(userId, request);

        return ResponseEntity.ok(
                ApiResponse.<UserResponse>builder()
                        .code(HttpStatus.OK.value())
                        .message("Cập nhật thông tin người dùng thành công!")
                        .data(userResponse)
                        .build()
        );
    }

    // ==========================================
    // 2. QUẢN LÝ NGƯỜI DÙNG (ADMIN)
    // ==========================================

    // GET /api/v1/users?keyword=nguyen&page=0&size=10
    @GetMapping
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<ApiResponse<Page<UserResponse>>> getAllUsers(
            @RequestParam(required = false) String keyword,
            @PageableDefault(
                    page = 0,
                    size = 10,
                    sort = "id",
                    direction = Sort.Direction.DESC
            ) Pageable pageable) {

        Page<UserResponse> users =
                userService.getAllUsers(keyword, pageable);

        return ResponseEntity.ok(
                ApiResponse.<Page<UserResponse>>builder()
                        .code(HttpStatus.OK.value())
                        .message("Lấy danh sách người dùng thành công!")
                        .data(users)
                        .build()
        );
    }

    // POST /api/v1/users
    // ADMIN tạo tài khoản CUSTOMER
    @PostMapping
    @PreAuthorize("hasRole('ADMIN')")
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

    // GET /api/v1/users/{id}
    @GetMapping("/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<ApiResponse<UserResponse>> getUserById(
            @PathVariable Long id) {

        UserResponse userResponse =
                userService.getUserById(id);

        return ResponseEntity.ok(
                ApiResponse.<UserResponse>builder()
                        .code(HttpStatus.OK.value())
                        .message("Lấy thông tin người dùng thành công!")
                        .data(userResponse)
                        .build()
        );
    }

    // PUT /api/v1/users/{id}
    @PutMapping("/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<ApiResponse<UserResponse>> updateUser(
            @PathVariable Long id,
            @Valid @RequestBody UserUpdateRequest request) {

        UserResponse userResponse =
                userService.updateUser(id, request);

        return ResponseEntity.ok(
                ApiResponse.<UserResponse>builder()
                        .code(HttpStatus.OK.value())
                        .message("Cập nhật người dùng thành công!")
                        .data(userResponse)
                        .build()
        );
    }

    // PATCH /api/v1/users/{id}/status
    @PatchMapping("/{id}/status")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<ApiResponse<UserResponse>> updateUserStatus(
            @PathVariable Long id,
            @Valid @RequestBody UserStatusUpdateRequest request) {

        UserResponse userResponse =
                userService.updateUserStatus(id, request.getStatus());

        return ResponseEntity.ok(
                ApiResponse.<UserResponse>builder()
                        .code(HttpStatus.OK.value())
                        .message("Cập nhật trạng thái tài khoản thành công!")
                        .data(userResponse)
                        .build()
        );
    }

    // DELETE /api/v1/users/{id}
    // Soft Delete: Chuyển trạng thái thành INACTIVE
    @DeleteMapping("/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<ApiResponse<Void>> deleteUser(
            @PathVariable Long id) {

        userService.deleteUser(id);

        return ResponseEntity.ok(
                ApiResponse.<Void>builder()
                        .code(HttpStatus.OK.value())
                        .message("Xóa người dùng thành công!")
                        .build()
        );
    }
}