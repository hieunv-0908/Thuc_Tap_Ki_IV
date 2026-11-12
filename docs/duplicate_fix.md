Kế hoạch toàn diện sửa lỗi Duplicate Key & Xung đột Biến thể sản phẩm (Frontend, Backend & State Store)
1. Mục tiêu kế hoạch
Dùng chung một nguồn chân lý (Single Source of Truth) cho Key: Khắc phục triệt để lỗi Duplicate Key (Encountered two children with the same key) bằng cách sinh và lưu trực tiếp cartItemId chuẩn từ State Store.
Tối ưu vòng đời Zustand với tùy chọn merge: Dùng hàm merge bất biến của middleware persist để làm sạch dữ liệu giỏ hàng cũ trước khi nạp vào store, kích hoạt React re-render chuẩn xác ngay lần đầu.
Tối ưu UX cho luồng Mua lại (handleReorder): Gộp thông báo Toast thông minh, hướng dẫn khách hàng chọn lại phân loại cho sản phẩm cũ mà không gây rối loạn trải nghiệm.
Phòng ngừa bẫy Hibernate Soft Delete: Thêm @NotFound(action = NotFoundAction.IGNORE) trên quan hệ productVariant của OrderItem và đảm bảo mapper sang OrderItemResponse hoàn toàn Null-safe.
Đảm bảo tính toàn vẹn tại Backend (OrderServiceImpl.java): Kiểm soát quan hệ Product - ProductVariant, ngăn chặn hành vi gộp mù quáng và bảo đảm cơ chế Rollback Stock chính xác 100%.
2. Chi tiết các Task kỹ thuật
Task 1: Chuẩn hóa cartStore.js với tùy chọn merge của Zustand Persist
File: frontend/src/store/cartStore.js
Giải pháp kỹ thuật chi tiết:
Sinh thuộc tính cartItemId làm Single Source of Truth:
javascript
const cartItemId = targetVariant?.id || itemOrProduct.variantId
  ? `var-${targetVariant?.id || itemOrProduct.variantId}`
  : `prod-${rawProduct.id}`;
