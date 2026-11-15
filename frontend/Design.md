# FunnyShop Fashion – Tài liệu Đặc tả Thiết kế UI/UX (Design Spec) · Bản 2.1 "Thời trang & Full-Bleed Hero"

> **Mục đích:** Tài liệu chuẩn để đội ngũ phát triển dựng giao diện Frontend **ReactJS + Vite + Tailwind CSS v4** cho hệ thống E-Commerce chuyên bán quần áo thời trang **FunnyShop** (MVP).
> **Nguồn liên quan:** `SRS_FunnyShop_MVP.md` (yêu cầu), `task.md` (tiến độ).
> **Thứ tự ưu tiên khi mâu thuẫn:** `SRS_FunnyShop_MVP.md` > `Design.md` > ảnh/bản thiết kế Figma > suy đoán. Mâu thuẫn phải ghi vào mục "Nhật ký" của `task.md`.
> **Bản 2.1 thay đổi gì:**
> - **Chuyển đổi ngành hàng sang Thời trang & Quần áo:** Cập nhật danh mục (Áo thun, Áo sơ mi & Áo kiểu, Quần & Chân váy, Váy đầm, Áo khoác & Hoodie), bổ sung thông số đặc thù của thời trang (Chọn Size `S / M / L / XL`, Chọn Màu sắc, Hướng dẫn chọn size, tỉ lệ ảnh dọc `aspect-[3/4]` tôn dáng trang phục).
> - **Nâng cấp Hero Banner trang chủ Full-Bleed (tràn 100% chiều ngang màn hình):** Thiết kế Hero dạng full-width sát hai mép trình duyệt (`w-full`, không bo góc ngoài cùng), hỗ trợ ảnh nền Lookbook/Banner thời trang phủ lớp gradient thương hiệu hoặc slide bộ sưu tập, nội dung bên trong vẫn căn chỉnh chuẩn lưới container.
> - **Bảng màu giữ nguyên 100%:** Không thêm, không sửa bất kỳ mã màu nào ở mục 2.2; mọi chi tiết mới chỉ phối lại các bậc màu đã có.
    > **Ký hiệu 🔹 (dữ liệu tùy chọn):** Chi tiết cần trường dữ liệu hoặc nội dung ngoài SRS (giá gốc/giảm giá, số đã bán, khuyến mãi, đánh giá khách hàng, bản tin, biến thể màu/size nếu backend chưa tách SKU...). Nếu API/SRS chưa có thì **ẩn khối đó**, không tự bịa số liệu. Mock chỉ dùng khi dev và phải gỡ khi lên bản thật.

---

## 0. Cách dùng tài liệu này

1. Dựng **Design Tokens** (mục 2) vào `src/index.css` trước tiên, rồi mới viết component.
2. Dựng **component dùng chung** (mục 6) trước khi dựng trang.
3. Mỗi trang (mục 7) phải có đủ 3 trạng thái: **loading, empty, error**.
4. **Không** dùng màu/cỡ chữ/khoảng cách tùy ý (ví dụ `text-[13px]`, `bg-[#ff0000]`). Chỉ dùng token và lớp Tailwind trong tài liệu này.
5. Mọi chuỗi giao diện bằng **tiếng Việt**, lấy từ mục 9 (Microcopy) khi có.
6. Khi xong mỗi trang, đối chiếu **Checklist nghiệm thu** (mục 14).
7. Đọc **mục 2.7 (Ngôn ngữ trang trí)** trước khi dựng trang đầu tiên: mọi trang phải theo nhịp nền và quy tắc "đừng quá tay" ở đó.

---

## 1. Nguyên tắc thiết kế

| Nguyên tắc | Diễn giải |
|---|---|
| **Trẻ trung, thời thượng & sạch** | Màu sáng, đường nét gọn gàng, nhiều khoảng trắng để tôn lên hình ảnh trang phục. Trang trí tiết chế (icon/emoji thời trang nhỏ ở banner, empty state, trang lỗi). |
| **Đọc được trước, đẹp sau** | Độ tương phản đạt WCAG AA. Giá bán, chọn size và nút hành động luôn nổi bật nhất trong khung nhìn. |
| **Mobile-first** | Viết style cho mobile trước, mở rộng bằng `sm: md: lg: xl:`. |
| **Nhất quán** | Một bộ component, một bộ token. Cùng một loại hành động luôn có cùng một kiểu nút. |
| **Phản hồi rõ ràng** | Mọi hành động đều có phản hồi: toast, loading, trạng thái disabled (đặc biệt khi hết size/hết hàng). |
| **Giàu chi tiết, có nhịp điệu** | Mỗi trang gồm nhiều khối có nền xen kẽ (trắng / `primary-50` / `secondary-50` / gradient), tiêu đề khối có điểm nhấn, họa tiết nhẹ. Không để trang là một cột thẻ trắng giống nhau. |
| **Nhiều lớp nhưng không rối** | Mỗi khung nhìn tối đa **1** điểm nhấn trang trí lớn. Trang trí luôn nằm dưới nội dung, không cạnh tranh với ảnh sản phẩm, giá và nút hành động. |
| **Đối tượng** | Người trẻ 16–30 tuổi yêu thích thời trang tại Việt Nam, nội dung tiếng Việt, tiền VND. |

---

## 2. Design Tokens

### 2.1. Cài đặt font (offline, không phụ thuộc CDN)

```bash
npm install @fontsource/be-vietnam-pro
```

Trong `src/main.jsx` (hoặc đầu `index.css`) import các độ đậm sử dụng:

```js
import '@fontsource/be-vietnam-pro/400.css'
import '@fontsource/be-vietnam-pro/500.css'
import '@fontsource/be-vietnam-pro/600.css'
import '@fontsource/be-vietnam-pro/700.css'
```

### 2.2. `src/index.css` (Tailwind v4, dùng `@theme`)

```css
@import "tailwindcss";

@theme {
  /* Font */
  --font-sans: "Be Vietnam Pro", ui-sans-serif, system-ui, -apple-system, "Segoe UI", Roboto, sans-serif;

  /* Primary – cam san hô (thương hiệu) */
  --color-primary-50:  #FFF3F0;
  --color-primary-100: #FFE4DD;
  --color-primary-200: #FFC9BB;
  --color-primary-300: #FFA68F;
  --color-primary-400: #FF8567;
  --color-primary-500: #FF6B4A; /* màu thương hiệu: dùng cho nền trang trí, icon, viền nhấn */
  --color-primary-600: #E04B2D;
  --color-primary-700: #C93E22; /* nền nút primary, link, giá: chữ trắng đạt AA (≈5:1) */
  --color-primary-800: #A0341F;
  --color-primary-900: #832F1E;

  /* Secondary – tím */
  --color-secondary-50:  #F3F1FE;
  --color-secondary-100: #E6E2FC;
  --color-secondary-200: #CFC8F9;
  --color-secondary-300: #B0A5F4;
  --color-secondary-400: #8F80EE;
  --color-secondary-500: #6C5CE7; /* chữ trắng trên nền này đạt AA (≈4.9:1) */
  --color-secondary-600: #5A49D1;
  --color-secondary-700: #4A3BB0;
  --color-secondary-800: #3B308C;
  --color-secondary-900: #2F276F;

  /* Nền & chữ nền tảng */
  --color-page: #FAFAFA;
  --color-ink: #1F2937;        /* chữ chính */
  --color-ink-muted: #4B5563;  /* chữ phụ */
  --color-ink-subtle: #6B7280; /* chú thích (tối thiểu, không nhạt hơn) */
  --color-line: #E5E7EB;       /* viền, đường kẻ */

  /* Bo góc */
  --radius-sm: 6px;
  --radius-md: 8px;
  --radius-lg: 12px;
  --radius-xl: 16px;

  /* Bóng bổ sung – chỉ phối từ màu đã có ở trên */
  --shadow-soft:   0 2px 8px rgb(31 41 55 / 0.06);     /* từ --color-ink */
  --shadow-brand:  0 8px 24px rgb(255 107 74 / 0.25);  /* từ primary-500 */
  --shadow-violet: 0 8px 24px rgb(108 92 231 / 0.25);  /* từ secondary-500 */

  /* Animation bổ sung */
  --animate-float:      float 5s ease-in-out infinite;
  --animate-float-slow: float 8s ease-in-out infinite;
  --animate-pop:        pop 300ms ease-out;
  --animate-marquee:    marquee 30s linear infinite;

  @keyframes float {
    0%, 100% { transform: translateY(0) rotate(0deg); }
    50%      { transform: translateY(-8px) rotate(3deg); }
  }
  @keyframes pop {
    0%   { transform: scale(0.8); opacity: 0; }
    60%  { transform: scale(1.08); }
    100% { transform: scale(1); opacity: 1; }
  }
  @keyframes marquee {
    from { transform: translateX(0); }
    to   { transform: translateX(-50%); }
  }
}

@layer base {
  html { font-family: var(--font-sans); background: var(--color-page); color: var(--color-ink); }
  body { @apply antialiased; }
  :focus-visible { @apply outline-2 outline-offset-2 outline-secondary-500; }
}

/* Họa tiết nền – chỉ dùng màu có sẵn */
@utility bg-dots {
  background-image: radial-gradient(var(--color-primary-200) 1.5px, transparent 1.5px);
  background-size: 20px 20px;
}
@utility bg-dots-violet {
  background-image: radial-gradient(var(--color-secondary-200) 1.5px, transparent 1.5px);
  background-size: 20px 20px;
}
@utility bg-grid {
  background-image:
    linear-gradient(var(--color-line) 1px, transparent 1px),
    linear-gradient(90deg, var(--color-line) 1px, transparent 1px);
  background-size: 32px 32px;
}
@utility bg-stripes {
  background-image: repeating-linear-gradient(45deg, var(--color-primary-100) 0 8px, transparent 8px 16px);
}

/* Giảm chuyển động toàn cục */
@media (prefers-reduced-motion: reduce) {
  *, ::before, ::after {
    animation-duration: 0.01ms !important;
    animation-iteration-count: 1 !important;
    transition-duration: 0.01ms !important;
  }
}
```

> Màu **semantic** (success/warning/danger/info) và **badge trạng thái đơn** dùng thang màu mặc định của Tailwind (`green`, `amber`, `red`, `blue`, `violet`) như bảng 2.3, không định nghĩa lại.

### 2.3. Bảng dùng màu theo ngữ cảnh

| Ngữ cảnh | Lớp Tailwind |
|---|---|
| Nền trang | `bg-page` |
| Nền thẻ, navbar, modal | `bg-white` |
| Chữ chính / phụ / chú thích | `text-ink` / `text-ink-muted` / `text-ink-subtle` |
| Viền | `border-line` |
| Nút primary | `bg-primary-700 hover:bg-primary-800 text-white` |
| Link, giá | `text-primary-700` |
| Nhấn phụ (stylist AI, tab đang chọn) | `bg-secondary-500` / `text-secondary-700` |
| Thành công | `bg-green-50 text-green-800 border-green-200` |
| Cảnh báo | `bg-amber-50 text-amber-800 border-amber-200` |
| Lỗi | `bg-red-50 text-red-800 border-red-200` |
| Thông tin | `bg-blue-50 text-blue-800 border-blue-200` |

### 2.4. Badge trạng thái đơn hàng

| Trạng thái (`status`) | Nhãn hiển thị | Lớp Tailwind |
|---|---|---|
| `PENDING` | Chờ xử lý | `bg-amber-100 text-amber-800` |
| `PROCESSING` | Đang chuẩn bị hàng | `bg-blue-100 text-blue-800` |
| `SHIPPING` | Đang giao | `bg-violet-100 text-violet-800` |
| `COMPLETED` | Hoàn thành | `bg-green-100 text-green-800` |
| `CANCELLED` | Đã hủy | `bg-red-100 text-red-800` |

Badge: `inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold`. Luôn có **chữ**, không chỉ dựa vào màu.

