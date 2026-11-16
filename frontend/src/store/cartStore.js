import { create } from 'zustand';

// Storage keys
const GUEST_CART_KEY = 'funnyshop_cart_guest';
const LEGACY_CART_KEY = 'funnyshop_cart';

/**
 * Lấy storage key tương ứng với user hoặc khách vãng lai
 */
export function getCartStorageKey(userId) {
  if (userId) {
    return `funnyshop_cart_user_${userId}`;
  }
  return GUEST_CART_KEY;
}

/**
 * Đọc user id hiện tại từ localStorage auth (đồng bộ khi khởi tạo store)
 */
function getCurrentAuthUserId() {
  try {
    const raw = localStorage.getItem('funnyshop_auth');
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    return parsed?.state?.user?.id || parsed?.user?.id || null;
  } catch {
    return null;
  }
}

/**
 * Chuẩn hóa danh sách sản phẩm trong giỏ hàng
 */
function sanitizeCartItems(rawItems) {
  if (!Array.isArray(rawItems)) return [];
  return rawItems
    .filter((item) => item && (item.variantId || item.productId || item.product?.id || item.id))
    .map((item) => {
      const variantId = item.variantId || null;
      const prodId = item.productId || item.product?.id || (variantId ? null : item.id);
      const cartItemId = item.cartItemId || (variantId ? `var-${variantId}` : `prod-${prodId}`);
      return {
        ...item,
        variantId,
        productId: prodId || item.productId,
        cartItemId,
        quantity: Math.max(1, Number(item.quantity) || 1),
      };
    });
}

/**
 * Đọc dữ liệu giỏ hàng từ localStorage theo key (kèm cơ chế migrate key cũ)
 */
function loadCartFromStorage(key) {
  try {
    // Nếu là giỏ guest và chưa có data, kiểm tra xem có key legacy 'funnyshop_cart' không
    if (key === GUEST_CART_KEY && !localStorage.getItem(GUEST_CART_KEY)) {
      const legacyRaw = localStorage.getItem(LEGACY_CART_KEY);
      if (legacyRaw) {
        try {
          const legacyParsed = JSON.parse(legacyRaw);
          const legacyItems = sanitizeCartItems(
            legacyParsed?.state?.items || legacyParsed?.items || []
          );
          if (legacyItems.length > 0) {
            localStorage.setItem(GUEST_CART_KEY, JSON.stringify(legacyItems));
            localStorage.removeItem(LEGACY_CART_KEY);
            return legacyItems;
          }
        } catch {
          // Bỏ qua nếu dữ liệu legacy hỏng
        }
      }
    }

    const raw = localStorage.getItem(key);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    const rawList = Array.isArray(parsed) ? parsed : (parsed?.items || parsed?.state?.items || []);
    return sanitizeCartItems(rawList);
  } catch (err) {
    console.error(`[cartStore] Failed to load cart from storage key "${key}":`, err);
    return [];
  }
}

/**
 * Ghi dữ liệu giỏ hàng vào localStorage theo key
 */
function saveCartToStorage(key, items) {
  try {
    if (!key) return;
    localStorage.setItem(key, JSON.stringify(items));
  } catch (err) {
    console.error(`[cartStore] Failed to save cart to storage key "${key}":`, err);
  }
}

// Khởi tạo ngữ cảnh ban đầu
const initialUserId = getCurrentAuthUserId();
const initialKey = getCartStorageKey(initialUserId);
const initialItems = loadCartFromStorage(initialKey);

