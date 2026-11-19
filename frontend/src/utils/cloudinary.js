/**
 * Cloudinary Upload Utility for FunnyShop
 * Tự động ký số HMAC-SHA1 và upload ảnh lên Cloudinary
 */

const CLOUDINARY_CLOUD_NAME = 'dtdpmvyzq';
const CLOUDINARY_API_KEY = '832254241169418';
const CLOUDINARY_API_SECRET = 'hLQ4s1U8qINkSogzFLmxn2UGdMs';

async function sha1Hex(str) {
  const enc = new TextEncoder();
  const hash = await crypto.subtle.digest('SHA-1', enc.encode(str));
  return Array.from(new Uint8Array(hash))
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('');
}

/**
 * Upload một file ảnh lên Cloudinary
 * @param {File} file - File ảnh từ input[type="file"]
 * @param {string} folder - Thư mục lưu trữ trên Cloudinary (mặc định: 'funnyshop/products')
 * @returns {Promise<{ url: string, secure_url: string, publicId: string }>}
 */
export async function uploadImageToCloudinary(file, folder = 'funnyshop/products') {
  if (!file) throw new Error('Vui lòng chọn file ảnh.');

  const validTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
  if (!validTypes.includes(file.type)) {
    throw new Error('Định dạng ảnh không hỗ trợ. Chỉ chấp nhận JPG, PNG hoặc WEBP.');
  }

  if (file.size > 10 * 1024 * 1024) {
    throw new Error('Dung lượng ảnh vượt quá 10MB.');
  }

  const timestamp = Math.round(Date.now() / 1000);
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

  const data = await res.json();
  return {
    url: data.secure_url,
    secure_url: data.secure_url,
    publicId: data.public_id,
  };
}

