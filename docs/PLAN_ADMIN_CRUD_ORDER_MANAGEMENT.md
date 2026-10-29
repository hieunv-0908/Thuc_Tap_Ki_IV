# KẾ HOẠCH TRIỂN KHAI CHI TIẾT (IMPLEMENTATION PLAN)

## DỰ ÁN: FUNNYSHOP BACKEND
**Các module triển khai:**
1. **Task 1: Triển khai CRUD API cốt lõi & Xóa mềm (Products, Categories, Users)**
2. **Task 2: Xây dựng module Quản lý & Cập nhật Trạng thái Đơn hàng**

---

## I. ĐÁNH GIÁ TÍNH PHÙ HỢP & MỤC TIÊU DỰ ÁN

### 1. Phù hợp kiến trúc
- **Task 1 (Admin CRUD & Soft Delete):**
  - Bảo toàn dữ liệu lịch sử liên kết đơn hàng: Không xóa vật lý bản ghi trong MySQL nhằm tránh vi phạm ràng buộc khóa ngoại với bảng `order_items`.
  - Phân quyền chặt chẽ: Chỉ người dùng có Role `ADMIN` mới được gọi các API nhóm `/api/v1/admin/**`.
  - Tách bạch rõ ràng giữa Public API (`GET /api/v1/products`) chỉ lấy các bản ghi `is_deleted = false` và Admin API.
- **Task 2 (Order State Management):**
  - Đồng bộ 100% với đặc tả yêu cầu nghiệp vụ (SRS FR-06) và ma trận trạng thái trong Frontend (`frontend/src/utils/constants.js`).
  - Phân quyền sở hữu dữ liệu (Data Ownership): Ngăn chặn rò rỉ dữ liệu (Customer A không được xem đơn hàng của Customer B), Admin được quyền quản lý và theo dõi toàn bộ đơn hàng.

---

## II. CHI TIẾT KỸ THUẬT TASK 1: CRUD API CỐT LÕI & XÓA MỀM

- **Tên branch dự kiến:** `feature/admin-crud-softdelete`

### 1. Cập nhật Thực thể & Cơ sở dữ liệu (Entities & Database)
- Thêm cờ `is_deleted` vào thực thể `Product` và `Category`:
  ```java
  @Column(name = "is_deleted", nullable = false)
  @Builder.Default
  private Boolean isDeleted = false;
  ```
- Cập nhật file `database/schema.sql`: Bổ sung cột `is_deleted BOOLEAN DEFAULT FALSE` cho 2 bảng `products` và `categories`.

### 2. Thiết kế DTOs (Request / Response)
- `ProductCreateRequest`:
  - `name`: `@NotBlank(message = "Tên sản phẩm không được để trống")`, tối đa 200 ký tự.
  - `description`: Text mô tả sản phẩm.
  - `price`: `@NotNull`, `@DecimalMin(value = "0.0", message = "Giá sản phẩm phải >= 0")`.
  - `stockQuantity`: `@NotNull`, `@Min(value = 0, message = "Số lượng tồn kho phải >= 0")`.
  - `categoryId`: `@NotNull(message = "Danh mục không được để trống")`.
  - `imageUrl`: `@Size(max = 500)`.
- `ProductUpdateRequest`: Tương tự `ProductCreateRequest` phục vụ cập nhật thông tin.
- `CategoryRequest`:
  - `name`: `@NotBlank(message = "Tên danh mục không được để trống")`, tối đa 100 ký tự.
  - `description`: Text mô tả.

### 3. Cập nhật Repository Layer
- **`ProductRepository`:**
  - Cập nhật query `searchProducts`: Thêm điều kiện `p.isDeleted = false` để public API không trả về sản phẩm đã xóa mềm.
  - Cập nhật `findByIdWithCategory`: Thêm điều kiện `p.isDeleted = false` cho người dùng public, và method lấy đầy đủ cho Admin.
- **`CategoryRepository`:**
  - Bổ sung `findAllByIsDeletedFalse()` để public API chỉ hiển thị danh mục đang hoạt động.

### 4. Cập nhật Service Layer
- **`ProductService` / `ProductServiceImpl`:**
  - `createProduct(ProductCreateRequest request)`: Kiểm tra danh mục hợp lệ, lưu sản phẩm mới với `isDeleted = false`.
  - `updateProduct(Long id, ProductUpdateRequest request)`: Tìm sản phẩm (chưa xóa), cập nhật thông tin và danh mục.
  - `deleteProduct(Long id)`: Xóa mềm bằng cách set `isDeleted = true`.
- **`CategoryService` / `CategoryServiceImpl`:**
  - `createCategory(CategoryRequest request)`: Thêm mới danh mục.
  - `updateCategory(Long id, CategoryRequest request)`: Cập nhật danh mục.
  - `deleteCategory(Long id)`: Xóa mềm danh mục (`isDeleted = true`).

