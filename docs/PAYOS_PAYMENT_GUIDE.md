# HƯỚNG DẪN TÍCH HỢP & SỬ DỤNG THANH TOÁN ONLINE PAYOS (VIETQR)

> **Dự án:** FunnyShop Fashion  
> **Cổng thanh toán:** PayOS (VietQR / Chuyển khoản ngân hàng 24/7)  
> **Ngày cập nhật:** 16/11/2026  

---

## 1. TỔNG QUAN KIẾN TRÚC

Hệ thống hỗ trợ 2 phương thức thanh toán linh hoạt cho khách hàng:
1. **COD (Cash on Delivery):** Thanh toán bằng tiền mặt khi nhận hàng.
2. **PAYOS (VietQR / Online Banking):** Thanh toán trực tuyến tự động qua cổng PayOS.

### Quy trình thanh toán PayOS:
1. **Khách hàng đặt hàng:** Tại trang Checkout, khách chọn phương thức `Thanh toán online qua PayOS (VietQR)`.
2. **Khởi tạo & Bật Modal Quét mã VietQR:**
   - Hệ thống tạo `Order` trong database với trạng thái `PENDING`, `paymentMethod = "PAYOS"`, `paymentStatus = "PENDING"`.
   - **Bật ngay Modal quét mã VietQR (`PayOSQRModal`)**:
     * Hiển thị mã VietQR chính xác theo thông tin đơn hàng (số tiền, số tài khoản, ngân hàng, tên chủ tài khoản, nội dung chuyển khoản).
     * Có các nút sao chép nhanh (Số tài khoản, Số tiền, Nội dung).
     * Đồng hồ đếm ngược thời hạn thanh toán (15 phút).
     * Radar tự động kiểm tra trạng thái giao dịch mỗi 2.5 giây (`orderApi.getPayOSPaymentStatus`).
3. **Thanh toán:**
   - Khách hàng mở ứng dụng ngân hàng quét mã VietQR hoặc chuyển khoản với nội dung được chỉ định.
   - Hoặc khách hàng có thể bấm nút "Mở trang thanh toán PayOS riêng" nếu muốn thanh toán trên web PayOS.
   - Để hỗ trợ kiểm thử môi trường local dev khi chưa có tiền thật/sandbox, Modal có nút **"🧪 Tôi đã thanh toán (Mô phỏng Test Local)"** để kích hoạt trạng thái thành công ngay lập tức!
4. **Tự động nhận diện & Chuyển tiếp:**
   - Ngay khi nhận được Webhook từ PayOS hoặc xác nhận thanh toán thành công (`paymentStatus === "PAID"`):
   - Modal hiển thị thông báo `✓ Thanh toán thành công!` và **tự động chuyển tiếp** vào màn hình hoàn tất đặt hàng `Đặt hàng thành công!`.
5. **Thanh toán sau:**
   - Nếu khách hàng chọn "Để thanh toán sau", đơn hàng vẫn được lưu lại an toàn. Tại trang **Chi tiết đơn hàng (`OrderDetail`)**, khách hàng chỉ cần bấm nút **"Thanh toán ngay qua PayOS"** để mở lại Modal quét mã QR bất kỳ lúc nào.

---

## 2. CẤU HÌNH BIẾN MÔI TRƯỜNG (ENVIRONMENT VARIABLES)

Để kết nối với tài khoản PayOS thực tế, bạn chỉ cần đăng ký tài khoản tại [my.payos.vn](https://my.payos.vn), tạo một kênh thanh toán và lấy 3 thông số sau điền vào `.env` (hoặc file cấu hình `application.yml`):

```bash
# Cấu hình PayOS
PAYOS_CLIENT_ID=your-payos-client-id
PAYOS_API_KEY=your-payos-api-key
PAYOS_CHECKSUM_KEY=your-payos-checksum-key

# (Tùy chọn) URL chuyển hướng khi hoàn tất / hủy
PAYOS_RETURN_URL=http://localhost:5173/orders/{orderId}?payment=success
PAYOS_CANCEL_URL=http://localhost:5173/orders/{orderId}?payment=cancelled
```

> **Lưu ý về Chế độ mô phỏng (Sandbox Simulation):**  
> Khi đang chạy local dev và chưa nhập các khóa PayOS thực tế (giá trị mặc định `test-client-id`), hệ thống sẽ **tự động kích hoạt chế độ mô phỏng an toàn (fallback simulation)**. Bạn vẫn có thể trải nghiệm toàn bộ luồng tạo đơn, bấm chuyển link và kiểm tra giao diện mà không bị lỗi crash hệ thống.

---

## 3. DANH SÁCH ENDPOINTS API PAYOS ĐÃ TÍCH HỢP

| Phương thức | Đường dẫn API | Phân quyền | Mô tả |
|---|---|---|---|
| `POST` | `/api/v1/orders` | Khách hàng (Auth) | Đặt hàng với `paymentMethod: "PAYOS"`, trả về `paymentUrl` của PayOS |
| `POST` | `/api/v1/orders/{id}/payos-payment-link` | Khách hàng (Auth) | Tạo mới hoặc lấy lại link thanh toán PayOS cho đơn hàng chưa thanh toán |
| `GET` | `/api/v1/orders/{id}/payos-status` | Khách hàng (Auth) | Đồng bộ trạng thái thanh toán đơn hàng từ PayOS |
| `POST` | `/api/v1/payments/payos-webhook` | **Public** (Không cần JWT) | Endpoint nhận webhook real-time từ server PayOS |

---

## 4. HƯỚNG DẪN TEST WEBHOOK TRÊN MÔI TRƯỜNG LOCALHOST

Khi triển khai trên máy tính cá nhân (localhost), PayOS server trên internet không thể gọi trực tiếp tới `http://localhost:8080`. Bạn có thể dùng **Ngrok** để tạo domain public:

```bash
# 1. Chạy ngrok forward cổng backend
ngrok http 8080

# 2. Lấy URL HTTPS được cấp (ví dụ: https://xyz.ngrok-free.app)
# 3. Vào https://my.payos.vn -> Kênh thanh toán -> Cấu hình Webhook URL:
#    https://xyz.ngrok-free.app/api/v1/payments/payos-webhook
```

Ngoài ra, hệ thống đã trang bị tính năng **Tự động đồng bộ khi trở về trang chi tiết đơn hàng (`getPayOSPaymentStatus`)**, do đó ngay cả khi chưa mở Webhook, khách hàng sau khi thanh toán xong quay lại web vẫn được cập nhật trạng thái đơn hàng ngay lập tức!

