import apiClient from './axios';

const unwrap = (res) => {
  if (!res || typeof res !== 'object') return null;
  return res.data !== undefined ? res.data : res;
};

export const feedbackApi = {
  // ==================== KHÁCH HÀNG ====================

  /**
   * Khách hàng gửi góp ý / phản hồi hệ thống mới
   */
  createFeedback: async (payload) => {
    const res = await apiClient.post('/api/v1/feedbacks', payload);
    return unwrap(res);
  },

  /**
   * Khách hàng lấy danh sách phản hồi của chính mình
   */
  getMyFeedbacks: async ({ page = 0, size = 10, status = '' } = {}) => {
    const params = { page, size };
    if (status) params.status = status;
    const res = await apiClient.get('/api/v1/feedbacks/my', { params });
    return unwrap(res);
  },

  /**
   * Khách hàng xem chi tiết phản hồi của mình
   */
  getMyFeedbackDetail: async (id) => {
    const res = await apiClient.get(`/api/v1/feedbacks/${id}`);
    return unwrap(res);
  },

  // ==================== QUẢN TRỊ VIÊN ====================

  /**
   * Admin lấy danh sách phản hồi (phân trang, lọc theo status, type, tìm kiếm)
   */
  adminGetFeedbacks: async ({
    page = 0,
    size = 10,
    status = '',
    type = '',
    keyword = '',
    sortBy = 'createdAt',
    sortDir = 'desc',
  } = {}) => {
    const params = { page, size, sortBy, sortDir };
    if (status) params.status = status;
    if (type) params.type = type;
    if (keyword) params.keyword = keyword;

    const res = await apiClient.get('/api/v1/admin/feedbacks', { params });
    return unwrap(res);
  },

  /**
   * Admin lấy thống kê số lượng phản hồi theo trạng thái
   */
  adminGetFeedbackStats: async () => {
    const res = await apiClient.get('/api/v1/admin/feedbacks/stats');
    return unwrap(res);
  },

  /**
   * Admin xem chi tiết 1 phản hồi
   */
  adminGetFeedbackById: async (id) => {
    const res = await apiClient.get(`/api/v1/admin/feedbacks/${id}`);
    return unwrap(res);
  },

  /**
   * Admin trả lời phản hồi của khách hàng
   */
  adminReplyFeedback: async (id, { reply, status = 'REPLIED' }) => {
    const res = await apiClient.post(`/api/v1/admin/feedbacks/${id}/reply`, { reply, status });
    return unwrap(res);
  },

  /**
   * Admin cập nhật trạng thái phản hồi
   */
  adminUpdateStatus: async (id, status) => {
    const res = await apiClient.patch(`/api/v1/admin/feedbacks/${id}/status`, { status });
    return unwrap(res);
  },

  /**
   * Admin xóa phản hồi
   */
  adminDeleteFeedback: async (id) => {
    const res = await apiClient.delete(`/api/v1/admin/feedbacks/${id}`);
    return unwrap(res);
  },
};

export default feedbackApi;

