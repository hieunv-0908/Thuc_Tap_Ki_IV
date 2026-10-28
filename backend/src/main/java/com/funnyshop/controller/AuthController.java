package com.funnyshop.controller;

import com.funnyshop.dto.request.LoginRequest;
import com.funnyshop.dto.request.RegisterRequest;
import com.funnyshop.dto.response.ApiResponse;
import com.funnyshop.dto.response.AuthResponse;
import com.funnyshop.dto.response.UserResponse;
import com.funnyshop.service.AuthService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/v1/auth")
@RequiredArgsConstructor
public class AuthController {

    private final AuthService authService;

    @PostMapping("/register")
    public ResponseEntity<ApiResponse<UserResponse>> register(@Valid @RequestBody RegisterRequest registerRequest) {
        UserResponse userResponse = authService.register(registerRequest);
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.<UserResponse>builder()
                        .code(HttpStatus.CREATED.value())
                        .message("Đăng ký tài khoản thành công!")
                        .data(userResponse)
                        .build());
    }

    @PostMapping("/login")
    public ResponseEntity<ApiResponse<AuthResponse>> login(@Valid @RequestBody LoginRequest loginRequest) {
        AuthResponse authResponse = authService.login(loginRequest);
        return ResponseEntity.ok(
                ApiResponse.<AuthResponse>builder()
                        .code(HttpStatus.OK.value())
                        .message("Đăng nhập thành công!")
                        .data(authResponse)
                        .build());
    }
}
