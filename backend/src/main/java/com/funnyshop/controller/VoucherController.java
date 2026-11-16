package com.funnyshop.controller;

import com.funnyshop.dto.request.VoucherApplyRequest;
import com.funnyshop.dto.response.ApiResponse;
import com.funnyshop.dto.response.VoucherApplyResponse;
import com.funnyshop.dto.response.VoucherResponse;
import com.funnyshop.entity.User;
import com.funnyshop.security.JwtTokenProvider;
import com.funnyshop.service.VoucherService;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping({"/api/v1/vouchers", "/api/vouchers"})
@RequiredArgsConstructor
public class VoucherController {

    private final VoucherService voucherService;
    private final JwtTokenProvider jwtTokenProvider;

    private Long getCurrentUserId(HttpServletRequest request) {
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        if (authentication != null && authentication.getPrincipal() instanceof User user) {
            return user.getId();
        }

        String bearerToken = request.getHeader("Authorization");
        if (bearerToken != null && bearerToken.startsWith("Bearer ")) {
            String jwt = bearerToken.substring(7);
            try {
                return jwtTokenProvider.getUserIdFromToken(jwt);
            } catch (Exception ignored) {
            }
        }
        return null;
    }

    @GetMapping("/available")
    public ResponseEntity<ApiResponse<List<VoucherResponse>>> getAvailableVouchers(HttpServletRequest request) {
        Long userId = getCurrentUserId(request);
        List<VoucherResponse> vouchers = voucherService.getAvailableVouchers(userId);

        ApiResponse<List<VoucherResponse>> response = ApiResponse.<List<VoucherResponse>>builder()
                .code(HttpStatus.OK.value())
                .message("Lấy danh sách mã giảm giá khả dụng thành công!")
                .data(vouchers)
                .build();

        return ResponseEntity.ok(response);
    }

    @PostMapping("/apply")
    public ResponseEntity<ApiResponse<VoucherApplyResponse>> applyVoucher(
            @Valid @RequestBody VoucherApplyRequest request,
            HttpServletRequest httpRequest) {
        Long userId = getCurrentUserId(httpRequest);
        VoucherApplyResponse result = voucherService.applyVoucher(
                request.getVoucherCode(), request.getSubtotal(), userId);

        ApiResponse<VoucherApplyResponse> response = ApiResponse.<VoucherApplyResponse>builder()
                .code(HttpStatus.OK.value())
                .message(result.getMessage())
                .data(result)
                .build();

        return ResponseEntity.ok(response);
    }
}

