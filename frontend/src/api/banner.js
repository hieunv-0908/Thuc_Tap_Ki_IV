import apiClient from './axios';

/**
 * Banner API – Hero section management
 * Hỗ trợ cả 2 chế độ:
 * 1. Gọi trực tiếp Spring Boot Backend nếu backend đã được deploy / chạy local.
 * 2. Tự động fallback sang Cloudinary REST API + LocalStorage nếu Backend trả về 404
 *    (ví dụ khi đang proxy tới server staging chưa kịp update code Java).
 */

const CLOUDINARY_CLOUD_NAME = 'dtdpmvyzq';
const CLOUDINARY_API_KEY = '832254241169418';
const CLOUDINARY_API_SECRET = 'hLQ4s1U8qINkSogzFLmxn2UGdMs';
const LOCAL_STORAGE_KEY = 'funnyshop_hero_banners';

function extractData(res) {
  if (res?.data !== undefined) return res.data;
  if (res?.result !== undefined) return res.result;
  return res;
}

// ── Local Storage Helper ──────────────────────────────────────────────────────
function getLocalBanners() {
  try {
    const raw = localStorage.getItem(LOCAL_STORAGE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

function saveLocalBanners(list) {
  try {
    localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(list));
  } catch (e) {
    console.warn('Lỗi lưu banner vào localStorage:', e);
  }
}

// ── Cloudinary Direct Upload with Web Crypto HMAC SHA-1 ─────────────────────────
async function sha1Hex(str) {
  const enc = new TextEncoder();
  const hash = await crypto.subtle.digest('SHA-1', enc.encode(str));
  return Array.from(new Uint8Array(hash))
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('');
}

async function uploadToCloudinaryDirect(file) {
  const timestamp = Math.round(Date.now() / 1000);
  const folder = 'funnyshop/banners';
  const toSign = `folder=${folder}&timestamp=${timestamp}${CLOUDINARY_API_SECRET}`;
  const signature = await sha1Hex(toSign);

  const fd = new FormData();
  fd.append('file', file);
  fd.append('folder', folder);
  fd.append('api_key', CLOUDINARY_API_KEY);
  fd.append('timestamp', String(timestamp));
  fd.append('signature', signature);

  const res = await fetch(`https://api.cloudinary.com/v1_1/${CLOUDINARY_CLOUD_NAME}/image/upload`, {
    method: 'POST',
    body: fd,
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err?.error?.message || 'Không thể upload ảnh lên Cloudinary.');
  }

  return await res.json();
}

export const bannerApi = {
  // ── Public ──────────────────────────────────────────────────────────────
  /** Lấy danh sách banner đang hiển thị (dùng ở trang chủ) */
  getActiveBanners: async () => {
    try {
      const res = await apiClient.get('/api/v1/banners/active');
      const data = extractData(res.data);
      if (Array.isArray(data) && data.length > 0) return data;
    } catch (err) {
      if (err?.response?.status !== 404) {
        console.warn('Lỗi tải active banners từ backend:', err.message);
      }
    }
    // Fallback: LocalStorage
    const local = getLocalBanners();
    return local
      .filter((b) => b.isActive)
      .sort((a, b) => (a.displayOrder ?? 0) - (b.displayOrder ?? 0));
  },

  // ── Admin ────────────────────────────────────────────────────────────────
  /** Lấy toàn bộ banner (dùng ở trang Admin) */
  getAllBanners: async () => {
    try {
      const res = await apiClient.get('/api/v1/admin/banners');
      const data = extractData(res.data);
      if (Array.isArray(data) && data.length > 0) {
        // Đồng bộ vào localStorage để backup
        saveLocalBanners(data);
        return data;
      }
    } catch (err) {
      if (err?.response?.status !== 404) {
        console.warn('Lỗi tải banners từ backend:', err.message);
      }
    }
    // Fallback: LocalStorage
    return getLocalBanners();
  },

  /**
   * Tạo banner mới (multipart/form-data)
   * @param {FormData} formData
   */
  createBanner: async (formData) => {
    try {
      const res = await apiClient.post('/api/v1/admin/banners', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      const data = extractData(res.data);
      if (data) {
        const local = getLocalBanners();
        saveLocalBanners([...local, data]);
        return data;
      }
    } catch (err) {
      // Nếu Backend trả 404 (chưa deploy endpoint trên server), fallback upload thẳng lên Cloudinary
      if (err?.response?.status === 404 || err?.message?.includes('Network Error')) {
        console.info('[BannerAPI] Backend chưa có endpoint, tự động upload Cloudinary trực tiếp...');
        const imageFile = formData.get('image');
        let imageUrl = '';
        let publicId = null;

        if (imageFile && imageFile.size > 0) {
          const uploadRes = await uploadToCloudinaryDirect(imageFile);
          imageUrl = uploadRes.secure_url;
          publicId = uploadRes.public_id;
        }

        const newBanner = {
          id: Date.now(),
          title: formData.get('title') || '',
          subtitle: formData.get('subtitle') || '',
          description: formData.get('description') || '',
          imageUrl,
          cloudinaryPublicId: publicId,
          ctaText: formData.get('ctaText') || 'Khám phá ngay',
          ctaLink: formData.get('ctaLink') || '#products-catalog',
          isActive: formData.get('isActive') !== 'false',
          displayOrder: Number(formData.get('displayOrder')) || 0,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        };

        const local = getLocalBanners();
        saveLocalBanners([...local, newBanner]);
        return newBanner;
      }
      throw err;
    }
  },

  /**
   * Cập nhật banner (multipart/form-data)
   * @param {number} id
   * @param {FormData} formData
   */
  updateBanner: async (id, formData) => {
    try {
      const res = await apiClient.put(`/api/v1/admin/banners/${id}`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      const data = extractData(res.data);
      if (data) {
        const local = getLocalBanners().map((b) => (b.id === id ? data : b));
        saveLocalBanners(local);
        return data;
      }
    } catch (err) {
      if (err?.response?.status === 404 || err?.message?.includes('Network Error')) {
        console.info('[BannerAPI] Backend chưa có endpoint, cập nhật Cloudinary trực tiếp...');
        const local = getLocalBanners();
        const existing = local.find((b) => b.id === id) || {};

        const imageFile = formData.get('image');
        let imageUrl = existing.imageUrl;
        let publicId = existing.cloudinaryPublicId;

        if (imageFile && imageFile.size > 0) {
          const uploadRes = await uploadToCloudinaryDirect(imageFile);
          imageUrl = uploadRes.secure_url;
          publicId = uploadRes.public_id;
        }

        const updated = {
          ...existing,
          title: formData.has('title') ? formData.get('title') : existing.title,
          subtitle: formData.has('subtitle') ? formData.get('subtitle') : existing.subtitle,
          description: formData.has('description') ? formData.get('description') : existing.description,
          imageUrl,
          cloudinaryPublicId: publicId,
          ctaText: formData.has('ctaText') ? formData.get('ctaText') : existing.ctaText,
          ctaLink: formData.has('ctaLink') ? formData.get('ctaLink') : existing.ctaLink,
          isActive: formData.has('isActive') ? formData.get('isActive') !== 'false' : existing.isActive,
          displayOrder: formData.has('displayOrder') ? Number(formData.get('displayOrder')) : existing.displayOrder,
          updatedAt: new Date().toISOString(),
        };

        const updatedList = local.map((b) => (b.id === id ? updated : b));
        saveLocalBanners(updatedList);
        return updated;
      }
      throw err;
    }
  },

  /** Bật / tắt nhanh trạng thái banner */
  toggleStatus: async (id) => {
    try {
      const res = await apiClient.patch(`/api/v1/admin/banners/${id}/status`);
      const data = extractData(res.data);
      if (data) {
        const local = getLocalBanners().map((b) => (b.id === id ? data : b));
        saveLocalBanners(local);
        return data;
      }
    } catch (err) {
      if (err?.response?.status === 404 || err?.message?.includes('Network Error')) {
        const local = getLocalBanners();
        const found = local.find((b) => b.id === id);
        if (found) {
          found.isActive = !found.isActive;
          found.updatedAt = new Date().toISOString();
          saveLocalBanners(local);
          return found;
        }
      }
      throw err;
    }
  },

  /** Xóa banner (đồng thời xóa ảnh trên Cloudinary) */
  deleteBanner: async (id) => {
    try {
      await apiClient.delete(`/api/v1/admin/banners/${id}`);
    } catch (err) {
      if (err?.response?.status !== 404) {
        console.warn('Lỗi gọi xóa banner trên BE:', err.message);
      }
    }
    // Luôn xóa khỏi localStorage
    const local = getLocalBanners().filter((b) => b.id !== id);
    saveLocalBanners(local);
  },
};
