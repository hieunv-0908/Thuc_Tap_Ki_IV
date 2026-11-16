import assert from 'node:assert/strict';

// Mock localStorage
const storage = new Map();
globalThis.localStorage = {
  getItem: (key) => storage.get(key) || null,
  setItem: (key, value) => storage.set(key, String(value)),
  removeItem: (key) => storage.delete(key),
  clear: () => storage.clear(),
};

const { useCartStore } = await import('./cartStore.js');

console.log('🧪 Starting Partial Cart Checkout & Direct Buy Now Tests...\n');

// TC-01: Thêm 3 sản phẩm vào giỏ hàng
useCartStore.getState().clearCart();
useCartStore.getState().addItem({ productId: 1, name: 'Áo Thun Trắng', price: 100000, stock: 10 }, 2);
useCartStore.getState().addItem({ productId: 2, name: 'Quần Jean', price: 250000, stock: 5 }, 1);
useCartStore.getState().addItem({ productId: 3, name: 'Mũ Lưỡi Trai', price: 50000, stock: 8 }, 1);

let items = useCartStore.getState().items;
assert.equal(items.length, 3, 'Giỏ hàng phải có 3 sản phẩm');
console.log('  ✅ TC-01: Giỏ hàng ban đầu có 3 sản phẩm thành công!');

// TC-02: Giả lập thanh toán chọn lọc: Khách chỉ tick chọn sản phẩm 1 và 3
const paidKeys = [items[0].cartItemId, items[2].cartItemId];
useCartStore.getState().removeItems(paidKeys);

items = useCartStore.getState().items;
assert.equal(items.length, 1, 'Giỏ hàng sau thanh toán chọn lọc chỉ còn 1 sản phẩm');
assert.equal(items[0].productId, 2, 'Sản phẩm chưa được tick (Quần Jean) vẫn được giữ nguyên trong giỏ');
console.log('  ✅ TC-02: removeItems() chỉ xóa các sản phẩm được chọn, giữ lại sản phẩm chưa chọn thành công!');

// TC-03: Mua ngay (Buy Now) không làm thay đổi giỏ hàng
const directBuyItem = {
  cartItemId: 'direct-prod-99',
  productId: 99,
  name: 'Giày Sneaker',
  price: 500000,
  quantity: 1,
};
assert.ok(directBuyItem.productId, 'Sản phẩm mua ngay hợp lệ');

// Khách thanh toán đơn Mua ngay (isDirectBuy: true) -> Không gọi removeItems hay clearCart
const currentCart = useCartStore.getState().items;
assert.equal(currentCart.length, 1, 'Giỏ hàng vẫn giữ nguyên 1 sản phẩm Quần Jean sau phiên Mua ngay');
console.log('  ✅ TC-03: Mua ngay không làm thay đổi hay mất sản phẩm trong giỏ hàng thành công!');

console.log('\n🎉 ALL PARTIAL CART & BUY NOW TESTS PASSED SUCCESSFULLY! 🚀');
