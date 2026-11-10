package com.funnyshop.controller.admin;

import com.funnyshop.dto.request.UserCreateRequest;
import com.funnyshop.dto.request.UserRoleUpdateRequest;
import com.funnyshop.dto.request.UserStatusUpdateRequest;
import com.funnyshop.dto.request.UserUpdateRequest;
import com.funnyshop.dto.response.ApiResponse;
import com.funnyshop.dto.response.UserResponse;
import com.funnyshop.entity.User;
import com.funnyshop.service.UserService;

import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.data.web.PageableDefault;
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

    // GET /api/v1/admin/users?keyword=nguyen&page=0&size=10
    @GetMapping
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

    // GET /api/v1/admin/users/{id}
    @GetMapping("/{id}")
    public ResponseEntity<ApiResponse<UserResponse>> getUserById(
            @PathVariable Long id) {

        UserResponse userResponse = userService.getUserById(id);

        return ResponseEntity.ok(
                ApiResponse.<UserResponse>builder()
                        .code(HttpStatus.OK.value())
                        .message("Lấy thông tin người dùng thành công!")
                        .data(userResponse)
                        .build()
        );
    }

    // POST /api/v1/admin/users - Admin tạo tài khoản CUSTOMER
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

    // PUT /api/v1/admin/users/{id}
    @PutMapping("/{id}")
    public ResponseEntity<ApiResponse<UserResponse>> updateUser(
            @PathVariable Long id,
            @Valid @RequestBody UserUpdateRequest request) {

        UserResponse userResponse = userService.updateUser(id, request);

        return ResponseEntity.ok(
                ApiResponse.<UserResponse>builder()
                        .code(HttpStatus.OK.value())
                        .message("Cập nhật người dùng thành công!")
                        .data(userResponse)
                        .build()
        );
    }

    // PUT|PATCH /api/v1/admin/users/{id}/status
    @RequestMapping(
            value = "/{id}/status",
            method = {RequestMethod.PUT, RequestMethod.PATCH}
    )
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

    // PUT /api/v1/admin/users/{id}/role
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

    // DELETE /api/v1/admin/users/{id} - Soft delete: chuyển thành INACTIVE
    @DeleteMapping("/{id}")
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
