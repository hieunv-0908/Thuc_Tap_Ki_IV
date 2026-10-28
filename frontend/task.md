# task.md – Frontend FunnyShop (MVP)

> **Vị trí file:** `frontend/task.md`
> **Phạm vi:** chỉ thêm/sửa/xóa file trong `frontend/`. Không đụng `backend/`, `database/`, `docs/`, `.github/`, `docker-compose.yml`, `README.md` gốc.
> **Tài liệu chuẩn (chỉ đọc):** `docs/SRS_FunnyShop_MVP.md` > `docs/DESIGN_SPEC.md` > file này.
> **Quy ước:** `- [ ]` chưa làm · `- [/]` đang làm · `- [x]` xong (chỉ tick sau khi đã chạy/kiểm chứng thực tế).
> Cập nhật file này **ngay sau mỗi task**, không dồn cuối phase.

---

## Tiến độ tổng quan

| Phase | Nội dung | Trạng thái |
|---|---|---|
| 0 | Khởi tạo & rà soát | ☐ |
| 1 | Nền tảng (cấu hình, services, store, utils) | ☐ |
| 2 | Component dùng chung & Layout | ☐ |
| 3 | Auth & Hồ sơ | ☐ |
| 4 | Catalog (Trang chủ, Chi tiết) | ☑ |
| 5 | Cart, Checkout, Order History | ☑ |
| 6 | Admin | ☐ |
| 7 | Chatbot AI | ☐ |
| 8 | Tối ưu & Docker (trong `frontend/`) | ☐ |
| 9 | QA & Hoàn thiện | ☐ |

---

## Phase 0 – Khởi tạo & rà soát

- [ ] Đọc `docs/SRS.md` và `frontend/Design.md`
- [ ] Rà soát `frontend/`: `package.json`, `vite.config.js`, `tailwind.config.js`, `Dockerfile`, `nginx.conf`
- [ ] Kiểm tra phiên bản Tailwind (v3 hay v4), ghi quyết định vào "Nhật ký"
- [ ] Bổ sung file còn thiếu: `index.html`, `src/main.jsx`, `src/App.jsx`, `src/index.css`, cấu hình ESLint
- [ ] Tạo `.env.example` (`VITE_API_URL`, `VITE_USE_MOCK`)
- [ ] Ghi **hợp đồng API giả định** vào mục "Hợp đồng API" cuối file
- [ ] Tạo thêm thư mục `src/routes/`, `src/utils/`, `src/services/mock/`
- [ ] Xóa các `.gitkeep` khi thư mục đã có file thật
- [ ] Chạy thử `npm install` và `npm run dev` thành công
- [ ] Commit: `chore(frontend): khởi tạo và rà soát cấu trúc`

## Phase 1 – Nền tảng

**Cài đặt & cấu hình**
- [ ] Cài `react-router-dom`, `zustand`, `axios`, `lucide-react`, `@fontsource/be-vietnam-pro`
- [ ] Cấu hình Tailwind + Design Tokens (màu, font, bo góc) theo `DESIGN_SPEC.md` mục 2 (NFR-10)
- [ ] Import font 400/500/600/700, thiết lập style nền tảng (`html`, `:focus-visible`)

**Services (`src/services/`)**
- [ ] Axios instance đọc `VITE_API_URL` (không hard-code) (NFR-06)
- [ ] Interceptor request: gắn `Authorization: Bearer <token>` (NFR-05)
- [ ] Interceptor response: 401 → xóa token, toast "Phiên đăng nhập đã hết hạn", chuyển `/login` (NFR-05)
- [ ] Hàm gọi API theo hợp đồng: `authService`, `productService`, `categoryService`, `orderService`, `adminService`, `aiService`, `chatService`
- [ ] Lớp mock trong `services/mock/` (độ trễ 300–600ms, giả lập lỗi), bật/tắt bằng `VITE_USE_MOCK`
- [ ] Dữ liệu mock: 5 danh mục, ~20 sản phẩm, tài khoản admin + customer, vài đơn hàng mẫu
- [ ] Component chỉ gọi qua `services/`, không gọi mock trực tiếp

**Store (`src/store/`)**
- [ ] `authStore`: token, user, `login`, `logout` (lưu LocalStorage) (FR-01)
- [ ] `cartStore`: items, `addItem`, `updateQuantity`, `removeItem`, `clearCart`, persist LocalStorage (FR-03)
- [ ] `toastStore`: thêm/xóa toast, tự tắt 4s, tối đa 3 toast

