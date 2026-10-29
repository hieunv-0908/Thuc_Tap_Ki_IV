import apiClient from './axios';
import { mockEngine } from './mock/mockEngine';

const isMock = false;

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
