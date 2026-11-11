# TIÊU CHUẨN KỸ THUẬT & API QUẢN LÝ SẢN PHẨM ADMIN (FUNNYSHOP)
> **Dành cho Frontend Developer**  
> **Cập nhật:** Chuẩn hóa vòng đời độc lập giữa **Sản phẩm gốc (Base Product)**, **Biến thể (Product Variant)** và **Hình ảnh (Product Image)** theo chuẩn RESTful & Cascade Soft-delete.

---

## 1. TỔNG QUAN VÀ MỤC TIÊU CHUẨN HÓA

Trước đây, hệ thống Admin quản lý sản phẩm dưới dạng monolithic (gộp chung thông tin mô tả, giá, tồn kho và 1 ảnh đại diện duy nhất). Quy chuẩn mới bóc tách toàn diện 3 thực thể với vòng đời độc lập:

```
┌─────────────────────────────────────────────────────────────┐
│                 1. SẢN PHẨM GỐC (Base Product)               │
│  - Tên, Mô tả, Danh mục (categoryId)                        │
│  - Thuộc tính thời trang: brand, material, genderType       │
│  - Trạng thái: isDeleted (Xóa mềm toàn bộ sản phẩm)         │
└──────────────┬───────────────────────────────┬──────────────┘
               │ 1 - N                         │ 1 - N
               ▼                               ▼
┌──────────────────────────────┐ ┌─────────────────────────────┐
│ 2. BIẾN THỂ (ProductVariant)  │ │   3. HÌNH ẢNH (ProductImage) │
│ - Phân loại: color, size     │ │ - Thư viện ảnh: imageUrl     │
│ - Định danh kho: sku         │ │ - Ảnh đại diện: isPrimary    │
│ - Giá bán: price             │ │ - Gắn theo biến thể màu:     │
│ - Tồn kho: stockQuantity     │ │   variantId (tùy chọn)       │
│ - Trạng thái: isDeleted      │ │ - Trạng thái: Xóa vĩnh viễn  │
└──────────────────────────────┘ └─────────────────────────────┘
```

---

## 2. QUY CHUẨN KỸ THUẬT CHUNG

| Hạng mục | Quy chuẩn phía Backend | Lưu ý phía Frontend |
|---|---|---|
| **Prefix Endpoint** | Hỗ trợ song song `/api/v1/admin/...` và `/api/admin/...` | Luôn sử dụng `/api/v1/admin/...` cho toàn bộ lời gọi mới |
| **Response Wrapper** | `ApiResponse<T>`: `{ code, message, data }` | Đọc dữ liệu từ `res.data` (hoặc `res.data.data` tùy Axios interceptor) |
| **Trạng thái xóa mềm** | Cột `isDeleted` kiểu `BOOLEAN` (`false` = Đang bán, `true` = Đã ẩn) | Không dùng enum status (`ACTIVE`/`INACTIVE`). Hiển thị badge trực quan |
| **Phân quyền** | `@PreAuthorize("hasRole('ADMIN')")` | Header bắt buộc: `Authorization: Bearer <accessToken>` |
| **Hình ảnh** | `imageUrl` dạng chuỗi URL (CDN / Unsplash / Cloud) | Nhập link ảnh trực tiếp; chưa cần gửi FormData/Multipart |

---

## 3. DANH SÁCH CHI TIẾT BỘ API DÀNH CHO ADMIN

### PHẦN A: QUẢN LÝ SẢN PHẨM GỐC (BASE PRODUCT)

#### 1. Tạo mới sản phẩm gốc
- **Method:** `POST`
- **Path:** `/api/v1/admin/products`
- **Request Body (`ProductCreateRequest`):**
  ```json
  {
    "name": "Áo Sơ Mi Nam Oxford Cao Cấp",
    "description": "Chất liệu vải Oxford dày dặn, đứng form và thoáng khí",
    "brand": "FunnyStyle",
    "material": "Oxford Premium 100%",
    "genderType": "MEN",
    "categoryId": 1
  }
  ```
  *(Enum `genderType`: `MEN` | `WOMEN` | `UNISEX`)*