**Utils (`src/utils/`)**
- [ ] `formatCurrency` (VND, `1.250.000 ₫`)
- [ ] `formatDate` (`dd/MM/yyyy HH:mm`)
- [ ] `validators` (email, mật khẩu ≥ 6, SĐT Việt Nam, địa chỉ ≥ 10 ký tự, số dương)
- [ ] `constants`: nhãn + màu trạng thái đơn, quy tắc chuyển trạng thái hợp lệ

**Kiểm chứng**
- [ ] `npm run lint` và `npm run build` không lỗi
- [ ] Commit: `feat(frontend): nền tảng, services, store, utils`

## Phase 2 – Component dùng chung & Layout

**UI (`src/components/ui/`)**
- [ ] Button (primary/secondary/outline/ghost/danger × sm/md/lg × loading/disabled)
- [ ] Input, Textarea, Select (nhãn, lỗi, `aria-invalid`, `aria-describedby`)
- [ ] QuantityStepper (min 1, max tồn kho)
- [ ] Badge, OrderBadge (5 trạng thái)
- [ ] Toast + ToastContainer
- [ ] Modal, ConfirmDialog (Esc, bẫy focus, khóa cuộn nền)
- [ ] Drawer (mobile)
- [ ] Table (loading/empty/error)
- [ ] Pagination
- [ ] Skeleton, ProductCardSkeleton, Spinner
- [ ] EmptyState, ErrorState (nút "Thử lại")

**Layout (`src/components/layout/`, `src/layouts/`)**
- [ ] Navbar: logo, SearchBar, giỏ + badge, menu user, hamburger mobile (NFR-10)
- [ ] Footer
- [ ] `MainLayout` (Navbar + main + Footer + ChatWidget slot)
- [ ] `SidebarAdmin`, Topbar, `AdminLayout` (Drawer dưới `lg`)

**Routing (`src/routes/`)**
- [ ] Định nghĩa toàn bộ route theo sitemap, `React.lazy` + `Suspense` (NFR-02)
- [ ] `ProtectedRoute` theo role (Customer chặn `/admin/*`, chưa đăng nhập → `/login`)
- [ ] Trang 404 và 403

**Kiểm chứng**
- [ ] Kiểm tra layout ở 375 / 768 / 1280px
- [ ] `npm run lint` và `npm run build` không lỗi
- [ ] Commit: `feat(frontend): ui components, layouts, routing`

## Phase 3 – Auth & Hồ sơ

- [ ] Trang Login: validate từng ô, hiện/ẩn mật khẩu, lỗi server (FR-01)
- [ ] Trang Register: Họ tên, Email, Mật khẩu, Xác nhận mật khẩu (FR-01)
- [ ] Lưu JWT, điều hướng theo role (Customer → `/`, Admin → `/admin/products`)
- [ ] Quay lại `/checkout` sau khi đăng nhập nếu bị chuyển hướng từ đó
- [ ] Menu user trên Navbar: Hồ sơ, Đơn hàng của tôi, Quản trị (ADMIN), Đăng xuất
- [ ] Trang Profile: cập nhật họ tên, email; đổi mật khẩu (mục 2.1)
- [ ] Xử lý token hết hạn đúng luồng (NFR-05)
- [ ] Commit: `feat(frontend): xác thực và hồ sơ`

## Phase 4 – Catalog (Trang chủ, Chi tiết)

**Trang chủ `/` (FR-02, mục 2.2)**
- [x] Banner giới thiệu
- [x] ProductCard (ảnh, tên, giá, rating, nút "Thêm vào giỏ hàng", nhãn "Hết hàng")
- [x] Lưới 2/3/4 cột theo breakpoint
- [x] Tìm kiếm theo tên, debounce 300ms
- [x] Lọc theo danh mục (chip)
- [x] Sắp xếp: giá tăng/giảm, tồn kho, đánh giá
- [x] Phân trang
- [x] Đồng bộ `?q=&category=&sort=&page=` lên URL, F5 giữ trạng thái
- [x] Mobile: bộ lọc dạng bottom sheet/drawer
- [x] 3 trạng thái: skeleton, "Không tìm thấy sản phẩm" (+ Xóa bộ lọc), lỗi (+ Thử lại)

