# KẾ HOẠCH TRIỂN KHAI TASK: ADMIN CRUD, SOFT DELETE & QUẢN LÝ ĐƠN HÀNG

Tài liệu chi tiết đầy đủ đã được lập tại: [docs/PLAN_ADMIN_CRUD_ORDER_MANAGEMENT.md](file:///d:/thuc_tap/Thuc_Tap_Ki_IV/docs/PLAN_ADMIN_CRUD_ORDER_MANAGEMENT.md)

### Tóm tắt nội dung kế hoạch:
1. **Task 1: Triển khai CRUD API cốt lõi & Xóa mềm (Products, Categories, Users)**
   - Branch: `feature/admin-crud-softdelete`
   - Bổ sung trường `isDeleted` cho `Product` và `Category`.
   - Viết các API thêm mới, cập nhật, xóa mềm (`POST`, `PUT`, `DELETE /api/v1/admin/products` và `categories`).
   - Lọc bỏ các bản ghi `is_deleted = true` khỏi các truy vấn `GET` mặc định.
   - Kiểm tra API `PUT /api/v1/users/me` cho người dùng cá nhân.

2. **Task 2: Xây dựng module Quản lý & Cập nhật Trạng thái Đơn hàng**
   - Branch: `feature/order-status-management`
   - Khởi tạo enum `OrderStatus` với State Machine validation (`canTransitionTo`).
   - Xây dựng API Admin: `GET /api/v1/admin/orders`, `PUT /api/v1/admin/orders/{id}/status`.
   - Xây dựng API Customer: `GET /api/v1/orders/my-orders`, `GET /api/v1/orders/{id}`.
   - Kiểm tra chặt chẽ quyền sở hữu đơn hàng (Customer chỉ xem đơn của chính mình, Admin xem mọi đơn).

3. **Kiểm thử tự động:**
   - Unit tests cho State Machine, Service Layer và MockMvc tests cho phân quyền JWT.

