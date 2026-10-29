import apiClient from './axios';
import { mockEngine } from './mock/mockEngine';

const isMock = import.meta.env.VITE_USE_MOCK === 'true';

export const authApi = {
  /**
   * Đăng nhập
   * BE nhận: { username, password }
   * BE trả:  { code, message, data: { accessToken, tokenType, expiresIn, user } }
   */
  login: async ({ username, password }) => {
    if (isMock) {
      return await mockEngine.login({ email: username, password });
    }

    console.log('[login] Gửi request =>', { username });
    try {
      const res = await apiClient.post('/api/v1/auth/login', { username, password });
      console.log('[login] Nhận response thành công =>', res);

      // axios interceptor đã unwrap response.data, nên:
      // res = { code: 200, message: "...", data: { accessToken: "...", user: {...} } }
      const token = res?.data?.accessToken || res?.accessToken;
      const user = res?.data?.user || res?.user;
      console.log('[login] Extracted token & user =>', { token, user });

      return {
        token,
        user,
      };
    } catch (error) {
      console.error('[login] Request thất bại (HTTP Error từ Backend) =>', error);
      throw error;
    }
  },

  /**
   * Đăng ký
   * BE nhận: { username, email, password, fullName, phone }
   * BE trả:  { code, message, data: { id, username, email, fullName, phone, role, status } }
   */
  register: async ({ username, fullName, email, password, phone }) => {
    if (isMock) {
      return await mockEngine.register({ fullName, email, password });
    }
    const res = await apiClient.post('/api/v1/auth/register', {
      username,
      email,
      password,
      fullName,
      phone: phone || '',
    });
    return res?.data || res;
  },
};
