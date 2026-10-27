# ĐẶC TẢ YÊU CẦU DỰ ÁN (SRS) – E-Commerce FunnyShop (MVP)

| Thông tin | Chi tiết |
|---|---|
| **Mã dự án** | PRJ-QUICK-REVIEW-PRE-OJT-01 |
| **Tên dự án** | E-Commerce FunnyShop (MVP) |
| **Thời gian phát triển** | 4 tuần (Sprint 7 ngày) |

---

## 1. Tổng quan Dự án (Project Overview)

### 1.1. Mục đích tài liệu

Tài liệu này đặc tả các yêu cầu kỹ thuật và chức năng cho dự án thương mại điện tử tối thiểu khả thi (MVP). Được thiết kế riêng cho chu kỳ phát triển 1 tuần với đội ngũ 4 người, tài liệu định hướng rõ ràng phạm vi công nghệ, cấu trúc hệ thống, API, cũng như quy trình phối hợp DevOps và AI-driven development.

### 1.2. Phân vai nhân sự

**Quy mô nhân sự:** 4–5 thành viên / 1 nhóm

| Thành viên | Vai trò | Nhiệm vụ |
|---|---|---|
| **Member 1** | Team Lead / AI Integrator | Quản lý chung, tích hợp tính năng AI chatbot hỗ trợ hỏi đáp với người dùng (Spring AI + Chat Model). |
| **Member 2 & 3** | Full-stack Developers | **Backend:** Xây dựng kiến trúc Spring Boot, thiết kế Database, phát triển toàn bộ REST API (Auth, Product, Order, Admin).<br>**Frontend:** Dựng giao diện bằng ReactJS + Tailwind CSS, xử lý State (Zustand), tích hợp API và tối ưu UI/UX. |
| **Member 4** | QA / Tester / DevOps | Kiểm thử End-to-End (E2E), viết test case. Thiết lập Docker, Docker Compose, cấu hình GitHub Actions (CI/CD) và hỗ trợ deploy hệ thống. |

---

## 2. Phạm vi tính năng (1 tuần / MVP)

> **Lưu ý:** Sinh viên bắt buộc hoàn thành đầy đủ, chạy đúng.

### 2.1. Phân hệ Authentication

- **Đăng ký / Đăng nhập:** Hỗ trợ đăng nhập theo phân quyền (`CUSTOMER`, `ADMIN`) qua username/password.
- **Quản lý hồ sơ cá nhân:** Cho phép người dùng xem và cập nhật thông tin cá nhân trên hệ thống (họ tên, email, mật khẩu, …).

### 2.2. Phân hệ Catalog & Search

- **Catalog:** Xem danh sách sản phẩm, xem chi tiết sản phẩm, sắp xếp theo các tiêu chí (giá, số lượng, đánh giá, …).
- **Search:** Tìm kiếm sản phẩm theo tên, lọc sản phẩm thuộc danh mục.

### 2.3. Phân hệ Cart & Checkout

- Giỏ hàng (Thêm, Sửa số lượng, Xóa).
- Đặt hàng (Checkout) với phương thức COD.

### 2.4. Phân hệ Order History

- Khách hàng xem lại lịch sử đơn hàng cá nhân.

### 2.5. Phân hệ Admin Dashboard

- CRUD sản phẩm.
- Quản lý và cập nhật trạng thái đơn hàng.

### 2.6. Phân hệ AI Integration

- AI tự động sinh mô tả sản phẩm và hỗ trợ tạo mock data.
- AI chatbot hỗ trợ người dùng tìm kiếm thông tin sản phẩm.

---

## 3. Yêu cầu kỹ thuật bắt buộc

### 3.1. Sơ đồ Tech Stack

| Tầng | Công nghệ |
|---|---|
| **Frontend** | ReactJS (Vite + Tailwind CSS) |
| **Backend** | Spring Boot (Java), MySQL |
| **DevOps** | Docker, GitHub Actions (CI/CD) |

**Sơ đồ tổng quát (dạng text):**

