# task.md – E-Commerce FunnyShop (MVP) Frontend Checklist

> **Vai trò:** Senior Frontend Engineer kiêm Tech Lead  
> **Phạm vi:** TOÀN BỘ FRONTEND (Không viết Backend, kết nối qua API Contract & Mock API in-memory)  
> **Quy ước:**  
> - `[ ]` Chưa làm  
> - `[/]` Đang làm  
> - `[x]` Đã xong & kiểm chứng thực tế (chỉ tick khi đã build/chạy thật)  
> - Mỗi task đều gắn mã SRS: FR-xx, NFR-xx, hoặc mục 2.x  
> - Cập nhật ngay sau khi hoàn thành từng task, không dồn cuối phase  

---

## 📌 HỢP ĐỒNG API GIẢ ĐỊNH (API CONTRACT)
*Được dùng cho tầng Mock API in-memory và bàn giao cho Backend Spring Boot:*

| Phương thức | Endpoint | Body / Query | Phản hồi thành công | Ghi chú & Mã SRS |
|---|---|---|---|---|
| `POST` | `/api/auth/register` | `{fullName, email, password}` | `201 Created` - `{message: "Đăng ký thành công"}` | FR-01, NFR-04 |
| `POST` | `/api/auth/login` | `{email, password}` | `200 OK` - `{token, user: {id, fullName, email, role}}` | FR-01, NFR-05 |
| `GET` | `/api/users/me` | Header `Bearer <token>` | `200 OK` - `{id, fullName, email, role}` | Mục 2.1 |
| `PUT` | `/api/users/me` | `{fullName, email, password?}` | `200 OK` - `{id, fullName, email, role}` | Mục 2.1 |
| `GET` | `/api/categories` | Không | `200 OK` - `[{id, name, slug}]` | Mục 2.2 |
| `GET` | `/api/products` | `?q=&categoryId=&sort=&page=&size=` | `200 OK` - `{content: Product[], page, totalPages, totalElements}` (`sort`: `price_asc`, `price_desc`, `stock_desc`, `rating_desc`) | FR-02, NFR-01 |
| `GET` | `/api/products/{id}` | Path `id` | `200 OK` - `Product` | FR-02 |
| `POST` | `/api/orders` | `{fullName, phone, address, items: [{productId, quantity}]}` | `201 Created` - `Order` (status `PENDING`) | FR-03 |
| `GET` | `/api/orders/my` | Header `Bearer <token>` | `200 OK` - `Order[]` | Mục 2.4 |
| `GET` | `/api/orders/{id}` | Header `Bearer <token>` | `200 OK` - `Order` chi tiết kèm `orderItems` | Mục 2.4 |
| `POST` | `/api/admin/products` | `{name, description, price, stock, imageUrl, categoryId}` | `201 Created` - `Product` | FR-04 |
| `PUT` | `/api/admin/products/{id}` | `{name, description, price, stock, imageUrl, categoryId}` | `200 OK` - `Product` | FR-04 |
| `DELETE` | `/api/admin/products/{id}` | Path `id` | `200 OK` - `{message: "Đã xóa"}` | FR-04 |
| `GET` | `/api/admin/orders` | Header `Bearer <token>` | `200 OK` - `Order[]` toàn bộ đơn | FR-06 |
| `PATCH` | `/api/admin/orders/{id}/status` | `{status}` | `200 OK` - `Order` đã cập nhật | FR-06 |
| `POST` | `/api/admin/ai/description` | `{productName}` | `200 OK` - `{description: string}` | FR-05 |
| `POST` | `/api/admin/ai/mock-products` | `{count: number}` | `200 OK` - `Product[]` | Mục 2.6 |
| `POST` | `/api/chat` | `{message: string}` | `200 OK` - `{reply: string, products?: Product[]}` | Mục 2.6 |

- **Cấu trúc Product:** `{id, name, description, price, stock, imageUrl, rating, category: {id, name}}`
- **Vòng đời trạng thái đơn:** `PENDING → PROCESSING → SHIPPING → COMPLETED` hoặc `CANCELLED`
- **Chuẩn lỗi thống nhất:** `{status: number, message: string, errors?: Record<string, string>}`

