import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  User,
  Mail,
  Lock,
  Phone,
  AlertCircle,
  CheckCircle2,
  Gift,
  ShieldCheck,
  Zap,
} from 'lucide-react';
import { authApi } from '../api/auth';
import { toast } from '../store/toastStore';
import { isValidEmail, isValidPassword } from '../utils/validators';
import Input from '../components/ui/Input';
import Button from '../components/ui/Button';

/**
 * Register page component complying with Design.md 7.3 (v2.0)
 * 2-column layout on lg: with brand panel and password strength meter
 */
export default function Register() {
  const navigate = useNavigate();

  const [formData, setFormData] = useState({
    username: '',
    fullName: '',
    email: '',
    phone: '',
    password: '',
    confirmPassword: '',
  });

  const [errors, setErrors] = useState({});
  const [serverError, setServerError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Compute password strength: 1 (Yếu), 2 (Vừa), 3 (Mạnh)
  const getPasswordStrength = (pwd) => {
    if (!pwd) return { level: 0, label: '' };
    if (pwd.length < 6) return { level: 1, label: 'Yếu' };
    const hasNumbers = /\d/.test(pwd);
    const hasSpecial = /[^A-Za-z0-9]/.test(pwd);
    const hasUpper = /[A-Z]/.test(pwd);

    let score = 1;
    if (pwd.length >= 8) score++;
    if (hasNumbers && (hasSpecial || hasUpper)) score++;

    if (score === 1) return { level: 1, label: 'Yếu' };
    if (score === 2) return { level: 2, label: 'Vừa' };
    return { level: 3, label: 'Mạnh' };
  };

  const passwordStrength = getPasswordStrength(formData.password);
  const isConfirmMatching =
    Boolean(formData.confirmPassword) && formData.confirmPassword === formData.password;

  const validateField = (name, value, currentFormData = formData) => {
    let error = '';
    if (name === 'username') {
      if (!value.trim()) {
        error = 'Vui lòng nhập tên đăng nhập';
      } else if (value.trim().length < 3) {
        error = 'Tên đăng nhập tối thiểu 3 ký tự';
      }
    } else if (name === 'fullName') {
      if (!value.trim()) {
        error = 'Vui lòng nhập họ và tên';
      }
    } else if (name === 'email') {
      if (!value.trim()) {
        error = 'Vui lòng nhập email';
      } else if (!isValidEmail(value)) {
        error = 'Email không hợp lệ';
      }
    } else if (name === 'phone') {
      if (!value.trim()) {
        error = 'Vui lòng nhập số điện thoại';
      } else if (!/^[0-9]{9,11}$/.test(value.trim())) {
        error = 'Số điện thoại không hợp lệ (9-11 chữ số)';
      }
    } else if (name === 'password') {
      if (!value) {
        error = 'Vui lòng nhập mật khẩu';
      } else if (!isValidPassword(value)) {
        error = 'Mật khẩu tối thiểu 6 ký tự';
      }
    } else if (name === 'confirmPassword') {
      if (!value) {
        error = 'Vui lòng xác nhận lại mật khẩu';
      } else if (value !== currentFormData.password) {
        error = 'Mật khẩu xác nhận không khớp';
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

    const unErr = validateField('username', formData.username);
    const fnErr = validateField('fullName', formData.fullName);
    const emErr = validateField('email', formData.email);
    const phErr = validateField('phone', formData.phone);
    const pwErr = validateField('password', formData.password);
    const cpErr = validateField('confirmPassword', formData.confirmPassword);

    if (unErr || fnErr || emErr || phErr || pwErr || cpErr) {
      setErrors({
        username: unErr,
        fullName: fnErr,
        email: emErr,
        phone: phErr,
        password: pwErr,
        confirmPassword: cpErr,
      });
      return;
    }

    setIsSubmitting(true);
    try {
      await authApi.register({
        username: formData.username,
        fullName: formData.fullName,
        email: formData.email,
        password: formData.password,
        phone: formData.phone,
      });

      toast.success('Đăng ký tài khoản thành công! Vui lòng đăng nhập.');
      navigate('/login');
    } catch (err) {
      setServerError(err.message || 'Không thể đăng ký tài khoản. Vui lòng thử lại.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="relative min-h-[calc(100vh-8rem)] flex items-center justify-center px-4 py-8 md:py-16 bg-gradient-to-br from-primary-50 via-white to-secondary-50 overflow-hidden">
      {/* 2 Decorative Soft Blobs */}
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
          <span
            className="absolute top-6 right-6 text-5xl opacity-40 animate-[float_5s_ease-in-out_infinite] select-none pointer-events-none"
            aria-hidden="true"
          >
            🎁
          </span>
          <span
            className="absolute bottom-8 right-8 text-4xl opacity-30 animate-[float-slow_8s_ease-in-out_infinite] select-none pointer-events-none"
            aria-hidden="true"
          >
            ⭐
          </span>

          <div>
            <div className="inline-flex items-center gap-2 text-2xl font-bold tracking-tight mb-8">
              <span>🎈</span>
              <span>FunnyShop</span>
            </div>

            <h2 className="text-3xl font-extrabold tracking-tight leading-snug mb-4">
              Gia nhập đại gia đình FunnyShop!
            </h2>
            <p className="text-sm text-white/90 leading-relaxed mb-8">
              Tạo tài khoản nhanh chóng chỉ trong 30 giây để tận hưởng thế giới quà tặng độc lạ và nhận ngay những quyền lợi thành viên:
            </p>

            <div className="space-y-4">
              <div className="flex items-center gap-3">
                <div className="size-9 rounded-xl bg-white/20 flex items-center justify-center shrink-0">
                  <Gift className="size-4.5 text-white" />
                </div>
                <span className="text-sm font-medium">Nhận thông báo ưu đãi và bộ sưu tập mới sớm nhất</span>
              </div>

              <div className="flex items-center gap-3">
                <div className="size-9 rounded-xl bg-white/20 flex items-center justify-center shrink-0">
                  <Zap className="size-4.5 text-white" />
                </div>
                <span className="text-sm font-medium">Đặt hàng nhanh chóng chỉ với một chạm</span>
              </div>

              <div className="flex items-center gap-3">
                <div className="size-9 rounded-xl bg-white/20 flex items-center justify-center shrink-0">
                  <ShieldCheck className="size-4.5 text-white" />
                </div>
                <span className="text-sm font-medium">Bảo mật thông tin thanh toán tuyệt đối</span>
              </div>
            </div>
          </div>

          <div className="pt-8 border-t border-white/20 text-xs text-white/80">
            Trải nghiệm mua sắm tiện lợi và an tâm.
          </div>
        </div>

        {/* Right: Registration Form Card */}
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
            <h1 className="text-2xl font-bold text-ink">Tạo tài khoản mới</h1>
            <p className="text-sm text-ink-muted mt-1">
              Điền thông tin bên dưới để đăng ký tài khoản FunnyShop
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
              id="register-username"
              name="username"
              type="text"
              value={formData.username}
              onChange={handleChange}
              onBlur={handleBlur}
              placeholder="Ví dụ: nguyen_van_an"
              error={errors.username}
              leftIcon={User}
              required
              disabled={isSubmitting}
            />

            <Input
              label="Họ và tên"
              id="register-fullname"
              name="fullName"
              type="text"
              value={formData.fullName}
              onChange={handleChange}
              onBlur={handleBlur}
              placeholder="Ví dụ: Nguyễn Văn An"
              error={errors.fullName}
              leftIcon={User}
              required
              disabled={isSubmitting}
            />

            <Input
              label="Địa chỉ Email"
              id="register-email"
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
              label="Số điện thoại"
              id="register-phone"
              name="phone"
              type="tel"
              value={formData.phone}
              onChange={handleChange}
              onBlur={handleBlur}
              placeholder="Ví dụ: 0987654321"
              error={errors.phone}
              leftIcon={Phone}
              required
              disabled={isSubmitting}
            />

            <div>
              <Input
                label="Mật khẩu"
                id="register-password"
                name="password"
                type="password"
                value={formData.password}
                onChange={handleChange}
                onBlur={handleBlur}
                placeholder="Tối thiểu 6 ký tự"
                error={errors.password}
                leftIcon={Lock}
                required
                disabled={isSubmitting}
              />

              {/* Password strength meter (Design.md 7.3) */}
              {formData.password && (
                <div className="mt-2 space-y-1">
                  <div className="flex items-center justify-between text-xs font-medium">
                    <span className="text-ink-subtle">Độ mạnh mật khẩu:</span>
                    <span
                      className={
                        passwordStrength.level === 1
                          ? 'text-red-600 font-semibold'
                          : passwordStrength.level === 2
                          ? 'text-amber-600 font-semibold'
                          : 'text-green-600 font-semibold'
                      }
                    >
                      {passwordStrength.label}
                    </span>
                  </div>
                  <div className="grid grid-cols-3 gap-1.5">
                    <div
                      className={`h-1.5 rounded-full transition-all ${
                        passwordStrength.level >= 1 ? 'bg-red-500' : 'bg-gray-200'
                      }`}
                    />
                    <div
                      className={`h-1.5 rounded-full transition-all ${
                        passwordStrength.level >= 2 ? 'bg-amber-500' : 'bg-gray-200'
                      }`}
                    />
                    <div
                      className={`h-1.5 rounded-full transition-all ${
                        passwordStrength.level >= 3 ? 'bg-green-600' : 'bg-gray-200'
                      }`}
                    />
                  </div>
                </div>
              )}
            </div>

            <div className="relative">
              <Input
                label="Xác nhận mật khẩu"
                id="register-confirmpassword"
                name="confirmPassword"
                type="password"
                value={formData.confirmPassword}
                onChange={handleChange}
                onBlur={handleBlur}
                placeholder="Nhập lại mật khẩu vừa tạo"
                error={errors.confirmPassword}
                leftIcon={Lock}
                required
                disabled={isSubmitting}
              />
              {isConfirmMatching && (
                <div className="absolute right-10 top-9 text-green-600 pointer-events-none">
                  <CheckCircle2 className="size-5" />
                </div>
              )}
            </div>

            <div className="pt-2">
              <Button
                type="submit"
                variant="primary"
                size="lg"
                fullWidth
                loading={isSubmitting}
                className="font-bold text-base shadow-brand"
              >
                Tạo tài khoản
              </Button>
            </div>
          </form>

          {/* Footer Link to Login */}
          <div className="mt-6 text-center text-sm text-ink-muted">
            Đã có tài khoản?{' '}
            <Link
              to="/login"
              className="font-bold text-primary-700 hover:text-primary-800 hover:underline transition-colors ml-1"
            >
              Đăng nhập ngay
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
