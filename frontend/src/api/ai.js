import apiClient from './axios';
import { mockEngine } from './mock/mockEngine';

const isMock = import.meta.env.VITE_USE_MOCK === 'true';

export const aiApi = {
  generateDescription: async (productName) => {
    // Backend chưa có Controller AI -> Sử dụng Mock engine để đảm bảo tính năng hoạt động
    if (isMock) {
      return await mockEngine.aiGenerateDescription(productName);
    }
    try {
      return await apiClient.post('/api/admin/ai/description', { productName });
    } catch (err) {
      if (err.status === 404 || err.status === 0) {
        return await mockEngine.aiGenerateDescription(productName);
      }
      throw err;
    }
  },

  generateMockProducts: async (count = 5) => {
    if (isMock) {
      return await mockEngine.aiGenerateMockProducts(count);
    }
    try {
      return await apiClient.post('/api/admin/ai/mock-products', { count });
    } catch (err) {
      if (err.status === 404 || err.status === 0) {
        return await mockEngine.aiGenerateMockProducts(count);
      }
      throw err;
    }
  },

  chat: async (message) => {
    if (isMock) {
      return await mockEngine.aiChat(message);
    }
    try {
      return await apiClient.post('/api/chat', { message });
    } catch (err) {
      if (err.status === 404 || err.status === 0) {
        return await mockEngine.aiChat(message);
      }
      throw err;
    }
  },
};