---

## 📌 QUYẾT ĐỊNH MẶC ĐỊNH
1. **Đăng nhập:** Email + Mật khẩu (FR-01).
2. **Phân quyền (Roles):** `CUSTOMER`, `ADMIN`.
3. **Mock Data khởi tạo:** 1 Admin (`admin@funny.shop` / `Admin@123`), 1 Customer (`customer@funny.shop` / `Customer@123`), 5 danh mục, 20 sản phẩm mẫu phong phú, đơn hàng mẫu.
4. **Rating:** Hiển thị sao và dùng để sắp xếp (`rating_desc`), chưa có tính năng khách gửi đánh giá.
5. **Ảnh sản phẩm:** Dùng URL hình ảnh chất lượng từ Unsplash / CDN ổn định.
6. **Giỏ hàng:** Quản lý client-side bằng Zustand + LocalStorage persist. Khách chưa login vẫn thêm vào giỏ được; chỉ bắt buộc login khi checkout.
7. **Thanh toán:** Cố định phương thức COD (Cash on Delivery).
8. **Quy ước mã nguồn:** camelCase cho hàm/biến, PascalCase cho component và tên file trùng tên component.
9. **Chế độ Mock / Backend thật:** Điều khiển qua biến môi trường `VITE_USE_MOCK=true|false`. Mọi component chỉ gọi qua `src/api/` facade.

---

## Phase 0 – Khởi tạo & Rà soát nền tảng
- [x] Đọc toàn bộ `SRS_FunnyShop_MVP.md` (mục 1–5), nắm vững FR/NFR và kiến trúc *(SRS mục 1–5)*
- [x] Tạo `task.md` với đầy đủ Phase 0–9, mã SRS, hợp đồng API và quyết định mặc định *(NFR-09)*
- [x] Rà soát thư mục `front/`: kiểm tra `package.json`, `vite.config.js`, `eslint.config.js` *(SRS 3.1)*
- [x] Cấu hình file `.env.example` chứa `VITE_API_URL` và `VITE_USE_MOCK` *(NFR-06, NFR-07)*
- [x] Tạo file `.env` cục bộ cho môi trường dev (`VITE_USE_MOCK=true`, `VITE_API_URL=http://localhost:8080`) *(NFR-06)*
- [x] Khởi tạo Git repo cục bộ và chuyển sang nhánh `dev` *(SRS 3.3, NFR-08)*
- [x] Chạy kiểm tra thực tế: `npm run lint` và `npm run build` đều PASS *(NFR-08, NFR-09)*

---

## Phase 1 – Nền tảng (Architecture, API Client, Mock Engine & Stores)
- [ ] Bổ sung thư viện hỗ trợ UI nếu cần (`lucide-react` cho icons) *(UX, NFR-10)*
- [ ] Cấu hình Tailwind CSS v4 trong `src/index.css` với đầy đủ theme colors, dark/light hints, typography, custom scrollbar *(NFR-10, UX)*
- [ ] Thiết lập cấu trúc thư mục chuẩn theo đặc tả: `api/`, `components/`, `layouts/`, `pages/`, `routes/`, `store/`, `hooks/`, `utils/` *(NFR-09)*
- [ ] Viết các tiện ích utils: `formatCurrency` (VND), `formatDate` (`dd/MM/yyyy HH:mm`), `validators` (email, password >= 6, VN phone) *(UX, FR-01, FR-03)*
- [ ] Xây dựng `src/api/axios.js` với Axios instance, request interceptor (gắn JWT Bearer) và response interceptor (bắt 401 tự động logout + redirect) *(NFR-05, FR-01)*
- [ ] Xây dựng Mock API Engine in-memory (`src/api/mock/`):
  - [ ] Mock Data khởi tạo: 5 danh mục, 20 sản phẩm, 2 user (`ADMIN`, `CUSTOMER`), đơn hàng mẫu *(Mục 2.2, 2.5)*
  - [ ] Giả lập độ trễ mạng ngẫu nhiên 300–600ms và giả lập lỗi 400/401/404/409/500 *(NFR-01)*
  - [ ] Triển khai các mock endpoints: auth, users/me, categories, products (lọc, search, phân trang, sort), orders, admin products, admin orders, AI generator, chat *(FR-01 → FR-06, Mục 2.6)*
