# KẾ HOẠCH TRIỂN KHAI CHI TIẾT - GIAI ĐOẠN 1 (PHASE 1)

## DỰ ÁN: FUNNYSHOP FRONTEND
**Chủ đề:** Tách biệt giỏ hàng theo tài khoản / khách & Xử lý dọn dẹp khi đăng xuất  
**Mã tài liệu:** `docs/PLAN_PHASE_1_CART_ISOLATION.md`  
**Mục tiêu chính:**
1. Đảm bảo giỏ hàng của từng tài khoản được lưu trữ độc lập tuyệt đối.
2. Đăng xuất tài khoản sẽ không làm rò rỉ các sản phẩm đã thêm sang tài khoản khác hoặc phiên khách (Guest) sau đó.
3. Hỗ trợ cơ chế gộp giỏ hàng thông minh (Cart Merge): Khi khách vãng lai thêm đồ rồi mới bấm Đăng nhập, các sản phẩm sẽ được tự động gộp vào tài khoản cá nhân.

---

## I. PHÂN TÍCH HIỆN TRẠNG & NGUYÊN NHÂN GỐC RỄ (ROOT CAUSE)

### 1. Hiện trạng code hiện tại
Trong `frontend/src/store/cartStore.js`:
```javascript
export const useCartStore = create(
  persist(
    (set, get) => ({
      items: [],
      // ...
    }),
    {
      name: 'funnyshop_cart', // <--- CỐ ĐỊNH DUY NHẤT 1 KEY CHO TOÀN BỘ TRÌNH DUYỆT
      // ...
    }
  )
);
```

### 2. Chuỗi sự kiện gây lỗi rò rỉ dữ liệu
1. **User A đăng nhập:** Thêm sản phẩm X, Y vào giỏ. Zustand persist ghi vào key `'funnyshop_cart'` trong `localStorage`.
2. **User A đăng xuất:** Trong `authStore.js`, hàm `logout()` chỉ reset token và thông tin user (`token: null`, `user: null`), hoàn toàn **không chạm vào `cartStore`**.
3. **Khách vãng lai (hoặc User B) truy cập:**
   - Do Zustand đọc key `'funnyshop_cart'`, toàn bộ sản phẩm X, Y của User A vẫn hiển thị nguyên vẹn trên Navbar badge và trang Cart.
   - Nếu User B đăng nhập vào trình duyệt đó, User B thấy và có thể thanh toán nhầm giỏ hàng của User A.

---

## II. KIẾN TRÚC & MÔ HÌNH DỮ LIỆU ĐỀ XUẤT

```mermaid
flowchart TD
    subgraph Storage["Không gian lưu trữ LocalStorage"]
        K1["funnyshop_cart_guest<br/>(Giỏ hàng khách vãng lai)"]
        K2["funnyshop_cart_user_1<br/>(Giỏ hàng của User ID 1)"]
        K3["funnyshop_cart_user_2<br/>(Giỏ hàng của User ID 2)"]
    end

    subgraph Actions["Hành động Người dùng"]
        Guest["Khách chưa đăng nhập"] -->|Ghi/Đọc| K1
        Login["Đăng nhập User 1"] -->|1. Đọc giỏ khách K1 & giỏ User 1 K2<br/>2. Gộp sản phẩm (Merge)<br/>3. Lưu vào K2 & Xóa rỗng K1| K2
        Logout["User 1 Đăng xuất"] -->|1. Lưu giỏ User 1 vào K2<br/>2. Chuyển active key về guest<br/>3. Nạp giỏ khách K1 (trống)| K1
    end
```

### 1. Quy ước đặt tên Key trong LocalStorage
- **Khách chưa đăng nhập (Guest):** `funnyshop_cart_guest`
- **Người dùng đã đăng nhập:** `funnyshop_cart_user_{userId}` (Ví dụ: `funnyshop_cart_user_12`, `funnyshop_cart_user_99`)
- **Tương thích ngược (Backward Compatibility):** Nếu phát hiện key cũ `funnyshop_cart` tồn tại lần đầu tiên, di chuyển dữ liệu sang `funnyshop_cart_guest` rồi xóa key cũ để không làm mất giỏ hàng hiện tại của khách.

### 2. Nguyên lý Hoạt động & Quản lý State