### 2.5. Chữ (Typography)

| Style | Lớp Tailwind | Dùng cho |
|---|---|---|
| Display | `text-3xl md:text-5xl font-bold tracking-tight` | Tiêu đề banner full-bleed trang chủ |
| H1 | `text-2xl md:text-3xl font-bold` | Tiêu đề trang |
| H2 | `text-xl md:text-2xl font-semibold` | Tiêu đề khối |
| H3 | `text-lg font-semibold` | Tiêu đề thẻ, form section |
| Body | `text-base` (16px) | Nội dung |
| Body-sm | `text-sm` (14px) | Mô tả phụ, bảng, thông số chất liệu |
| Caption | `text-xs` (12px) | Chú thích, badge, tag size |
| Giá (card) | `text-lg font-bold text-primary-700` | Giá sản phẩm |
| Giá (chi tiết) | `text-3xl font-bold text-primary-700` | Giá ở trang chi tiết |
| Label form | `text-sm font-medium text-ink` | Nhãn ô nhập, nhãn chọn size |

Quy tắc: line-height mặc định của Tailwind; tên sản phẩm dài dùng `line-clamp-2`; không dùng chữ in hoa toàn bộ cho đoạn văn.

### 2.6. Khoảng cách, bóng, z-index

- **Khoảng cách:** chỉ dùng thang Tailwind (bội số của 4px): `1, 2, 3, 4, 6, 8, 12, 16`. Khoảng cách giữa các khối trang: `py-8 md:py-12`; giữa các phần tử trong thẻ: `gap-2` / `gap-3` / `gap-4`.
- **Bóng:** `shadow-sm` (thẻ), `shadow-md` (thẻ hover, dropdown), `shadow-xl` (modal, chat panel).
- **Z-index:** navbar `z-40` · chat widget `z-[45]` · drawer/overlay `z-50` · modal `z-[60]` · toast `z-[70]`.

### 2.7. Ngôn ngữ trang trí (v2.1 – Thời trang & Nhịp điệu)

Mục tiêu: trang có **nhịp điệu** (nền xen kẽ, khối full-bleed mở đầu ấn tượng), có **chiều sâu** (lớp ảnh Lookbook, bóng, hình khối) và có **cá tính thời trang trẻ trung** mà vẫn sạch, tôn lên từng bộ trang phục.

**2.7.1. Nhịp nền theo khối** (từ trên xuống, không để hai khối liền kề cùng nền):

| Khối | Nền |
|---|---|
| Thanh thông báo | `bg-secondary-700 text-white` |
| Navbar | `bg-white/95 backdrop-blur` |
| **Hero Banner (Full-Bleed)** | **Tràn 100% chiều ngang (`w-full`)**, ảnh Lookbook phủ lớp gradient thương hiệu (2.7.2) |
| Dải tin cậy | `bg-white border-b border-line` |
| Danh mục trang phục | `bg-page` |
| Bán chạy / Bộ sưu tập mới | `bg-primary-50 bg-dots` (khối bo `rounded-3xl`, nằm trong container) |
| Banner đôi (Phong cách Nam / Nữ hoặc Streetwear / Basic) | Thẻ `bg-secondary-50` và `bg-primary-50` |
| Danh sách sản phẩm | `bg-page` |
| Đánh giá khách hàng 🔹 | `bg-secondary-50` |
| Bản tin ưu đãi 🔹 | Gradient thương hiệu |
| Footer | `bg-gray-900 text-gray-100` + vạch gradient trên cùng |

**2.7.2. Gradient được phép** (chỉ phối từ `primary` và `secondary`):

| Tên | Lớp Tailwind | Dùng cho |
|---|---|---|
| Thương hiệu | `bg-gradient-to-br from-primary-600 to-secondary-600` | Hero fallback, bản tin, panel auth. Chữ trắng **chỉ** cho chữ lớn/đậm (≥ `text-lg font-semibold`) |
| Lớp phủ Hero (Full-Bleed) | `bg-gradient-to-r from-gray-950/80 via-primary-900/65 to-secondary-900/40` | Phủ lên ảnh Lookbook toàn màn hình ở Hero để chữ trắng luôn đạt tương phản cao |
| Ấm | `bg-gradient-to-r from-primary-50 to-primary-100` | Khối nhấn nhẹ, header thẻ |
| Mát | `bg-gradient-to-r from-secondary-50 to-secondary-100` | Khối AI Stylist/chatbot, cover hồ sơ |
| Ấm → mát nhẹ | `bg-gradient-to-br from-primary-50 via-white to-secondary-50` | Nền trang đăng nhập/đăng ký, trang lỗi |
| Vạch nhấn | `bg-gradient-to-r from-primary-500 via-secondary-500 to-primary-500` (cao `h-1`) | Đầu footer, đầu thẻ tóm tắt |

Không dùng gradient cho nút, cho nền của chữ nhỏ, hoặc cho bảng dữ liệu.

**2.7.3. Họa tiết & hình khối** (tất cả là CSS/emoji/SVG nội bộ):

| Thành phần | Cách dựng |
|---|---|
| Chấm bi | `bg-dots` / `bg-dots-violet` (mục 2.2), thường kèm `opacity-60` |
| Lưới | `bg-grid`, dùng cho nền trang trống/empty state |
| Sọc | `bg-stripes`, dùng cho dải nhãn hoặc nền banner nhỏ |
| Blob mờ | `absolute rounded-full bg-primary-200/50 blur-2xl size-48` (hoặc `bg-secondary-200/50`) đặt lệch góc khối |
| Sticker emoji | Emoji trong `grid size-12 place-items-center rounded-2xl bg-primary-100 -rotate-6` (xen kẽ `rotate-3`, `bg-secondary-100`) |
| Emoji bay | Emoji thời trang `absolute text-4xl animate-float` / `animate-float-slow` (👕 👗 🧥 👟 🧢) |
| Đường kẻ chấm | `border-t border-dashed border-line` ngăn nhóm thông tin |

**2.7.4. Cặp màu & emoji theo danh mục quần áo** (chỉ xoay giữa 2 màu thương hiệu, không thêm màu mới):

| Danh mục | Emoji | Nền thẻ | Nền sticker |
|---|---|---|---|
| Áo thun & Polo | 👕 | `bg-primary-50` | `bg-primary-100` |
| Áo sơ mi & Áo kiểu | 👔 | `bg-secondary-50` | `bg-secondary-100` |
| Quần & Chân váy | 👖 | `bg-primary-50` | `bg-primary-200` |
| Váy & Đầm | 👗 | `bg-secondary-50` | `bg-secondary-200` |
| Áo khoác & Hoodie | 🧥 | `bg-primary-50` | `bg-primary-100` |

Đặt bản đồ này trong `constants.js` (`CATEGORY_META`) để `CategoryTile`, chip danh mục và `ProductCard` dùng chung. Danh mục lạ (admin thêm mới): emoji 🏷️ + cặp `primary`.

**2.7.5. Độ sâu (3 mức)**

| Mức | Lớp | Dùng cho |
|---|---|---|
| Phẳng | `border border-line` | Bảng, ô nhập, thẻ trong danh sách dài |
| Nổi | `shadow-soft` → hover `shadow-md` | Thẻ sản phẩm, thẻ danh mục, thẻ đánh giá |
| Nhấn | `shadow-brand` / `shadow-violet` | CTA chính, thẻ nổi bật, nút chat |

**2.7.6. Quy tắc "đừng quá tay"**

- Mỗi khối tối đa **2 loại** họa tiết (ví dụ chấm bi + blob). Mỗi khung nhìn tối đa 1 điểm nhấn lớn.
- Mọi phần tử trang trí có `aria-hidden="true" pointer-events-none select-none`, nằm **dưới** nội dung (`z-0`, nội dung `relative z-10`).
- Trên mobile (`< md`) ẩn bớt trang trí phụ (`hidden md:block`); giữ tối đa 2 phần tử.
- Độ mờ trang trí ≤ 60%; không đặt họa tiết ngay sau chữ nhỏ/đoạn văn.
- Ảnh mẫu mặc trang phục, giá bán và nút "Thêm vào giỏ" phải luôn là thứ nổi bật nhất trong khung nhìn.

---

## 3. Layout & Responsive

### 3.1. Breakpoint (mặc định Tailwind)

| Thiết bị | Chiều rộng thiết kế | Tiền tố |
|---|---|---|
| Mobile | 375 (từ 0) | (không tiền tố) |
| Tablet | 768 | `md:` |
| Desktop | 1280 | `lg:` (1024) / `xl:` (1280) |

### 3.2. Container

```
mx-auto w-full max-w-7xl px-4 sm:px-6 lg:px-8
```

> **Ngoại lệ Full-Bleed:** Khối `HeroBanner` ở trang chủ (khi không lọc/tìm kiếm) nằm **ngoài** container giới hạn chiều rộng, chiếm trọn `w-full` từ mép trái sang mép phải màn hình, và chỉ đặt `container` ở lớp nội dung chữ/nút bên trong nó.

### 3.3. Lưới sản phẩm

```
grid grid-cols-2 gap-3 md:grid-cols-3 md:gap-4 xl:grid-cols-4 xl:gap-6
```

### 3.4. Khung trang

- **MainLayout:** `AnnouncementBar` (không sticky) → `Navbar (sticky)` → `<main className="min-h-[calc(100vh-4rem)]">` (trang chủ tự quản lý padding dọc từng section để `HeroBanner` sát ngay dưới `Navbar`; các trang con bọc `<div className="py-6 md:py-10">`) → `Footer`. Có `ChatWidget` nổi và `ScrollToTop` nổi (xuất hiện khi cuộn > 1 màn hình, đặt `bottom-4 left-4 lg:left-auto lg:right-24`).
- **AdminLayout:** Sidebar `w-64` (hiện từ `lg:`; dưới `lg` là drawer mở bằng nút menu) + Topbar `h-16` + nội dung `p-4 md:p-6`.
- Không để trang cuộn ngang. Bảng rộng đặt trong `overflow-x-auto`.

---

## 4. Icon & hình ảnh

- Dùng thư viện **`lucide-react`**. Cỡ chuẩn `size-5` (20px), trong nút nhỏ `size-4`, icon lớn trang trí `size-8+`.
- Icon dùng: `ShoppingCart`, `Search`, `User`, `Menu`, `X`, `Heart` (không bắt buộc), `Star`, `Plus`, `Minus`, `Trash2`, `Pencil`, `Shirt`, `Package`, `ClipboardList`, `LogOut`, `Sparkles` (AI Stylist), `MessageCircle` (chat), `Send`, `ChevronLeft/Right/Down`, `Filter`, `CheckCircle2`, `AlertCircle`, `Info`, `Ruler` (bảng size), `SlidersHorizontal`.
- **Icon bổ sung:** `Truck`, `Wallet`, `RotateCcw`, `Headphones`, `ShieldCheck`, `Tag`, `Home`, `MapPin`, `Mail`, `Lock`, `Eye`, `EyeOff`, `Flame`, `Zap`, `Clock`, `Quote`, `ArrowRight`, `ArrowUp`, `Share2`. Không dùng icon logo thương hiệu (Facebook/TikTok...) vì lucide-react không còn cung cấp; mạng xã hội dùng nút tròn chứa chữ cái hoặc emoji.
- **Hình trang trí:** chỉ dùng emoji, hình khối CSS và SVG nội bộ (mục 2.7.3); không tải ảnh minh họa từ CDN.
- Icon chỉ có tác dụng trang trí: `aria-hidden="true"`. Nút chỉ có icon phải có `aria-label`.
- **Ảnh sản phẩm quần áo:** ưu tiên tỉ lệ dọc **`aspect-[3/4]`** (hoặc `aspect-square` nếu ảnh nguồn vuông, thống nhất toàn site) `object-cover object-top` (căn trên để không cắt mất phần cổ/vai người mẫu), `loading="lazy"`, có `alt` = tên sản phẩm. Khi ảnh lỗi: hiển thị khối `bg-primary-50` kèm icon `Shirt` ở giữa (`onError`).
- **Ảnh banner trang chủ (Hero Full-Bleed):** tỉ lệ ngang rộng (`min-h-[460px] md:min-h-[560px] lg:min-h-[620px]`), `object-cover object-center`, ưu tiên tải ngay (`fetchPriority="high"`, **không** đặt `loading="lazy"` cho ảnh hero để đảm bảo LCP nhanh).
- **Ảnh mock:** `https://picsum.photos/seed/{id}/600/800` cho thẻ quần áo và `https://picsum.photos/seed/fashion-hero/1920/800` cho banner trang chủ.

