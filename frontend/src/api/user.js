import apiClient from './axios';
import { mockEngine } from './mock/mockEngine';
import { useAuthStore } from '../store/authStore';

// Backend hiện tại chỉ có Auth API, tạm dùng mock cho User profile để tránh lỗi 401
const isMock = true;

export const userApi = {
  getMe: async () => {
    if (isMock) {
      const user = useAuthStore.getState().user;
      return await mockEngine.getMe(user?.id);
    }
    return await apiClient.get('/api/v1/users/me');
  },

  updateMe: async ({ fullName, email, password }) => {
    if (isMock) {
      const user = useAuthStore.getState().user;
      return await mockEngine.updateMe(user?.id, { fullName, email, password });
    }
    return await apiClient.put('/api/v1/users/me', { fullName, email, password });
  },
};
