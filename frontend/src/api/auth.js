import apiClient from './axios';
import { mockEngine } from './mock/mockEngine';

const isMock = import.meta.env.VITE_USE_MOCK !== 'false';

export const authApi = {
  login: async ({ email, password }) => {
    if (isMock) {
      return await mockEngine.login({ email, password });
    }
    return await apiClient.post('/api/auth/login', { email, password });
  },

  register: async ({ fullName, email, password }) => {
    if (isMock) {
      return await mockEngine.register({ fullName, email, password });
    }
    return await apiClient.post('/api/auth/register', { fullName, email, password });
  },
};
