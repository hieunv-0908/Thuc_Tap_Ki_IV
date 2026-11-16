// Test suite verifying TC-01 through TC-07 from docs/PLAN_PHASE_1_CART_ISOLATION.md
import assert from 'node:assert';

// 1. Mock LocalStorage in Node environment
const storageMock = (() => {
  let store = {};
  return {
    getItem: (key) => store[key] || null,
    setItem: (key, val) => {
      store[key] = String(val);
    },
    removeItem: (key) => {
      delete store[key];
    },
    clear: () => {
      store = {};
    },
    _dump: () => store,
  };
})();

globalThis.localStorage = storageMock;
globalThis.window = { location: { pathname: '/', search: '', href: '' } };

console.log('🧪 Starting Phase 1 Cart Isolation Tests...\n');

// Import stores after mocking localStorage
const { useCartStore } = await import('./cartStore.js');
const { useAuthStore } = await import('./authStore.js');

// Test 1: TC-01 - Guest adds items and reloads
console.log('▶ Running TC-01: Guest adds items and persists in funnyshop_cart_guest...');
localStorage.clear();
useCartStore.getState().initCart(null);

const item1 = {
  id: 101,
  productId: 101,
  name: 'Funny T-Shirt',
  price: 250000,
  stockQuantity: 10,
};
const added1 = useCartStore.getState().addItem(item1, 2);
assert.strictEqual(added1, true, 'Guest should successfully add item');
assert.strictEqual(useCartStore.getState().getTotalCount(), 2, 'Total cart count should be 2');

const guestStorageRaw = localStorage.getItem('funnyshop_cart_guest');
assert.ok(guestStorageRaw, 'funnyshop_cart_guest must exist in localStorage');
const guestItems = JSON.parse(guestStorageRaw);
assert.strictEqual(guestItems.length, 1);
assert.strictEqual(guestItems[0].quantity, 2);
assert.strictEqual(localStorage.getItem('funnyshop_cart_user_1'), null, 'User cart must not exist');
console.log('  ✅ TC-01 Passed!\n');

// Test 2: TC-02 & TC-03 - Guest logs in as User 1 -> Cart merges
console.log('▶ Running TC-02 & TC-03: Guest logs in -> Merge guest cart into User 1...');
// Giả lập User 1 trước đó đã có sẵn sản phẩm trong giỏ: SP 101 (qty 2) và SP 102 (qty 1)
const user1Initial = [
  {
    cartItemId: 'prod-101',
    id: 101,
    productId: 101,
    name: 'Funny T-Shirt',
    price: 250000,
    stock: 5,
    quantity: 2,
  },
  {
    cartItemId: 'prod-102',
    id: 102,
    productId: 102,
    name: 'Funny Hat',
    price: 150000,
    stock: 10,
    quantity: 1,
  },
];
localStorage.setItem('funnyshop_cart_user_1', JSON.stringify(user1Initial));

// User 1 đăng nhập (khách đang có SP 101 qty 2)
useAuthStore.getState().login('mock-jwt-token-1', 'mock-refresh-token-1', {
  id: 1,
  fullName: 'User One',
  email: 'user1@example.com',
  role: 'CUSTOMER',
});

// Kiểm tra giỏ hàng sau khi merge:
// SP 101 có sẵn 2 + khách thêm 2 = 4 (tồn kho max là 5)
// SP 102 có sẵn 1
// Tổng count = 4 + 1 = 5
const mergedItems = useCartStore.getState().items;
assert.strictEqual(mergedItems.length, 2, 'Should have 2 distinct products');
const sp101 = mergedItems.find((it) => it.id === 101);
const sp102 = mergedItems.find((it) => it.id === 102);

assert.strictEqual(sp101.quantity, 4, 'SP 101 quantity should be merged to 4');
assert.strictEqual(sp102.quantity, 1, 'SP 102 quantity should remain 1');
assert.strictEqual(useCartStore.getState().getTotalCount(), 5);

// Giỏ khách phải được làm rỗng sau khi merge
const guestAfterLogin = JSON.parse(localStorage.getItem('funnyshop_cart_guest'));
assert.strictEqual(guestAfterLogin.length, 0, 'Guest cart must be cleared after login merge');

