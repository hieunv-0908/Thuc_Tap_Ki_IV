import { create } from 'zustand';
import wishlistApi from '../api/wishlist';
import { toast } from './toastStore';

export const useWishlistStore = create((set, get) => ({
  wishlistIds: [],
  loading: false,

  fetchWishlistIds: async () => {
    try {
      const res = await wishlistApi.getMyWishlistProductIds();
      if (res.data) {
        set({ wishlistIds: res.data });
      }
    } catch {
      // unauthenticated or network error
      set({ wishlistIds: [] });
    }
  },

  isLiked: (productId) => {
    if (!productId) return false;
    const numId = Number(productId);
    return get().wishlistIds.includes(numId);
  },

  toggleWishlist: async (product, isAuthenticated) => {
    if (!isAuthenticated) {
      toast.warning('Vui lòng đăng nhập để lưu sản phẩm yêu thích!');
      return false;
    }

    const prodId = Number(product.id);
    const wasLiked = get().wishlistIds.includes(prodId);

    // Optimistic UI update
    set((state) => ({
      wishlistIds: wasLiked
        ? state.wishlistIds.filter((id) => id !== prodId)
        : [...state.wishlistIds, prodId],
    }));

    try {
      const res = await wishlistApi.toggleWishlist(prodId);
      const isNowLiked = res.data?.isLiked;
      if (isNowLiked) {
        toast.success(`Đã thêm "${product.name || 'sản phẩm'}" vào mục Yêu thích!`);
      } else {
        toast.info(`Đã bỏ "${product.name || 'sản phẩm'}" khỏi mục Yêu thích`);
      }
      return isNowLiked;
    } catch {
      // Rollback on error
      set((state) => ({
        wishlistIds: wasLiked
          ? [...state.wishlistIds, prodId]
          : state.wishlistIds.filter((id) => id !== prodId),
      }));
      toast.error('Không thể cập nhật danh sách yêu thích');
      return wasLiked;
    }
  },

  clear: () => set({ wishlistIds: [] }),
}));

