# KẾ HOẠCH TRIỂN KHAI CHI TIẾT - GIAI ĐOẠN 4 (PHASE 4)

## DỰ ÁN: FUNNYSHOP (FULL-STACK)
**Chủ đề:** Xuất dữ liệu Đơn hàng và Sản phẩm ra định dạng CSV chuẩn UTF-8 BOM  
**Mã tài liệu:** `docs/PLAN_PHASE_4_CSV_EXPORT.md`  
**Liên kết Kế hoạch tổng thể:** [PLAN.md](file:///d:/thuc_tap/Thuc_Tap_Ki_IV/PLAN.md) | [PLAN_NEW_FEATURES.md](file:///d:/thuc_tap/Thuc_Tap_Ki_IV/docs/PLAN_NEW_FEATURES.md)  
**Công nghệ:** Spring Boot 3, StreamingResponseBody, UTF-8 BOM (RFC 4180), React 19, Axios Blob Download, Lucide Icons  

---

## I. MỤC TIÊU & QUY CHUẨN KỸ THUẬT

### 1. Mục tiêu cốt lõi
1. **Hỗ trợ quản trị viên:** Cho phép Admin tải về dữ liệu báo cáo danh sách **Đơn hàng** và **Sản phẩm** dưới định dạng CSV chỉ với 1 click, phục vụ phân tích nghiệp vụ, kế toán hoặc lưu trữ ngoại tuyến.
2. **Tuân thủ bộ lọc:** Tự động áp dụng các điều kiện tìm kiếm, trạng thái, danh mục hiện tại trên giao diện vào file xuất ra.
3. **Hiệu năng & Tiết kiệm bộ nhớ (Streaming Response):** Ghi dữ liệu trực tiếp theo luồng (`StreamingResponseBody` / `Writer`) ra HTTP response, không nạp toàn bộ danh sách lớn vào bộ nhớ RAM của server nhằm triệt tiêu nguy cơ `OutOfMemoryError`.

### 2. Quy chuẩn Kỹ thuật CSV (RFC 4180 & Microsoft Excel Compatibility)
* **Khắc phục triệt để lỗi vỡ font tiếng Việt trong Excel:**
  - Phần lớn Microsoft Excel trên Windows khi mở file `.csv` mặc định sử dụng bảng mã ANSI/Windows-1252 thay vì UTF-8, khiến các chữ cái tiếng Việt có dấu (`Đơn hàng`, `Áo sơ mi`, `Nguyễn Văn A`...) bị hiển thị thành ký tự rác.
  - **Giải pháp bắt buộc:** Ghi 3 bytes Byte Order Mark (BOM `\uFEFF` / `0xEF, 0xBB, 0xBF`) vào đầu luồng dữ liệu trước khi ghi bất kỳ header hoặc dòng dữ liệu nào.
* **Quy tắc Escape chuỗi theo chuẩn RFC 4180:**
  - Nếu trường dữ liệu chứa dấu phẩy (`,`), dấu nháy kép (`"`), hoặc ký tự xuống dòng (`\r`, `\n`), trường đó bắt buộc phải được bao bọc trong cặp dấu nháy kép: `"giá trị"`.
  - Mọi dấu nháy kép bên trong giá trị phải được nhân đôi: `"` $\rightarrow$ `""`.
* **Tiêu đề tệp tin (Content-Disposition):**
  - Tự động đặt tên tệp tin kèm dấu thời gian:
    - Đơn hàng: `don_hang_funnyshop_yyyyMMdd_HHmmss.csv`
    - Sản phẩm: `san_pham_funnyshop_yyyyMMdd_HHmmss.csv`

---

## II. THIẾT KẾ CẤU TRÚC DỮ LIỆU FILE CSV

### 1. File Xuất Đơn hàng (`don_hang_funnyshop_*.csv`)
Bao gồm 12 cột thông tin toàn diện về đơn hàng, thông tin khách, chi tiết mặt hàng và chiết khấu voucher:

| STT | Tên cột Header (Tiếng Việt) | Nguồn dữ liệu | Ví dụ minh họa |
|---|---|---|---|
| 1 | `Mã đơn hàng` | `order.id` | `#1024` |
| 2 | `Ngày đặt hàng` | `order.createdAt` | `2026-11-16 14:30:25` |
| 3 | `Tên khách hàng` | `order.customerName` | `Nguyễn Văn An` |
| 4 | `Số điện thoại` | `order.phone` | `0912345678` |
| 5 | `Địa chỉ nhận hàng` | `order.shippingAddress` | `"123 Cầu Giấy, Hà Nội"` |
| 6 | `Phương thức thanh toán`| `order.paymentMethod` | `COD` |
| 7 | `Trạng thái đơn hàng` | `order.status` (Localized)| `Đang giao hàng` |
| 8 | `Danh sách sản phẩm` | Tổng hợp `orderItems` | `"Áo Polo (Đen-L) x2; Sơ mi Oxford (Trắng-M) x1"` |
| 9 | `Tạm tính (VNĐ)` | `order.subtotalAmount` | `1020000` |
| 10| `Mã Voucher` | `order.voucherCode` | `WELCOME50K` |
| 11| `Tiền giảm giá (VNĐ)` | `order.discountAmount` | `50000` |
| 12| `Tổng thanh toán (VNĐ)`| `order.totalAmount` | `970000` |

### 2. File Xuất Sản phẩm & Biến thể (`san_pham_funnyshop_*.csv`)
Xuất chi tiết từng biến thể sản phẩm (SKU) để hỗ trợ kiểm kê kho chính xác:

| STT | Tên cột Header (Tiếng Việt) | Nguồn dữ liệu | Ví dụ minh họa |
|---|---|---|---|
| 1 | `ID Sản phẩm` | `product.id` | `1` |
| 2 | `Tên sản phẩm` | `product.name` | `Áo Polo Nam Classic Fit` |
| 3 | `Danh mục` | `category.name` | `Thời trang Nam` |
| 4 | `Thương hiệu` | `product.brand` | `FunnyStyle` |
| 5 | `Chất liệu` | `product.material` | `Cotton 100%` |
| 6 | `Đối tượng` | `product.genderType` | `MEN` |
| 7 | `Mã SKU biến thể` | `variant.sku` | `POLO-BLK-M` |
| 8 | `Màu sắc` | `variant.color` | `Black` |
| 9 | `Kích cỡ` | `variant.size` | `M` |
| 10| `Giá bán (VNĐ)` | `variant.price` | `320000` |
| 11| `Tồn kho (Chiếc)` | `variant.stockQuantity`| `25` |
| 12| `Trạng thái kinh doanh`| `product.isDeleted` | `Đang bán` |
| 13| `Ngày tạo` | `product.createdAt` | `2026-11-10 09:15:00` |

---

## III. THIẾT KẾ BACKEND (SPRING BOOT 3)

### 1. Phân cấp Cấu trúc Lớp (Package Architecture)
```
backend/src/main/java/com/funnyshop/
├── util/
│   └── CsvExportUtil.java             # Helper ghi BOM, format tiền/ngày, escape ký tự đặc biệt RFC 4180
├── repository/
│   ├── OrderRepository.java           # Bổ sung query tìm kiếm đơn hàng phục vụ export
│   └── ProductRepository.java         # Bổ sung query tìm kiếm sản phẩm và biến thể phục vụ export
├── service/
│   ├── CsvExportService.java          # Interface nghiệp vụ xuất CSV
│   └── impl/
│       └── CsvExportServiceImpl.java  # Triển khai stream dữ liệu ra Writer
└── controller/
    └── admin/
        ├── AdminOrderController.java  # Bổ sung GET /api/v1/admin/orders/export/csv
        └── AdminProductController.java# Bổ sung GET /api/v1/admin/products/export/csv
```

### 2. Chi tiết Lớp Tiện ích `CsvExportUtil.java`
```java
public class CsvExportUtil {
    // 3 bytes UTF-8 BOM
    public static final String UTF8_BOM = "\uFEFF";

    public static String escape(Object value) {
        if (value == null) return "";
        String str = String.valueOf(value);
        if (str.contains(",") || str.contains("\"") || str.contains("\n") || str.contains("\r")) {
            return "\"" + str.replace("\"", "\"\"") + "\"";
        }
        return str;
    }

    public static void writeRow(Writer writer, Object... values) throws IOException {
        StringBuilder sb = new StringBuilder();
        for (int i = 0; i < values.length; i++) {
            if (i > 0) sb.append(",");
            sb.append(escape(values[i]));
        }
        sb.append("\r\n");
        writer.write(sb.toString());
    }
}
```

### 3. API Endpoints
| Method | Endpoint | Quyền hạn | Tham số truy vấn (Query Params) | Định dạng trả về |
|---|---|---|---|---|
| `GET` | `/api/v1/admin/orders/export/csv` | `ROLE_ADMIN` | `search` (tên/sđt/mã), `status` (PENDING, SHIPPING...), `startDate`, `endDate` | File stream `.csv` (`text/csv; charset=UTF-8`) |
| `GET` | `/api/v1/admin/products/export/csv`| `ROLE_ADMIN` | `keyword`, `categoryId`, `isDeleted` | File stream `.csv` (`text/csv; charset=UTF-8`) |

---

## IV. THIẾT KẾ FRONTEND (REACT & VITE)

### 1. Phân rã Component & Tiện ích
```
frontend/src/
├── api/
│   └── admin.js                       # Bổ sung hàm exportOrdersCsv, exportProductsCsv (responseType: 'blob')
├── utils/
│   └── downloadFile.js                # Helper tạo thẻ <a> ảo để trigger browser download từ Blob
└── pages/
    └── admin/
        ├── AdminOrders.jsx            # Bổ sung nút [📥 Xuất CSV Đơn hàng]
        └── AdminProducts.jsx          # Bổ sung nút [📥 Xuất CSV Sản phẩm]
```

### 2. Tiện ích Tải Tệp `downloadFile.js`
```javascript
export function downloadBlob(blobData, defaultFilename) {
  const url = window.URL.createObjectURL(new Blob([blobData]));
  const link = document.createElement('a');
  link.href = url;
  link.setAttribute('download', defaultFilename);
  document.body.appendChild(link);
  link.click();
  link.parentNode.removeChild(link);
  window.URL.revokeObjectURL(url);
}
```

### 3. Giao diện Người dùng
- **Trang Quản lý Đơn hàng (`AdminOrders.jsx`):**
  - Đặt nút **"Xuất CSV"** (Icon `Download`) ở thanh công cụ phía trên danh sách đơn.
  - Khi click: Nút hiển thị spinner "Đang xuất...", tự động truyền bộ lọc `searchQuery` và `statusFilter` hiện tại sang backend.
  - Khi hoàn tất: Trình duyệt tự tải về tệp tin `don_hang_funnyshop_20261116_143025.csv` và thông báo toast thành công.
- **Trang Quản lý Sản phẩm (`AdminProducts.jsx`):**
  - Đặt nút **"Xuất CSV"** (Icon `Download`) cạnh nút "Tạo dữ liệu mẫu AI" và "+ Thêm sản phẩm".
  - Khi click: Gửi kèm `searchQuery`, `selectedCategory` hiện tại để trích xuất danh sách sản phẩm.

---

## V. KỊCH BẢN KIỂM THỬ (TEST PLAN & ACCEPTANCE CRITERIA)

| Mã kiểm thử | Tình huống thử nghiệm | Kết quả mong đợi |
|---|---|---|
| **TC-CSV01** | Xuất CSV đơn hàng và mở bằng Microsoft Excel trên Windows | Hiển thị tiếng Việt hoàn toàn đúng chính tả, không bị lỗi font (nhờ UTF-8 BOM `\uFEFF`) |
| **TC-CSV02** | Khách hàng có địa chỉ chứa dấu phẩy `,` và dấu ngoặc kép `"` | Dữ liệu được escape chuẩn RFC 4180 trong file CSV, không làm nhảy cột trong Excel |
| **TC-CSV03** | Lọc trạng thái `PENDING` rồi bấm "Xuất CSV" | Tệp CSV tải về chỉ chứa các đơn hàng ở trạng thái `PENDING` |
| **TC-CSV04** | Đơn hàng có áp dụng mã Voucher | File CSV ghi nhận chính xác: `Tiền tạm tính`, `Mã Voucher`, `Tiền giảm giá`, `Tổng thanh toán` |
| **TC-CSV05** | Xuất CSV sản phẩm | Liệt kê chi tiết từng dòng biến thể: SKU, Màu sắc, Kích cỡ, Giá bán, Tồn kho, Trạng thái kinh doanh |
| **TC-CSV06** | Tên tệp tin tải về | Tự động sinh tên chuẩn có timestamp: `don_hang_funnyshop_YYYYMMDD_HHmmss.csv` |

---

## VI. KẾ HOẠCH TRIỂN KHAI THEO TỪNG BƯỚC (STEP-BY-STEP CHECKLIST)

### Bước 1: Backend Core CSV Export
- [ ] 1.1. Tạo lớp tiện ích `com.funnyshop.util.CsvExportUtil.java`.
- [ ] 1.2. Viết unit test cho `CsvExportUtilTest.java` (kiểm tra escape, BOM, format).
- [ ] 1.3. Cập nhật `OrderRepository.java` bổ sung query lấy dữ liệu đơn hàng kèm chi tiết (fetch join) phục vụ export.
- [ ] 1.4. Cập nhật `ProductRepository.java` bổ sung query lấy dữ liệu sản phẩm kèm biến thể (fetch join) phục vụ export.

### Bước 2: Backend Service & Controllers
- [ ] 2.1. Tạo interface `CsvExportService.java` và triển khai `CsvExportServiceImpl.java`.
- [ ] 2.2. Thêm endpoint xuất CSV trong `AdminOrderController.java` (`GET /api/v1/admin/orders/export/csv`).
- [ ] 2.3. Thêm endpoint xuất CSV trong `AdminProductController.java` (`GET /api/v1/admin/products/export/csv`).
- [ ] 2.4. Kiểm tra biên dịch backend và chạy test tự động.

### Bước 3: Frontend API & Client Integration
- [ ] 3.1. Tạo tiện ích tải file `frontend/src/utils/downloadFile.js`.
- [ ] 3.2. Bổ sung các hàm gọi API xuất CSV vào `frontend/src/api/admin.js`.
- [ ] 3.3. Tích hợp nút **"Xuất CSV"** vào `frontend/src/pages/admin/AdminOrders.jsx`.
- [ ] 3.4. Tích hợp nút **"Xuất CSV"** vào `frontend/src/pages/admin/AdminProducts.jsx`.
- [ ] 3.5. Chạy `npm run lint` & `npm run build` trên frontend.

### Bước 4: Kiểm thử E2E & Đóng gói
- [ ] 4.1. Kiểm thử tải file CSV từ cả 2 trang quản trị trên trình duyệt.
- [ ] 4.2. Mở file CSV kiểm tra định dạng cột và tính đúng đắn font tiếng Việt.
- [ ] 4.3. Cập nhật trạng thái hoàn thành Phase 4 vào `PLAN.md`.

