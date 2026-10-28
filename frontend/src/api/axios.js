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
    const token = useAuthStore.getState().token;
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
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
        // Không logout nếu đang ở endpoint auth (login / register)
        const isAuthEndpoint = error.config?.url?.includes('/auth/');

        if (!isAuthEndpoint && wasAuthenticated) {
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
