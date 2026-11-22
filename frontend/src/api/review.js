import axiosClient from './axios';

export const reviewApi = {
  /**
   * Lấy danh sách đánh giá của sản phẩm (hỗ trợ phân trang, lọc theo sao, sắp xếp)
   * @param {number|string} productId
   * @param {Object} params { rating, page, size, sortBy, sortDir }
   */
  getProductReviews: (productId, params = {}) => {
    return axiosClient.get(`/api/v1/products/${productId}/reviews`, { params });
  },

  /**
   * Lấy tóm tắt thống kê đánh giá của sản phẩm (điểm TB, tổng số, tỉ lệ sao)
   * @param {number|string} productId
   */
  getProductReviewSummary: (productId) => {
    return axiosClient.get(`/api/v1/products/${productId}/reviews/summary`);
  },

  /**
   * Lấy đánh giá của chính người dùng hiện tại đối với sản phẩm này (nếu có)
   * @param {number|string} productId
   */
  getMyProductReview: (productId) => {
    return axiosClient.get(`/api/v1/products/${productId}/reviews/my`);
  },

  /**
   * Gửi đánh giá mới hoặc cập nhật đánh giá cho sản phẩm
   * @param {number|string} productId
   * @param {{ rating: number, comment: string, images?: string[] }} data
   */
  createProductReview: (productId, data) => {
    return axiosClient.post(`/api/v1/products/${productId}/reviews`, data);
  },

  /**
   * Chỉnh sửa đánh giá hiện có
   * @param {number|string} reviewId
   * @param {{ rating: number, comment: string, images?: string[] }} data
   */
  updateReview: (reviewId, data) => {
    return axiosClient.put(`/api/v1/reviews/${reviewId}`, data);
  },

  /**
   * Xóa đánh giá của chính mình
   * @param {number|string} reviewId
   */
  deleteReview: (reviewId) => {
    return axiosClient.delete(`/api/v1/reviews/${reviewId}`);
  },

  /**
   * Tải lên 1-3 hình ảnh thực tế cho đánh giá (lưu trên Cloudinary)
   * @param {FormData} formData
   */
  uploadReviewImages: (formData) => {
    return axiosClient.post('/api/v1/reviews/upload-images', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
  },

  /**
   * Bấm hữu ích / bỏ hữu ích cho một đánh giá
   * @param {number|string} reviewId
   */
  toggleHelpfulVote: (reviewId) => {
    return axiosClient.post(`/api/v1/reviews/${reviewId}/helpful`);
  },

  /**
   * [ADMIN] Lấy tất cả đánh giá trong hệ thống
   * @param {Object} params { productId, rating, keyword, page, size, sortBy, sortDir }
   */
  adminGetReviews: (params = {}) => {
    return axiosClient.get('/api/v1/admin/reviews', { params });
  },

  /**
   * [ADMIN] Phản hồi đánh giá của khách hàng
   * @param {number|string} reviewId
   * @param {{ reply: string }} data
   */
  adminReplyReview: (reviewId, data) => {
    return axiosClient.post(`/api/v1/admin/reviews/${reviewId}/reply`, data);
  },

  /**
   * [ADMIN] Xóa đánh giá vi phạm
   * @param {number|string} reviewId
   */
  adminDeleteReview: (reviewId) => {
    return axiosClient.delete(`/api/v1/admin/reviews/${reviewId}`);
  },
};

export default reviewApi;
