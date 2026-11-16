package com.funnyshop.controller;

import com.funnyshop.dto.response.ApiResponse;
import com.funnyshop.dto.response.PayOSPaymentResponse;
import com.funnyshop.entity.Order;
import com.funnyshop.entity.OrderStatusHistory;
import com.funnyshop.entity.User;
import com.funnyshop.enums.OrderStatus;
import com.funnyshop.exception.AppException;
import com.funnyshop.exception.ResourceNotFoundException;
import com.funnyshop.repository.OrderRepository;
import com.funnyshop.repository.OrderStatusHistoryRepository;
import com.funnyshop.security.JwtTokenProvider;
import com.funnyshop.service.PayOSService;
import jakarta.servlet.http.HttpServletRequest;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.*;

import java.util.HashMap;
import java.util.Map;

@Slf4j
@RestController
@RequiredArgsConstructor
public class PaymentController {

    private final PayOSService payOSService;
    private final OrderRepository orderRepository;
    private final OrderStatusHistoryRepository orderStatusHistoryRepository;
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

    /**
     * Webhook nhận thông báo thanh toán từ PayOS (Public, không cần Bearer Token)
     */
    @PostMapping({"/api/v1/payments/payos-webhook", "/api/payments/payos-webhook"})
    public ResponseEntity<Map<String, Object>> handlePayOSWebhook(@RequestBody Map<String, Object> webhookBody) {
        log.info("[PayOS Webhook] Nhận request webhook từ PayOS: {}", webhookBody);
        Map<String, Object> response = new HashMap<>();

        try {
            payOSService.processPaymentWebhook(webhookBody);
            response.put("code", "00");
            response.put("desc", "success");
            return ResponseEntity.ok(response);
        } catch (Exception e) {
            log.error("[PayOS Webhook] Xử lý webhook thất bại: {}", e.getMessage(), e);
            response.put("code", "01");
            response.put("desc", e.getMessage());
            return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(response);
        }
    }

    /**
     * Tạo hoặc lấy lại link thanh toán PayOS cho một đơn hàng đã tạo
     */
    @PreAuthorize("isAuthenticated()")
    @PostMapping({"/api/v1/orders/{orderId}/payos-payment-link", "/api/orders/{orderId}/payos-payment-link"})
    public ResponseEntity<ApiResponse<PayOSPaymentResponse>> createPaymentLink(
            @PathVariable Long orderId,
            HttpServletRequest request
    ) {
        Long currentUserId = getCurrentUserId(request);
        PayOSPaymentResponse payResponse = payOSService.createOrGetPaymentLinkForOrder(orderId, currentUserId);

        return ResponseEntity.ok(
                ApiResponse.<PayOSPaymentResponse>builder()
                        .code(HttpStatus.OK.value())
                        .message("Tạo link thanh toán PayOS thành công!")
                        .data(payResponse)
                        .build()
        );
    }

    /**
     * Kiểm tra / đồng bộ trạng thái thanh toán đơn hàng từ PayOS
     */
    @PreAuthorize("isAuthenticated()")
    @GetMapping({"/api/v1/orders/{orderId}/payos-status", "/api/orders/{orderId}/payos-status"})
    public ResponseEntity<ApiResponse<Map<String, Object>>> getPaymentStatus(
            @PathVariable Long orderId,
            HttpServletRequest request
    ) {
        Long currentUserId = getCurrentUserId(request);
        String status = payOSService.checkPaymentStatus(orderId, currentUserId);

        Map<String, Object> data = new HashMap<>();
        data.put("orderId", orderId);
        data.put("paymentStatus", status);

        return ResponseEntity.ok(
                ApiResponse.<Map<String, Object>>builder()
                        .code(HttpStatus.OK.value())
                        .message("Đồng bộ trạng thái thanh toán thành công!")
                        .data(data)
                        .build()
        );
    }

    /**
     * Endpoint mô phỏng thanh toán thành công (hỗ trợ kiểm thử môi trường phát triển local)
     */
    @PreAuthorize("isAuthenticated()")
    @PostMapping({"/api/v1/orders/{orderId}/payos-simulate-success", "/api/orders/{orderId}/payos-simulate-success"})
    public ResponseEntity<ApiResponse<Map<String, Object>>> simulatePaymentSuccess(
            @PathVariable Long orderId,
            HttpServletRequest request
    ) {
        Long currentUserId = getCurrentUserId(request);
        Order order = orderRepository.findById(orderId)
                .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy đơn hàng: " + orderId));

        if (currentUserId != null && order.getUser() != null && !currentUserId.equals(order.getUser().getId())) {
            throw new AppException("Bạn không có quyền thao tác trên đơn hàng này!", HttpStatus.FORBIDDEN);
        }

        order.setPaymentStatus("PAID");
        if (order.getStatus() == OrderStatus.PENDING) {
            order.setStatus(OrderStatus.PROCESSING);
        }
        orderRepository.save(order);

        OrderStatusHistory history = OrderStatusHistory.builder()
                .order(order)
                .oldStatus(OrderStatus.PENDING)
                .newStatus(order.getStatus())
                .changedBy("PAYOS_SIMULATION")
                .note("Mô phỏng thanh toán trực tuyến thành công")
                .build();
        orderStatusHistoryRepository.save(history);

        Map<String, Object> data = new HashMap<>();
        data.put("orderId", orderId);
        data.put("paymentStatus", "PAID");

        return ResponseEntity.ok(
                ApiResponse.<Map<String, Object>>builder()
                        .code(HttpStatus.OK.value())
                        .message("Xác nhận thanh toán thành công!")
                        .data(data)
                        .build()
        );
    }
}

