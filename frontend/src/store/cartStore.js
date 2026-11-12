import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export const useCartStore = create(
  persist(
    (set, get) => ({
      items: [], // [{ variantId, productId, product, name, color, size, sku, price, imageUrl, stock, quantity }]

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
        const resolvedVariantId =
          targetVariant?.variantId ||
          targetVariant?.id ||
          itemOrProduct.variantId ||
          itemOrProduct.id;

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
          (item) => String(item.variantId) === String(resolvedVariantId)
        );

        if (existingIndex > -1) {
          const currentQty = currentItems[existingIndex].quantity;
          const newQty = Math.min(currentQty + quantity, maxStock);

          const updatedItems = [...currentItems];
          updatedItems[existingIndex] = {
            ...updatedItems[existingIndex],
            quantity: newQty,
            stock: maxStock,
          };
          set({ items: updatedItems });
        } else {
          const validQty = Math.min(quantity, maxStock);
          const newItem = {
            id: resolvedVariantId,
            variantId: resolvedVariantId,
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

      updateQuantity: (variantId, quantity) => {
        const currentItems = get().items;
        const target = currentItems.find(
          (item) => String(item.variantId) === String(variantId) || String(item.id) === String(variantId)
        );
        if (!target) return;

        if (quantity <= 0) {
          get().removeItem(variantId);
          return;
        }

        const maxStock = target.stock || target.stockQuantity || 1;
        const validQty = Math.min(quantity, maxStock);
        set({
          items: currentItems.map((item) =>
            String(item.variantId) === String(variantId) || String(item.id) === String(variantId)
              ? { ...item, quantity: validQty }
              : item
          ),
        });
      },

      removeItem: (variantId) => {
        set({
          items: get().items.filter(
            (item) =>
              String(item.variantId) !== String(variantId) &&
              String(item.id) !== String(variantId)
          ),
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
    }
  )
);