- [ ] Xây dựng tầng API Client Facade (`src/api/auth.js`, `src/api/product.js`, `src/api/order.js`, `src/api/admin.js`, `src/api/ai.js`) tự động chuyển đổi giữa Mock API và Axios theo `VITE_USE_MOCK` *(NFR-06)*
- [ ] Xây dựng các Zustand stores:
  - [ ] `authStore`: token, user, isAuthenticated, login, register, logout, updateProfile, persist LocalStorage *(FR-01, Mục 2.1)*
  - [ ] `cartStore`: items, addItem, updateQuantity, removeItem, clearCart, tổng số lượng, tổng tiền, persist LocalStorage *(FR-03)*
  - [ ] `toastStore`: hệ thống thông báo Toast (success, error, warning, info) tự tắt sau 3-4s *(UX)*
- [ ] Kiểm chứng Phase 1: Chạy `npm run lint` và `npm run build` không lỗi; kiểm tra mock data và store hoạt động qua console test *(NFR-08, NFR-09)*

---

## Phase 2 – Component dùng chung & Layout Hệ thống
- [ ] Xây dựng bộ UI Components tái sử dụng (`src/components/ui/`):
  - [ ] `Button`: variants (primary, secondary, danger, outline, ghost), kích cỡ, loading spinner, disabled state *(UX)*
  - [ ] `Input`: label, error message, helper text, focus rings, icon slots *(UX)*
  - [ ] `Select`: dropdown chọn danh mục, bộ lọc, sắp xếp *(UX)*
  - [ ] `Badge`: trạng thái đơn hàng (PENDING vàng, PROCESSING xanh dương, SHIPPING tím, COMPLETED xanh lá, CANCELLED đỏ) và stock status *(UX, FR-06)*
  - [ ] `Modal` & `ConfirmDialog`: dialog xác nhận xóa sản phẩm / thao tác quan trọng *(UX, FR-04)*
  - [ ] `ToastContainer` & `ToastItem`: hiển thị thông báo góc màn hình với hiệu ứng mượt *(UX)*
  - [ ] `Spinner` & `Skeleton`: skeleton loader cho ProductCard, Table, Detail *(UX, NFR-02)*
  - [ ] `Pagination`: điều hướng trang 1, 2, 3... có nút Next/Prev *(UX, FR-02)*
  - [ ] `EmptyState`: hiển thị khi giỏ trống, không tìm thấy sản phẩm, chưa có đơn hàng *(UX)*
  - [ ] `ErrorState`: hiển thị khi tải dữ liệu thất bại kèm nút "Thử lại" *(UX)*
- [ ] Xây dựng Layouts:
  - [ ] `MainLayout`:
    - [ ] Header: Logo thương hiệu, thanh tìm kiếm nhanh, giỏ hàng kèm badge số lượng, menu user (Customer / Admin link / Đăng xuất), hamburger menu trên Mobile *(NFR-10, FR-02, FR-03)*
    - [ ] Footer: Thông tin cửa hàng, chính sách, cam kết, liên hệ *(UX)*
  - [ ] `AdminLayout`: Sidebar chuyên nghiệp (Dashboard, Sản phẩm, Đơn hàng), Header admin, breadcrumbs, nút về cửa hàng *(FR-04, FR-06)*
- [ ] Xây dựng Route Guard & Điều hướng (`src/routes/`):
  - [ ] `ProtectedRoute`: chặn khách chưa login vào `/cart`, `/checkout`, `/orders`, `/profile` *(NFR-05)*
  - [ ] `AdminRoute`: chỉ cho phép user role `ADMIN` vào `/admin/*`, redirect về `/` nếu role là `CUSTOMER` *(NFR-05, FR-04)*
  - [ ] Trang `NotFoundPage` (404) giao diện đẹp kèm nút quay về trang chủ *(UX)*
