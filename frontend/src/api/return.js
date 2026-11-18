import apiClient from './axios';

/**
 * Helper: ApiResponse dùng @JsonInclude(NON_NULL) ở backend.
 * Khi data = null, field "data" bị OMIT khỏi JSON → res.data === undefined.
 * Hàm này lấy đúng payload (ReturnResponse hoặc Page) từ wrapper.
 */
const unwrap = (res) => {
  if (!res || typeof res !== 'object') return null;
  // res.data là field "data" của ApiResponse wrapper
  return res.data !== undefined ? res.data : null;
};

/**
 * Như unwrap nhưng chỉ trả về nếu có id hợp lệ (tránh nhận ApiResponse wrapper làm entity)
 */
const unwrapEntity = (res) => {
  const data = unwrap(res);
  return (data && data.id) ? data : null;
};

export const returnApi = {
  // Khách hàng gửi yêu cầu trả hàng
  createReturnRequest: async (orderId, data) => {
    const res = await apiClient.post(`/api/v1/orders/${orderId}/return`, data);
    return unwrapEntity(res);
  },

  // Khách hàng / Admin xem chi tiết yêu cầu trả hàng theo đơn
  // Trả về null nếu không có yêu cầu trả hàng
  getReturnRequestByOrder: async (orderId) => {
    const res = await apiClient.get(`/api/v1/orders/${orderId}/return`);
    return unwrapEntity(res);
  },

  // Admin lấy danh sách yêu cầu trả hàng (trả về Page object)
  adminGetReturns: async ({ page = 0, size = 10, keyword = '', status = '' } = {}) => {
    const params = { page, size };
    if (keyword) params.keyword = keyword;
    if (status) params.status = status;
    const res = await apiClient.get('/api/v1/admin/returns', { params });
    return unwrap(res);
  },

  // Admin xem chi tiết theo id
  adminGetReturnById: async (id) => {
    const res = await apiClient.get(`/api/v1/admin/returns/${id}`);
    return unwrapEntity(res);
  },

  // Admin duyệt (APPROVE) hoặc từ chối (REJECT)
  adminReviewReturn: async (id, { action, adminNote }) => {
    const res = await apiClient.post(`/api/v1/admin/returns/${id}/review`, { action, adminNote });
    return unwrapEntity(res);
  },

  // Admin xác nhận đã nhận hàng hoàn về kho & hoàn tất hoàn tiền
  adminCompleteReturn: async (id, note = '') => {
    const res = await apiClient.post(`/api/v1/admin/returns/${id}/complete`, { note });
    return unwrapEntity(res);
  },
};
