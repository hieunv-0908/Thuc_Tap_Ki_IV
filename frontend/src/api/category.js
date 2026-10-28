import apiClient from './axios';
import { mockEngine } from './mock/mockEngine';

const isMock = import.meta.env.VITE_USE_MOCK !== 'false';

export const categoryApi = {
  getCategories: async () => {
    if (isMock) {
      return await mockEngine.getCategories();
    }
    return await apiClient.get('/api/categories');
  },
};
