import axiosClient from './axios';

export const wishlistApi = {
  getMyWishlist: (params = {}) => {
    return axiosClient.get('/api/v1/wishlists', { params });
  },

  getMyWishlistProductIds: () => {
    return axiosClient.get('/api/v1/wishlists/ids');
  },

  toggleWishlist: (productId) => {
    return axiosClient.post(`/api/v1/wishlists/${productId}`);
  },

  removeFromWishlist: (productId) => {
    return axiosClient.delete(`/api/v1/wishlists/${productId}`);
  },
};

export default wishlistApi;

