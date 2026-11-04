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
    try {
      const res = await apiClient.get('/api/v1/users/me');
      return res?.data !== undefined ? res.data : res;
    } catch (err) {
      console.warn('[userApi.getMe] BE request failed, fallback to mock/store:', err);
      const user = useAuthStore.getState().user;
      if (user?.id) {
        return await mockEngine.getMe(user.id);
      }
      return user;
    }
  },

  updateMe: async ({ fullName, phone, email }) => {
    if (isMock) {
      const user = useAuthStore.getState().user;
      return await mockEngine.updateMe(user?.id, { fullName, phone, email });
    }
    try {
      const res = await apiClient.put('/api/v1/users/me', { fullName, phone });
      return res?.data !== undefined ? res.data : res;
    } catch (err) {
      console.warn('[userApi.updateMe] BE request failed, fallback to mock:', err);
      const user = useAuthStore.getState().user;
      if (user?.id) {
        return await mockEngine.updateMe(user.id, { fullName, phone, email });
      }
      throw err;
    }
  },

  changePassword: async ({ currentPassword, newPassword }) => {
    const user = useAuthStore.getState().user;
    return await mockEngine.changePassword(user?.id, { currentPassword, newPassword });
  },
};
