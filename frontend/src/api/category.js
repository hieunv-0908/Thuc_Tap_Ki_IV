import apiClient from './axios';
import { mockEngine } from './mock/mockEngine';

// Backend hiện tại chỉ có Auth API, tạm dùng mock cho Category để tránh lỗi 401
const isMock = true;

export const categoryApi = {
  getCategories: async () => {
    if (isMock) {
      return await mockEngine.getCategories();
    }
    return await apiClient.get('/api/v1/categories');
  },
};
