import apiClient from './axios';
// import { mockEngine } from './mock/mockEngine';
import { normalizeProduct } from './product';

// const isMock = import.meta.env.VITE_USE_MOCK === 'true';

/**
 * Trích xuất danh sách từ bất kỳ format response nào của BE:
 * - Mảng trực tiếp: [...]
 * - ApiResponse wrapper: { code, message, data: [...] | { content: [...] } }
 * - Wrapper dùng "result": { result: [...] | { content: [...] } }
 * - Page object trực tiếp: { content: [...] }
 */
function extractList(res) {
  if (Array.isArray(res)) return res;
  if (res?.data !== undefined) {
    if (Array.isArray(res.data)) return res.data;
    if (Array.isArray(res.data?.content)) return res.data.content;
  }
  if (res?.result !== undefined) {
    if (Array.isArray(res.result)) return res.result;
    if (Array.isArray(res.result?.content)) return res.result.content;
  }
  if (Array.isArray(res?.content)) return res.content;
  return [];
}

export const adminApi = {
  // ── Products ────────────────────────────────────────────────────────────
  getProducts: async ({ q = '', categoryId = '', sort = '', page = 0, size = 100 } = {}) => {
    // if (isMock) {
    //   return await mockEngine.getProducts({ q, categoryId, sort, page: 1, size });
    // }
    const pageNum = Number(page) || 0;
    const zeroBasedPage = pageNum > 0 ? pageNum - 1 : 0;
    const safeSize = Math.min(100, Math.max(1, Number(size) || 10));

    const params = new URLSearchParams();
    if (q) params.append('keyword', q);
    if (categoryId) params.append('categoryId', categoryId);
    if (sort) params.append('sort', sort);
    params.append('page', zeroBasedPage);
    params.append('size', safeSize);

    const res = await apiClient.get(`/api/v1/admin/products?${params.toString()}`);

    let rawData = res;
    if (res?.data !== undefined) rawData = res.data;
    else if (res?.result !== undefined) rawData = res.result;

    let content = [];
    let totalPages = 1;
    let totalElements = 0;
    let currentPage = pageNum > 0 ? pageNum : 1;

    if (Array.isArray(rawData)) {
      content = rawData;
      totalElements = rawData.length;
      totalPages = 1;
    } else if (rawData && Array.isArray(rawData.content)) {
      content = rawData.content;
      totalPages = rawData.totalPages ?? 1;
      totalElements = rawData.totalElements ?? rawData.content.length;
      currentPage = rawData.number !== undefined ? rawData.number + 1 : (rawData.page ?? (pageNum > 0 ? pageNum : 1));
    }

    return {
      content: content.map(normalizeProduct),
      totalPages,
      totalElements,
      page: currentPage,
    };
  },

  createProduct: async (productData) => {
    // if (isMock) {
    //   return await mockEngine.adminCreateProduct(productData);
    // }
    const payload = {
      ...productData,
      stockQuantity: productData.stock !== undefined ? Number(productData.stock) : Number(productData.stockQuantity || 0),
    };
    const res = await apiClient.post('/api/v1/admin/products', payload);
    return res?.data !== undefined ? res.data : res;
  },

  updateProduct: async (id, productData) => {
    // if (isMock) {
    //   return await mockEngine.adminUpdateProduct(id, productData);
    // }
    const payload = {
      ...productData,
      stockQuantity: productData.stock !== undefined ? Number(productData.stock) : Number(productData.stockQuantity || 0),
    };
    const res = await apiClient.put(`/api/v1/admin/products/${id}`, payload);
    return res?.data !== undefined ? res.data : res;
  },

  deleteProduct: async (id) => {
    // if (isMock) {
    //   return await mockEngine.adminDeleteProduct(id);
    // }
    const res = await apiClient.delete(`/api/v1/admin/products/${id}`);
    return res?.data !== undefined ? res.data : res;
  },

  restoreProduct: async (id) => {
    // if (isMock) {
    //   return null;
    // }
    const res = await apiClient.patch(`/api/v1/admin/products/${id}/restore`);
    return res?.data !== undefined ? res.data : res;
  },

  // ── Product Variants (TASK-FE-01) ──────────────────────────────────────
  createVariant: async (productId, variantData) => {
    const payload = {
      sku: variantData.sku?.trim(),
      color: variantData.color?.trim(),
      size: variantData.size?.trim(),
      price: Number(variantData.price) || 0,
      stockQuantity: Number(
        variantData.stockQuantity !== undefined
          ? variantData.stockQuantity
          : (variantData.stock !== undefined ? variantData.stock : 0)
      ),
    };
    const res = await apiClient.post(`/api/v1/admin/products/${productId}/variants`, payload);
    return res?.data !== undefined ? res.data : res;
  },

  updateVariant: async (variantId, variantData) => {
    const payload = {
      sku: variantData.sku?.trim(),
      color: variantData.color?.trim(),
      size: variantData.size?.trim(),
      price: Number(variantData.price) || 0,
      stockQuantity: Number(
        variantData.stockQuantity !== undefined
          ? variantData.stockQuantity
          : (variantData.stock !== undefined ? variantData.stock : 0)
      ),
    };
    const res = await apiClient.put(`/api/v1/admin/variants/${variantId}`, payload);
    return res?.data !== undefined ? res.data : res;
  },

  deleteVariant: async (variantId) => {
    const res = await apiClient.delete(`/api/v1/admin/variants/${variantId}`);
    return res?.data !== undefined ? res.data : res;
  },

  restoreVariant: async (variantId) => {
    const res = await apiClient.patch(`/api/v1/admin/variants/${variantId}/restore`);
    return res?.data !== undefined ? res.data : res;
  },

  // ── Product Images (TASK-FE-02) ─────────────────────────────────────────
  addImage: async (productId, imageData) => {
    const payload = {
      imageUrl: imageData.imageUrl?.trim() || imageData.url?.trim() || '',
      isPrimary: Boolean(imageData.isPrimary),
      variantId: imageData.variantId ? Number(imageData.variantId) : null,
    };
    const res = await apiClient.post(`/api/v1/admin/products/${productId}/images`, payload);
    return res?.data !== undefined ? res.data : res;
  },

  createImage: async (productId, imageData) => {
    return adminApi.addImage(productId, imageData);
  },

  setPrimaryImage: async (imageId) => {
    const res = await apiClient.patch(`/api/v1/admin/images/${imageId}/primary`);
    return res?.data !== undefined ? res.data : res;
  },

  deleteImage: async (imageId) => {
    const res = await apiClient.delete(`/api/v1/admin/images/${imageId}`);
    return res?.data !== undefined ? res.data : res;
  },

  getAllOrders: async ({ page = 0, size = 100 } = {}) => {
    // if (isMock) {
    //   return await mockEngine.adminGetAllOrders();
    // }
    const zeroBasedPage = page > 0 ? page - 1 : 0;
    const safeSize = Math.min(100, Math.max(1, Number(size) || 10));
    const res = await apiClient.get('/api/v1/admin/orders', {
      params: { page: zeroBasedPage, size: safeSize },
    });
    return extractList(res);
  },

  updateOrderStatus: async (id, status) => {
    // if (isMock) {
    //   return await mockEngine.adminUpdateOrderStatus(id, status);
    // }
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
    // if (isMock) {
    //   return await mockEngine.adminGetUsers();
    // }
    const res = await apiClient.get('/api/v1/admin/users');
    return extractList(res);
  },

  updateUserStatus: async (id, status) => {
    // if (isMock) {
    //   return await mockEngine.adminUpdateUserStatus(id, status);
    // }
    const res = await apiClient.put(`/api/v1/admin/users/${id}/status`, { status });
    return res?.data !== undefined ? res.data : res;
  },

  updateUserRole: async (id, role) => {
    // if (isMock) {
    //   return await mockEngine.adminUpdateUserRole(id, role);
    // }
    const res = await apiClient.put(`/api/v1/admin/users/${id}/role`, { role });
    return res?.data !== undefined ? res.data : res;
  },

  createUser: async (userData) => {
    // if (isMock) {
    //   return await mockEngine.adminCreateUser(userData);
    // }
    const res = await apiClient.post('/api/v1/admin/users', userData);
    return res?.data !== undefined ? res.data : res;
  },

  deleteUser: async (id) => {
    // if (isMock) {
    //   return await mockEngine.adminDeleteUser(id);
    // }
    const res = await apiClient.delete(`/api/v1/admin/users/${id}`);
    return res?.data !== undefined ? res.data : res;
  },
};