---

## 5. Hệ thống Motion

| Hiệu ứng | Lớp Tailwind / cách làm |
|---|---|
| Hover/focus mềm | `transition-colors duration-150` / `transition-shadow duration-200` |
| Nâng thẻ khi hover | `hover:shadow-md hover:-translate-y-0.5 transition` (thẻ sản phẩm: xem 6.11) |
| Phóng ảnh khi hover | Ảnh trong khung `overflow-hidden`: `transition-transform duration-300 group-hover:scale-105` |
| Nhấn nút | `active:scale-95 transition-transform` |
| Mở modal/drawer | mờ dần + trượt nhẹ, 200ms |
| Toast | trượt vào từ phải (desktop) / từ trên (mobile), tự tắt sau **4 giây** |
| Skeleton | `animate-pulse bg-gray-200 rounded-md` |
| Spinner | `animate-spin` |
| Emoji/hình khối bay | `animate-float` / `animate-float-slow`; chỉ ở hero, empty state, trang lỗi |
| Badge giỏ khi tăng | `animate-pop` mỗi lần số lượng đổi (đổi `key` để chạy lại) |
| Xuất hiện khi cuộn | Component `Reveal`: `opacity-0 translate-y-4` → `opacity-100 translate-y-0 transition duration-500`; dùng `IntersectionObserver`, **chỉ chạy 1 lần**, so le `delay-75/150/200` giữa các thẻ trong cùng hàng |
| Thanh thông báo chạy chữ (mobile) | `animate-marquee` trên dải lặp đôi nội dung; desktop hiển thị tĩnh căn giữa |
| Thêm giỏ thành công | Nút đổi sang "✓ Đã thêm" 1,2 giây rồi trở lại; badge giỏ `animate-pop` |
| Đặt hàng thành công | Vòng check `animate-pop`; vài emoji ✨🛍️ bay nhẹ `animate-float` quanh khối |

Tôn trọng người dùng giảm chuyển động: thêm `motion-reduce:transition-none motion-reduce:animate-none` cho hiệu ứng trang trí; `Reveal` hiển thị nội dung ngay (không dịch chuyển) khi `prefers-reduced-motion`. Nếu JS lỗi, nội dung vẫn phải hiện đủ (không ẩn vĩnh viễn).

---

## 6. Component dùng chung

Đặt trong `src/components/ui/`, tên file trùng tên component (PascalCase). Mỗi component nhận `className` để ghi đè nhẹ.

### 6.1. Button

| Thuộc tính | Giá trị |
|---|---|
| `variant` | `primary` · `secondary` · `outline` · `ghost` · `danger` |
| `size` | `sm` · `md` (mặc định) · `lg` |
| Trạng thái | default · hover · pressed · focus-visible · disabled · loading |
| Props thêm | `loading` (hiện Spinner, tự `disabled`), `leftIcon`, `rightIcon`, `fullWidth` |

Lớp nền tảng: `inline-flex items-center justify-center gap-2 rounded-lg font-semibold transition-colors disabled:opacity-50 disabled:cursor-not-allowed`

| Variant | Lớp |
|---|---|
| primary | `bg-primary-700 text-white hover:bg-primary-800 active:bg-primary-900` |
| secondary | `bg-secondary-500 text-white hover:bg-secondary-600 active:bg-secondary-700` |
| outline | `border border-line bg-white text-ink hover:bg-gray-50` |
| ghost | `text-ink hover:bg-gray-100` |
| danger | `bg-red-700 text-white hover:bg-red-800` |

| Size | Lớp |
|---|---|
| sm | `h-9 px-3 text-sm` |
| md | `h-11 px-4 text-sm md:text-base` |
| lg | `h-12 px-6 text-base` |

Vùng bấm tối thiểu **44×44px** trên mobile (dùng `md`/`lg` cho nút chính; `sm` chỉ dùng trong bảng).

**Biến thể bổ sung** — dùng đúng màu đã có:

| Variant | Lớp | Dùng cho |
|---|---|---|
| light | `bg-white text-primary-700 hover:bg-primary-50` | CTA chính trên nền gradient/hero |
| onDark | `border border-white/60 text-white hover:bg-white/15 backdrop-blur-xs` | Nút phụ trên nền hero full-bleed/tối |
| soft | `bg-primary-50 text-primary-700 hover:bg-primary-100` | Nút phụ nhẹ ("Mua ngay", "Xem tất cả") |
| link | `h-auto p-0 text-primary-700 hover:underline underline-offset-4` | Liên kết "Xem tất cả →" |

Bổ sung chung: `active:scale-95 motion-reduce:active:scale-100`. CTA chính của mỗi trang (một nút duy nhất) thêm `shadow-brand hover:-translate-y-0.5`; nút `secondary` nổi bật (chat stylist, AI) dùng `shadow-violet`.

### 6.2. Input / Textarea / Select

- Cấu trúc: `Label` (trên) → ô nhập → `helper/error` (dưới). Nhãn gắn bằng `htmlFor`; lỗi gắn `aria-describedby`, `aria-invalid="true"`.
- Lớp ô nhập: `h-11 w-full rounded-lg border border-line bg-white px-3 text-base placeholder:text-ink-subtle focus:border-secondary-500 focus:ring-2 focus:ring-secondary-200`
- Lỗi: viền `border-red-500`, thông báo `text-sm text-red-700` kèm icon `AlertCircle`.
- Trạng thái: default · focus · filled · error · disabled (`bg-gray-100 text-ink-subtle`).
- Textarea: `min-h-28 py-2`. Ô mật khẩu có nút hiện/ẩn (`Eye`/`EyeOff`).

### 6.3. QuantityStepper

`[ − ] 1 [ + ]` — nút `size-10 rounded-lg border`, số ở giữa `w-12 text-center`. Rule: min **1**, max **tồn kho**; chạm giới hạn thì nút tương ứng `disabled`. Có `aria-label` "Giảm số lượng" / "Tăng số lượng".

### 6.4. Badge / OrderBadge

`Badge` chung (neutral, success, warning, danger, info). `OrderBadge` nhận `status` và áp bảng 2.4.

### 6.5. Toast

- Vị trí: desktop `top-4 right-4`, mobile `top-3 inset-x-3`. Rộng tối đa `max-w-sm`.
- 4 loại: `success`, `error`, `info`, `warning`; mỗi loại có icon, viền trái dày 4px theo màu semantic.
- Tự tắt 4s; có nút đóng; `role="status"` (error dùng `role="alert"`). Tối đa 3 toast cùng lúc.

### 6.6. Modal & ConfirmDialog

- Overlay `bg-black/50`; hộp `bg-white rounded-xl shadow-xl max-w-md w-full p-6` (Modal bảng size có thể dùng `max-w-lg`). Đóng bằng `Esc`, bấm nền, nút `X`. Khóa cuộn nền, bẫy focus, trả focus về nút mở.
- `ConfirmDialog`: tiêu đề + mô tả + 2 nút (`Hủy` outline, `Xóa`/`Xác nhận` danger hoặc primary).

### 6.7. Table (dùng cho Admin & lịch sử)

- Bọc `overflow-x-auto rounded-xl border border-line bg-white`.
- Header `bg-gray-50 text-xs font-semibold uppercase text-ink-muted`; hàng `border-t border-line hover:bg-gray-50`; ô `px-4 py-3 text-sm`.
- Có trạng thái: loading (5 hàng skeleton), empty (EmptyState trong bảng), error.

### 6.8. Pagination

`Trước · 1 2 3 … N · Sau`. Trang hiện tại `bg-primary-700 text-white`. Mobile: chỉ hiện `Trước`, "Trang x / N", `Sau`. Nút `size-10`.

### 6.9. Skeleton / Spinner

- `ProductCardSkeleton`: ảnh tỉ lệ `aspect-[3/4]` + 2 dòng chữ + 1 dòng giá + 1 nút, đều `animate-pulse`.
- `Spinner`: `size-5 animate-spin` (trong nút), `size-8` (giữa trang).

### 6.10. EmptyState / ErrorState

- `EmptyState`: icon lớn `text-primary-300`, tiêu đề H3, mô tả `text-ink-muted`, tùy chọn 1 nút hành động. Căn giữa, `py-16`.
- `ErrorState`: icon `AlertCircle` đỏ, thông báo lỗi, nút **"Thử lại"** (gọi lại API).

### 6.11. ProductCard (Thời trang)

```
┌────────────────────┐
│ [-20%]        [♡]  │  ← trái: nhãn (giảm giá 🔹 / Hết hàng); phải: yêu thích 🔹
│                    │
│   [ảnh dọc 3:4]    │  ← phóng nhẹ khi hover, object-top
│                    │
│ [👕 Áo thun]       │  ← chip danh mục, góc trái dưới ảnh
├────────────────────┤
│ Áo Thun Boxy       │  line-clamp-2, text-sm font-medium
│ Cotton 250gsm      │
│ S · M · L · XL 🔹  │  dải size có sẵn (tối đa 4 tag)
│ ★ 4.8 · Đã bán 210 │  text-xs text-ink-muted (Đã bán 🔹)
│ 249.000 ₫  310.000 │  giá + giá gốc gạch ngang 🔹
│ Chỉ còn 3 ▓▓░░░░   │  chỉ hiện khi 1 ≤ tồn kho ≤ 10
│ [🛒 Thêm vào giỏ]  │  Button primary fullWidth, size md
└────────────────────┘
```

| Phần | Đặc tả |
|---|---|
| Lớp thẻ | `group relative flex flex-col overflow-hidden rounded-xl border border-line bg-white shadow-soft transition duration-200 hover:-translate-y-1 hover:border-primary-200 hover:shadow-brand motion-reduce:hover:translate-y-0` |
| Khung ảnh | `relative aspect-[3/4] overflow-hidden bg-primary-50`; ảnh `h-full w-full object-cover object-top transition-transform duration-300 group-hover:scale-105`, `loading="lazy"`, `alt` = tên |
| Nhãn góc trái | Xếp dọc, tối đa 2 nhãn: ① `Hết hàng` (`bg-gray-900/80 text-white text-xs rounded-md px-2 py-1`); ② `-{n}%` 🔹 (`bg-primary-700 text-white text-xs font-bold rounded-md px-2 py-1`); ③ `Bán chạy` khi rating ≥ 4,8 (`bg-secondary-500 text-white text-xs font-semibold rounded-md px-2 py-1`, kèm icon `Flame size-3`) |
| Yêu thích 🔹 | Góc phải trên, `size-9 rounded-full bg-white/90 shadow-soft`, icon `Heart` (đã thích: `fill-primary-500 text-primary-500`, chạy `animate-pop`). Không bắt buộc; nếu làm, lưu cục bộ |
| Chip danh mục | `absolute bottom-2 left-2 rounded-full bg-white/90 px-2 py-0.5 text-xs font-medium text-ink-muted` + emoji danh mục (2.7.4) |
| Tên | `text-sm font-medium line-clamp-2`, `min-h-10` để các thẻ cao đều nhau |
| Dải size 🔹 | Nếu sản phẩm có danh sách `sizes` (ví dụ `["S", "M", "L", "XL"]`): hàng chip nhỏ `rounded border border-line bg-gray-50 px-1.5 py-0.5 text-[11px] font-medium text-ink-muted` |
| Hàng meta | `★ 4.8` (icon sao `text-amber-500 fill-amber-500`) · "Đã bán {n}" 🔹 `text-xs text-ink-muted` |
| Giá | `text-lg font-bold text-primary-700`; giá gốc 🔹 `text-sm text-ink-subtle line-through` |
| Thanh tồn kho | Khi `1 ≤ tồn kho ≤ 10`: dòng "Chỉ còn {n}" `text-xs font-semibold text-amber-700` + thanh `h-1.5 rounded-full bg-gray-100`, phần đầy `bg-primary-500` |
| Nút | `Button primary fullWidth md`, icon `ShoppingCart size-4`, nhãn "Thêm vào giỏ" (nếu bắt buộc chọn size từ danh sách và chưa chọn, bấm mở nhanh trang chi tiết hoặc chọn size mặc định đầu tiên còn hàng kèm toast thông báo) |