- **Tương thích ngược (Backward Compatibility):** Nếu client cũ vẫn gửi kèm `price`, `stockQuantity`, `imageUrl`, backend sẽ tự động tạo 1 biến thể và 1 ảnh mặc định.
- **Response:** `201 Created`
  ```json
  {
    "code": 201,
    "message": "Thêm mới sản phẩm gốc thành công!",
    "data": {
      "id": 10,
      "name": "Áo Sơ Mi Nam Oxford Cao Cấp",
      "description": "...",
      "brand": "FunnyStyle",
      "material": "Oxford Premium 100%",
      "genderType": "MEN",
      "categoryId": 1,
      "isDeleted": false,
      "variants": [],
      "images": []
    }
  }
  ```

#### 2. Cập nhật thông tin sản phẩm gốc
- **Method:** `PUT`
- **Path:** `/api/v1/admin/products/{id}`
- **Request Body (`ProductUpdateRequest`):**
  ```json
  {
    "name": "Áo Sơ Mi Nam Oxford Dài Tay Form Rộng",
    "description": "Mô tả cập nhật mới...",
    "brand": "FunnyStyle",
    "material": "Oxford Cotton 100%",
    "genderType": "MEN",
    "categoryId": 1
  }
  ```
- **Response:** `200 OK` + `ProductResponse` cập nhật.

#### 3. Xóa mềm toàn bộ sản phẩm (Cascade Soft-delete)
- **Method:** `DELETE`
- **Path:** `/api/v1/admin/products/{id}`
- **Nghiệp vụ:** 
  - `product.isDeleted = true`
  - Tự động cascade: Đánh dấu `isDeleted = true` cho **toàn bộ** các biến thể thuộc sản phẩm này.
- **Response:** `200 OK`
  ```json
  {
    "code": 200,
    "message": "Ẩn sản phẩm và toàn bộ các biến thể thành công!"
  }
  ```

#### 4. Khôi phục sản phẩm gốc (Cascade Restore)
- **Method:** `PATCH`
- **Path:** `/api/v1/admin/products/{id}/restore`
- **Nghiệp vụ:** 
  - `product.isDeleted = false`
  - Tự động cascade: Đánh dấu `isDeleted = false` cho **toàn bộ** các biến thể thuộc sản phẩm này.
- **Response:** `200 OK` + `ProductResponse` đã phục hồi.

---

### PHẦN B: QUẢN LÝ BIẾN THỂ (PRODUCT VARIANTS)

Nơi Admin thiết lập bảng phân loại Màu sắc, Kích cỡ, Giá bán và Tồn kho riêng cho từng SKU.

#### 1. Thêm biến thể cho sản phẩm
- **Method:** `POST`
- **Path:** `/api/v1/admin/products/{productId}/variants`
- **Request Body (`ProductVariantCreateRequest`):**
  ```json
  {
    "sku": "SOMI-OXF-WHT-L",
    "color": "White",
    "size": "L",
    "price": 380000.00,
    "stockQuantity": 50
  }
  ```
- **Ràng buộc Validation FE cần lưu ý:**
  - `color`: Bắt buộc, không được để trống.
  - `size`: Bắt buộc, không được để trống.
  - `sku`: Bắt buộc, không trùng lặp trong toàn hệ thống.
  - `price`: Số dương $\ge 0.0$.
  - `stockQuantity`: Số nguyên $\ge 0$.
- **Response:** `201 Created` + `ProductVariantResponse`.

#### 2. Cập nhật biến thể (Sửa giá, nhập thêm kho, đổi mã)
- **Method:** `PUT`
- **Path:** `/api/v1/admin/variants/{variantId}`
- **Request Body (`ProductVariantUpdateRequest`):**
  ```json
  {
    "sku": "SOMI-OXF-WHT-L",
    "color": "White",
    "size": "L",
    "price": 395000.00,
    "stockQuantity": 80
  }
  ```
- **Response:** `200 OK` + `ProductVariantResponse`.

#### 3. Xóa mềm một biến thể riêng lẻ (Ngừng kinh doanh size/màu đó)
- **Method:** `DELETE`
- **Path:** `/api/v1/admin/variants/{variantId}`
- **Nghiệp vụ:** Chỉ biến thể này bị chuyển `isDeleted = true`. Sản phẩm gốc và các biến thể khác vẫn hoạt động bình thường.
- **Response:** `200 OK`
  ```json
  {
    "code": 200,
    "message": "Đã ngừng kinh doanh biến thể này!"
  }
  ```

