import { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { Mail, Lock, AlertCircle, Sparkles, ShieldCheck } from 'lucide-react';
import { authApi } from '../api/auth';
import { useAuthStore } from '../store/authStore';
import { toast } from '../store/toastStore';
import { isValidEmail, isValidPassword } from '../utils/validators';
import Input from '../components/ui/Input';
import Button from '../components/ui/Button';

/**
 * Login page complying with Design.md 7.3
 */
export default function Login() {
  const navigate = useNavigate();
  const location = useLocation();
  const loginToStore = useAuthStore((s) => s.login);

  const fromPath = location.state?.from || '/';

  const [formData, setFormData] = useState({
    email: '',
    password: '',
  });

  const [errors, setErrors] = useState({});
  const [serverError, setServerError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const validateField = (name, value) => {
    let error = '';
    if (name === 'email') {
      if (!value.trim()) {
        error = 'Vui lòng nhập email';
      } else if (!isValidEmail(value)) {
        error = 'Email không hợp lệ';
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

    const emailErr = validateField('email', formData.email);
    const passErr = validateField('password', formData.password);

    if (emailErr || passErr) {
      setErrors({
        email: emailErr,
        password: passErr,
      });
      return;
    }

    setIsSubmitting(true);
    try {
      const res = await authApi.login({
        email: formData.email,
        password: formData.password,
      });

      loginToStore(res.token, res.user);
      toast.success(`Chào mừng ${res.user.fullName} trở lại!`);

      // Role based redirect per Design.md 7.3: ADMIN to /admin/products, CUSTOMER to previous or /
      if (res.user.role === 'ADMIN') {
        navigate(fromPath !== '/' ? fromPath : '/admin/products');
      } else {
        navigate(fromPath);
      }
    } catch (err) {
      setServerError(err.message || 'Email hoặc mật khẩu không chính xác.');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Quick fill helper for testing
  const handleQuickFill = (email, password) => {
    setFormData({ email, password });
    setErrors({});
    setServerError('');
  };

  return (
    <div className="min-h-[calc(100vh-8rem)] flex items-center justify-center px-4 py-12">
      <div className="w-full max-w-md bg-white rounded-2xl border border-line shadow-sm p-6 sm:p-8 animate-in fade-in duration-200">
        {/* Top Header */}
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
            Chào mừng bạn trở lại với thiên đường quà tặng vui nhộn!
          </p>
        </div>

        {/* Server Error Alert Block */}
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
            label="Địa chỉ Email"
            id="login-email"
            name="email"
            type="email"
            value={formData.email}
            onChange={handleChange}
            onBlur={handleBlur}
            placeholder="name@example.com"
            error={errors.email}
            leftIcon={Mail}
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
              className="font-bold text-base"
            >
              Đăng nhập
            </Button>
          </div>
        </form>

        {/* Quick test credentials */}
        <div className="mt-6 pt-5 border-t border-line">
          <p className="text-xs text-ink-subtle font-medium text-center mb-2.5 flex items-center justify-center gap-1.5">
            <Sparkles className="size-3.5 text-secondary-500" />
            Tài khoản mẫu để kiểm thử nhanh:
          </p>
          <div className="grid grid-cols-2 gap-2">
            <button
              type="button"
              onClick={() => handleQuickFill('customer@funny.shop', 'Customer@123')}
              className="p-2 text-xs text-ink rounded-lg border border-line bg-gray-50 hover:bg-gray-100 text-left transition-colors cursor-pointer"
            >
              <div className="font-semibold text-ink">Khách hàng</div>
              <div className="text-[11px] text-ink-subtle truncate">customer@funny.shop</div>
            </button>

            <button
              type="button"
              onClick={() => handleQuickFill('admin@funny.shop', 'Admin@123')}
              className="p-2 text-xs text-ink rounded-lg border border-secondary-200 bg-secondary-50/60 hover:bg-secondary-100 text-left transition-colors cursor-pointer"
            >
              <div className="font-semibold text-secondary-700 flex items-center gap-1">
                <ShieldCheck className="size-3" />
                Quản trị viên
              </div>
              <div className="text-[11px] text-secondary-800 truncate">admin@funny.shop</div>
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
  );
}
