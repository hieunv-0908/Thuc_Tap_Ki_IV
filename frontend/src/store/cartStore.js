import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export const useCartStore = create(
  persist(
    (set, get) => ({
      items: [], // [{ variantId, productId, product, name, color, size, sku, price, imageUrl, stock, quantity }]

      addItem: (itemOrProduct, quantity = 1) => {
        if (!itemOrProduct) return false;

        // Định danh duy nhất theo biến thể (hoặc id sản phẩm nếu không có biến thể)
        const variantId =
          itemOrProduct.variantId ||
          itemOrProduct.variants?.[0]?.id ||
          itemOrProduct.id;

        const maxStock =
          itemOrProduct.stockQuantity ??
          itemOrProduct.stock ??
          itemOrProduct.product?.stockQuantity ??
          itemOrProduct.product?.stock ??
          0;

        if (maxStock <= 0) return false;

        const currentItems = get().items;
        const existingIndex = currentItems.findIndex(
          (item) => (item.variantId || item.product?.id) === variantId
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
          const rawProduct = itemOrProduct.product || itemOrProduct;
          const newItem = {
            variantId,
            productId: itemOrProduct.productId || rawProduct.id,
            product: rawProduct,
            name: itemOrProduct.name || rawProduct.name,
            sku: itemOrProduct.sku,
            color: itemOrProduct.color,
            size: itemOrProduct.size,
            price: itemOrProduct.price ?? rawProduct.price ?? 0,
            imageUrl:
              itemOrProduct.imageUrl ||
              itemOrProduct.image ||
              rawProduct.imageUrl,
            stock: maxStock,
            quantity: validQty,
          };
          set({ items: [...currentItems, newItem] });
        }
        return true;
      },

      updateQuantity: (id, quantity) => {
        const currentItems = get().items;
        const target = currentItems.find(
          (item) =>
            item.variantId === id ||
            item.product?.id === id ||
            item.productId === id
        );
        if (!target) return;

        if (quantity <= 0) {
          get().removeItem(id);
          return;
        }

        const maxStock = target.stock || target.product?.stock || 1;
        const validQty = Math.min(quantity, maxStock);
        set({
          items: currentItems.map((item) =>
            item.variantId === id ||
            item.product?.id === id ||
            item.productId === id
              ? { ...item, quantity: validQty }
              : item
          ),
        });
      },

      removeItem: (id) => {
        set({
          items: get().items.filter(
            (item) =>
              item.variantId !== id &&
              item.product?.id !== id &&
              item.productId !== id
          ),
        });
      },

      clearCart: () => {
        set({ items: [] });
      },

      getTotalCount: () => {
        return get().items.reduce((total, item) => total + item.quantity, 0);
      },

      getTotalPrice: () => {
        return get().items.reduce((total, item) => {
          const unitPrice = item.price ?? item.product?.price ?? 0;
          return total + unitPrice * item.quantity;
        }, 0);
      },
    }),
    {
      name: 'funnyshop_cart',
    }
  )
);