**Chi tiết `/products/:id`**
- [x] Breadcrumb, ảnh lớn, tên, rating, giá, tồn kho, mô tả
- [x] Chọn số lượng + thêm giỏ (toast, badge giỏ tăng)
- [x] Biến thể "Hết hàng" (vô hiệu nút + stepper), "Chỉ còn n sản phẩm"
- [x] Trạng thái loading và "Sản phẩm không tồn tại"

**Kiểm chứng**
- [x] Ảnh `loading="lazy"`, ảnh lỗi có fallback
- [x] Commit: `feat(frontend): catalog và chi tiết sản phẩm`

## Phase 5 – Cart, Checkout, Order History

**Giỏ hàng `/cart` (FR-03, mục 2.3)**
- [x] CartItem: thêm, sửa số lượng (1…tồn kho), xóa; tính thành tiền
- [x] CartSummary: tạm tính, tổng tiền; sticky trên desktop, cố định đáy trên mobile
- [x] Toast khi xóa / vượt tồn kho
- [x] Giỏ trống: EmptyState + "Tiếp tục mua sắm"
- [x] Chưa đăng nhập bấm đặt hàng → `/login` rồi quay lại

**Checkout `/checkout` (FR-03)**
- [x] Form Họ tên, SĐT, Địa chỉ + validate
- [x] Phương thức COD cố định
- [x] Tóm tắt đơn hàng
- [x] Nút xác nhận: loading, chống bấm nhiều lần
- [x] Hiển thị lỗi đặt hàng (hết hàng), giữ nguyên dữ liệu đã nhập
- [x] Màn hình "Đặt hàng thành công" (mã đơn, nút "Xem đơn hàng", "Tiếp tục mua sắm"), xóa giỏ
- [x] Giỏ trống vào `/checkout` → chuyển `/cart`

**Lịch sử đơn (mục 2.4)**
- [x] `/orders`: Table (desktop) / thẻ (mobile), OrderBadge, mới nhất trước, trạng thái trống
- [x] `/orders/:id`: thông tin giao hàng, danh sách sản phẩm, tổng tiền, thanh tiến trình trạng thái, khối "Đã hủy"
- [x] Commit: `feat(frontend): giỏ hàng, checkout, lịch sử đơn`

## Phase 6 – Admin

**Quản lý sản phẩm (FR-04)**
- [ ] `/admin/products`: bảng (ảnh, tên, danh mục, giá, tồn kho, Sửa/Xóa), tìm kiếm, phân trang
- [ ] ConfirmDialog khi xóa + toast
- [ ] Cảnh báo tồn kho thấp (≤ 5), badge "Hết hàng"
- [ ] `/admin/products/new` và `/admin/products/:id`: form Tên, Giá, Tồn kho, Danh mục, URL ảnh (xem trước), Mô tả
- [ ] Validate: tên bắt buộc, giá > 0, tồn kho nguyên ≥ 0, URL ảnh hợp lệ

**AI (FR-05, mục 2.6)**
- [ ] Nút "✨ Tạo mô tả bằng AI" với 4 trạng thái: mặc định / đang tạo / có kết quả (sửa được) / lỗi + Thử lại
- [ ] Nút "Tạo dữ liệu mẫu bằng AI" (modal chọn 5/10/20) → tải lại bảng

**Quản lý đơn hàng (FR-06)**
- [ ] `/admin/orders`: bảng đơn, lọc theo trạng thái
- [ ] Dropdown chỉ hiện **bước hợp lệ tiếp theo** (`PENDING→PROCESSING→SHIPPING→COMPLETED`, hoặc `CANCELLED`)
- [ ] ConfirmDialog khi hủy đơn ("Tồn kho sẽ được hoàn lại")
- [ ] Xem chi tiết đơn (modal hoặc trang)
- [ ] Commit: `feat(frontend): trang quản trị`

## Phase 7 – Chatbot AI (mục 2.6)

- [ ] Nút nổi góc phải dưới + panel (desktop popup, mobile gần toàn màn hình)
- [ ] Lời chào + chip gợi ý nhanh
- [ ] Bong bóng chat người dùng / AI, gửi bằng Enter, Shift+Enter xuống dòng
- [ ] Trạng thái "Đang trả lời…" (3 chấm)
- [ ] Card sản phẩm trong câu trả lời → link `/products/:id`
- [ ] Lỗi/timeout: thông báo + nút "Thử lại"
- [ ] Commit: `feat(frontend): chatbot widget`