- [ ] Kiểm chứng Phase 2: Chạy `npm run dev`, kiểm tra responsive trên mobile (375px), tablet (768px), desktop (1280px); `npm run lint` & `npm run build` PASS *(NFR-08, NFR-10)*

---

## Phase 3 – Authentication & Hồ sơ người dùng
- [ ] Trang Đăng ký (`/register`):
  - [ ] Form: Họ tên, Email, Mật khẩu, Xác nhận mật khẩu *(FR-01)*
  - [ ] Client validation từng field: định dạng email, mật khẩu >= 6 ký tự, mật khẩu khớp *(FR-01)*
  - [ ] Gọi API đăng ký qua `src/api/auth.js`, xử lý thông báo thành công / lỗi trùng email *(FR-01)*
  - [ ] Chuyển hướng sang `/login` sau khi đăng ký thành công *(FR-01)*
- [ ] Trang Đăng nhập (`/login`):
  - [ ] Form: Email, Mật khẩu, có toggle ẩn/hiện mật khẩu *(FR-01)*
  - [ ] Xử lý đăng nhập, lưu JWT và thông tin user vào `authStore` *(FR-01, NFR-05)*
  - [ ] Điều hướng thông minh theo role: `ADMIN` vào `/admin/products`, `CUSTOMER` về trang chủ hoặc quay lại trang trước đó (ví dụ `/checkout`) *(FR-01)*
  - [ ] Nút điền nhanh tài khoản mẫu Admin và Customer để tiện kiểm thử *(UX)*
- [ ] Trang Hồ sơ cá nhân (`/profile`):
  - [ ] Hiển thị thông tin: Họ tên, Email, Vai trò *(Mục 2.1)*
  - [ ] Form cập nhật họ tên, email, đổi mật khẩu mới (kèm xác nhận mật khẩu) *(Mục 2.1)*
  - [ ] Nút Đăng xuất trên trang profile và Header *(FR-01)*
- [ ] Xử lý Interceptor 401: Giả lập token hết hạn, kiểm tra tự động xóa session, bắn toast cảnh báo và chuyển về `/login` *(NFR-05)*
- [ ] Kiểm chứng Phase 3: Test flow Register -> Login (Admin & Customer) -> Edit Profile -> Logout -> 401 handling; `npm run lint` & `npm run build` PASS *(NFR-08)*

---

## Phase 4 – Catalog & Tìm kiếm sản phẩm
- [ ] Component `ProductCard`: Ảnh (lazy load), Tên sản phẩm, Giá VND, Badge danh mục, Rating sao, Tồn kho, Nút "Thêm vào giỏ" (disable + nhãn "Hết hàng" nếu stock = 0) *(FR-02, UX)*
- [ ] Trang Chủ / Danh mục (`/`):
  - [ ] Banner Hero quảng bá cửa hàng bắt mắt *(UX)*
  - [ ] Thanh tìm kiếm tích hợp debounce ~300ms *(FR-02)*
  - [ ] Bộ lọc danh mục (Tabs hoặc Sidebar/Dropdown) *(FR-02)*
  - [ ] Bộ chọn sắp xếp: Giá tăng dần (`price_asc`), Giá giảm dần (`price_desc`), Tồn kho giảm dần (`stock_desc`), Đánh giá cao nhất (`rating_desc`) *(FR-02)*
  - [ ] Grid sản phẩm chuẩn responsive: 1–2 cột mobile, 3 cột tablet, 4 cột desktop *(NFR-10)*
  - [ ] Phân trang với `Pagination` component *(FR-02)*
  - [ ] Đồng bộ toàn bộ state (search `q`, `category`, `sort`, `page`) lên URL query params, hỗ trợ F5 giữ nguyên trạng thái *(FR-02)*
  - [ ] Skeleton loading state khi đang tải dữ liệu và Empty state khi không tìm thấy *(UX)*
