import apiClient from './axios';
import { mockEngine } from './mock/mockEngine';
import { productApi } from './product';

const isMock = false;

export const adminApi = {
  getProducts: async ({ q = '', categoryId = '', sort = '', page = 1, size = 100 } = {}) => {
    const firstPageRes = await productApi.getProducts({ q, categoryId, sort, page, size });
    if (size >= 100 && firstPageRes.totalPages > 1 && (!page || page === 1)) {
      let allContent = [...(firstPageRes.content || [])];
      for (let p = 2; p <= firstPageRes.totalPages; p++) {
        const nextRes = await productApi.getProducts({ q, categoryId, sort, page: p, size: 100 });
        if (nextRes.content) {
          allContent = allContent.concat(nextRes.content);
        }
      }
      return {
        ...firstPageRes,
        content: allContent,
        totalElements: allContent.length,
      };
    }
    return firstPageRes;
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

  getAllOrders: async ({ page = 0, size = 100 } = {}) => {
    if (isMock) {
      return await mockEngine.adminGetAllOrders();
    }
    const zeroBasedPage = page > 0 ? page - 1 : 0;
    const safeSize = Math.min(100, Math.max(1, Number(size) || 10));
    const res = await apiClient.get('/api/v1/admin/orders', {
      params: { page: zeroBasedPage, size: safeSize },
    });
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

  // ── Categories ──────────────────────────────────────────────────────────
  createCategory: async ({ name, description = '' }) => {
    const res = await apiClient.post('/api/v1/admin/categories', { name, description });
    return res?.data !== undefined ? res.data : res;
  },

  updateCategory: async (id, { name, description = '' }) => {
    const res = await apiClient.put(`/api/v1/admin/categories/${id}`, { name, description });
    return res?.data !== undefined ? res.data : res;
  },

  deleteCategory: async (id) => {
    const res = await apiClient.delete(`/api/v1/admin/categories/${id}`);
    return res?.data !== undefined ? res.data : res;
  },

  // ── Users ───────────────────────────────────────────────────────────────
  getUsers: async () => {
    try {
      const res = await apiClient.get('/api/v1/admin/users');
      const data = res?.data !== undefined ? res.data : res;
      if (Array.isArray(data)) return data;
      if (Array.isArray(data?.content)) return data.content;
    } catch {
      // Fallback to mockEngine in frontend
    }
    return await mockEngine.adminGetUsers();
  },

  updateUserStatus: async (id, status) => {
    try {
      const res = await apiClient.put(`/api/v1/admin/users/${id}/status`, { status });
      return res?.data !== undefined ? res.data : res;
    } catch {
      return await mockEngine.adminUpdateUserStatus(id, status);
    }
  },

  updateUserRole: async (id, role) => {
    try {
      const res = await apiClient.put(`/api/v1/admin/users/${id}/role`, { role });
      return res?.data !== undefined ? res.data : res;
    } catch {
      return await mockEngine.adminUpdateUserRole(id, role);
    }
  },

  createUser: async (userData) => {
    try {
      const res = await apiClient.post('/api/v1/admin/users', userData);
      return res?.data !== undefined ? res.data : res;
    } catch {
      return await mockEngine.adminCreateUser(userData);
    }
  },

  deleteUser: async (id) => {
    try {
      const res = await apiClient.delete(`/api/v1/admin/users/${id}`);
      return res?.data !== undefined ? res.data : res;
    } catch {
      return await mockEngine.adminDeleteUser(id);
    }
  },
};
