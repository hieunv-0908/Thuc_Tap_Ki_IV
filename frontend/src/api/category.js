import apiClient from './axios';
import { mockEngine } from './mock/mockEngine';

const isMock = import.meta.env.VITE_USE_MOCK === 'true';

export const categoryApi = {
  getCategories: async () => {
    if (isMock) {
      return await mockEngine.getCategories();
    }
    const res = await apiClient.get('/api/v1/categories');
    const data = res?.data !== undefined ? res.data : res;
    return Array.isArray(data) ? data : (data?.content || []);
  },
};