Lưu trực tiếp trường cartItemId vào mỗi object item trong items:
javascript
const newItem = {
  cartItemId,
  id: resolvedVariantId,
  variantId: targetVariant?.id || itemOrProduct.variantId || null,
  productId: rawProduct.id,
  ...
};
Tìm kiếm & Cập nhật/Xóa theo cartItemId:
Trong addItem: Tìm item đã tồn tại bằng item.cartItemId === cartItemId (chính xác tuyệt đối, loại trừ lỗi undefined === undefined).
Trong updateQuantity(cartItemId, quantity) và removeItem(cartItemId): Tìm và thao tác chính xác theo item.cartItemId === cartItemId.
Làm sạch bất biến dữ liệu cũ qua tùy chọn merge: Thay vì mutate trực tiếp state.items trong onRehydrateStorage, sử dụng tùy chọn merge để đảm bảo React kích hoạt re-render hoàn hảo:
javascript
{
  name: 'funnyshop_cart',
  merge: (persistedState, currentState) => {
    const rawItems = Array.isArray(persistedState?.items) ? persistedState.items : [];
    const sanitizedItems = rawItems
      .filter((item) => item && (item.variantId || item.productId || item.product?.id))
      .map((item) => ({
        ...item,
        cartItemId:
          item.cartItemId ||
          (item.variantId ? `var-${item.variantId}` : `prod-${item.productId || item.product?.id}`),
      }));
    return {
      ...currentState,
      ...persistedState,
      items: sanitizedItems,
    };
  },
}
Task 2: Dùng cartItemId tại Cart.jsx, CartItem.jsx & Checkout.jsx
Tại frontend/src/components/cart/CartItem.jsx:
Tách biệt rõ ràng:
javascript
const itemId = item.cartItemId || item.variantId || item.id;
const productDetailId = item.productId || product?.id;
itemId dùng cho thao tác giỏ hàng (onUpdateQuantity(itemId, ...), onRemove(itemId)).
productDetailId dùng cho link chuyển trang (/products/${productDetailId}).
Tại frontend/src/pages/Cart.jsx (Dòng 107):
Chuẩn hóa mới:
jsx
{items.map((item) => (
  <CartItem
    key={item.cartItemId}
    item={item}
    onUpdateQuantity={(qty) => updateQuantity(item.cartItemId, qty)}
    onRemove={() => removeItem(item.cartItemId)}
  />
))}
Bỏ 100% việc dùng idx làm key, ngăn chặn lỗi nhảy/lệch Virtual DOM khi xóa item giữa danh sách.
Tại frontend/src/pages/Checkout.jsx (Dòng 446 - 449):
Dùng key={item.cartItemId} cho danh sách tóm tắt giỏ hàng.
Tại hàm handleSubmit, payload được trích xuất an toàn:
javascript
items: items.map((i) => ({
  variantId: i.variantId || undefined,
  productId: i.productId || i.product?.id,
  quantity: i.quantity,
}))
Task 3: Tối ưu Toast & Điều hướng tại handleReorder (OrderDetail.jsx)
Vị trí 1 - Dòng 285 (Key render danh sách đơn hàng):
Sử dụng trực tiếp item.id (order_item_id từ CSDL, luôn là duy nhất):
jsx
key={item.id}
Vị trí 2 - Dòng 72 - 95 (Hàm handleReorder):
Khắc phục lỗi bắn 2 Toast dồn dập: Gộp thông báo thông minh để người dùng kịp đọc:
javascript
const handleReorder = () => {
  if (!order || !order.items) return;
  let addedCount = 0;
  let hasLegacyItems = false;
  let legacyProduct = null;
  order.items.forEach((item) => {
    // Nếu sản phẩm trong đơn cũ không có variantId (tạo trước khi có biến thể)
    if (!item.variantId) {
      hasLegacyItems = true;
      legacyProduct = item;
      return;
    }
    const variantPayload = {
      variantId: item.variantId,
      productId: item.productId,
      name: item.name || item.productName,
      sku: item.sku,
      color: item.color,
      size: item.size,
      price: item.price ?? item.priceAtOrder,
      imageUrl: item.imageUrl,
      stockQuantity: 99,
    };
    const ok = addItem(variantPayload, item.quantity || 1);
    if (ok) addedCount++;
  });
  // Xử lý thông báo Toast gộp thông minh
  if (addedCount > 0 && hasLegacyItems) {
    toast.warning(
      `Đã thêm ${addedCount} sản phẩm vào giỏ; một số sản phẩm cũ cần chọn lại phân loại.`
    );
    navigate('/cart');
  } else if (addedCount > 0) {
    toast.success(`Đã thêm ${addedCount} sản phẩm vào giỏ hàng`);
    navigate('/cart');
  } else if (hasLegacyItems) {
    toast.warning(
      `Sản phẩm '${legacyProduct?.name || 'trong đơn'}' đã có phân loại kích cỡ/màu sắc mới. Vui lòng chọn lại biến thể.`
    );
    if (legacyProduct?.productId) {
      navigate(`/products/${legacyProduct.productId}`);
    }
  }
};
Task 4: Cập nhật AdminOrderDetailModal.jsx & Hiển thị thông tin phân loại
File: frontend/src/components/admin/AdminOrderDetailModal.jsx
Vị trí (Dòng 97):
Đổi key thành key={item.id} (ID duy nhất của dòng đơn hàng).
Bổ sung hiển thị thông tin phân loại (Màu sắc, Size, SKU) dưới tên sản phẩm:
jsx
{(item.color || item.size || item.sku) && (
  <p className="text-[11px] text-ink-subtle mt-0.5">
    Phân loại: {[item.color, item.size].filter(Boolean).join(' - ')} {item.sku ? `(SKU: ${item.sku})` : ''}
  </p>
)}
Task 5: Phòng thủ Hibernate Soft Delete & Hardening Backend

File 1: backend/src/main/java/com/funnyshop/entity/OrderItem.java

Thêm annotation @NotFound(action = NotFoundAction.IGNORE) trên trường productVariant:
java
@ManyToOne(fetch = FetchType.LAZY)
@JoinColumn(name = "product_variant_id", nullable = true)
@org.hibernate.annotations.NotFound(action = org.hibernate.annotations.NotFoundAction.IGNORE)
private ProductVariant productVariant;
(Tự động chuyển fetch sang EAGER trong Hibernate 6 / Spring Boot 3, vừa tránh LazyInitializationException, vừa ngăn sập API nếu variant bị xóa).

File 2: backend/src/main/java/com/funnyshop/dto/response/OrderItemResponse.java

Đảm bảo mapping hoàn toàn Null-safe:
java
ProductVariant variant = item.getProductVariant();
if (variant != null) {
    varId = variant.getId();
    sku = variant.getSku();
    color = variant.getColor();
    size = variant.getSize();
    if (variant.getProduct() != null) {
        prodId = variant.getProduct().getId();
        prodName = variant.getProduct().getName();
        prodImg = variant.getImageUrl();
    }
} else if (item.getProduct() != null) {
    prodId = item.getProduct().getId();
    prodName = item.getProduct().getName();
    prodImg = item.getProduct().getImageUrl();
}

File 3: backend/src/main/java/com/funnyshop/service/impl/OrderServiceImpl.java

