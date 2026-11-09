import apiClient from './axios';
// import { mockEngine } from './mock/mockEngine';
// import { useAuthStore } from '../store/authStore';

// const isMock = import.meta.env.VITE_USE_MOCK === 'true';

export const userApi = {
  getMe: async () => {
    // if (isMock) {
    //   const user = useAuthStore.getState().user;
    //   return await mockEngine.getMe(user?.id);
    // }
    const res = await apiClient.get('/api/v1/users/me');
    return res?.data !== undefined ? res.data : res;
  },

  updateMe: async ({ fullName, phone }) => {
    // if (isMock) {
    //   const user = useAuthStore.getState().user;
    //   return await mockEngine.updateMe(user?.id, { fullName, phone });
    // }
    const payload = {
      fullName,
      phone: phone ? phone.trim() : null,
    };
    const res = await apiClient.put('/api/v1/users/me', payload);
    return res?.data !== undefined ? res.data : res;
  },

  changePassword: async ({ currentPassword, newPassword }) => {
    // if (isMock) {
    //   const user = useAuthStore.getState().user;
    //   return await mockEngine.changePassword(user?.id, { currentPassword, newPassword });
    // }
    const res = await apiClient.put('/api/v1/users/me/password', { currentPassword, newPassword });
    return res?.data !== undefined ? res.data : res;
  },
};
