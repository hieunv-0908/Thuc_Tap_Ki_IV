import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  Mail,
  Lock,
  KeyRound,
  ShieldCheck,
  CheckCircle2,
  ArrowLeft,
  ArrowRight,
  Sparkles,
  Zap,
  RefreshCw,
  AlertCircle,
  Check,
} from 'lucide-react';
import { authApi } from '../api/auth';
import { toast } from '../store/toastStore';
import { isValidEmail, isValidPassword } from '../utils/validators';
import Input from '../components/ui/Input';
import Button from '../components/ui/Button';
import StepIndicator from '../components/ui/StepIndicator';

const RESET_STEPS = ['Xác nhận tài khoản', 'Mã OTP & Mật khẩu', 'Hoàn tất'];
const isMock = import.meta.env.VITE_USE_MOCK === 'true';

/**
 * ForgotPassword page complying with FunnyShop Design System
 * 3-step wizard with mock data support
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
  const [mockOtpHint, setMockOtpHint] = useState('');
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
      setErrors({ identifier: 'Vui lòng nhập email hoặc tên đăng nhập' });
      return;
    }
    if (trimmed.includes('@') && !isValidEmail(trimmed)) {
      setErrors({ identifier: 'Địa chỉ email không đúng định dạng' });
      return;
    }

    setIsSubmitting(true);
    try {
      const res = await authApi.forgotPassword({ emailOrUsername: trimmed });
      setUserEmail(res.email || trimmed);
      // Chỉ hiển thị OTP gợi ý khi ở chế độ Mock
      setMockOtpHint(isMock ? (res.mockOtp || '123456') : '');
      setResendCountdown(60);
      setCanResend(false);
      setCurrentStep(1);
      toast.success(res.message || 'Mã xác thực OTP đã được gửi!');
    } catch (err) {
      setServerError(err.message || 'Không tìm thấy tài khoản. Vui lòng kiểm tra lại.');
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
      const res = await authApi.forgotPassword({ emailOrUsername: identifier.trim() });
      // Chỉ cập nhật OTP gợi ý khi ở chế độ Mock
      setMockOtpHint(isMock ? (res.mockOtp || '123456') : '');
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
    } else if (otp.trim().length !== 6) {
      newErrors.otp = 'Mã OTP bao gồm 6 chữ số';
    }

    if (!newPassword) {
      newErrors.newPassword = 'Vui lòng nhập mật khẩu mới';
    } else if (!isValidPassword(newPassword)) {
      newErrors.newPassword = 'Mật khẩu tối thiểu 6 ký tự';
    }

    if (!confirmPassword) {
      newErrors.confirmPassword = 'Vui lòng xác nhận lại mật khẩu mới';
    } else if (confirmPassword !== newPassword) {
      newErrors.confirmPassword = 'Mật khẩu xác nhận không khớp';
    }

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    setIsSubmitting(true);
    try {
      await authApi.resetPassword({
        emailOrUsername: identifier.trim(),
        otp: otp.trim(),
        newPassword,
      });

      setCurrentStep(2);
      toast.success('Mật khẩu của bạn đã được cập nhật thành công!');
    } catch (err) {
      setServerError(err.message || 'Đặt lại mật khẩu thất bại. Vui lòng thử lại.');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Quick fill sample account
  const handleQuickFillAccount = (acc) => {
    setIdentifier(acc);
    setErrors({});
    setServerError('');
  };

  // Quick fill OTP
  const handleQuickFillOtp = () => {
    setOtp('123456');
    if (errors.otp) {
      setErrors((prev) => ({ ...prev, otp: '' }));
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
          {/* Floating emoji in brand panel */}
          <span
            className="absolute top-6 right-6 text-5xl opacity-40 animate-[float_5s_ease-in-out_infinite] select-none pointer-events-none"
            aria-hidden="true"
          >
            🔑
          </span>
          <span
            className="absolute bottom-8 right-8 text-4xl opacity-30 animate-[float-slow_8s_ease-in-out_infinite] select-none pointer-events-none"
            aria-hidden="true"
          >
            🛡️
          </span>

          <div>
            <div className="inline-flex items-center gap-2 text-2xl font-bold tracking-tight mb-8">
              <span>🎈</span>
              <span>FunnyShop</span>
            </div>

            <h2 className="text-3xl font-extrabold tracking-tight leading-snug mb-4">
              Khôi phục tài khoản dễ dàng & an toàn
            </h2>
            <p className="text-sm text-white/90 leading-relaxed mb-8">
              Đừng lo lắng nếu bạn quên mật khẩu! FunnyShop luôn sẵn sàng hỗ trợ bạn lấy lại quyền
              truy cập chỉ trong vài bước đơn giản.
            </p>

            {/* 3 benefit bullets */}
            <div className="space-y-4">
              <div className="flex items-center gap-3">
                <div className="size-9 rounded-xl bg-white/20 flex items-center justify-center shrink-0">
                  <ShieldCheck className="size-4.5 text-white" />
                </div>
                <span className="text-sm font-medium">Bảo mật cao với mã xác thực OTP</span>
              </div>

              <div className="flex items-center gap-3">
                <div className="size-9 rounded-xl bg-white/20 flex items-center justify-center shrink-0">
                  <Zap className="size-4.5 text-white" />
                </div>
                <span className="text-sm font-medium">Khôi phục tức thì trong vài phút</span>
              </div>

              <div className="flex items-center gap-3">
                <div className="size-9 rounded-xl bg-white/20 flex items-center justify-center shrink-0">
                  <Sparkles className="size-4.5 text-white" />
                </div>
                <span className="text-sm font-medium">Tiếp tục mua sắm quà tặng vui nhộn</span>
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
              <span className="text-3xl" aria-hidden="true">
                🎈
              </span>
              <span className="text-primary-700">Funny</span>
              <span className="text-secondary-500">Shop</span>
            </Link>
            <h1 className="text-2xl font-bold text-ink">Quên mật khẩu</h1>
            <p className="text-sm text-ink-muted mt-1">
              {currentStep === 0 && 'Nhập thông tin tài khoản để nhận mã khôi phục'}
              {currentStep === 1 && 'Nhập mã xác thực OTP và thiết lập mật khẩu mới'}
              {currentStep === 2 && 'Mật khẩu đã được thiết lập thành công'}
            </p>
          </div>

          {/* Step Indicator */}
          <StepIndicator
            steps={RESET_STEPS}
            currentStep={currentStep}
            className="mb-6 -mt-2"
          />

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

          {/* --- STEP 0: Request OTP --- */}
          {currentStep === 0 && (
            <form onSubmit={handleRequestOtp} className="space-y-4" noValidate>
              <Input
                label="Email hoặc Tên đăng nhập"
                id="reset-identifier"
                name="identifier"
                type="text"
                value={identifier}
                onChange={(e) => {
                  setIdentifier(e.target.value);
                  setServerError('');
                  if (errors.identifier) setErrors((prev) => ({ ...prev, identifier: '' }));
                }}
                placeholder="Ví dụ: user1@gmail.com hoặc admin"
                error={errors.identifier}
                leftIcon={Mail}
                required
                disabled={isSubmitting}
                helperText="Hệ thống sẽ gửi mã xác thực 6 chữ số đến email của bạn"
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
                  <span>Gửi mã xác thực OTP</span>
                  <ArrowRight className="size-4.5 ml-2" />
                </Button>
              </div>

              {/* Mock accounts quick-fill - chỉ hiện khi ở chế độ Mock */}
              {isMock && (
              <div className="mt-6 pt-5 border-t border-line">
                <p className="text-xs text-ink-subtle font-medium text-center mb-2.5 flex items-center justify-center gap-1.5">
                  <Sparkles className="size-3.5 text-secondary-500" />
                  Tài khoản mẫu để thử nghiệm nhanh (MockData):
                </p>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => handleQuickFillAccount('user1@gmail.com')}
                    className="p-2.5 text-xs text-ink rounded-lg border border-line bg-gray-50 hover:bg-gray-100 text-left transition-colors cursor-pointer"
                  >
                    <div className="font-semibold text-ink">Khách hàng (User)</div>
                    <div className="text-[11px] text-ink-subtle truncate">user1@gmail.com</div>
                  </button>

                  <button
                    type="button"
                    onClick={() => handleQuickFillAccount('admin@funnyshop.vn')}
                    className="p-2.5 text-xs text-ink rounded-lg border border-secondary-200 bg-secondary-50/60 hover:bg-secondary-100 text-left transition-colors cursor-pointer"
                  >
                    <div className="font-semibold text-secondary-700 flex items-center gap-1">
                      <ShieldCheck className="size-3" />
                      Admin
                    </div>
                    <div className="text-[11px] text-secondary-800 truncate">admin@funnyshop.vn</div>
                  </button>
                </div>
              </div>
              )}

              {/* Back to Login link */}
              <div className="mt-6 text-center text-sm">
                <Link
                  to="/login"
                  className="inline-flex items-center gap-1.5 font-semibold text-ink-muted hover:text-ink transition-colors"
                >
                  <ArrowLeft className="size-4" />
                  <span>Quay lại đăng nhập</span>
                </Link>
              </div>
            </form>
          )}

          {/* --- STEP 1: Enter OTP & New Password --- */}
          {currentStep === 1 && (
            <form onSubmit={handleResetPassword} className="space-y-4" noValidate>
              {/* Target email and Mock OTP notice */}
              <div className="p-3.5 rounded-xl bg-primary-50 border border-primary-200 text-xs text-primary-900 flex flex-col gap-1.5">
                <div className="flex items-center justify-between">
                  <span>
                    Mã xác thực đã gửi đến: <strong className="font-semibold">{userEmail}</strong>
                  </span>
                  <button
                    type="button"
                    onClick={() => {
                      setCurrentStep(0);
                      setServerError('');
                      setErrors({});
                    }}
                    className="text-xs font-semibold text-primary-700 hover:underline cursor-pointer"
                  >
                    Đổi tài khoản
                  </button>
                </div>

                {/* Mock OTP Badge - chỉ hiện khi ở chế độ Mock */}
                {isMock && mockOtpHint && (
                <div className="mt-1 pt-1.5 border-t border-primary-200/60 flex items-center justify-between">
                  <span className="flex items-center gap-1 text-primary-800 font-medium">
                    <Sparkles className="size-3 text-secondary-600" />
                    Mã OTP thử nghiệm: <code className="bg-white px-1.5 py-0.5 rounded font-mono font-bold text-primary-700">{mockOtpHint}</code>
                  </span>
                  <button
                    type="button"
                    onClick={handleQuickFillOtp}
                    className="px-2 py-0.5 bg-primary-700 text-white rounded text-[11px] font-semibold hover:bg-primary-800 transition-colors cursor-pointer"
                  >
                    Điền nhanh
                  </button>
                </div>
                )}
              </div>

              {/* OTP Input */}
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label htmlFor="reset-otp" className="text-sm font-medium text-ink">
                    Mã xác thực OTP <span className="text-primary-700">*</span>
                  </label>
                  <button
                    type="button"
                    onClick={handleResendOtp}
                    disabled={!canResend || isSubmitting}
                    className={`text-xs inline-flex items-center gap-1 transition-colors ${
                      canResend
                        ? 'text-primary-700 hover:text-primary-800 font-semibold cursor-pointer'
                        : 'text-ink-subtle cursor-not-allowed'
                    }`}
                  >
                    <RefreshCw className={`size-3 ${isSubmitting ? 'animate-spin' : ''}`} />
                    {canResend ? 'Gửi lại mã OTP' : `Gửi lại sau ${resendCountdown}s`}
                  </button>
                </div>

                <Input
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
                  placeholder="Nhập 6 chữ số (123456)"
                  error={errors.otp}
                  leftIcon={KeyRound}
                  required
                  disabled={isSubmitting}
                />
              </div>

              {/* New Password Input */}
              <div>
                <Input
                  label="Mật khẩu mới"
                  id="reset-new-password"
                  name="newPassword"
                  type="password"
                  value={newPassword}
                  onChange={(e) => {
                    setNewPassword(e.target.value);
                    if (errors.newPassword) setErrors((prev) => ({ ...prev, newPassword: '' }));
                  }}
                  placeholder="Tối thiểu 6 ký tự"
                  error={errors.newPassword}
                  leftIcon={Lock}
                  required
                  disabled={isSubmitting}
                />

                {/* Password Strength Meter */}
                {newPassword && (
                  <div className="mt-2 space-y-1">
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-ink-subtle">Độ mạnh mật khẩu:</span>
                      <span
                        className={`font-semibold ${
                          passwordStrength.level === 1
                            ? 'text-red-500'
                            : passwordStrength.level === 2
                            ? 'text-amber-500'
                            : 'text-emerald-500'
                        }`}
                      >
                        {passwordStrength.label}
                      </span>
                    </div>
                    <div className="grid grid-cols-3 gap-1.5 h-1.5 w-full">
                      <div
                        className={`rounded-full transition-colors ${
                          passwordStrength.level >= 1
                            ? passwordStrength.level === 1
                              ? 'bg-red-500'
                              : passwordStrength.level === 2
                              ? 'bg-amber-500'
                              : 'bg-emerald-500'
                            : 'bg-gray-200'
                        }`}
                      />
                      <div
                        className={`rounded-full transition-colors ${
                          passwordStrength.level >= 2
                            ? passwordStrength.level === 2
                              ? 'bg-amber-500'
                              : 'bg-emerald-500'
                            : 'bg-gray-200'
                        }`}
                      />
                      <div
                        className={`rounded-full transition-colors ${
                          passwordStrength.level >= 3 ? 'bg-emerald-500' : 'bg-gray-200'
                        }`}
                      />
                    </div>
                  </div>
                )}
              </div>

              {/* Confirm New Password Input */}
              <div>
                <Input
                  label="Xác nhận mật khẩu mới"
                  id="reset-confirm-password"
                  name="confirmPassword"
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => {
                    setConfirmPassword(e.target.value);
                    if (errors.confirmPassword) setErrors((prev) => ({ ...prev, confirmPassword: '' }));
                  }}
                  placeholder="Nhập lại mật khẩu mới"
                  error={errors.confirmPassword}
                  leftIcon={Lock}
                  required
                  disabled={isSubmitting}
                />
                {isConfirmMatching && (
                  <div className="flex items-center gap-1.5 text-xs text-emerald-600 font-medium mt-1">
                    <Check className="size-3.5" />
                    <span>Mật khẩu xác nhận khớp</span>
                  </div>
                )}
              </div>

              {/* Action Buttons */}
              <div className="pt-2 space-y-2">
                <Button
                  type="submit"
                  variant="primary"
                  size="lg"
                  fullWidth
                  loading={isSubmitting}
                  className="font-bold text-base shadow-brand"
                >
                  <span>Cập nhật mật khẩu</span>
                  <CheckCircle2 className="size-4.5 ml-2" />
                </Button>

                <Button
                  type="button"
                  variant="ghost"
                  size="md"
                  fullWidth
                  onClick={() => setCurrentStep(0)}
                  disabled={isSubmitting}
                  className="text-ink-muted hover:text-ink text-sm"
                >
                  <ArrowLeft className="size-4 mr-1.5" />
                  <span>Quay lại bước trước</span>
                </Button>
              </div>
            </form>
          )}

          {/* --- STEP 2: Success State --- */}
          {currentStep === 2 && (
            <div className="text-center py-4 space-y-6 animate-in zoom-in-95 duration-200">
              <div className="size-18 mx-auto rounded-full bg-emerald-100 flex items-center justify-center text-emerald-600 shadow-inner">
                <CheckCircle2 className="size-10" />
              </div>

              <div className="space-y-2">
                <h2 className="text-xl font-bold text-ink">Đổi mật khẩu thành công!</h2>
                <p className="text-sm text-ink-muted leading-relaxed">
                  Mật khẩu tài khoản <strong className="text-ink">{userEmail || identifier}</strong> đã
                  được cập nhật thành công vào hệ thống. Bạn có thể đăng nhập ngay với mật khẩu mới.
                </p>
              </div>

              <div className="space-y-3 pt-2">
                <Button
                  type="button"
                  variant="primary"
                  size="lg"
                  fullWidth
                  onClick={() => navigate('/login')}
                  className="font-bold text-base shadow-brand"
                >
                  <span>Đăng nhập ngay</span>
                  <ArrowRight className="size-4.5 ml-2" />
                </Button>

                <Button
                  type="button"
                  variant="outline"
                  size="md"
                  fullWidth
                  onClick={() => navigate('/')}
                  className="text-sm font-semibold"
                >
                  <span>Về trang chủ FunnyShop</span>
                </Button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
