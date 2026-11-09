import apiClient from './axios';
// import { mockEngine } from './mock/mockEngine';

// const isMock = import.meta.env.VITE_USE_MOCK === 'true';

export const authApi = {
  /**
   * Đăng nhập
   * BE nhận: { username, password }
   * BE trả:  { code, message, data: { accessToken, tokenType, expiresIn, user } }
   */
  login: async ({username, password}) => {
    // if (isMock) {
    //   return await mockEngine.login({email: username, password});
    // }

    console.log('[login] Gửi request =>', {username});
    try {
      const res = await apiClient.post('/api/v1/auth/login', {username, password});
      console.log('[login] Nhận response thành công =>', res);

      // axios interceptor đã unwrap response.data, nên:
      // res = { code: 200, message: "...", data: { accessToken: "...", user: {...} } }
      const token = res?.data?.accessToken || res?.accessToken;
      const user = res?.data?.user || res?.user;
      console.log('[login] Extracted token & user =>', {token, user});

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
  register: async ({username, fullName, email, password, phone}) => {
    // if (isMock) {
    //   return await mockEngine.register({fullName, email, password});
    // }
    const res = await apiClient.post('/api/v1/auth/register', {
      username,
      email,
      password,
      fullName,
      phone: phone || '',
    });
    return res?.data || res;
  },

  /**
   * Quên mật khẩu - gửi mã xác thực OTP
   * BE ForgotPasswordRequest: { email }
   */
  forgotPassword: async ({ email, emailOrUsername }) => {
    const targetEmail = (email || emailOrUsername || '').trim();
    // if (isMock) {
    //   return await mockEngine.requestPasswordReset({
    //     emailOrUsername: targetEmail,
    //   });
    // }

    const res = await apiClient.post('/api/v1/auth/forgot-password', {
      email: targetEmail,
    });

    // Giữ lại message của ApiResponse, kể cả khi data = null
    return res?.data?.code !== undefined ? res.data : res;
  },

  /**
   * Xác thực mã OTP
   * BE VerifyOtpRequest: { email, otp }
   * BE trả về: { code: 200, message: "...", data: { resetToken: "..." } }
   */
  verifyResetOtp: async ({ email, emailOrUsername, otp }) => {
    const targetEmail = (email || emailOrUsername || '').trim();
    const targetOtp = (otp || '').trim();
    // if (isMock) {
    //   return await mockEngine.verifyResetOtp({
    //     emailOrUsername: targetEmail,
    //     otp: targetOtp,
    //   });
    // }

    const res = await apiClient.post('/api/v1/auth/verify-otp', {
      email: targetEmail,
      otp: targetOtp,
    });

    const body = res?.data?.code !== undefined ? res.data : res;
    return body?.data || body;
  },

  /**
   * Đặt lại mật khẩu mới
   * BE ResetPasswordRequest: { resetToken, newPassword, confirmPassword }
   */
  resetPassword: async ({
    resetToken,
    newPassword,
    confirmPassword,
    // emailOrUsername,
    // email,
    // otp,
  }) => {
    // if (isMock) {
    //   return await mockEngine.resetPassword({
    //     emailOrUsername: emailOrUsername || email,
    //     otp,
    //     newPassword,
    //   });
    // }

    const res = await apiClient.post('/api/v1/auth/reset-password', {
      resetToken,
      newPassword,
      confirmPassword: confirmPassword || newPassword,
    });

    return res?.data?.code !== undefined ? res.data : res;
  },
};