- [ ] Trang Chi tiết sản phẩm (`/products/:id`):
  - [ ] Breadcrumb điều hướng *(UX)*
  - [ ] Ảnh sản phẩm lớn, tên, danh mục, rating, số lượng tồn kho *(FR-02)*
  - [ ] Mô tả chi tiết sản phẩm *(FR-02)*
  - [ ] Bộ chọn số lượng (tối thiểu 1, tối đa bằng số lượng tồn kho) *(FR-02, FR-03)*
  - [ ] Nút "Thêm vào giỏ hàng" và "Mua ngay" kèm toast thông báo *(FR-02, FR-03)*
  - [ ] Xử lý khi sản phẩm không tồn tại (404) hoặc hết hàng *(UX)*
- [ ] Kiểm chứng Phase 4: Thử nghiệm tìm kiếm, lọc, sort, pagination, URL params, thêm giỏ từ cả Card và trang Chi tiết; `npm run lint` & `npm run build` PASS *(NFR-08)*

---

## Phase 5 – Giỏ hàng, Đặt hàng & Lịch sử đơn hàng
- [ ] Trang Giỏ hàng (`/cart`):
  - [ ] Danh sách các mặt hàng trong giỏ: ảnh, tên, đơn giá, bộ tăng/giảm số lượng, nút xóa từng món *(FR-03)*
  - [ ] Ràng buộc số lượng: tối thiểu 1, không vượt quá stock hiện có *(FR-03)*
  - [ ] Nút "Xóa toàn bộ giỏ hàng" kèm xác nhận *(UX)*
  - [ ] Bảng tóm tắt đơn: tạm tính, phí vận chuyển (miễn phí), tổng tiền VND *(FR-03)*
  - [ ] Nút "Tiến hành thanh toán" dẫn sang `/checkout` *(FR-03)*
  - [ ] Trạng thái giỏ trống với nút "Khám phá sản phẩm ngay" *(UX)*
- [ ] Trang Thanh toán (`/checkout`):
  - [ ] Yêu cầu đăng nhập: nếu chưa đăng nhập, chuyển sang `/login?redirect=/checkout` *(FR-03)*
  - [ ] Form thông tin giao hàng: Họ tên, Số điện thoại (validate định dạng SĐT Việt Nam 10 số `0[3|5|7|8|9]...`), Địa chỉ nhận hàng chi tiết *(FR-03)*
  - [ ] Tự động điền trước họ tên nếu đã có trong `authStore` *(UX)*
  - [ ] Phương thức thanh toán: Hiển thị COD (Thanh toán khi nhận hàng) cố định kèm ghi chú minh bạch *(FR-03)*
  - [ ] Tóm tắt đơn hàng bên cạnh (danh sách món, tổng tiền) *(FR-03)*
  - [ ] Xử lý nút Đặt hàng: chống click đúp (`isSubmitting`), trừ stock trong mock, tạo đơn hàng mới với trạng thái `PENDING` *(FR-03)*
  - [ ] Khi đặt thành công: Toast chúc mừng, xóa sạch giỏ hàng, điều hướng đến `/orders` *(FR-03)*
  - [ ] Khi gặp lỗi (ví dụ sản phẩm bị hết hàng): hiển thị thông báo lỗi rõ ràng, giữ nguyên form đã nhập *(FR-03, UX)*
- [ ] Trang Lịch sử đơn hàng (`/orders`):
  - [ ] Danh sách đơn của khách: mã đơn, ngày đặt (`dd/MM/yyyy HH:mm`), tổng tiền VND, Badge trạng thái màu chuẩn *(Mục 2.4, FR-06)*
  - [ ] Trạng thái chưa có đơn hàng nào *(UX)*
- [ ] Trang Chi tiết đơn hàng (`/orders/:id`):
  - [ ] Thông tin người nhận, số điện thoại, địa chỉ *(Mục 2.4)*
  - [ ] Timeline quy trình trạng thái đơn: `PENDING → PROCESSING → SHIPPING → COMPLETED` (hoặc `CANCELLED`) *(FR-06)*
  - [ ] Danh sách sản phẩm trong đơn, số lượng, đơn giá, tổng tiền *(Mục 2.4)*
- [ ] Kiểm chứng Phase 5: Test toàn bộ quy trình: Thêm giỏ -> Xem giỏ -> Checkout -> Lịch sử đơn -> Chi tiết đơn; `npm run lint` & `npm run build` PASS *(NFR-08)*

