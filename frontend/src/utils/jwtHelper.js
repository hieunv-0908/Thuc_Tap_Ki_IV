/**
 * jwtHelper.js
 * Tiện ích giải mã JWT payload và kiểm tra thời hạn token trực tiếp trên Frontend.
 * Không cần thư viện bên ngoài, dùng atob() có sẵn của trình duyệt.
 */
export const jwtHelper = {
  /**
   * Giải mã an toàn phần payload (phần thứ 2) của chuỗi JWT.
   * @param {string} token - Chuỗi JWT dạng "header.payload.signature"
   * @returns {object|null} - Payload đã parse thành object, hoặc null nếu không hợp lệ
   */
  parseJwt: (token) => {
    if (!token || typeof token !== 'string') return null;
    try {
      const parts = token.split('.');
      if (parts.length !== 3) return null;

      const base64Url = parts[1];
      // Chuyển Base64Url -> Base64 chuẩn
      const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
      // Giải mã Base64 -> chuỗi UTF-8
      const jsonPayload = decodeURIComponent(
        atob(base64)
          .split('')
          .map((c) => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2))
          .join('')
      );
      return JSON.parse(jsonPayload);
    } catch {
      return null;
    }
  },

  /**
   * Kiểm tra xem Access Token có sắp hết hạn trong vòng bufferSeconds giây không.
   * Dùng để kích hoạt Proactive Refresh tại Request Interceptor.
   *
   * @param {string} token - Chuỗi JWT Access Token
   * @param {number} bufferSeconds - Ngưỡng thời gian cảnh báo (mặc định 60 giây)
   * @returns {boolean} - true nếu token đã hết hạn hoặc sắp hết hạn trong bufferSeconds
   */
  isTokenExpiringSoon: (token, bufferSeconds = 60) => {
    const payload = jwtHelper.parseJwt(token);
    if (!payload || typeof payload.exp !== 'number') {
      // Không parse được hoặc không có trường exp => coi như hết hạn
      return true;
    }
    const nowInSeconds = Math.floor(Date.now() / 1000);
    return payload.exp - nowInSeconds <= bufferSeconds;
  },

  /**
   * Lấy thời gian còn lại của token theo đơn vị milliseconds.
   * Trả về 0 nếu token đã hết hạn hoặc không parse được.
   *
   * @param {string} token - Chuỗi JWT
   * @returns {number} - Milliseconds còn lại
   */
  getRemainingMs: (token) => {
    const payload = jwtHelper.parseJwt(token);
    if (!payload || typeof payload.exp !== 'number') return 0;
    const remainingMs = payload.exp * 1000 - Date.now();
    return Math.max(0, remainingMs);
  },
};

