# FunnyShop – Thiết kế lại Trang chủ (Phong cách Nhật Bản tối giản)

Bản thiết kế: https://claude.ai/artifact/5dwBquzgUhKiPNft4HJv4u
Nguồn chức năng: tài liệu "Tổng hợp toàn bộ chức năng trên Trang chủ FunnyShop".

---

## 1. Nguyên tắc thiết kế

- **Ma (間):** nhiều khoảng trắng, mỗi khối chỉ một ý chính.
- **Kanso (簡素):** bỏ trang trí thừa. Không gradient, không đổ bóng, không emoji, không glow theo chuột.
- **Đường kẻ mảnh** 1px thay cho viền dày và card nổi.
- **Một điểm nhấn duy nhất** màu đỏ son (kiểu dấu hanko), dùng rất ít.
- **Ảnh sản phẩm là nhân vật chính**, tỉ lệ 3:4, nền trung tính.

## 2. Design tokens

### Màu

| Token | Hex | Dùng cho |
| :--- | :--- | :--- |
| `paper` | `#FAFAFA` | Nền trang chính (trắng ngà off-white thanh thoát, hiện đại) |
| `ink` | `#18181B` | Chữ chính, nút, announcement bar |
| `mute` | `#52525B` | Chữ phụ, nhãn, giá, size |
| `line` | `#E4E4E7` | Đường kẻ mảnh 1px, viền |
| `sand` | `#F4F4F5` | Nền khối phụ (banner 1, newsletter, placeholder) |
| `vermilion` | `#B7352B` | Điểm nhấn: logo, tag "BỘ SƯU TẬP 2026", nhãn giảm giá |
| Tông ảnh placeholder | `#E4DED0` `#D9D5CB` `#E9E2D6` `#CFCBC0` `#DDD6C8` `#D4D0C4` | Nền ảnh sản phẩm |

Độ tương phản: `mute` trên `paper` ≈ 5:1 (đạt 4.5:1).

### Typography

| Vai trò | Font | Weight | Ghi chú |
| :--- | :--- | :--- | :--- |
| Tiêu đề, tên sản phẩm | Noto Serif | 300 | Hỗ trợ tiếng Việt, giãn chữ `.04–.08em` |
| Thân bài, UI | Noto Sans | 300 / 400 | 15px, line-height 1.7 |
| Nhãn nhỏ (uppercase) | Noto Sans | 400 | 11–12px, letter-spacing `.12–.3em` |

Cỡ chữ: H1 56px · H2 28px · tên sản phẩm 17px · thân 15px · nhãn 12px.

### Khoảng cách & lưới

- Container tối đa 1200px, padding ngang 32px.
- Mỗi section cách nhau 96px (dọc).
- Lưới sản phẩm: `repeat(auto-fill, minmax(240px, 1fr))`, gap 48px (dọc) × 24px (ngang).
- Mobile: 2 cột; tablet: 3 cột; desktop: 4 cột.

## 3. Cấu trúc trang (trên xuống dưới)

### 3.1 Announcement bar
- Nền `ink`, chữ `paper` 12px, căn giữa.
- Nội dung: Miễn phí giao hàng toàn quốc · Đổi size miễn phí 7 ngày · Stylist AI 24/7.
- Giữ chức năng đóng (`X`) và lưu `sessionStorage` (`funnyshop_announcement_dismissed`). Mobile: marquee.

### 3.2 Navbar (sticky, cao 72px)
- Trái: logo `FUNNYSHOP` serif giãn chữ, kèm ô vuông đỏ son 10px.
- Giữa: ô tìm kiếm chỉ có gạch chân, placeholder "Tìm sản phẩm", chip gợi ý xu hướng hiện khi focus.
- Phải: Giỏ hàng (số lượng từ `cartStore`), Đăng nhập, Đăng ký, nút đổi Sáng/Tối.
- Đã đăng nhập: avatar + dropdown (Trang cá nhân, Đơn hàng, Quản trị nếu `ADMIN`, Đăng xuất kèm `ConfirmDialog`).
- Viền dưới 1px `line`; khi cuộn > 8px thêm `backdrop-blur` nhẹ.