### 5. Cập nhật Controller Layer
- **Tạo `AdminProductController`:**
  - Route: `@RequestMapping({"/api/v1/admin/products", "/api/admin/products"})`
  - `@PreAuthorize("hasRole('ADMIN')")`
  - `POST /`: Thêm mới sản phẩm (HTTP 201 Created).
  - `PUT /{id}`: Cập nhật thông tin sản phẩm (HTTP 200 OK).
  - `DELETE /{id}`: Xóa mềm sản phẩm (HTTP 200 OK).
- **Tạo `AdminCategoryController`:**
  - Route: `@RequestMapping({"/api/v1/admin/categories", "/api/admin/categories"})`
  - `@PreAuthorize("hasRole('ADMIN')")`
  - `POST /`, `PUT /{id}`, `DELETE /{id}`.
- **Rà soát `UserController`:**
  - Xác nhận API `PUT /api/v1/users/me` đã hoạt động chuẩn xác với JWT Authenticated.

---

## III. CHI TIẾT KỸ THUẬT TASK 2: QUẢN LÝ TRẠNG THÁI ĐƠN HÀNG

- **Tên branch dự kiến:** `feature/order-status-management`

### 1. Xây dựng State Machine (`OrderStatus` Enum)
- Định nghĩa enum `OrderStatus`:
  ```java
  public enum OrderStatus {
      PENDING,
      PROCESSING,
      SHIPPING,
      COMPLETED,
      CANCELLED;

      public boolean canTransitionTo(OrderStatus next) {
          return switch (this) {
              case PENDING -> next == PROCESSING || next == CANCELLED;
              case PROCESSING -> next == SHIPPING || next == CANCELLED;
              case SHIPPING -> next == COMPLETED || next == CANCELLED;
              case COMPLETED, CANCELLED -> false;
          };
      }
  }
  ```
- Quy tắc chuyển đổi:
  - `PENDING` -> `PROCESSING`, `CANCELLED`
  - `PROCESSING` -> `SHIPPING`, `CANCELLED`
  - `SHIPPING` -> `COMPLETED`, `CANCELLED`
  - `COMPLETED`, `CANCELLED` là trạng thái cuối, chặn đứng mọi thay đổi tiếp theo.

### 2. Thiết kế DTOs Đơn hàng
- `OrderStatusUpdateRequest`:
  ```java
  public record OrderStatusUpdateRequest(
      @NotNull(message = "Trạng thái đơn hàng không được để trống")
      OrderStatus status
  ) {}
  ```
- `OrderItemResponse`: `id`, `productId`, `productName`, `productImageUrl`, `quantity`, `priceAtOrder`.
- `OrderResponse`: `id`, `userId`, `customerName`, `phone`, `shippingAddress`, `totalAmount`, `paymentMethod`, `status`, `orderItems`, `createdAt`, `updatedAt`.

### 3. Repository Layer (`OrderRepository`)
- Thêm query tối ưu lấy danh sách kèm nạp trước `user` và `orderItems`:
  - `findAllOrders(Pageable pageable)`: Dành cho Admin quản lý.
  - `findByUserId(Long userId, Pageable pageable)`: Dành cho Customer xem lịch sử cá nhân.
  - `findByIdWithDetails(Long id)`: Lấy chi tiết đơn hàng kèm danh sách mặt hàng (`JOIN FETCH o.orderItems`).

### 4. Service Layer (`OrderService` & `OrderServiceImpl`)
- `getAllOrders(Pageable pageable)`: Chỉ Admin truy cập.
- `updateOrderStatus(Long orderId, OrderStatus newStatus)`:
  - Lấy đơn hàng, kiểm tra `currentStatus.canTransitionTo(newStatus)`.
  - Nếu sai luồng: ném `AppException("Không thể chuyển trạng thái từ " + current + " sang " + newStatus, HttpStatus.BAD_REQUEST)`.
  - Cập nhật và lưu thay đổi.
- `getMyOrders(Long userId, Pageable pageable)`: Lấy danh sách đơn hàng đúng của user đang đăng nhập.
- `getOrderById(Long orderId, Long currentUserId, boolean isAdmin)`:
  - Nếu `!isAdmin && !order.getUser().getId().equals(currentUserId)` -> Ném `AppException("Bạn không có quyền truy cập đơn hàng này!", HttpStatus.FORBIDDEN)`.

### 5. Controller Layer
- **Tạo `AdminOrderController`:**
  - Route: `@RequestMapping({"/api/v1/admin/orders", "/api/admin/orders"})`
  - `@PreAuthorize("hasRole('ADMIN')")`
  - `GET /`: Xem danh sách tất cả đơn hàng (phân trang).
  - `PUT /{id}/status` và `PATCH /{id}/status`: Cập nhật trạng thái đơn hàng.
