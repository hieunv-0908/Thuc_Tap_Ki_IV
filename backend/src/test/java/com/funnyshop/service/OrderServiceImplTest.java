package com.funnyshop.service;

import com.funnyshop.dto.response.OrderResponse;
import com.funnyshop.entity.Order;
import com.funnyshop.entity.OrderItem;
import com.funnyshop.entity.Product;
import com.funnyshop.entity.User;
import com.funnyshop.enums.OrderStatus;
import com.funnyshop.exception.AppException;
import com.funnyshop.exception.ResourceNotFoundException;
import com.funnyshop.repository.OrderRepository;
import com.funnyshop.service.impl.OrderServiceImpl;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageImpl;
import org.springframework.data.domain.Pageable;
import org.springframework.http.HttpStatus;

import java.math.BigDecimal;
import java.util.ArrayList;
import java.util.List;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class OrderServiceImplTest {

    @Mock
    private OrderRepository orderRepository;

    @InjectMocks
    private OrderServiceImpl orderService;

    private User sampleUser;
    private Order sampleOrder;

    @BeforeEach
    void setUp() {
        sampleUser = User.builder()
                .id(1L)
                .username("customer1")
                .fullName("Nguyen Van A")
                .build();

        Product product = Product.builder()
                .id(10L)
                .name("Tai nghe Bluetooth")
                .price(new BigDecimal("300000.00"))
                .build();

        OrderItem item = OrderItem.builder()
                .id(101L)
                .product(product)
                .quantity(2)
                .priceAtOrder(new BigDecimal("300000.00"))
                .build();

        sampleOrder = Order.builder()
                .id(1L)
                .user(sampleUser)
                .customerName("Nguyen Van A")
                .phone("0912345678")
                .shippingAddress("123 Ha Noi")
                .totalAmount(new BigDecimal("600000.00"))
                .status(OrderStatus.PENDING)
                .orderItems(new ArrayList<>(List.of(item)))
                .build();
    }

    @Test
    @DisplayName("updateOrderStatus - Chuyển trạng thái hợp lệ từ PENDING -> PROCESSING thành công")
    void updateOrderStatus_ValidTransition() {
        when(orderRepository.findByIdWithDetails(1L)).thenReturn(Optional.of(sampleOrder));
        when(orderRepository.save(any(Order.class))).thenAnswer(invocation -> invocation.getArgument(0));

        OrderResponse response = orderService.updateOrderStatus(1L, OrderStatus.PROCESSING);

        assertNotNull(response);
        assertEquals(OrderStatus.PROCESSING, response.getStatus());
        verify(orderRepository).save(sampleOrder);
    }

    @Test
    @DisplayName("updateOrderStatus - Ném lỗi BadRequest khi chuyển trạng thái sai quy tắc PENDING -> COMPLETED")
    void updateOrderStatus_InvalidTransition_ThrowsAppException() {
        when(orderRepository.findByIdWithDetails(1L)).thenReturn(Optional.of(sampleOrder));

        AppException ex = assertThrows(
                AppException.class,
                () -> orderService.updateOrderStatus(1L, OrderStatus.COMPLETED)
        );

        assertEquals(HttpStatus.BAD_REQUEST, ex.getStatus());
        assertTrue(ex.getMessage().contains("Không thể chuyển trạng thái"));
        verify(orderRepository, never()).save(any());
    }

    @Test
    @DisplayName("updateOrderStatus - Ném lỗi BadRequest khi cố chuyển trạng thái từ đơn đã CANCELLED")
    void updateOrderStatus_CancelledTerminalState_ThrowsAppException() {
        sampleOrder.setStatus(OrderStatus.CANCELLED);
        when(orderRepository.findByIdWithDetails(1L)).thenReturn(Optional.of(sampleOrder));

        AppException ex = assertThrows(
                AppException.class,
                () -> orderService.updateOrderStatus(1L, OrderStatus.SHIPPING)
        );

        assertEquals(HttpStatus.BAD_REQUEST, ex.getStatus());
        assertTrue(ex.getMessage().contains("CANCELLED"));
        verify(orderRepository, never()).save(any());
    }

    @Test
    @DisplayName("updateOrderStatus - Ném NotFoundException khi order không tồn tại")
    void updateOrderStatus_NotFound() {
        when(orderRepository.findByIdWithDetails(999L)).thenReturn(Optional.empty());
        when(orderRepository.findById(999L)).thenReturn(Optional.empty());

        assertThrows(
                ResourceNotFoundException.class,
                () -> orderService.updateOrderStatus(999L, OrderStatus.PROCESSING)
        );
    }

    @Test
    @DisplayName("getOrderById - Customer xem đơn của chính mình thành công")
    void getOrderById_OwnOrder_Success() {
        when(orderRepository.findByIdWithDetails(1L)).thenReturn(Optional.of(sampleOrder));

        OrderResponse response = orderService.getOrderById(1L, 1L, false);

        assertNotNull(response);
        assertEquals(1L, response.getId());
    }

    @Test
    @DisplayName("getOrderById - Customer bị chặn 403 Forbidden khi xem đơn của người khác")
    void getOrderById_OtherUserOrder_ThrowsForbidden() {
        when(orderRepository.findByIdWithDetails(1L)).thenReturn(Optional.of(sampleOrder));

        AppException ex = assertThrows(
                AppException.class,
                () -> orderService.getOrderById(1L, 2L, false) // User ID là 2, đơn thuộc User ID 1
        );

        assertEquals(HttpStatus.FORBIDDEN, ex.getStatus());
        assertTrue(ex.getMessage().contains("Bạn không có quyền"));
    }

    @Test
    @DisplayName("getOrderById - Admin có quyền xem bất kỳ đơn hàng nào của hệ thống")
    void getOrderById_Admin_CanViewAny() {
        when(orderRepository.findByIdWithDetails(1L)).thenReturn(Optional.of(sampleOrder));

        OrderResponse response = orderService.getOrderById(1L, 999L, true); // isAdmin = true

        assertNotNull(response);
        assertEquals(1L, response.getId());
    }

    @Test
    @DisplayName("getAllOrders - Admin lấy danh sách đơn hàng thành công")
    void getAllOrders_Success() {
        when(orderRepository.findAllOrders(any(Pageable.class)))
                .thenReturn(new PageImpl<>(List.of(sampleOrder)));

        Page<OrderResponse> result = orderService.getAllOrders(0, 10);

        assertNotNull(result);
        assertEquals(1, result.getTotalElements());
        assertEquals(1L, result.getContent().get(0).getId());
    }
}

