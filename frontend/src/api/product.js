import apiClient from './axios';
// import { mockEngine } from './mock/mockEngine';

// const isMock = import.meta.env.VITE_USE_MOCK === 'true';

export const normalizeProduct = (p) => {
  if (!p) return p;

  const rawVariants = Array.isArray(p.variants) ? p.variants : [];
  const normalizedVariants = rawVariants.map((v) => ({
    ...v,
    id: v.id,
    productId: v.productId || p.id,
    sku: v.sku || '',
    color: v.color || '',
    size: v.size || '',
    price: Number(v.price) || 0,
    stockQuantity: Number(v.stockQuantity !== undefined ? v.stockQuantity : (v.stock ?? 0)),
    isDeleted: Boolean(v.isDeleted),
  }));

  const activeVariants = normalizedVariants.filter((v) => !v.isDeleted);

  // Tính totalStock an toàn kèm fallback
  let calculatedTotalStock;
  if (p.totalStock !== undefined && p.totalStock !== null) {
    calculatedTotalStock = Number(p.totalStock);
  } else if (activeVariants.length > 0) {
    calculatedTotalStock = activeVariants.reduce((sum, v) => sum + (v.stockQuantity || 0), 0);
  } else {
    calculatedTotalStock = Number(p.stockQuantity !== undefined ? p.stockQuantity : (p.stock ?? 0));
  }

  // Tính khoảng giá minPrice, maxPrice an toàn
  let calculatedMinPrice = p.minPrice !== undefined && p.minPrice !== null ? Number(p.minPrice) : null;
  let calculatedMaxPrice = p.maxPrice !== undefined && p.maxPrice !== null ? Number(p.maxPrice) : null;

  if (calculatedMinPrice === null || calculatedMaxPrice === null) {
    if (activeVariants.length > 0) {
      const prices = activeVariants.map((v) => v.price).filter((pr) => pr >= 0);
      if (prices.length > 0) {
        if (calculatedMinPrice === null) calculatedMinPrice = Math.min(...prices);
        if (calculatedMaxPrice === null) calculatedMaxPrice = Math.max(...prices);
      }
    }
  }

  if (calculatedMinPrice === null) calculatedMinPrice = Number(p.price) || 0;
  if (calculatedMaxPrice === null) calculatedMaxPrice = Number(p.price) || 0;

  // Xử lý ảnh chính an toàn kèm fallback từ images gallery
  const rawImages = Array.isArray(p.images) ? p.images : [];
  const normalizedImages = rawImages.map((img) => ({
    ...img,
    id: img.id,
    productId: img.productId || p.id,
    variantId: img.variantId || null,
    imageUrl: img.imageUrl || img.url || '',
    isPrimary: Boolean(img.isPrimary),
  }));

  let mainImageUrl = p.imageUrl || p.image || '';
  if (!mainImageUrl && normalizedImages.length > 0) {
    const primaryImg = normalizedImages.find((img) => img.isPrimary) || normalizedImages[0];
    mainImageUrl = primaryImg?.imageUrl || '';
  }

  return {
    ...p,
    id: p.id,
    name: p.name || '',
    description: p.description || '',
    brand: p.brand || '',
    material: p.material || '',
    genderType: p.genderType || null,
    isDeleted: Boolean(p.isDeleted),
    totalStock: calculatedTotalStock,
    stock: calculatedTotalStock,
    stockQuantity: calculatedTotalStock,
    minPrice: calculatedMinPrice,
    maxPrice: calculatedMaxPrice,
    price: p.price !== undefined ? Number(p.price) : calculatedMinPrice,
    imageUrl: mainImageUrl,
    variants: normalizedVariants,
    images: normalizedImages,
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
