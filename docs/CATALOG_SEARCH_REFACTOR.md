# BÁO CÁO KỸ THUẬT: ĐIỀU CHỈNH CATALOG, SEARCH & GLOBAL EXCEPTION HANDLING

Tài liệu mô tả chi tiết các thay đổi trong đợt tái cấu trúc (refactor) và bổ sung tính năng (feature/enhancement) cho backend ứng dụng FunnyShop, bao gồm 3 nhiệm vụ chính:
1. **Task 1: Optimize Product Fetching & Category API**
2. **Task 2: Standardize Global Exception Handling**
3. **Task 3: Refactor API Sorting Logic**

---

## I. Tổng quan các thay đổi

| Task | Loại task | Mục tiêu | Trạng thái |
| :--- | :--- | :--- | :---: |
| **Task 1** | Refactor / Feature | Giải quyết lỗi Lazy Loading với `Category`, viết `LEFT JOIN FETCH`, tạo `CategoryController` & API danh mục. | **Hoàn thành** |
| **Task 2** | Refactor | Xây dựng `@RestControllerAdvice` tập trung, tạo `AppException`, chuẩn hóa cấu trúc `ApiResponse<T>`. | **Hoàn thành** |
| **Task 3** | Enhancement | Bóc tách tham số sắp xếp thành `sortBy` và `sortDir`, cập nhật `Sort` và `PageRequest` linh hoạt, chuẩn hóa Controller. | **Hoàn thành** |

---

## II. Chi tiết kỹ thuật từng Task

### 1. Task 1: Optimize Product Fetching & Category API

#### Vấn đề trước khi xử lý:
- `application-dev.yml` thiết lập `spring.jpa.open-in-view: false`. Trong khi đó, quan hệ giữa `Product` và `Category` là `@ManyToOne(fetch = FetchType.LAZY)`.
- Khi Controller trả trực tiếp Entity `Product` ra ngoài, thư viện Jackson thực hiện serialize sang JSON ngoài phạm vi Transaction, dẫn đến lỗi `LazyInitializationException` hoặc truy vấn N+1.
- Chưa có API danh mục để Frontend lấy dữ liệu đưa vào combobox/bộ lọc.

#### Giải pháp thực hiện:
- **Tạo DTO tầng Response:**
  - `CategoryResponse`: Đóng gói `id`, `name`, `description`.
  - `ProductResponse`: Đóng gói toàn bộ trường hiển thị của sản phẩm, tích hợp `CategoryResponse` và alias `stock` (tương thích cả `stockQuantity` ở backend và `stock` ở frontend).
- **Tối ưu hóa câu truy vấn trong `ProductRepository`:**
  - Sử dụng `LEFT JOIN FETCH p.category` trong JPQL query kèm định nghĩa `countQuery` riêng biệt để Spring Data JPA phân trang chính xác:
    ```java
    @Query(value = """
        SELECT p FROM Product p
        LEFT JOIN FETCH p.category
        WHERE (:keyword IS NULL
               OR LOWER(p.name) LIKE LOWER(CONCAT('%', :keyword, '%')))
          AND (:categoryId IS NULL
               OR p.category.id = :categoryId)
        """,
        countQuery = """
        SELECT count(p) FROM Product p
        WHERE (:keyword IS NULL
               OR LOWER(p.name) LIKE LOWER(CONCAT('%', :keyword, '%')))
          AND (:categoryId IS NULL
               OR p.category.id = :categoryId)
        """)
    Page<Product> searchProducts(@Param("keyword") String keyword, @Param("categoryId") Long categoryId, Pageable pageable);
    ```
  - Bổ sung `findByIdWithCategory(Long id)` với `LEFT JOIN FETCH` phục vụ API xem chi tiết sản phẩm.
- **Tạo mới `CategoryService` & `CategoryController`:**
  - Endpoint `GET /api/categories` (và alias `/api/v1/categories`) trả về danh sách danh mục `ApiResponse<List<CategoryResponse>>`.
  - Cấu hình mở quyền truy cập `permitAll()` trong `SecurityConfig`.

---

### 2. Task 2: Standardize Global Exception Handling

#### Vấn đề trước khi xử lý:
- Thiếu lớp `@RestControllerAdvice` tập trung. Khi có ngoại lệ xảy ra (`ResourceNotFoundException`, `IllegalArgumentException`,...), Spring Boot trả về lỗi 500 kèm HTML/Whitelabel hoặc JSON không theo chuẩn chung của dự án.
- Tên lớp `GlobalHandleException` trước đó đang kế thừa `RuntimeException` thay vì làm nhiệm vụ `@RestControllerAdvice`.

#### Giải pháp thực hiện:
- **Tạo base exception `AppException`:**
  - Chứa `status` (HttpStatus) và `code` (mã số HTTP/lỗi nghiệp vụ).
  - Cho `ResourceNotFoundException` và `ResourceAlreadyExistsException` kế thừa từ `AppException`.
