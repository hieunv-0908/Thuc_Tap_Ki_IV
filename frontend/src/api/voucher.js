import apiClient from './axios';

export const voucherApi = {
  // Public / Storefront APIs
  getAvailableVouchers: async () => {
    const res = await apiClient.get('/api/v1/vouchers/available');
    const data = res?.data !== undefined ? res.data : res;
    return Array.isArray(data) ? data : [];
  },

  applyVoucher: async (voucherCode, subtotal) => {
    const res = await apiClient.post('/api/v1/vouchers/apply', {
      voucherCode,
      subtotal,
    });
    return res?.data !== undefined ? res.data : res;
  },

  // Admin APIs
  adminGetVouchers: async ({ page = 0, size = 10, search = '', isActive = null, sortBy = 'createdAt', sortDir = 'desc' } = {}) => {
    const params = { page, size, sortBy, sortDir };
    if (search) params.search = search;
    if (isActive !== null && isActive !== undefined && isActive !== '') params.isActive = isActive;

    const res = await apiClient.get('/api/v1/admin/vouchers', { params });
    return res?.data !== undefined ? res.data : res;
  },

  adminGetVoucherById: async (id) => {
    const res = await apiClient.get(`/api/v1/admin/vouchers/${id}`);
    return res?.data !== undefined ? res.data : res;
  },

  adminCreateVoucher: async (data) => {
    const res = await apiClient.post('/api/v1/admin/vouchers', data);
    return res?.data !== undefined ? res.data : res;
  },

  adminUpdateVoucher: async (id, data) => {
    const res = await apiClient.put(`/api/v1/admin/vouchers/${id}`, data);
    return res?.data !== undefined ? res.data : res;
  },

  adminToggleVoucher: async (id) => {
    const res = await apiClient.patch(`/api/v1/admin/vouchers/${id}/toggle`);
    return res?.data !== undefined ? res.data : res;
  },

  adminDeleteVoucher: async (id) => {
    const res = await apiClient.delete(`/api/v1/admin/vouchers/${id}`);
    return res?.data !== undefined ? res.data : res;
  },
};

