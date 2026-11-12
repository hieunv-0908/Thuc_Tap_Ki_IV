package com.funnyshop.service;

import com.funnyshop.dto.request.OrderCheckoutItemRequest;
import com.funnyshop.dto.request.OrderCheckoutRequest;
import com.funnyshop.dto.response.OrderResponse;
import com.funnyshop.dto.response.OrderItemResponse;
import com.funnyshop.entity.Order;
import com.funnyshop.entity.OrderItem;
import com.funnyshop.entity.Product;
import com.funnyshop.entity.ProductVariant;
import com.funnyshop.entity.User;
import com.funnyshop.enums.OrderStatus;
import com.funnyshop.exception.AppException;
import com.funnyshop.exception.InsufficientStockException;
import com.funnyshop.exception.ResourceNotFoundException;
import com.funnyshop.repository.OrderRepository;
import com.funnyshop.repository.ProductRepository;
import com.funnyshop.repository.ProductVariantRepository;
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
import static org.mockito.ArgumentMatchers.anyList;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class OrderServiceImplTest {

    @Mock
    private OrderRepository orderRepository;

    @Mock
    private ProductRepository productRepository;

    @Mock
    private ProductVariantRepository productVariantRepository;

    @Mock
    private UserRepository userRepository;

    @InjectMocks
    private OrderServiceImpl orderService;

    private User sampleUser;
    private Order sampleOrder;
    private Product sampleProduct;
    private ProductVariant sampleVariant1;
    private ProductVariant sampleVariant2;

    @BeforeEach
    void setUp() {
        sampleUser = User.builder()
                .id(1L)
                .username("customer1")
                .fullName("Nguyen Van A")
                .build();

        sampleProduct = Product.builder()
                .id(1L)
                .name("Áo Polo Nam Classic")
                .isDeleted(false)
                .build();

        sampleVariant1 = ProductVariant.builder()
                .id(10L)
                .product(sampleProduct)
                .sku("POLO-BLK-M")
                .color("Black")
                .size("M")
                .price(new BigDecimal("300000.00"))
                .stockQuantity(10)
                .isDeleted(false)
                .build();

        sampleVariant2 = ProductVariant.builder()
                .id(20L)
                .product(sampleProduct)
                .sku("POLO-NVY-L")
                .color("Navy")
                .size("L")
                .price(new BigDecimal("320000.00"))
                .stockQuantity(5)
                .isDeleted(false)
                .build();

        OrderItem item = OrderItem.builder()
                .id(101L)
                .productVariant(sampleVariant1)
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
    // TESTS FOR CHECKOUT & ATOMIC INVENTORY
    // ==========================================

    @Test
    @DisplayName("checkout - Thành công, trừ tồn kho nguyên tử, chốt priceAtOrder, COD và PENDING")
    void checkout_Success() {
        OrderCheckoutRequest request = OrderCheckoutRequest.builder()
                .fullName("Nguyen Van A")
                .phone("0912345678")
                .address("123 Đường Cầu Giấy, Hà Nội")
                .paymentMethod("COD")
                .items(List.of(
                        OrderCheckoutItemRequest.builder().variantId(10L).quantity(2).build(),
                        OrderCheckoutItemRequest.builder().variantId(20L).quantity(1).build()
                ))
                .build();

        when(userRepository.findById(1L)).thenReturn(Optional.of(sampleUser));
        when(productVariantRepository.findByIdWithImages(10L)).thenReturn(Optional.of(sampleVariant1));
        when(productVariantRepository.findByIdWithImages(20L)).thenReturn(Optional.of(sampleVariant2));

        when(productVariantRepository.decrementStockAtomic(10L, 2)).thenReturn(1);
        when(productVariantRepository.decrementStockAtomic(20L, 1)).thenReturn(1);

        when(orderRepository.save(any(Order.class))).thenAnswer(invocation -> {
            Order order = invocation.getArgument(0);
            order.setId(100L);
            return order;
        });

        OrderResponse response = orderService.checkout(1L, request);

        assertNotNull(response);
        assertEquals(100L, response.getId());
        assertEquals("Nguyen Van A", response.getCustomerName());
        assertEquals("COD", response.getPaymentMethod());
        assertEquals(OrderStatus.PENDING, response.getStatus());

        BigDecimal expectedTotal = new BigDecimal("920000.00"); // 300k*2 + 320k*1
        assertEquals(expectedTotal, response.getTotalAmount());

        verify(productVariantRepository, times(1)).decrementStockAtomic(10L, 2);
        verify(productVariantRepository, times(1)).decrementStockAtomic(20L, 1);

        ArgumentCaptor<Order> orderCaptor = ArgumentCaptor.forClass(Order.class);
        verify(orderRepository).save(orderCaptor.capture());

        Order saved = orderCaptor.getValue();
        assertEquals(2, saved.getOrderItems().size());
        assertEquals(new BigDecimal("300000.00"), saved.getOrderItems().get(0).getPriceAtOrder());
        assertEquals(new BigDecimal("320000.00"), saved.getOrderItems().get(1).getPriceAtOrder());
    }

    @Test
    @DisplayName("checkout - Ném InsufficientStockException khi decrementStockAtomic trả về 0")
    void checkout_OutOfStock_ThrowsInsufficientStockException() {
        OrderCheckoutRequest request = OrderCheckoutRequest.builder()
                .fullName("Nguyen Van A")
                .phone("0912345678")
                .address("123 Đường Cầu Giấy, Hà Nội")
                .items(List.of(
                        OrderCheckoutItemRequest.builder().variantId(20L).quantity(6).build()
                ))
                .build();

        when(userRepository.findById(1L)).thenReturn(Optional.of(sampleUser));
        when(productVariantRepository.findByIdWithImages(20L)).thenReturn(Optional.of(sampleVariant2));
        when(productVariantRepository.decrementStockAtomic(20L, 6)).thenReturn(0);

        AppException ex = assertThrows(
                AppException.class,
                () -> orderService.checkout(1L, request)
        );

        assertEquals(HttpStatus.BAD_REQUEST, ex.getStatus());
        assertTrue(ex.getMessage().contains("không đủ số lượng tồn kho"));

        verify(orderRepository, never()).save(any());
    }

    @Test
    @DisplayName("checkout - Ném ResourceNotFoundException khi biến thể không tồn tại")
    void checkout_VariantNotFound_ThrowsException() {
        OrderCheckoutRequest request = OrderCheckoutRequest.builder()
                .fullName("Nguyen Van A")
                .phone("0912345678")
                .address("123 Đường Cầu Giấy, Hà Nội")
                .items(List.of(
                        OrderCheckoutItemRequest.builder().variantId(999L).quantity(1).build()
                ))
                .build();

        when(userRepository.findById(1L)).thenReturn(Optional.of(sampleUser));
        when(productVariantRepository.findByIdWithImages(999L)).thenReturn(Optional.empty());

        assertThrows(
                ResourceNotFoundException.class,
                () -> orderService.checkout(1L, request)
        );

        verify(orderRepository, never()).save(any());
    }

    @Test
    @DisplayName("checkout - Ném AppException khi biến thể đã bị xóa mềm")
    void checkout_SoftDeletedVariant_ThrowsException() {
        sampleVariant1.setIsDeleted(true);

        OrderCheckoutRequest request = OrderCheckoutRequest.builder()
                .fullName("Nguyen Van A")
                .phone("0912345678")
                .address("123 Đường Cầu Giấy, Hà Nội")
                .items(List.of(
                        OrderCheckoutItemRequest.builder().variantId(10L).quantity(1).build()
                ))
                .build();

        when(userRepository.findById(1L)).thenReturn(Optional.of(sampleUser));
        when(productVariantRepository.findByIdWithImages(10L)).thenReturn(Optional.of(sampleVariant1));

        AppException ex = assertThrows(
                AppException.class,
                () -> orderService.checkout(1L, request)
        );

        assertEquals(HttpStatus.BAD_REQUEST, ex.getStatus());
        assertTrue(ex.getMessage().contains("ngừng kinh doanh"));

        verify(orderRepository, never()).save(any());
    }

    @Test
    @DisplayName("checkout - Tự động gộp số lượng khi request chứa nhiều item trùng variantId")
    void checkout_DuplicateVariantId_AggregatesQuantity() {
        OrderCheckoutRequest request = OrderCheckoutRequest.builder()
                .fullName("Nguyen Van A")
                .phone("0912345678")
                .address("123 Đường Cầu Giấy, Hà Nội")
                .items(List.of(
                        OrderCheckoutItemRequest.builder().variantId(10L).quantity(2).build(),
                        OrderCheckoutItemRequest.builder().variantId(10L).quantity(3).build()
                ))
                .build();

        when(userRepository.findById(1L)).thenReturn(Optional.of(sampleUser));
        when(productVariantRepository.findByIdWithImages(10L)).thenReturn(Optional.of(sampleVariant1));
        when(productVariantRepository.decrementStockAtomic(10L, 5)).thenReturn(1);

        when(orderRepository.save(any(Order.class)))
                .thenAnswer(invocation -> invocation.getArgument(0));

        orderService.checkout(1L, request);

        verify(productVariantRepository, times(1)).decrementStockAtomic(10L, 5);
    }

    @Test
    @DisplayName("checkout - Ném lỗi BadRequest khi gửi variantId null cho sản phẩm có nhiều biến thể")
    void checkout_MultipleVariantsWithoutVariantId_ThrowsAppException() {
        OrderCheckoutRequest request = OrderCheckoutRequest.builder()
                .fullName("Nguyen Van A")
                .phone("0912345678")
                .address("123 Ha Noi")
                .paymentMethod("COD")
                .items(List.of(
                        OrderCheckoutItemRequest.builder().productId(1L).quantity(1).build()
                ))
                .build();

        when(userRepository.findById(1L)).thenReturn(Optional.of(sampleUser));
        when(productVariantRepository.findByProductIdAndIsDeletedFalse(1L))
                .thenReturn(List.of(sampleVariant1, sampleVariant2));

        AppException ex = assertThrows(
                AppException.class,
                () -> orderService.checkout(1L, request)
        );

        assertEquals(HttpStatus.BAD_REQUEST, ex.getStatus());
        assertTrue(ex.getMessage().contains("nhiều biến thể"));
    }

    @Test
    @DisplayName("checkout - Ném lỗi BadRequest khi variant không thuộc product tương ứng")
    void checkout_VariantDoesNotBelongToProduct_ThrowsAppException() {
        OrderCheckoutRequest request = OrderCheckoutRequest.builder()
                .fullName("Nguyen Van A")
                .phone("0912345678")
                .address("123 Ha Noi")
                .paymentMethod("COD")
                .items(List.of(
                        OrderCheckoutItemRequest.builder().productId(999L).variantId(10L).quantity(1).build()
                ))
                .build();

        when(userRepository.findById(1L)).thenReturn(Optional.of(sampleUser));
        when(productVariantRepository.findByIdWithImages(10L)).thenReturn(Optional.of(sampleVariant1));

        AppException ex = assertThrows(
                AppException.class,
                () -> orderService.checkout(1L, request)
        );

        assertEquals(HttpStatus.BAD_REQUEST, ex.getStatus());
        assertTrue(ex.getMessage().contains("không thuộc về sản phẩm"));
    }

    // ==========================================
    // TESTS FOR STATUS TRANSITIONS & QUERIES
    // ==========================================

    @Test
    @DisplayName("updateOrderStatus - Chuyển trạng thái hợp lệ từ PENDING -> PROCESSING thành công")
    void updateOrderStatus_ValidTransition() {
        when(orderRepository.findByIdForUpdate(1L))
                .thenReturn(Optional.of(sampleOrder));

        when(orderRepository.save(any(Order.class)))
                .thenAnswer(invocation -> invocation.getArgument(0));

        OrderResponse response = orderService.updateOrderStatus(
                1L, OrderStatus.PROCESSING
        );

        assertNotNull(response);
        assertEquals(OrderStatus.PROCESSING, response.getStatus());

        verify(orderRepository).findByIdForUpdate(1L);
        verify(orderRepository).save(sampleOrder);
    }

    @Test
    @DisplayName("updateOrderStatus - Ném lỗi BadRequest khi chuyển trạng thái sai quy tắc PENDING -> COMPLETED")
    void updateOrderStatus_InvalidTransition_ThrowsAppException() {
        when(orderRepository.findByIdForUpdate(1L))
                .thenReturn(Optional.of(sampleOrder));

        AppException ex = assertThrows(
                AppException.class,
                () -> orderService.updateOrderStatus(1L, OrderStatus.COMPLETED)
        );

        assertEquals(HttpStatus.BAD_REQUEST, ex.getStatus());
        assertTrue(ex.getMessage().contains("Không thể chuyển trạng thái"));

        verify(orderRepository, never()).save(any(Order.class));
    }

    @Test
    @DisplayName("updateOrderStatus - Ném lỗi BadRequest khi cố chuyển trạng thái từ đơn đã CANCELLED")
    void updateOrderStatus_CancelledTerminalState_ThrowsAppException() {
        sampleOrder.setStatus(OrderStatus.CANCELLED);

        when(orderRepository.findByIdForUpdate(1L))
                .thenReturn(Optional.of(sampleOrder));

        AppException ex = assertThrows(
                AppException.class,
                () -> orderService.updateOrderStatus(1L, OrderStatus.SHIPPING)
        );

        assertEquals(HttpStatus.BAD_REQUEST, ex.getStatus());
        assertTrue(ex.getMessage().contains("CANCELLED"));

        verify(orderRepository, never()).save(any(Order.class));
    }

    @Test
    @DisplayName("updateOrderStatus - Ném NotFoundException khi order không tồn tại")
    void updateOrderStatus_NotFound() {
        when(orderRepository.findByIdForUpdate(999L))
                .thenReturn(Optional.empty());

        assertThrows(
                ResourceNotFoundException.class,
                () -> orderService.updateOrderStatus(999L, OrderStatus.PROCESSING)
        );

        verify(orderRepository).findByIdForUpdate(999L);
        verify(orderRepository, never()).save(any(Order.class));
    }

    // ==========================================
    // TESTS FOR STOCK ROLLBACK
    // ==========================================

    @Test
    @DisplayName("updateOrderStatus - Hủy đơn hàng thành công và gọi incrementStockAtomic hoàn lại tồn kho")
    void updateOrderStatus_CancelOrder_CallsIncrementStockAtomic() {
        when(orderRepository.findByIdForUpdate(1L))
                .thenReturn(Optional.of(sampleOrder));

        when(productVariantRepository.incrementStockAtomic(10L, 2)).thenReturn(1);

        when(orderRepository.save(any(Order.class)))
                .thenAnswer(invocation -> invocation.getArgument(0));

        OrderResponse response = orderService.updateOrderStatus(
                1L, OrderStatus.CANCELLED
        );

        assertNotNull(response);
        assertEquals(OrderStatus.CANCELLED, response.getStatus());

        verify(productVariantRepository, times(1)).incrementStockAtomic(10L, 2);
        verify(orderRepository).save(sampleOrder);
    }

    @Test
    @DisplayName("updateOrderStatus - Không đánh dấu hủy nếu không thể hoàn tồn kho")
    void updateOrderStatus_CancelOrder_StockRollbackFailureDoesNotCancelOrder() {
        sampleOrder.getOrderItems().add(OrderItem.builder()
                .id(102L)
                .productVariant(sampleVariant2)
                .quantity(3)
                .priceAtOrder(new BigDecimal("320000.00"))
                .build());
        when(orderRepository.findByIdForUpdate(1L))
                .thenReturn(Optional.of(sampleOrder));
        when(productVariantRepository.incrementStockAtomic(10L, 2)).thenReturn(1);
        when(productVariantRepository.incrementStockAtomic(20L, 3)).thenReturn(0);

        AppException ex = assertThrows(
                AppException.class,
                () -> orderService.updateOrderStatus(1L, OrderStatus.CANCELLED)
        );

        assertEquals(HttpStatus.INTERNAL_SERVER_ERROR, ex.getStatus());
        assertEquals(OrderStatus.PENDING, sampleOrder.getStatus());
        verify(productVariantRepository).incrementStockAtomic(10L, 2);
        verify(productVariantRepository).incrementStockAtomic(20L, 3);
        verify(orderRepository, never()).save(any(Order.class));
    }

    @Test
    @DisplayName("cancelOrder - Hủy đơn và hoàn tồn kho qua luồng admin")
    void cancelOrder_Success() {
        sampleOrder.getOrderItems().add(OrderItem.builder()
                .id(102L)
                .productVariant(sampleVariant2)
                .quantity(3)
                .priceAtOrder(new BigDecimal("320000.00"))
                .build());
        when(orderRepository.findById(1L))
                .thenReturn(Optional.of(sampleOrder));
        when(orderRepository.findByIdForUpdate(1L))
                .thenReturn(Optional.of(sampleOrder));
        when(productVariantRepository.incrementStockAtomic(10L, 2)).thenReturn(1);
        when(productVariantRepository.incrementStockAtomic(20L, 3)).thenReturn(1);
        when(orderRepository.save(any(Order.class)))
                .thenAnswer(invocation -> invocation.getArgument(0));

        OrderResponse response = orderService.cancelOrder(1L);

        assertEquals(OrderStatus.CANCELLED, response.getStatus());
        verify(productVariantRepository).incrementStockAtomic(10L, 2);
        verify(productVariantRepository).incrementStockAtomic(20L, 3);
        verify(orderRepository).save(sampleOrder);
    }

    @Test
    @DisplayName("cancelOrder - Ném lỗi khi cố hủy đơn đang ở trạng thái SHIPPING")
    void cancelOrder_ShippingStatus_ThrowsAppException() {
        sampleOrder.setStatus(OrderStatus.SHIPPING);
        when(orderRepository.findById(1L))
                .thenReturn(Optional.of(sampleOrder));

        AppException ex = assertThrows(
                AppException.class,
                () -> orderService.cancelOrder(1L)
        );

        assertEquals(HttpStatus.BAD_REQUEST, ex.getStatus());
        assertTrue(ex.getMessage().contains("SHIPPING"));
        assertTrue(ex.getMessage().contains("Không thể hủy"));

        verify(orderRepository, never()).findByIdForUpdate(any());
        verify(productVariantRepository, never()).incrementStockAtomic(any(), any());
        verify(orderRepository, never()).save(any(Order.class));
    }

    @Test
    @DisplayName("updateOrderStatus - Ném lỗi khi cố chuyển SHIPPING sang CANCELLED")
    void updateOrderStatus_ShippingToCancelled_ThrowsAppException() {
        sampleOrder.setStatus(OrderStatus.SHIPPING);
        when(orderRepository.findByIdForUpdate(1L))
                .thenReturn(Optional.of(sampleOrder));

        AppException ex = assertThrows(
                AppException.class,
                () -> orderService.updateOrderStatus(1L, OrderStatus.CANCELLED)
        );

        assertEquals(HttpStatus.BAD_REQUEST, ex.getStatus());
        assertTrue(ex.getMessage().contains("Không thể chuyển trạng thái"));
        assertTrue(ex.getMessage().contains("SHIPPING"));
        assertTrue(ex.getMessage().contains("CANCELLED"));

        verify(productVariantRepository, never()).incrementStockAtomic(any(), any());
        verify(orderRepository, never()).save(any(Order.class));
    }

    // ==========================================
    // TESTS FOR GET ORDER
    // ==========================================

    @Test
    @DisplayName("getOrderById - Customer xem đơn của chính mình thành công")
    void getOrderById_OwnOrder_Success() {
        when(orderRepository.findByIdWithDetails(1L))
                .thenReturn(Optional.of(sampleOrder));

        OrderResponse response = orderService.getOrderById(1L, 1L, false);

        assertNotNull(response);
        assertEquals(1L, response.getId());
    }

    @Test
    @DisplayName("getOrderById - Customer bị chặn 403 Forbidden khi xem đơn của người khác")
    void getOrderById_OtherUserOrder_ThrowsForbidden() {
        when(orderRepository.findByIdWithDetails(1L))
                .thenReturn(Optional.of(sampleOrder));

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
        when(orderRepository.findByIdWithDetails(1L))
                .thenReturn(Optional.of(sampleOrder));

        OrderResponse response = orderService.getOrderById(1L, 999L, true);

        assertNotNull(response);
        assertEquals(1L, response.getId());
    }

    // ==========================================
    // TESTS FOR GET ALL ORDERS
    // ==========================================

    @Test
    @DisplayName("getAllOrders - Admin lấy danh sách đơn hàng thành công")
    void getAllOrders_Success() {
        when(orderRepository.findAllOrders(any(Pageable.class)))
                .thenReturn(new PageImpl<>(List.of(sampleOrder)));
        when(orderRepository.findAllWithDetailsByIds(anyList()))
                .thenReturn(List.of(sampleOrder));

        Page<OrderResponse> result = orderService.getAllOrders(0, 10);

        assertNotNull(result);
        assertEquals(1, result.getTotalElements());
        assertEquals(1L, result.getContent().get(0).getId());
    }

    @Test
    @DisplayName("getAllOrders - Bảo toàn tuyệt đối thứ tự sắp xếp (Sort Order Preservation)")
    void getAllOrders_PreservesSortOrder() {
        Order order1 = Order.builder().id(10L).customerName("User 10").status(OrderStatus.PENDING).totalAmount(BigDecimal.TEN).build();
        Order order2 = Order.builder().id(20L).customerName("User 20").status(OrderStatus.PENDING).totalAmount(BigDecimal.TEN).build();
        Order order3 = Order.builder().id(30L).customerName("User 30").status(OrderStatus.PENDING).totalAmount(BigDecimal.TEN).build();

        // Phase 1 trả về thứ tự [30, 20, 10] (createdAt DESC)
        when(orderRepository.findAllOrders(any(Pageable.class)))
                .thenReturn(new PageImpl<>(List.of(order3, order2, order1)));

        // Phase 2 MySQL WHERE IN có thể trả về xáo trộn [10, 30, 20]
        when(orderRepository.findAllWithDetailsByIds(anyList()))
                .thenReturn(List.of(order1, order3, order2));

        Page<OrderResponse> result = orderService.getAllOrders(0, 10);

        assertNotNull(result);
        assertEquals(3, result.getTotalElements());
        // Thứ tự kết quả trả về PHẢI là [30, 20, 10]
        assertEquals(30L, result.getContent().get(0).getId());
        assertEquals(20L, result.getContent().get(1).getId());
        assertEquals(10L, result.getContent().get(2).getId());
    }

    @Test
    @DisplayName("OrderItemResponse - Dữ liệu mồ côi (product/variant bị xóa) vẫn map an toàn không văng Exception")
    void fromEntity_OrphanedData_HandlesGracefullyWithoutException() {
        OrderItem orphanedItem = OrderItem.builder()
                .id(999L)
                .quantity(2)
                .priceAtOrder(new BigDecimal("150000.00"))
                .productVariant(null)
                .product(null)
                .build();

        OrderItemResponse response = OrderItemResponse.fromEntity(orphanedItem);

        assertNotNull(response);
        assertEquals(999L, response.getId());
        assertEquals("Sản phẩm không khả dụng", response.getProductName());
        assertNull(response.getImageUrl());
        assertEquals(2, response.getQuantity());
        assertEquals(new BigDecimal("150000.00"), response.getPriceAtOrder());
    }

    // ==========================================
    // TESTS FOR JPA ENTITY EQUALS/HASHCODE & DTO COMPLETENESS
    // ==========================================

    @Test
    @DisplayName("JPA Safety - Hai transient OrderItem (id == null) không bị ghi đè lẫn nhau khi đưa vào Set")
    void entityEqualsAndHashCode_TransientEntitiesWithNullId_DoNotOverwriteInSet() {
        OrderItem item1 = OrderItem.builder()
                .quantity(1)
                .priceAtOrder(new BigDecimal("100000.00"))
                .build();

        OrderItem item2 = OrderItem.builder()
                .quantity(2)
                .priceAtOrder(new BigDecimal("200000.00"))
                .build();

        // Hai transient entity chưa có ID thì không bằng nhau trừ khi cùng con trỏ ô nhớ
        assertNotEquals(item1, item2);
        assertEquals(item1, item1);

        java.util.Set<OrderItem> itemSet = new java.util.HashSet<>();
        itemSet.add(item1);
        itemSet.add(item2);

        // Bảo đảm không bị ghi đè mất phần tử trong HashSet
        assertEquals(2, itemSet.size());
    }

    @Test
    @DisplayName("DTO Completeness - OrderResponse.fromEntity nạp đầy đủ dữ liệu, không bị Silent Data Loss")
    void orderResponse_CompleteMapping_NoSilentDataLoss() {
        OrderResponse response = OrderResponse.fromEntity(sampleOrder);

        assertNotNull(response);
        assertEquals(1L, response.getId());
        assertEquals(1L, response.getUserId());
        assertEquals("Nguyen Van A", response.getCustomerName());
        assertEquals(new BigDecimal("600000.00"), response.getTotalAmount());
        assertNotNull(response.getItems());
        assertEquals(1, response.getItems().size());

        var itemResp = response.getItems().get(0);
        assertEquals(101L, itemResp.getId());
        assertEquals(10L, itemResp.getVariantId());
        assertEquals(1L, itemResp.getProductId());
        assertEquals("Áo Polo Nam Classic", itemResp.getProductName());
        assertEquals("POLO-BLK-M", itemResp.getSku());
        assertEquals(2, itemResp.getQuantity());
        assertEquals(new BigDecimal("300000.00"), itemResp.getPriceAtOrder());
    }

    @Test
    @DisplayName("Lombok ToString Safety - toString() không bị đệ quy vòng lặp và an toàn cho Lazy Loading")
    void orderToString_DoesNotThrowException_AndSafeFromLazy() {
        String orderStr = assertDoesNotThrow(() -> sampleOrder.toString());
        assertNotNull(orderStr);
        assertTrue(orderStr.contains("id=1"));
        assertTrue(orderStr.contains("customerName=Nguyen Van A"));

        String itemStr = assertDoesNotThrow(() -> sampleOrder.getOrderItems().get(0).toString());
        assertNotNull(itemStr);
        assertTrue(itemStr.contains("id=101"));
        assertTrue(itemStr.contains("quantity=2"));
    }
}
