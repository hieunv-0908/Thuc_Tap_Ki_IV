import apiClient from './axios';
import { mockEngine } from './mock/mockEngine';
import { useAuthStore } from '../store/authStore';

const isMock = import.meta.env.VITE_USE_MOCK === 'true';

export const userApi = {
  getMe: async () => {
    if (isMock) {
      const user = useAuthStore.getState().user;
      return await mockEngine.getMe(user?.id);
    }
    const res = await apiClient.get('/api/v1/users/me');
    return res?.data !== undefined ? res.data : res;
  },

  updateMe: async ({ fullName, email, password }) => {
    if (isMock) {
      const user = useAuthStore.getState().user;
      return await mockEngine.updateMe(user?.id, { fullName, email, password });
    }
    const res = await apiClient.put('/api/v1/users/me', { fullName, email, password });
    return res?.data !== undefined ? res.data : res;
  },
};