#### 4. Khôi phục một biến thể riêng lẻ
- **Method:** `PATCH`
- **Path:** `/api/v1/admin/variants/{variantId}/restore`
- **Response:** `200 OK` + `ProductVariantResponse` (`isDeleted = false`).

---

### PHẦN C: QUẢN LÝ HÌNH ẢNH (PRODUCT IMAGES)

Nơi Admin quản lý gallery ảnh, chọn ảnh bìa đại diện (`isPrimary`) và gắn ảnh theo biến thể màu.

#### 1. Thêm ảnh vào thư viện sản phẩm
- **Method:** `POST`
- **Path:** `/api/v1/admin/products/{productId}/images`
- **Request Body (`ProductImageCreateRequest`):**
  ```json
  {
    "imageUrl": "https://images.unsplash.com/photo-1596755094514-f87e34085b2c?w=800",
    "isPrimary": true,
    "variantId": 5
  }
  ```
  *(Lưu ý: `variantId` là tùy chọn; nếu truyền thì khi khách bấm chọn màu của biến thể này trên giao diện, ảnh lớn sẽ tự chuyển sang ảnh tương ứng).*
- **Quy tắc Single Primary:** Nếu `isPrimary = true`, backend tự động chuyển tất cả các ảnh khác của sản phẩm đó về `isPrimary = false`.
- **Response:** `201 Created` + `ProductImageResponse`.

#### 2. Đặt làm ảnh đại diện chính (Primary Image)
- **Method:** `PATCH`
- **Path:** `/api/v1/admin/images/{imageId}/primary`
- **Nghiệp vụ:** Chuyển ảnh này thành ảnh đại diện chính (`isPrimary = true`), đồng thời hủy cờ chính của tất cả ảnh còn lại.
- **Response:** `200 OK` + `ProductImageResponse`.

#### 3. Xóa một ảnh khỏi thư viện
- **Method:** `DELETE`
- **Path:** `/api/v1/admin/images/{imageId}`
- **Response:** `200 OK`
  ```json
  {
    "code": 200,
    "message": "Xóa ảnh thành công!"
  }
  ```

---

## 4. CẤU TRÚC DTO DỮ LIỆU ĐẦY ĐỦ (UNIFIED PRODUCT DTO)

Khi gọi `GET /api/v1/products/{id}` hoặc `GET /api/v1/admin/products/{id}`, DTO trả về chứa toàn bộ thông tin hợp nhất:

```json
{
  "code": 200,
  "message": "Thành công",
  "data": {
    "id": 2,
    "name": "Áo Sơ Mi Nam Oxford Dài Tay",
    "description": "Áo sơ mi nam chất liệu Oxford dày dặn...",
    "brand": "FunnyStyle",
    "material": "Vải Oxford Premium",
    "genderType": "MEN",
    "isDeleted": false,
    "minPrice": 380000.00,
    "maxPrice": 390000.00,
    "totalStock": 120,
    "imageUrl": "https://images.unsplash.com/photo-1596755094514-f87e34085b2c?w=800",
    "category": {
      "id": 1,
      "name": "Thời trang Nam"
    },
    "variants": [
      {
        "id": 5,
        "productId": 2,
        "sku": "SOMI-WHT-M",
        "color": "White",
        "size": "M",
        "price": 380000.00,
        "stockQuantity": 35,
        "isDeleted": false
      },
      {
        "id": 6,
        "productId": 2,
        "sku": "SOMI-WHT-L",
        "color": "White",
        "size": "L",
        "price": 390000.00,
        "stockQuantity": 40,
        "isDeleted": false
      }
    ],
    "images": [
      {
        "id": 3,
        "productId": 2,
        "variantId": 5,
        "imageUrl": "https://images.unsplash.com/photo-1596755094514-f87e34085b2c?w=800",
        "isPrimary": true
      }
    ]
  }
}
```

---

## 5. HƯỚNG DẪN TÍCH HỢP CODE FRONTEND (`api/admin.js`)

Bổ sung các hàm sau vào module `frontend/src/api/admin.js`:

