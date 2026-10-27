import apiClient from './axios';
import { mockEngine } from './mock/mockEngine';

const isMock = import.meta.env.VITE_USE_MOCK !== 'false';

export const adminApi = {
  createProduct: async (productData) => {
    if (isMock) {
      return await mockEngine.adminCreateProduct(productData);
    }
    return await apiClient.post('/api/admin/products', productData);
  },

  updateProduct: async (id, productData) => {
    if (isMock) {
      return await mockEngine.adminUpdateProduct(id, productData);
    }
    return await apiClient.put(`/api/admin/products/${id}`, productData);
  },

  deleteProduct: async (id) => {
    if (isMock) {
      return await mockEngine.adminDeleteProduct(id);
    }
    return await apiClient.delete(`/api/admin/products/${id}`);
  },

  getAllOrders: async () => {
    if (isMock) {
      return await mockEngine.adminGetAllOrders();
    }
    return await apiClient.get('/api/admin/orders');
  },

  updateOrderStatus: async (id, status) => {
    if (isMock) {
      return await mockEngine.adminUpdateOrderStatus(id, status);
    }
    return await apiClient.patch(`/api/admin/orders/${id}/status`, { status });
  },
};
