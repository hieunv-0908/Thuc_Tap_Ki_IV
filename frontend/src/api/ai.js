import apiClient from './axios';
import { mockEngine } from './mock/mockEngine';

const isMock = import.meta.env.VITE_USE_MOCK === 'true';

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