```
                       ┌──────────────────────────┐
                       │   Người dùng (Browser)   │
                       │ CUSTOMER / ADMIN         │
                       └────────────┬─────────────┘
                                    │ HTTP
                                    ▼
 ┌──────────────────────────────────────────────────────────────┐
 │                     Docker Compose                           │
 │                                                              │
 │  ┌─────────────────────┐        ┌─────────────────────────┐  │
 │  │  Frontend Container │        │   Backend Container     │  │
 │  │  ReactJS + Vite     │  REST  │   Spring Boot (Java)    │  │
 │  │  Tailwind CSS       │ ─────► │   Gradle + OpenJDK      │  │
 │  │  Zustand            │  JWT   │   Spring Security (JWT) │  │
 │  │  Nginx (static)     │        │   Logback / SLF4J       │  │
 │  └─────────────────────┘        └───────┬────────┬────────┘  │
 │                                         │        │           │
 │                                   JDBC  │        │ Spring AI │
 │                                         ▼        ▼           │
 │                              ┌───────────────┐  ┌──────────┐ │
 │                              │ MySQL         │  │ AI Chat  │ │
 │                              │ Container     │  │ Model    │ │
 │                              └───────────────┘  └──────────┘ │
 └──────────────────────────────────────────────────────────────┘
                                    ▲
                                    │ build & push image
                       ┌────────────┴─────────────┐
                       │  GitHub Actions (CI/CD)  │
                       │  → Docker Registry       │
                       └──────────────────────────┘
```

### 3.2. Cấu hình Docker & Docker Compose

Hệ thống sử dụng Docker để đồng bộ hóa môi trường chạy giữa các thành viên:

| Service | Mô tả |
|---|---|
| **MySQL Service** | Khởi tạo database tự động với biến môi trường chuẩn. |
| **Backend Service** | Build từ Dockerfile sử dụng OpenJDK + Gradle. |
| **Frontend Service** | Build từ Dockerfile (Multi-stage build: Node.js build static files kết hợp Nginx). |

### 3.3. Quy trình CI/CD (GitHub Actions)

- **Nhánh chính:** `main` (Production) và `dev` (Tích hợp).
- Mỗi khi có lệnh `git push` lên nhánh `main`, GitHub Actions tự động:
    1. Kiểm tra build code (Gradle build & Vite build).
    2. Chạy kiểm thử tự động cơ bản.
    3. Đóng gói và đẩy Docker Image lên Registry.

**Luồng CI/CD (dạng text):**

```
 feature/* ──► dev ──► main
                         │ git push
                         ▼
              ┌─────────────────────┐
              │   GitHub Actions    │
              └──────────┬──────────┘
                         ▼
              ┌─────────────────────┐
              │ 1. Build            │
              │    Gradle + Vite    │
              └──────────┬──────────┘
                         ▼
              ┌─────────────────────┐
              │ 2. Run basic tests  │
              └──────────┬──────────┘
                         ▼
              ┌─────────────────────┐
              │ 3. Build & push     │
              │    Docker images    │──► Registry
              └─────────────────────┘
```

---

## 4. Yêu cầu chức năng (Functional Requirements)

### 4.1. Phân hệ Khách hàng & Mua sắm

| Mã | Tên | Mô tả |
|---|---|---|
| **FR-01** | Đăng ký / Đăng nhập | Người dùng nhập Email, Mật khẩu để đăng ký. Hệ thống mã hóa mật khẩu bằng BCrypt và trả về JWT Token khi đăng nhập thành công. |
| **FR-02** | Danh mục sản phẩm | Hiển thị danh sách sản phẩm dạng lưới (Grid) gồm: Ảnh, Tên, Giá, và nút "Thêm vào giỏ hàng". Hỗ trợ thanh tìm kiếm theo từ khóa. |
| **FR-03** | Giỏ hàng & Đặt hàng | - Lưu trữ giỏ hàng ở Client (Zustand / LocalStorage).<br>- Trang Checkout yêu cầu nhập: Họ tên, Số điện thoại, Địa chỉ giao hàng.<br>- Khi xác nhận đặt hàng, hệ thống trừ số lượng tồn kho (stock) tương ứng trong DB và tạo mới bản ghi đơn hàng với trạng thái `PENDING`. |

### 4.2. Phân hệ Quản trị (Admin)

