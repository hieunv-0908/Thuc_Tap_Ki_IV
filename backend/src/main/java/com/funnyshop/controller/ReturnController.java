package com.funnyshop.controller;

import com.funnyshop.dto.request.ReturnCreateRequest;
import com.funnyshop.dto.response.ApiResponse;
import com.funnyshop.dto.response.ReturnResponse;
import com.funnyshop.entity.User;
import com.funnyshop.security.JwtTokenProvider;
import com.funnyshop.service.ReturnService;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping({"/api/v1/orders/{orderId}/return", "/api/orders/{orderId}/return"})
@RequiredArgsConstructor
public class ReturnController {

    private final ReturnService returnService;
    private final JwtTokenProvider jwtTokenProvider;

    private Long resolveUserId(HttpServletRequest request) {
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        if (authentication != null && authentication.getPrincipal() instanceof User user) {
            return user.getId();
        }

        String bearerToken = request.getHeader("Authorization");
        if (bearerToken != null && bearerToken.startsWith("Bearer ")) {
            String jwt = bearerToken.substring(7);
            return jwtTokenProvider.getUserIdFromToken(jwt);
        }

        return null;
    }

    private boolean checkIsAdmin() {
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        if (authentication == null) {
            return false;
        }
        return authentication.getAuthorities().stream()
                .anyMatch(a -> a.getAuthority().equals("ROLE_ADMIN"));
    }

    @PostMapping
    public ResponseEntity<ApiResponse<ReturnResponse>> createReturnRequest(
            @PathVariable Long orderId,
            @Valid @RequestBody ReturnCreateRequest returnRequest,
            HttpServletRequest request) {

        Long userId = resolveUserId(request);
        ReturnResponse response = returnService.createReturnRequest(userId, orderId, returnRequest);

        return ResponseEntity.status(HttpStatus.CREATED).body(
                ApiResponse.<ReturnResponse>builder()
                        .code(HttpStatus.CREATED.value())
                        .message("Gửi yêu cầu trả hàng thành công! Đang chờ quản trị viên xét duyệt.")
                        .data(response)
                        .build()
        );
    }

    @GetMapping
    public ResponseEntity<ApiResponse<ReturnResponse>> getReturnRequest(
            @PathVariable Long orderId,
            HttpServletRequest request) {

        Long userId = resolveUserId(request);
        boolean isAdmin = checkIsAdmin();
        ReturnResponse response = returnService.getReturnRequestByOrderId(userId, orderId, isAdmin);

        return ResponseEntity.ok(
                ApiResponse.<ReturnResponse>builder()
                        .code(HttpStatus.OK.value())
                        .message("Lấy thông tin yêu cầu trả hàng thành công!")
                        .data(response)
                        .build()
        );
    }
}

