import { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import {
  User,
  Lock,
  AlertCircle,
  CheckCircle2,
  ArrowRight,
  ShieldCheck,
  Sparkles,
} from 'lucide-react';
import { authApi } from '../api/auth';
import { useAuthStore } from '../store/authStore';
import { toast } from '../store/toastStore';
import { isValidPassword } from '../utils/validators';
import BrandLogo from '../components/ui/BrandLogo';
import Input from '../components/ui/Input';

/**
 * Login page - Japanese Minimalist v3.0 (Ma 間 & Kanso 簡素)
 * Thiết kế tinh tế, tĩnh lặng, chuẩn triết lý thời trang tối giản FunnyShop.
 */
export default function Login() {
  const navigate = useNavigate();
  const location = useLocation();
  const loginToStore = useAuthStore((s) => s.login);

  const fromPath =
    location.state?.from ||
    new URLSearchParams(location.search).get('redirect') ||
    '/';

  const registeredUsername = location.state?.registeredUsername || '';
  const successNotice = location.state?.successNotice || '';

  const [formData, setFormData] = useState({
    username: registeredUsername,
    password: '',
  });

  const [errors, setErrors] = useState({});
  const [serverError, setServerError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const validateField = (name, value) => {
    let error = '';
    if (name === 'username') {
      if (!value.trim()) {
        error = 'Vui lòng nhập tên đăng nhập';
      }
    } else if (name === 'password') {
      if (!value) {
        error = 'Vui lòng nhập mật khẩu';
      } else if (!isValidPassword(value)) {
        error = 'Mật khẩu tối thiểu 6 ký tự';
      }
    }
    return error;
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    setServerError('');
    if (errors[name]) {
      setErrors((prev) => ({ ...prev, [name]: '' }));
    }
  };

  const handleBlur = (e) => {
    const { name, value } = e.target;
    const error = validateField(name, value);
    if (error) {
      setErrors((prev) => ({ ...prev, [name]: error }));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setServerError('');

    const userErr = validateField('username', formData.username);
    const passErr = validateField('password', formData.password);

    if (userErr || passErr) {
      setErrors({
        username: userErr,
        password: passErr,
      });
      return;
    }

    setIsSubmitting(true);
    try {
      const res = await authApi.login({
        username: formData.username.trim(),
        password: formData.password,
      });

      loginToStore(res.token, res.refreshToken, res.user);
      toast.success(`Chào mừng ${res.user?.fullName || res.user?.username || 'bạn'} trở lại!`);

      // Role-based redirect (Bảo toàn state checkoutItems/isDirectBuy nếu có)
      const redirectState = {
        checkoutItems: location.state?.checkoutItems,
        isDirectBuy: location.state?.isDirectBuy,
      };

      if (res.user?.role === 'ADMIN') {
        navigate(fromPath !== '/' ? fromPath : '/admin/products', { state: redirectState });
      } else {
        if (fromPath.startsWith('/admin')) {
          toast.info('Tài khoản của bạn không có quyền quản trị. Đã chuyển về trang chủ.');
          navigate('/');
        } else {
          navigate(fromPath, { state: redirectState });
        }
      }
    } catch (err) {
      if (err.status === 401) {
        setServerError('Tên đăng nhập hoặc mật khẩu không chính xác.');
      } else {
        setServerError(err.message || 'Đăng nhập không thành công. Vui lòng thử lại.');
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-[calc(100vh-72px)] bg-[#EDEDF0] flex items-center justify-center px-4 py-10 sm:py-16">
      <div className="w-full max-w-4xl border border-line bg-white grid grid-cols-1 lg:grid-cols-12 overflow-hidden shadow-xs">
        {/* Left: Editorial Lookbook Panel (Only lg:) */}
        <div className="hidden lg:flex lg:col-span-5 bg-[#121214] text-paper p-10 flex-col justify-between relative overflow-hidden">
          {/* Subtle editorial atmospheric background */}
          <div
            className="absolute inset-0 bg-cover bg-center opacity-20 pointer-events-none select-none grayscale"
            style={{
              backgroundImage:
                "url('https://images.unsplash.com/photo-1490481651871-ab68de25d43d?w=1000&auto=format&fit=crop&q=80')",
            }}
          />

          <div className="relative z-10">
            <Link to="/" className="inline-block mb-12">
              <BrandLogo onDark size="md" />
            </Link>

            <div className="inline-flex items-center gap-2 text-[10px] uppercase tracking-[0.25em] text-zinc-400 font-light mb-4">
              <span className="size-1.5 bg-vermilion inline-block" />
              <span>Authentic Minimalist</span>
            </div>

            <h2 className="font-serif text-2xl xl:text-3xl font-light text-zinc-100 leading-snug tracking-wide mb-4">
              Đơn giản trong đường nét, tinh tế trong trải nghiệm.
            </h2>

            <p className="text-xs font-light text-zinc-400 leading-relaxed mb-10">
              Đăng nhập để quản lý đơn hàng, theo dõi lịch sử mua sắm và nhận gợi ý trang phục độc quyền từ Stylist AI.
            </p>

            <div className="space-y-4 border-t border-zinc-800/80 pt-6">
              <div className="flex items-center gap-3 text-xs font-light text-zinc-300">
                <span className="text-[10px] font-mono text-zinc-500">01</span>
                <span>Tư vấn trang phục cá nhân hóa với Stylist AI</span>
              </div>
              <div className="flex items-center gap-3 text-xs font-light text-zinc-300">
                <span className="text-[10px] font-mono text-zinc-500">02</span>
                <span>Thanh toán linh hoạt COD &amp; VietQR PayOS 24/7</span>
              </div>
              <div className="flex items-center gap-3 text-xs font-light text-zinc-300">
                <span className="text-[10px] font-mono text-zinc-500">03</span>
                <span>Chính sách đổi size / đổi mẫu trong 7 ngày</span>
              </div>
            </div>
          </div>

          <div className="relative z-10 pt-8 border-t border-zinc-800/80 text-[10px] uppercase tracking-widest text-zinc-500 font-light">
            FunnyShop • Triết lý Kanso 簡素
          </div>
        </div>

        {/* Right: Form Card */}
        <div className="lg:col-span-7 p-6 sm:p-10 md:p-12 flex flex-col justify-center bg-white">
          {/* Header */}
          <div className="mb-8">
            <div className="lg:hidden mb-6">
              <Link to="/">
                <BrandLogo size="md" />
              </Link>
            </div>

            <div className="inline-flex items-center gap-2 text-[10px] uppercase tracking-[0.2em] text-mute mb-1.5">
              <span className="size-1.5 bg-vermilion inline-block" />
              <span>Tài khoản thành viên</span>
            </div>
            <h1 className="font-serif text-2xl sm:text-3xl font-light text-ink tracking-wide">
              Đăng nhập
            </h1>
            <p className="text-xs font-light text-mute mt-1.5">
              Vui lòng nhập thông tin để truy cập tài khoản của bạn.
            </p>
          </div>

          {/* Success Notice from Registration */}
          {successNotice && !serverError && (
            <div
              role="status"
              className="mb-6 flex items-start gap-2.5 p-3.5 bg-emerald-50/60 border border-emerald-200 text-emerald-800 text-xs font-light"
            >
              <CheckCircle2 className="size-4 shrink-0 mt-0.5 text-emerald-600" aria-hidden="true" />
              <div className="flex-1 leading-relaxed">{successNotice}</div>
            </div>
          )}

          {/* Server Error Alert */}
          {serverError && (
            <div
              role="alert"
              className="mb-6 flex items-start gap-2.5 p-3.5 bg-red-50/70 border border-vermilion/30 text-vermilion text-xs font-light"
            >
              <AlertCircle className="size-4 shrink-0 mt-0.5 text-vermilion" aria-hidden="true" />
              <div className="flex-1 leading-relaxed">{serverError}</div>
            </div>
          )}

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-5" noValidate>
            <div>
              <label
                htmlFor="login-username"
                className="block text-[11px] uppercase tracking-widest text-mute font-light mb-1.5"
              >
                Tên đăng nhập <span className="text-vermilion">*</span>
              </label>
              <div className="relative">
                <input
                  id="login-username"
                  name="username"
                  type="text"
                  value={formData.username}
                  onChange={handleChange}
                  onBlur={handleBlur}
                  placeholder="Nhập tên tài khoản"
                  disabled={isSubmitting}
                  autoFocus={!registeredUsername}
                  className={`w-full h-11 px-3 bg-white border text-xs sm:text-sm text-ink placeholder:text-mute/60 font-light transition-colors focus:outline-none ${
                    errors.username
                      ? 'border-vermilion focus:border-vermilion'
                      : 'border-line focus:border-ink'
                  }`}
                />
              </div>
              {errors.username && (
                <p className="text-xs text-vermilion font-light mt-1 flex items-center gap-1">
                  <AlertCircle className="size-3" />
                  <span>{errors.username}</span>
                </p>
              )}
            </div>

            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label
                  htmlFor="login-password"
                  className="block text-[11px] uppercase tracking-widest text-mute font-light"
                >
                  Mật khẩu <span className="text-vermilion">*</span>
                </label>
                <Link
                  to="/forgot-password"
                  className="text-[11px] font-light text-mute hover:text-ink underline underline-offset-4 transition-colors"
                >
                  Quên mật khẩu?
                </Link>
              </div>
              <div className="relative">
                <input
                  id="login-password"
                  name="password"
                  type="password"
                  value={formData.password}
                  onChange={handleChange}
                  onBlur={handleBlur}
                  placeholder="Tối thiểu 6 ký tự"
                  disabled={isSubmitting}
                  autoFocus={Boolean(registeredUsername)}
                  className={`w-full h-11 px-3 bg-white border text-xs sm:text-sm text-ink placeholder:text-mute/60 font-light transition-colors focus:outline-none ${
                    errors.password
                      ? 'border-vermilion focus:border-vermilion'
                      : 'border-line focus:border-ink'
                  }`}
                />
              </div>
              {errors.password && (
                <p className="text-xs text-vermilion font-light mt-1 flex items-center gap-1">
                  <AlertCircle className="size-3" />
                  <span>{errors.password}</span>
                </p>
              )}
            </div>

            <div className="pt-2">
              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full h-11 bg-ink text-paper text-xs uppercase tracking-[0.2em] font-light hover:bg-ink/85 border border-ink transition-colors cursor-pointer disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {isSubmitting ? (
                  <span>Đang xác thực...</span>
                ) : (
                  <>
                    <span>Đăng nhập</span>
                    <ArrowRight className="size-3.5" />
                  </>
                )}
              </button>
            </div>
          </form>

          {/* Footer Link to Register */}
          <div className="mt-8 pt-6 border-t border-line text-center text-xs font-light text-mute">
            Chưa có tài khoản?{' '}
            <Link
              to="/register"
              className="text-ink hover:text-vermilion underline underline-offset-4 transition-colors ml-1 font-normal"
            >
              Đăng ký tài khoản mới
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
