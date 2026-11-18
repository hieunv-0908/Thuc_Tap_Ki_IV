package com.funnyshop.service;

import com.funnyshop.dto.request.ReturnCreateRequest;
import com.funnyshop.dto.request.ReturnReviewRequest;
import com.funnyshop.dto.response.ReturnResponse;
import com.funnyshop.entity.*;
import com.funnyshop.enums.OrderStatus;
import com.funnyshop.enums.ReturnStatus;
import com.funnyshop.exception.AppException;
import com.funnyshop.repository.*;
import com.funnyshop.service.impl.ReturnServiceImpl;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.Collections;
import java.util.List;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class ReturnServiceImplTest {

    @Mock
    private ReturnRequestRepository returnRequestRepository;

    @Mock
    private OrderRepository orderRepository;

    @Mock
    private UserRepository userRepository;

    @Mock
    private ProductVariantRepository productVariantRepository;

    @Mock
    private OrderStatusHistoryRepository orderStatusHistoryRepository;

    @Mock
    private VoucherService voucherService;

    @Mock
    private EmailService emailService;

    @InjectMocks
    private ReturnServiceImpl returnService;

    private User customer;
    private Order completedOrder;
    private ReturnRequest sampleReturnRequest;

    @BeforeEach
    void setUp() {
        customer = User.builder()
                .id(100L)
                .fullName("Nguyen Van A")
                .role(User.Role.CUSTOMER)
                .build();

        ProductVariant variant = ProductVariant.builder()
                .id(501L)
                .stockQuantity(10)
                .build();

        OrderItem item = OrderItem.builder()
                .id(1L)
                .productVariant(variant)
                .quantity(2)
                .priceAtOrder(new BigDecimal("150000"))
                .build();

        List<OrderItem> items = new ArrayList<>();
        items.add(item);

        completedOrder = Order.builder()
                .id(10L)
                .user(customer)
                .status(OrderStatus.COMPLETED)
                .totalAmount(new BigDecimal("300000"))
                .createdAt(LocalDateTime.now().minusDays(2))
                .updatedAt(LocalDateTime.now().minusDays(2))
                .orderItems(items)
                .build();

        sampleReturnRequest = ReturnRequest.builder()
                .id(1L)
                .order(completedOrder)
                .user(customer)
                .reason("Lỗi đường may")
                .description("Áo bị bung chỉ ở tay")
                .refundAmount(new BigDecimal("300000"))
                .status(ReturnStatus.PENDING)
                .createdAt(LocalDateTime.now())
                .build();
    }

    @Test
    @DisplayName("Tạo yêu cầu trả hàng thành công khi đơn COMPLETED và trong hạn 7 ngày")
    void createReturnRequest_Success() {
        when(userRepository.findById(100L)).thenReturn(Optional.of(customer));
        when(orderRepository.findByIdForUpdate(10L)).thenReturn(Optional.of(completedOrder));
        when(returnRequestRepository.findByOrderIdOrderByIdDesc(10L)).thenReturn(Collections.emptyList());
        when(returnRequestRepository.save(any(ReturnRequest.class))).thenAnswer(invocation -> {
            ReturnRequest r = invocation.getArgument(0);
            r.setId(1L);
            return r;
        });

        ReturnCreateRequest request = ReturnCreateRequest.builder()
                .reason("Lỗi kích cỡ")
                .description("Mặc quá chật")
                .bankName("MB Bank")
                .bankAccountNumber("0987654321")
                .bankAccountName("NGUYEN VAN A")
                .evidenceImages(List.of("https://example.com/img1.jpg"))
                .build();

        ReturnResponse response = returnService.createReturnRequest(100L, 10L, request);

        assertNotNull(response);
        assertEquals(1L, response.getId());
        assertEquals("Lỗi kích cỡ", response.getReason());
        assertEquals(ReturnStatus.PENDING, response.getStatus());
        assertEquals(OrderStatus.RETURN_REQUESTED, completedOrder.getStatus());

        verify(orderRepository).save(completedOrder);
        verify(orderStatusHistoryRepository).save(any(OrderStatusHistory.class));
    }

    @Test
    @DisplayName("Ném lỗi khi đơn hàng chưa ở trạng thái COMPLETED")
    void createReturnRequest_NotCompleted_ThrowsException() {
        completedOrder.setStatus(OrderStatus.SHIPPING);
        when(userRepository.findById(100L)).thenReturn(Optional.of(customer));
        when(orderRepository.findByIdForUpdate(10L)).thenReturn(Optional.of(completedOrder));

        ReturnCreateRequest request = ReturnCreateRequest.builder().reason("Không thích").build();

        AppException ex = assertThrows(AppException.class, () ->
                returnService.createReturnRequest(100L, 10L, request));

        assertTrue(ex.getMessage().contains("Hoàn thành"));
    }

    @Test
    @DisplayName("Ném lỗi khi đơn hàng đã quá 7 ngày")
    void createReturnRequest_Expired_ThrowsException() {
        completedOrder.setUpdatedAt(LocalDateTime.now().minusDays(8));
        when(userRepository.findById(100L)).thenReturn(Optional.of(customer));
        when(orderRepository.findByIdForUpdate(10L)).thenReturn(Optional.of(completedOrder));

        ReturnCreateRequest request = ReturnCreateRequest.builder().reason("Lỗi vải").build();

        AppException ex = assertThrows(AppException.class, () ->
                returnService.createReturnRequest(100L, 10L, request));

        assertTrue(ex.getMessage().contains("thời hạn"));
    }

    @Test
    @DisplayName("Admin duyệt yêu cầu trả hàng (APPROVE) chuyển đơn sang RETURNING")
    void reviewReturnRequest_Approve_Success() {
        when(returnRequestRepository.findById(1L)).thenReturn(Optional.of(sampleReturnRequest));
        when(orderRepository.findByIdForUpdate(10L)).thenReturn(Optional.of(completedOrder));
        when(returnRequestRepository.save(any(ReturnRequest.class))).thenReturn(sampleReturnRequest);

        ReturnReviewRequest review = ReturnReviewRequest.builder()
                .action("APPROVE")
                .adminNote("Gửi về kho Hà Nội")
                .build();

        ReturnResponse response = returnService.reviewReturnRequest(1L, review);

        assertEquals(ReturnStatus.APPROVED, response.getStatus());
        assertEquals(OrderStatus.RETURNING, completedOrder.getStatus());
        verify(orderRepository).save(completedOrder);
        verify(orderStatusHistoryRepository).save(any(OrderStatusHistory.class));
    }

    @Test
    @DisplayName("Admin từ chối yêu cầu trả hàng (REJECT) chuyển đơn sang RETURN_REJECTED và gửi email")
    void reviewReturnRequest_Reject_Success() {
        when(returnRequestRepository.findById(1L)).thenReturn(Optional.of(sampleReturnRequest));
        when(orderRepository.findByIdForUpdate(10L)).thenReturn(Optional.of(completedOrder));
        when(returnRequestRepository.save(any(ReturnRequest.class))).thenReturn(sampleReturnRequest);

        ReturnReviewRequest review = ReturnReviewRequest.builder()
                .action("REJECT")
                .adminNote("Sản phẩm đã qua sử dụng và bị giặt")
                .build();

        ReturnResponse response = returnService.reviewReturnRequest(1L, review);

        assertEquals(ReturnStatus.REJECTED, response.getStatus());
        assertEquals(OrderStatus.RETURN_REJECTED, completedOrder.getStatus());
        verify(orderRepository).save(completedOrder);
        verify(emailService).sendReturnRejectedEmail(any(ReturnRequest.class));
    }

    @Test
    @DisplayName("Admin hoàn tất nhận hàng hoàn: tự động hoàn tồn kho và hoàn voucher")
    void completeReturn_Success() {
        sampleReturnRequest.setStatus(ReturnStatus.APPROVED);
        when(returnRequestRepository.findById(1L)).thenReturn(Optional.of(sampleReturnRequest));
        when(orderRepository.findByIdForUpdate(10L)).thenReturn(Optional.of(completedOrder));
        when(productVariantRepository.incrementStockAtomic(501L, 2)).thenReturn(1);
        when(returnRequestRepository.save(any(ReturnRequest.class))).thenReturn(sampleReturnRequest);

        ReturnResponse response = returnService.completeReturn(1L, "Đã kiểm tra hàng đầy đủ tem mác");

        assertEquals(ReturnStatus.COMPLETED, response.getStatus());
        assertEquals(OrderStatus.RETURNED, completedOrder.getStatus());
        assertEquals("REFUNDED", completedOrder.getPaymentStatus());

        verify(productVariantRepository).incrementStockAtomic(501L, 2);
        verify(orderRepository).save(completedOrder);
    }
}