// Giỏ user_1 phải được cập nhật đầy đủ trong storage
const user1Storage = JSON.parse(localStorage.getItem('funnyshop_cart_user_1'));
assert.strictEqual(user1Storage.length, 2);
console.log('  ✅ TC-02 & TC-03 Passed!\n');

// Test 3: TC-04 - User 1 logs out -> Cart resets to empty guest
console.log('▶ Running TC-04: User 1 logs out -> Cart resets to clean guest state...');
useAuthStore.getState().logout();

assert.strictEqual(useAuthStore.getState().isAuthenticated, false);
assert.strictEqual(useCartStore.getState().getTotalCount(), 0, 'Cart count must be 0 after logout');
assert.strictEqual(useCartStore.getState().items.length, 0, 'Items must be empty array');

// Giỏ của User 1 trong storage vẫn phải còn nguyên vẹn 2 món
const user1StorageStillIntact = JSON.parse(localStorage.getItem('funnyshop_cart_user_1'));
assert.strictEqual(user1StorageStillIntact.length, 2, 'User 1 cart must be preserved in storage');
console.log('  ✅ TC-04 Passed!\n');

// Test 4: TC-05 - User 2 logs in -> Sees only their own cart (empty)
console.log('▶ Running TC-05: User 2 logs in -> Sees completely separate empty cart...');
useAuthStore.getState().login('mock-jwt-token-2', 'mock-refresh-token-2', {
  id: 2,
  fullName: 'User Two',
  email: 'user2@example.com',
  role: 'CUSTOMER',
});

assert.strictEqual(useCartStore.getState().items.length, 0, 'User 2 cart should be empty');
assert.strictEqual(useCartStore.getState().getTotalCount(), 0);

// User 2 thêm 1 sản phẩm mới
const item3 = {
  id: 103,
  productId: 103,
  name: 'Funny Mug',
  price: 90000,
  stockQuantity: 20,
};
useCartStore.getState().addItem(item3, 3);
assert.strictEqual(useCartStore.getState().getTotalCount(), 3);
assert.strictEqual(JSON.parse(localStorage.getItem('funnyshop_cart_user_2')).length, 1);
console.log('  ✅ TC-05 Passed!\n');

// Test 5: TC-06 - User 2 logs out and User 1 logs back in -> User 1 cart restored
console.log('▶ Running TC-06: User 2 logs out and User 1 logs back in -> User 1 items restored...');
useAuthStore.getState().logout();
assert.strictEqual(useCartStore.getState().getTotalCount(), 0);

useAuthStore.getState().login('mock-jwt-token-1', 'mock-refresh-token-1', {
  id: 1,
  fullName: 'User One',
  email: 'user1@example.com',
  role: 'CUSTOMER',
});

assert.strictEqual(useCartStore.getState().getTotalCount(), 5, 'User 1 should regain 5 items');
assert.strictEqual(useCartStore.getState().items.length, 2);
console.log('  ✅ TC-06 Passed!\n');

// Test 6: TC-07 - Clear cart after order completion
console.log('▶ Running TC-07: clearCart() only clears the active user cart...');
useCartStore.getState().clearCart();

assert.strictEqual(useCartStore.getState().getTotalCount(), 0);
assert.strictEqual(JSON.parse(localStorage.getItem('funnyshop_cart_user_1')).length, 0);

// Giỏ của User 2 vẫn phải còn nguyên
assert.strictEqual(JSON.parse(localStorage.getItem('funnyshop_cart_user_2')).length, 1);
console.log('  ✅ TC-07 Passed!\n');

// Test 7: Legacy key migration
console.log('▶ Running Legacy Key Migration Test...');
localStorage.clear();
localStorage.setItem(
  'funnyshop_cart',
  JSON.stringify({
    state: {
      items: [
        {
          id: 999,
          productId: 999,
          name: 'Legacy Product',
          price: 100000,
          quantity: 2,
        },
      ],
    },
  })
);

useCartStore.getState().initCart(null);
assert.strictEqual(useCartStore.getState().getTotalCount(), 2, 'Should migrate legacy items');
assert.strictEqual(localStorage.getItem('funnyshop_cart'), null, 'Legacy key should be removed');
assert.ok(localStorage.getItem('funnyshop_cart_guest'), 'funnyshop_cart_guest should now contain data');
console.log('  ✅ Legacy Key Migration Passed!\n');

console.log('🎉 ALL 7 PHASE 1 TESTS PASSED SUCCESSFULLY! 🚀');

