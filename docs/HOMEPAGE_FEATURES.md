# TỔNG HỢP TOÀN BỘ CHỨC NĂNG TRÊN TRANG CHỦ (HOMEPAGE) - FUNNYSHOP

> **Mục đích tài liệu:** Tài liệu này thống kê, phân loại và mô tả chi tiết 100% các tính năng, tương tác người dùng, luồng dữ liệu (state/API) và logic nghiệp vụ hiện có trên Trang chủ FunnyShop trước khi tiến hành thiết kế lại toàn bộ giao diện (Redesign).

---

## MỤC LỤC
1. [Khung đỉnh trang & Điều hướng (Header & Navigation)](#1-khung-đỉnh-trang--điều-hướng-header--navigation)
2. [Hiệu ứng Nền & Thị giác Chuyên sâu (Flanks & Ambient Background)](#2-hiệu-ứng-nền--thị-giác-chuyên-sâu-flanks--ambient-background)
3. [Banner Hero Mở đầu (Hero Section)](#3-banner-hero-mở-đầu-hero-section)
4. [Thanh Cam kết Dịch vụ (TrustBar)](#4-thanh-cam-kết-dịch-vụ-trustbar)
5. [Băng chuyền Khám phá Danh mục (Category Section)](#5-băng-chuyền-khám-phá-danh-mục-category-section)
6. [Khu vực Trang phục Bán chạy (Best-sellers Carousel)](#6-khu-vực-trang-phục-bán-chạy-best-sellers-carousel)
7. [Bộ đôi Banner Phong cách & Khuyến mãi (Dual Promo Banners)](#7-bộ-đôi-banner-phong-cách--khuyến-mãi-dual-promo-banners)
8. [Thanh Công cụ Lọc, Tìm kiếm & Sắp xếp (Catalog Toolbar)](#8-thanh-công-cụ-lọc-tìm-kiếm--sắp-xếp-catalog-toolbar)
9. [Lưới Sản phẩm Chính & Phân trang (Product Grid & Pagination)](#9-lưới-sản-phẩm-chính--phân-trang-product-grid--pagination)
10. [Thẻ Sản phẩm Chi tiết (ProductCard Component)](#10-thẻ-sản-phẩm-chi-tiết-productcard-component)
11. [Đánh giá Khách hàng (Customer Testimonials)](#11-đánh-giá-khách-hàng-customer-testimonials)
12. [Đăng ký Bản tin Thời trang (Newsletter Section)](#12-đăng-ký-bản-tin-thời-trang-newsletter-section)
13. [Trợ lý AI Stylist & Đặt hàng Trực tiếp (ChatWidget)](#13-trợ-lý-ai-stylist--đặt-hàng-trực-tiếp-chatwidget)
14. [Chân trang Toàn diện (Footer) & Tiện ích Cuộn trang (ScrollToTop)](#14-chân-trang-toàn-diện-footer--tiện-ích-cuộn-trang-scrolltotop)
15. [Bảng tóm tắt Luồng Dữ liệu & State Quản lý](#15-bảng-tóm-tắt-luồng-dữ-liệu--state-quản-lý)

---

## 1. Khung đỉnh trang & Điều hướng (Header & Navigation)

### 1.1. Announcement Bar (Thanh thông báo chạy trên cùng)
- **Nội dung thông báo:** Miễn phí giao hàng toàn quốc · Đổi size miễn phí trong 7 ngày · Stylist AI tư vấn 24/7.
- **Responsive:**
  - *Mobile:* Chữ tự động chạy ngang liên tục (Marquee Animation).
  - *Desktop:* Hiển thị tĩnh, căn giữa, đính kèm nhãn thương hiệu và biểu tượng lấp lánh (Sparkles).
- **Tính năng Đóng (Dismiss):** Người dùng có thể nhấn nút `X` để ẩn thanh thông báo. Trạng thái được lưu vào `sessionStorage` (`funnyshop_announcement_dismissed`) để không làm phiền trong phiên lướt web.

### 1.2. Thanh điều hướng chính (Navbar)
- **Thương hiệu & Logo (`BrandLogo`):** Click để điều hướng về trang chủ và reset bộ lọc.
- **Thanh tìm kiếm tức thì (Live Search Box):**
  - Nhập từ khóa tìm kiếm nhanh (`input text`).
  - Gợi ý từ khóa xu hướng nhanh (Quick Search Chips: *Áo thun Boxy, Áo sơ mi, Quần jeans & Váy, Váy đầm, Áo khoác Hoodie*).
  - Nút `X` xóa nhanh từ khóa đang nhập.
  - Phản hồi trạng thái Focus làm mờ nền nhẹ; có giao diện Mobile Search mở rộng riêng biệt.
- **Biểu tượng Giỏ hàng (Cart Icon with Badge):**
  - Hiển thị tổng số lượng sản phẩm đang có trong giỏ hàng theo thời gian thực (lấy từ `cartStore`).
  - Click chuyển hướng sang trang Giỏ hàng (`/cart`).
- **Khu vực Tài khoản & Xác thực (Auth State):**
  - *Khách vãng lai:* Hiển thị nút "Đăng nhập" (`/login`) và "Đăng ký" (`/register`).
  - *Đã đăng nhập:* Hiển thị Avatar, Tên người dùng và Dropdown Menu cá nhân gồm:
    - Trang cá nhân (`/profile`).
    - Lịch sử đơn hàng (`/orders`).
    - Bảng điều khiển quản trị (`/admin/dashboard`) - chỉ hiển thị nếu tài khoản có quyền `ADMIN`.
    - Đăng xuất (kèm hộp thoại xác nhận `ConfirmDialog` và xóa token an toàn).
- **Bộ chuyển đổi Theme Sáng / Tối (`ThemeToggle`):** Đổi màu nền và text theo Dark/Light Mode.
- **Mobile Menu Drawer:** Nút Hamburger mở menu trượt dọc cho các thiết bị điện thoại.
- **Hiệu ứng Scroll Sticky:** Tự động tạo hiệu ứng đổ bóng viền kính mờ (`backdrop-blur`) khi người dùng cuộn chuột qua 8px.

---

## 2. Hiệu ứng Nền & Thị giác Chuyên sâu (Flanks & Ambient Background)

- **Faded Dot-Matrix Margins:** Trên màn hình lớn (`xl` trở lên), hai bên sườn ngoài vùng chứa nội dung chính (`max-w-7xl`) được điểm họa tiết chấm bi kỹ thuật mờ dần về phía giữa.
- **GPU-Accelerated Mouse-Follow Spotlight Glow:**
  - 2 quầng sáng màu thương hiệu (Cam neon / Tím pastel) bám theo vị trí trục dọc của con trỏ chuột (`clientY`).
  - Sử dụng thuật toán nội suy Lerp Physics (damping factor 0.08 qua `requestAnimationFrame`), chạy trực tiếp qua DOM Style/Ref, không gây re-render React.
  - Tự động ẩn khi con trỏ chuột rời khỏi trình duyệt.

---

## 3. Banner Hero Mở đầu (Hero Section)
*(Chỉ hiển thị khi đang ở chế độ xem trang chủ mặc định; tự động ẩn khi người dùng tìm kiếm, chọn danh mục hoặc sang trang 2+)*

- **Background Lookbook Full-Bleed:** Ảnh nền thời trang cao cấp tràn viền với lớp phủ Gradient Overlay bảo vệ độ tương phản chữ.
- **Ambient Floating Elements:** Các quầng sáng mềm mại và icon thời trang bay bổng lơ lửng ngẫu nhiên (3D Float Animation).
- **Khối thông điệp & Kêu gọi hành động (CTA):**
  - Tag nổi bật: *"✨ Bộ sưu tập Thời trang Mới 2026"*.
  - Tiêu đề thời trang và slogan định vị phong cách.
  - Nút bấm *"Khám phá ngay"* (cuộn mượt thẳng xuống danh mục sản phẩm `#products-catalog`).
  - Nút bấm *"🔥 Mẫu bán chạy"* (tự động bật sắp xếp theo đánh giá cao `sort=rating_desc`).
- **Thanh chỉ số thời gian thực (Real Stats Bar):**
  - Hiển thị tự động tổng số lượng mẫu thiết kế hiện có trong hệ thống (`totalElements+`).
  - Hiển thị số lượng danh mục thời trang thực tế (`categories.length`).
  - Cam kết đổi size miễn phí 7 ngày.
- **Fashion Lookbook Card Stack (Màn hình Desktop lg+):**
  - Bộ 3 thẻ thời trang xếp lớp 3D (Áo thun Boxy, Áo khoác Bomber, Đầm hoa Floral) với hiệu ứng nghiêng, bay nhẹ và hover phóng to.

---

## 4. Thanh Cam kết Dịch vụ (TrustBar)
*(Chỉ hiển thị ở chế độ mặc định)*

Bao gồm 4 cam kết dịch vụ cốt lõi:
1. **Giao hàng toàn quốc:** Nhận hàng tận nhà trong 2–4 ngày.
2. **Thanh toán khi nhận (COD):** Kiểm tra hàng trước khi thanh toán.
3. **Hỗ trợ đổi size:** Đổi size linh hoạt trong vòng 7 ngày.
4. **Stylist AI tư vấn:** Gợi ý phối đồ và tư vấn chọn size 24/7.

---

## 5. Băng chuyền Khám phá Danh mục (Category Section)
*(Chỉ hiển thị ở chế độ mặc định)*

- **Nguồn dữ liệu động:** Gọi API `categoryApi.getCategories()` từ backend.
- **Chế độ hiển thị linh hoạt:**
  - **Khi danh mục > 5:** Kích hoạt chế độ **Băng chuyền cuộn vô tận (Infinite Marquee)** sử dụng `requestAnimationFrame`.
    - Hỗ trợ cuộn chuột đảo chiều (Reverse Wheel: lăn chuột xuống sẽ trượt danh mục sang trái).
    - Tự động dừng cuộn khi rê chuột (`hover`) hoặc chạm ngón tay (`touch`).
    - Hai bên mép có dải mặt nạ mờ (Gradient Edge Mask) tạo cảm giác chuyển động mượt mà.
  - **Khi danh mục ≤ 5:** Tự động chuyển về dạng Lưới (Grid) 2-6 cột căn giữa.
- **Thẻ danh mục (`CategoryCard Tile`):**
  - Icon emoji đặc trưng và màu nền pastel riêng biệt cho từng loại đồ (Áo thun, Polo, Sơ mi, Quần jeans, Váy đầm, Áo khoác, v.v.).
  - Thẻ mặc định *"Tất cả"* để xem toàn bộ sản phẩm.
  - Tích chọn có viền sáng viền `ring-4` và biểu tượng Checkmark xác nhận danh mục đang kích hoạt.
  - Khi click: Cập nhật URL `?category=...&page=1` và tự động cuộn trang xuống phần danh mục sản phẩm.

---

## 6. Khu vực Trang phục Bán chạy (Best-sellers Carousel)
*(Chỉ hiển thị ở chế độ mặc định)*

- **Lọc thông minh:** Tự động trích xuất các sản phẩm có đánh giá cao nhất (`rating >= 4.8` hoặc sắp xếp giảm dần theo điểm rating).
- **Băng chuyền tự động (Ping-pong Auto Scroll):**
  - Tự động lướt ngang mượt mà, khi chạm cạnh cuối sẽ tự động đảo hướng trượt lại.
  - Nút điều hướng mũi tên trái / phải (`ChevronLeft`, `ChevronRight`) để cuộn thủ công từng nấc 300px.
  - Nhận diện cuộn chuột đảo chiều (Reverse Wheel).
  - Tạm dừng chuyển động khi người dùng rê chuột vào sản phẩm.
- **Liên kết "Xem tất cả":** Dẫn thẳng xuống danh mục đầy đủ bên dưới.

---

## 7. Bộ đôi Banner Phong cách & Khuyến mãi (Dual Promo Banners)
*(Chỉ hiển thị ở chế độ mặc định)*

- **Banner 1 (Basic Everyday):** Giới thiệu trang phục thường ngày (áo thun 100% cotton, sơ mi form rộng tối giản), đính kèm nút "Khám phá phong cách".
- **Banner 2 (Streetwear & Trendy):** Giới thiệu trang phục dạo phố nổi bật (váy đầm, bomber, hoodie), đính kèm nút "Xem bộ sưu tập".

---

## 8. Thanh Công cụ Lọc, Tìm kiếm & Sắp xếp (Catalog Toolbar)
*(Vùng neo cố định `sticky top-16` khi người dùng cuộn xem sản phẩm)*

- **Dải nút danh mục nhanh (Category Chips Horizontal Scroll):**
  - Thanh cuộn ngang chứa nút "Tất cả" và các danh mục kèm biểu tượng emoji.
  - Giúp khách hàng đổi danh mục xem ngay tức thì mà không cần cuộn ngược lên đầu trang.
- **Ô tìm kiếm sản phẩm với Debounce:**
  - Ô input gõ từ khóa trực tiếp với cơ chế chống dội (Debounce 300ms) để không gây spam API.
  - Tích hợp nút `X` xóa nhanh từ khóa.
- **Bộ đếm kết quả:** Thông báo số lượng sản phẩm tìm thấy theo thời gian thực (ví dụ: *"Tìm thấy 24 sản phẩm"*).
- **Bộ chọn sắp xếp (Sort Dropdown):**
  - Phổ biến nhất (Mặc định).
  - Giá: Thấp đến cao (`price_asc`).
  - Giá: Cao đến thấp (`price_desc`).
  - Mới nhất (`newest`).
  - Đánh giá cao nhất (`rating_desc`).
- **Hàng huy hiệu bộ lọc đang bật (Active Filter Badges):**
  - Hiển thị tag cho từ khóa: `Từ khóa: "áo sơ mi" [x]`.
  - Hiển thị tag cho danh mục: `Danh mục: Thời trang Nam [x]`.
  - Hiển thị tag cho sắp xếp: `Sắp xếp: Giá thấp đến cao [x]`.
  - Nút *"Xóa tất cả"* giúp hoàn nguyên về trạng thái ban đầu chỉ bằng 1 cú click.
- **Chế độ Tìm kiếm/Lọc tập trung (Focus View):**
  - Khi có từ khóa tìm kiếm hoặc lọc danh mục hoặc xem từ trang 2 trở đi: Giao diện tự động thu gọn, ẩn Hero và các khối khuyến mãi để ưu tiên hiển thị Breadcrumb (`Trang chủ > Kết quả tìm kiếm`) cùng danh sách sản phẩm.

---

## 9. Lưới Sản phẩm Chính & Phân trang (Product Grid & Pagination)

- **Lưới tương thích màn hình (Responsive Grid):**
  - Mobile: 2 cột (`grid-cols-2`).
  - Tablet: 3 cột (`md:grid-cols-3`).
  - Desktop: 4 cột (`xl:grid-cols-4`).
- **Các trạng thái hiển thị (State Handlers):**
  - **Loading:** Hiển thị 8 khung xương giả lập (`ProductCardSkeleton`) với hiệu ứng lượn sóng bóng mờ.
  - **Error State:** Hiển thị thông báo lỗi thân thiện nếu mất mạng/lỗi máy chủ kèm nút *"Thử lại"* (`onRetry`).
  - **Empty State:** Khi không có sản phẩm nào khớp với tìm kiếm/bộ lọc, hiển thị minh họa đồ thời trang, thông điệp hướng dẫn và nút *"Xóa bộ lọc"*.
- **Phân trang (`Pagination`):**
  - Chuyển trang qua lại 1, 2, 3...
  - Tự động cuộn trang mượt mà (`scrollIntoView`) về đầu danh mục sản phẩm khi đổi trang.
  - Lưu trạng thái số trang vào URL query (`?page=2`).

---

## 10. Thẻ Sản phẩm Chi tiết (`ProductCard` Component)

Mỗi thẻ sản phẩm trong danh sách sở hữu các tính năng sau:
- **Hình ảnh & Dự phòng lỗi:** Tải ảnh đại diện; nếu link ảnh hỏng tự động kích hoạt chế độ fallback an toàn.
- **Huy hiệu thông minh:**
  - Badge *"Hết hàng"* nếu tồn kho = 0 (làm mờ thẻ và vô hiệu hóa nút mua).
  - Badge *"Hot / Nổi bật"* nếu đánh giá ≥ 4.8 sao.
  - Badge `-% Giảm` tính toán tự động nếu có giá gốc `originalPrice > price`.
- **Nút Yêu thích (Wishlist Heart):** Toggle thả tim lưu sản phẩm yêu thích.
- **Thông tin sản phẩm:** Tên danh mục, Tên sản phẩm (giới hạn 2 dòng), Đánh giá sao vàng kèm số điểm.
- **Kích thước có sẵn (Size Chips):** Tự động bóc tách và hiển thị các size còn hàng (ví dụ: `S`, `M`, `L`, `XL`, `FreeSize`).
- **Hiển thị giá bán:** Giá bán hiện tại bằng VNĐ kèm giá gốc gạch ngang (nếu có khuyến mãi).
- **Hành vi nút "Thêm vào giỏ hàng" (`handleAddToCart`):**
  - *Nếu sản phẩm có nhiều biến thể (màu sắc/size):* Chuyển hướng người dùng vào trang Chi tiết sản phẩm (`/products/:id`) để lựa chọn chính xác biến thể.
  - *Nếu là sản phẩm biến thể đơn:* Thêm ngay vào `cartStore` và kích hoạt thông báo Toast thành công.

---

## 11. Đánh giá Khách hàng (Customer Testimonials)
*(Chỉ hiển thị ở chế độ mặc định)*

- 3 khối phản hồi thực tế từ khách hàng kèm avatar ký tự viết tắt và địa phương:
  - Nhận xét chất lượng vải và độ bền form dáng.
  - Nhận xét về độ chuẩn của tư vấn Stylist AI khi chọn size đồ.
  - Nhận xét về tốc độ giao nhận, đóng gói và chính sách hỗ trợ đổi size.

---

## 12. Đăng ký Bản tin Thời trang (Newsletter Section)
*(Chỉ hiển thị ở chế độ mặc định)*

- Khối Gradient Banner màu cam - tím rực rỡ.
- Nội dung: Tặng voucher giảm giá 10% cho đơn hàng đầu tiên và thông báo đợt phát hành bộ sưu tập mới.
- Form nhập email: Có kiểm tra định dạng email hợp lệ, báo lỗi nếu sai và bắn thông báo Toast chúc mừng đăng ký thành công.

---

## 13. Trợ lý AI Stylist & Đặt hàng Trực tiếp (ChatWidget)

Cửa sổ chat thông minh gắn cố định ở góc dưới cùng bên phải màn hình:
- **Tư vấn thời trang & Mix-match:** Sử dụng Google Gemini AI và danh mục sản phẩm thực tế của FunnyShop để gợi ý outfit phù hợp theo nhu cầu (đi làm, đi chơi, hẹn hò, quà tặng).
- **Gợi ý sản phẩm trực quan:** Trả về thẻ sản phẩm đính kèm ngay trong tin nhắn chat; người dùng bấm vào xem được chi tiết ngay.
- **Hỗ trợ Đặt hàng Trực tiếp qua Chat:**
  - Khách hàng có thể cung cấp Họ tên, Số điện thoại, Địa chỉ và Tên sản phẩm ngay trong tin nhắn.
  - Trợ lý AI tự động bóc tách thông tin, gọi API tạo đơn hàng (hỗ trợ COD hoặc thanh toán online PayOS VietQR) mà khách không cần qua các bước giỏ hàng thủ công.
- **Thu gọn & Mở rộng:** Nút bấm bật/tắt tiện lợi, lưu giữ lịch sử chat trong phiên.

---

## 14. Chân trang Toàn diện (Footer) & Tiện ích Cuộn trang (ScrollToTop)

### 14.1. Chân trang (Footer)
- Thông tin thương hiệu, sứ mệnh thời trang FunnyShop.
- Cột thông tin công ty: Về chúng tôi, Hệ thống cửa hàng, Tuyển dụng, Lookbook.
- Cột dịch vụ khách hàng: Chính sách đổi hàng trong 7 ngày, Bảng quy đổi kích cỡ (Size Guide), Chính sách bảo mật, Theo dõi đơn hàng.
- Cột thanh toán & Vận chuyển: Logo PayOS VietQR, Thanh toán COD, Đơn vị vận chuyển đối tác.
- Kết nối mạng xã hội: Facebook, Instagram, TikTok.
- Bản quyền thương hiệu và thông tin liên hệ Hotline/Email.

### 14.2. Tiện ích Cuộn nhanh lên đầu trang (ScrollToTop)
- Tự động hiển thị khi người dùng cuộn trang vượt quá 400px.
- Nhấp chuột kích hoạt cuộn mượt (`window.scrollTo({ top: 0, behavior: 'smooth' })`) đưa người dùng về đỉnh trang.

---

## 15. Bảng tóm tắt Luồng Dữ liệu & State Quản lý

| Tên State / Tham số | Kiểu dữ liệu | Vai trò & Mục đích sử dụng |
| :--- | :--- | :--- |
| `q` | `string` (URL Param) | Từ khóa tìm kiếm sản phẩm đang được lọc trên toàn bộ trang. |
| `category` | `number \| string` (URL Param) | ID danh mục sản phẩm đang được chọn. |
| `sort` | `string` (URL Param) | Kiểu sắp xếp (`price_asc`, `price_desc`, `newest`, `rating_desc`). |
| `page` | `number` (URL Param) | Trang hiện tại trong bảng phân trang (mặc định = 1). |
| `categories` | `Array<Category>` | Danh sách toàn bộ danh mục lấy từ API `/api/v1/categories`. |
| `products` | `Array<Product>` | Danh sách sản phẩm của trang hiện tại lấy từ `/api/v1/products`. |
| `totalElements` | `number` | Tổng số lượng sản phẩm thỏa mãn điều kiện lọc. |
| `totalPages` | `number` | Tổng số trang phân trang trả về từ backend. |
| `loading` | `boolean` | Trạng thái hiển thị Skeleton Loading khi đang gọi API. |
| `error` | `string \| null` | Lưu lỗi nếu API backend không phản hồi hoặc bị gián đoạn. |
| `searchTerm` | `string` | State lưu trữ chuỗi nhập liệu tìm kiếm tạm thời trước khi debounce. |
| `cartStore` | Zustand Store | Quản lý giỏ hàng toàn cục: số lượng icon badge, thêm sản phẩm vào giỏ. |
| `authStore` | Zustand Store | Quản lý trạng thái đăng nhập, thông tin user, quyền admin. |

