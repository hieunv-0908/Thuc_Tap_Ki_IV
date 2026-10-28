package com.funnyshop.controller;

import com.funnyshop.dto.request.UserUpdateRequest;
import com.funnyshop.dto.response.ApiResponse;
import com.funnyshop.dto.response.UserResponse;
import com.funnyshop.security.JwtTokenProvider;
import com.funnyshop.service.UserService;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
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

    private String getJwtFromRequest(HttpServletRequest request) {
        String bearerToken = request.getHeader("Authorization");
        if (bearerToken != null && bearerToken.startsWith("Bearer ")) {
            return bearerToken.substring(7);
        }
        return null;
    }

    @GetMapping("/me")
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<ApiResponse<UserResponse>> getCurrentUserProfile(HttpServletRequest request) {
        String jwt = getJwtFromRequest(request);
        Long userId = jwtTokenProvider.getUserIdFromToken(jwt);

        UserResponse userResponse = userService.getCurrentUserProfile(userId);
        return ResponseEntity.ok(
                ApiResponse.<UserResponse>builder()
                        .code(HttpStatus.OK.value())
                        .message("Lấy thông tin người dùng thành công!")
                        .data(userResponse)
                        .build()
        );
    }

    @PutMapping("/me")
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<ApiResponse<UserResponse>> updateUserProfile(
            @Valid @RequestBody UserUpdateRequest request,
            HttpServletRequest httpRequest
    ) {
        String jwt = getJwtFromRequest(httpRequest);
        Long userId = jwtTokenProvider.getUserIdFromToken(jwt);

        UserResponse userResponse = userService.updateUserProfile(userId, request);
        return ResponseEntity.ok(
                ApiResponse.<UserResponse>builder()
                        .code(HttpStatus.OK.value())
                        .message("Cập nhật thông tin người dùng thành công!")
                        .data(userResponse)
                        .build()
        );
    }
}