- **Cập nhật `GlobalHandleException` trở thành `@RestControllerAdvice`:**
  - `@ExceptionHandler(AppException.class)`: Bắt các ngoại lệ nghiệp vụ của hệ thống, trả đúng HTTP Status (ví dụ 404 cho NotFound, 400 cho AlreadyExists).
  - `@ExceptionHandler(IllegalArgumentException.class)`: Bắt lỗi tham số không hợp lệ từ client (như `page < 0`, `size > 100`, `sortDir` sai).
  - `@ExceptionHandler(MethodArgumentNotValidException.class)`: Bắt lỗi validation form đầu vào từ `@Valid`, trả về `Map<String, String>` chi tiết các trường bị lỗi.
  - `@ExceptionHandler(AccessDeniedException.class)`: Bắt lỗi phân quyền 403.
  - `@ExceptionHandler(Exception.class)`: Bắt các lỗi không lường trước (500), ghi log cảnh báo và trả về thông báo an toàn.
- **Chuẩn hóa `ApiResponse<T>`:**
  - Cấu trúc đồng nhất: `{ "code": 200, "message": "...", "data": ... }`.
  - Bổ sung static methods `ApiResponse.success(data, message)` và `ApiResponse.error(code, message)`.

---

### 3. Task 3: Refactor API Sorting Logic

#### Vấn đề trước khi xử lý:
- Tên class Controller viết thường `productController` (vi phạm quy ước đặt tên PascalCase của Java).
- Sắp xếp chỉ chấp nhận `"asc"` hoặc `"desc"` và bị gán cứng vào trường `price`. Không thể sắp xếp theo các tiêu chí khác như số lượng (`stockQuantity`), ngày tạo (`createdAt`), tên (`name`).

#### Giải pháp thực hiện:
- **Chuẩn hóa Controller thành `ProductController`:**
  - Đổi tên file và class thành `ProductController`.
  - Nhận riêng biệt 2 tham số:
    - `sortBy`: Tên trường cần sắp xếp (mặc định: `"id"`).
    - `sortDir`: Hướng sắp xếp (mặc định: `"asc"`, chấp nhận `"asc"` hoặc `"desc"`).
  - **Khả năng tương thích ngược thông minh (Smart backward compatibility):**
    - Nếu client hoặc frontend gửi tham số gộp `sort` như `"price_asc"`, `"price_desc"`, `"stock_desc"`, `"price,asc"`, Controller tự động phân tách thành `sortBy` và `sortDir`.
    - Hỗ trợ cả 2 tên tham số tìm kiếm `keyword` và `q`.
- **Áp dụng Sort và PageRequest an toàn trong `ProductServiceImpl`:**
  - Lọc và ánh xạ tên trường thông qua whitelist: `id`, `price`, `stockQuantity` (hỗ trợ cả alias `stock`), `name`, `createdAt`.
  - Khởi tạo: `Sort.by(direction, property)` và `PageRequest.of(page, size, sorting)`.
  - Ném `IllegalArgumentException` nếu `sortDir` không phải `"asc"` hoặc `"desc"`.

---

## III. Danh mục các file thay đổi

| STT | Đường dẫn file | Thao tác | Mô tả |
| :---: | :--- | :---: | :--- |
| 1 | `backend/src/main/java/com/funnyshop/dto/response/CategoryResponse.java` | **Tạo mới** | DTO phản hồi danh mục. |
| 2 | `backend/src/main/java/com/funnyshop/dto/response/ProductResponse.java` | **Tạo mới** | DTO phản hồi sản phẩm, giải quyết Lazy Loading. |
| 3 | `backend/src/main/java/com/funnyshop/dto/response/ApiResponse.java` | **Cập nhật** | Thêm hàm tiện ích `success` và `error`. |
| 4 | `backend/src/main/java/com/funnyshop/service/CategoryService.java` | **Tạo mới** | Interface service cho Category. |
| 5 | `backend/src/main/java/com/funnyshop/service/impl/CategoryServiceImpl.java` | **Tạo mới** | Hiện thực lấy danh sách Category. |
| 6 | `backend/src/main/java/com/funnyshop/controller/CategoryController.java` | **Tạo mới** | Endpoint `GET /api/categories` và `/api/v1/categories`. |
| 7 | `backend/src/main/java/com/funnyshop/exception/AppException.java` | **Tạo mới** | Base exception cho ứng dụng. |
| 8 | `backend/src/main/java/com/funnyshop/exception/ResourceNotFoundException.java` | **Cập nhật** | Kế thừa từ `AppException`. |
| 9 | `backend/src/main/java/com/funnyshop/exception/ResourceAlreadyExistsException.java` | **Cập nhật** | Kế thừa từ `AppException`. |
| 10 | `backend/src/main/java/com/funnyshop/exception/GlobalHandleException.java` | **Cập nhật** | Biến thành `@RestControllerAdvice` tập trung. |
| 11 | `backend/src/main/java/com/funnyshop/repository/ProductRepository.java` | **Cập nhật** | Thêm `LEFT JOIN FETCH` và `countQuery`. |
| 12 | `backend/src/main/java/com/funnyshop/service/ProductService.java` | **Cập nhật** | Chuyển trả về `ProductResponse`, nhận `sortBy`, `sortDir`. |
| 13 | `backend/src/main/java/com/funnyshop/service/impl/ProductServiceImpl.java` | **Cập nhật** | Xử lý map DTO, khởi tạo Sort và Pageable linh hoạt. |
| 14 | `backend/src/main/java/com/funnyshop/controller/ProductController.java` | **Đổi tên & Sửa** | Đổi từ `productController`, tách tham số `sortBy`/`sortDir`. |
| 15 | `backend/src/main/java/com/funnyshop/config/SecurityConfig.java` | **Cập nhật** | Cấp quyền public cho `/api/categories/**` và `/api/products/**`. |

