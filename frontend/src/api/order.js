import apiClient from './axios';
import { mockEngine } from './mock/mockEngine';
import { useAuthStore } from '../store/authStore';

// Backend hiện tại chỉ có Auth API, tạm dùng mock cho Order để tránh lỗi 401
const isMock = true;

export const orderApi = {
  createOrder: async ({ fullName, phone, address, items }) => {
    if (isMock) {
      const user = useAuthStore.getState().user;
      return await mockEngine.createOrder(user?.id, { fullName, phone, address, items });
    }
    return await apiClient.post('/api/v1/orders', { fullName, phone, address, items });
  },

  getMyOrders: async () => {
    if (isMock) {
      const user = useAuthStore.getState().user;
      return await mockEngine.getMyOrders(user?.id);
    }
    return await apiClient.get('/api/v1/orders/my');
  },

  getOrderById: async (id) => {
    if (isMock) {
      return await mockEngine.getOrderById(id);
    }
    return await apiClient.get(`/api/v1/orders/${id}`);
  },
};