```
+---------------------------------------------------------------------------------------+
| Zustand Store: useCartStore                                                           |
| State:                                                                                |
|   - activeCartKey: 'guest' | 'user_{id}'                                              |
|   - items: Array<CartItem>                                                            |
| Actions:                                                                              |
|   - initCart(userId)              : Xác định key hiện hành và nạp dữ liệu             |
|   - syncToStorage()               : Ghi đè items hiện tại vào key tương ứng           |
|   - onLoginSuccess(userId)        : Merge giỏ guest vào giỏ user, kích hoạt key user  |
|   - onLogout()                    : Lưu giỏ user, xóa state in-memory, chuyển về guest|
|   - addItem / updateQty / remove  : Thao tác giỏ hàng + tự động lưu theo active key   |
|   - clearCart()                   : Xóa rỗng giỏ của active key hiện hành             |
+---------------------------------------------------------------------------------------+
```

---

## III. THUẬT TOÁN & LOGIC CHI TIẾT

### 1. Thuật toán Gộp giỏ hàng (Cart Merge Algorithm)
Khi khách thêm đồ rồi mới thực hiện đăng nhập:
```javascript
function mergeCarts(guestItems, userItems) {
  const mergedMap = new Map();

  // 1. Nạp toàn bộ giỏ hiện có của User vào Map
  for (const item of userItems) {
    const key = item.cartItemId || (item.variantId ? `var-${item.variantId}` : `prod-${item.id}`);
    mergedMap.set(key, { ...item });
  }

  // 2. Duyệt qua từng món trong giỏ Guest
  for (const guestItem of guestItems) {
    const key = guestItem.cartItemId || (guestItem.variantId ? `var-${guestItem.variantId}` : `prod-${guestItem.id}`);
    const maxStock = guestItem.stock || guestItem.stockQuantity || 999;

    if (mergedMap.has(key)) {
      // Nếu đã có trong giỏ user: cộng dồn số lượng nhưng không vượt quá tồn kho
      const existing = mergedMap.get(key);
      const newQty = Math.min(existing.quantity + guestItem.quantity, maxStock);
      mergedMap.set(key, { ...existing, quantity: newQty });
    } else {
      // Nếu chưa có: thêm mới vào giỏ user
      mergedMap.set(key, { ...guestItem });
    }
  }

  return Array.from(mergedMap.values());
}
```

### 2. Thuật toán Chuyển đổi ngữ cảnh khi Đăng xuất (Logout Flow)
```javascript
function handleLogout() {
  // 1. Lưu snapshot lần cuối của tài khoản hiện tại vào funnyshop_cart_user_{currentUserId}
  saveToStorage(`funnyshop_cart_user_${currentUserId}`, currentItems);

  // 2. Chuyển context activeCartKey về 'guest'
  activeCartKey = 'guest';

  // 3. Đọc dữ liệu từ funnyshop_cart_guest (thường là rỗng sau khi đã merge ở lần login trước)
  const guestItems = loadFromStorage('funnyshop_cart_guest') || [];

  // 4. Cập nhật state in-memory
  set({ items: guestItems, activeCartKey: 'guest' });
}
```

### 3. Thuật toán Khởi tạo khi Tải trang (Page Refresh / Hydration)
- Kiểm tra `authStore`:
  - Nếu đã đăng nhập (`authStore.user?.id` có giá trị) $\rightarrow$ Active key = `user_${authStore.user.id}`. Nạp giỏ hàng từ `funnyshop_cart_user_${user.id}`.
  - Nếu là khách (`authStore.user == null`) $\rightarrow$ Active key = `guest`. Nạp giỏ hàng từ `funnyshop_cart_guest`.

---

## IV. BẢNG THAY ĐỔI CHI TIẾT THEO TỪNG FILE

### 1. File: `frontend/src/store/cartStore.js`
- **Mục đích:** Chuyển đổi từ `persist` cố định sang quản lý lưu trữ động theo `activeCartKey`.
- **Nội dung bổ sung / cập nhật:**
  - Định nghĩa helper `getCartKey(userId)`: trả về `funnyshop_cart_user_${userId}` hoặc `funnyshop_cart_guest`.
  - Helper `loadCartFromStorage(key)` và `saveCartToStorage(key, items)`.
  - Hàm `initCart(userId)`: Được gọi khi App khởi chạy hoặc khi user thay đổi.
  - Hàm `onLoginSuccess(userId)`: Thực hiện merge giỏ guest vào user, dọn sạch giỏ guest, cập nhật state.
  - Hàm `onLogout()`: Lưu lại giỏ user cũ, chuyển state items về giỏ guest mới.
  - Tự động gọi `saveCartToStorage` trong `addItem`, `updateQuantity`, `removeItem`, `clearCart`.

