import apiClient from './axios';
import { mockEngine } from './mock/mockEngine';
import { useAuthStore } from '../store/authStore';

const isMock = import.meta.env.VITE_USE_MOCK !== 'false';

export const userApi = {
  getMe: async () => {
    if (isMock) {
      const user = useAuthStore.getState().user;
      return await mockEngine.getMe(user?.id);
    }
    return await apiClient.get('/api/users/me');
  },

  updateMe: async ({ fullName, email, password }) => {
    if (isMock) {
      const user = useAuthStore.getState().user;
      return await mockEngine.updateMe(user?.id, { fullName, email, password });
    }
    return await apiClient.put('/api/users/me', { fullName, email, password });
  },
};