- Bấm vào ảnh/tên → `/products/:id`. Bấm nút thêm giỏ, tim hoặc chip **không** điều hướng (chặn nổi bọt sự kiện).
- `stock = 0`: nhãn `Hết hàng`, nút `disabled` ghi "Hết hàng", ảnh `opacity-60 grayscale`, không có hiệu ứng nâng khi hover.
- Sau khi thêm giỏ: nút đổi "✓ Đã thêm" 1,2s, toast "Đã thêm vào giỏ hàng", badge giỏ tăng và `animate-pop`.
- **Biến thể nhỏ** (carousel, gợi ý, kết quả chat): `w-44 md:w-56 shrink-0 snap-start`; ẩn chip danh mục, dải size và thanh tồn kho, giữ ảnh `aspect-[3/4]`, tên, giá, nút `sm`.
- `ProductCardSkeleton` khớp hình dáng thẻ mới: ảnh `aspect-[3/4]` + chip + 2 dòng tên + dòng meta + giá + nút.

### 6.12. CartItem

Desktop: hàng ngang `[ảnh 72×96 (tỉ lệ 3:4)] [tên + tag Size/Màu 🔹 + đơn giá] [stepper] [thành tiền] [xóa]`. Mobile: ảnh + tên/size/đơn giá ở trên, dưới là stepper và thành tiền, nút xóa góc phải trên. Thành tiền `font-semibold`, xóa là nút ghost có `aria-label`.

### 6.13. Navbar

- Cao `h-16`, `sticky top-0 z-40 border-b border-line bg-white/95 backdrop-blur`. Khi cuộn xuống hơn 8px: thêm `shadow-soft` (chuyển mềm `transition-shadow`).
- **Desktop (`lg:`):** `Logo` · `SearchBar` (giữa, `max-w-xl flex-1`) · `Yêu thích 🔹` · `Giỏ hàng + badge` · `Menu người dùng / nút Đăng nhập`.
- **SearchBar:** `h-11 rounded-full bg-gray-100 px-4`; icon `Search` bên trái; khi focus đổi `bg-white ring-2 ring-secondary-200 border-secondary-500`; nút xóa `X` khi có chữ; có gợi ý từ khóa nhanh (chip danh mục quần áo) trong dropdown khi focus ô trống.
- **Mobile:** `Hamburger` · `Logo` · `Search icon` · `Giỏ hàng`. Bấm hamburger mở Drawer trái (đầu drawer là khối chào `bg-gradient-to-r from-primary-50 to-secondary-50` có avatar/lời chào; tiếp theo là danh mục quần áo kèm emoji, Đơn hàng, Hồ sơ, Đăng nhập/Đăng xuất). Bấm search icon mở ô tìm kiếm chiếm hết thanh.
- **Badge giỏ:** `absolute -top-1 -right-1 min-w-5 h-5 rounded-full bg-primary-700 text-white text-xs`; ẩn khi 0; hiển thị `9+` khi lớn hơn 9; `animate-pop` mỗi khi số đổi.
- **Menu người dùng:** Avatar chữ cái đầu (`bg-primary-100 text-primary-700`) + họ tên (ẩn tên ở `md` trở xuống) → dropdown `shadow-md rounded-xl` có phần đầu hiển thị họ tên + email, rồi: `Hồ sơ`, `Đơn hàng của tôi`, `Quản trị` (chỉ ADMIN), đường kẻ, `Đăng xuất`.
- **Logo:** chữ "Funny" `text-primary-700` + "Shop" `text-secondary-500`, `font-bold text-xl`, kèm emoji 👕 (trang trí) nghiêng nhẹ `-rotate-12`, hover `rotate-0 transition-transform`.

### 6.14. Footer

- Nền `bg-gray-900 text-gray-100`; trên cùng là **vạch gradient** `h-1` (mục 2.7.2).
- Lưới `grid gap-8 md:grid-cols-2 lg:grid-cols-4`, trên mobile 1 cột, mỗi nhóm có thể thu gọn dạng accordion:
  1. **Thương hiệu:** Logo (chữ "Shop" dùng `text-secondary-300` để đủ tương phản trên nền tối) + câu giới thiệu ngắn ("Thời trang trẻ trung, năng động mỗi ngày") + nút mạng xã hội `size-10 rounded-full bg-white/10 hover:bg-white/20` (chữ cái/emoji).
  2. **Danh mục:** 5 danh mục quần áo kèm emoji.
  3. **Hỗ trợ:** Hướng dẫn chọn size · Chính sách đổi trả 7 ngày · Giao hàng · Liên hệ 🔹 (liên kết chỉ hiện nếu có nội dung/trang tương ứng).
  4. **Liên hệ:** địa chỉ cửa hàng, SĐT, email (icon `MapPin`, `Phone`, `Mail`), giờ mở cửa.
- Hàng "Thanh toán": chip `COD – Thanh toán khi nhận hàng` (`rounded-md bg-white/10 px-2 py-1 text-xs`).
- Dòng dưới cùng `border-t border-white/10 text-sm text-gray-300`: bản quyền (trái) + "Thiết kế với 💜 tại Việt Nam" (phải).
- Chữ phụ trên nền tối tối thiểu `text-gray-300`; liên kết hover `text-white underline underline-offset-4`.

### 6.15. SidebarAdmin

Nền `bg-gray-900 text-gray-100`, mục `rounded-lg px-3 py-2`, mục đang chọn `bg-primary-700 text-white`. Mục: `Sản phẩm` (`Shirt`), `Đơn hàng` (`ClipboardList`), `Về cửa hàng`, `Đăng xuất`. Dưới `lg`: ẩn, mở bằng Drawer.

### 6.16. ChatWidget (Trợ lý Stylist AI)

| Phần | Đặc tả |
|---|---|
| Nút mở | `fixed bottom-4 right-4 z-[45] size-14 rounded-full bg-secondary-500 text-white shadow-lg`, icon `MessageCircle`, `aria-label="Mở trợ lý phối đồ"`. Mobile: đặt `bottom-20` nếu có thanh dưới. |
| Panel (desktop) | `fixed bottom-24 right-4 w-[380px] h-[560px] rounded-2xl bg-white shadow-xl border border-line flex flex-col` |
| Panel (mobile) | `fixed inset-x-0 bottom-0 h-[85dvh] rounded-t-2xl` (hoặc toàn màn hình) |
| Header | nền `bg-secondary-500 text-white`, tiêu đề "Stylist AI FunnyShop", nút thu nhỏ/đóng |
| Tin nhắn người dùng | căn phải, `bg-secondary-500 text-white rounded-2xl rounded-br-md px-3 py-2` |
| Tin nhắn AI | căn trái, `bg-gray-100 text-ink rounded-2xl rounded-bl-md px-3 py-2` |
| Card sản phẩm trong chat | khung nhỏ ngang: ảnh 48×64 + tên + giá + link "Xem" → `/products/:id` |
| Đang trả lời | 3 chấm nhảy `animate-bounce` trong bong bóng AI |
| Ô nhập | dưới cùng, `Enter` gửi, `Shift+Enter` xuống dòng, nút `Send` |
| Lỗi/timeout | bong bóng đỏ nhạt "Mình chưa trả lời được lúc này." + nút **Thử lại** |
| Gợi ý nhanh | chip ở lời chào: "Tư vấn chọn size áo", "Gợi ý outfit đi chơi cuối tuần", "Mẫu áo bán chạy" |

### 6.17. AnnouncementBar

`h-9 bg-secondary-700 text-white text-sm font-medium`, căn giữa. Nội dung do cấu hình (ví dụ "🚚 Miễn phí giao hàng toàn quốc · ↩ Đổi size miễn phí trong 7 ngày"). Mobile: chạy chữ `animate-marquee`; desktop: tĩnh. Có nút `X` đóng (nhớ cho đến hết phiên). Chỉ nêu ưu đãi/chính sách **có thật** (xem 🔹).

### 6.18. SectionHeader

Dùng đầu mỗi khối lớn thay cho một dòng H2 trơ:

```
[✨ Bộ sưu tập]                                 Xem tất cả →
Trang phục bán chạy nhất
━━━━ (gạch nhấn ngắn)
Mô tả ngắn một dòng (tùy chọn)
```

- Eyebrow: `inline-flex items-center gap-1 rounded-full bg-primary-100 px-3 py-1 text-xs font-semibold text-primary-700` (khối nền `secondary-50` thì dùng `bg-secondary-100 text-secondary-700`).
- Tiêu đề: H2. Gạch nhấn: `mt-2 h-1 w-12 rounded-full bg-primary-500` (hoặc `bg-secondary-500`).
- Bên phải: `Button link` "Xem tất cả" + icon `ArrowRight`; mobile đưa xuống dưới tiêu đề.

### 6.19. CategoryTile & CategoryGrid

- Lưới `grid grid-cols-3 gap-3 md:grid-cols-6 md:gap-4`: ô "Tất cả" + 5 danh mục quần áo.
- Thẻ: `group flex flex-col items-center gap-2 rounded-2xl p-4 text-center shadow-soft transition hover:-translate-y-1 hover:shadow-md`, nền theo 2.7.4.
- Sticker emoji `size-12 rounded-2xl` (nghiêng `-rotate-6`, hover `rotate-0`), tên `text-sm font-semibold`, số sản phẩm 🔹 `text-xs text-ink-muted`.
- Đang chọn: `ring-2 ring-primary-700` + icon `CheckCircle2 size-4` góc phải trên. Bấm = đặt `?category=` và cuộn mượt tới `#products`.
- Mobile có thể cuộn ngang `snap-x` thay vì xuống hàng.

### 6.20. TrustBar

Dải 4 mục ngay dưới Hero Banner: `grid grid-cols-2 gap-4 md:grid-cols-4`, mỗi mục là sticker icon `size-11 rounded-xl bg-primary-50 text-primary-700` (xen kẽ `bg-secondary-50 text-secondary-700`) + tiêu đề `text-sm font-semibold` + mô tả `text-xs text-ink-muted`.

| Icon | Tiêu đề gợi ý | Mô tả gợi ý |
|---|---|---|
| `Truck` | Giao hàng toàn quốc | Nhận hàng tận nhà 2–4 ngày |
| `Wallet` | Thanh toán khi nhận hàng | Kiểm tra hàng trước khi trả (COD) |
| `RotateCcw` 🔹 | Hỗ trợ đổi size | Đổi size linh hoạt trong 7 ngày |
| `Sparkles` 🔹 | Stylist AI tư vấn | Gợi ý phối đồ & chọn size 24/7 |

Nội dung phải khớp thực tế SRS/chủ shop; mục nào không có cam kết thì bỏ.

### 6.21. Carousel

