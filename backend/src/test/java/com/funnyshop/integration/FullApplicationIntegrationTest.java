package com.funnyshop.integration;

import com.funnyshop.entity.Category;
import com.funnyshop.entity.Order;
import com.funnyshop.entity.Product;
import com.funnyshop.entity.User;
import com.funnyshop.enums.OrderStatus;
import com.funnyshop.repository.CategoryRepository;
import com.funnyshop.repository.OrderRepository;
import com.funnyshop.repository.ProductRepository;
import com.funnyshop.repository.UserRepository;
import com.funnyshop.security.JwtTokenProvider;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.http.MediaType;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.setup.MockMvcBuilders;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.context.WebApplicationContext;

import java.math.BigDecimal;

import static org.hamcrest.Matchers.*;
import static org.springframework.security.test.web.servlet.setup.SecurityMockMvcConfigurers.springSecurity;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@SpringBootTest
@Transactional
class FullApplicationIntegrationTest {

    private MockMvc mockMvc;

    @Autowired
    private WebApplicationContext webApplicationContext;

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private CategoryRepository categoryRepository;

    @Autowired
    private ProductRepository productRepository;

    @Autowired
    private OrderRepository orderRepository;

    @Autowired
    private JwtTokenProvider jwtTokenProvider;

    private String adminToken;
    private String customerToken;
    private User adminUser;
    private User customerUser;
    private Category activeCategory;
    private Product activeProduct;
    private Order customerOrder;

    @BeforeEach
    void setUp() {
        mockMvc = MockMvcBuilders.webAppContextSetup(webApplicationContext)
                .apply(springSecurity())
                .build();

        // 1. Tạo User Admin & Customer
        adminUser = userRepository.save(User.builder()
                .username("admin_test_" + System.currentTimeMillis())
                .email("admin_test_" + System.currentTimeMillis() + "@test.com")
                .password("$2a$10$e84WvH6V8LwT8Z.eC0vHdeRzB8F.NnB0cI3bEaXp1o2q3r4s5t6u")
                .fullName("Admin Test")
                .role(User.Role.ADMIN)
                .status(User.Status.ACTIVE)
                .build());

        customerUser = userRepository.save(User.builder()
                .username("customer_test_" + System.currentTimeMillis())
                .email("customer_test_" + System.currentTimeMillis() + "@test.com")
                .password("$2a$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LJZdL17lhWy")
                .fullName("Customer Test")
                .role(User.Role.CUSTOMER)
                .status(User.Status.ACTIVE)
                .build());

        adminToken = jwtTokenProvider.generateToken(adminUser, adminUser.getId(), "ROLE_ADMIN");
        customerToken = jwtTokenProvider.generateToken(customerUser, customerUser.getId(), "ROLE_CUSTOMER");

        // 2. Tạo Category
        activeCategory = categoryRepository.save(Category.builder()
                .name("Thời trang nam test")
                .description("Mô tả test")
                .isDeleted(false)
                .build());

        // 3. Tạo Product
        activeProduct = productRepository.save(Product.builder()
                .name("Áo Sơ Mi Nam Test")
                .description("Mô tả sản phẩm test")
                .price(new BigDecimal("299000.00"))
                .stockQuantity(50)
                .category(activeCategory)
                .isDeleted(false)
                .build());

        // 4. Tạo Order
        customerOrder = orderRepository.save(Order.builder()
                .user(customerUser)
                .customerName("Customer Test")
                .phone("0988888888")
                .shippingAddress("123 Test Street")
                .totalAmount(new BigDecimal("299000.00"))
                .status(OrderStatus.PENDING)
                .build());
    }

    // ==========================================
    // KIỂM THỬ PUBLIC API
    // ==========================================