```javascript
// ── Quản lý Biến thể (Variants) ──────────────────────────────────────────
createVariant: async (productId, variantData) => {
  const res = await apiClient.post(`/api/v1/admin/products/${productId}/variants`, variantData);
  return res?.data !== undefined ? res.data : res;
},

updateVariant: async (variantId, variantData) => {
  const res = await apiClient.put(`/api/v1/admin/variants/${variantId}`, variantData);
  return res?.data !== undefined ? res.data : res;
},

deleteVariant: async (variantId) => {
  const res = await apiClient.delete(`/api/v1/admin/variants/${variantId}`);
  return res?.data !== undefined ? res.data : res;
},

restoreVariant: async (variantId) => {
  const res = await apiClient.patch(`/api/v1/admin/variants/${variantId}/restore`);
  return res?.data !== undefined ? res.data : res;
},

// ── Quản lý Hình ảnh (Images) ────────────────────────────────────────────
addImage: async (productId, imageData) => {
  const res = await apiClient.post(`/api/v1/admin/products/${productId}/images`, imageData);
  return res?.data !== undefined ? res.data : res;
},

setPrimaryImage: async (imageId) => {
  const res = await apiClient.patch(`/api/v1/admin/images/${imageId}/primary`);
  return res?.data !== undefined ? res.data : res;
},

deleteImage: async (imageId) => {
  const res = await apiClient.delete(`/api/v1/admin/images/${imageId}`);
  return res?.data !== undefined ? res.data : res;
},
```

---

## 6. DANH SÁCH TASK CỤ THỂ TRIỂN KHAI CHO FRONTEND (ACTIONABLE TASK BOARD)

Bảng phân rã công việc chi tiết dạng Checklist giúp đội ngũ Frontend triển khai tuần tự, kiểm soát chất lượng và nghiệm thu từng tính năng.

### SƠ ĐỒ TIẾN TRÌNH THỰC HIỆN (EXECUTION WORKFLOW)
```
[Phase 1: API & DTO] ──▶ [Phase 2: Admin List] ──▶ [Phase 3: Base Form] ──▶ [Phase 4: Variants & Images] ──▶ [Phase 5: Storefront Sync & QA]
```

---

### PHẦN 1: TẦNG DỊCH VỤ & API CLIENT (API SERVICE LAYER)

#### 🟩 TASK-FE-01: Bổ sung bộ API Quản lý Biến thể (Variants) [DONE]
- **File thực hiện:** `frontend/src/api/admin.js`
- **Độ ưu tiên:** `P0` (Bắt buộc)
- **Checklist công việc:**
  - [x] Thêm hàm `createVariant(productId, variantData)`: Gọi `POST /api/v1/admin/products/${productId}/variants`.
  - [x] Thêm hàm `updateVariant(variantId, variantData)`: Gọi `PUT /api/v1/admin/variants/${variantId}`.
  - [x] Thêm hàm `deleteVariant(variantId)`: Gọi `DELETE /api/v1/admin/variants/${variantId}`.
  - [x] Thêm hàm `restoreVariant(variantId)`: Gọi `PATCH /api/v1/admin/variants/${variantId}/restore`.
- **Tiêu chuẩn nghiệm thu (DoD):**
  - Nhận và bóc tách đúng định dạng wrapper `ApiResponse<T>`.
  - Bắt lỗi trả về (400 trùng SKU, 404 không tìm thấy sản phẩm/biến thể) và ném thông báo lỗi rõ ràng.

---

#### 🟩 TASK-FE-02: Bổ sung bộ API Quản lý Hình ảnh (Images) [DONE]
- **File thực hiện:** `frontend/src/api/admin.js`
- **Độ ưu tiên:** `P0` (Bắt buộc)
- **Checklist công việc:**
  - [x] Thêm hàm `addImage(productId, imageData)`: Gọi `POST /api/v1/admin/products/${productId}/images` với body `{ imageUrl, isPrimary, variantId }`.
  - [x] Thêm hàm `setPrimaryImage(imageId)`: Gọi `PATCH /api/v1/admin/images/${imageId}/primary`.
  - [x] Thêm hàm `deleteImage(imageId)`: Gọi `DELETE /api/v1/admin/images/${imageId}`.
- **Tiêu chuẩn nghiệm thu (DoD):**
  - Khi `setPrimaryImage` thành công, client cập nhật trạng thái các ảnh khác về `isPrimary = false`.

---

