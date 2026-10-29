import apiClient from './axios';
import { mockEngine } from './mock/mockEngine';

import { productApi } from './product';

const isMock = false;

export const adminApi = {
  getProducts: async ({ q = '', categoryId = '', sort = '', page = 1, size = 1000 } = {}) => {
    return await productApi.getProducts({ q, categoryId, sort, page, size });
  },

  createProduct: async (productData) => {
    if (isMock) {
      return await mockEngine.adminCreateProduct(productData);
    }
    const payload = {
      ...productData,
      stockQuantity: productData.stock !== undefined ? Number(productData.stock) : Number(productData.stockQuantity || 0),
    };
    const res = await apiClient.post('/api/v1/admin/products', payload);
    return res?.data !== undefined ? res.data : res;
  },

  updateProduct: async (id, productData) => {
    if (isMock) {
      return await mockEngine.adminUpdateProduct(id, productData);
    }
    const payload = {
      ...productData,
      stockQuantity: productData.stock !== undefined ? Number(productData.stock) : Number(productData.stockQuantity || 0),
    };
    const res = await apiClient.put(`/api/v1/admin/products/${id}`, payload);
    return res?.data !== undefined ? res.data : res;
  },

  deleteProduct: async (id) => {
    if (isMock) {
      return await mockEngine.adminDeleteProduct(id);
    }
    const res = await apiClient.delete(`/api/v1/admin/products/${id}`);
    return res?.data !== undefined ? res.data : res;
  },

  getAllOrders: async () => {
    if (isMock) {
      return await mockEngine.adminGetAllOrders();
    }
    const res = await apiClient.get('/api/v1/admin/orders');
    const data = res?.data !== undefined ? res.data : res;
    return Array.isArray(data) ? data : (data?.content || []);
  },

  updateOrderStatus: async (id, status) => {
    if (isMock) {
      return await mockEngine.adminUpdateOrderStatus(id, status);
    }
    const res = await apiClient.patch(`/api/v1/admin/orders/${id}/status`, { status });
    return res?.data !== undefined ? res.data : res;
  },
};
