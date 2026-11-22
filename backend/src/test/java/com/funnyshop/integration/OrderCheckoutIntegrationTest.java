package com.funnyshop.integration;

import com.funnyshop.dto.request.OrderCheckoutItemRequest;
import com.funnyshop.dto.request.OrderCheckoutRequest;
import com.funnyshop.dto.response.OrderResponse;
import com.funnyshop.entity.Category;
import com.funnyshop.entity.Order;
import com.funnyshop.entity.Product;
import com.funnyshop.entity.ProductVariant;
import com.funnyshop.entity.User;
import com.funnyshop.enums.OrderStatus;
import com.funnyshop.exception.AppException;
import com.funnyshop.exception.InsufficientStockException;
import com.funnyshop.repository.*;
import com.funnyshop.service.OrderOrchestrator;
import com.funnyshop.service.OrderService;
import jakarta.persistence.EntityManager;
import jakarta.persistence.PersistenceContext;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.util.List;

import static org.junit.jupiter.api.Assertions.*;

@SpringBootTest
@Transactional
class OrderCheckoutIntegrationTest {

    @Autowired
    private OrderOrchestrator orderOrchestrator;

    @Autowired
    private OrderService orderService;

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private CategoryRepository categoryRepository;

    @Autowired
    private ProductRepository productRepository;

    @Autowired
    private ProductVariantRepository productVariantRepository;

    @Autowired
    private OrderRepository orderRepository;

    @Autowired
    private OrderStatusHistoryRepository orderStatusHistoryRepository;

    @Autowired
    private FlashSaleRepository flashSaleRepository;

    @PersistenceContext
    private EntityManager entityManager;

    private User testUser;
    private Product testProduct;
    private ProductVariant testVariant;

    @BeforeEach
    void setUp() {
        // Tắt toàn bộ Flash Sale để test độc lập về giá
        if (flashSaleRepository != null) {
            flashSaleRepository.deleteAll();
        }

        // Tạo User mẫu
        testUser = userRepository.save(User.builder()
                .username("test_buyer_" + System.currentTimeMillis())
                .password("encoded_pass")
                .fullName("Test Buyer")
                .email("buyer_" + System.currentTimeMillis() + "@test.com")
                .role(User.Role.CUSTOMER)
                .status(User.Status.ACTIVE)
                .build());

        // Tạo Danh mục mẫu
        Category category = categoryRepository.save(Category.builder()
                .name("Thời trang Nam " + System.currentTimeMillis())
                .build());

        // Tạo Sản phẩm mẫu
        testProduct = productRepository.save(Product.builder()
                .name("Áo Thun Thể Thao Cao Cấp")
                .category(category)
                .isDeleted(false)
                .build());

        // Tạo SKU biến thể mẫu có tồn kho = 10
        testVariant = productVariantRepository.save(ProductVariant.builder()
                .product(testProduct)
                .sku("TSHIRT-BLK-L-" + System.currentTimeMillis())
                .color("Đen")
                .size("L")
                .price(new BigDecimal("250000.00"))
                .stockQuantity(10)
                .isDeleted(false)
                .build());
    }

    @Test
    @DisplayName("Integration - Checkout thành công, trừ kho nguyên tử và tạo bản ghi Timeline ban đầu")
    void checkout_Success_DeductsStock_CreatesTimeline() {
        OrderCheckoutRequest request = OrderCheckoutRequest.builder()
                .fullName("Nguyen Van A")
                .phone("0912345678")
                .address("123 Duong Cau Giay, Ha Noi")
                .paymentMethod("COD")
                .items(List.of(
                        OrderCheckoutItemRequest.builder()
                                .variantId(testVariant.getId())
                                .quantity(2)
                                .build()
                ))
                .build();

        OrderResponse response = orderOrchestrator.processCheckout(testUser.getId(), request, "test-idemp-1");

        assertNotNull(response);
        assertNotNull(response.getId());
        assertEquals(OrderStatus.PENDING, response.getStatus());
        assertEquals(0, new BigDecimal("500000.00").compareTo(response.getTotalAmount()));

        // Kiểm tra tồn kho đã bị trừ từ 10 xuống 8
        entityManager.clear();
        ProductVariant updatedVariant = productVariantRepository.findById(testVariant.getId()).orElseThrow();
        assertEquals(8, updatedVariant.getStockQuantity());

        // Kiểm tra Timeline có mốc PENDING ban đầu
        var timeline = orderStatusHistoryRepository.findByOrderIdOrderByCreatedAtAsc(response.getId());
        assertEquals(1, timeline.size());
        assertEquals(OrderStatus.PENDING, timeline.get(0).getNewStatus());
    }