### 3.3 Hero (chỉ ở chế độ mặc định)
- Lưới 2 cột (1.1fr / 1fr), căn giữa dọc.
- Trái: nhãn "BỘ SƯU TẬP 2026" (đỏ son) → H1 "Giản dị, mà có chiều sâu." → đoạn mô tả → nút viền "Khám phá ngay" (cuộn tới `#products-catalog`) + link gạch chân "Mẫu bán chạy" (`sort=rating_desc`).
- Thanh chỉ số dưới đường kẻ: số mẫu (`totalElements`), số danh mục (`categories.length`), "7 ngày đổi size miễn phí".
- Phải: ảnh lookbook tỉ lệ 4:5, chữ dọc 新作 2026.
- Bỏ: card stack 3D, icon bay, quầng sáng.

### 3.4 TrustBar
- 4 cột giữa hai đường kẻ: Giao hàng toàn quốc (2–4 ngày) · Thanh toán khi nhận (COD) · Hỗ trợ đổi size (7 ngày) · Stylist AI (24/7). Chỉ chữ, không icon.

### 3.5 Danh mục
- Tiêu đề "Danh mục" + nhãn phụ `CATEGORY`.
- Lưới ô viền mảnh, mỗi ô: tên danh mục (serif) + số thứ tự 01–06.
- Dữ liệu từ `categoryApi.getCategories()`. Click: cập nhật `?category=...&page=1`, cuộn xuống catalog.
- Danh mục > 5: có thể giữ băng chuyền marquee, nhưng tốc độ chậm và không mặt nạ màu. Ô đang chọn dùng viền `ink` thay `ring-4`.

### 3.6 Bán chạy
- Lọc `rating >= 4.8`, hiển thị 4 thẻ. Link "Xem tất cả" gạch chân.
- Tag "NỔI BẬT" nền `paper` góc trái trên ảnh.
- Giữ: mũi tên trái/phải cuộn 300px, dừng khi hover; auto-scroll ping-pong là tùy chọn.

### 3.7 Hai banner
- Banner 1 (nền `sand`): "Thường ngày, tối giản" – nút "Khám phá phong cách".
- Banner 2 (nền `ink`): "Dạo phố, nổi bật" – nút "Xem bộ sưu tập".

### 3.8 Catalog toolbar (sticky `top: 72px`)
- Trái: chip danh mục dạng text, chip đang chọn có gạch chân `ink`, cuộn ngang.
- Phải: ô từ khóa (debounce 300ms, nút xóa), "Tìm thấy N sản phẩm", dropdown sắp xếp: Phổ biến nhất · `price_asc` · `price_desc` · `newest` · `rating_desc`.
- Dòng huy hiệu bộ lọc đang bật + "Xóa tất cả" (hiện khi có lọc).
- Focus view: khi có `q`, `category` hoặc `page ≥ 2` → ẩn Hero và các khối khuyến mãi, hiện breadcrumb "Trang chủ > Kết quả tìm kiếm".

### 3.9 Lưới sản phẩm & phân trang
- Trạng thái: Loading (8 skeleton nền `sand`, nhấp nháy chậm) · Error (thông báo + "Thử lại") · Empty (câu ngắn + "Xóa bộ lọc").
- Phân trang dạng chữ: `← 1 2 3 →`, trang hiện tại gạch chân. Đổi trang cuộn `scrollIntoView` về đầu catalog, lưu `?page=`.

### 3.10 ProductCard
- Ảnh 3:4, fallback khi lỗi ảnh.
- Dòng 1: danh mục (12px, giãn chữ). Dòng 2: tên (serif, tối đa 2 dòng). Dòng 3: size còn hàng (trái) và giá (phải).
- Khuyến mãi: giá gốc gạch ngang, nhãn `-%` chữ nhỏ trên ảnh.
- "Hết hàng": ảnh mờ 50%, nhãn chữ, vô hiệu hóa nút mua.
- "Hot": tag chữ nhỏ khi rating ≥ 4.8.
- Yêu thích: nút tim đường viền mảnh góc phải ảnh, hiện khi hover.
- "Thêm vào giỏ": hiện khi hover, đúng logic hiện tại (nhiều biến thể → `/products/:id`, đơn biến thể → `cartStore` + Toast).

