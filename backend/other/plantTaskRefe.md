# BÁO CÁO KỸ THUẬT: ĐIỀU CHỈNH CATALOG, SEARCH & GLOBAL EXCEPTION HANDLING (TASK-201)

Tài liệu chi tiết đã được lưu tại: [docs/CATALOG_SEARCH_REFACTOR.md](file:///d:/thuc_tap/Thuc_Tap_Ki_IV/docs/CATALOG_SEARCH_REFACTOR.md)

### Tóm tắt các nội dung điều chỉnh:
1. **Task 1: Optimize Product Fetching & Category API**
   - Tạo DTO `ProductResponse` và `CategoryResponse` giải quyết lỗi Lazy Loading khi `open-in-view: false`.
   - Cập nhật `ProductRepository` sử dụng `LEFT JOIN FETCH p.category` cùng `countQuery`.
   - Xây dựng `CategoryService` và `CategoryController` cung cấp API `GET /api/categories` (và `/api/v1/categories`).
   - Cấp quyền permitAll trong `SecurityConfig`.

2. **Task 2: Standardize Global Exception Handling**
   - Tạo `AppException` kế thừa `RuntimeException`.
   - Cập nhật `ResourceNotFoundException` và `ResourceAlreadyExistsException` kế thừa từ `AppException`.
   - Cập nhật `GlobalHandleException` thành `@RestControllerAdvice` tập trung xử lý `AppException`, `IllegalArgumentException`, `MethodArgumentNotValidException`, `AccessDeniedException`, `Exception`.
   - Chuẩn hóa `ApiResponse<T>` với các helper methods.

3. **Task 3: Refactor API Sorting Logic**
   - Đổi tên Controller chuẩn Java convention: `ProductController`.
   - Bóc tách tham số sắp xếp thành `sortBy` và `sortDir`.
   - Tự động map an toàn thuộc tính Entity trong `ProductServiceImpl`.
   - Giữ khả năng tương thích ngược thông minh với query `sort` dạng gộp (`price_asc`, `stock_desc`,...) và query tìm kiếm `keyword` / `q`.

