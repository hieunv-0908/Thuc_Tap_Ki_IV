import apiClient from './axios';
import { mockEngine } from './mock/mockEngine';
import { productApi } from './product';

const isMock = import.meta.env.VITE_USE_MOCK === 'true';

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
    if (isMock) {
      return await mockEngine.getProducts({ q, categoryId, sort, page: 1, size });
    }
    try {
      const firstPageRes = await productApi.getProducts({ q, categoryId, sort, page, size });
      // Nếu Backend trả về rỗng (DB trống hoặc chưa seed), fallback sang mock để admin có dữ liệu
      if (!firstPageRes.content || firstPageRes.content.length === 0) {
        console.warn('Backend không có sản phẩm nào, hiển thị dữ liệu mẫu.');
        return await mockEngine.getProducts({ q, categoryId, sort, page: 1, size });
      }

      if (size >= 100 && firstPageRes.totalPages > 1) {
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
    } catch (err) {
      console.warn('Lỗi tải sản phẩm từ backend, hiển thị dữ liệu mẫu dự phòng:', err);
      return await mockEngine.getProducts({ q, categoryId, sort, page: 1, size });
    }
  },

  createProduct: async (productData) => {
    if (isMock) {
      return await mockEngine.adminCreateProduct(productData);
    }
    const payload = {
      ...productData,
      stockQuantity: productData.stock !== undefined ? Number(productData.stock) : Number(productData.stockQuantity || 0),
    };
    try {
      const res = await apiClient.post('/api/v1/admin/products', payload);
      return res?.data !== undefined ? res.data : res;
    } catch (err) {
      if (err.status === 0 || err.status === 404) {
        return await mockEngine.adminCreateProduct(productData);
      }
      throw err;
    }
  },

  updateProduct: async (id, productData) => {
    if (isMock) {
      return await mockEngine.adminUpdateProduct(id, productData);
    }
    const payload = {
      ...productData,
      stockQuantity: productData.stock !== undefined ? Number(productData.stock) : Number(productData.stockQuantity || 0),
    };
    try {
      const res = await apiClient.put(`/api/v1/admin/products/${id}`, payload);
      return res?.data !== undefined ? res.data : res;
    } catch (err) {
      if (err.status === 0 || err.status === 404) {
        return await mockEngine.adminUpdateProduct(id, productData);
      }
      throw err;
    }
  },

  deleteProduct: async (id) => {
    if (isMock) {
      return await mockEngine.adminDeleteProduct(id);
    }
    try {
      const res = await apiClient.delete(`/api/v1/admin/products/${id}`);
      return res?.data !== undefined ? res.data : res;
    } catch (err) {
      if (err.status === 0 || err.status === 404) {
        return await mockEngine.adminDeleteProduct(id);
      }
      throw err;
    }
  },

  restoreProduct: async (id) => {
    if (isMock) {
      return null;
    }
    try {
      const res = await apiClient.patch(`/api/v1/admin/products/${id}/restore`);
      return res?.data !== undefined ? res.data : res;
    } catch (err) {
      if (err.status === 0 || err.status === 404) {
        return null;
      }
      throw err;
    }
  },

  getAllOrders: async ({ page = 0, size = 100 } = {}) => {
    if (isMock) {
      return await mockEngine.adminGetAllOrders();
    }
    const zeroBasedPage = page > 0 ? page - 1 : 0;
    const safeSize = Math.min(100, Math.max(1, Number(size) || 10));
    try {
      const res = await apiClient.get('/api/v1/admin/orders', {
        params: { page: zeroBasedPage, size: safeSize },
      });
      const list = extractList(res);
      if (list && list.length > 0) return list;
      return await mockEngine.adminGetAllOrders();
    } catch (err) {
      if (err.status === 0 || err.status === 404) {
        return await mockEngine.adminGetAllOrders();
      }
      throw err;
    }
  },

  updateOrderStatus: async (id, status) => {
    if (isMock) {
      return await mockEngine.adminUpdateOrderStatus(id, status);
    }
    try {
      const res = await apiClient.patch(`/api/v1/admin/orders/${id}/status`, { status });
      return res?.data !== undefined ? res.data : res;
    } catch (err) {
      if (err.status === 0 || err.status === 404) {
        return await mockEngine.adminUpdateOrderStatus(id, status);
      }
      throw err;
    }
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
    if (isMock) {
      return await mockEngine.adminGetUsers();
    }
    try {
      const res = await apiClient.get('/api/v1/admin/users');
      const list = extractList(res);
      if (list && list.length > 0) return list;
      // Nếu Backend chưa có người dùng nào, hiển thị dữ liệu mẫu để admin quản lý
      return await mockEngine.adminGetUsers();
    } catch (err) {
      // Backend chưa có endpoint /api/v1/admin/users hoặc chưa bật server
      console.warn('Backend chưa hỗ trợ /api/v1/admin/users hoặc lỗi kết nối, hiển thị dữ liệu mẫu:', err);
      return await mockEngine.adminGetUsers();
    }
  },

  updateUserStatus: async (id, status) => {
    if (isMock) {
      return await mockEngine.adminUpdateUserStatus(id, status);
    }
    try {
      const res = await apiClient.put(`/api/v1/admin/users/${id}/status`, { status });
      return res?.data !== undefined ? res.data : res;
    } catch (err) {
      if (err.status === 0 || err.status === 404) {
        return await mockEngine.adminUpdateUserStatus(id, status);
      }
      throw err;
    }
  },

  updateUserRole: async (id, role) => {
    if (isMock) {
      return await mockEngine.adminUpdateUserRole(id, role);
    }
    try {
      const res = await apiClient.put(`/api/v1/admin/users/${id}/role`, { role });
      return res?.data !== undefined ? res.data : res;
    } catch (err) {
      if (err.status === 0 || err.status === 404) {
        return await mockEngine.adminUpdateUserRole(id, role);
      }
      throw err;
    }
  },

  createUser: async (userData) => {
    if (isMock) {
      return await mockEngine.adminCreateUser(userData);
    }
    try {
      const res = await apiClient.post('/api/v1/admin/users', userData);
      return res?.data !== undefined ? res.data : res;
    } catch (err) {
      if (err.status === 0 || err.status === 404) {
        return await mockEngine.adminCreateUser(userData);
      }
      throw err;
    }
  },

  deleteUser: async (id) => {
    if (isMock) {
      return await mockEngine.adminDeleteUser(id);
    }
    try {
      const res = await apiClient.delete(`/api/v1/admin/users/${id}`);
      return res?.data !== undefined ? res.data : res;
    } catch (err) {
      if (err.status === 0 || err.status === 404) {
        return await mockEngine.adminDeleteUser(id);
      }
      throw err;
    }
  },
};