Hàng cuộn ngang: `flex snap-x snap-mandatory gap-3 overflow-x-auto pb-2 scroll-smooth`, mỗi phần tử `snap-start`. Desktop thêm 2 nút tròn `ChevronLeft/Right` (`size-10 rounded-full bg-white shadow-md`, `aria-label` "Trước/Sau", ẩn khi tới đầu/cuối). Cho phép kéo bằng bàn phím (Tab qua thẻ). Có skeleton 4–6 thẻ khi tải; rỗng thì ẩn cả khối.

### 6.22. Rating, Breadcrumb, Tabs, ProgressBar, StepIndicator

| Component | Đặc tả |
|---|---|
| `Rating` | 5 sao `size-4`, đầy/nửa/rỗng (`text-amber-500` / `text-gray-300`), kèm số `4.8` và `aria-label="Đánh giá 4,8 trên 5"` |
| `Breadcrumb` | `text-sm text-ink-muted`; ngăn cách `ChevronRight size-4`; mục cuối `text-ink font-medium` (`aria-current="page"`); icon `Home` ở mục đầu; mobile cắt giữa bằng "…" |
| `Tabs` | Thanh `border-b border-line`; tab đang chọn `border-b-2 border-secondary-500 text-secondary-700 font-semibold`; điều hướng bằng phím mũi tên; `role="tablist"` |
| `ProgressBar` | Khung `h-2 rounded-full bg-gray-100`, phần đầy `bg-primary-500` (hoàn thành 100% → `bg-green-600`); nhãn chữ bên trên, không chỉ dựa vào màu |
| `StepIndicator` | Hàng ngang các bước: vòng `size-8 rounded-full`; đã qua `bg-primary-700 text-white` + `Check`; hiện tại `bg-white border-2 border-primary-700 text-primary-700 ring-4 ring-primary-100`; chưa tới `bg-gray-200 text-ink-muted`; đường nối `h-0.5` đổi `bg-primary-700` khi đã qua. Mobile: chỉ hiện nhãn của bước hiện tại |

### 6.23. Khối nội dung trang chủ

| Component | Đặc tả |
|---|---|
| `HeroBanner` | **Full-bleed tràn chiều ngang** — mô tả chi tiết ở 7.1 |
| `PromoBanners` | 2 thẻ `rounded-2xl p-6 md:p-8 overflow-hidden relative` (`bg-secondary-50` và `bg-primary-50`), emoji lớn `text-6xl animate-float-slow` góc phải (👕 và 👗), tiêu đề H3 ("Basic Everyday – Thoải mái mỗi ngày", "Streetwear Vibe – Cá tính xuống phố"), mô tả 1 dòng, `Button link` dẫn tới danh mục. Không nêu giảm giá nếu chưa có dữ liệu |
| `Testimonials` 🔹 | 3 thẻ `rounded-2xl bg-white p-5 shadow-soft`: icon `Quote` `text-secondary-300`, lời nhận xét về chất vải/form dáng `text-sm`, `Rating`, avatar chữ cái + tên. Mobile: carousel. Nội dung do chủ shop cung cấp; **không** dùng đánh giá giả ở bản thật |
| `NewsletterBlock` 🔹 | Gradient thương hiệu `rounded-3xl p-6 md:p-10`, tiêu đề trắng lớn ("Nhận thông báo bộ sưu tập mới"), ô email `bg-white` + nút `light`. Chỉ làm khi có API; chưa có thì **bỏ khối** |
| `FlashSale` 🔹 | `rounded-3xl bg-primary-50 bg-dots p-6 md:p-8`; tiêu đề "⚡ Deal thời trang hôm nay"; bộ đếm giờ 3 ô `bg-primary-700 text-white rounded-lg px-2 py-1 font-bold tabular-nums`; `Carousel` thẻ nhỏ. Chỉ hiện khi API có giá khuyến mãi/thời hạn |

Mọi khối tải dữ liệu mới **phải có** skeleton, empty (ẩn khối hoặc thông điệp thân thiện) và error theo mục 8.

---

## 7. Đặc tả từng màn hình

> Mỗi màn hình đều phải có: **loading → empty → error** khi gọi API, và hoạt động tốt ở 375 / 768 / 1280.

### 7.1. Trang chủ / Danh sách sản phẩm — `/` (Hero Full-Bleed)

```
┌───────────────────────────────────────────────────────────────────────────────┐
│ 🚚 Giao hàng toàn quốc · ↩ Đổi size miễn phí trong 7 ngày                 [✕] │ AnnouncementBar
├───────────────────────────────────────────────────────────────────────────────┤
│ 👕FunnyShop   [🔍 Tìm áo thun, quần jeans, váy đầm...        ][Tìm]  🛒(3) [AU] │ Navbar (sticky)
├═══════════════════════════════════════════════════════════════════════════════┤
║ HERO FULL-BLEED (w-full tràn 100% chiều ngang màn hình, sát 2 mép trái/phải)  ║
║ [Ảnh nền Lookbook thời trang chất lượng cao + lớp phủ gradient thương hiệu]    ║
║   ┌─ nội dung căn giữa trong container max-w-7xl ─────────────────────────┐   ║
║   │ [✨ Bộ sưu tập Mới 2026]                     ┌────┐ ┌────┐ ┌────┐     │   ║
║   │ Phong cách trẻ trung,                        │Áo  │ │Váy │ │Áo  │     │   ║
║   │ tự tin mỗi ngày!                             │Thun│ │Đầm │ │Khoác│     │   ║
║   │ Chất liệu thoáng mát, chuẩn form dáng Việt.  └────┘ └────┘ └────┘     │   ║
║   │ [ Khám phá bộ sưu tập → ] [ 🔥 Mẫu bán chạy ]   (thẻ Lookbook nổi)    │   ║
║   │ ✨ 50+ thiết kế mới · 🏷 5 danh mục thời trang                        │   ║
║   └───────────────────────────────────────────────────────────────────────┘   ║
╠═══════════════════════════════════════════════════════════════════════════════╣
│  ┌─ TrustBar (bg-white border-b border-line, full-width) ─────────────────┐   │
│  │ 🚚 Giao toàn quốc │ 💵 COD │ ↩ Đổi size 7 ngày │ ✨ Stylist AI 24/7     │   │
│  └─────────────────────────────────────────────────────────────────────────┘  │
│                                                                               │
│  ┌─ Container max-w-7xl ───────────────────────────────────────────────────┐  │
│  │ ✨ Khám phá                                                             │  │
│  │ DANH MỤC TRANG PHỤC                                                     │  │
│  │ ▔▔▔▔                                                                    │  │
│  │ [✨ Tất cả] [👕 Áo thun] [👔 Áo sơ mi] [👖 Quần] [👗 Váy đầm] [🧥 Khoác] │  │
│  │                                                                         │  │
│  │ ┌─ 🔥 Trang phục bán chạy nhất ─────────────────────── Xem tất cả → ──┐ │  │
│  │ │ [card 3:4] [card 3:4] [card 3:4] [card 3:4] [card 3:4] ← Carousel    │ │  │
│  │ └──────────────────────────────────────────────────────────────────────┘ │  │
│  │                                                                         │  │
│  │ ┌─ Banner đôi ────────────────────┐ ┌─────────────────────────────────┐ │  │
│  │ │ 👕 Basic Everyday               │ │ 👗 Streetwear & Nữ tính         │ │  │
│  │ └─────────────────────────────────┘ └─────────────────────────────────┘ │  │
│  │                                                                         │  │
│  │ #products                                                               │  │
│  │ [Tất cả][👕 Áo thun][👔 Sơ mi]… (chip dính)  [Sắp xếp ▾]   24 sản phẩm  │  │
│  │ ┌──────┐ ┌──────┐ ┌──────┐ ┌──────┐                                     │  │
│  │ │ 3:4  │ │ 3:4  │ │ 3:4  │ │ 3:4  │   Grid 4 cột (xl), 3 (md), 2 (base) │  │
│  │ └──────┘ └──────┘ └──────┘ └──────┘                                     │  │
│  │                    < Trước  1 2 3 …  Sau >                              │  │
│  └─────────────────────────────────────────────────────────────────────────┘  │
├═══════════════════════════════════════════════════════════════════════════════┤
║ Khách nói gì về FunnyShop (full-bleed, nền secondary-50)                      ║
╠═══════════════════════════════════════════════════════════════════════════════╣
║ Bản tin ưu đãi thời trang (full-bleed, gradient)                              ║
╠═══════════════════════════════════════════════════════════════════════════════╣
║ Footer (gray-900, full-bleed)                                                 ║
└───────────────────────────────────────────────────────────────────────────────┘
```

**Hero Banner Full-Bleed (`HeroBanner`):**
- **Kích thước & bố cục:** `relative w-full overflow-hidden min-h-[460px] md:min-h-[540px] lg:min-h-[600px] flex items-center` — **tràn 100% chiều ngang màn hình** (không bọc trong container hay bo góc ngoài), đặt ngay sát dưới `Navbar`.
- **Lớp nền (3 lớp xếp chồng):**
  1. `<img>` ảnh banner thời trang/Lookbook toàn màn hình (`absolute inset-0 h-full w-full object-cover object-center`, `fetchPriority="high"`, `alt="Bộ sưu tập thời trang FunnyShop"`).
  2. Lớp phủ màu `absolute inset-0 bg-gradient-to-r from-gray-950/85 via-primary-900/70 to-secondary-900/45` đảm bảo chữ trắng bên trên luôn đạt tương phản WCAG AA trên mọi bức ảnh.
  3. Trang trí nhẹ: 2 blob ánh sáng `bg-primary-500/20 blur-3xl` lệch góc + 2–3 emoji thời trang bay nhẹ ở lề phải (`hidden md:block`, `opacity-60 animate-float`).
- **Lớp nội dung (căn theo lưới chuẩn):** `relative z-10 mx-auto w-full max-w-7xl px-4 py-12 sm:px-6 md:py-16 lg:px-8`, chia 2 phần trên `lg:` (`flex flex-col lg:flex-row lg:items-center lg:justify-between gap-8`):
  - **Trái (`lg:w-1/2`, text-white):**
    - Eyebrow pill: `inline-flex items-center gap-1.5 rounded-full bg-white/15 backdrop-blur-xs border border-white/25 px-3.5 py-1 text-sm font-semibold` "✨ Bộ sưu tập Thời trang Mới".
    - Tiêu đề Display: "Phong cách trẻ trung, tự tin mỗi ngày!" (cụm "tự tin mỗi ngày!" nhấn bằng gạch sóng `underline decoration-wavy decoration-primary-300 underline-offset-8`).
    - Mô tả: `text-base md:text-lg text-gray-100 max-w-xl` "Khám phá thiết kế hiện đại, chất liệu thoáng mát, chuẩn form dáng Việt."
    - Hai nút CTA: `Button light lg` "Khám phá ngay" (cuộn mượt tới `#products`) + `Button onDark lg` "Xem mẫu bán chạy" (`?sort=rating` hoặc cuộn tới khối Bán chạy).
    - Dòng số liệu thật từ API: `text-sm text-gray-200` "✨ {total}+ mẫu thiết kế · 🏷 5 danh mục thời trang".
  - **Phải (từ `lg:`):** Chồng 3 thẻ lookbook sản phẩm nổi bật (tỉ lệ `aspect-[3/4]`, nghiêng `-rotate-3` / `rotate-0` / `rotate-3`), viền trắng `border-2 border-white/80 rounded-2xl shadow-2xl`, `animate-float` (mỗi thẻ một tốc độ). Trên mobile/tablet (`< lg`) ẩn cụm thẻ này để ảnh nền Lookbook full-bleed tỏa sáng.
- **Tùy chọn Banner Slider 🔹:** Nếu chủ shop cấu hình nhiều banner chiến dịch (ví dụ: *Bộ sưu tập Hè*, *Sale cuối tuần*), thêm 2 nút điều hướng tròn `ChevronLeft/Right` ở hai mép màn hình (`hidden md:grid`) và dải chấm pagination nhỏ ở đáy banner.
- **Loading:** Khối skeleton full-width cùng chiều cao `min-h-[460px] md:min-h-[540px]` (không giật bố cục). Hero **không** phụ thuộc API để hiển thị chữ và nút CTA.

