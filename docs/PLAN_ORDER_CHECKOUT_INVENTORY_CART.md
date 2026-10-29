# KẾ HOẠCH TRIỂN KHAI & ĐÁNH GIÁ KIẾN TRÚC HỆ THỐNG
## MODULE: CHECKOUT ĐƠN HÀNG, QUẢN LÝ TỒN KHO & KIẾN TRÚC GIỎ HÀNG

---

## I. [ARCHITECTURE] ĐÁNH GIÁ & THIẾT KẾ KIẾN TRÚC LƯU TRỮ GIỎ HÀNG (BACKEND VS CLIENT)

### 1. Phân tích & So sánh 2 mô hình

| Tiêu chí so sánh | Lưu trữ Giỏ hàng tại Backend (Database/Redis) | Lưu trữ Giỏ hàng tại Client (LocalStorage / Zustand) |
| :--- | :--- | :--- |
| **Cơ chế hoạt động** | Mỗi hành động thêm, sửa số lượng, xóa sản phẩm đều gọi API HTTP lưu vào DB/Cache. | Giỏ hàng lưu hoàn toàn trong bộ nhớ máy khách (LocalStorage qua Zustand `persist`). |
| **Độ trễ & UX (User Experience)** | Phụ thuộc vào network round-trip. Mỗi lần tăng giảm số lượng phải chờ API phản hồi (dễ lag, giật). | **Tức thì (Zero Latency)**: Cập nhật UI ngay lập tức với 60fps. Trải nghiệm người dùng mượt mà nhất. |
| **Tải tài nguyên Server (I/O & DB)** | Tốn tài nguyên: DB phải chịu hàng nghìn write/update query chỉ để đổi số lượng giỏ hàng. | **Stateless Backend**: Server hoàn toàn không chịu tải hay tốn I/O cho việc thao tác giỏ hàng. |
| **Xử lý Khách vãng lai (Guest Cart)** | Rất phức tạp: Cần sinh Anonymous Session Token, quản lý dọn rác session rác, logic gộp giỏ hàng (Cart Merge) sau login dễ phát sinh bug. | **Tự nhiên & Liền mạch**: Giỏ hàng lưu độc lập trên trình duyệt của máy khách, dù login hay chưa vẫn thao tác bình thường. |
| **Đồng bộ đa thiết bị (Cross-device)** | Hỗ trợ tốt: Đổi từ điện thoại sang PC vẫn giữ giỏ hàng nếu đã đăng nhập. | Không hỗ trợ: Giỏ hàng gắn liền với trình duyệt hiện tại. |
| **Khả năng Marketing (Abandoned Cart)** | Dễ dàng quét DB để gửi email nhắc khách bỏ quên giỏ hàng. | Cần gắn SDK Analytics tracking riêng (Google Analytics, Mixpanel, etc.). |

### 2. Quyết định kiến trúc cho FunnyShop

> **Quyết định:** Dự án FunnyShop lựa chọn **Kiến trúc Giỏ hàng tại Client (Client-Side Storage với Zustand + LocalStorage)**.

**Lý do lựa chọn phù hợp nhất với dự án:**
1. **Tối ưu tài nguyên hệ thống:** Backend giữ đúng bản chất **Stateless RESTful API**, không phải quản lý trạng thái phiên giỏ hàng tạm thời.
2. **Kế thừa hiện trạng tối ưu:** Frontend FunnyShop đã xây dựng sẵn module `useCartStore` (`frontend/src/store/cartStore.js`) với Zustand Persist hoạt động ổn định và tối ưu.
3. **Đơn giản hóa luồng Guest-to-Customer:** Không cần viết các thuật toán merge phức tạp hay cơ chế quét dọn rác (clean-up job) cho các giỏ hàng bỏ quên trong MySQL.
4. **Đánh giá bảng `cart` trong DB:** Bảng `cart` trong `database/schema.sql` là bảng phụ trợ tùy chọn (schema chú thích: `-- Cart table (optional)`). Ta sẽ giữ nguyên bảng này trong schema làm dự phòng mở rộng tương lai (nếu làm mobile app Native), nhưng không dùng trong luồng Web hiện tại.

---

## II. PHÂN TÍCH RỦI RO NGHIỆP VỤ TIỀM ẨN & GIẢI PHÁP TRIỆT ĐỂ