    @Test
    @DisplayName("Public - GET /api/v1/products trả 200 OK và chỉ trả sản phẩm chưa xóa mềm")
    void testPublicGetProducts() throws Exception {
        // Tạo thêm 1 sản phẩm đã xóa mềm
        productRepository.save(Product.builder()
                .name("Sản phẩm đã xóa mềm")
                .price(new BigDecimal("100000.00"))
                .stockQuantity(10)
                .category(activeCategory)
                .isDeleted(true)
                .build());

        mockMvc.perform(get("/api/v1/products")
                        .param("sortBy", "price")
                        .param("sortDir", "asc"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.code", is(200)))
                .andExpect(jsonPath("$.data.content", not(empty())))
                .andExpect(jsonPath("$.data.content[*].name", not(hasItem("Sản phẩm đã xóa mềm"))));
    }

    @Test
    @DisplayName("Public - GET /api/categories trả 200 OK danh sách danh mục")
    void testPublicGetCategories() throws Exception {
        mockMvc.perform(get("/api/categories"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.code", is(200)))
                .andExpect(jsonPath("$.data", not(empty())));
    }

    @Test
    @DisplayName("Public - GET /api/v1/products/{id} trả 200 OK chi tiết sản phẩm")
    void testPublicGetProductDetail() throws Exception {
        mockMvc.perform(get("/api/v1/products/" + activeProduct.getId()))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.code", is(200)))
                .andExpect(jsonPath("$.data.id", is(activeProduct.getId().intValue())))
                .andExpect(jsonPath("$.data.name", is("Áo Sơ Mi Nam Test")));
    }

    // ==========================================
    // KIỂM THỬ ADMIN CRUD & SOFT DELETE
    // ==========================================

    @Test
    @DisplayName("Admin - POST /api/v1/admin/products tạo sản phẩm mới thành công")
    void testAdminCreateProduct() throws Exception {
        String newProductJson = """
            {
                "name": "Giày Thể Thao Mới",
                "description": "Giày êm ái",
                "price": 550000.00,
                "stockQuantity": 25,
                "categoryId": %d
            }
            """.formatted(activeCategory.getId());

        mockMvc.perform(post("/api/v1/admin/products")
                        .header("Authorization", "Bearer " + adminToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(newProductJson))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.code", is(201)))
                .andExpect(jsonPath("$.data.name", is("Giày Thể Thao Mới")));
    }

    @Test
    @DisplayName("Admin - PUT /api/v1/admin/products/{id} cập nhật sản phẩm thành công")
    void testAdminUpdateProduct() throws Exception {
        String updateProductJson = """
            {
                "name": "Áo Sơ Mi Nam Updated",
                "description": "Mô tả mới",
                "price": 350000.00,
                "stockQuantity": 60,
                "categoryId": %d
            }
            """.formatted(activeCategory.getId());

        mockMvc.perform(put("/api/v1/admin/products/" + activeProduct.getId())
                        .header("Authorization", "Bearer " + adminToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(updateProductJson))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.code", is(200)))
                .andExpect(jsonPath("$.data.name", is("Áo Sơ Mi Nam Updated")));
    }

    @Test
    @DisplayName("Admin - DELETE /api/v1/admin/products/{id} xóa mềm sản phẩm và không còn xuất hiện ở Public GET")
    void testAdminDeleteProductSoftDelete() throws Exception {
        mockMvc.perform(delete("/api/v1/admin/products/" + activeProduct.getId())
                        .header("Authorization", "Bearer " + adminToken))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.code", is(200)))
                .andExpect(jsonPath("$.message", containsString("xóa mềm")));

        // Kiểm tra trong database bản ghi vẫn tồn tại với isDeleted = true
        Product inDb = productRepository.findById(activeProduct.getId()).orElse(null);
        org.junit.jupiter.api.Assertions.assertNotNull(inDb);
        org.junit.jupiter.api.Assertions.assertTrue(inDb.getIsDeleted());

        // Kiểm tra gọi public GET chi tiết -> 404 Not Found
        mockMvc.perform(get("/api/v1/products/" + activeProduct.getId()))
                .andExpect(status().isNotFound())
                .andExpect(jsonPath("$.code", is(404)));
    }

    @Test
    @DisplayName("Security - Customer gọi API Admin bị từ chối 403 Forbidden")
    void testCustomerCallingAdminApiForbidden() throws Exception {
        mockMvc.perform(delete("/api/v1/admin/products/" + activeProduct.getId())
                        .header("Authorization", "Bearer " + customerToken))
                .andExpect(status().isForbidden());
    }

    @Test
    @DisplayName("Security - Không có Token gọi API Admin bị từ chối 401 Unauthorized")
    void testUnauthenticatedCallingAdminApi() throws Exception {
        mockMvc.perform(delete("/api/v1/admin/products/" + activeProduct.getId()))
                .andExpect(status().isUnauthorized());
    }

    // ==========================================
    // KIỂM THỬ ORDER STATE MANAGEMENT & OWNERSHIP
    // ==========================================

    @Test
    @DisplayName("Admin - GET /api/v1/admin/orders lấy danh sách đơn hàng thành công")
    void testAdminGetAllOrders() throws Exception {
        mockMvc.perform(get("/api/v1/admin/orders")
                        .header("Authorization", "Bearer " + adminToken))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.code", is(200)))
                .andExpect(jsonPath("$.data.content", not(empty())));
    }

    @Test
    @DisplayName("Admin - PUT /api/v1/admin/orders/{id}/status chuyển trạng thái PENDING -> PROCESSING thành công")
    void testAdminUpdateOrderStatusSuccess() throws Exception {
        String statusJson = """
            {
                "status": "PROCESSING"
            }
            """;

        mockMvc.perform(put("/api/v1/admin/orders/" + customerOrder.getId() + "/status")
                        .header("Authorization", "Bearer " + adminToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(statusJson))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.code", is(200)))
                .andExpect(jsonPath("$.data.status", is("PROCESSING")));
    }

    @Test
    @DisplayName("Admin - Chuyển trạng thái vi phạm quy tắc PENDING -> COMPLETED trả 400 Bad Request")
    void testAdminUpdateOrderStatusInvalidRuleFails() throws Exception {
        String statusJson = """
            {
                "status": "COMPLETED"
            }
            """;

        mockMvc.perform(put("/api/v1/admin/orders/" + customerOrder.getId() + "/status")
                        .header("Authorization", "Bearer " + adminToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(statusJson))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.code", is(400)))
                .andExpect(jsonPath("$.message", containsString("Không thể chuyển trạng thái")));
    }

    @Test
    @DisplayName("Customer - GET /api/v1/orders/my-orders xem lịch sử đơn hàng của mình")
    void testCustomerGetMyOrders() throws Exception {
        mockMvc.perform(get("/api/v1/orders/my-orders")
                        .header("Authorization", "Bearer " + customerToken))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.code", is(200)))
                .andExpect(jsonPath("$.data", not(empty())))
                .andExpect(jsonPath("$.data[0].id", is(customerOrder.getId().intValue())));
    }

    @Test
    @DisplayName("Customer - Xem đơn hàng của chính mình thành công 200 OK")
    void testCustomerGetOwnOrderDetail() throws Exception {
        mockMvc.perform(get("/api/v1/orders/" + customerOrder.getId())
                        .header("Authorization", "Bearer " + customerToken))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.code", is(200)))
                .andExpect(jsonPath("$.data.id", is(customerOrder.getId().intValue())));
    }

    @Test
    @DisplayName("Customer - Xem đơn của người khác bị trả lỗi 403 Forbidden")
    void testCustomerCannotViewOtherUserOrder() throws Exception {
        // Tạo thêm 1 user khác và 1 đơn khác
        User otherUser = userRepository.save(User.builder()
                .username("other_user_" + System.currentTimeMillis())
                .email("other_" + System.currentTimeMillis() + "@test.com")
                .password("123456")
                .fullName("Other User")
                .role(User.Role.CUSTOMER)
                .status(User.Status.ACTIVE)
                .build());

        Order otherOrder = orderRepository.save(Order.builder()
                .user(otherUser)
                .customerName("Other User")
                .phone("0911111111")
                .shippingAddress("456 Other St")
                .totalAmount(new BigDecimal("100000.00"))
                .status(OrderStatus.PENDING)
                .build());

        // customerUser cố tình truy cập đơn của otherUser
        mockMvc.perform(get("/api/v1/orders/" + otherOrder.getId())
                        .header("Authorization", "Bearer " + customerToken))
                .andExpect(status().isForbidden())
                .andExpect(jsonPath("$.code", is(403)))
                .andExpect(jsonPath("$.message", containsString("Bạn không có quyền")));
    }
}