**Danh sách & bộ lọc**
- **Khi đang lọc/tìm/phân trang** (`q`, `category` có giá trị hoặc `page > 1`): **ẩn** HeroBanner, TrustBar, Bán chạy, Banner đôi, Đánh giá, Bản tin; thay bằng tiêu đề gọn "Kết quả cho “{q}”" / tên danh mục kèm `Breadcrumb` và nút "Xóa bộ lọc". Danh sách luôn là trọng tâm.
- **Thanh công cụ** `sticky top-16 z-30 bg-page/90 backdrop-blur py-3`: danh mục quần áo dạng chip cuộn ngang (`overflow-x-auto`, chip `rounded-full border border-line bg-white px-3 py-1.5 text-sm`, đang chọn `bg-primary-700 text-white border-primary-700`, kèm emoji) + select sắp xếp 5 lựa chọn: *Mặc định · Giá tăng dần · Giá giảm dần · Tồn kho nhiều nhất · Đánh giá cao nhất* + dòng "Tìm thấy 24 sản phẩm" `text-sm text-ink-muted`.
- **Chip bộ lọc đang bật:** hàng chip `bg-secondary-50 text-secondary-700` có nút `X` cho từng bộ lọc + "Xóa tất cả".
- **Mobile:** nút `Bộ lọc` mở bottom sheet chứa danh mục + sắp xếp; hiện số bộ lọc đang bật bằng badge `bg-primary-700`.
- **Đồng bộ URL:** `?q=&category=&sort=&page=`; F5 giữ nguyên trạng thái. Search debounce **300ms**; đổi bộ lọc thì về `page=1`.
- **Trạng thái:** loading = 8 `ProductCardSkeleton`; empty = icon `Shirt` trong sticker lớn trên nền `bg-grid` + "Không tìm thấy trang phục phù hợp" + gợi ý 3 danh mục + nút "Xóa bộ lọc"; error = ErrorState "Không tải được sản phẩm".
- Cuộn lên đầu danh sách khi đổi trang. Các khối được bọc `Reveal` (mục 5) để xuất hiện so le khi cuộn.
- **Nguồn dữ liệu khối "Bán chạy nhất":** gọi danh sách với `sort=rating`, lấy 8 sản phẩm đầu — không cần trường dữ liệu mới.

### 7.2. Chi tiết sản phẩm — `/products/:id`

```
Trang chủ > Áo thun & Polo > Áo Thun Boxy Cotton 250gsm         (Breadcrumb)
┌──────────────────────┐  ┌──────────────────────────────────────┐
│ [-20%]               │  │ [👕 Áo thun & Polo]                  │
│     Ảnh dọc 3:4      │  │ Áo Thun Boxy Cotton 250gsm (H1)      │
│   (bấm để phóng to)  │  │ ★★★★☆ 4.8 · Đã bán 210 🔹            │
│                      │  │ ┌ Giá ─────────────────────────────┐ │
│                      │  │ │ 249.000 ₫  310.000 ₫  [-20%]      │ │
│ [🔍 Phóng to] [Chia sẻ]│ │ └──────────────────────────────────┘ │
└──────────────────────┘  │ Màu sắc 🔹: [● Đen] [○ Trắng] [● Be]   │
                          │ Kích cỡ 🔹:  [S] [M] [L] [XL] 📏 Bảng size │
                          │ ● Còn hàng / Chỉ còn 3 sản phẩm      │
                          │ Số lượng: [ − ] 1 [ + ]               │
                          │ [🛒 Thêm vào giỏ hàng] [Mua ngay]     │
                          │ 🚚 Giao toàn quốc  💵 COD  ↩ Đổi size │
                          └──────────────────────────────────────┘
[ Mô tả & Chất liệu | Hướng dẫn bảo quản | Đánh giá 🔹 ]            (Tabs)
Nội dung tab…
✨ Phối đồ cùng mẫu này / Có thể bạn thích                Xem thêm →
[card][card][card][card]  ← Carousel cùng danh mục (trừ sản phẩm đang xem)
```

- Bố cục: mobile 1 cột (ảnh trên); từ `md:` 2 cột `md:grid-cols-2 gap-8`. Cột ảnh `md:sticky md:top-24 self-start`.
- **Ảnh:** khung `rounded-2xl border border-line bg-white p-2 shadow-soft`; ảnh `aspect-[3/4] rounded-xl object-cover object-top`; bấm mở `Modal` lightbox (`Esc` đóng). Có nhiều ảnh thì thêm hàng thumbnail `w-14 h-18 rounded-lg`, đang chọn `ring-2 ring-primary-700`; chỉ 1 ảnh thì không hiện thumbnail.
- **Khối giá:** `rounded-2xl bg-primary-50 p-4`, giá `text-3xl font-bold text-primary-700`; giá gốc + `DiscountBadge` 🔹.
- **Chọn Màu sắc & Kích cỡ (Size) 🔹:**
  - Chỉ hiển thị khi sản phẩm có trường `colors` / `sizes`.
  - **Chọn Size:** hàng nút `min-w-12 h-10 rounded-lg border font-semibold text-sm`; đang chọn: `border-primary-700 bg-primary-700 text-white`; hết size: `opacity-40 line-through cursor-not-allowed`. Bên cạnh nhãn "Kích cỡ" đặt nút link `Ruler size-4` **"Hướng dẫn chọn size"** mở `Modal` bảng quy đổi chiều cao/cân nặng (S, M, L, XL).
  - **Chọn Màu:** chip bo tròn có chấm màu + tên màu; đang chọn `ring-2 ring-primary-700 bg-primary-50`.
- **Tồn kho:** `> 5` hiện chip `Còn hàng` (icon `CheckCircle2`); `1–5` hiện "Chỉ còn {n} sản phẩm" (`text-amber-700`) kèm thanh tồn kho; `0` hiện "Hết hàng" và vô hiệu nút + stepper.
- **Hành động:** "Thêm vào giỏ hàng" (`Button primary lg`, `shadow-brand`) + "Mua ngay" (`Button soft lg`: thêm vào giỏ rồi chuyển `/checkout`, chưa đăng nhập thì theo luồng 7.4). Hai nút ngang từ `sm:`, xếp dọc trên mobile. Nút phụ `Heart` 🔹 và `Share2` (sao chép liên kết + toast "Đã sao chép liên kết").
- **Dải tin cậy nhỏ:** 3 dòng icon (`Truck`, `Wallet`, `RotateCcw` 🔹) `text-sm text-ink-muted` trong khung `border-t border-dashed border-line pt-4`.
- **Tabs:** Mô tả & Chất liệu (giữ xuống dòng, nêu rõ chất vải, form dáng, xuất xứ); Giao hàng & Đổi size (nội dung chính sách do chủ shop cung cấp); Đánh giá 🔹 (chỉ khi có API).
- **Sản phẩm liên quan:** `SectionHeader` + `Carousel` thẻ nhỏ, lấy cùng danh mục, loại trừ sản phẩm hiện tại; ít hơn 2 sản phẩm thì ẩn khối.
- **Mobile:** thanh dính đáy `sticky bottom-0 z-40 border-t border-line bg-white p-3 shadow-xl` gồm giá + stepper rút gọn + nút "Thêm vào giỏ".
- Loading: skeleton ảnh `aspect-[3/4]` + khối chữ + khối giá. Không tìm thấy (404 API): hiện trang "Sản phẩm không tồn tại" (kiểu trang lỗi 7.11) + nút về trang chủ.

### 7.3. Đăng nhập — `/login` & Đăng ký — `/register`

- **Nền trang:** `bg-gradient-to-br from-primary-50 via-white to-secondary-50` + 2 blob mờ (mục 2.7.3). Mobile: chỉ thẻ form; từ `lg:` chia **2 cột** `lg:grid-cols-2`.
- **Cột trái (chỉ `lg:`) – panel thương hiệu:** `rounded-3xl bg-gradient-to-br from-primary-600 to-secondary-600 p-10 text-white relative overflow-hidden`; Logo trắng, tiêu đề lớn "Chào mừng đến FunnyShop!", 3 dòng lợi ích có icon trong vòng `bg-white/20` ("Theo dõi đơn hàng dễ dàng", "Lưu số đo & địa chỉ giao hàng", "Hỏi Stylist AI để phối đồ"), emoji thời trang bay `animate-float`.
- **Cột phải – thẻ form:** `max-w-md bg-white rounded-2xl shadow-soft border border-line p-6 md:p-8`; trên cùng logo + tiêu đề + 1 dòng mô tả `text-ink-muted`. Mobile có dải emoji nhỏ phía trên thay cho panel trái.
- **Ô nhập có icon trái** (`Mail`, `Lock`, `User`) `text-ink-subtle`, ô padding trái `pl-10`; ô mật khẩu có nút hiện/ẩn.
- **Đăng nhập:** Email, Mật khẩu (có hiện/ẩn), nút "Đăng nhập" (`fullWidth`, loading khi gửi), dòng "Chưa có tài khoản? **Đăng ký**".
- **Đăng ký:** Họ tên, Email, Mật khẩu (kèm **thanh độ mạnh** 3 đoạn `h-1.5 rounded-full`: Yếu `bg-red-500`, Vừa `bg-amber-500`, Mạnh `bg-green-600`, luôn kèm nhãn chữ), Xác nhận mật khẩu (hiện `CheckCircle2` xanh khi khớp), nút "Tạo tài khoản", dòng "Đã có tài khoản? **Đăng nhập**".
- **Validate (hiện ngay dưới ô, khi rời ô hoặc khi gửi):**
  - Email sai định dạng: "Email không hợp lệ".
  - Mật khẩu dưới 6 ký tự: "Mật khẩu tối thiểu 6 ký tự".
  - Xác nhận không khớp: "Mật khẩu xác nhận không khớp".
  - Ô trống: "Vui lòng nhập {tên trường}".
- Lỗi từ server (sai mật khẩu, email đã tồn tại): khối cảnh báo đỏ phía trên form (icon `AlertCircle`).
- Sau đăng nhập thành công: về trang trước đó (nếu bị chuyển hướng từ checkout) hoặc `/`; ADMIN về `/admin/products`.

### 7.4. Giỏ hàng — `/cart`

```
Giỏ hàng (3 sản phẩm)
┌ 🚚 Mua thêm 150.000 ₫ để được miễn phí giao hàng 🔹 ┐
│ ▓▓▓▓▓▓▓▓░░░░                                        │
└─────────────────────────────────────────────────────┘
┌──────────────────────────────────────┐  ┌─ Tóm tắt đơn hàng ──┐
│ CartItem (Ảnh 3:4 + Tên + Size/Màu)  │  │▔▔▔ vạch gradient ▔▔▔│
│ CartItem                             │  │ Tạm tính   498.000 ₫│
│ CartItem                             │  │ Phí giao    Miễn phí│
│ [← Tiếp tục mua sắm]                 │  │ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ │
└──────────────────────────────────────┘  │ Tổng      498.000 ₫ │
✨ Gợi ý phối đồ thêm                     │ [Tiến hành đặt hàng]│
[card][card][card][card]                  │ 💵 Thanh toán khi   │
                                          │    nhận hàng (COD)  │
                                          └─────────────────────┘
```