#### 🟩 TASK-FE-03: Chuẩn hóa hàm chuẩn hóa dữ liệu (Normalize Product DTO) [DONE]
- **File thực hiện:** `frontend/src/api/product.js`
- **Độ ưu tiên:** `P1`
- **Checklist công việc:**
  - [x] Cập nhật hàm `normalizeProduct(p)` để bảo toàn các trường: `brand`, `material`, `genderType`, `minPrice`, `maxPrice`, `totalStock`, `isDeleted`.
  - [x] Giữ an toàn cho danh sách `variants: []` và `images: []` (không bị `undefined`).
  - [x] Tính toán fallback: nếu `totalStock` chưa có từ backend thì tự động tính từ tổng `stockQuantity` của các variants còn hoạt động (`!v.isDeleted`).

---

### PHẦN 2: BẢNG DANH SÁCH SẢN PHẨM ADMIN (`AdminProducts.jsx`)

#### 🟩 TASK-FE-04: Cập nhật hiển thị khoảng giá và tổng tồn kho đa biến thể [DONE]
- **File thực hiện:** `frontend/src/pages/admin/AdminProducts.jsx`
- **Độ ưu tiên:** `P1`
- **Checklist công việc:**
  - [x] Cột **Giá bán:** Nếu `minPrice` khác `maxPrice`, hiển thị dạng `Từ 380.000 ₫ - 395.000 ₫`; nếu bằng nhau thì hiển thị 1 mức giá.
  - [x] Cột **Kho hàng:** Hiển thị tổng tồn kho từ `totalStock` kèm số lượng phân loại (ví dụ: `120 (3 biến thể)`).
  - [x] Cảnh báo hết hàng khi `totalStock <= 0` hoặc cảnh báo tồn thấp khi `totalStock <= 10`.

---

#### 🟩 TASK-FE-05: Quản lý trạng thái Xóa mềm (Cascade Soft-delete & Restore) [DONE]
- **File thực hiện:** `frontend/src/pages/admin/AdminProducts.jsx`
- **Độ ưu tiên:** `P0`
- **Checklist công việc:**
  - [x] Cột **Trạng thái:** 
    - `isDeleted === false`: Badge xanh `Đang bán`.
    - `isDeleted === true`: Badge xám `Đã ẩn/Tạm ngừng`.
  - [x] Nút **Ẩn sản phẩm (Xóa mềm):** Gọi `adminApi.deleteProduct(id)`, xác nhận qua Modal Confirm Dialog, cập nhật lại danh sách.
  - [x] Nút **Khôi phục sản phẩm:** Thêm nút Khôi phục cạnh nút Ẩn, gọi `adminApi.restoreProduct(id)` kèm Toast thông báo thành công.
- **Tiêu chuẩn nghiệm thu (DoD):**
  - Khi khôi phục sản phẩm gốc thành công, toàn bộ các biến thể thuộc sản phẩm đó cũng tự động trở lại trạng thái khả dụng.

---

### PHẦN 3: FORM SẢN PHẨM GỐC (`AdminProductForm.jsx` - TAB 1)

#### 🟩 TASK-FE-06: Bổ sung các trường thuộc tính thời trang vào Form gốc [DONE]
- **File thực hiện:** `frontend/src/pages/admin/AdminProductForm.jsx`
- **Độ ưu tiên:** `P0`
- **Checklist công việc:**
  - [x] Thêm ô nhập **Thương hiệu (`brand`)**: Text input (ví dụ: "FunnyStyle").
  - [x] Thêm ô nhập **Chất liệu (`material`)**: Text input (ví dụ: "Vải Oxford Premium").
  - [x] Thêm ô chọn **Đối tượng (`genderType`)**: Select dropdown gồm 3 giá trị:
    - `MEN` (Nam)
    - `WOMEN` (Nữ)
    - `UNISEX` (Mọi giới tính)
  - [x] Giữ nguyên các trường cơ bản: Tên sản phẩm, Mô tả, Danh mục (`categoryId`).
- **Tiêu chuẩn nghiệm thu (DoD):**
  - Validate không để trống Tên, Danh mục, Đối tượng trước khi gửi lên API.

---