- **Tạo `OrderController`:**
  - Route: `@RequestMapping({"/api/v1/orders", "/api/orders"})`
  - `GET /my-orders` và `GET /my`: Xem lịch sử đơn hàng của cá nhân.
  - `GET /{id}`: Xem chi tiết đơn hàng (kiểm tra quyền sở hữu).

---

## IV. BẢNG DANH MỤC FILE SẼ TẠO MỚI / CHỈNH SỬA

| STT | File Path | Loại thao tác | Mục đích |
| :---: | :--- | :---: | :--- |
| 1 | `backend/src/main/java/com/funnyshop/entity/Product.java` | Chỉnh sửa | Thêm `isDeleted = false` |
| 2 | `backend/src/main/java/com/funnyshop/entity/Category.java` | Chỉnh sửa | Thêm `isDeleted = false` |
| 3 | `backend/src/main/java/com/funnyshop/entity/Order.java` | Chỉnh sửa | Sử dụng enum `OrderStatus` |
| 4 | `backend/src/main/java/com/funnyshop/enums/OrderStatus.java` | **Tạo mới** | Enum quy định state machine |
| 5 | `backend/src/main/java/com/funnyshop/dto/request/ProductCreateRequest.java` | **Tạo mới** | DTO tạo sản phẩm mới |
| 6 | `backend/src/main/java/com/funnyshop/dto/request/ProductUpdateRequest.java` | **Tạo mới** | DTO cập nhật sản phẩm |
| 7 | `backend/src/main/java/com/funnyshop/dto/request/CategoryRequest.java` | **Tạo mới** | DTO tạo/cập nhật danh mục |
| 8 | `backend/src/main/java/com/funnyshop/dto/request/OrderStatusUpdateRequest.java` | **Tạo mới** | DTO đổi trạng thái đơn |
| 9 | `backend/src/main/java/com/funnyshop/dto/response/OrderItemResponse.java` | **Tạo mới** | DTO item trong đơn hàng |
| 10 | `backend/src/main/java/com/funnyshop/dto/response/OrderResponse.java` | **Tạo mới** | DTO phản hồi đơn hàng |
| 11 | `backend/src/main/java/com/funnyshop/repository/OrderRepository.java` | Chỉnh sửa | Query phân trang & FETCH chi tiết |
| 12 | `backend/src/main/java/com/funnyshop/service/OrderService.java` | **Tạo mới** | Interface service cho Order |
| 13 | `backend/src/main/java/com/funnyshop/service/impl/OrderServiceImpl.java` | **Tạo mới** | Hiện thực nghiệp vụ Order |
| 14 | `backend/src/main/java/com/funnyshop/controller/admin/AdminProductController.java` | **Tạo mới** | Admin CRUD Product API |
| 15 | `backend/src/main/java/com/funnyshop/controller/admin/AdminCategoryController.java` | **Tạo mới** | Admin CRUD Category API |
| 16 | `backend/src/main/java/com/funnyshop/controller/admin/AdminOrderController.java` | **Tạo mới** | Admin Quản lý đơn hàng |
| 17 | `backend/src/main/java/com/funnyshop/controller/OrderController.java` | **Tạo mới** | Customer Order API |
| 18 | `backend/src/main/java/com/funnyshop/config/SecurityConfig.java` | Chỉnh sửa | Cấu hình phân quyền endpoint |
| 19 | `backend/src/test/java/...` | **Tạo mới** | Bộ Unit Tests & MockMvc Tests |

---

## V. CHIẾN LƯỢC KIỂM THỬ (TESTING PLAN)

1. **Unit Tests (Mockito):**
   - Test logic state machine `OrderStatus.canTransitionTo()`: Kiểm tra 100% các cặp trạng thái hợp lệ và không hợp lệ.
   - Test soft delete trong `ProductService`: Xóa sản phẩm và kiểm tra cờ `isDeleted` chuyển thành `true`.
   - Test kiểm tra quyền sở hữu trong `OrderService`: Đảm bảo ném lỗi `403 Forbidden` khi Customer cố xem đơn của người khác.
2. **MockMvc Controller Tests:**
   - Test phân quyền: Không có JWT -> 401, Role `CUSTOMER` gọi `/api/v1/admin/**` -> 403, Role `ADMIN` -> 200/201.
   - Test validation dữ liệu đầu vào: Request thiếu tên hoặc giá âm -> 400 Bad Request kèm chi tiết lỗi validation.
3. **Gradle Build Verification:**
   - Chạy `./gradlew.bat test` và `./gradlew.bat compileJava` đảm bảo 100% test case vượt qua và không có lỗi biên dịch.

