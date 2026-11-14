/**
 * tokenRefresher.js
 * Bộ điều phối Refresh Token an toàn với 2 cơ chế:
 *   1. Web Locks API (navigator.locks): Mutex xuyên tab, chỉ 1 tab được gọi /refresh tại 1 thời điểm.
 *   2. Fallback: Kiểm tra lại localStorage trước khi gọi Backend nếu trình duyệt cũ không hỗ trợ locks.
 *
 * Strict Whitelist: Danh sách endpoint công khai KHÔNG cần Authorization header và KHÔNG kích hoạt auto-refresh.
 */
import axios from 'axios';
import { useAuthStore } from '../store/authStore';

/**
 * Trả về base URL để gọi API:
 * - Ưu tiên dùng window.location.origin (http://localhost:5173) để request đi qua Vite proxy đúng cách.
 * - Vite proxy sẽ tự forward sang Backend (http://localhost:8080).
 */
const getBaseUrl = () => {
  if (typeof window !== 'undefined') {
    return window.location.origin; // "http://localhost:5173" trong dev
  }
  return '';
};

// =============================================
// STRICT WHITELIST: Chỉ liệt kê chính xác các endpoint public
// (Không dùng includes('/auth/') để tránh lột token nhầm các endpoint như /auth/profile, /authors/...)
// =============================================
export const NO_AUTH_ENDPOINTS = [
  '/api/v1/auth/login',
  '/api/v1/auth/register',
  '/api/v1/auth/refresh',
  '/api/v1/auth/forgot-password',
  '/api/v1/auth/verify-otp',
  '/api/v1/auth/reset-password',
];

/**
 * Kiểm tra URL có nằm trong danh sách Whitelist (không cần token) hay không.
 * So sánh chính xác với endsWith hoặc includes để xử lý cả URL tuyệt đối & tương đối.
 * @param {string} url
 * @returns {boolean}
 */
export const isNoAuthEndpoint = (url) => {
  if (!url) return false;
  return NO_AUTH_ENDPOINTS.some(
    (endpoint) => url === endpoint || url.endsWith(endpoint) || url.includes(endpoint + '?')
  );
};

/**
 * Lấy Access Token hợp lệ, có bảo vệ đa tab bằng Web Locks API.
 *
 * Luồng hoạt động:
 *   - Tab xin giữ lock 'funnyshop_refresh_lock'
 *   - Khi vào được lock: đọc lại localStorage, nếu token đã được tab khác cập nhật mới thì dùng luôn
 *   - Nếu vẫn còn token cũ: gọi API /refresh để lấy token mới
 *
 * @returns {Promise<string>} - Access Token mới
 * @throws {Error} - Nếu không có refreshToken hoặc refresh thất bại
 */
export async function acquireValidToken() {
  const tokenAtCallTime = useAuthStore.getState().token;

  if (typeof navigator !== 'undefined' && navigator.locks) {
    // Web Locks API: Chỉ 1 tab được phép chạy trong lock tại 1 thời điểm
    return await navigator.locks.request('funnyshop_refresh_lock', async () => {
      const currentToken = useAuthStore.getState().token;

      // Nếu tab khác vừa refresh xong và cập nhật token mới vào store/localStorage -> Dùng luôn, không gọi BE
      if (currentToken && currentToken !== tokenAtCallTime) {
        return currentToken;
      }

      // Vẫn còn token cũ -> Tab này đứng ra gọi BE /refresh
      return await _callRefreshApi();
    });
  }

  // Fallback: Trình duyệt cũ không hỗ trợ Web Locks
  return await _callRefreshApi();
}

/**
 * (Private) Gọi API /refresh bằng axios instance thuần để tránh bị vòng lặp interceptor.
 * @returns {Promise<string>} - Access Token mới
 */
async function _callRefreshApi() {
  const store = useAuthStore.getState();
  const refreshToken = store.refreshToken;

  if (!refreshToken) {
    throw new Error('NO_REFRESH_TOKEN');
  }

  try {
    // Dùng axios trực tiếp (không qua apiClient) để tránh interceptor retry vô hạn
    const response = await axios.post(
      `${getBaseUrl()}/api/v1/auth/refresh`,
      { refreshToken },
      {
        headers: { 'Content-Type': 'application/json' },
        timeout: 10000,
      }
    );

    // Backend trả về ApiResponse<AuthResponse>: response.data = { code, message, data: { accessToken, refreshToken, ... } }
    const responseData = response.data;
    const newAccessToken = responseData?.data?.accessToken || responseData?.accessToken;
    const newRefreshToken = responseData?.data?.refreshToken || responseData?.refreshToken;

    if (!newAccessToken) {
      throw new Error('INVALID_REFRESH_RESPONSE');
    }

    // Cập nhật cặp token mới vào Zustand store (tự động đồng bộ localStorage qua persist)
    store.setTokens({
      token: newAccessToken,
      refreshToken: newRefreshToken,
    });

    return newAccessToken;
  } catch (err) {
    // Ném lỗi để tầng gọi (axios interceptor) xử lý logout + redirect
    throw err;
  }
}

/**
 * Gọi API logout trên Backend theo cơ chế Fire-and-Forget.
 * Không await, không block luồng chính, bỏ qua mọi lỗi phát sinh.
 * Mục đích: dọn dẹp token khỏi Blacklist/Redis của Backend nếu còn có thể.
 *
 * @param {string|null} accessToken
 * @param {string|null} refreshToken
 */
export function logoutApiFireAndForget(accessToken, refreshToken) {
  if (!accessToken && !refreshToken) return;

  axios
    .post(
      `${getBaseUrl()}/api/v1/auth/logout`,
      { refreshToken },
      {
        headers: {
          'Content-Type': 'application/json',
          ...(accessToken ? { Authorization: `Bearer ${accessToken}` } : {}),
        },
        timeout: 3000,
      }
    )
    .catch(() => {
      // Fire-and-forget: Bỏ qua toàn bộ lỗi, kể cả 401/403 do token đã chết
      // Tuyệt đối không ném lỗi ra ngoài để tránh trigger vòng lặp interceptor
    });
}

