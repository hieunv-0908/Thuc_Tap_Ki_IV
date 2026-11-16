import apiClient from './axios';
// import { mockEngine } from './mock/mockEngine';
// import { useAuthStore } from '../store/authStore';

// const isMock = import.meta.env.VITE_USE_MOCK === 'true';

export const orderApi = {
  createOrder: async ({ fullName, phone, address, paymentMethod = 'COD', items, idempotencyKey, voucherCode }) => {
    // if (isMock) {
    //   const user = useAuthStore.getState().user;
    //   return await mockEngine.createOrder(user?.id, { fullName, phone, address, items });
    // }
    const headers = {};
    if (idempotencyKey) {
      headers['X-Idempotency-Key'] = idempotencyKey;
    }
    const res = await apiClient.post(
      '/api/v1/orders',
      { fullName, phone, address, paymentMethod, items, idempotencyKey, voucherCode },
      { headers }
    );
    return res?.data !== undefined ? res.data : res;
  },

  getMyOrders: async ({ page = 0, size = 100 } = {}) => {
    // if (isMock) {
    //   const user = useAuthStore.getState().user;
    //   return await mockEngine.getMyOrders(user?.id);
    // }
    const res = await apiClient.get('/api/v1/orders/my', { params: { page, size } });
    const data = res?.data !== undefined ? res.data : res;
    return Array.isArray(data) ? data : (data?.content || []);
  },

  getOrderById: async (id) => {
    // if (isMock) {
    //   return await mockEngine.getOrderById(id);
    // }
    const res = await apiClient.get(`/api/v1/orders/${id}`);
    return res?.data !== undefined ? res.data : res;
  },

  cancelOrder: async (id, reason) => {
    const payload = reason ? { reason } : {};
    const res = await apiClient.patch(`/api/v1/orders/${id}/cancel`, payload);
    return res?.data !== undefined ? res.data : res;
  },

  getOrderTimeline: async (id) => {
    const res = await apiClient.get(`/api/v1/orders/${id}/timeline`);
    return res?.data !== undefined ? res.data : res;
  },

  createPayOSPaymentLink: async (orderId) => {
    const res = await apiClient.post(`/api/v1/orders/${orderId}/payos-payment-link`);
    return res?.data !== undefined ? res.data : res;
  },

  getPayOSPaymentStatus: async (orderId) => {
    const res = await apiClient.get(`/api/v1/orders/${orderId}/payos-status`);
    return res?.data !== undefined ? res.data : res;
  },

  simulatePayOSSuccess: async (orderId) => {
    const res = await apiClient.post(`/api/v1/orders/${orderId}/payos-simulate-success`);
    return res?.data !== undefined ? res.data : res;
  },
};