#### 🟩 TASK-FE-07: Tách bạch luồng tạo sản phẩm 2 bước (Wizard / Tabbed Form) [DONE]
- **File thực hiện:** `frontend/src/pages/admin/AdminProductForm.jsx`
- **Độ ưu tiên:** `P1`
- **Checklist công việc:**
  - [x] Chia giao diện thành 3 Tabs rõ ràng:
    - **Tab 1: Thông tin chung (Base Product)**
    - **Tab 2: Biến thể & Kho (Variants)**
    - **Tab 3: Thư viện Hình ảnh (Images)**
  - [x] Khi tạo mới sản phẩm (`/admin/products/new`):
    - Khóa Tab 2 và Tab 3; chỉ cho phép điền Tab 1.
    - Bấm "Lưu & Tiếp tục" -> Gọi `POST /api/v1/admin/products` -> Lấy `id` sản phẩm mới tạo -> Chuyển sang URL `/admin/products/${newId}` và mở khóa Tab 2, Tab 3.
  - [x] Khi chỉnh sửa sản phẩm đã có (`/admin/products/:id`): Mở đầy đủ cả 3 Tabs ngay từ đầu.

---

### PHẦN 4: QUẢN LÝ BIẾN THỂ TRÊN FORM ADMIN (`AdminProductForm.jsx` - TAB 2)

#### 🟩 TASK-FE-08: Xây dựng Bảng danh sách Biến thể (Variants Table) [DONE]
- **File thực hiện:** `frontend/src/pages/admin/AdminProductForm.jsx` (hoặc tách component con `AdminProductVariants.jsx`)
- **Độ ưu tiên:** `P0`
- **Checklist công việc:**
  - [x] Bảng hiển thị các cột: Mã SKU, Màu sắc (kèm chấm màu swatch), Kích thước (Size), Giá bán, Tồn kho, Trạng thái (`Đang bán` / `Ngừng bán`), Thao tác.
  - [x] Hiển thị thông số tổng kết phía trên bảng: Tổng số lượng biến thể, Khoảng giá, Tổng tồn kho.

---

#### 🟩 TASK-FE-09: Modal Thêm & Chỉnh sửa Biến thể riêng lẻ [DONE]
- **File thực hiện:** `frontend/src/pages/admin/AdminProductForm.jsx`
- **Độ ưu tiên:** `P0`
- **Checklist công việc:**
  - [x] Modal gồm form nhập liệu:
    - Mã SKU (`sku`): Bắt buộc, chuỗi in hoa.
    - Màu sắc (`color`): Bắt buộc (ví dụ: `White`, `Black`, `Navy`).
    - Kích cỡ (`size`): Bắt buộc (ví dụ: `S`, `M`, `L`, `XL`).
    - Giá bán (`price`): Bắt buộc, số dương $\ge 0$.
    - Tồn kho (`stockQuantity`): Bắt buộc, số nguyên $\ge 0$.
  - [x] Xử lý sự kiện:
    - Thêm mới: Gọi `adminApi.createVariant(productId, payload)`.
    - Cập nhật: Gọi `adminApi.updateVariant(variantId, payload)`.
  - [x] Hiển thị Toast thông báo và tự động refresh danh sách biến thể sau khi lưu thành công.

---

#### 🟩 TASK-FE-10: Thao tác Xóa mềm & Khôi phục biến thể riêng lẻ [DONE]
- **File thực hiện:** `frontend/src/pages/admin/AdminProductForm.jsx`
- **Độ ưu tiên:** `P1`
- **Checklist công việc:**
  - [x] Nút "Ngừng bán" (Xóa mềm): Gọi `adminApi.deleteVariant(variantId)` -> Biến thể chuyển sang `isDeleted: true` (gạch ngang tên, mờ hàng).
  - [x] Nút "Khôi phục": Gọi `adminApi.restoreVariant(variantId)` -> Biến thể quay lại trạng thái bán bình thường.
  - [x] Đảm bảo không ảnh hưởng đến các biến thể khác và không ảnh hưởng tới trạng thái sản phẩm gốc.

---

### PHẦN 5: QUẢN LÝ THƯ VIỆN ẢNH TRÊN FORM ADMIN (`AdminProductForm.jsx` - TAB 3)

