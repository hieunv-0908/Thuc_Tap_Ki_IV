import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  AlertCircle,
  CheckCircle2,
  ArrowRight,
  ShieldCheck,
  RefreshCw,
} from 'lucide-react';
import { authApi } from '../api/auth';
import { toast } from '../store/toastStore';
import { isValidEmail, isValidPassword } from '../utils/validators';
import BrandLogo from '../components/ui/BrandLogo';

/**
 * Register page - Japanese Minimalist v3.0 (Ma 間 & Kanso 簡素)
 * Tích hợp ô Xác thực Email bằng mã OTP trực tiếp ngay trong Form đăng ký.
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

  // State xác thực OTP email
  const [otp, setOtp] = useState('');
  const [isOtpSent, setIsOtpSent] = useState(false);
  const [isEmailVerified, setIsEmailVerified] = useState(false);
  const [isSendingOtp, setIsSendingOtp] = useState(false);
  const [isVerifyingOtp, setIsVerifyingOtp] = useState(false);
  const [isCheckingEmail, setIsCheckingEmail] = useState(false);
  const [resendCooldown, setResendCooldown] = useState(0);

  const [errors, setErrors] = useState({});
  const [serverError, setServerError] = useState('');
  const [serverSuccess, setServerSuccess] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Đếm lùi thời gian cho nút Gửi lại OTP (60s)
  useEffect(() => {
    let timer;
    if (resendCooldown > 0) {
      timer = setInterval(() => {
        setResendCooldown((prev) => (prev > 0 ? prev - 1 : 0));
      }, 1000);
    }
    return () => clearInterval(timer);
  }, [resendCooldown]);

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
    setServerSuccess('');
    if (errors[name]) {
      setErrors((prev) => ({ ...prev, [name]: '' }));
    }

    // Nếu đổi email thì reset trạng thái xác thực
    if (name === 'email' && isEmailVerified) {
      setIsEmailVerified(false);
      setIsOtpSent(false);
      setOtp('');
    }
  };

  const handleBlur = async (e) => {
    const { name, value } = e.target;
    const error = validateField(name, value);
    if (error) {
      setErrors((prev) => ({ ...prev, [name]: error }));
      return;
    }

    // Nếu rời ô email hợp lệ -> Kiểm tra ngay email đã tồn tại chưa
    if (name === 'email' && value.trim()) {
      try {
        setIsCheckingEmail(true);
        const exists = await authApi.checkEmailExists(value.trim());
        if (exists) {
          setErrors((prev) => ({
            ...prev,
            email: 'Email này đã được sử dụng bởi tài khoản khác! Vui lòng chọn email khác.',
          }));
        }
      } catch {
        // Lỗi mạng hoặc server không block người dùng ở bước blur
      } finally {
        setIsCheckingEmail(false);
      }
    }
  };

  // 1. Kiểm tra email và gửi mã OTP xác nhận về Email
  const handleSendOtp = async () => {
    const emailErr = validateField('email', formData.email);
    if (emailErr) {
      setErrors((prev) => ({ ...prev, email: emailErr }));
      return;
    }

    if (resendCooldown > 0 || isSendingOtp || isCheckingEmail) return;

    setIsSendingOtp(true);
    setServerError('');
    setServerSuccess('');

    const targetEmail = formData.email.trim();

    try {
      // BƯỚC 1: Kiểm tra email đã tồn tại hay chưa trước khi gửi OTP
      const exists = await authApi.checkEmailExists(targetEmail);
      if (exists) {
        setErrors((prev) => ({
          ...prev,
          email: 'Email này đã được đăng ký tài khoản! Vui lòng chọn email khác hoặc Đăng nhập.',
        }));
        setServerError('Email này đã được sử dụng bởi tài khoản khác! Vui lòng dùng email khác.');
        setIsSendingOtp(false);
        return;
      }

      // BƯỚC 2: Email chưa tồn tại -> Gửi mã OTP
      await authApi.sendRegisterOtp({
        email: targetEmail,
        fullName: formData.fullName.trim(),
      });

      setIsOtpSent(true);
      setResendCooldown(60);
      setServerSuccess(`Mã OTP đã được gửi đến email ${targetEmail}. Vui lòng kiểm tra hộp thư!`);
      toast.success('Mã OTP xác thực đã được gửi về email của bạn!');
    } catch (err) {
      const errMsg = err?.message || 'Không thể gửi mã OTP. Vui lòng thử lại sau.';
      if (err?.status === 409 || errMsg.toLowerCase().includes('email')) {
        setErrors((prev) => ({
          ...prev,
          email: errMsg,
        }));
      }
      setServerError(errMsg);
    } finally {
      setIsSendingOtp(false);
    }
  };

  // 2. Xác thực mã OTP
  const handleVerifyOtp = async () => {
    const cleanOtp = otp.trim();
    if (!cleanOtp) {
      setServerError('Vui lòng nhập mã OTP 6 chữ số.');
      return;
    }
    if (cleanOtp.length !== 6 || !/^\d+$/.test(cleanOtp)) {
      setServerError('Mã OTP phải bao gồm đúng 6 chữ số.');
      return;
    }

    setIsVerifyingOtp(true);
    setServerError('');
    setServerSuccess('');

    try {
      await authApi.verifyRegisterOtp({
        email: formData.email.trim(),
        otp: cleanOtp,
      });

      setIsEmailVerified(true);
      setServerSuccess('Xác thực email thành công! Bạn có thể nhấn Tạo tài khoản.');
      toast.success('Xác thực email thành công!');
    } catch (err) {
      setServerError(err.message || 'Mã OTP không chính xác hoặc đã hết hạn.');
    } finally {
      setIsVerifyingOtp(false);
    }
  };

  // 3. Hoàn tất tạo tài khoản
  const handleSubmit = async (e) => {
    e.preventDefault();
    setServerError('');
    setServerSuccess('');

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

    // Bắt buộc phải xác thực email trước khi đăng ký
    if (!isEmailVerified) {
      // Nếu chưa gửi OTP -> Tự động kích hoạt gửi OTP và mở ô nhập
      if (!isOtpSent) {
        handleSendOtp();
        setServerError('Vui lòng nhập mã OTP vừa gửi đến email để xác nhận trước khi đăng ký!');
      } else {
        setServerError('Vui lòng nhập mã OTP và bấm nút "Xác nhận OTP" để xác thực email!');
      }
      return;
    }

    setIsSubmitting(true);
    try {
      await authApi.register({
        username: formData.username.trim(),
        fullName: formData.fullName.trim(),
        email: formData.email.trim(),
        password: formData.password,
        phone: formData.phone.trim(),
      });

      toast.success('Đăng ký tài khoản thành công! Vui lòng đăng nhập.');
      navigate('/login', {
        state: {
          registeredUsername: formData.username.trim(),
          successNotice: 'Đăng ký thành công! Hãy nhập mật khẩu để đăng nhập.',
        },
      });
    } catch (err) {
      setServerError(err.message || 'Không thể đăng ký tài khoản. Vui lòng thử lại.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-[calc(100vh-72px)] bg-[#EDEDF0] flex items-center justify-center px-4 py-10 sm:py-16">
      <div className="w-full max-w-4xl border border-line bg-white grid grid-cols-1 lg:grid-cols-12 overflow-hidden shadow-xs">
        {/* Left: Editorial Lookbook Panel (Only lg:) */}
        <div className="hidden lg:flex lg:col-span-5 bg-[#121214] text-paper p-10 flex-col justify-between relative overflow-hidden">
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
              <span>Gia nhập FunnyShop</span>
            </div>

            <h2 className="font-serif text-2xl xl:text-3xl font-light text-zinc-100 leading-snug tracking-wide mb-4">
              Khởi đầu phong cách tối giản cùng chúng tôi.
            </h2>

            <p className="text-xs font-light text-zinc-400 leading-relaxed mb-10">
              Đăng ký tài khoản thành viên chỉ trong 30 giây để tận hưởng đặc quyền đặt hàng nhanh, lưu địa chỉ và theo dõi hành trình đơn hàng.
            </p>

            <div className="space-y-4 border-t border-zinc-800/80 pt-6">
              <div className="flex items-center gap-3 text-xs font-light text-zinc-300">
                <span className="text-[10px] font-mono text-zinc-500">01</span>
                <span>Xác thực email an toàn qua mã OTP 6 chữ số</span>
              </div>
              <div className="flex items-center gap-3 text-xs font-light text-zinc-300">
                <span className="text-[10px] font-mono text-zinc-500">02</span>
                <span>Đặt hàng 1 chạm trực tiếp qua Stylist AI</span>
              </div>
              <div className="flex items-center gap-3 text-xs font-light text-zinc-300">
                <span className="text-[10px] font-mono text-zinc-500">03</span>
                <span>Bảo mật dữ liệu cá nhân theo tiêu chuẩn cao cấp</span>
              </div>
            </div>
          </div>

          <div className="relative z-10 pt-8 border-t border-zinc-800/80 text-[10px] uppercase tracking-widest text-zinc-500 font-light">
            FunnyShop • Triết lý Kanso 簡素
          </div>
        </div>

        {/* Right: Registration Form Card */}
        <div className="lg:col-span-7 p-6 sm:p-10 md:p-12 flex flex-col justify-center bg-white">
          {/* Header */}
          <div className="mb-6">
            <div className="lg:hidden mb-6">
              <Link to="/">
                <BrandLogo size="md" />
              </Link>
            </div>

            <div className="inline-flex items-center gap-2 text-[10px] uppercase tracking-[0.2em] text-mute mb-1.5">
              <span className="size-1.5 bg-vermilion inline-block" />
              <span>Đăng ký thành viên</span>
            </div>
            <h1 className="font-serif text-2xl sm:text-3xl font-light text-ink tracking-wide">
              Tạo tài khoản mới
            </h1>
            <p className="text-xs font-light text-mute mt-1.5">
              Vui lòng điền thông tin và xác nhận mã OTP gửi về Email để đăng ký.
            </p>
          </div>

          {/* Server Error Alert */}
          {serverError && (
            <div
              role="alert"
              className="mb-4 flex items-start gap-2.5 p-3.5 bg-red-50/70 border border-vermilion/30 text-vermilion text-xs font-light"
            >
              <AlertCircle className="size-4 shrink-0 mt-0.5 text-vermilion" aria-hidden="true" />
              <div className="flex-1 leading-relaxed">{serverError}</div>
            </div>
          )}

          {/* Server Success Alert */}
          {serverSuccess && (
            <div
              role="status"
              className="mb-4 flex items-start gap-2.5 p-3.5 bg-emerald-50 border border-emerald-300 text-emerald-800 text-xs font-light"
            >
              <CheckCircle2 className="size-4 shrink-0 mt-0.5 text-emerald-600" aria-hidden="true" />
              <div className="flex-1 leading-relaxed">{serverSuccess}</div>
            </div>
          )}

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-4" noValidate>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label
                  htmlFor="register-username"
                  className="block text-[11px] uppercase tracking-widest text-mute font-light mb-1.5"
                >
                  Tên đăng nhập <span className="text-vermilion">*</span>
                </label>
                <input
                  id="register-username"
                  name="username"
                  type="text"
                  value={formData.username}
                  onChange={handleChange}
                  onBlur={handleBlur}
                  placeholder="user123"
                  disabled={isSubmitting}
                  autoComplete="username"
                  className={`w-full h-11 px-3 bg-paper border text-xs sm:text-sm text-ink placeholder:text-mute/60 font-light transition-colors focus:outline-none ${
                    errors.username
                      ? 'border-vermilion focus:border-vermilion'
                      : 'border-line focus:border-ink'
                  }`}
                />
                {errors.username && (
                  <p className="text-xs text-vermilion font-light mt-1 flex items-center gap-1">
                    <AlertCircle className="size-3" />
                    <span>{errors.username}</span>
                  </p>
                )}
              </div>

              <div>
                <label
                  htmlFor="register-fullname"
                  className="block text-[11px] uppercase tracking-widest text-mute font-light mb-1.5"
                >
                  Họ và tên <span className="text-vermilion">*</span>
                </label>
                <input
                  id="register-fullname"
                  name="fullName"
                  type="text"
                  value={formData.fullName}
                  onChange={handleChange}
                  onBlur={handleBlur}
                  placeholder="Nguyễn Văn A"
                  disabled={isSubmitting}
                  autoComplete="name"
                  className={`w-full h-11 px-3 bg-paper border text-xs sm:text-sm text-ink placeholder:text-mute/60 font-light transition-colors focus:outline-none ${
                    errors.fullName
                      ? 'border-vermilion focus:border-vermilion'
                      : 'border-line focus:border-ink'
                  }`}
                />
                {errors.fullName && (
                  <p className="text-xs text-vermilion font-light mt-1 flex items-center gap-1">
                    <AlertCircle className="size-3" />
                    <span>{errors.fullName}</span>
                  </p>
                )}
              </div>
            </div>

            {/* EMAIL + NÚT GỬI OTP */}
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label
                  htmlFor="register-email"
                  className="block text-[11px] uppercase tracking-widest text-mute font-light"
                >
                  Địa chỉ Email <span className="text-vermilion">*</span>
                </label>
                {isEmailVerified && (
                  <span className="text-[11px] text-emerald-600 font-medium flex items-center gap-1">
                    <CheckCircle2 className="size-3.5" />
                    Đã xác thực OTP
                  </span>
                )}
              </div>

              <div className="flex gap-2">
                <input
                  id="register-email"
                  name="email"
                  type="email"
                  value={formData.email}
                  onChange={handleChange}
                  onBlur={handleBlur}
                  placeholder="example@email.com"
                  disabled={isSubmitting || isEmailVerified}
                  autoComplete="email"
                  className={`flex-1 h-11 px-3 bg-paper border text-xs sm:text-sm text-ink placeholder:text-mute/60 font-light transition-colors focus:outline-none ${
                    errors.email
                      ? 'border-vermilion focus:border-vermilion'
                      : isEmailVerified
                      ? 'border-emerald-500 bg-emerald-50/20'
                      : 'border-line focus:border-ink'
                  }`}
                />

                {!isEmailVerified && (
                  <button
                    type="button"
                    onClick={handleSendOtp}
                    disabled={isSendingOtp || isCheckingEmail || resendCooldown > 0 || !formData.email.trim()}
                    className="h-11 px-4 bg-ink text-paper text-xs uppercase tracking-wider font-light hover:bg-ink/85 border border-ink transition-colors cursor-pointer disabled:opacity-50 shrink-0 flex items-center gap-1.5"
                  >
                    {isSendingOtp || isCheckingEmail ? (
                      <RefreshCw className="size-3.5 animate-spin" />
                    ) : resendCooldown > 0 ? (
                      <span className="font-mono">{resendCooldown}s</span>
                    ) : (
                      <span>{isOtpSent ? 'Gửi lại OTP' : 'Gửi mã OTP'}</span>
                    )}
                  </button>
                )}

                {isEmailVerified && (
                  <button
                    type="button"
                    onClick={() => {
                      setIsEmailVerified(false);
                      setIsOtpSent(false);
                      setOtp('');
                    }}
                    className="h-11 px-3 border border-line text-xs font-light text-mute hover:text-ink hover:border-ink transition-colors cursor-pointer shrink-0"
                    title="Nhấn để đổi địa chỉ email khác"
                  >
                    Đổi email
                  </button>
                )}
              </div>

              {errors.email && (
                <p className="text-xs text-vermilion font-light mt-1 flex items-center gap-1">
                  <AlertCircle className="size-3" />
                  <span>{errors.email}</span>
                </p>
              )}

              {/* KHỐI NHẬP MÃ OTP (Hiển thị ngay dưới ô email khi đã bấm gửi OTP và chưa xác thực) */}
              {isOtpSent && !isEmailVerified && (
                <div className="mt-3 p-3.5 bg-paper border border-vermilion/40 rounded-none space-y-2.5 animate-fadeIn">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-normal text-ink flex items-center gap-1.5">
                      <ShieldCheck className="size-4 text-vermilion" />
                      <span>Nhập mã OTP 6 số đã gửi về: <strong className="font-mono">{formData.email}</strong></span>
                    </span>
                    {resendCooldown === 0 && (
                      <button
                        type="button"
                        onClick={handleSendOtp}
                        className="text-[11px] text-vermilion hover:underline cursor-pointer"
                      >
                        Gửi lại
                      </button>
                    )}
                  </div>

                  <div className="flex gap-2">
                    <input
                      type="text"
                      maxLength={6}
                      value={otp}
                      onChange={(e) => {
                        const val = e.target.value.replace(/\D/g, '');
                        setOtp(val);
                        setServerError('');
                      }}
                      placeholder="Nhập 6 số OTP"
                      autoFocus
                      className="flex-1 h-10 px-3 bg-white border border-line text-center font-mono text-base tracking-[0.3em] font-medium text-ink placeholder:text-mute/40 focus:outline-none focus:border-ink"
                    />
                    <button
                      type="button"
                      onClick={handleVerifyOtp}
                      disabled={otp.length !== 6 || isVerifyingOtp}
                      className="h-10 px-4 bg-vermilion text-white text-xs font-medium uppercase tracking-wider hover:bg-vermilion/90 transition-colors cursor-pointer disabled:opacity-50 shrink-0 flex items-center gap-1"
                    >
                      {isVerifyingOtp ? (
                        <RefreshCw className="size-3.5 animate-spin" />
                      ) : (
                        <span>Xác nhận OTP</span>
                      )}
                    </button>
                  </div>

                  <p className="text-[11px] text-mute font-light leading-relaxed">
                    💡 Hãy kiểm tra cả hộp thư chính và thư mục <strong>Spam / Rác</strong> để lấy mã xác nhận.
                  </p>
                </div>
              )}
            </div>

            <div>
              <label
                htmlFor="register-phone"
                className="block text-[11px] uppercase tracking-widest text-mute font-light mb-1.5"
              >
                Số điện thoại <span className="text-vermilion">*</span>
              </label>
              <input
                id="register-phone"
                name="phone"
                type="tel"
                value={formData.phone}
                onChange={handleChange}
                onBlur={handleBlur}
                placeholder="0912345678"
                disabled={isSubmitting}
                autoComplete="tel"
                className={`w-full h-11 px-3 bg-paper border text-xs sm:text-sm text-ink placeholder:text-mute/60 font-light transition-colors focus:outline-none ${
                  errors.phone
                    ? 'border-vermilion focus:border-vermilion'
                    : 'border-line focus:border-ink'
                }`}
              />
              {errors.phone && (
                <p className="text-xs text-vermilion font-light mt-1 flex items-center gap-1">
                  <AlertCircle className="size-3" />
                  <span>{errors.phone}</span>
                </p>
              )}
            </div>

            <div>
              <label
                htmlFor="register-password"
                className="block text-[11px] uppercase tracking-widest text-mute font-light mb-1.5"
              >
                Mật khẩu <span className="text-vermilion">*</span>
              </label>
              <input
                id="register-password"
                name="password"
                type="password"
                value={formData.password}
                onChange={handleChange}
                onBlur={handleBlur}
                placeholder="Tối thiểu 6 ký tự"
                disabled={isSubmitting}
                autoComplete="new-password"
                className={`w-full h-11 px-3 bg-paper border text-xs sm:text-sm text-ink placeholder:text-mute/60 font-light transition-colors focus:outline-none ${
                  errors.password
                    ? 'border-vermilion focus:border-vermilion'
                    : 'border-line focus:border-ink'
                }`}
              />
              {errors.password && (
                <p className="text-xs text-vermilion font-light mt-1 flex items-center gap-1">
                  <AlertCircle className="size-3" />
                  <span>{errors.password}</span>
                </p>
              )}

              {formData.password && (
                <div className="mt-2 space-y-1">
                  <div className="flex items-center justify-between text-[11px] font-light text-mute">
                    <span>Độ an toàn:</span>
                    <span
                      className={
                        passwordStrength.level === 1
                          ? 'text-vermilion font-normal'
                          : passwordStrength.level === 2
                          ? 'text-amber-600 font-normal'
                          : 'text-emerald-700 font-normal'
                      }
                    >
                      {passwordStrength.label}
                    </span>
                  </div>
                  <div className="grid grid-cols-3 gap-1">
                    <div
                      className={`h-0.5 transition-all ${
                        passwordStrength.level >= 1 ? 'bg-vermilion' : 'bg-line'
                      }`}
                    />
                    <div
                      className={`h-0.5 transition-all ${
                        passwordStrength.level >= 2 ? 'bg-amber-500' : 'bg-line'
                      }`}
                    />
                    <div
                      className={`h-0.5 transition-all ${
                        passwordStrength.level >= 3 ? 'bg-emerald-600' : 'bg-line'
                      }`}
                    />
                  </div>
                </div>
              )}
            </div>

            <div className="relative">
              <label
                htmlFor="register-confirmpassword"
                className="block text-[11px] uppercase tracking-widest text-mute font-light mb-1.5"
              >
                Xác nhận mật khẩu <span className="text-vermilion">*</span>
              </label>
              <input
                id="register-confirmpassword"
                name="confirmPassword"
                type="password"
                value={formData.confirmPassword}
                onChange={handleChange}
                onBlur={handleBlur}
                placeholder="Nhập lại mật khẩu"
                disabled={isSubmitting}
                className={`w-full h-11 px-3 bg-paper border text-xs sm:text-sm text-ink placeholder:text-mute/60 font-light transition-colors focus:outline-none ${
                  errors.confirmPassword
                    ? 'border-vermilion focus:border-vermilion'
                    : 'border-line focus:border-ink'
                }`}
              />
              {isConfirmMatching && (
                <div className="absolute right-3 top-9 text-emerald-600 pointer-events-none">
                  <CheckCircle2 className="size-4" />
                </div>
              )}
              {errors.confirmPassword && (
                <p className="text-xs text-vermilion font-light mt-1 flex items-center gap-1">
                  <AlertCircle className="size-3" />
                  <span>{errors.confirmPassword}</span>
                </p>
              )}
            </div>

            <div className="pt-3">
              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full h-11 bg-ink text-paper text-xs uppercase tracking-[0.2em] font-light hover:bg-ink/85 border border-ink transition-colors cursor-pointer disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {isSubmitting ? (
                  <span>Đang xử lý đăng ký...</span>
                ) : (
                  <>
                    <span>Tạo tài khoản</span>
                    <ArrowRight className="size-3.5" />
                  </>
                )}
              </button>
            </div>
          </form>

          {/* Footer Link to Login */}
          <div className="mt-8 pt-6 border-t border-line text-center text-xs font-light text-mute">
            Đã có tài khoản thành viên?{' '}
            <Link
              to="/login"
              className="text-ink hover:text-vermilion underline underline-offset-4 transition-colors ml-1 font-normal"
            >
              Đăng nhập ngay
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
