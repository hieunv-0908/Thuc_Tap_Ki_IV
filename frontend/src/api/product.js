import apiClient from './axios';
// import { mockEngine } from './mock/mockEngine';

// const isMock = import.meta.env.VITE_USE_MOCK === 'true';

export const normalizeProduct = (p) => {
  if (!p) return p;
  return {
    ...p,
    stock: p.stock !== undefined ? p.stock : (p.stockQuantity !== undefined ? p.stockQuantity : 0),
    stockQuantity: p.stockQuantity !== undefined ? p.stockQuantity : (p.stock !== undefined ? p.stock : 0),
    imageUrl: p.imageUrl || p.image || '',
    category: p.category
      ? {
        id: p.category.id || p.categoryId,
        name: p.category.name || 'Khác',
      }
      : p.categoryId
        ? { id: p.categoryId, name: p.categoryName || 'Khác' }
        : null,
  };
};

export const productApi = {
  getProducts: async ({ q = '', categoryId = '', sort = '', page = 0, size = 10 } = {}) => {
    // if (isMock) {
    //   const mockRes = await mockEngine.getProducts({ q, categoryId, sort, page: Number(page) || 1, size });
    //   return {
    //     ...mockRes,
    //     content: (mockRes.content || []).map(normalizeProduct),
    //   };
    // }

    const pageNum = Number(page) || 0;
    // Spring Boot Pageable dùng 0-based page (0 là trang đầu tiên).
    // Nếu FE truyền 1 hoặc 0 đều chuyển thành 0 để lấy trang đầu.
    const zeroBasedPage = pageNum > 0 ? pageNum - 1 : 0;
    const safeSize = Math.min(100, Math.max(1, Number(size) || 10));

    const params = new URLSearchParams();
    if (q) {
      params.append('keyword', q);
      params.append('q', q);
    }
    if (categoryId) params.append('categoryId', categoryId);
    if (sort) params.append('sort', sort);
    params.append('page', zeroBasedPage);
    params.append('size', safeSize);

    const res = await apiClient.get(`/api/v1/products?${params.toString()}`);

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

  getProductById: async (id) => {
    // if (isMock) {
    //   const mockRes = await mockEngine.getProductById(id);
    //   return normalizeProduct(mockRes);
    // }
    const res = await apiClient.get(`/api/v1/products/${id}`);
    const data = res?.data !== undefined ? res.data : res;
    return normalizeProduct(data);
  },
};
