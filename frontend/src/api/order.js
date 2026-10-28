import apiClient from './axios';
import { mockEngine } from './mock/mockEngine';
import { useAuthStore } from '../store/authStore';

const isMock = import.meta.env.VITE_USE_MOCK !== 'false';

export const orderApi = {
  createOrder: async ({ fullName, phone, address, items }) => {
    if (isMock) {
      const user = useAuthStore.getState().user;
      return await mockEngine.createOrder(user?.id, { fullName, phone, address, items });
    }
    return await apiClient.post('/api/orders', { fullName, phone, address, items });
  },

  getMyOrders: async () => {
    if (isMock) {
      const user = useAuthStore.getState().user;
      return await mockEngine.getMyOrders(user?.id);
    }
    return await apiClient.get('/api/orders/my');
  },

  getOrderById: async (id) => {
    if (isMock) {
      return await mockEngine.getOrderById(id);
    }
    return await apiClient.get(`/api/orders/${id}`);
  },
};
