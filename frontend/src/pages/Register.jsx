import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { User, Mail, Lock, AlertCircle, CheckCircle2 } from 'lucide-react';
import { authApi } from '../api/auth';
import { toast } from '../store/toastStore';
import { isValidEmail, isValidPassword } from '../utils/validators';
import Input from '../components/ui/Input';
import Button from '../components/ui/Button';

/**
 * Register page component complying with Design.md 7.3
 */
export default function Register() {
  const navigate = useNavigate();

  const [formData, setFormData] = useState({
    fullName: '',
    email: '',
    password: '',
    confirmPassword: '',
  });

  const [errors, setErrors] = useState({});
  const [serverError, setServerError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const validateField = (name, value, currentFormData = formData) => {
    let error = '';
    if (name === 'fullName') {
      if (!value.trim()) {
        error = 'Vui lòng nhập họ và tên';
      }
    } else if (name === 'email') {
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

    const fnErr = validateField('fullName', formData.fullName);
    const emErr = validateField('email', formData.email);
    const pwErr = validateField('password', formData.password);
    const cpErr = validateField('confirmPassword', formData.confirmPassword);

    if (fnErr || emErr || pwErr || cpErr) {
      setErrors({
        fullName: fnErr,
        email: emErr,
        password: pwErr,
        confirmPassword: cpErr,
      });
      return;
    }

    setIsSubmitting(true);
    try {
      await authApi.register({
        fullName: formData.fullName,
        email: formData.email,
        password: formData.password,
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
          <h1 className="text-2xl font-bold text-ink">Tạo tài khoản mới</h1>
          <p className="text-sm text-ink-muted mt-1">
            Gia nhập cộng đồng FunnyShop để nhận ưu đãi bất ngờ!
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

        {/* Registration Form */}
        <form onSubmit={handleSubmit} className="space-y-4" noValidate>
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

          <div className="pt-2">
            <Button
              type="submit"
              variant="primary"
              size="lg"
              fullWidth
              loading={isSubmitting}
              className="font-bold text-base"
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
  );
}