- Từ `lg:` bố cục 2 cột (`lg:grid-cols-3`: danh sách chiếm 2, tóm tắt chiếm 1, tóm tắt `sticky top-20`). Mobile: tóm tắt nằm dưới, nút đặt hàng cố định đáy màn hình.
- **Thanh miễn phí giao hàng** 🔹: `rounded-xl border border-primary-200 bg-primary-50 p-4` + `ProgressBar`; ngưỡng đặt ở `constants.js` (`FREE_SHIP_THRESHOLD`). Đủ ngưỡng: đổi nội dung thành "🎉 Đơn hàng của bạn được miễn phí giao hàng". SRS không có phí giao/ngưỡng thì **bỏ khối**.
- **CartItem:** thẻ `rounded-xl border border-line bg-white p-3 shadow-soft`, ảnh `w-18 h-24 rounded-lg object-cover object-top`, bấm ảnh/tên về trang chi tiết; hiển thị badge Size/Màu 🔹 (ví dụ `Size: L · Đen`); thấy cảnh báo "Chỉ còn {n}" khi tồn kho ≤ 5.
- **Thẻ tóm tắt:** `rounded-2xl border border-line bg-white shadow-soft overflow-hidden`, đầu thẻ có vạch gradient `h-1`; tiêu đề H3 + icon `ClipboardList`; đường kẻ chấm `border-dashed` trước dòng Tổng; Tổng `text-xl font-bold text-primary-700`; chân thẻ nhắc "💵 Thanh toán khi nhận hàng (COD)" `text-sm text-ink-muted`.
- **Gợi ý thêm:** `Carousel` thẻ nhỏ cùng danh mục hoặc danh mục phối hợp (ví dụ mua Áo gợi ý Quần); ít hơn 2 thì ẩn.
- Rule: số lượng 1…tồn kho; vượt tồn kho thì toast cảnh báo và giữ ở mức tối đa. Xóa hiện toast "Đã xóa khỏi giỏ hàng" (có thể kèm "Hoàn tác").
- **Empty:** khung `bg-grid rounded-3xl py-16`, sticker lớn `ShoppingCart` + emoji quần áo bay nhẹ, "Giỏ hàng của bạn đang trống", nút "Khám phá bộ sưu tập" + gợi ý `Carousel` "Bán chạy nhất".
- Nút "Tiến hành đặt hàng": chưa đăng nhập thì chuyển `/login` (nhớ để quay lại `/checkout`).

### 7.5. Checkout — `/checkout` & Đặt hàng thành công

- Trên cùng là `StepIndicator` 3 bước: **Giỏ hàng ✓ → Thông tin giao hàng (hiện tại) → Hoàn tất**.
- Bố cục 2 cột như giỏ hàng: trái là các thẻ form, phải là tóm tắt đơn (sticky).
- **Mỗi khối form là một thẻ có đánh số:** header thẻ có sticker icon `size-9 rounded-xl bg-primary-100 text-primary-700` + H3: ① `MapPin` "Thông tin nhận hàng", ② `Wallet` "Phương thức thanh toán".
- **Form:** Họ tên · Số điện thoại · Địa chỉ giao hàng (textarea, đếm ký tự `text-xs text-ink-subtle`) · Ghi chú giao hàng (tùy chọn, ví dụ "Giao giờ hành chính"). Điền sẵn họ tên từ hồ sơ.
- **Thanh toán:** thẻ radio duy nhất đã chọn sẵn: `rounded-xl border-2 border-secondary-500 bg-secondary-50 p-4`, icon `Wallet`, chữ "Thanh toán khi nhận hàng (COD)" + mô tả "Kiểm tra hàng và trả tiền mặt khi nhận", dấu `CheckCircle2` ở góc phải (radio khóa, vẫn có `aria-checked`).
- **Tóm tắt đơn (phải):** mỗi dòng ảnh `w-12 h-16 rounded-lg object-cover` có **badge số lượng** góc trên (`bg-gray-900/80 text-white text-xs rounded-full`) + tên (`line-clamp-1`) + thông tin size/màu 🔹 + thành tiền; đường kẻ chấm; Tạm tính / Phí giao / Tổng (`text-xl font-bold text-primary-700`); dòng "🔒 Thông tin của bạn được bảo mật" nhỏ phía dưới.
- **Validate:** SĐT Việt Nam `^(0|\+84)(3|5|7|8|9)\d{8}$` → lỗi "Số điện thoại không hợp lệ"; địa chỉ tối thiểu 10 ký tự.
- Nút "Xác nhận đặt hàng": `Button primary lg fullWidth`, loading khi gửi, **chống bấm nhiều lần**.
- **Lỗi** (ví dụ hết hàng/hết size): khối cảnh báo đỏ đầu form nêu rõ sản phẩm nào, giữ nguyên dữ liệu đã nhập.
- **Thành công:** xóa giỏ; `StepIndicator` chuyển hết bước hoàn tất; nền `bg-gradient-to-br from-primary-50 via-white to-secondary-50`; vòng `CheckCircle2` xanh lá lớn `size-20 animate-pop` quanh có ✨ 🛍️ bay nhẹ; tiêu đề "Đặt hàng thành công!"; **thẻ vé mã đơn** `rounded-2xl border-2 border-dashed border-primary-200 bg-white p-6` chứa mã `#1024` (`text-3xl font-bold text-primary-700`), thời gian đặt, tổng tiền, phương thức COD; khối "Tiếp theo" 3 bước mờ (Chờ xử lý → Đang chuẩn bị hàng → Đang giao); 2 nút: "Xem đơn hàng" (primary) và "Tiếp tục mua sắm" (outline).
- Giỏ trống mà vào `/checkout` thì chuyển về `/cart`.

### 7.6. Lịch sử đơn hàng — `/orders` & Chi tiết — `/orders/:id`

- **Danh sách:** Desktop là Table (Mã đơn · Ngày đặt · Sản phẩm · Tổng tiền · Trạng thái · "Xem"). Mobile là danh sách thẻ (mã + trạng thái ở trên, ngày + tổng tiền ở dưới). Mới nhất trước. Empty: "Bạn chưa có đơn hàng nào" + nút "Mua sắm ngay".
- **Chi tiết:** tiêu đề "Đơn hàng #1024" + OrderBadge; **thanh tiến trình** 4 bước ngang `Chờ xử lý → Đang chuẩn bị hàng → Đang giao → Hoàn thành` (bước đã qua: `bg-primary-700`, hiện tại: có vòng nhấn, chưa tới: `bg-gray-200`). Trạng thái `CANCELLED` thay thanh bằng khối đỏ "Đơn hàng đã bị hủy". Dưới là khối thông tin giao hàng (họ tên, SĐT, địa chỉ, COD), bảng sản phẩm (ảnh 3:4, tên, size/màu 🔹, SL, đơn giá, thành tiền) và tổng tiền.
- **Làm giàu:** thanh lọc trạng thái dạng chip (Tất cả + 5 trạng thái, kèm số đơn); thẻ đơn (mobile) và hàng bảng (desktop) có **dải ảnh thu nhỏ** tối đa 3 ảnh `w-9 h-12 rounded-lg object-cover` + "+{n}"; bố cục thanh tiến trình có icon cho từng bước (`ClipboardList`, `Shirt`, `Truck`, `CheckCircle2`) và ghi thời điểm của bước đã qua nếu API có; trong chi tiết đơn, khối thông tin giao hàng và tổng tiền là hai thẻ cạnh nhau từ `md:` (`rounded-2xl border border-line bg-white p-5 shadow-soft`), có nút "Mua lại" (đưa các sản phẩm còn hàng vào giỏ) khi đơn `COMPLETED`.

### 7.7. Hồ sơ cá nhân — `/profile`

- Thẻ `max-w-2xl` có **cover**: dải `h-24 rounded-t-2xl bg-gradient-to-r from-primary-100 to-secondary-100` (kèm 3–4 chấm/emoji thời trang mờ); avatar chữ cái đầu `size-16 rounded-full bg-primary-100 text-primary-700 ring-4 ring-white -mt-8` đè lên mép cover; bên cạnh là họ tên (H2), email `text-ink-muted` và `Badge` vai trò ("Khách hàng"/"Quản trị").
- Hàng số liệu nhỏ 🔹 (Đơn hàng đã đặt, Thành viên từ ngày…) chỉ hiện khi lấy được từ API; mỗi ô `rounded-xl bg-gray-50 p-3 text-center`.
- 2 khối form tách thành hai thẻ có header sticker: **Thông tin** (icon `User`: Họ tên, Email) và **Đổi mật khẩu** (icon `Lock`: Mật khẩu hiện tại, Mật khẩu mới có thanh độ mạnh, Xác nhận).
- Mỗi khối có nút lưu riêng; thành công thì toast "Cập nhật thành công"; lỗi hiện dưới ô tương ứng. Nút lưu chỉ bật khi form có thay đổi.

### 7.8. Admin – Quản lý sản phẩm — `/admin/products`

```
Sản phẩm thời trang               [✨ Tạo dữ liệu mẫu bằng AI] [+ Thêm sản phẩm]
[🔍 Tìm theo tên mẫu...]  [Danh mục ▾]
┌────────────────────────────────────────────────────────────────┐
│ Ảnh │ Tên sản phẩm │ Danh mục │ Giá │ Tồn kho │ Thao tác       │
└────────────────────────────────────────────────────────────────┘
                              Phân trang
```

- Cột ảnh dùng khung dọc `w-10 h-14 rounded-lg object-cover object-top`.
- Tồn kho `<= 5` hiển thị `text-amber-700 font-semibold`; `0` hiển thị badge "Hết hàng".
- Xóa: `ConfirmDialog` "Xóa sản phẩm này? Hành động không thể hoàn tác." → toast "Đã xóa sản phẩm".
- Nút "Tạo dữ liệu mẫu bằng AI": mở modal chọn số lượng (5/10/20) → loading → toast "Đã tạo {n} mẫu quần áo" → tải lại bảng. Màu nút `secondary` + icon `Sparkles`.
- Mobile: bảng cuộn ngang, hoặc thu thành thẻ.

### 7.9. Admin – Thêm/Sửa sản phẩm — `/admin/products/new`, `/admin/products/:id`

- Form 2 cột từ `lg:` (trái: Tên sản phẩm, Giá, Tồn kho, Danh mục quần áo, danh sách Size/Màu 🔹; phải: URL ảnh + **xem trước ảnh** tỉ lệ `aspect-[3/4] max-w-64`). Dưới cùng full-width: **Mô tả & Chất liệu**.
- **Khối AI mô tả** (nút "✨ Tạo mô tả thời trang bằng AI" đặt cạnh nhãn "Mô tả", `secondary` size `sm`):

| Trạng thái | Giao diện |
|---|---|
| Mặc định | Nút bật nếu đã nhập Tên; chưa có Tên thì `disabled` kèm gợi ý "Nhập tên sản phẩm trước" |
| Đang tạo | Nút loading "Đang tạo…", textarea `disabled` với skeleton mờ |
| Có kết quả | Điền vào textarea (gồm gợi ý chất liệu, form dáng, cách phối đồ — vẫn sửa được), toast "Đã tạo mô tả, bạn có thể chỉnh sửa" |
| Lỗi | Khối đỏ nhỏ dưới ô: "Không tạo được mô tả." + nút "Thử lại" |

- Validate: Tên bắt buộc; Giá > 0; Tồn kho là số nguyên >= 0; URL ảnh đúng định dạng.
- Nút: "Lưu" (primary, loading) và "Hủy" (outline). Lưu xong về danh sách + toast.

### 7.10. Admin – Quản lý đơn hàng — `/admin/orders`

- Bảng: Mã đơn · Khách hàng · Ngày đặt · Tổng tiền · Trạng thái (OrderBadge) · Cập nhật. Bộ lọc theo trạng thái (chip: Tất cả + 5 trạng thái).
- **Cột Cập nhật:** dropdown chỉ liệt kê **bước tiếp theo hợp lệ**:

| Hiện tại | Lựa chọn hiển thị |
|---|---|
| `PENDING` | Đang chuẩn bị hàng, Hủy đơn |
| `PROCESSING` | Đang giao, Hủy đơn |
| `SHIPPING` | Hoàn thành, Hủy đơn |
| `COMPLETED` / `CANCELLED` | (không có, hiện "—") |

