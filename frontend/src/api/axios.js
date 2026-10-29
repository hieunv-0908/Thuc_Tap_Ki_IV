import axios from 'axios';
import { useAuthStore } from '../store/authStore';
import { toast } from '../store/toastStore';

const apiClient = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:8080',
  timeout: 15000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request Interceptor: Attach JWT Token
apiClient.interceptors.request.use(
  (config) => {
    // Không gửi token cho các endpoint auth (login, register)
    const isAuthEndpoint = config.url?.includes('/auth/');
    if (isAuthEndpoint) {
      if (config.headers?.Authorization) {
        delete config.headers.Authorization;
      }
    } else {
      let token = useAuthStore.getState().token;
      if (!token) {
        try {
          const raw = localStorage.getItem('funnyshop_auth');
          if (raw) {
            const parsed = JSON.parse(raw);
            token = parsed?.state?.token;
          }
        } catch {
          // Ignore parse errors
        }
      }
      if (token) {
        if (typeof config.headers?.set === 'function') {
          config.headers.set('Authorization', `Bearer ${token}`);
        } else {
          config.headers = config.headers || {};
          config.headers.Authorization = `Bearer ${token}`;
        }
      }
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Response Interceptor: Handle 401 Unauthorized
apiClient.interceptors.response.use(
  (response) => response.data,
  (error) => {
    if (error.response) {
      const { status, data } = error.response;

      if (status === 401) {
        const store = useAuthStore.getState();
        const wasAuthenticated = store.isAuthenticated;
        const isAuthEndpoint = error.config?.url?.includes('/auth/');
        // Chỉ logout nếu chính endpoint xác thực phiên /users/me báo token không hợp lệ
        // Tránh việc các endpoint nghiệp vụ chưa hoàn thiện hoặc chưa map làm mất phiên đăng nhập của Admin
        const isProfileCheck = error.config?.url?.includes('/users/me');

        if (!isAuthEndpoint && wasAuthenticated && isProfileCheck) {
          useAuthStore.getState().logout();
          toast.error('Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại.');
          if (!window.location.pathname.includes('/login') && !window.location.pathname.includes('/register')) {
            window.location.href = '/login';
          }
        }
      }

      // Standardize error message
      const formattedError = {
        status,
        message: data?.message || 'Đã có lỗi xảy ra từ máy chủ.',
        errors: data?.errors || null,
      };
      return Promise.reject(formattedError);
    }

    return Promise.reject({
      status: 0,
      message: error.message || 'Không thể kết nối đến máy chủ.',
    });
  }
);

export default apiClient;