| Mã | Tên | Mô tả |
|---|---|---|
| **FR-04** | Quản lý sản phẩm (CRUD) | Admin có quyền thêm mới, chỉnh sửa hoặc xóa sản phẩm. |
| **FR-05** | AI Description Generator | Tại màn hình thêm/sửa sản phẩm của Admin, tích hợp nút gọi AI để tự động tạo đoạn mô tả sản phẩm chuẩn SEO dựa trên tên sản phẩm. |
| **FR-06** | Quản lý đơn hàng | Admin xem toàn bộ danh sách đơn hàng và cập nhật trạng thái đơn hàng qua các bước như sơ đồ bên dưới. |

**Vòng đời trạng thái đơn hàng (FR-06):**

```
 PENDING ──► PROCESSING ──► SHIPPING ──► COMPLETED
    │             │             │
    └─────────────┴─────────────┴──────► CANCELLED
```

---

## 5. Yêu cầu phi chức năng (Non-Functional Requirements)

### 5.1. Hiệu năng & Khả năng chịu tải (Performance)

| Mã | Tên | Mô tả |
|---|---|---|
| **NFR-01** | Thời gian phản hồi API | Các API truy vấn danh sách sản phẩm, chi tiết sản phẩm và giỏ hàng phải phản hồi dưới **500ms** trong điều kiện mạng nội bộ hoặc cloud chuẩn. |
| **NFR-02** | Tải trang Frontend | Thời gian tải trang ban đầu (First Contentful Paint) của ứng dụng ReactJS sử dụng Vite phải dưới **2 giây**. |
| **NFR-03** | Tải đồng thời (Concurrent Users) | Hệ thống được cấu hình qua Docker chịu được tối thiểu **50 request đồng thời** mà không bị sập hay tràn bộ nhớ (Out of Memory). |

### 5.2. Bảo mật (Security)

| Mã | Tên | Mô tả |
|---|---|---|
| **NFR-04** | Mã hóa mật khẩu | Mật khẩu người dùng bắt buộc phải được mã hóa một chiều bằng thuật toán BCrypt trước khi lưu trữ vào cơ sở dữ liệu MySQL. |
| **NFR-05** | Xác thực & Phân quyền | Toàn bộ các API nhạy cảm (như đặt hàng, quản lý admin) phải được bảo vệ bằng JWT (JSON Web Token). Token phải có cơ chế hết hạn (Expiration time) rõ ràng. |
| **NFR-06** | CORS Configuration | Cấu hình CORS chặt chẽ ở phía Spring Boot Backend để chỉ cho phép nguồn từ Frontend (ReactJS) gọi API, tránh các cuộc tấn công Cross-Origin trái phép. |

### 5.3. Khả năng bảo trì & Phát triển (Maintainability & Scalability)

| Mã | Tên | Mô tả |
|---|---|---|
| **NFR-07** | Container hóa | 100% các thành phần của hệ thống (Frontend, Backend, Database) phải được đóng gói bằng Docker để đảm bảo tính nhất quán giữa môi trường Local của 6 thành viên và môi trường Production. |
| **NFR-08** | Tự động hóa CI/CD | Mọi thay đổi code khi đẩy (`git push`) lên nhánh chính phải thông qua quy trình build tự động bằng GitHub Actions nhằm phát hiện lỗi biên dịch ngay lập tức. |
| **NFR-09** | Clean Code & Logging | Code phải tuân thủ các quy tắc đặt tên chuẩn (CamelCase cho Java/JS, snake_case cho database). Backend phải tích hợp Logback/SLF4J để ghi nhận các lỗi quan trọng (Exception logging) phục vụ việc debug trong 1 tuần chạy nước rút. |

### 5.4. Trải nghiệm người dùng & Giao diện (UI/UX & Compatibility)

| Mã | Tên | Mô tả |
|---|---|---|
| **NFR-10** | Responsive Design | Giao diện Frontend được thiết kế bằng Tailwind CSS phải tương thích mượt mà trên cả thiết bị di động (Mobile), máy tính bảng (Tablet) và máy tính để bàn (Desktop). |
| **NFR-11** | Khả năng tương thích trình duyệt | Ứng dụng phải hoạt động ổn định trên các trình duyệt hiện đại phổ biến như Google Chrome, Microsoft Edge, Safari và Firefox. |

---

