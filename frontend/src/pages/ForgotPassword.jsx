import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  CheckCircle2,
  ArrowLeft,
  ArrowRight,
  RefreshCw,
  AlertCircle,
} from 'lucide-react';
import { authApi } from '../api/auth';
import { toast } from '../store/toastStore';
import { isValidEmail, isValidPassword } from '../utils/validators';
import BrandLogo from '../components/ui/BrandLogo';

const RESET_STEPS = ['Xác nhận tài khoản', 'Mã OTP & Mật khẩu', 'Hoàn tất'];

/**
 * ForgotPassword page - Japanese Minimalist v3.0 (Ma 間 & Kanso 簡素)
 * Thiết kế tinh tế, thanh lịch, đồng bộ phong cách với trang chủ FunnyShop.
 */
export default function ForgotPassword() {
  const navigate = useNavigate();

  // Current wizard step: 0, 1, 2
  const [currentStep, setCurrentStep] = useState(0);

  // Form states
  const [identifier, setIdentifier] = useState('');
  const [userEmail, setUserEmail] = useState('');
  const [otp, setOtp] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  // UI state
  const [errors, setErrors] = useState({});
  const [serverError, setServerError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [resendCountdown, setResendCountdown] = useState(60);
  const [canResend, setCanResend] = useState(false);

  // Timer countdown for OTP resend
  useEffect(() => {
    let timer;
    if (currentStep === 1 && resendCountdown > 0) {
      timer = setInterval(() => {
        setResendCountdown((prev) => {
          if (prev <= 1) {
            setCanResend(true);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }
    return () => clearInterval(timer);
  }, [currentStep, resendCountdown]);

  // Password strength calculation
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

  const passwordStrength = getPasswordStrength(newPassword);
  const isConfirmMatching = Boolean(confirmPassword) && confirmPassword === newPassword;

  // --- Step 1: Request reset OTP ---
  const handleRequestOtp = async (e) => {
    e?.preventDefault();
    setServerError('');
    setErrors({});

    const trimmed = identifier.trim();

    if (!trimmed) {
      setErrors({ identifier: 'Vui lòng nhập email' });
      return;
    }

    if (!isValidEmail(trimmed)) {
      setErrors({ identifier: 'Địa chỉ email không hợp lệ' });
      return;
    }

    setIsSubmitting(true);

    try {
      const res = await authApi.forgotPassword({
        email: trimmed,
      });

      setUserEmail(trimmed);
      setResendCountdown(60);
      setCanResend(false);
      setCurrentStep(1);

      toast.success(res?.message || 'Mã xác thực OTP đã được gửi!');
    } catch (err) {
      setServerError(
          err.message || 'Không thể gửi OTP. Vui lòng kiểm tra lại email.'
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  // Resend OTP
  const handleResendOtp = async () => {
    if (!canResend || isSubmitting) return;
    setIsSubmitting(true);
    setServerError('');
    try {
      // const res = await authApi.forgotPassword({ emailOrUsername: identifier.trim() });
      await authApi.forgotPassword({
        email: userEmail,
      });
      setResendCountdown(60);
      setCanResend(false);
      toast.success('Đã gửi lại mã OTP mới!');
    } catch (err) {
      setServerError(err.message || 'Không thể gửi lại mã OTP. Vui lòng thử lại.');
    } finally {
      setIsSubmitting(false);
    }
  };

  // --- Step 2: Verify OTP and Reset Password ---
  const handleResetPassword = async (e) => {
    e.preventDefault();
    setServerError('');

    const newErrors = {};

    if (!otp.trim()) {
      newErrors.otp = 'Vui lòng nhập mã OTP';
    } else if (!/^\d{6}$/.test(otp.trim())) {
      newErrors.otp = 'Mã OTP phải gồm 6 chữ số';
    }

    if (!newPassword) {
      newErrors.newPassword = 'Vui lòng nhập mật khẩu mới';
    } else if (!isValidPassword(newPassword)) {
      newErrors.newPassword = 'Mật khẩu tối thiểu 6 ký tự';
    }

    if (!confirmPassword) {
      newErrors.confirmPassword = 'Vui lòng xác nhận mật khẩu';
    } else if (confirmPassword !== newPassword) {
      newErrors.confirmPassword = 'Mật khẩu xác nhận không khớp';
    }

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    setIsSubmitting(true);

    try {
      // Bước 1: Xác thực OTP
      const verifyRes = await authApi.verifyResetOtp({
        email: userEmail,
        otp: otp.trim(),
      });

      const resetToken = verifyRes?.resetToken;

      if (!resetToken) {
        throw new Error('Không nhận được resetToken từ Backend.');
      }

      // Bước 2: Đặt lại mật khẩu
      await authApi.resetPassword({
        resetToken,
        newPassword,
        confirmPassword,
      });

      setCurrentStep(2);
      toast.success('Mật khẩu đã được cập nhật thành công!');
    } catch (err) {
      setServerError(
          err.message || 'Đặt lại mật khẩu thất bại. Vui lòng thử lại.'
      );
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
              <span>Bảo mật tài khoản</span>
            </div>

            <h2 className="font-serif text-2xl xl:text-3xl font-light text-zinc-100 leading-snug tracking-wide mb-4">
              Khôi phục quyền truy cập nhanh chóng &amp; an toàn.
            </h2>

            <p className="text-xs font-light text-zinc-400 leading-relaxed mb-10">
              Chỉ với vài thao tác xác thực qua mã OTP bảo mật gửi đến email của bạn, mật khẩu mới sẽ được thiết lập ngay lập tức.
            </p>

            <div className="space-y-4 border-t border-zinc-800/80 pt-6">
              <div className="flex items-center gap-3 text-xs font-light text-zinc-300">
                <span className="text-[10px] font-mono text-zinc-500">01</span>
                <span>Xác thực danh tính bằng mã OTP 6 số</span>
              </div>
              <div className="flex items-center gap-3 text-xs font-light text-zinc-300">
                <span className="text-[10px] font-mono text-zinc-500">02</span>
                <span>Thiết lập mật khẩu mới có mã hóa an toàn</span>
              </div>
              <div className="flex items-center gap-3 text-xs font-light text-zinc-300">
                <span className="text-[10px] font-mono text-zinc-500">03</span>
                <span>Đăng nhập tức thì tiếp tục trải nghiệm mua sắm</span>
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
          <div className="mb-6">
            <div className="lg:hidden mb-6">
              <Link to="/">
                <BrandLogo size="md" />
              </Link>
            </div>

            <div className="inline-flex items-center gap-2 text-[10px] uppercase tracking-[0.2em] text-mute mb-1.5">
              <span className="size-1.5 bg-vermilion inline-block" />
              <span>Khôi phục tài khoản</span>
            </div>
            <h1 className="font-serif text-2xl sm:text-3xl font-light text-ink tracking-wide">
              Quên mật khẩu
            </h1>
            <p className="text-xs font-light text-mute mt-1.5">
              {currentStep === 0 && 'Nhập thông tin tài khoản để nhận mã khôi phục qua email.'}
              {currentStep === 1 && 'Nhập mã xác thực OTP và thiết lập mật khẩu mới.'}
              {currentStep === 2 && 'Mật khẩu đã được thiết lập thành công.'}
            </p>
          </div>

          {/* Minimalist Step Tracker */}
          <div className="grid grid-cols-3 gap-2 mb-8 border-b border-line pb-4">
            {RESET_STEPS.map((stepLabel, idx) => {
              const isPassed = idx < currentStep;
              const isCurrent = idx === currentStep;
              return (
                <div key={idx} className="flex flex-col gap-1.5">
                  <div
                    className={`h-0.5 transition-colors ${
                      isPassed || isCurrent ? 'bg-ink' : 'bg-line'
                    }`}
                  />
                  <div className="flex items-center gap-1.5">
                    <span
                      className={`text-[10px] font-mono ${
                        isCurrent ? 'text-vermilion font-medium' : isPassed ? 'text-ink' : 'text-mute'
                      }`}
                    >
                      0{idx + 1}
                    </span>
                    <span
                      className={`text-[11px] truncate font-light ${
                        isCurrent ? 'text-ink font-normal' : isPassed ? 'text-ink' : 'text-mute'
                      }`}
                    >
                      {stepLabel}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>

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

          {/* --- STEP 0: Request OTP --- */}
          {currentStep === 0 && (
            <form onSubmit={handleRequestOtp} className="space-y-5" noValidate>
              <div>
                <label
                  htmlFor="reset-identifier"
                  className="block text-[11px] uppercase tracking-widest text-mute font-light mb-1.5"
                >
                  Email hoặc Tên đăng nhập <span className="text-vermilion">*</span>
                </label>
                <input
                  id="reset-identifier"
                  name="identifier"
                  type="text"
                  value={identifier}
                  onChange={(e) => {
                    setIdentifier(e.target.value);
                    setServerError('');
                    if (errors.identifier) setErrors((prev) => ({ ...prev, identifier: '' }));
                  }}
                  placeholder="Ví dụ: user1@gmail.com hoặc username"
                  disabled={isSubmitting}
                  className={`w-full h-11 px-3 bg-white border text-xs sm:text-sm text-ink placeholder:text-mute/60 font-light transition-colors focus:outline-none ${
                    errors.identifier
                      ? 'border-vermilion focus:border-vermilion'
                      : 'border-line focus:border-ink'
                  }`}
                />
                {errors.identifier ? (
                  <p className="text-xs text-vermilion font-light mt-1 flex items-center gap-1">
                    <AlertCircle className="size-3" />
                    <span>{errors.identifier}</span>
                  </p>
                ) : (
                  <p className="text-[11px] text-mute font-light mt-1">
                    Mã xác thực bảo mật 6 số sẽ được gửi về hộp thư điện tử của bạn.
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
                    <span>Đang gửi mã...</span>
                  ) : (
                    <>
                      <span>Gửi mã xác thực OTP</span>
                      <ArrowRight className="size-3.5" />
                    </>
                  )}
                </button>
              </div>

              {/* Back to Login link */}
              <div className="mt-8 pt-6 border-t border-line text-center text-xs font-light text-mute">
                <Link
                  to="/login"
                  className="inline-flex items-center gap-1.5 text-ink hover:text-vermilion underline underline-offset-4 transition-colors font-normal"
                >
                  <ArrowLeft className="size-3.5" />
                  <span>Quay lại trang đăng nhập</span>
                </Link>
              </div>
            </form>
          )}

          {/* --- STEP 1: Enter OTP & New Password --- */}
          {currentStep === 1 && (
            <form onSubmit={handleResetPassword} className="space-y-5" noValidate>
              {/* Target email info notice */}
              <div className="p-3 bg-sand/60 border border-line text-xs font-light text-ink flex items-center justify-between">
                <span>
                  Mã gửi đến: <strong className="font-normal text-ink">{userEmail}</strong>
                </span>
                <button
                  type="button"
                  onClick={() => {
                    setCurrentStep(0);
                    setServerError('');
                    setErrors({});
                  }}
                  className="text-[11px] text-mute hover:text-ink underline underline-offset-4 cursor-pointer"
                >
                  Đổi email
                </button>
              </div>

              {/* OTP Input */}
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label
                    htmlFor="reset-otp"
                    className="block text-[11px] uppercase tracking-widest text-mute font-light"
                  >
                    Mã xác thực OTP <span className="text-vermilion">*</span>
                  </label>
                  <button
                    type="button"
                    onClick={handleResendOtp}
                    disabled={!canResend || isSubmitting}
                    className={`text-[11px] font-light inline-flex items-center gap-1 transition-colors ${
                      canResend
                        ? 'text-ink underline underline-offset-4 cursor-pointer hover:text-vermilion'
                        : 'text-mute/60 cursor-not-allowed'
                    }`}
                  >
                    <RefreshCw className={`size-3 ${isSubmitting ? 'animate-spin' : ''}`} />
                    {canResend ? 'Gửi lại mã OTP' : `Gửi lại sau ${resendCountdown}s`}
                  </button>
                </div>

                <input
                  id="reset-otp"
                  name="otp"
                  type="text"
                  maxLength={6}
                  value={otp}
                  onChange={(e) => {
                    const val = e.target.value.replace(/\D/g, '');
                    setOtp(val);
                    if (errors.otp) setErrors((prev) => ({ ...prev, otp: '' }));
                  }}
                  placeholder="Nhập 6 số xác thực"
                  disabled={isSubmitting}
                  className={`w-full h-11 px-3 bg-paper border text-center font-mono tracking-[0.3em] text-sm text-ink placeholder:text-mute/60 font-light transition-colors focus:outline-none ${
                    errors.otp
                      ? 'border-vermilion focus:border-vermilion'
                      : 'border-line focus:border-ink'
                  }`}
                />
                {errors.otp && (
                  <p className="text-xs text-vermilion font-light mt-1 flex items-center gap-1">
                    <AlertCircle className="size-3" />
                    <span>{errors.otp}</span>
                  </p>
                )}
              </div>

              {/* New Password Input */}
              <div>
                <label
                  htmlFor="reset-new-password"
                  className="block text-[11px] uppercase tracking-widest text-mute font-light mb-1.5"
                >
                  Mật khẩu mới <span className="text-vermilion">*</span>
                </label>
                <input
                  id="reset-new-password"
                  name="newPassword"
                  type="password"
                  value={newPassword}
                  onChange={(e) => {
                    setNewPassword(e.target.value);
                    if (errors.newPassword) setErrors((prev) => ({ ...prev, newPassword: '' }));
                  }}
                  placeholder="Tối thiểu 6 ký tự"
                  disabled={isSubmitting}
                  className={`w-full h-11 px-3 bg-white border text-xs sm:text-sm text-ink placeholder:text-mute/60 font-light transition-colors focus:outline-none ${
                    errors.newPassword
                      ? 'border-vermilion focus:border-vermilion'
                      : 'border-line focus:border-ink'
                  }`}
                />
                {errors.newPassword && (
                  <p className="text-xs text-vermilion font-light mt-1 flex items-center gap-1">
                    <AlertCircle className="size-3" />
                    <span>{errors.newPassword}</span>
                  </p>
                )}

                {/* Minimalist 3-bar password strength meter */}
                {newPassword && (
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

              {/* Confirm New Password Input */}
              <div className="relative">
                <label
                  htmlFor="reset-confirm-password"
                  className="block text-[11px] uppercase tracking-widest text-mute font-light mb-1.5"
                >
                  Xác nhận mật khẩu mới <span className="text-vermilion">*</span>
                </label>
                <input
                  id="reset-confirm-password"
                  name="confirmPassword"
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => {
                    setConfirmPassword(e.target.value);
                    if (errors.confirmPassword) setErrors((prev) => ({ ...prev, confirmPassword: '' }));
                  }}
                  placeholder="Nhập lại mật khẩu mới"
                  disabled={isSubmitting}
                  className={`w-full h-11 px-3 bg-white border text-xs sm:text-sm text-ink placeholder:text-mute/60 font-light transition-colors focus:outline-none ${
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

              {/* Action Buttons */}
              <div className="pt-2 space-y-2">
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="w-full h-11 bg-ink text-paper text-xs uppercase tracking-[0.2em] font-light hover:bg-ink/85 border border-ink transition-colors cursor-pointer disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  {isSubmitting ? (
                    <span>Đang cập nhật...</span>
                  ) : (
                    <>
                      <span>Cập nhật mật khẩu mới</span>
                      <CheckCircle2 className="size-3.5" />
                    </>
                  )}
                </button>

                <button
                  type="button"
                  onClick={() => setCurrentStep(0)}
                  disabled={isSubmitting}
                  className="w-full h-10 text-xs font-light text-mute hover:text-ink underline underline-offset-4 transition-colors cursor-pointer flex items-center justify-center gap-1.5"
                >
                  <ArrowLeft className="size-3.5" />
                  <span>Quay lại bước trước</span>
                </button>
              </div>
            </form>
          )}

          {/* --- STEP 2: Success State --- */}
          {currentStep === 2 && (
            <div className="text-center py-6 space-y-6">
              <div className="size-12 mx-auto border border-emerald-600 text-emerald-600 flex items-center justify-center">
                <CheckCircle2 className="size-6" />
              </div>

              <div className="space-y-2">
                <h2 className="font-serif text-2xl font-light text-ink tracking-wide">
                  Đổi mật khẩu thành công
                </h2>
                <p className="text-xs font-light text-mute leading-relaxed max-w-sm mx-auto">
                  Mật khẩu tài khoản <strong className="text-ink font-normal">{userEmail || identifier}</strong> đã
                  được cập nhật thành công. Bạn có thể đăng nhập ngay với mật khẩu mới.
                </p>
              </div>

              <div className="space-y-3 pt-3 max-w-xs mx-auto">
                <button
                  type="button"
                  onClick={() => navigate('/login')}
                  className="w-full h-11 bg-ink text-paper text-xs uppercase tracking-[0.2em] font-light hover:bg-ink/85 border border-ink transition-colors cursor-pointer flex items-center justify-center gap-2"
                >
                  <span>Đăng nhập ngay</span>
                  <ArrowRight className="size-3.5" />
                </button>

                <button
                  type="button"
                  onClick={() => navigate('/')}
                  className="w-full h-10 border border-line text-xs font-light text-mute hover:text-ink hover:border-ink transition-colors cursor-pointer uppercase tracking-widest"
                >
                  <span>Về trang chủ</span>
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
