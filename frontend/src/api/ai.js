import apiClient from './axios';
import { mockEngine } from './mock/mockEngine';

// Backend hiện tại chỉ có Auth API, tạm dùng mock cho AI để tránh lỗi 401
const isMock = true;

export const aiApi = {
  generateDescription: async (productName) => {
    if (isMock) {
      return await mockEngine.aiGenerateDescription(productName);
    }
    return await apiClient.post('/api/admin/ai/description', { productName });
  },

  generateMockProducts: async (count = 5) => {
    if (isMock) {
      return await mockEngine.aiGenerateMockProducts(count);
    }
    return await apiClient.post('/api/admin/ai/mock-products', { count });
  },

  chat: async (message) => {
    if (isMock) {
      return await mockEngine.aiChat(message);
    }
    return await apiClient.post('/api/chat', { message });
  },
};