### 1. Rủi ro 1: Thao túng Giá & Gian lận Tiền tệ (Price Tampering)
- **Vấn đề:** Khi giỏ hàng lưu tại Client, người dùng hoàn toàn có thể mở Developer Tools (F12) hoặc dùng Postman/Curl để sửa giá sản phẩm từ `10.000.000đ` thành `1.000đ` rồi gửi lên Backend.
- **Giải pháp:**
  - **Nguyên tắc "Zero Trust Client":** Backend tuyệt đối **không** nhận trường `price` hay `totalAmount` từ Request Body của Client.
  - Client chỉ gửi danh sách: `[{ productId, quantity }]`.
  - Backend truy vấn trực tiếp giá gốc của từng sản phẩm từ bảng `products` trong Database tại đúng thời điểm xử lý checkout.
  - `totalAmount` của đơn hàng được tính toán độc lập tại tầng Service: `totalAmount = sum(product.getPrice() * quantity)`.

### 2. Rủi ro 2: Race Condition & Bán âm kho (Overselling Concurrency)
- **Vấn đề:** Sản phẩm chỉ còn tồn kho = 1 cái. Khách A và Khách B cùng ấn "Đặt hàng" tại cùng một mili-giây. Cả hai luồng song song đọc thấy `stock_quantity = 1 >= 1` hợp lệ, rồi cùng trừ tồn kho và tạo 2 đơn hàng thành công => Kho bị âm hoặc shop không có hàng giao.
- **Giải pháp:**
  - Sử dụng **Khóa bi quan (Pessimistic Locking - `SELECT ... FOR UPDATE`)** trong Transaction.
  - Bổ sung query trong `ProductRepository`:
    ```java
    @Lock(LockModeType.PESSIMISTIC_WRITE)
    @Query("SELECT p FROM Product p WHERE p.id = :id AND p.isDeleted = false")
    Optional<Product> findByIdForUpdate(@Param("id") Long id);
    ```
  - Khi luồng A khóa bản ghi sản phẩm để kiểm tra và trừ tồn kho, luồng B buộc phải xếp hàng chờ Transaction A hoàn tất. Khi luồng B đọc lại, `stock_quantity` đã là 0 và sẽ nhận ngay thông báo lỗi hết hàng.

### 3. Rủi ro 3: Bất đồng bộ Dữ liệu Tồn kho / Giá giữa Client Cart và Realtime DB (Stale Cart Data)
- **Vấn đề:** Khách hàng thêm sản phẩm vào giỏ từ 3 ngày trước (lúc đó còn hàng, giá 100k). Hôm nay khách quay lại bấm Đặt hàng nhưng:
  - Sản phẩm đã bị Admin xóa mềm (`is_deleted = true`).
  - Sản phẩm đã bị mua hết (`stock_quantity = 0`) hoặc số lượng tồn không đủ (`stock_quantity < quantity`).
  - Giá sản phẩm đã được Admin điều chỉnh (ví dụ lên 120k).
- **Giải pháp:**
  - Khi duyệt từng sản phẩm trong giỏ:
    - Nếu sản phẩm không tìm thấy hoặc `isDeleted == true`: Ném ngoại lệ `ResourceNotFoundException("Sản phẩm '" + product.getName() + "' đã ngừng kinh doanh hoặc không còn tồn tại!")`.
    - Nếu `product.getStockQuantity() < item.getQuantity()`: Ném ngoại lệ `AppException("Sản phẩm '" + product.getName() + "' không đủ số lượng tồn kho (hiện còn: " + product.getStockQuantity() + ", yêu cầu: " + item.getQuantity() + ")", HttpStatus.BAD_REQUEST)`.
  - Giá bán tính theo giá niêm yết hiện hành trong DB, đơn hàng tạo ra sẽ phản ánh giá thực tế mới nhất.

### 4. Rủi ro 4: Không chốt giá mua lịch sử (Historical Price Inconsistency)
- **Vấn đề:** Nếu bảng `order_items` không lưu trường giá mua tại thời điểm đặt hàng, mà sau này JOIN sang bảng `products` để lấy giá. Khi Admin tăng/giảm giá sản phẩm sau 1 tháng, toàn bộ giá trị đơn hàng cũ trong lịch sử và báo cáo doanh thu kế toán sẽ bị thay đổi sai lệch.
- **Giải pháp:**
  - Lưu cứng giá mua vào cột `price_at_order` của bảng `order_items`:
    `orderItem.setPriceAtOrder(product.getPrice())`.
  - Giá này có tính **bất biến (immutable)**, không bao giờ thay đổi bất kể sản phẩm trong tương lai có bị đổi giá hay xóa mềm.

