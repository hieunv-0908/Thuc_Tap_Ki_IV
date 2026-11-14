import axios from 'axios';
import { useAuthStore } from '../store/authStore';
import { toast } from '../store/toastStore';
import { jwtHelper } from '../utils/jwtHelper';
import { acquireValidToken, isNoAuthEndpoint, logoutApiFireAndForget } from './tokenRefresher';

const apiClient = axios.create({
  baseURL: import.meta.env.VITE_API_URL || '',
  timeout: 15000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// ================================================================
// Hàng đợi (Queue) dùng cho Reactive Fallback trong 1 tab
// (Đa tab đã được xử lý bởi Web Locks trong tokenRefresher.js)
// ================================================================
let isRefreshing = false;
let failedQueue = [];

/**
 * Giải phóng toàn bộ promise trong hàng đợi.
 * @param {Error|null} error - Lỗi (nếu refresh thất bại), hoặc null nếu thành công
 * @param {string|null} token - Access Token mới (nếu refresh thành công)
 */
const processQueue = (error, token = null) => {
  failedQueue.forEach((prom) => {
    if (error) {
      prom.reject(error);
    } else {
      prom.resolve(token);
    }
  });
  failedQueue = []; // Reset queue sau khi xử lý xong
};

// ================================================================
// 1. REQUEST INTERCEPTOR — PROACTIVE REFRESH
// Kiểm tra token sắp hết hạn trước khi gửi request.
// Giải quyết lỗ hổng upload file lớn / form dài bị đứt giữa chừng.
// ================================================================
apiClient.interceptors.request.use(
  async (config) => {
    // Nếu là endpoint trong Whitelist công khai -> Xóa Authorization header, không refresh
    if (isNoAuthEndpoint(config.url)) {
      if (config.headers?.Authorization) {
        delete config.headers.Authorization;
      }
      return config;
    }

    let token = useAuthStore.getState().token;

    // PROACTIVE CHECK: Token còn hạn dưới 60 giây và có refreshToken -> Gia hạn TRƯỚC khi gửi request
    if (token && jwtHelper.isTokenExpiringSoon(token, 60)) {
      const hasRefreshToken = !!useAuthStore.getState().refreshToken;
      if (hasRefreshToken) {
        try {
          token = await acquireValidToken();
        } catch (err) {
          // Nếu proactive refresh thất bại, để request đi với token cũ
          // Response Interceptor sẽ bắt lỗi 401 và xử lý tiếp
          console.warn('[ProactiveRefresh] Không thể gia hạn token trước:', err?.message);
        }
      }
    }

    if (token) {
      config.headers = config.headers || {};
      config.headers.Authorization = `Bearer ${token}`;
    }

    return config;
  },
  (error) => Promise.reject(error)
);

// ================================================================
// 2. RESPONSE INTERCEPTOR — REACTIVE FALLBACK
// Lưới an toàn khi token hết hạn đột ngột (máy ngủ, chuyển mạng).
// ================================================================
apiClient.interceptors.response.use(
  (response) => response.data,
  async (error) => {
    const originalRequest = error.config;

    if (error.response) {
      const { status, data } = error.response;

      // Điều kiện kích hoạt Auto Refresh:
      //   1. HTTP 401 Unauthorized
      //   2. Không phải endpoint trong Whitelist (tránh nhầm: sai mật khẩu -> 401 -> không refresh)
      //   3. Chưa từng retry request này (tránh vòng lặp vô tận)
      if (
        status === 401 &&
        !originalRequest?._retry &&
        !isNoAuthEndpoint(originalRequest?.url)
      ) {
        // Nếu đã có 1 request khác đang chờ refresh -> đưa request này vào hàng đợi
        if (isRefreshing) {
          return new Promise(function (resolve, reject) {
            failedQueue.push({ resolve, reject });
          })
            .then((token) => {
              originalRequest.headers['Authorization'] = 'Bearer ' + token;
              return apiClient(originalRequest);
            })
            .catch((err) => Promise.reject(err));
        }

        // Đánh dấu request đầu tiên bắt đầu luồng refresh
        originalRequest._retry = true;
        isRefreshing = true;

        // Kiểm tra có refreshToken không
        const store = useAuthStore.getState();
        if (!store.refreshToken) {
          isRefreshing = false;
          _handleSessionExpired('Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại.');
          return Promise.reject(error);
        }

        try {
          // Lấy token mới (có bảo vệ đa tab bởi Web Locks trong acquireValidToken)
          const newAccessToken = await acquireValidToken();

          // Giải phóng hàng đợi với token mới
          processQueue(null, newAccessToken);

          // Retry lại request gốc với token mới
          originalRequest.headers['Authorization'] = 'Bearer ' + newAccessToken;
          return apiClient(originalRequest);
        } catch (refreshErr) {
          // Refresh thất bại hoàn toàn (Refresh Token hết hạn / bị thu hồi)
          processQueue(refreshErr, null);

          // Fire-and-forget: Thông báo Backend dọn dẹp token (không await, không block)
          const currentStore = useAuthStore.getState();
          logoutApiFireAndForget(currentStore.token, currentStore.refreshToken);

          // Xóa state cục bộ và redirect về Login
          _handleSessionExpired('Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại.');

          return Promise.reject(refreshErr);
        } finally {
          isRefreshing = false;
        }
      }

      // Chuẩn hóa lỗi trả về cho các component
      const formattedError = {
        status,
        message: data?.message || 'Đã có lỗi xảy ra từ máy chủ.',
        errors: data?.errors || null,
      };
      return Promise.reject(formattedError);
    }

    // Lỗi mạng (không nhận được response)
    return Promise.reject({
      status: 0,
      message: error.message || 'Không thể kết nối đến máy chủ.',
    });
  }
);

/**
 * (Private) Xử lý đăng xuất phiên hết hạn: xóa state, toast và redirect về /login.
 * Lưu lại returnUrl để sau khi đăng nhập lại sẽ điều hướng về đúng trang.
 */
function _handleSessionExpired(message) {
  useAuthStore.getState().logout();
  toast.error(message);

  const { pathname, search } = window.location;
  if (!pathname.includes('/login') && !pathname.includes('/register')) {
    const returnUrl = encodeURIComponent(pathname + search);
    window.location.href = `/login?redirect=${returnUrl}`;
  }
}

export default apiClient;
