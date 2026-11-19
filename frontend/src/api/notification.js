import apiClient from './axios';

/**
 * Unwrap helper đồng bộ với các api service khác
 */
const unwrap = (res) => {
  if (!res || typeof res !== 'object') return null;
  return res.data !== undefined ? res.data : res;
};

export const notificationApi = {
  // ==================== KHÁCH HÀNG ====================

  /**
   * Lấy danh sách thông báo của tôi (phân trang)
   */
  getMyNotifications: async ({ page = 0, size = 10 } = {}) => {
    const res = await apiClient.get('/api/v1/notifications', {
      params: { page, size },
    });
    return unwrap(res);
  },

  /**
   * Lấy số lượng thông báo chưa đọc
   */
  getUnreadCount: async () => {
    const res = await apiClient.get('/api/v1/notifications/unread-count');
    const data = unwrap(res);
    return typeof data === 'number' ? data : Number(data || 0);
  },

  /**
   * Đánh dấu 1 thông báo là đã đọc
   */
  markAsRead: async (id) => {
    const res = await apiClient.put(`/api/v1/notifications/${id}/read`);
    return unwrap(res);
  },

  /**
   * Đánh dấu tất cả thông báo là đã đọc
   */
  markAllAsRead: async () => {
    const res = await apiClient.put('/api/v1/notifications/read-all');
    return unwrap(res);
  },

  // ==================== QUẢN TRỊ VIÊN ====================

  /**
   * Admin lấy danh sách toàn bộ thông báo (phân trang, lọc, tìm kiếm)
   */
  adminGetNotifications: async ({
    page = 0,
    size = 10,
    type = '',
    target = '',
    isActive = '',
    keyword = '',
  } = {}) => {
    const params = { page, size };
    if (type) params.type = type;
    if (target) params.target = target;
    if (isActive !== '' && isActive !== undefined && isActive !== null) params.isActive = isActive;
    if (keyword) params.keyword = keyword.trim();

    const res = await apiClient.get('/api/v1/admin/notifications', { params });
    return unwrap(res);
  },

  /**
   * Admin xem chi tiết 1 thông báo
   */
  adminGetNotificationById: async (id) => {
    const res = await apiClient.get(`/api/v1/admin/notifications/${id}`);
    return unwrap(res);
  },

  /**
   * Admin tạo thông báo mới
   */
  adminCreateNotification: async (data) => {
    const res = await apiClient.post('/api/v1/admin/notifications', data);
    return unwrap(res);
  },

  /**
   * Admin sửa thông báo
   */
  adminUpdateNotification: async (id, data) => {
    const res = await apiClient.put(`/api/v1/admin/notifications/${id}`, data);
    return unwrap(res);
  },

  /**
   * Admin xóa thông báo
   */
  adminDeleteNotification: async (id) => {
    const res = await apiClient.delete(`/api/v1/admin/notifications/${id}`);
    return unwrap(res);
  },

  /**
   * Admin bật/tắt phát thông báo nhanh
   */
  adminToggleStatus: async (id) => {
    const res = await apiClient.patch(`/api/v1/admin/notifications/${id}/toggle-status`);
    return unwrap(res);
  },
};

// Named exports for direct import
export const getMyNotifications = (params) => notificationApi.getMyNotifications(params);
export const getUnreadCount = () => notificationApi.getUnreadCount();
export const markAsRead = (id) => notificationApi.markAsRead(id);
export const markAllAsRead = () => notificationApi.markAllAsRead();
export const adminGetNotifications = (params) => notificationApi.adminGetNotifications(params);
export const adminGetNotificationById = (id) => notificationApi.adminGetNotificationById(id);
export const adminCreateNotification = (data) => notificationApi.adminCreateNotification(data);
export const adminUpdateNotification = (id, data) => notificationApi.adminUpdateNotification(id, data);
export const adminDeleteNotification = (id) => notificationApi.adminDeleteNotification(id);
export const adminToggleStatus = (id) => notificationApi.adminToggleStatus(id);