### 5. Rủi ro 5: Lỗi một sản phẩm làm ảnh hưởng dữ liệu các sản phẩm khác (Partial Failure)
- **Vấn đề:** Giỏ hàng có 3 món. Món 1 và 2 trừ kho thành công, nhưng đến món 3 phát hiện hết kho. Nếu không rollback, món 1 và 2 đã bị trừ tồn kho nhưng đơn hàng không được tạo ra => Thất thoát số liệu tồn kho.
- **Giải pháp:**
  - Đánh dấu toàn bộ phương thức `checkout` bằng `@Transactional(rollbackFor = Exception.class)`.
  - Bất kỳ lỗi nào phát sinh (hết kho, validate thất bại), toàn bộ thao tác trừ tồn kho của các sản phẩm trước đó trong request đều được database rollback 100%.

### 6. Rủi ro 6: Trùng lặp sản phẩm trong payload Checkout (Duplicate Items)
- **Vấn đề:** Nếu Client gửi lên request chứa 2 item cùng có `productId = 1` (ví dụ do click đúp hoặc lỗi gộp state), việc duyệt lần lượt có thể gây deadlock hoặc trừ kho rời rạc.
- **Giải pháp:**
  - Ở đầu luồng Checkout, Backend thực hiện gộp (merge) danh sách items theo `productId` trước khi thực hiện khóa và trừ kho:
    `Map<Long, Integer> productQuantityMap = items.stream().collect(Collectors.toMap(OrderItemRequest::getProductId, OrderItemRequest::getQuantity, Integer::sum));`

### 7. Rủi ro 7: Chuẩn hóa Route API & DTO tương thích giữa Backend và Frontend
- **Vấn đề:**
  - Đề bài yêu cầu: `POST /api/v1/orders/checkout`.
  - Trong khi file `frontend/src/api/order.js` đang gọi: `POST /api/v1/orders` với body `{ fullName, phone, address, items: [{ productId, quantity }] }`.
- **Giải pháp:**
  - Controller map cả 2 endpoint: `@PostMapping({"/checkout", ""})`.
  - Request DTO hỗ trợ linh hoạt alias: `fullName` (hoặc `customerName`), `address` (hoặc `shippingAddress`).
  - Thanh toán COD: Mặc định `paymentMethod = "COD"` và trạng thái ban đầu `status = OrderStatus.PENDING`.

---

## III. THIẾT KẾ CHI TIẾT CÁC THÀNH PHẦN KỸ THUẬT

### 1. Data Transfer Objects (DTO)

#### a. `OrderCheckoutItemRequest.java`
```java
package com.funnyshop.dto.request;

import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotNull;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class OrderCheckoutItemRequest {

    @NotNull(message = "Mã sản phẩm không được để trống")
    private Long productId;

    @NotNull(message = "Số lượng không được để trống")
    @Min(value = 1, message = "Số lượng sản phẩm phải lớn hơn 0")
    private Integer quantity;
}
```

#### b. `OrderCheckoutRequest.java`
```java
package com.funnyshop.dto.request;

import com.fasterxml.jackson.annotation.JsonAlias;
import jakarta.validation.Valid;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotEmpty;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class OrderCheckoutRequest {

    @NotBlank(message = "Họ và tên người nhận không được để trống")
    @Size(max = 100, message = "Họ và tên không được vượt quá 100 ký tự")
    @JsonAlias({"customerName"})
    private String fullName;

    @NotBlank(message = "Số điện thoại không được để trống")
    @Pattern(regexp = "^(0|\\+84)[3|5|7|8|9][0-9]{8}$", message = "Số điện thoại không hợp lệ (ví dụ: 0912345678)")
    private String phone;

    @NotBlank(message = "Địa chỉ nhận hàng không được để trống")
    @Size(min = 10, max = 500, message = "Địa chỉ giao hàng phải có tối thiểu 10 ký tự")
    @JsonAlias({"shippingAddress"})
    private String address;

    @Builder.Default
    private String paymentMethod = "COD";

    @NotEmpty(message = "Danh sách sản phẩm đặt hàng không được để trống")
    private List<@Valid OrderCheckoutItemRequest> items;
}
```

### 2. Repository Layer (`ProductRepository.java`)
Thêm phương thức khóa bi quan để giải quyết triệt để Race Condition:
```java
@Lock(LockModeType.PESSIMISTIC_WRITE)
@Query("SELECT p FROM Product p WHERE p.id = :id AND p.isDeleted = false")
Optional<Product> findByIdForUpdate(@Param("id") Long id);
```