---

## Phase 6 – Quản trị Admin (Sản phẩm, Đơn hàng & AI Generator)
- [ ] Quản lý Sản phẩm (`/admin/products`):
  - [ ] Bảng danh sách sản phẩm admin: Ảnh thumb, Tên, Danh mục, Giá, Tồn kho, Đánh giá, Nút Sửa / Xóa *(FR-04)*
  - [ ] Bảng hỗ trợ cuộn ngang trên màn hình nhỏ *(NFR-10)*
  - [ ] Hộp thoại xác nhận (ConfirmDialog) khi bấm Xóa sản phẩm *(FR-04)*
  - [ ] Nút "Tạo dữ liệu mẫu bằng AI" (tự động sinh thêm 5 sản phẩm mock ngẫu nhiên) *(Mục 2.6)*
  - [ ] Nút "Thêm sản phẩm mới" dẫn đến `/admin/products/new` *(FR-04)*
- [ ] Form Thêm / Sửa Sản phẩm (`/admin/products/new` & `/admin/products/:id`):
  - [ ] Các trường: Tên sản phẩm, Danh mục (dropdown), Giá, Tồn kho, URL hình ảnh, Mô tả chi tiết *(FR-04)*
  - [ ] Xem trước ảnh trực tiếp (Live Image Preview) khi nhập URL ảnh *(UX)*
  - [ ] Nút **"Tạo mô tả bằng AI"** cạnh ô mô tả:
    - [ ] Gửi tên sản phẩm đến API `POST /api/admin/ai/description` *(FR-05)*
    - [ ] Hiệu ứng loading / spinner trong lúc AI đang sinh nội dung *(FR-05)*
    - [ ] Điền kết quả vào trường mô tả, cho phép Admin chỉnh sửa trước khi lưu *(FR-05)*
    - [ ] Xử lý lỗi AI mượt mà kèm thông báo toast *(FR-05, UX)*
  - [ ] Validate dữ liệu form: tên không rỗng, giá > 0, tồn kho >= 0 *(FR-04)*
- [ ] Quản lý Đơn hàng (`/admin/orders`):
  - [ ] Bảng hiển thị toàn bộ đơn hàng của khách hàng *(FR-06)*
  - [ ] Hiển thị: Mã đơn, Khách hàng, SĐT, Địa chỉ, Ngày đặt, Tổng tiền, Trạng thái đơn *(FR-06)*
  - [ ] Dropdown cập nhật trạng thái đơn hàng:
    - [ ] **Chỉ cho phép chuyển trạng thái hợp lệ** theo sơ đồ FR-06:
      - `PENDING` → `PROCESSING` hoặc `CANCELLED`
      - `PROCESSING` → `SHIPPING` hoặc `CANCELLED`
      - `SHIPPING` → `COMPLETED` hoặc `CANCELLED`
      - `COMPLETED` / `CANCELLED` → Khóa không cho đổi tiếp
    - [ ] Cập nhật tức thời và bắn Toast xác nhận *(FR-06)*
- [ ] Kiểm chứng Phase 6: Test Thêm/Sửa/Xóa sản phẩm, test nút AI tạo mô tả, test nút AI tạo mock data, test luồng chuyển trạng thái đơn hàng; `npm run lint` & `npm run build` PASS *(NFR-08)*

---

