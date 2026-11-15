package com.funnyshop.service;

import com.funnyshop.dto.request.OrderCheckoutItemRequest;
import com.funnyshop.dto.request.OrderCheckoutRequest;
import com.funnyshop.dto.response.OrderResponse;
import com.funnyshop.entity.Order;
import com.funnyshop.enums.OrderStatus;
import com.funnyshop.repository.OrderRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.dao.DataIntegrityViolationException;

import java.math.BigDecimal;
import java.util.ArrayList;
import java.util.List;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class OrderOrchestratorTest {

    @Mock
    private OrderService orderService;

    @Mock
    private OrderRepository orderRepository;

    @InjectMocks
    private OrderOrchestrator orderOrchestrator;

    private OrderCheckoutRequest sampleRequest;
    private Order sampleOrder;
    private OrderResponse sampleResponse;

    @BeforeEach
    void setUp() {
        sampleRequest = OrderCheckoutRequest.builder()
                .fullName("Nguyen Van A")
                .phone("0912345678")
                .address("123 Cau Giay, Ha Noi")
                .idempotencyKey("uuid-key-123")
                .items(List.of(
                        OrderCheckoutItemRequest.builder()
                                .variantId(10L)
                                .quantity(2)
                                .build()
                ))
                .build();

        sampleOrder = Order.builder()
                .id(100L)
                .customerName("Nguyen Van A")
                .phone("0912345678")
                .shippingAddress("123 Cau Giay, Ha Noi")
                .paymentMethod("COD")
                .status(OrderStatus.PENDING)
                .totalAmount(new BigDecimal("500000.00"))
                .idempotencyKey("uuid-key-123")
                .orderItems(new ArrayList<>())
                .build();

        sampleResponse = OrderResponse.fromEntity(sampleOrder);
    }

    @Test
    @DisplayName("processCheckout - Request đầu tiên thành công trả về đơn hàng mới")
    void processCheckout_Success() {
        when(orderService.checkout(eq(1L), eq(sampleRequest), eq("uuid-key-123")))
                .thenReturn(sampleResponse);

        OrderResponse response = orderOrchestrator.processCheckout(1L, sampleRequest, "uuid-key-123");

        assertNotNull(response);
        assertEquals(100L, response.getId());
        assertEquals("Nguyen Van A", response.getCustomerName());
        verify(orderService).checkout(1L, sampleRequest, "uuid-key-123");
        verifyNoInteractions(orderRepository);
    }

    @Test
    @DisplayName("processCheckout - Bắt DataIntegrityViolationException do trùng key và trả về đơn cũ an toàn")
    void processCheckout_DuplicateKey_ReturnsExistingOrder() {
        // Mô phỏng luồng createOrder bên trong văng lỗi Duplicate Entry do trùng key
        when(orderService.checkout(eq(1L), eq(sampleRequest), eq("uuid-key-123")))
                .thenThrow(new DataIntegrityViolationException("Duplicate entry 'uuid-key-123' for key 'idx_orders_idempotency_key'"));

        // Mô phỏng query lại đơn cũ với JOIN FETCH ngoài Transaction boundary
        when(orderRepository.findWithItemsByIdempotencyKey("uuid-key-123"))
                .thenReturn(Optional.of(sampleOrder));

        OrderResponse response = orderOrchestrator.processCheckout(1L, sampleRequest, "uuid-key-123");

        assertNotNull(response);
        assertEquals(100L, response.getId());
        assertEquals(new BigDecimal("500000.00"), response.getTotalAmount());
        verify(orderRepository).findWithItemsByIdempotencyKey("uuid-key-123");
    }

    @Test
    @DisplayName("processCheckout - Văng ngoại lệ khi không có idempotencyKey và ném lỗi DB khác")
    void processCheckout_WithoutKey_RethrowsException() {
        sampleRequest.setIdempotencyKey(null);
        when(orderService.checkout(eq(1L), eq(sampleRequest), isNull()))
                .thenThrow(new DataIntegrityViolationException("Some constraint violation"));

        assertThrows(DataIntegrityViolationException.class,
                () -> orderOrchestrator.processCheckout(1L, sampleRequest, null));

        verifyNoInteractions(orderRepository);
    }
}

