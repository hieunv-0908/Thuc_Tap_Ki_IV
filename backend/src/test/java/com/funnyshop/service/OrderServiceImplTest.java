package com.funnyshop.service;

import com.funnyshop.dto.request.OrderCheckoutItemRequest;
import com.funnyshop.dto.request.OrderCheckoutRequest;
import com.funnyshop.dto.response.OrderResponse;
import com.funnyshop.entity.Order;
import com.funnyshop.entity.OrderItem;
import com.funnyshop.entity.Product;
import com.funnyshop.entity.User;
import com.funnyshop.enums.OrderStatus;
import com.funnyshop.exception.AppException;
import com.funnyshop.exception.ResourceNotFoundException;
import com.funnyshop.repository.OrderRepository;
import com.funnyshop.repository.ProductRepository;
import com.funnyshop.repository.UserRepository;
import com.funnyshop.service.impl.OrderServiceImpl;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
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

    @Mock
    private ProductRepository productRepository;

    @Mock
    private UserRepository userRepository;

    @InjectMocks
    private OrderServiceImpl orderService;

    private User sampleUser;
    private Order sampleOrder;
    private Product sampleProduct1;
    private Product sampleProduct2;

    @BeforeEach
    void setUp() {
        sampleUser = User.builder()
                .id(1L)
                .username("customer1")
                .fullName("Nguyen Van A")
                .build();

        sampleProduct1 = Product.builder()
                .id(10L)
                .name("Tai nghe Bluetooth")
                .price(new BigDecimal("300000.00"))
                .stockQuantity(10)
                .isDeleted(false)
                .build();

        sampleProduct2 = Product.builder()
                .id(20L)
                .name("Chuot khong day")
                .price(new BigDecimal("150000.00"))
                .stockQuantity(5)
                .isDeleted(false)
                .build();

        OrderItem item = OrderItem.builder()
                .id(101L)
                .product(sampleProduct1)
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

    // ==========================================
    // TESTS FOR CHECKOUT & INVENTORY
    // ==========================================

    @Test
    @DisplayName("checkout - Thành công, trừ tồn kho tự động, chốt priceAtOrder, COD và PENDING")
    void checkout_Success() {
        OrderCheckoutRequest request = OrderCheckoutRequest.builder()
                .fullName("Nguyen Van A")
                .phone("0912345678")
                .address("123 Đường Cầu Giấy, Hà Nội")
                .paymentMethod("COD")
                .items(List.of(
                        new OrderCheckoutItemRequest(10L, 2),
                        new OrderCheckoutItemRequest(20L, 1)
                ))
                .build();

        when(userRepository.findById(1L)).thenReturn(Optional.of(sampleUser));
        when(productRepository.findByIdForUpdate(10L)).thenReturn(Optional.of(sampleProduct1));
        when(productRepository.findByIdForUpdate(20L)).thenReturn(Optional.of(sampleProduct2));
        when(orderRepository.save(any(Order.class))).thenAnswer(invocation -> {
            Order o = invocation.getArgument(0);
            o.setId(100L);
            return o;
        });

        OrderResponse response = orderService.checkout(1L, request);

        assertNotNull(response);
        assertEquals(100L, response.getId());
        assertEquals("Nguyen Van A", response.getCustomerName());
        assertEquals("COD", response.getPaymentMethod());
        assertEquals(OrderStatus.PENDING, response.getStatus());

        // Kiểm tra tồn kho sau khi trừ:
        // Product 1 ban đầu 10, mua 2 -> còn 8
        assertEquals(8, sampleProduct1.getStockQuantity());
        // Product 2 ban đầu 5, mua 1 -> còn 4
        assertEquals(4, sampleProduct2.getStockQuantity());

        // Kiểm tra tổng tiền: 300.000 * 2 + 150.000 * 1 = 750.000
        BigDecimal expectedTotal = new BigDecimal("750000.00");
        assertEquals(expectedTotal, response.getTotalAmount());

        // Verify product save
        verify(productRepository, times(1)).save(sampleProduct1);
        verify(productRepository, times(1)).save(sampleProduct2);

        // Verify Order items có priceAtOrder chính xác
        ArgumentCaptor<Order> orderCaptor = ArgumentCaptor.forClass(Order.class);
        verify(orderRepository).save(orderCaptor.capture());
        Order saved = orderCaptor.getValue();
        assertEquals(2, saved.getOrderItems().size());
        assertEquals(new BigDecimal("300000.00"), saved.getOrderItems().get(0).getPriceAtOrder());
        assertEquals(new BigDecimal("150000.00"), saved.getOrderItems().get(1).getPriceAtOrder());
    }

    @Test
    @DisplayName("checkout - Ném AppException BadRequest khi số lượng đặt vượt quá tồn kho (Out of stock)")
    void checkout_OutOfStock_ThrowsAppException() {
        // Tồn kho sampleProduct2 là 5, khách yêu cầu 6
        OrderCheckoutRequest request = OrderCheckoutRequest.builder()
                .fullName("Nguyen Van A")
                .phone("0912345678")
                .address("123 Đường Cầu Giấy, Hà Nội")
                .items(List.of(
                        new OrderCheckoutItemRequest(20L, 6)
                ))
                .build();

        when(userRepository.findById(1L)).thenReturn(Optional.of(sampleUser));
        when(productRepository.findByIdForUpdate(20L)).thenReturn(Optional.of(sampleProduct2));

        AppException ex = assertThrows(
                AppException.class,
                () -> orderService.checkout(1L, request)
        );

        assertEquals(HttpStatus.BAD_REQUEST, ex.getStatus());
        assertTrue(ex.getMessage().contains("không đủ số lượng tồn kho"));
        verify(orderRepository, never()).save(any());
    }

    @Test
    @DisplayName("checkout - Ném ResourceNotFoundException khi sản phẩm không tồn tại")
    void checkout_ProductNotFound_ThrowsException() {
        OrderCheckoutRequest request = OrderCheckoutRequest.builder()
                .fullName("Nguyen Van A")
                .phone("0912345678")
                .address("123 Đường Cầu Giấy, Hà Nội")
                .items(List.of(
                        new OrderCheckoutItemRequest(999L, 1)
                ))
                .build();

        when(userRepository.findById(1L)).thenReturn(Optional.of(sampleUser));
        when(productRepository.findByIdForUpdate(999L)).thenReturn(Optional.empty());

        assertThrows(
                ResourceNotFoundException.class,
                () -> orderService.checkout(1L, request)
        );

        verify(orderRepository, never()).save(any());
    }

    @Test
    @DisplayName("checkout - Ném AppException khi sản phẩm đã bị xóa mềm (isDeleted = true)")
    void checkout_SoftDeletedProduct_ThrowsException() {
        sampleProduct1.setIsDeleted(true);

        OrderCheckoutRequest request = OrderCheckoutRequest.builder()
                .fullName("Nguyen Van A")
                .phone("0912345678")
                .address("123 Đường Cầu Giấy, Hà Nội")
                .items(List.of(
                        new OrderCheckoutItemRequest(10L, 1)
                ))
                .build();

        when(userRepository.findById(1L)).thenReturn(Optional.of(sampleUser));
        when(productRepository.findByIdForUpdate(10L)).thenReturn(Optional.of(sampleProduct1));

        AppException ex = assertThrows(
                AppException.class,
                () -> orderService.checkout(1L, request)
        );

        assertEquals(HttpStatus.BAD_REQUEST, ex.getStatus());
        assertTrue(ex.getMessage().contains("ngừng kinh doanh"));
        verify(orderRepository, never()).save(any());
    }

    @Test
    @DisplayName("checkout - Tự động gộp số lượng khi request chứa nhiều item trùng productId")
    void checkout_DuplicateProductId_AggregatesQuantity() {
        // Request gửi 2 dòng cùng productId = 10L, qty = 2 và qty = 3 => tổng = 5
        OrderCheckoutRequest request = OrderCheckoutRequest.builder()
                .fullName("Nguyen Van A")
                .phone("0912345678")
                .address("123 Đường Cầu Giấy, Hà Nội")
                .items(List.of(
                        new OrderCheckoutItemRequest(10L, 2),
                        new OrderCheckoutItemRequest(10L, 3)
                ))
                .build();

        when(userRepository.findById(1L)).thenReturn(Optional.of(sampleUser));
        when(productRepository.findByIdForUpdate(10L)).thenReturn(Optional.of(sampleProduct1));
        when(orderRepository.save(any(Order.class))).thenAnswer(invocation -> invocation.getArgument(0));

        orderService.checkout(1L, request);

        // Product1 ban đầu tồn 10, mua tổng cộng 5 -> còn 5
        assertEquals(5, sampleProduct1.getStockQuantity());
        verify(productRepository, times(1)).save(sampleProduct1);
    }

    // ==========================================
    // TESTS FOR STATUS TRANSITIONS & QUERIES
    // ==========================================

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
                () -> orderService.getOrderById(1L, 2L, false)
        );

        assertEquals(HttpStatus.FORBIDDEN, ex.getStatus());
        assertTrue(ex.getMessage().contains("Bạn không có quyền"));
    }

    @Test
    @DisplayName("getOrderById - Admin có quyền xem bất kỳ đơn hàng nào của hệ thống")
    void getOrderById_Admin_CanViewAny() {
        when(orderRepository.findByIdWithDetails(1L)).thenReturn(Optional.of(sampleOrder));

        OrderResponse response = orderService.getOrderById(1L, 999L, true);

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
