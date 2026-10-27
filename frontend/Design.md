# FunnyShop – Tài liệu Đặc tả Thiết kế UI/UX (Design Spec)

> **Mục đích:** Tài liệu chuẩn để Antigravity (và cả nhóm) dựng giao diện Frontend **ReactJS + Vite + Tailwind CSS v4** cho dự án E-Commerce FunnyShop (MVP).
> **Nguồn liên quan:** `SRS_FunnyShop_MVP.md` (yêu cầu), `task.md` (tiến độ).
> **Thứ tự ưu tiên khi mâu thuẫn:** `SRS_FunnyShop_MVP.md` > `DESIGN_SPEC.md` > ảnh/bản thiết kế Figma > suy đoán. Mâu thuẫn phải ghi vào mục "Nhật ký" của `task.md`.

---

## 0. Cách dùng tài liệu này

1. Dựng **Design Tokens** (mục 2) vào `src/index.css` trước tiên, rồi mới viết component.
2. Dựng **component dùng chung** (mục 6) trước khi dựng trang.
3. Mỗi trang (mục 7) phải có đủ 3 trạng thái: **loading, empty, error**.
4. **Không** dùng màu/cỡ chữ/khoảng cách tùy ý (ví dụ `text-[13px]`, `bg-[#ff0000]`). Chỉ dùng token và lớp Tailwind trong tài liệu này.
5. Mọi chuỗi giao diện bằng **tiếng Việt**, lấy từ mục 9 (Microcopy) khi có.
6. Khi xong mỗi trang, đối chiếu **Checklist nghiệm thu** (mục 13).

---

## 1. Nguyên tắc thiết kế

| Nguyên tắc | Diễn giải |
|---|---|
| **Vui tươi nhưng sạch** | Màu sáng, bo góc mềm, nhiều khoảng trắng. Trang trí tiết chế (emoji/minh họa nhỏ ở banner, empty state, trang lỗi). |
| **Đọc được trước, đẹp sau** | Độ tương phản đạt WCAG AA. Giá và nút hành động luôn nổi bật nhất trong khung nhìn. |
| **Mobile-first** | Viết style cho mobile trước, mở rộng bằng `sm: md: lg: xl:`. |
| **Nhất quán** | Một bộ component, một bộ token. Cùng một loại hành động luôn có cùng một kiểu nút. |
| **Phản hồi rõ ràng** | Mọi hành động đều có phản hồi: toast, loading, trạng thái disabled. |
| **Đối tượng** | Người trẻ 16–30 tuổi tại Việt Nam, nội dung tiếng Việt, tiền VND. |

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
}