export const useCartStore = create((set, get) => ({
  activeCartKey: initialKey,
  currentUserId: initialUserId,
  items: initialItems,

  /**
   * Khởi tạo hoặc chuyển đổi giỏ hàng theo User ID
   */
  initCart: (userId = null) => {
    const targetUserId = userId || null;
    const targetKey = getCartStorageKey(targetUserId);

    // Nếu ngữ cảnh không đổi, chỉ đảm bảo nạp đúng items
    if (get().activeCartKey === targetKey && get().currentUserId === targetUserId) {
      return;
    }

    const loadedItems = loadCartFromStorage(targetKey);
    set({
      activeCartKey: targetKey,
      currentUserId: targetUserId,
      items: loadedItems,
    });
  },

  /**
   * Xử lý khi đăng nhập thành công:
   * 1. Nạp giỏ hàng khách hiện tại
   * 2. Nạp giỏ hàng của user
   * 3. Merge giỏ khách vào giỏ user (cộng dồn số lượng, khống chế theo tồn kho)
   * 4. Lưu giỏ đã merge vào user, dọn sạch giỏ khách
   * 5. Chuyển ngữ cảnh activeCartKey sang user
   */
  onLoginSuccess: (userId) => {
    if (!userId) return;

    const guestKey = GUEST_CART_KEY;
    const userKey = getCartStorageKey(userId);

    const guestItems = loadCartFromStorage(guestKey);
    const userItems = loadCartFromStorage(userKey);

    let mergedItems = [...userItems];

    if (guestItems.length > 0) {
      guestItems.forEach((guestItem) => {
        const itemKey =
          guestItem.cartItemId ||
          (guestItem.variantId ? `var-${guestItem.variantId}` : `prod-${guestItem.productId || guestItem.id}`);
        const maxStock = guestItem.stock || guestItem.stockQuantity || 999;

        const existingIndex = mergedItems.findIndex((it) => {
          const itKey =
            it.cartItemId ||
            (it.variantId ? `var-${it.variantId}` : `prod-${it.productId || it.id}`);
          return (
            itKey === itemKey ||
            (guestItem.variantId && String(it.variantId) === String(guestItem.variantId))
          );
        });

        if (existingIndex > -1) {
          const curQty = mergedItems[existingIndex].quantity || 1;
          const newQty = Math.min(curQty + (guestItem.quantity || 1), maxStock);
          mergedItems[existingIndex] = {
            ...mergedItems[existingIndex],
            quantity: newQty,
            stock: maxStock,
          };
        } else {
          mergedItems.push({ ...guestItem });
        }
      });

      // Lưu giỏ hợp nhất vào user key
      saveCartToStorage(userKey, mergedItems);
      // Dọn sạch giỏ khách
      saveCartToStorage(guestKey, []);
    }

    set({
      activeCartKey: userKey,
      currentUserId: userId,
      items: mergedItems,
    });
  },

  /**
   * Xử lý khi đăng xuất:
   * 1. Lưu lại trạng thái giỏ hiện tại vào user key
   * 2. Chuyển ngữ cảnh về guest
   * 3. Nạp giỏ khách (thường là rỗng sau khi đã merge ở lần đăng nhập trước)
   */
  onLogout: () => {
    const prevUserId = get().currentUserId;
    if (prevUserId) {
      saveCartToStorage(getCartStorageKey(prevUserId), get().items);
    }

    const guestKey = GUEST_CART_KEY;
    const guestItems = loadCartFromStorage(guestKey);

    set({
      activeCartKey: guestKey,
      currentUserId: null,
      items: guestItems,
    });
  },

  addItem: (itemOrProduct, quantity = 1) => {
    if (!itemOrProduct) return false;

    // Nếu truyền vào là Product và có danh sách variants, lấy biến thể đầu tiên còn hàng
    let targetVariant = null;
    if (itemOrProduct.variantId) {
      targetVariant = itemOrProduct;
    } else if (Array.isArray(itemOrProduct.variants) && itemOrProduct.variants.length > 0) {
      targetVariant =
        itemOrProduct.variants.find((v) => !v.isDeleted && (v.stockQuantity > 0 || v.stock > 0)) ||
        itemOrProduct.variants.find((v) => !v.isDeleted) ||
        itemOrProduct.variants[0];
    }

    const rawProduct = itemOrProduct.product || itemOrProduct;
    const prodId = rawProduct.id || itemOrProduct.productId || itemOrProduct.id;
    const targetVariantId = targetVariant?.id || targetVariant?.variantId || itemOrProduct.variantId || null;
    const resolvedId = targetVariantId || prodId;
    const cartItemId = targetVariantId ? `var-${targetVariantId}` : `prod-${prodId}`;

    const maxStock =
      targetVariant?.stockQuantity ??
      targetVariant?.stock ??
      itemOrProduct.stockQuantity ??
      itemOrProduct.stock ??
      rawProduct.stockQuantity ??
      rawProduct.stock ??
      0;

    if (maxStock <= 0) return false;

    const currentItems = get().items;
    const existingIndex = currentItems.findIndex(
      (item) =>
        (item.cartItemId && item.cartItemId === cartItemId) ||
        (targetVariantId && String(item.variantId) === String(targetVariantId))
    );

    let updatedItems;
    if (existingIndex > -1) {
      const currentQty = currentItems[existingIndex].quantity;
      const newQty = Math.min(currentQty + quantity, maxStock);

      updatedItems = [...currentItems];
      updatedItems[existingIndex] = {
        ...updatedItems[existingIndex],
        cartItemId,
        quantity: newQty,
        stock: maxStock,
      };
    } else {
      const validQty = Math.min(quantity, maxStock);
      const newItem = {
        cartItemId,
        id: resolvedId,
        variantId: targetVariantId,
        productId: itemOrProduct.productId || rawProduct.id,
        product: rawProduct,
        name: itemOrProduct.name || rawProduct.name,
        sku: targetVariant?.sku || itemOrProduct.sku || rawProduct.sku || '',
        color: targetVariant?.color || itemOrProduct.color || '',
        size: targetVariant?.size || itemOrProduct.size || '',
        price: Number(targetVariant?.price ?? itemOrProduct.price ?? rawProduct.price ?? 0),
        imageUrl:
          targetVariant?.imageUrl ||
          itemOrProduct.imageUrl ||
          itemOrProduct.image ||
          rawProduct.imageUrl ||
          '',
        stock: maxStock,
        quantity: validQty,
      };
      updatedItems = [...currentItems, newItem];
    }

    set({ items: updatedItems });
    saveCartToStorage(get().activeCartKey, updatedItems);
    return true;
  },

  updateQuantity: (identifier, quantity) => {
    const currentItems = get().items;
    const idStr = String(identifier);
    const target = currentItems.find(
      (item) =>
        item.cartItemId === idStr ||
        String(item.variantId) === idStr ||
        String(item.id) === idStr
    );
    if (!target) return;

    if (quantity <= 0) {
      get().removeItem(identifier);
      return;
    }

    const maxStock = target.stock || target.stockQuantity || 1;
    const validQty = Math.min(quantity, maxStock);
    const targetCartItemId =
      target.cartItemId ||
      (target.variantId ? `var-${target.variantId}` : `prod-${target.productId || target.id}`);

    const updatedItems = currentItems.map((item) => {
      const itemKey =
        item.cartItemId ||
        (item.variantId ? `var-${item.variantId}` : `prod-${item.productId || item.id}`);
      return itemKey === targetCartItemId ? { ...item, quantity: validQty } : item;
    });

    set({ items: updatedItems });
    saveCartToStorage(get().activeCartKey, updatedItems);
  },

  removeItem: (identifier) => {
    const idStr = String(identifier);
    const updatedItems = get().items.filter((item) => {
      const itemKey =
        item.cartItemId ||
        (item.variantId ? `var-${item.variantId}` : `prod-${item.productId || item.id}`);
      return (
        itemKey !== idStr &&
        String(item.variantId) !== idStr &&
        String(item.id) !== idStr
      );
    });

    set({ items: updatedItems });
    saveCartToStorage(get().activeCartKey, updatedItems);
  },

  /**
   * Xóa danh sách các sản phẩm khỏi giỏ hàng (dùng khi chỉ thanh toán một phần giỏ hàng)
   */
  removeItems: (identifiers = []) => {
    if (!Array.isArray(identifiers) || identifiers.length === 0) return;
    const idSet = new Set(identifiers.map((id) => String(id)));
    const updatedItems = get().items.filter((item) => {
      const itemKey =
        item.cartItemId ||
        (item.variantId ? `var-${item.variantId}` : `prod-${item.productId || item.id}`);
      return (
        !idSet.has(itemKey) &&
        !idSet.has(String(item.variantId)) &&
        !idSet.has(String(item.id)) &&
        !idSet.has(String(item.productId))
      );
    });

    set({ items: updatedItems });
    saveCartToStorage(get().activeCartKey, updatedItems);
  },

  clearCart: () => {
    set({ items: [] });
    saveCartToStorage(get().activeCartKey, []);
  },

  getTotalCount: () => {
    return get().items.reduce((total, item) => total + (item.quantity || 0), 0);
  },

  getTotalPrice: () => {
    return get().items.reduce((total, item) => {
      const unitPrice = Number(item.price) || 0;
      return total + unitPrice * (item.quantity || 0);
    }, 0);
  },
}));