Validate quan hệ Product - ProductVariant:
java
if (variant.getProduct() != null && !variant.getProduct().getId().equals(itemReq.getProductId())) {
    throw new AppException("Biến thể ID " + variantId + " không thuộc về sản phẩm ID " + itemReq.getProductId(), HttpStatus.BAD_REQUEST);
}
Chặn việc gộp mù quáng vào biến thể đầu tiên: Nếu request gửi nhiều item của cùng một productId mà để variantId == null, Backend bắt buộc ném ra lỗi BAD_REQUEST yêu cầu client chỉ định rõ biến thể thay vì âm thầm gộp vào variants.get(0).
Kiểm tra Rollback Stock: Đảm bảo trong updateOrderStatus(CANCELLED), vòng lặp duyệt qua đúng từng OrderItem và hoàn kho nguyên tử theo đúng variant.getId().
3. Quy trình thực hiện chi tiết (Step-by-Step Execution Plan)
Bước 1: Triển khai Task 1 (Tầng State Store)
Sửa cartStore.js: Thêm merge vào cấu hình persist, sinh cartItemId, viết lại updateQuantity và removeItem.
Bước 2: Triển khai Task 2 & Task 3 (Tầng UI Khách hàng)
Cập nhật CartItem.jsx: Tách itemId (cho cart action) và productDetailId (cho link chi tiết).
Cập nhật Cart.jsx và Checkout.jsx: Chuyển sang dùng key={item.cartItemId}.
Cập nhật OrderDetail.jsx: Chuyển sang key={item.id} và tinh chỉnh hàm handleReorder với thông báo Toast gộp.
Bước 3: Triển khai Task 4 (Tầng UI Admin)
Cập nhật AdminOrderDetailModal.jsx: Đổi sang key={item.id} và thêm hiển thị thông tin phân loại Màu/Size/SKU.
Bước 4: Triển khai Task 5 (Tầng Backend & Entity Phòng thủ)
Cập nhật OrderItem.java: Bổ sung @NotFound(action = NotFoundAction.IGNORE) phòng thủ.
Kiểm tra OrderItemResponse.java: Đảm bảo logic mapping Null-safe.
Cập nhật OrderServiceImpl.java: Thêm validation quan hệ variant-product và chặn gộp mù quáng khi thiếu variantId.
Cập nhật unit test trong OrderServiceImplTest.java.
Bước 5: Kiểm tra Syntax, Build & Kiểm thử Nghiệm thu
Chạy npm run lint / npm run build ở frontend.
Chạy ./gradlew test --tests com.funnyshop.service.OrderServiceImplTest ở backend.
Thực thi toàn bộ 9 kịch bản kiểm thử nghiệm thu (TC-01 đến TC-09).
4. Tiêu chí nghiệm thu (Acceptance Criteria)
STT	Kịch bản kiểm thử	Hành vi mong đợi
TC-01	Trình duyệt nạp dữ liệu cũ từ localStorage khi mở web.	Tùy chọn merge tự động làm sạch và sinh cartItemId chuẩn. Giao diện re-render chuẩn xác mà không bị crash hay warning.
TC-02	Thêm 2 biến thể của cùng 1 sản phẩm vào giỏ hàng.	Mỗi biến thể mang cartItemId riêng biệt (var-10, var-20). Xóa 1 biến thể không làm lệch Virtual DOM của biến thể còn lại.
TC-03	Mở trang Giỏ hàng (/cart) và Thanh toán (/checkout).	Sử dụng chung key={item.cartItemId}. Console hoàn toàn sạch 100%, không còn warning Duplicate Key.
TC-04	Bấm "Mua lại" trên đơn hàng cũ vừa có món hợp lệ vừa có món thiếu variantId.	Hệ thống hiển thị 1 Toast gộp duy nhất: "Đã thêm X sản phẩm vào giỏ; một số sản phẩm cũ cần chọn lại phân loại" và điều hướng vào /cart.
TC-05	Bấm "Mua lại" trên đơn hàng cũ 100% thiếu variantId.	Hiển thị Toast cảnh báo cần chọn lại biến thể và điều hướng về trang chi tiết sản phẩm. Không đẩy item rỗng vào giỏ.
TC-06	Admin mở Modal chi tiết đơn hàng.	Danh sách sản phẩm render với key={item.id} duy nhất, hiển thị đầy đủ thông tin phân loại Màu/Size/SKU.
TC-07	Client gửi request thanh toán 2 biến thể cùng 1 sản phẩm.	Backend tạo đúng 2 dòng trong order_items, trừ kho riêng biệt cho từng biến thể.
TC-08	Client cố tình gửi 2 item cùng productId nhưng variantId == null.	Backend phát hiện và trả về lỗi BAD_REQUEST, từ chối ngầm gộp vào biến thể đầu tiên.
TC-09	Admin hủy đơn hàng chứa nhiều biến thể của cùng 1 sản phẩm.	Cả 2 biến thể đều được hoàn lại đúng số lượng tồn kho trong CSDL (incrementStockAtomic).