## Phase 7 – AI Chatbot Widget
- [ ] Xây dựng Floating Action Button (FAB) góc phải dưới màn hình với biểu tượng Chatbot bắt mắt *(Mục 2.6)*
- [ ] Hộp thoại Chatbot nổi (Chat Window) với khả năng Mở / Đóng mượt mà *(Mục 2.6)*
- [ ] Giao diện lịch sử hội thoại (tin nhắn của User và tin nhắn của AI Assistant) *(Mục 2.6)*
- [ ] Gửi tin nhắn bằng phím `Enter` hoặc nút Send; tự động cuộn xuống tin nhắn mới nhất *(Mục 2.6)*
- [ ] Trạng thái "AI đang suy nghĩ..." (Typing indicator với 3 dấu chấm nhảy) *(Mục 2.6)*
- [ ] Hiển thị Card / Link gợi ý sản phẩm đi kèm câu trả lời của AI nếu phản hồi chứa danh sách sản phẩm gợi ý *(Mục 2.6)*
- [ ] Xử lý lỗi kết nối / timeout kèm nút "Thử lại" (Retry) trực tiếp trên tin nhắn *(Mục 2.6, UX)*
- [ ] Nút "Xóa lịch sử chat" để người dùng bắt đầu cuộc hội thoại mới *(UX)*
- [ ] Kiểm chứng Phase 7: Thử hỏi chatbot về sản phẩm, giá cả, gợi ý mua hàng; kiểm tra card sản phẩm gợi ý và nút Retry; `npm run lint` & `npm run build` PASS *(NFR-08)*

---

## Phase 8 – Tối ưu UX/UI, Performance & DevOps Frontend
- [ ] Code Splitting & Lazy Loading: Áp dụng `React.lazy()` và `Suspense` cho tất cả các trang, đảm bảo FCP < 2s *(NFR-02)*
- [ ] Lazy loading hình ảnh với fallback placeholder nhẹ *(NFR-02, UX)*
- [ ] Kiểm tra và tinh chỉnh Responsive trên cả 3 mốc thiết bị: Mobile (375px), Tablet (768px), Desktop (1280px) *(NFR-10)*
- [ ] Kiểm tra tính tương thích trên các trình duyệt Chrome, Edge, Firefox, Safari *(NFR-11)*
- [ ] Xây dựng `Dockerfile` Frontend multi-stage:
  - [ ] Stage 1: Node.js 22 alpine build mã nguồn Vite thành static assets *(NFR-07)*
  - [ ] Stage 2: Nginx alpine serve thư mục `dist/` *(NFR-07)*
- [ ] Cấu hình `nginx.conf` chuẩn cho SPA:
  - [ ] Định tuyến `try_files $uri $uri/ /index.html` hỗ trợ React Router *(NFR-07)*
  - [ ] Bật nén Gzip cho HTML, CSS, JS, JSON, SVG *(NFR-02)*
  - [ ] Cache headers tối ưu cho static assets (`/assets/*`) *(NFR-02)*
- [ ] Xây dựng GitHub Actions workflow `.github/workflows/frontend-ci.yml`:
  - [ ] Trigger khi push / pull request vào nhánh `main` và `dev` *(NFR-08)*
  - [ ] Các bước: `npm ci` → `npm run lint` → `npm run build` *(NFR-08)*
- [ ] Kiểm chứng Phase 8: Kiểm tra bundle size sau build, kiểm tra Dockerfile và workflow YAML hợp lệ; `npm run lint` & `npm run build` PASS *(NFR-08)*

---

## Phase 9 – QA, Kiểm thử & Hoàn thiện Tài liệu
- [ ] Viết bộ Test Cases thủ công chi tiết cho toàn bộ các màn hình (FR-01 → FR-06, NFR-02, NFR-05, NFR-10) tại `docs/manual_test_cases.md` *(Mục 4, 5)*
- [ ] Thực hiện kiểm thử thủ công và lập Bảng Test Result (ghi rõ PASS/FAIL, mục tiêu đạt >= 80%) tại `docs/test_results.md` *(SRS mục 2)*
- [ ] Bổ sung unit test tự động bằng Vitest cho các logic cốt lõi: `cartStore` (thêm, sửa, xóa, tính tổng), `validators` (email, phone) *(NFR-08)*
- [ ] Đo đạc và đánh giá hiệu năng (First Contentful Paint, tốc độ phản hồi) *(NFR-02)*
- [ ] Đối chiếu toàn diện từng yêu cầu trong `SRS_FunnyShop_MVP.md` với các tính năng đã cài đặt *(SRS mục 1–5)*
- [ ] Cập nhật hoàn chỉnh `README.md`:
  - [ ] Giới thiệu dự án, kiến trúc Frontend và công nghệ sử dụng
  - [ ] Hướng dẫn cài đặt và khởi chạy cục bộ (`npm run dev`)
  - [ ] Hướng dẫn cấu hình biến môi trường (`VITE_USE_MOCK`, `VITE_API_URL`)
  - [ ] Tài khoản mẫu để kiểm thử (`Admin` và `Customer`)
  - [ ] Hướng dẫn chuyển đổi từ Mock API sang Backend Spring Boot thật
  - [ ] Hướng dẫn build Docker image cho Frontend
