import apiClient from './axios';
import { mockEngine } from './mock/mockEngine';
import { normalizeProduct } from './product';

const isMock = false;

export const adminApi = {
  getProducts: async ({ q = '', categoryId = '', sort = '', page = 0, size = 100 } = {}) => {
    // AdminProductController chỉ có POST/PUT/DELETE, không có GET
    // → Dùng public ProductController để lấy danh sách sản phẩm
    const params = new URLSearchParams();
    if (q) params.append('q', q);
    if (categoryId) params.append('categoryId', categoryId);
    if (sort) params.append('sort', sort);
    params.append('page', page);
    params.append('size', size);
    const res = await apiClient.get(`/api/v1/products?${params.toString()}`);
    const raw = res?.data !== undefined ? res.data : res;
    if (raw && Array.isArray(raw.content)) {
      return {
        content: (raw.content || []).map(normalizeProduct),
        totalPages: raw.totalPages ?? 1,
        totalElements: raw.totalElements ?? raw.content.length,
        page: raw.page ?? page,
      };
    }
    const list = Array.isArray(raw) ? raw : [];
    return { content: list.map(normalizeProduct), totalPages: 1, totalElements: list.length, page };
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
    const res = await apiClient.get('/api/v1/admin/orders', { params: { page, size } });
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
};