- Chọn "Hủy đơn" mở `ConfirmDialog` ("Hủy đơn này? Tồn kho sẽ được hoàn lại."). Cập nhật xong có toast và đổi badge ngay.
- Bấm vào hàng mở chi tiết đơn (modal hoặc trang) hiển thị thông tin giao hàng và sản phẩm (kèm size/màu 🔹).

### 7.11. Trang lỗi

- **404** "Không tìm thấy trang" và **403** "Bạn không có quyền truy cập": nền `bg-gradient-to-br from-primary-50 via-white to-secondary-50` + `bg-dots`; căn giữa.
- Số lỗi khổng lồ `text-8xl md:text-9xl font-bold text-primary-200` (nằm sau), đè lên là emoji lớn `text-7xl animate-float` (404 → 👗, 403 → 🔒), tiêu đề H1, mô tả ngắn `text-ink-muted`.
- Hai nút: "Về trang chủ" (primary) + "Quay lại" (outline). 404 thêm ô tìm kiếm nhanh và 3 chip danh mục quần áo để người dùng tiếp tục mua sắm.
- Trang "Sản phẩm không tồn tại" và các lỗi tương tự dùng cùng khung này (emoji khác, nội dung riêng).

### 7.12. Admin – Làm giàu giao diện quản trị

- **Sidebar:** đầu sidebar có Logo (chữ "Funny" `text-primary-300`, "Shop" `text-secondary-300`) + nhãn "Quản trị"; mục đang chọn thêm vạch trái `border-l-4 border-secondary-300`; cuối sidebar là khối người dùng (avatar chữ cái, tên, email rút gọn) + nút đăng xuất.
- **Topbar:** có `Breadcrumb` ("Quản trị > Sản phẩm") và avatar; nền `bg-white border-b border-line`.
- **Thẻ thống kê** (đầu `/admin/products` và `/admin/orders`, `grid grid-cols-2 gap-3 lg:grid-cols-4`): `StatCard` `rounded-xl border border-line bg-white p-4 shadow-soft` gồm sticker icon (`bg-primary-100`/`bg-secondary-100`), nhãn `text-sm text-ink-muted`, số `text-2xl font-bold tabular-nums`. Gợi ý số liệu **tính từ dữ liệu đã tải**: Tổng mẫu sản phẩm · Sắp hết hàng (≤ 5) · Hết hàng (trang sản phẩm); Tổng đơn · Chờ xử lý · Đang giao · Hoàn thành (trang đơn hàng).
- **Bảng:** cột ảnh `w-10 h-14 rounded-lg`; tên sản phẩm kèm chip danh mục; hàng có `hover:bg-primary-50`; hàng lẻ có thể `bg-gray-50/50`; khung bảng có header toolbar (ô tìm, bộ lọc, nút hành động) trên nền trắng.
- **Hỗ trợ AI:** nút/khối AI dùng gradient "Mát" (`from-secondary-50 to-secondary-100`) và icon `Sparkles` để thống nhất nhận diện "việc của AI".

---

## 8. Quy tắc trạng thái chung (Loading / Empty / Error)

| Tình huống | Hiển thị |
|---|---|
| Đang tải danh sách | Skeleton cùng hình dáng nội dung thật (không dùng spinner trơ giữa trang trống) |
| Đang gửi form | Nút loading + disabled toàn form; không đổi bố cục |
| Không có dữ liệu | `EmptyState` có thông điệp thân thiện + hành động tiếp theo |
| Lỗi mạng/server | `ErrorState` + nút "Thử lại"; giữ dữ liệu cũ nếu có |
| 401 | Toast "Phiên đăng nhập đã hết hạn" → xóa token → `/login` |
| 403 | Trang 403 |
| 404 | Trang/khối "không tồn tại" |
| Validate form | Lỗi ngay dưới từng ô, focus vào ô lỗi đầu tiên khi gửi |

---

## 9. Microcopy tiếng Việt (chuẩn ngành thời trang)

| Ngữ cảnh | Nội dung |
|---|---|
| Thêm giỏ | "Đã thêm vào giỏ hàng" |
| Chưa chọn size 🔹 | "Vui lòng chọn kích cỡ trước khi thêm vào giỏ" |
| Xóa khỏi giỏ | "Đã xóa khỏi giỏ hàng" |
| Vượt tồn kho | "Chỉ còn {n} sản phẩm trong kho" |
| Đặt hàng thành công | "Đặt hàng thành công!" |
| Đặt hàng lỗi | "Không thể đặt hàng. Vui lòng kiểm tra lại." |
| Giỏ trống | "Giỏ hàng của bạn đang trống" |
| Chưa có đơn | "Bạn chưa có đơn hàng nào" |
| Không có kết quả | "Không tìm thấy trang phục phù hợp" |
| Lỗi tải | "Không tải được dữ liệu. Vui lòng thử lại." |
| Đăng xuất | "Đăng xuất" |
| Hết phiên | "Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại." |
| Lưu thành công | "Cập nhật thành công" |
| Xóa xác nhận | "Bạn có chắc muốn xóa? Hành động này không thể hoàn tác." |
| AI đang tạo | "Đang tạo mô tả…" |
| AI lỗi | "Không tạo được mô tả. Vui lòng thử lại." |
| Chat lời chào | "Xin chào! Mình là Stylist AI của FunnyShop. Bạn cần tìm trang phục hay tư vấn chọn size hôm nay? 👕" |
| Chat đang trả lời | "Đang trả lời…" |
| Chat lỗi | "Mình chưa trả lời được lúc này." |

Giọng văn: thân thiện, trẻ trung, xưng "bạn"/"mình". Không dùng thuật ngữ kỹ thuật với khách hàng.

---

## 10. Quy tắc định dạng dữ liệu

| Dữ liệu | Quy tắc | Ví dụ |
|---|---|---|
| Tiền | `Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' })` | `249.000 ₫` |
| Ngày giờ | `dd/MM/yyyy HH:mm` (giờ địa phương) | `26/10/2026 14:30` |
| Rating | 1 chữ số thập phân + icon sao | `★ 4.8` |
| Mã đơn | Tiền tố `#` | `#1024` |
| SĐT | Hiển thị liền, không dấu cách thừa | `0912345678` |

Đặt hàm trong `src/utils/formatCurrency.js`, `formatDate.js` và dùng thống nhất.

---

## 11. Khả năng truy cập (Accessibility)

- Tương phản chữ/nền tối thiểu **4.5:1** (chữ thường), **3:1** (chữ lớn, icon quan trọng). Chữ trắng trên `primary` chỉ dùng với `primary-700` trở lên; chữ trắng trên ảnh Hero Full-Bleed phải có lớp phủ gradient tối (mục 2.7.2).
- Mọi phần tử tương tác dùng được bằng bàn phím (Tab/Enter/Space/Esc); focus nhìn thấy rõ (`:focus-visible`).
- Ảnh có `alt`; nút icon có `aria-label`; nút chọn size có `aria-pressed`; modal có `role="dialog"` + `aria-modal` + `aria-labelledby`.
- Không truyền đạt thông tin chỉ bằng màu (badge luôn có chữ, size hết hàng có gạch ngang + `disabled`).
- Vùng bấm tối thiểu 44×44px trên mobile.
- Thẻ HTML ngữ nghĩa: `header`, `nav`, `main`, `footer`, một `h1` mỗi trang.

---

## 12. Ánh xạ thiết kế → code

```
src/
├── components/
│   ├── ui/                 Button, Input, Textarea, Select, QuantityStepper, Badge,
│   │                       OrderBadge, DiscountBadge, Rating, Breadcrumb, Tabs, ProgressBar,
│   │                       StepIndicator, SectionHeader, Carousel, Avatar, StatCard,
│   │                       Toast/ToastContainer, Modal, ConfirmDialog,
│   │                       Table, Pagination, Skeleton, Spinner, EmptyState, ErrorState, Drawer
│   ├── decor/              Blob, FloatingEmoji, Reveal, ScrollToTop
│   ├── layout/             AnnouncementBar, Navbar, Footer, SidebarAdmin, Topbar
│   ├── home/               HeroBanner (Full-Bleed), TrustBar, CategoryGrid, CategoryTile,
│   │                       FeaturedCarousel, PromoBanners, Testimonials, NewsletterBlock, FlashSale
│   ├── product/            ProductCard, ProductCardSkeleton, ProductGrid, FilterBar, SortSelect,
│   │                       ProductGallery, StockBar, SizeSelector, SizeGuideModal
│   ├── cart/               CartItem, CartSummary, FreeShipBar
│   ├── order/              OrderRow, OrderTimeline
│   └── chat/               ChatWidget, ChatMessage, ChatProductCard
├── layouts/                MainLayout, AdminLayout, AuthLayout
├── pages/                  Home, ProductDetail, Login, Register, Cart, Checkout, OrderSuccess,
│                           Orders, OrderDetail, Profile, NotFound, Forbidden
│   └── admin/              AdminProducts, AdminProductForm, AdminOrders
└── utils/                  formatCurrency, formatDate, validators, constants (ORDER_STATUS, CATEGORY_META, SIZE_CHART, FREE_SHIP_THRESHOLD, ...)
```

`constants.js` chứa bản đồ trạng thái đơn (nhãn + lớp màu), quy tắc chuyển trạng thái hợp lệ, `CATEGORY_META` (emoji + cặp màu theo danh mục quần áo, mục 2.7.4) và `SIZE_CHART` (bảng quy đổi chiều cao/cân nặng cho Modal hướng dẫn chọn size).

## 14. Checklist nghiệm thu UI (mỗi trang phải đạt)

- [ ] Dùng đúng token màu/chữ/khoảng cách, không có giá trị tùy ý.
- [ ] **Hero Banner trang chủ tràn 100% chiều ngang màn hình (`w-full` full-bleed)**, sát dưới Navbar, nội dung bên trong căn thẳng hàng với container; ảnh nền sắc nét, chữ trắng dễ đọc nhờ lớp phủ gradient.
- [ ] Ảnh sản phẩm quần áo hiển thị đúng tỉ lệ dọc `aspect-[3/4]` (`object-cover object-top`), không bị cắt mất phần đầu/cổ người mẫu.
- [ ] Hiển thị đúng ở 375px, 768px, 1280px; không cuộn ngang.
- [ ] Có đủ 3 trạng thái: loading, empty, error.
- [ ] Form có validate từng ô; nút gửi có loading và chống bấm nhiều lần.
- [ ] Mọi hành động quan trọng có toast phản hồi.
- [ ] Dùng được hoàn toàn bằng bàn phím; focus nhìn thấy; có `alt`/`aria-label`.
- [ ] Giá, ngày giờ đúng định dạng mục 10; chuỗi giao diện đúng mục 9.
- [ ] Ảnh sản phẩm có `loading="lazy"`; ảnh Hero Banner có `fetchPriority="high"` (không lazy); route dùng `React.lazy`; FCP dưới 2 giây.
- [ ] `npm run lint` và `npm run build` không lỗi.
- [ ] Mỗi trang theo nhịp nền mục 2.7.1 và có ít nhất một khối nhấn (gradient/blob/họa tiết/sticker).
- [ ] Trang trí đều `aria-hidden`, nằm dưới nội dung, ẩn bớt trên mobile; mỗi khối ≤ 2 loại họa tiết.
- [ ] Hiệu ứng (`Reveal`, `animate-float`, marquee) dừng/giảm khi `prefers-reduced-motion`; nội dung vẫn hiện đủ nếu JS lỗi.
- [ ] Không có mã màu mới: `grep -E "#[0-9A-Fa-f]{6}"` ngoài `src/index.css` cho kết quả rỗng; bảng màu ở `@theme` giữ nguyên bản gốc.
- [ ] Mọi khối đánh dấu 🔹 chỉ hiển thị khi có dữ liệu/nội dung thật; không có số liệu hay đánh giá bịa ở bản chính thức.