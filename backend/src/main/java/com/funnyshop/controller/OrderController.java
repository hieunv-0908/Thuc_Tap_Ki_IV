package com.funnyshop.controller;

import com.funnyshop.dto.request.OrderCheckoutRequest;
import com.funnyshop.dto.response.ApiResponse;
import com.funnyshop.dto.response.OrderResponse;
import com.funnyshop.entity.User;
import com.funnyshop.security.JwtTokenProvider;
import com.funnyshop.service.OrderService;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping({"/api/v1/orders", "/api/orders"})
@RequiredArgsConstructor
@PreAuthorize("isAuthenticated()")
public class OrderController {

    private final OrderService orderService;
    private final JwtTokenProvider jwtTokenProvider;

    private Long getCurrentUserId(HttpServletRequest request) {
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

    private boolean isCurrentUserAdmin() {
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        if (authentication == null) {
            return false;
        }
        return authentication.getAuthorities().stream()
                .anyMatch(a -> a.getAuthority().equals("ROLE_ADMIN"));
    }

    @PostMapping({"/checkout", ""})
    public ResponseEntity<ApiResponse<OrderResponse>> checkout(
            @Valid @RequestBody OrderCheckoutRequest checkoutRequest,
            HttpServletRequest request
    ) {
        Long currentUserId = getCurrentUserId(request);
        OrderResponse response = orderService.checkout(currentUserId, checkoutRequest);

        return ResponseEntity.status(HttpStatus.CREATED).body(
                ApiResponse.<OrderResponse>builder()
                        .code(HttpStatus.CREATED.value())
                        .message("Đặt hàng thành công!")
                        .data(response)
                        .build()
        );
    }

    @GetMapping({"/my-orders", "/my"})
    public ResponseEntity<ApiResponse<List<OrderResponse>>> getMyOrders(HttpServletRequest request) {
        Long currentUserId = getCurrentUserId(request);
        List<OrderResponse> orders = orderService.getMyOrdersList(currentUserId);

        return ResponseEntity.ok(
                ApiResponse.<List<OrderResponse>>builder()
                        .code(HttpStatus.OK.value())
                        .message("Lấy lịch sử đơn hàng thành công!")
                        .data(orders)
                        .build()
        );
    }

    @GetMapping("/{id}")
    public ResponseEntity<ApiResponse<OrderResponse>> getOrderById(
            @PathVariable Long id,
            HttpServletRequest request
    ) {
        Long currentUserId = getCurrentUserId(request);
        boolean isAdmin = isCurrentUserAdmin();

        OrderResponse order = orderService.getOrderById(id, currentUserId, isAdmin);

        return ResponseEntity.ok(
                ApiResponse.<OrderResponse>builder()
                        .code(HttpStatus.OK.value())
                        .message("Lấy chi tiết đơn hàng thành công!")
                        .data(order)
                        .build()
        );
    }
}