### 3.11 Đánh giá khách hàng
- 3 cột, mỗi cột: câu trích serif 17px + dòng `TÊN · ĐỊA PHƯƠNG`. Bỏ avatar viết tắt.

### 3.12 Newsletter
- Nền `sand`, căn giữa. "Nhận bản tin, giảm 10% đơn đầu tiên".
- Input chỉ gạch chân + nút viền. Validate email, báo lỗi dưới input, Toast khi thành công.

### 3.13 Footer
- 4 cột: Thương hiệu · Công ty (Về chúng tôi, Hệ thống cửa hàng, Tuyển dụng, Lookbook) · Dịch vụ (Đổi hàng 7 ngày, Bảng size, Bảo mật, Theo dõi đơn) · Thanh toán & mạng xã hội (PayOS VietQR, COD, Facebook, Instagram, TikTok).
- Dòng cuối: bản quyền + hotline/email.

### 3.14 ChatWidget & ScrollToTop
- Nút "Stylist AI" nền `ink`, góc dưới phải, vuông góc (không bo tròn).
- Khung chat: nền `paper`, viền 1px `line`, tin nhắn không bong bóng (chỉ phân biệt bằng căn lề và nhãn). Thẻ sản phẩm trong chat dùng cùng kiểu ProductCard thu nhỏ.
- Giữ nguyên: Gemini tư vấn, đặt hàng qua chat (COD / PayOS VietQR), lưu lịch sử trong phiên.
- ScrollToTop: hiện khi cuộn > 400px, mũi tên `↑` viền mảnh.

## 4. Tương tác & chuyển động

- Chỉ dùng chuyển động nhẹ: fade/translate ≤ 8px, 200–300ms, `ease-out`.
- Hover nút: đảo màu `ink`/`paper`. Hover link: gạch chân.
- Bỏ: Mouse-follow spotlight, dot-matrix margins, 3D float. Tôn trọng `prefers-reduced-motion`.

## 5. Responsive

- ≥ 1280px: bố cục như trên.
- 768–1279px: hero 1 cột (ảnh dưới chữ), TrustBar 2×2, danh mục 3 cột, lưới 3 cột.
- < 768px: hamburger drawer, ô tìm kiếm mở rộng riêng, lưới 2 cột, banner xếp dọc, footer 1–2 cột. Touch target tối thiểu 44px.

## 6. Accessibility

- Dùng `<button>`, `<a href>`, `<input>` + `<label>` thật. Nút chỉ có icon phải có `aria-label`.
- Chữ ≥ 4.5:1. Trạng thái chọn không chỉ dựa vào màu (có gạch chân/viền).
- Focus ring rõ (outline 2px `ink`, offset 2px).

## 7. Giữ nguyên từ hệ thống hiện tại (không đổi logic)

| State / Param | Vai trò |
| :--- | :--- |
| `q`, `category`, `sort`, `page` | URL params điều khiển lọc/sắp xếp/phân trang |
| `categories`, `products`, `totalElements`, `totalPages` | Dữ liệu từ `/api/v1/categories`, `/api/v1/products` |
| `loading`, `error`, `searchTerm` | Skeleton, thông báo lỗi, debounce 300ms |
| `cartStore`, `authStore` | Giỏ hàng, đăng nhập, quyền admin |

## 8. Placeholder cần thay bằng dữ liệu thật

`[Giá bán]`, `[Số mẫu]`, `[Số mục]`, `[N]`, nội dung đánh giá khách hàng, `[TÊN] · [ĐỊA PHƯƠNG]`, `[Hotline] · [Email]`, ảnh lookbook và ảnh sản phẩm.