#### 🟩 TASK-FE-11: Xây dựng Giao diện Gallery Hình ảnh Sản phẩm [DONE]
- **File thực hiện:** `frontend/src/pages/admin/AdminProductForm.jsx` (hoặc tách component con `AdminProductImages.jsx`)
- **Độ ưu tiên:** `P0`
- **Checklist công việc:**
  - [x] Hiển thị danh sách ảnh dạng lưới (Card Grid) kèm preview ảnh trực quan.
  - [x] Gắn Badge **Ảnh đại diện** (Primary) màu vàng/xanh nổi bật cho ảnh có `isPrimary === true`.
  - [x] Hiển thị chip liên kết biến thể: Nếu ảnh có `variantId`, hiển thị nhãn màu sắc tương ứng (ví dụ: `Gắn với màu: White`).

---

#### 🟩 TASK-FE-12: Form Thêm ảnh mới vào thư viện [DONE]
- **File thực hiện:** `frontend/src/pages/admin/AdminProductForm.jsx`
- **Độ ưu tiên:** `P0`
- **Checklist công việc:**
  - [x] Ô nhập `imageUrl`: Text input chứa đường link ảnh trực tiếp (preview ngay ảnh khi nhập link).
  - [x] Checkbox `isPrimary`: "Đặt làm ảnh đại diện chính của sản phẩm".
  - [x] Dropdown `variantId`: Danh sách các biến thể của sản phẩm để người dùng chọn gắn ảnh theo màu (tùy chọn).
  - [x] Gọi `adminApi.addImage(productId, payload)` -> Tải lại danh sách ảnh khi thành công.

---

#### 🟩 TASK-FE-13: Thao tác Chuyển ảnh chính và Xóa ảnh [DONE]
- **File thực hiện:** `frontend/src/pages/admin/AdminProductForm.jsx`
- **Độ ưu tiên:** `P0`
- **Checklist công việc:**
  - [x] Nút **"Đặt làm ảnh chính"**: Với các ảnh chưa phải là primary, hiển thị nút này; khi bấm gọi `adminApi.setPrimaryImage(imageId)`.
  - [x] Nút **"Xóa ảnh"**: Xác nhận trước khi xóa, gọi `adminApi.deleteImage(imageId)` -> Xóa ảnh khỏi gallery.

---

### PHẦN 6: ĐỒNG BỘ STOREFRONT & KIỂM THỬ TÍCH HỢP (E2E TESTING)

#### 🟩 TASK-FE-14: Đồng bộ liên kết Ảnh - Biến thể trên Trang chi tiết sản phẩm
- **File thực hiện:** `frontend/src/pages/ProductDetail.jsx`, `frontend/src/components/product/ProductVariantSelector.jsx`
- **Độ ưu tiên:** `P1`
- **Checklist công việc:**
  - [ ] Khi khách hàng click chọn Màu trên trang chi tiết sản phẩm, hệ thống tìm trong danh sách `images` ảnh có `variantId === selectedVariant.id` để tự động đổi ảnh lớn.
  - [ ] Đảm bảo chỉ hiển thị các biến thể chưa bị xóa mềm (`!v.isDeleted`).

---

#### 🟩 TASK-FE-15: Kiểm thử Hợp chuẩn Toàn bộ Luồng (E2E QA Checklist)
- **Phạm vi kiểm thử:** Toàn bộ Admin và Storefront
- **Độ ưu tiên:** `P0`
- **Checklist nghiệm thu:**
  - [ ] **Test Case 1:** Tạo sản phẩm gốc thành công -> Thêm 2 biến thể (M, L) -> Thêm 2 ảnh (1 ảnh chính, 1 ảnh gắn biến thể) -> Tất cả hiển thị chuẩn.
  - [ ] **Test Case 2:** Sửa giá/kho của 1 biến thể -> Danh sách sản phẩm cập nhật đúng `minPrice`, `maxPrice`, `totalStock`.
  - [ ] **Test Case 3:** Ngừng bán 1 biến thể (`DELETE variant`) -> Storefront chỉ còn biến thể còn lại; Admin vẫn thấy biến thể bị ẩn và khôi phục được.
  - [ ] **Test Case 4:** Xóa mềm toàn bộ sản phẩm (`DELETE product`) -> Cả sản phẩm và toàn bộ biến thể bị ẩn trên Storefront; khôi phục từ Admin (`PATCH restore`) thì quay lại bình thường.
  - [ ] **Test Case 5:** Chạy `npm --prefix frontend run lint` và `npm --prefix frontend run build` đạt kết quả `0 errors / 0 warnings`.


