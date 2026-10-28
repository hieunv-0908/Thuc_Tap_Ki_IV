import apiClient from './axios';
import { mockEngine } from './mock/mockEngine';

// Chỉ gọi API thật Backend cho Auth (Đăng nhập / Đăng ký)
const isMock = false;

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
    const res = await apiClient.post('/api/v1/auth/login', { username, password });
    // Chuẩn hoá response: trả về { token, user } để các component dùng thống nhất
    return {
      token: res.data.accessToken,
      user: res.data.user,
    };
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
    return res.data;
  },
};
