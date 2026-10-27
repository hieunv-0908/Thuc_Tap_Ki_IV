import apiClient from './axios';
import { mockEngine } from './mock/mockEngine';

const isMock = import.meta.env.VITE_USE_MOCK !== 'false';

export const productApi = {
  getProducts: async ({ q = '', categoryId = '', sort = '', page = 1, size = 8 } = {}) => {
    if (isMock) {
      return await mockEngine.getProducts({ q, categoryId, sort, page, size });
    }
    const params = new URLSearchParams();
    if (q) params.append('q', q);
    if (categoryId) params.append('categoryId', categoryId);
    if (sort) params.append('sort', sort);
    if (page) params.append('page', page);
    if (size) params.append('size', size);

    return await apiClient.get(`/api/products?${params.toString()}`);
  },

  getProductById: async (id) => {
    if (isMock) {
      return await mockEngine.getProductById(id);
    }
    return await apiClient.get(`/api/products/${id}`);
  },
};