    @Test
    @DisplayName("Integration - Chặn mua sản phẩm khi số lượng đặt vượt quá tồn kho (InsufficientStockException)")
    void checkout_OutOfStock_ThrowsException() {
        OrderCheckoutRequest request = OrderCheckoutRequest.builder()
                .fullName("Le Van C")
                .phone("0911223344")
                .address("789 Pho Hue, Ha Noi")
                .items(List.of(
                        OrderCheckoutItemRequest.builder()
                                .variantId(testVariant.getId())
                                .quantity(15) // Tồn chỉ có 10
                                .build()
                ))
                .build();

        assertThrows(InsufficientStockException.class,
                () -> orderOrchestrator.processCheckout(testUser.getId(), request, "test-idemp-out"));

        // Tồn kho giữ nguyên = 10
        ProductVariant updatedVariant = productVariantRepository.findById(testVariant.getId()).orElseThrow();
        assertEquals(10, updatedVariant.getStockQuantity());
    }

    @Test
    @DisplayName("Integration - Chặn mua sản phẩm khi sản phẩm đã bị xóa hoặc ngừng bán")
    void checkout_DiscontinuedProduct_ThrowsBadRequest() {
        // Đánh dấu sản phẩm bị xóa
        testProduct.setIsDeleted(true);
        productRepository.save(testProduct);

        OrderCheckoutRequest request = OrderCheckoutRequest.builder()
                .fullName("Pham Van D")
                .phone("0933445566")
                .address("999 Tran Phu, Ha Noi")
                .items(List.of(
                        OrderCheckoutItemRequest.builder()
                                .variantId(testVariant.getId())
                                .quantity(1)
                                .build()
                ))
                .build();

        assertThrows(AppException.class,
                () -> orderOrchestrator.processCheckout(testUser.getId(), request, "test-idemp-del"));
    }

    @Test
    @DisplayName("Integration - Hủy đơn hàng PENDING thành công: Hoàn trả tồn kho và thêm mốc CANCELLED vào Timeline kèm lý do")
    void cancelOrder_RestoresStock_AppendsTimeline() {
        int initialStock = productVariantRepository.findById(testVariant.getId()).orElseThrow().getStockQuantity();

        // Tạo đơn trước
        OrderCheckoutRequest request = OrderCheckoutRequest.builder()
                .fullName("Hoang Van E")
                .phone("0944556677")
                .address("111 Kim Ma, Ha Noi")
                .items(List.of(
                        OrderCheckoutItemRequest.builder()
                                .variantId(testVariant.getId())
                                .quantity(4)
                                .build()
                ))
                .build();

        OrderResponse created = orderOrchestrator.processCheckout(testUser.getId(), request, "test-idemp-cancel-" + System.currentTimeMillis());
        entityManager.clear();
        assertEquals(initialStock - 4, productVariantRepository.findById(testVariant.getId()).orElseThrow().getStockQuantity());

        // Khách hàng tự hủy đơn kèm lý do
        String cancelReason = "Tôi muốn đổi kích cỡ / màu sắc sản phẩm khác";
        OrderResponse cancelled = orderService.cancelOrder(created.getId(), testUser.getId(), false, cancelReason);
        assertEquals(OrderStatus.CANCELLED, cancelled.getStatus());

        // Tồn kho được hoàn lại nguyên vẹn như trước khi đặt: initialStock
        entityManager.clear();
        assertEquals(initialStock, productVariantRepository.findById(testVariant.getId()).orElseThrow().getStockQuantity());

        // Timeline có đủ 2 mốc: PENDING và CANCELLED (kèm lý do chuẩn xác)
        var timeline = orderStatusHistoryRepository.findByOrderIdOrderByCreatedAtAsc(created.getId());
        assertEquals(2, timeline.size());
        assertEquals(OrderStatus.PENDING, timeline.get(0).getNewStatus());
        assertEquals(OrderStatus.CANCELLED, timeline.get(1).getNewStatus());
        assertEquals(cancelReason, timeline.get(1).getNote());
    }
}

