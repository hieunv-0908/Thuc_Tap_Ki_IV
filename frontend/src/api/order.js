import apiClient from './axios';
import { mockEngine } from './mock/mockEngine';
import { useAuthStore } from '../store/authStore';

const isMock = import.meta.env.VITE_USE_MOCK === 'true';

export const orderApi = {
  createOrder: async ({ fullName, phone, address, items }) => {
    if (isMock) {
      const user = useAuthStore.getState().user;
      return await mockEngine.createOrder(user?.id, { fullName, phone, address, items });
    }
    const res = await apiClient.post('/api/v1/orders', { fullName, phone, address, items });
    return res?.data !== undefined ? res.data : res;
  },

  getMyOrders: async () => {
    if (isMock) {
      const user = useAuthStore.getState().user;
      return await mockEngine.getMyOrders(user?.id);
    }
    const res = await apiClient.get('/api/v1/orders/my');
    const data = res?.data !== undefined ? res.data : res;
    return Array.isArray(data) ? data : (data?.content || []);
  },

  getOrderById: async (id) => {
    if (isMock) {
      return await mockEngine.getOrderById(id);
    }
    const res = await apiClient.get(`/api/v1/orders/${id}`);
    return res?.data !== undefined ? res.data : res;
  },
};
