import { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import {
  User,
  Lock,
  AlertCircle,
  Sparkles,
  ShieldCheck,
  ClipboardList,
  MapPin,
  Bot,
} from 'lucide-react';
import { authApi } from '../api/auth';
import { useAuthStore } from '../store/authStore';
import { toast } from '../store/toastStore';
import { isValidPassword } from '../utils/validators';
import Input from '../components/ui/Input';
import Button from '../components/ui/Button';

/**
 * Login page complying with Design.md 7.3 (v2.0)
 * 2-column layout on lg: with brand panel
 */
export default function Login() {
  const navigate = useNavigate();
  const location = useLocation();
  const loginToStore = useAuthStore((s) => s.login);

  const fromPath =
    location.state?.from ||
    new URLSearchParams(location.search).get('redirect') ||
    '/';

  const [formData, setFormData] = useState({
    username: '',
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

      loginToStore(res.token, res.user);
      toast.success(`Chào mừng ${res.user?.fullName || res.user?.username || 'bạn'} trở lại!`);

      // Role-based redirect
      if (res.user?.role === 'ADMIN') {
        navigate(fromPath !== '/' ? fromPath : '/admin/products');
      } else {
        navigate(fromPath);
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

  const handleQuickFill = (username, password) => {
    setFormData({ username, password });
    setErrors({});
    setServerError('');
  };

  return (
    <div className="relative min-h-[calc(100vh-8rem)] flex items-center justify-center px-4 py-8 md:py-16 bg-gradient-to-br from-primary-50 via-white to-secondary-50 overflow-hidden">
      {/* 2 Decorative Soft Blobs (Design.md 2.7.3) */}
      <div
        className="absolute top-10 left-10 size-64 rounded-full bg-primary-200/40 blur-3xl pointer-events-none select-none"
        aria-hidden="true"
      />
      <div
        className="absolute bottom-10 right-10 size-72 rounded-full bg-secondary-200/40 blur-3xl pointer-events-none select-none"
        aria-hidden="true"
      />

      <div className="relative z-10 w-full max-w-4xl grid grid-cols-1 lg:grid-cols-2 gap-8 items-center">
        {/* Left: Brand Panel (Only lg:) */}
        <div className="hidden lg:flex flex-col justify-between h-full rounded-3xl bg-gradient-to-br from-primary-600 to-secondary-600 p-10 text-white relative overflow-hidden shadow-brand">
          {/* Floating emoji in brand panel */}
          <span
            className="absolute top-6 right-6 text-5xl opacity-40 animate-[float_5s_ease-in-out_infinite] select-none pointer-events-none"
            aria-hidden="true"
          >
            🎈
          </span>
          <span
            className="absolute bottom-8 right-8 text-4xl opacity-30 animate-[float-slow_8s_ease-in-out_infinite] select-none pointer-events-none"
            aria-hidden="true"
          >
            🧸
          </span>

          <div>
            <div className="inline-flex items-center gap-2 text-2xl font-bold tracking-tight mb-8">
              <span>🎈</span>
              <span>FunnyShop</span>
            </div>

            <h2 className="text-3xl font-extrabold tracking-tight leading-snug mb-4">
              Chào mừng trở lại FunnyShop!
            </h2>
            <p className="text-sm text-white/90 leading-relaxed mb-8">
              Đăng nhập ngay để theo dõi các đơn hàng quà tặng vui nhộn và nhận ưu đãi độc quyền.
            </p>

            {/* 3 benefit bullets */}
            <div className="space-y-4">
              <div className="flex items-center gap-3">
                <div className="size-9 rounded-xl bg-white/20 flex items-center justify-center shrink-0">
                  <ClipboardList className="size-4.5 text-white" />
                </div>
                <span className="text-sm font-medium">Theo dõi tình trạng đơn hàng dễ dàng</span>
              </div>

              <div className="flex items-center gap-3">
                <div className="size-9 rounded-xl bg-white/20 flex items-center justify-center shrink-0">
                  <MapPin className="size-4.5 text-white" />
                </div>
                <span className="text-sm font-medium">Lưu địa chỉ nhận hàng thuận tiện</span>
              </div>

              <div className="flex items-center gap-3">
                <div className="size-9 rounded-xl bg-white/20 flex items-center justify-center shrink-0">
                  <Bot className="size-4.5 text-white" />
                </div>
                <span className="text-sm font-medium">Hỏi trợ lý AI thông minh chọn quà</span>
              </div>
            </div>
          </div>

          <div className="pt-8 border-t border-white/20 text-xs text-white/80">
            Nền tảng quà tặng độc lạ hàng đầu cho giới trẻ Việt Nam.
          </div>
        </div>

        {/* Right: Form Card */}
        <div className="w-full max-w-md mx-auto bg-white rounded-2xl border border-line shadow-soft p-6 sm:p-8 animate-in fade-in duration-200">
          {/* Header */}
          <div className="text-center mb-6">
            <Link
              to="/"
              className="inline-flex items-center gap-1.5 text-2xl font-bold tracking-tight mb-2"
            >
              <span className="text-3xl" aria-hidden="true">🎈</span>
              <span className="text-primary-700">Funny</span>
              <span className="text-secondary-500">Shop</span>
            </Link>
            <h1 className="text-2xl font-bold text-ink">Đăng nhập tài khoản</h1>
            <p className="text-sm text-ink-muted mt-1">
              Điền thông tin để đăng nhập vào tài khoản của bạn
            </p>
          </div>

          {/* Server Error Alert */}
          {serverError && (
            <div
              role="alert"
              className="mb-5 flex items-start gap-3 p-3.5 rounded-xl bg-red-50 border border-red-200 text-red-700 text-sm animate-in shake duration-200"
            >
              <AlertCircle className="size-5 shrink-0 mt-0.5 text-red-600" aria-hidden="true" />
              <div className="flex-1 font-medium">{serverError}</div>
            </div>
          )}

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-4" noValidate>
            <Input
              label="Tên đăng nhập"
              id="login-username"
              name="username"
              type="text"
              value={formData.username}
              onChange={handleChange}
              onBlur={handleBlur}
              placeholder="Nhập tên đăng nhập"
              error={errors.username}
              leftIcon={User}
              required
              disabled={isSubmitting}
            />

            <Input
              label="Mật khẩu"
              id="login-password"
              name="password"
              type="password"
              value={formData.password}
              onChange={handleChange}
              onBlur={handleBlur}
              placeholder="Nhập tối thiểu 6 ký tự"
              error={errors.password}
              leftIcon={Lock}
              required
              disabled={isSubmitting}
            />

            <div className="pt-2">
              <Button
                type="submit"
                variant="primary"
                size="lg"
                fullWidth
                loading={isSubmitting}
                className="font-bold text-base shadow-brand"
              >
                Đăng nhập
              </Button>
            </div>
          </form>

          {/* Quick test credentials */}
          <div className="mt-6 pt-5 border-t border-line">
            <p className="text-xs text-ink-subtle font-medium text-center mb-2.5 flex items-center justify-center gap-1.5">
              <Sparkles className="size-3.5 text-secondary-500" />
              Tài khoản mẫu từ Database:
            </p>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => handleQuickFill('admin', '123456')}
                className="p-2 text-xs text-ink rounded-lg border border-secondary-200 bg-secondary-50/60 hover:bg-secondary-100 text-left transition-colors cursor-pointer"
              >
                <div className="font-semibold text-secondary-700 flex items-center gap-1">
                  <ShieldCheck className="size-3" />
                  Admin
                </div>
                <div className="text-[11px] text-secondary-800 truncate">admin / password</div>
              </button>

              <button
                type="button"
                onClick={() => handleQuickFill('user1', 'password')}
                className="p-2 text-xs text-ink rounded-lg border border-line bg-gray-50 hover:bg-gray-100 text-left transition-colors cursor-pointer"
              >
                <div className="font-semibold text-ink">Khách hàng</div>
                <div className="text-[11px] text-ink-subtle truncate">user1 / password</div>
              </button>
            </div>
          </div>

          {/* Footer Link to Register */}
          <div className="mt-6 text-center text-sm text-ink-muted">
            Chưa có tài khoản?{' '}
            <Link
              to="/register"
              className="font-bold text-primary-700 hover:text-primary-800 hover:underline transition-colors ml-1"
            >
              Đăng ký ngay
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
