import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export const useCartStore = create(
  persist(
    (set, get) => ({
      items: [], // [{ product, quantity }]

      addItem: (product, quantity = 1) => {
        if (!product || product.stock <= 0) return false;

        const currentItems = get().items;
        const existingIndex = currentItems.findIndex((item) => item.product.id === product.id);

        if (existingIndex > -1) {
          const currentQty = currentItems[existingIndex].quantity;
          const newQty = Math.min(currentQty + quantity, product.stock);

          const updatedItems = [...currentItems];
          updatedItems[existingIndex] = {
            ...updatedItems[existingIndex],
            quantity: newQty,
          };
          set({ items: updatedItems });
        } else {
          const validQty = Math.min(quantity, product.stock);
          set({
            items: [...currentItems, { product, quantity: validQty }],
          });
        }
        return true;
      },

      updateQuantity: (productId, quantity) => {
        const currentItems = get().items;
        const target = currentItems.find((item) => item.product.id === productId);
        if (!target) return;

        if (quantity <= 0) {
          get().removeItem(productId);
          return;
        }

        // Limit to available stock
        const validQty = Math.min(quantity, target.product.stock || 1);
        set({
          items: currentItems.map((item) =>
            item.product.id === productId ? { ...item, quantity: validQty } : item
          ),
        });
      },

      removeItem: (productId) => {
        set({
          items: get().items.filter((item) => item.product.id !== productId),
        });
      },

      clearCart: () => {
        set({ items: [] });
      },

      getTotalCount: () => {
        return get().items.reduce((total, item) => total + item.quantity, 0);
      },

      getTotalPrice: () => {
        return get().items.reduce(
          (total, item) => total + (item.product.price || 0) * item.quantity,
          0
        );
      },
    }),
    {
      name: 'funnyshop_cart',
    }
  )
);