### 2. File: `frontend/src/store/authStore.js`
- **Mục đích:** Gắn kết vòng đời Authentication với Cart State.
- **Nội dung cập nhật:**
  - Trong `login(token, refreshToken, user)`:
    - Gọi `useCartStore.getState().onLoginSuccess(user.id)`.
  - Trong `logout()`:
    - Gọi `useCartStore.getState().onLogout()`.
  - Trong `onRehydrateStorage`:
    - Khi auth state nạp xong từ LocalStorage, gọi `useCartStore.getState().initCart(state.user?.id)`.

### 3. File: `frontend/src/api/axios.js`
- **Mục đích:** Đảm bảo khi token hết hạn và refresh token thất bại (401 interceptor), giỏ hàng cũng được chuyển về guest an toàn.
- **Nội dung kiểm tra:** Vì `axios.js` gọi `useAuthStore.getState().logout()`, hook trong `authStore` sẽ tự động kích hoạt `cartStore.onLogout()`.

### 4. File: `frontend/src/pages/Checkout.jsx`
- **Mục đích:** Xác minh giỏ hàng sau khi đặt hàng thành công (`clearCart()`) chỉ xóa đúng giỏ hàng của user đang đăng nhập hiện tại, không ảnh hưởng tới guest.

---

## V. MA TRẬN TEST CASE (TEST SPECIFICATION)

| Mã Test Case | Kịch bản kiểm thử | Các bước thực hiện | Kết quả mong đợi |
|---|---|---|---|
| **TC-01** | Khách thêm hàng và duyệt web bình thường | 1. Chưa đăng nhập.<br/>2. Thêm SP A (số lượng 2).<br/>3. F5 tải lại trang. | Badge hiển thị 2. LocalStorage lưu tại `funnyshop_cart_guest`. Không xuất hiện key user. |
| **TC-02** | Khách đăng nhập $\rightarrow$ Merge giỏ hàng | 1. Khách có SP A (qty 2).<br/>2. Đăng nhập User 1 (trước đó User 1 đã có sẵn SP B qty 1). | Sau khi login: Giỏ có cả SP A (qty 2) và SP B (qty 1). Key `funnyshop_cart_guest` bị làm rỗng. Key `funnyshop_cart_user_1` lưu đủ A và B. |
| **TC-03** | Khách đăng nhập với cùng sản phẩm đã có | 1. Khách có SP A (qty 2, tồn kho = 5).<br/>2. Đăng nhập User 1 (đã có sẵn SP A qty 2). | Giỏ hàng User 1 có SP A với số lượng = 4 ($\le$ tồn kho 5). |
| **TC-04** | Đăng xuất tài khoản $\rightarrow$ Giỏ hàng về trống | 1. User 1 đang có 3 sản phẩm trong giỏ.<br/>2. Bấm "Đăng xuất" trên Navbar. | Đăng xuất thành công. Badge giỏ hàng về 0. Vào `/cart` hiển thị Empty State. Giỏ của User 1 vẫn được bảo toàn trong `funnyshop_cart_user_1`. |
| **TC-05** | Đăng nhập tài khoản khác (User 2) | 1. Sau khi User 1 đăng xuất.<br/>2. Đăng nhập bằng tài khoản User 2 (chưa từng thêm đồ). | Giỏ hàng User 2 trống (0 sản phẩm). Tuyệt đối không nhìn thấy 3 sản phẩm của User 1. |
| **TC-06** | Đăng nhập lại User 1 | 1. User 2 đăng xuất.<br/>2. Đăng nhập lại User 1. | Giỏ hàng User 1 phục hồi đầy đủ 3 sản phẩm ban đầu. |
| **TC-07** | Đặt hàng thành công | 1. User 1 hoàn tất thanh toán checkout.<br/>2. `clearCart()` được gọi. | Chỉ key `funnyshop_cart_user_1` bị làm rỗng. Không tác động đến các user khác. |

---

## VI. CHECKLIST TIẾN ĐỘ THỰC HIỆN (EXECUTION CHECKLIST)

- [x] **Bước 1:** Rà soát và cập nhật mã nguồn `frontend/src/store/cartStore.js` theo thiết kế dynamic storage.
- [x] **Bước 2:** Cập nhật `frontend/src/store/authStore.js` để liên kết các action `onLoginSuccess`, `onLogout`, `initCart`.
- [x] **Bước 3:** Kiểm tra khởi tạo hydration và migration từ key legacy `funnyshop_cart`.
- [x] **Bước 4:** Chạy kiểm thử tự động toàn bộ 7 kịch bản từ `TC-01` đến `TC-07` trong `cartIsolation.test.js` (Kết quả: 100% Passed).
- [x] **Bước 5:** Hoàn thành kiểm tra `npm run build` không lỗi. Sẵn sàng chuyển giao sang Giai đoạn 2 (Hệ thống Voucher).

