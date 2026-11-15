package com.funnyshop.service;

import com.funnyshop.dto.request.OrderCheckoutRequest;
import com.funnyshop.dto.response.OrderResponse;
import com.funnyshop.entity.Order;
import com.funnyshop.exception.AppException;
import com.funnyshop.repository.OrderRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;

/**
 * OrderOrchestrator
 *
 * Lớp điều phối giao dịch Checkout NẰM NGOÀI Transaction boundary.
 * Mục đích:
 *   - Bắt lỗi DataIntegrityViolationException khi có 2 request gửi cùng một Idempotency-Key
 *     đập vào server cùng một lúc (cách nhau vài mili-giây).
 *   - Vì lớp này KHÔNG mang annotation @Transactional, Spring Transaction Manager của luồng
 *     createOrder bên trong đã rollback sạch sẽ mà KHÔNG làm hỏng (poison) Persistence Context
 *     của phiên hiện tại.
 *   - Cho phép truy vấn lại đơn hàng đã tạo thành công trước đó qua findWithItemsByIdempotencyKey
 *     trên một session mới an toàn và trả về 200 OK cho client, triệt tiêu lỗi 500 UnexpectedRollbackException.
 */
@Slf4j
@Service
@RequiredArgsConstructor
public class OrderOrchestrator {

    private final OrderService orderService;
    private final OrderRepository orderRepository;

    public OrderResponse processCheckout(Long userId, OrderCheckoutRequest request, String idempotencyKey) {
        String finalKey = (idempotencyKey != null && !idempotencyKey.isBlank())
                ? idempotencyKey.trim()
                : (request != null && request.getIdempotencyKey() != null ? request.getIdempotencyKey().trim() : null);

        try {
            return orderService.checkout(userId, request, finalKey);
        } catch (DataIntegrityViolationException ex) {
            if (finalKey != null && !finalKey.isBlank()) {
                log.warn("[Idempotency] Phát hiện request trùng IdempotencyKey [{}]. Truy xuất đơn hàng đã tạo trước đó.", finalKey);
                // Truy vấn lại đơn hàng kèm orderItems bằng query JOIN FETCH (chống LazyInit ngoài Transaction)
                Order existingOrder = orderRepository.findWithItemsByIdempotencyKey(finalKey)
                        .orElseThrow(() -> new AppException("Xung đột giao dịch đặt hàng, vui lòng thử lại sau!", HttpStatus.CONFLICT));

                return OrderResponse.fromEntity(existingOrder);
            }
            throw ex;
        }
    }
}