- [ ] Cập nhật trạng thái `task.md`, tổng kết toàn bộ quá trình vào mục Nhật ký *(NFR-09)*

---

## 📝 NHẬT KÝ & VẤN ĐỀ TỒN ĐỌNG

### Quyết định kỹ thuật
| # | Quyết định | Lý do & Căn cứ | Phase |
|---|---|---|---|
| 1 | Xác thực bằng Email + Mật khẩu | SRS mục 2.1 ghi "username/password" nhưng FR-01 mục 4.1 ghi "Email, Mật khẩu" → ưu tiên FR-01 chuẩn E-Commerce | Phase 0 |
| 2 | Kiến trúc Mock API song song | Backend Spring Boot chưa sẵn sàng. Cần Mock API in-memory (delay 300-600ms, giả lập lỗi) thông qua tầng facade `src/api/` để chuyển sang Backend thật chỉ cần đổi `VITE_USE_MOCK=false` | Phase 0 |
| 3 | Quản lý giỏ hàng bằng Zustand + LocalStorage | FR-03 quy định giỏ hàng lưu ở Client; cho phép khách thêm giỏ khi chưa đăng nhập, bắt buộc login khi checkout | Phase 0 |
| 4 | Phương thức thanh toán COD cố định | Theo đúng phạm vi MVP trong SRS FR-03 | Phase 0 |
| 5 | Dùng Tailwind CSS v4 với `@tailwindcss/vite` | Tận dụng sẵn cấu hình Vite + Tailwind v4 có sẵn trong `front/` | Phase 0 |
| 6 | Thêm thư viện `lucide-react` ở Phase 1 | Cung cấp bộ icon giao diện thương mại điện tử hiện đại, nhẹ, đồng bộ | Phase 0 |
| 7 | Nhánh làm việc Git `dev` | Tuân thủ quy tắc làm việc trên nhánh `dev`, commit theo Conventional Commits sau mỗi phase | Phase 0 |

### Mâu thuẫn trong SRS & Cách giải quyết
| # | Mâu thuẫn trong SRS | Giải pháp xử lý |
|---|---|---|
| 1 | Mục 1.2 ghi "4–5 thành viên", trong khi NFR-07 ghi "6 thành viên" | Không ảnh hưởng đến phạm vi phát triển Frontend |
| 2 | Mục 2.1 ghi "đăng nhập... qua username/password", trong khi FR-01 ghi "Người dùng nhập Email, Mật khẩu" | Thống nhất sử dụng Email + Mật khẩu cho form đăng ký và đăng nhập |

### Kết quả rà soát `front/` (Phase 0)
- **Môi trường & Công cụ:** Node.js 22.x, Windows 10/11 PowerShell.
- **Dependencies hiện có trong `package.json`:**
  - React 19.3.1 & React DOM 19.3.1
  - React Router DOM 7.18.4
  - Zustand 5.0.16
  - Axios 1.20.0
  - Tailwind CSS 4.3.3 & `@tailwindcss/vite` 4.3.3
  - ESLint 10.13.0
- **Kết quả kiểm tra build & lint:**
  - `npm run lint` -> PASS (Code 0, không có lỗi linter)
  - `npm run build` -> PASS (Code 0, Vite build thành công trong 1.44s)
- **Tình trạng mã nguồn:**
  - `src/App.jsx` và `src/index.css` hiện là template mặc định của Vite, sẽ được tái cấu trúc thành hệ thống components và design tokens ở Phase 1 & 2.
- **Git:** Đã khởi tạo Git repository và tạo nhánh `dev`.

### Vấn đề tồn đọng & Cần lưu ý
- Chưa phát sinh lỗi blocker. Sẵn sàng bước vào Phase 1 ngay khi có xác nhận.