### 3. Service Layer (`OrderService.java` & `OrderServiceImpl.java`)

**Khai báo Interface:**
```java
OrderResponse checkout(Long userId, OrderCheckoutRequest request);
```

### 4. Controller Layer (`OrderController.java`)
```java
@PostMapping({"/checkout", ""})
public ResponseEntity<ApiResponse<OrderResponse>> checkout(
        @Valid @RequestBody OrderCheckoutRequest checkoutRequest,
        HttpServletRequest request
) {
    Long currentUserId = getCurrentUserId(request);
    OrderResponse response = orderService.checkout(currentUserId, checkoutRequest);

    return ResponseEntity.status(HttpStatus.CREATED).body(
            ApiResponse.<OrderResponse>builder()
                    .code(HttpStatus.CREATED.value())
                    .message("Đặt hàng thành công!")
                    .data(response)
                    .build()
    );
}
```

---

## IV. BẢNG DANH MỤC CÁC FILE TẠO MỚI & THAY ĐỔI

| STT | File Path | Thao tác | Trách nhiệm chính |
| :---: | :--- | :---: | :--- |
| 1 | `backend/src/main/java/com/funnyshop/dto/request/OrderCheckoutItemRequest.java` | **Tạo mới** | DTO chứa `productId`, `quantity` kèm validation |
| 2 | `backend/src/main/java/com/funnyshop/dto/request/OrderCheckoutRequest.java` | **Tạo mới** | DTO nhận thông tin nhận hàng, COD, list items kèm regex SĐT |
| 3 | `backend/src/main/java/com/funnyshop/repository/ProductRepository.java` | **Chỉnh sửa** | Bổ sung query `findByIdForUpdate` với `@Lock(PESSIMISTIC_WRITE)` |
| 4 | `backend/src/main/java/com/funnyshop/service/OrderService.java` | **Chỉnh sửa** | Bổ sung phương thức `OrderResponse checkout(...)` |
| 5 | `backend/src/main/java/com/funnyshop/service/impl/OrderServiceImpl.java` | **Chỉnh sửa** | Hiện thực logic checkout, trừ kho, chốt giá mua, transactional |
| 6 | `backend/src/main/java/com/funnyshop/controller/OrderController.java` | **Chỉnh sửa** | Thêm endpoint `POST /checkout` và `POST ""` trả về HTTP 201 |
| 7 | `backend/src/test/java/com/funnyshop/service/OrderServiceCheckoutTest.java` | **Tạo mới** | Unit Test toàn diện: thành công, hết kho, xóa mềm, rollback |
| 8 | `backend/src/test/java/com/funnyshop/controller/OrderCheckoutControllerTest.java` | **Tạo mới** | MockMvc Test: validation, phân quyền 401, thành công 201 |

---

## V. CHIẾN LƯỢC KIỂM THỬ (TESTING PLAN)

1. **Unit Test Service (`OrderServiceCheckoutTest`):**
   - **Happy Path:** Đặt hàng thành công 2 món -> Tồn kho 2 sản phẩm giảm chính xác, `priceAtOrder` bằng giá sản phẩm lúc đặt, `totalAmount` tính chuẩn xác, trạng thái đơn `PENDING`, phương thức `COD`.
   - **Out of stock:** Sản phẩm có `stockQuantity = 2`, khách đặt `quantity = 3` -> Bắn `AppException` với thông báo số lượng tồn kho còn lại, không lưu đơn.
   - **Soft deleted product:** Sản phẩm có `isDeleted = true` -> Báo lỗi sản phẩm đã ngừng kinh doanh.
   - **Rollback atomicity:** Món thứ nhất hợp lệ, món thứ hai hết hàng -> Cả 2 món đều không bị trừ kho.
   - **Duplicate productId:** Payload có 2 dòng cùng 1 `productId` -> Gộp số lượng và trừ kho chính xác 1 lần.
2. **Integration / Web Layer Test (`OrderCheckoutControllerTest`):**
   - Gọi API không có Bearer JWT Token -> HTTP 401 Unauthorized.
   - Gửi payload thiếu họ tên / SĐT sai định dạng / giỏ hàng rỗng -> HTTP 400 Bad Request kèm chi tiết lỗi validation.
   - Gửi payload hợp lệ kèm JWT Token -> HTTP 201 Created.