@layer base {
  html { font-family: var(--font-sans); background: var(--color-page); color: var(--color-ink); }
  body { @apply antialiased; }
  :focus-visible { @apply outline-2 outline-offset-2 outline-secondary-500; }
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
| Nhấn phụ (chatbot, AI, tab đang chọn) | `bg-secondary-500` / `text-secondary-700` |
| Thành công | `bg-green-50 text-green-800 border-green-200` |
| Cảnh báo | `bg-amber-50 text-amber-800 border-amber-200` |
| Lỗi | `bg-red-50 text-red-800 border-red-200` |
| Thông tin | `bg-blue-50 text-blue-800 border-blue-200` |

### 2.4. Badge trạng thái đơn hàng

| Trạng thái (`status`) | Nhãn hiển thị | Lớp Tailwind |
|---|---|---|
| `PENDING` | Chờ xử lý | `bg-amber-100 text-amber-800` |
| `PROCESSING` | Đang xử lý | `bg-blue-100 text-blue-800` |
| `SHIPPING` | Đang giao | `bg-violet-100 text-violet-800` |
| `COMPLETED` | Hoàn thành | `bg-green-100 text-green-800` |
| `CANCELLED` | Đã hủy | `bg-red-100 text-red-800` |

Badge: `inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold`. Luôn có **chữ**, không chỉ dựa vào màu.

### 2.5. Chữ (Typography)

| Style | Lớp Tailwind | Dùng cho |
|---|---|---|
| Display | `text-3xl md:text-4xl font-bold tracking-tight` | Tiêu đề banner |
| H1 | `text-2xl md:text-3xl font-bold` | Tiêu đề trang |
| H2 | `text-xl md:text-2xl font-semibold` | Tiêu đề khối |
| H3 | `text-lg font-semibold` | Tiêu đề thẻ, form section |
| Body | `text-base` (16px) | Nội dung |
| Body-sm | `text-sm` (14px) | Mô tả phụ, bảng |
| Caption | `text-xs` (12px) | Chú thích, badge |
| Giá (card) | `text-lg font-bold text-primary-700` | Giá sản phẩm |
| Giá (chi tiết) | `text-3xl font-bold text-primary-700` | Giá ở trang chi tiết |
| Label form | `text-sm font-medium text-ink` | Nhãn ô nhập |

Quy tắc: line-height mặc định của Tailwind; tên sản phẩm dài dùng `line-clamp-2`; không dùng chữ in hoa toàn bộ cho đoạn văn.

### 2.6. Khoảng cách, bóng, z-index

- **Khoảng cách:** chỉ dùng thang Tailwind (bội số của 4px): `1, 2, 3, 4, 6, 8, 12, 16`. Khoảng cách giữa các khối trang: `py-8 md:py-12`; giữa các phần tử trong thẻ: `gap-2` / `gap-3` / `gap-4`.
- **Bóng:** `shadow-sm` (thẻ), `shadow-md` (thẻ hover, dropdown), `shadow-xl` (modal, chat panel).
- **Z-index:** navbar `z-40` · chat widget `z-[45]` · drawer/overlay `z-50` · modal `z-[60]` · toast `z-[70]`.

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

### 3.3. Lưới sản phẩm

```
grid grid-cols-2 gap-3 md:grid-cols-3 md:gap-4 xl:grid-cols-4 xl:gap-6
```

### 3.4. Khung trang

- **MainLayout:** `Navbar (sticky)` → `<main className="min-h-[calc(100vh-4rem)] py-6 md:py-10">` → `Footer`. Có `ChatWidget` nổi.
- **AdminLayout:** Sidebar `w-64` (hiện từ `lg:`; dưới `lg` là drawer mở bằng nút menu) + Topbar `h-16` + nội dung `p-4 md:p-6`.
- Không để trang cuộn ngang. Bảng rộng đặt trong `overflow-x-auto`.

---

## 4. Icon & hình ảnh

- Dùng thư viện **`lucide-react`**. Cỡ chuẩn `size-5` (20px), trong nút nhỏ `size-4`, icon lớn trang trí `size-8+`.
- Icon dùng: `ShoppingCart`, `Search`, `User`, `Menu`, `X`, `Heart` (không bắt buộc), `Star`, `Plus`, `Minus`, `Trash2`, `Pencil`, `Package`, `ClipboardList`, `LogOut`, `Sparkles` (AI), `MessageCircle` (chat), `Send`, `ChevronLeft/Right/Down`, `Filter`, `CheckCircle2`, `AlertCircle`, `Info`.
- Icon chỉ có tác dụng trang trí: `aria-hidden="true"`. Nút chỉ có icon phải có `aria-label`.
- **Ảnh sản phẩm:** tỉ lệ vuông `aspect-square object-cover`, `loading="lazy"`, có `alt` = tên sản phẩm. Khi ảnh lỗi: hiển thị khối `bg-primary-50` kèm icon `Package` ở giữa (`onError`).
- **Ảnh mock:** `https://picsum.photos/seed/{id}/600/600` (ổn định theo `id`).

---

## 5. Hệ thống Motion

| Hiệu ứng | Lớp Tailwind |
|---|---|
| Hover/focus mềm | `transition-colors duration-150` / `transition-shadow duration-200` |
| Nâng thẻ khi hover | `hover:shadow-md hover:-translate-y-0.5 transition` |
| Mở modal/drawer | mờ dần + trượt nhẹ, 200ms |
| Toast | trượt vào từ phải (desktop) / từ trên (mobile), tự tắt sau **4 giây** |
| Skeleton | `animate-pulse bg-gray-200 rounded-md` |
| Spinner | `animate-spin` |

Tôn trọng người dùng giảm chuyển động: thêm `motion-reduce:transition-none motion-reduce:animate-none` cho hiệu ứng trang trí.

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

- Overlay `bg-black/50`; hộp `bg-white rounded-xl shadow-xl max-w-md w-full p-6`. Đóng bằng `Esc`, bấm nền, nút `X`. Khóa cuộn nền, bẫy focus, trả focus về nút mở.
- `ConfirmDialog`: tiêu đề + mô tả + 2 nút (`Hủy` outline, `Xóa`/`Xác nhận` danger hoặc primary).

### 6.7. Table (dùng cho Admin & lịch sử)

- Bọc `overflow-x-auto rounded-xl border border-line bg-white`.
- Header `bg-gray-50 text-xs font-semibold uppercase text-ink-muted`; hàng `border-t border-line hover:bg-gray-50`; ô `px-4 py-3 text-sm`.
- Có trạng thái: loading (5 hàng skeleton), empty (EmptyState trong bảng), error.

### 6.8. Pagination

`Trước · 1 2 3 … N · Sau`. Trang hiện tại `bg-primary-700 text-white`. Mobile: chỉ hiện `Trước`, "Trang x / N", `Sau`. Nút `size-10`.

### 6.9. Skeleton / Spinner

- `ProductCardSkeleton`: ảnh vuông + 2 dòng chữ + 1 dòng giá + 1 nút, đều `animate-pulse`.
- `Spinner`: `size-5 animate-spin` (trong nút), `size-8` (giữa trang).

### 6.10. EmptyState / ErrorState

- `EmptyState`: icon lớn `text-primary-300`, tiêu đề H3, mô tả `text-ink-muted`, tùy chọn 1 nút hành động. Căn giữa, `py-16`.
- `ErrorState`: icon `AlertCircle` đỏ, thông báo lỗi, nút **"Thử lại"** (gọi lại API).

### 6.11. ProductCard

```
┌──────────────────┐
│   [ảnh vuông]    │  ← tên "Hết hàng" phủ góc trên trái nếu stock = 0
│                  │
├──────────────────┤
│ Tên sản phẩm tối │  line-clamp-2, text-sm font-medium
│ đa hai dòng      │
│ ★ 4.5   (còn 12) │  text-xs text-ink-muted
│ 125.000 ₫        │  text-lg font-bold text-primary-700
│ [ Thêm vào giỏ ] │  Button primary fullWidth, size md
└──────────────────┘
```

- Lớp thẻ: `group flex flex-col overflow-hidden rounded-xl border border-line bg-white shadow-sm transition hover:shadow-md`.
- Bấm vào ảnh/tên → `/products/:id`. Bấm nút thêm giỏ **không** điều hướng (chặn nổi bọt sự kiện).
- `stock = 0`: nhãn `Hết hàng` (`bg-gray-900/80 text-white text-xs rounded-md px-2 py-1`), nút `disabled` ghi "Hết hàng", ảnh `opacity-60`.
- Sau khi thêm giỏ: toast "Đã thêm vào giỏ hàng", badge giỏ tăng.

### 6.12. CartItem

Desktop: hàng ngang `[ảnh 80×80] [tên + đơn giá] [stepper] [thành tiền] [xóa]`. Mobile: ảnh + tên/đơn giá ở trên, dưới là stepper và thành tiền, nút xóa góc phải trên. Thành tiền `font-semibold`, xóa là nút ghost có `aria-label`.

### 6.13. Navbar

- Cao `h-16`, `sticky top-0 z-40 border-b border-line bg-white/95 backdrop-blur`.
- **Desktop (`lg:`):** `Logo` · `SearchBar` (giữa, `max-w-xl flex-1`) · `Giỏ hàng + badge` · `Menu người dùng / nút Đăng nhập`.
- **Mobile:** `Hamburger` · `Logo` · `Search icon` · `Giỏ hàng`. Bấm hamburger mở Drawer trái (danh mục, Đơn hàng, Hồ sơ, Đăng nhập/Đăng xuất). Bấm search icon mở ô tìm kiếm chiếm hết thanh.
- **Badge giỏ:** `absolute -top-1 -right-1 min-w-5 h-5 rounded-full bg-primary-700 text-white text-xs`; ẩn khi 0; hiển thị `9+` khi lớn hơn 9.
- **Menu người dùng:** Avatar chữ cái đầu + họ tên (ẩn tên ở `md` trở xuống) → dropdown: `Hồ sơ`, `Đơn hàng của tôi`, `Quản trị` (chỉ ADMIN), `Đăng xuất`.
- **Logo:** chữ "Funny" `text-primary-700` + "Shop" `text-secondary-500`, `font-bold text-xl`, kèm emoji 🎈 (trang trí).

### 6.14. Footer

Nền `bg-white border-t`, 3 cột (Giới thiệu ngắn · Liên kết nhanh · Liên hệ) → 1 cột trên mobile. Dòng bản quyền `text-sm text-ink-subtle`.

### 6.15. SidebarAdmin

Nền `bg-gray-900 text-gray-100`, mục `rounded-lg px-3 py-2`, mục đang chọn `bg-primary-700 text-white`. Mục: `Sản phẩm` (`Package`), `Đơn hàng` (`ClipboardList`), `Về cửa hàng`, `Đăng xuất`. Dưới `lg`: ẩn, mở bằng Drawer.

### 6.16. ChatWidget

| Phần | Đặc tả |
|---|---|
| Nút mở | `fixed bottom-4 right-4 z-[45] size-14 rounded-full bg-secondary-500 text-white shadow-lg`, icon `MessageCircle`, `aria-label="Mở trò chuyện"`. Mobile: đặt `bottom-20` nếu có thanh dưới. |
| Panel (desktop) | `fixed bottom-24 right-4 w-[380px] h-[560px] rounded-2xl bg-white shadow-xl border border-line flex flex-col` |
| Panel (mobile) | `fixed inset-x-0 bottom-0 h-[85dvh] rounded-t-2xl` (hoặc toàn màn hình) |
| Header | nền `bg-secondary-500 text-white`, tiêu đề "Trợ lý FunnyShop", nút thu nhỏ/đóng |
| Tin nhắn người dùng | căn phải, `bg-secondary-500 text-white rounded-2xl rounded-br-md px-3 py-2` |
| Tin nhắn AI | căn trái, `bg-gray-100 text-ink rounded-2xl rounded-bl-md px-3 py-2` |
| Card sản phẩm trong chat | khung nhỏ ngang: ảnh 48×48 + tên + giá + link "Xem" → `/products/:id` |
| Đang trả lời | 3 chấm nhảy `animate-bounce` trong bong bóng AI |
| Ô nhập | dưới cùng, `Enter` gửi, `Shift+Enter` xuống dòng, nút `Send` |
| Lỗi/timeout | bong bóng đỏ nhạt "Mình chưa trả lời được lúc này." + nút **Thử lại** |
| Gợi ý nhanh | chip ở lời chào: "Gợi ý quà tặng dưới 200.000đ", "Sản phẩm bán chạy", "Cách đặt hàng" |

---

## 7. Đặc tả từng màn hình

> Mỗi màn hình đều phải có: **loading → empty → error** khi gọi API, và hoạt động tốt ở 375 / 768 / 1280.

### 7.1. Trang chủ / Danh sách sản phẩm — `/`

```
┌───────────────────────────────────────────────────────────────┐
│ 🎈FunnyShop  [🔍 Tìm sản phẩm...            ]  🛒(3)  [Đăng nhập]│
├───────────────────────────────────────────────────────────────┤
│  ┌─ Banner ───────────────────────────────────────────────┐   │
│  │ Quà tặng vui nhộn cho mọi dịp!        [ Khám phá ngay ]│   │
│  └────────────────────────────────────────────────────────┘   │
│  Danh mục: (Tất cả)(Đồ chơi)(Quà tặng)(Phụ kiện)...  ← chip    │
│  [Sắp xếp ▾]                         Tìm thấy 24 sản phẩm      │
│  ┌────┐ ┌────┐ ┌────┐ ┌────┐                                  │
│  │card│ │card│ │card│ │card│   Grid 4 cột (xl)                │
│  └────┘ └────┘ └────┘ └────┘                                  │
│          < Trước  1 2 3 …  Sau >                               │
├───────────────────────────────────────────────────────────────┤
│ Footer                                                         │
└───────────────────────────────────────────────────────────────┘
```

- **Banner:** `rounded-2xl bg-gradient-to-r from-primary-500 to-secondary-500 text-white p-6 md:p-10`; chữ trắng phải đạt độ tương phản (dùng chữ `font-bold`, kích cỡ lớn). Có thể thay bằng nền `primary-50` + chữ `ink` nếu gradient kém tương phản.
- **Bộ lọc:** danh mục dạng chip cuộn ngang (`overflow-x-auto`) hoặc select; sắp xếp là select với 5 lựa chọn: *Mặc định · Giá tăng dần · Giá giảm dần · Tồn kho nhiều nhất · Đánh giá cao nhất*.
- **Mobile:** nút `Bộ lọc` mở bottom sheet chứa danh mục + sắp xếp; hiện số bộ lọc đang bật.
- **Đồng bộ URL:** `?q=&category=&sort=&page=`; F5 giữ nguyên trạng thái. Search debounce **300ms**; đổi bộ lọc thì về `page=1`.
- **Trạng thái:** loading = 8 `ProductCardSkeleton`; empty = "Không tìm thấy sản phẩm phù hợp" + nút "Xóa bộ lọc"; error = ErrorState "Không tải được sản phẩm".
- Cuộn lên đầu danh sách khi đổi trang.

### 7.2. Chi tiết sản phẩm — `/products/:id`

```
Trang chủ > Quà tặng > Tên sản phẩm                (breadcrumb)
┌──────────────────────┐  ┌──────────────────────────────────┐
│                      │  │ Tên sản phẩm (H1)                │
│     Ảnh lớn          │  │ ★★★★☆ 4.5   |  Còn 12 sản phẩm   │
│   (aspect-square)    │  │ 125.000 ₫                        │
│                      │  │ Mô tả ngắn / đầy đủ…             │
│                      │  │ Số lượng: [ − ] 1 [ + ]          │
└──────────────────────┘  │ [ Thêm vào giỏ hàng ]            │
                          └──────────────────────────────────┘
```

- Bố cục: mobile 1 cột (ảnh trên); từ `md:` 2 cột `md:grid-cols-2 gap-8`.
- Tồn kho: `> 5` hiện "Còn hàng"; `1–5` hiện "Chỉ còn {n} sản phẩm" (`text-amber-700`); `0` hiện "Hết hàng" và vô hiệu nút + stepper.
- Nút "Thêm vào giỏ hàng" kích thước `lg`, mobile có thể cố định dưới màn hình (`sticky bottom-0 bg-white p-3 border-t`).
- Loading: skeleton ảnh + khối chữ. Không tìm thấy (404 API): hiện trang "Sản phẩm không tồn tại" + nút về trang chủ.

### 7.3. Đăng nhập — `/login` & Đăng ký — `/register`

- Bố cục: thẻ căn giữa `max-w-md`, `bg-white rounded-2xl shadow-sm border p-6 md:p-8`; trên cùng là logo + tiêu đề.
- **Đăng nhập:** Email, Mật khẩu (có hiện/ẩn), nút "Đăng nhập" (`fullWidth`, loading khi gửi), dòng "Chưa có tài khoản? **Đăng ký**".
- **Đăng ký:** Họ tên, Email, Mật khẩu, Xác nhận mật khẩu, nút "Tạo tài khoản", dòng "Đã có tài khoản? **Đăng nhập**".
- **Validate (hiện ngay dưới ô, khi rời ô hoặc khi gửi):**
  - Email sai định dạng: "Email không hợp lệ".
  - Mật khẩu dưới 6 ký tự: "Mật khẩu tối thiểu 6 ký tự".
  - Xác nhận không khớp: "Mật khẩu xác nhận không khớp".
  - Ô trống: "Vui lòng nhập {tên trường}".
- Lỗi từ server (sai mật khẩu, email đã tồn tại): khối cảnh báo đỏ phía trên form.
- Sau đăng nhập thành công: về trang trước đó (nếu bị chuyển hướng từ checkout) hoặc `/`; ADMIN về `/admin/products`.

### 7.4. Giỏ hàng — `/cart`

```
Giỏ hàng (3 sản phẩm)
┌──────────────────────────────────────┐  ┌─ Tóm tắt ──────────┐
│ CartItem                             │  │ Tạm tính   375.000 ₫│
│ CartItem                             │  │ Phí giao    Miễn phí│
│ CartItem                             │  │ ─────────────────── │
└──────────────────────────────────────┘  │ Tổng      375.000 ₫ │
                                          │ [Tiến hành đặt hàng]│
                                          └─────────────────────┘
```

- Từ `lg:` bố cục 2 cột (`lg:grid-cols-3`: danh sách chiếm 2, tóm tắt chiếm 1, tóm tắt `sticky top-20`). Mobile: tóm tắt nằm dưới, nút đặt hàng cố định đáy màn hình.
- Rule: số lượng 1…tồn kho; vượt tồn kho thì toast cảnh báo và giữ ở mức tối đa. Xóa hiện toast "Đã xóa khỏi giỏ hàng" (có thể kèm "Hoàn tác").
- **Empty:** icon `ShoppingCart` lớn + "Giỏ hàng của bạn đang trống" + nút "Tiếp tục mua sắm".
- Nút "Tiến hành đặt hàng": chưa đăng nhập thì chuyển `/login` (nhớ để quay lại `/checkout`).

### 7.5. Checkout — `/checkout` & Đặt hàng thành công

- Bố cục 2 cột như giỏ hàng: trái là form giao hàng, phải là tóm tắt đơn (danh sách rút gọn + tổng tiền).
- **Form:** Họ tên · Số điện thoại · Địa chỉ giao hàng (textarea). Điền sẵn họ tên từ hồ sơ.
- **Thanh toán:** khối chọn duy nhất, đã chọn sẵn: "Thanh toán khi nhận hàng (COD)" (radio khóa).
- **Validate:** SĐT Việt Nam `^(0|\+84)(3|5|7|8|9)\d{8}$` → lỗi "Số điện thoại không hợp lệ"; địa chỉ tối thiểu 10 ký tự.
- Nút "Xác nhận đặt hàng": loading khi gửi, **chống bấm nhiều lần**.
- **Lỗi** (ví dụ hết hàng): khối cảnh báo đỏ đầu form nêu rõ sản phẩm nào, giữ nguyên dữ liệu đã nhập.
- **Thành công:** xóa giỏ, hiện màn hình `CheckCircle2` xanh lá lớn + "Đặt hàng thành công!" + mã đơn `#1024` + 2 nút: "Xem đơn hàng" (primary) và "Tiếp tục mua sắm" (outline).
- Giỏ trống mà vào `/checkout` thì chuyển về `/cart`.

### 7.6. Lịch sử đơn hàng — `/orders` & Chi tiết — `/orders/:id`

- **Danh sách:** Desktop là Table (Mã đơn · Ngày đặt · Số sản phẩm · Tổng tiền · Trạng thái · "Xem"). Mobile là danh sách thẻ (mã + trạng thái ở trên, ngày + tổng tiền ở dưới). Mới nhất trước. Empty: "Bạn chưa có đơn hàng nào" + nút "Mua sắm ngay".
- **Chi tiết:** tiêu đề "Đơn hàng #1024" + OrderBadge; **thanh tiến trình** 4 bước ngang `Chờ xử lý → Đang xử lý → Đang giao → Hoàn thành` (bước đã qua: `bg-primary-700`, hiện tại: có vòng nhấn, chưa tới: `bg-gray-200`). Trạng thái `CANCELLED` thay thanh bằng khối đỏ "Đơn hàng đã bị hủy". Dưới là khối thông tin giao hàng (họ tên, SĐT, địa chỉ, COD), bảng sản phẩm (ảnh, tên, SL, đơn giá, thành tiền) và tổng tiền.

### 7.7. Hồ sơ cá nhân — `/profile`

- Thẻ `max-w-2xl`: avatar chữ cái đầu (`size-16 rounded-full bg-primary-100 text-primary-700`), 2 khối form: **Thông tin** (Họ tên, Email) và **Đổi mật khẩu** (Mật khẩu hiện tại, Mật khẩu mới, Xác nhận).
- Mỗi khối có nút lưu riêng; thành công thì toast "Cập nhật thành công"; lỗi hiện dưới ô tương ứng.

### 7.8. Admin – Quản lý sản phẩm — `/admin/products`

```
Sản phẩm                          [✨ Tạo dữ liệu mẫu bằng AI] [+ Thêm sản phẩm]
[🔍 Tìm theo tên...]  [Danh mục ▾]
┌────────────────────────────────────────────────────────────────┐
│ Ảnh │ Tên SP │ Danh mục │ Giá │ Tồn kho │ Thao tác (Sửa | Xóa) │
└────────────────────────────────────────────────────────────────┘
                              Phân trang
```

- Tồn kho `<= 5` hiển thị `text-amber-700 font-semibold`; `0` hiển thị badge "Hết hàng".
- Xóa: `ConfirmDialog` "Xóa sản phẩm này? Hành động không thể hoàn tác." → toast "Đã xóa sản phẩm".
- Nút "Tạo dữ liệu mẫu bằng AI": mở modal chọn số lượng (5/10/20) → loading → toast "Đã tạo {n} sản phẩm mẫu" → tải lại bảng. Màu nút `secondary` + icon `Sparkles`.
- Mobile: bảng cuộn ngang, hoặc thu thành thẻ.

### 7.9. Admin – Thêm/Sửa sản phẩm — `/admin/products/new`, `/admin/products/:id`

- Form 2 cột từ `lg:` (trái: Tên, Giá, Tồn kho, Danh mục; phải: URL ảnh + **xem trước ảnh** vuông). Dưới cùng full-width: **Mô tả**.
- **Khối AI mô tả** (nút "✨ Tạo mô tả bằng AI" đặt cạnh nhãn "Mô tả", `secondary` size `sm`):

| Trạng thái | Giao diện |
|---|---|
| Mặc định | Nút bật nếu đã nhập Tên; chưa có Tên thì `disabled` kèm gợi ý "Nhập tên sản phẩm trước" |
| Đang tạo | Nút loading "Đang tạo…", textarea `disabled` với skeleton mờ |
| Có kết quả | Điền vào textarea (vẫn sửa được), toast "Đã tạo mô tả, bạn có thể chỉnh sửa" |
| Lỗi | Khối đỏ nhỏ dưới ô: "Không tạo được mô tả." + nút "Thử lại" |

- Validate: Tên bắt buộc; Giá > 0; Tồn kho là số nguyên >= 0; URL ảnh đúng định dạng.
- Nút: "Lưu" (primary, loading) và "Hủy" (outline). Lưu xong về danh sách + toast.

### 7.10. Admin – Quản lý đơn hàng — `/admin/orders`

- Bảng: Mã đơn · Khách hàng · Ngày đặt · Tổng tiền · Trạng thái (OrderBadge) · Cập nhật. Bộ lọc theo trạng thái (chip: Tất cả + 5 trạng thái).
- **Cột Cập nhật:** dropdown chỉ liệt kê **bước tiếp theo hợp lệ**:

| Hiện tại | Lựa chọn hiển thị |
|---|---|
| `PENDING` | Đang xử lý, Hủy đơn |
| `PROCESSING` | Đang giao, Hủy đơn |
| `SHIPPING` | Hoàn thành, Hủy đơn |
| `COMPLETED` / `CANCELLED` | (không có, hiện "—") |

- Chọn "Hủy đơn" mở `ConfirmDialog` ("Hủy đơn này? Tồn kho sẽ được hoàn lại."). Cập nhật xong có toast và đổi badge ngay.
- Bấm vào hàng mở chi tiết đơn (modal hoặc trang) hiển thị thông tin giao hàng và sản phẩm.

### 7.11. Trang lỗi

- **404** "Không tìm thấy trang" và **403** "Bạn không có quyền truy cập": căn giữa, emoji/minh họa lớn, mô tả ngắn, nút "Về trang chủ".

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

## 9. Microcopy tiếng Việt (chuẩn)

| Ngữ cảnh | Nội dung |
|---|---|
| Thêm giỏ | "Đã thêm vào giỏ hàng" |
| Xóa khỏi giỏ | "Đã xóa khỏi giỏ hàng" |
| Vượt tồn kho | "Chỉ còn {n} sản phẩm trong kho" |
| Đặt hàng thành công | "Đặt hàng thành công!" |
| Đặt hàng lỗi | "Không thể đặt hàng. Vui lòng kiểm tra lại." |
| Giỏ trống | "Giỏ hàng của bạn đang trống" |
| Chưa có đơn | "Bạn chưa có đơn hàng nào" |
| Không có kết quả | "Không tìm thấy sản phẩm phù hợp" |
| Lỗi tải | "Không tải được dữ liệu. Vui lòng thử lại." |
| Đăng xuất | "Đăng xuất" |
| Hết phiên | "Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại." |
| Lưu thành công | "Cập nhật thành công" |
| Xóa xác nhận | "Bạn có chắc muốn xóa? Hành động này không thể hoàn tác." |
| AI đang tạo | "Đang tạo mô tả…" |
| AI lỗi | "Không tạo được mô tả. Vui lòng thử lại." |
| Chat lời chào | "Xin chào! Mình có thể giúp bạn tìm sản phẩm hôm nay 🎁" |
| Chat đang trả lời | "Đang trả lời…" |
| Chat lỗi | "Mình chưa trả lời được lúc này." |

Giọng văn: thân thiện, ngắn gọn, xưng "bạn"/"mình". Không dùng thuật ngữ kỹ thuật với khách hàng.

---

## 10. Quy tắc định dạng dữ liệu

| Dữ liệu | Quy tắc | Ví dụ |
|---|---|---|
| Tiền | `Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' })` | `1.250.000 ₫` |
| Ngày giờ | `dd/MM/yyyy HH:mm` (giờ địa phương) | `26/10/2026 14:30` |
| Rating | 1 chữ số thập phân + icon sao | `★ 4.5` |
| Mã đơn | Tiền tố `#` | `#1024` |
| SĐT | Hiển thị liền, không dấu cách thừa | `0912345678` |

Đặt hàm trong `src/utils/formatCurrency.js`, `formatDate.js` và dùng thống nhất.

---

## 11. Khả năng truy cập (Accessibility)

- Tương phản chữ/nền tối thiểu **4.5:1** (chữ thường), **3:1** (chữ lớn, icon quan trọng). Chữ trắng trên `primary` chỉ dùng với `primary-700` trở lên.
- Mọi phần tử tương tác dùng được bằng bàn phím (Tab/Enter/Space/Esc); focus nhìn thấy rõ (`:focus-visible`).
- Ảnh có `alt`; nút icon có `aria-label`; modal có `role="dialog"` + `aria-modal` + `aria-labelledby`.
- Không truyền đạt thông tin chỉ bằng màu (badge luôn có chữ, lỗi luôn có chữ + icon).
- Vùng bấm tối thiểu 44×44px trên mobile.
- Thẻ HTML ngữ nghĩa: `header`, `nav`, `main`, `footer`, một `h1` mỗi trang.

---

## 12. Ánh xạ thiết kế → code

```
src/
├── components/
│   ├── ui/                 Button, Input, Textarea, Select, QuantityStepper, Badge,
│   │                       OrderBadge, Toast/ToastContainer, Modal, ConfirmDialog,
│   │                       Table, Pagination, Skeleton, Spinner, EmptyState, ErrorState, Drawer
│   ├── layout/             Navbar, Footer, SidebarAdmin, Topbar
│   ├── product/            ProductCard, ProductCardSkeleton, ProductGrid, FilterBar, SortSelect
│   ├── cart/               CartItem, CartSummary
│   ├── order/              OrderRow, OrderTimeline
│   └── chat/               ChatWidget, ChatMessage, ChatProductCard
├── layouts/                MainLayout, AdminLayout
├── pages/                  Home, ProductDetail, Login, Register, Cart, Checkout, OrderSuccess,
│                           Orders, OrderDetail, Profile, NotFound, Forbidden
│   └── admin/              AdminProducts, AdminProductForm, AdminOrders
└── utils/                  formatCurrency, formatDate, validators, constants (ORDER_STATUS, ...)
```

`constants.js` chứa bản đồ trạng thái đơn (nhãn + lớp màu) và quy tắc chuyển trạng thái hợp lệ để dùng chung cho `OrderBadge` và dropdown Admin.

---

## 13. Dữ liệu mẫu cho mock (gợi ý)

**Danh mục:** Đồ chơi · Quà tặng · Phụ kiện · Văn phòng phẩm · Gối & thú bông

| Tên sản phẩm | Danh mục | Giá (₫) | Tồn kho | Rating |
|---|---|---:|---:|---:|
| Gấu bông Capybara 40cm | Gối & thú bông | 189.000 | 25 | 4.8 |
| Hộp quà bất ngờ Mystery Box | Quà tặng | 249.000 | 12 | 4.6 |
| Móc khóa mèo thần tài | Phụ kiện | 45.000 | 80 | 4.4 |
| Bút gel kitty set 10 cây | Văn phòng phẩm | 59.000 | 60 | 4.5 |
| Xếp hình khủng long 3D | Đồ chơi | 129.000 | 3 | 4.7 |
| Gối ôm bánh mì hình thú | Gối & thú bông | 159.000 | 18 | 4.9 |
| Ví silicon trái bơ | Phụ kiện | 79.000 | 0 | 4.2 |
| Sổ tay bìa da Pastel | Văn phòng phẩm | 89.000 | 40 | 4.3 |

Tài khoản mock: `admin@funnyshop.vn / Admin@123` (ADMIN) và `user@funnyshop.vn / User@123` (CUSTOMER).

---

## 14. Checklist nghiệm thu UI (mỗi trang phải đạt)

- [ ] Dùng đúng token màu/chữ/khoảng cách, không có giá trị tùy ý.
- [ ] Hiển thị đúng ở 375px, 768px, 1280px; không cuộn ngang.
- [ ] Có đủ 3 trạng thái: loading, empty, error.
- [ ] Form có validate từng ô; nút gửi có loading và chống bấm nhiều lần.
- [ ] Mọi hành động quan trọng có toast phản hồi.
- [ ] Dùng được hoàn toàn bằng bàn phím; focus nhìn thấy; có `alt`/`aria-label`.
- [ ] Giá, ngày giờ đúng định dạng mục 10; chuỗi giao diện đúng mục 9.
- [ ] Ảnh có `loading="lazy"`; route dùng `React.lazy`; FCP dưới 2 giây (NFR-02).
- [ ] Chạy được trên Chrome, Edge, Firefox, Safari (NFR-11).
- [ ] `npm run lint` và `npm run build` không lỗi.