## Phase 8 – Tối ưu & Docker (chỉ trong `frontend/`)

- [ ] Code splitting / lazy route, rà thư viện nặng (NFR-02: FCP < 2s)
- [ ] Rà responsive 375 / 768 / 1280 toàn bộ trang (NFR-10)
- [ ] Rà `Dockerfile`: multi-stage Node build + Nginx (NFR-07)
- [ ] Rà `nginx.conf`: gzip, cache static, `try_files $uri /index.html`
- [ ] Rà biến môi trường khi build Docker (`VITE_API_URL`)
- [ ] Kiểm tra `docker build` riêng cho frontend (nếu máy có Docker)
- [ ] Thêm lệnh `npm run lint` + `npm run build` ổn định để CI dùng (NFR-08)
- [ ] Commit: `perf(frontend): tối ưu và rà Docker`

## Phase 9 – QA & Hoàn thiện

- [ ] Viết test case thủ công cho từng màn hình (file `frontend/TEST_CASES.md`)
- [ ] Bảng test result, mục tiêu đạt từ 80% trở lên (mục 7 SRS)
- [ ] Test tự động cho phần quan trọng bằng Vitest: `cartStore`, `validators`, `formatCurrency` (nếu kịp)
- [ ] Chạy Lighthouse, ghi FCP vào báo cáo (NFR-02)
- [ ] Test trình duyệt: Chrome, Edge, Firefox, Safari (NFR-11)
- [ ] Rà từng FR/NFR liên quan Frontend so với SRS
- [ ] Chạy checklist nghiệm thu UI (`DESIGN_SPEC.md` mục 14) cho mọi trang
- [ ] Tạo `frontend/README.md`: cách chạy, biến môi trường, tài khoản mock, cách chuyển sang backend thật (`VITE_USE_MOCK=false`)
- [ ] Tổng kết `task.md`
- [ ] Commit: `docs(frontend): test cases, README, tổng kết`

---

## Hợp đồng API giả định (dùng cho mock, cần đối chiếu với Backend)

| Nhóm | Endpoint |
|---|---|
| Auth | `POST /api/auth/register` · `POST /api/auth/login` → `{token, user:{id, fullName, email, role}}` |
| Người dùng | `GET /api/users/me` · `PUT /api/users/me` |
| Danh mục | `GET /api/categories` |
| Sản phẩm | `GET /api/products?q=&categoryId=&sort=&page=&size=` → `{content[], page, totalPages, totalElements}` · `GET /api/products/{id}` |
| Sắp xếp (`sort`) | `price_asc` · `price_desc` · `stock_desc` · `rating_desc` |
| Đơn hàng | `POST /api/orders` `{fullName, phone, address, items:[{productId, quantity}]}` · `GET /api/orders/my` · `GET /api/orders/{id}` |
| Admin | `POST/PUT/DELETE /api/admin/products` · `GET /api/admin/orders` · `PATCH /api/admin/orders/{id}/status` `{status}` |
| AI | `POST /api/admin/ai/description` `{productName}` → `{description}` · `POST /api/admin/ai/mock-products` `{count}` · `POST /api/chat` `{message}` → `{reply, products?[]}` |
| Lỗi chuẩn | `{status, message, errors?:{field: msg}}` |
| Product | `{id, name, description, price, stock, imageUrl, rating, category:{id, name}}` |
| Trạng thái đơn | `PENDING → PROCESSING → SHIPPING → COMPLETED` hoặc `CANCELLED` |

## Quyết định mặc định (SRS còn mơ hồ)

- Đăng nhập bằng **email + mật khẩu** (FR-01; mục 2.1 ghi username, đã chọn theo FR-01).
- Rating chỉ hiển thị và dùng sắp xếp, chưa có chức năng khách đánh giá.
- Ảnh sản phẩm là **URL**, không upload file.
- Giỏ hàng ở client (Zustand + LocalStorage); khách chưa đăng nhập vẫn thêm giỏ, đăng nhập khi checkout.
- Thanh toán chỉ COD.
- Đặt tên: camelCase cho biến/hàm, PascalCase cho component.

---

## Đề xuất cho thành viên khác (việc ngoài `frontend/`, không tự làm)

| File ngoài `frontend/` | Nội dung đề xuất | Lý do |
|---|---|---|
| _(chưa có)_ | | |

## Nhật ký & Vấn đề tồn đọng

| Ngày | Ghi chú |
|---|---|
| | |