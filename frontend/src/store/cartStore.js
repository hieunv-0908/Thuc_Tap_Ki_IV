import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export const useCartStore = create(
  persist(
    (set, get) => ({
      items: [], // [{ cartItemId, id, variantId, productId, product, name, color, size, sku, price, imageUrl, stock, quantity }]

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
        const targetVariantId = targetVariant?.id || targetVariant?.variantId || itemOrProduct.variantId || null;
        const resolvedId = targetVariantId || rawProduct.id;
        const cartItemId = targetVariantId ? `var-${targetVariantId}` : `prod-${rawProduct.id}`;

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

        if (existingIndex > -1) {
          const currentQty = currentItems[existingIndex].quantity;
          const newQty = Math.min(currentQty + quantity, maxStock);

          const updatedItems = [...currentItems];
          updatedItems[existingIndex] = {
            ...updatedItems[existingIndex],
            cartItemId,
            quantity: newQty,
            stock: maxStock,
          };
          set({ items: updatedItems });
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
          set({ items: [...currentItems, newItem] });
        }
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
        const targetCartItemId = target.cartItemId || (target.variantId ? `var-${target.variantId}` : `prod-${target.productId || target.id}`);

        set({
          items: currentItems.map((item) => {
            const itemKey = item.cartItemId || (item.variantId ? `var-${item.variantId}` : `prod-${item.productId || item.id}`);
            return itemKey === targetCartItemId ? { ...item, quantity: validQty } : item;
          }),
        });
      },

      removeItem: (identifier) => {
        const idStr = String(identifier);
        set({
          items: get().items.filter((item) => {
            const itemKey = item.cartItemId || (item.variantId ? `var-${item.variantId}` : `prod-${item.productId || item.id}`);
            return (
              itemKey !== idStr &&
              String(item.variantId) !== idStr &&
              String(item.id) !== idStr
            );
          }),
        });
      },

      clearCart: () => {
        set({ items: [] });
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
    }),
    {
      name: 'funnyshop_cart',
      merge: (persistedState, currentState) => {
        const rawItems = Array.isArray(persistedState?.items) ? persistedState.items : [];
        const sanitizedItems = rawItems
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
            };
          });
        return {
          ...currentState,
          ...persistedState,
          items: sanitizedItems,
        };
      },
    }
  )
);