---

## IV. Hướng dẫn kiểm thử API (Testing Guide)

### 1. Lấy danh sách danh mục (cho combobox/bộ lọc Frontend)
```bash
curl -X GET http://localhost:8080/api/categories
# hoặc
curl -X GET http://localhost:8080/api/v1/categories
```
**Response mẫu (200 OK):**
```json
{
  "code": 200,
  "message": "Lấy danh sách danh mục thành công!",
  "data": [
    {
      "id": 1,
      "name": "Thời trang Nam",
      "description": "Sản phẩm thời trang dành cho nam giới: áo sơ mi, quần jeans, áo khoác..."
    },
    {
      "id": 2,
      "name": "Thời trang Nữ",
      "description": "Sản phẩm thời trang dành cho nữ giới: váy, đầm, áo nữ, quần nữ..."
    }
  ]
}
```

---

### 2. Xem danh sách sản phẩm với tham số sắp xếp linh hoạt
#### Sắp xếp theo giá tăng dần:
```bash
curl -X GET "http://localhost:8080/api/v1/products?sortBy=price&sortDir=asc&page=0&size=5"
```
#### Sắp xếp theo số lượng tồn kho giảm dần:
```bash
curl -X GET "http://localhost:8080/api/v1/products?sortBy=stockQuantity&sortDir=desc&page=0&size=5"
```
#### Tìm kiếm theo tên kết hợp lọc danh mục:
```bash
curl -X GET "http://localhost:8080/api/v1/products?keyword=áo&categoryId=1&sortBy=price&sortDir=asc"
```
**Response mẫu (200 OK):**
```json
{
  "code": 200,
  "message": "Lấy danh sách sản phẩm thành công!",
  "data": {
    "content": [
      {
        "id": 23,
        "name": "Áo Thun Nam",
        "description": "Áo thun nam cotton 100%, thoáng mát",
        "price": 150000.00,
        "stockQuantity": 100,
        "stock": 100,
        "category": {
          "id": 1,
          "name": "Thời trang Nam",
          "description": "Sản phẩm thời trang dành cho nam giới: áo sơ mi, quần jeans, áo khoác..."
        },
        "imageUrl": "https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?w=400",
        "createdAt": "2026-10-29T15:16:29",
        "updatedAt": "2026-10-29T15:16:29"
      }
    ],
    "pageable": { ... },
    "totalElements": 6,
    "totalPages": 2,
    "size": 5,
    "number": 0
  }
}
```

---

### 3. Xem chi tiết sản phẩm
```bash
curl -X GET http://localhost:8080/api/v1/products/1
```
**Response mẫu (200 OK):**
```json
{
  "code": 200,
  "message": "Lấy chi tiết sản phẩm thành công!",
  "data": {
    "id": 1,
    "name": "Áo Sơ Mi Nam Trắng",
    "description": "Áo sơ mi nam trắng cao cấp, vải cotton mềm mại",
    "price": 250000.00,
    "stockQuantity": 50,
    "stock": 50,
    "category": {
      "id": 1,
      "name": "Thời trang Nam",
      "description": "Sản phẩm thời trang dành cho nam giới..."
    },
    "imageUrl": "https://images.unsplash.com/photo-1596755094514-f87e34085b2c?w=400"
  }
}
```

---

### 4. Kiểm tra Global Exception Handling

#### Test không tìm thấy sản phẩm (404 Not Found):
```bash
curl -X GET http://localhost:8080/api/v1/products/9999
```
**Response mẫu:**
```json
{
  "code": 404,
  "message": "Không tìm thấy sản phẩm với ID: 9999"
}
```

#### Test tham số sắp xếp không hợp lệ (400 Bad Request):
```bash
curl -X GET "http://localhost:8080/api/v1/products?sortDir=invalid_direction"
```
**Response mẫu:**
```json
{
  "code": 400,
  "message": "sortDir chỉ chấp nhận asc hoặc desc"
}
```

