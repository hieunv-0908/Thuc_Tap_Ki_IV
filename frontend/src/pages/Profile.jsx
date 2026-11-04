import { useState, useEffect, useMemo } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import {
  User,
  Mail,
  Lock,
  Phone,
  Calendar,
  Package,
  ShieldCheck,
  CheckCircle2,
  AlertCircle,
  Check,
  Save,
  ArrowRight,
} from 'lucide-react';
import { useAuthStore } from '../store/authStore';
import { userApi } from '../api/user';
import { toast } from '../store/toastStore';
import { isValidEmail, isValidPassword, isValidPhone } from '../utils/validators';
import { formatDate } from '../utils/formatDate';
import Input from '../components/ui/Input';
import Button from '../components/ui/Button';
import Badge from '../components/ui/Badge';
import Skeleton from '../components/ui/Skeleton';

/**
 * User Profile page complying with Design.md section 7.7 (v2.0)
 * Includes cover banner with floating emojis, initial-letter avatar,
 * stats row, and 2 separate forms for Personal Info and Password Change.
 */
export default function Profile() {
  const navigate = useNavigate();
  const { user: storeUser, isAuthenticated, _hasHydrated, updateUser } = useAuthStore();

  const [loading, setLoading] = useState(true);
  const [profileData, setProfileData] = useState(null);

  // Form 1: Personal Info
  const [infoForm, setInfoForm] = useState({
    fullName: '',
    email: '',
    phone: '',
    username: '',
  });
  const [initialInfo, setInitialInfo] = useState({
    fullName: '',
    email: '',
    phone: '',
    username: '',
  });
  const [infoErrors, setInfoErrors] = useState({});
  const [infoSubmitting, setInfoSubmitting] = useState(false);

  // Form 2: Change Password
  const [passwordForm, setPasswordForm] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  });
  const [passwordErrors, setPasswordErrors] = useState({});
  const [passwordSubmitting, setPasswordSubmitting] = useState(false);
  const [passwordServerError, setPasswordServerError] = useState('');

  // Check auth
  useEffect(() => {
    if (_hasHydrated && !isAuthenticated) {
      navigate('/login', { state: { from: '/profile' } });
    }
  }, [_hasHydrated, isAuthenticated, navigate]);

  // Fetch current user details
  useEffect(() => {
    if (!isAuthenticated) return;

    let isMounted = true;
    const fetchProfile = async () => {
      setLoading(true);
      try {
        const data = await userApi.getMe();
        if (!isMounted) return;

        const merged = {
          ...storeUser,
          ...data,
        };

        setProfileData(merged);
        const formInit = {
          fullName: merged.fullName || '',
          email: merged.email || '',
          phone: merged.phone || '',
          username: merged.username || '',
        };
        setInfoForm(formInit);
        setInitialInfo(formInit);
      } catch (err) {
        if (!isMounted) return;
        toast.error(err.message || 'Không thể tải thông tin hồ sơ.');
        if (storeUser) {
          setProfileData(storeUser);
          const formInit = {
            fullName: storeUser.fullName || '',
            email: storeUser.email || '',
            phone: storeUser.phone || '',
            username: storeUser.username || '',
          };
          setInfoForm(formInit);
          setInitialInfo(formInit);
        }
      } finally {
        if (isMounted) setLoading(false);
      }
    };

    fetchProfile();
    return () => {
      isMounted = false;
    };
  }, [isAuthenticated, storeUser]);

  // Avatar Initials
  const getInitials = (name) => {
    if (!name) return 'U';
    const parts = name.trim().split(' ');
    if (parts.length === 1) return parts[0].charAt(0).toUpperCase();
    return (parts[0].charAt(0) + parts[parts.length - 1].charAt(0)).toUpperCase();
  };

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

  const passwordStrength = getPasswordStrength(passwordForm.newPassword);
  const isConfirmMatching =
    Boolean(passwordForm.confirmPassword) &&
    passwordForm.confirmPassword === passwordForm.newPassword;

  // Check if Form 1 is changed
  const isInfoChanged = useMemo(() => {
    return (
      infoForm.fullName.trim() !== initialInfo.fullName.trim() ||
      infoForm.email.trim() !== initialInfo.email.trim() ||
      infoForm.phone.trim() !== initialInfo.phone.trim()
    );
  }, [infoForm, initialInfo]);

  // Check if Form 2 is changed
  const isPasswordChanged = useMemo(() => {
    return Boolean(
      passwordForm.currentPassword ||
      passwordForm.newPassword ||
      passwordForm.confirmPassword
    );
  }, [passwordForm]);

  // --- Handlers for Form 1: Info ---
  const handleInfoChange = (e) => {
    const { name, value } = e.target;
    setInfoForm((prev) => ({ ...prev, [name]: value }));
    if (infoErrors[name]) {
      setInfoErrors((prev) => ({ ...prev, [name]: '' }));
    }
  };

  const handleInfoSubmit = async (e) => {
    e.preventDefault();
    const newErrors = {};

    if (!infoForm.fullName.trim()) {
      newErrors.fullName = 'Vui lòng nhập họ và tên';
    } else if (infoForm.fullName.trim().length < 2) {
      newErrors.fullName = 'Họ tên phải từ 2 ký tự trở lên';
    }

    if (infoForm.email.trim() && !isValidEmail(infoForm.email.trim())) {
      newErrors.email = 'Địa chỉ email không đúng định dạng';
    }

    if (infoForm.phone.trim() && !isValidPhone(infoForm.phone.trim())) {
      newErrors.phone = 'Số điện thoại không hợp lệ (10 chữ số, ví dụ 0901234567)';
    }

    if (Object.keys(newErrors).length > 0) {
      setInfoErrors(newErrors);
      return;
    }

    setInfoSubmitting(true);
    try {
      const updated = await userApi.updateMe({
        fullName: infoForm.fullName.trim(),
        phone: infoForm.phone.trim(),
        email: infoForm.email.trim(),
      });

      // Update local storage / Zustand auth store
      updateUser({
        fullName: updated.fullName || infoForm.fullName.trim(),
        phone: updated.phone || infoForm.phone.trim(),
        email: updated.email || infoForm.email.trim(),
      });

      setProfileData((prev) => ({
        ...prev,
        ...updated,
      }));

      const newInit = {
        fullName: updated.fullName || infoForm.fullName.trim(),
        email: updated.email || infoForm.email.trim(),
        phone: updated.phone || infoForm.phone.trim(),
        username: infoForm.username,
      };
      setInitialInfo(newInit);
      setInfoForm(newInit);

      toast.success('Cập nhật thông tin thành công!');
    } catch (err) {
      toast.error(err.message || 'Cập nhật thông tin thất bại. Vui lòng thử lại.');
    } finally {
      setInfoSubmitting(false);
    }
  };

  // --- Handlers for Form 2: Password ---
  const handlePasswordChange = (e) => {
    const { name, value } = e.target;
    setPasswordForm((prev) => ({ ...prev, [name]: value }));
    setPasswordServerError('');
    if (passwordErrors[name]) {
      setPasswordErrors((prev) => ({ ...prev, [name]: '' }));
    }
  };

  const handlePasswordSubmit = async (e) => {
    e.preventDefault();
    setPasswordServerError('');
    const newErrors = {};

    if (!passwordForm.currentPassword) {
      newErrors.currentPassword = 'Vui lòng nhập mật khẩu hiện tại';
    }

    if (!passwordForm.newPassword) {
      newErrors.newPassword = 'Vui lòng nhập mật khẩu mới';
    } else if (!isValidPassword(passwordForm.newPassword)) {
      newErrors.newPassword = 'Mật khẩu mới tối thiểu 6 ký tự';
    }

    if (!passwordForm.confirmPassword) {
      newErrors.confirmPassword = 'Vui lòng xác nhận mật khẩu mới';
    } else if (passwordForm.confirmPassword !== passwordForm.newPassword) {
      newErrors.confirmPassword = 'Mật khẩu xác nhận không trùng khớp';
    }

    if (Object.keys(newErrors).length > 0) {
      setPasswordErrors(newErrors);
      return;
    }

    setPasswordSubmitting(true);
    try {
      await userApi.changePassword({
        currentPassword: passwordForm.currentPassword,
        newPassword: passwordForm.newPassword,
      });

      setPasswordForm({
        currentPassword: '',
        newPassword: '',
        confirmPassword: '',
      });

      toast.success('Cập nhật mật khẩu thành công!');
    } catch (err) {
      setPasswordServerError(err.message || 'Không thể đổi mật khẩu. Vui lòng kiểm tra lại.');
    } finally {
      setPasswordSubmitting(false);
    }
  };

  if (!_hasHydrated || (loading && !profileData)) {
    return (
      <div className="min-h-[calc(100vh-8rem)] bg-gradient-to-br from-primary-50/50 via-white to-secondary-50/50 py-8 px-4 sm:px-6">
        <div className="max-w-2xl mx-auto space-y-6">
          <Skeleton className="h-64 w-full rounded-2xl" />
          <Skeleton className="h-72 w-full rounded-2xl" />
          <Skeleton className="h-72 w-full rounded-2xl" />
        </div>
      </div>
    );
  }

  const roleLabel = profileData?.role === 'ADMIN' ? 'Quản trị viên' : 'Khách hàng';
  const roleVariant = profileData?.role === 'ADMIN' ? 'secondary' : 'primary';

  return (
    <div className="relative min-h-[calc(100vh-8rem)] bg-gradient-to-br from-primary-50/40 via-white to-secondary-50/40 py-8 px-4 sm:px-6 overflow-hidden">
      {/* Decorative background blobs */}
      <div
        className="absolute top-12 left-10 size-72 rounded-full bg-primary-200/30 blur-3xl pointer-events-none select-none"
        aria-hidden="true"
      />
      <div
        className="absolute bottom-16 right-10 size-80 rounded-full bg-secondary-200/30 blur-3xl pointer-events-none select-none"
        aria-hidden="true"
      />

      <div className="relative z-10 max-w-2xl mx-auto">
        {/* Breadcrumb / Top Back navigation */}
        <div className="mb-4 flex items-center justify-between text-xs text-ink-subtle">
          <div className="flex items-center gap-1.5">
            <Link to="/" className="hover:text-primary-700 transition-colors">
              Trang chủ
            </Link>
            <span>/</span>
            <span className="text-ink font-semibold">Hồ sơ cá nhân</span>
          </div>

          <Link
            to="/orders"
            className="inline-flex items-center gap-1 text-primary-700 hover:underline font-semibold"
          >
            <span>Xem đơn hàng</span>
            <ArrowRight className="size-3.5" />
          </Link>
        </div>

        {/* --- SECTION 1: Profile Top Card with Cover & Metrics --- */}
        <div className="rounded-2xl border border-line bg-white shadow-soft overflow-hidden mb-6 animate-in fade-in duration-200">
          {/* Cover Header with subtle floating emojis (Design.md 7.7) */}
          <div className="h-24 sm:h-28 rounded-t-2xl bg-gradient-to-r from-primary-200 via-primary-100 to-secondary-200 relative overflow-hidden select-none">
            <span
              className="absolute top-3 left-8 text-2xl opacity-30 animate-[float_6s_ease-in-out_infinite]"
              aria-hidden="true"
            >
              🎈
            </span>
            <span
              className="absolute top-5 right-12 text-2xl opacity-25 animate-[float-slow_8s_ease-in-out_infinite]"
              aria-hidden="true"
            >
              ⭐
            </span>
            <span
              className="absolute bottom-2 left-1/3 text-xl opacity-25"
              aria-hidden="true"
            >
              🎁
            </span>
            <span
              className="absolute top-4 right-1/3 text-xl opacity-20"
              aria-hidden="true"
            >
              🧸
            </span>
          </div>

          {/* Identity: Avatar, Name, Email, Role */}
          <div className="px-6 pb-6 pt-0">
            <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
              <div className="flex items-end gap-4">
                {/* Initial-letter avatar overlapping cover boundary */}
                <div
                  className="size-16 sm:size-20 rounded-full bg-primary-100 text-primary-700 ring-4 ring-white -mt-8 sm:-mt-10 font-bold text-xl sm:text-2xl flex items-center justify-center shadow-md select-none shrink-0"
                  aria-hidden="true"
                >
                  {getInitials(profileData?.fullName)}
                </div>

                <div className="min-w-0 pb-1">
                  <div className="flex items-center gap-2 flex-wrap">
                    <h1 className="text-xl sm:text-2xl font-bold text-ink truncate">
                      {profileData?.fullName || 'Người dùng FunnyShop'}
                    </h1>
                    <Badge variant={roleVariant} className="font-semibold text-[11px]">
                      {roleLabel}
                    </Badge>
                  </div>
                  <p className="text-xs sm:text-sm text-ink-muted truncate mt-0.5">
                    {profileData?.email || 'Chưa liên kết email'}
                  </p>
                </div>
              </div>

              {profileData?.username && (
                <div className="sm:self-center">
                  <span className="text-xs font-mono px-2.5 py-1 rounded-lg bg-gray-100 text-ink-subtle">
                    @{profileData.username}
                  </span>
                </div>
              )}
            </div>

            {/* Metrics Row (Design.md 7.7) */}
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 pt-5 mt-5 border-t border-line">
              {/* Stat 1: Total Orders */}
              <div className="rounded-xl bg-gray-50/80 border border-gray-100 p-3 text-center transition-colors hover:bg-gray-100/60">
                <div className="inline-flex p-1.5 rounded-lg bg-primary-50 text-primary-700 mb-1">
                  <Package className="size-4" />
                </div>
                <div className="text-base sm:text-lg font-bold text-ink">
                  {profileData?.orderCount ?? 0}
                </div>
                <div className="text-[11px] text-ink-subtle font-medium">Đơn hàng đã đặt</div>
              </div>

              {/* Stat 2: Member Since */}
              <div className="rounded-xl bg-gray-50/80 border border-gray-100 p-3 text-center transition-colors hover:bg-gray-100/60">
                <div className="inline-flex p-1.5 rounded-lg bg-secondary-50 text-secondary-700 mb-1">
                  <Calendar className="size-4" />
                </div>
                <div className="text-base sm:text-lg font-bold text-ink truncate">
                  {profileData?.createdAt ? formatDate(profileData.createdAt).split(' ')[0] : 'Gần đây'}
                </div>
                <div className="text-[11px] text-ink-subtle font-medium">Thành viên từ ngày</div>
              </div>

              {/* Stat 3: Account Status */}
              <div className="col-span-2 sm:col-span-1 rounded-xl bg-gray-50/80 border border-gray-100 p-3 text-center transition-colors hover:bg-gray-100/60">
                <div className="inline-flex p-1.5 rounded-lg bg-green-50 text-green-700 mb-1">
                  <CheckCircle2 className="size-4" />
                </div>
                <div className="text-base sm:text-lg font-bold text-green-700">
                  {profileData?.status === 'ACTIVE' || !profileData?.status
                    ? 'Hoạt động'
                    : profileData?.status}
                </div>
                <div className="text-[11px] text-ink-subtle font-medium">Trạng thái tài khoản</div>
              </div>
            </div>
          </div>
        </div>

        {/* --- SECTION 2: Form Thông tin cá nhân (Design.md 7.7) --- */}
        <div className="rounded-2xl border border-line bg-white shadow-soft p-5 sm:p-6 mb-6 animate-in fade-in duration-200">
          {/* Header Sticker */}
          <div className="flex items-center gap-3 mb-5 pb-4 border-b border-line">
            <div className="size-9 rounded-xl bg-primary-100 text-primary-700 flex items-center justify-center shrink-0">
              <User className="size-5" />
            </div>
            <div>
              <h2 className="text-base sm:text-lg font-bold text-ink">Thông tin cá nhân</h2>
              <p className="text-xs text-ink-muted">
                Quản lý họ tên, số điện thoại và thông tin liên hệ của bạn
              </p>
            </div>
          </div>

          <form onSubmit={handleInfoSubmit} className="space-y-4" noValidate>
            <Input
              label="Họ và tên"
              id="profile-fullName"
              name="fullName"
              type="text"
              value={infoForm.fullName}
              onChange={handleInfoChange}
              placeholder="Nhập họ và tên của bạn"
              error={infoErrors.fullName}
              leftIcon={User}
              required
              disabled={infoSubmitting}
            />

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Input
                label="Email"
                id="profile-email"
                name="email"
                type="email"
                value={infoForm.email}
                onChange={handleInfoChange}
                placeholder="example@gmail.com"
                error={infoErrors.email}
                leftIcon={Mail}
                disabled={infoSubmitting}
              />

              <Input
                label="Số điện thoại"
                id="profile-phone"
                name="phone"
                type="tel"
                value={infoForm.phone}
                onChange={handleInfoChange}
                placeholder="Ví dụ: 0987654321"
                error={infoErrors.phone}
                leftIcon={Phone}
                disabled={infoSubmitting}
              />
            </div>

            {infoForm.username && (
              <Input
                label="Tên đăng nhập"
                id="profile-username"
                name="username"
                type="text"
                value={infoForm.username}
                disabled
                leftIcon={ShieldCheck}
                helperText="Tên đăng nhập cố định, không thể thay đổi"
              />
            )}

            {/* Save Button: only enabled if form has changes per Design.md */}
            <div className="pt-2 flex items-center justify-end">
              <Button
                type="submit"
                variant="primary"
                size="md"
                loading={infoSubmitting}
                disabled={!isInfoChanged || infoSubmitting}
                className="font-bold shadow-xs px-6"
              >
                <Save className="size-4 mr-2" />
                <span>Lưu thay đổi</span>
              </Button>
            </div>
          </form>
        </div>

        {/* --- SECTION 3: Form Đổi mật khẩu (Design.md 7.7) --- */}
        <div className="rounded-2xl border border-line bg-white shadow-soft p-5 sm:p-6 animate-in fade-in duration-200">
          {/* Header Sticker */}
          <div className="flex items-center gap-3 mb-5 pb-4 border-b border-line">
            <div className="size-9 rounded-xl bg-secondary-100 text-secondary-700 flex items-center justify-center shrink-0">
              <Lock className="size-5" />
            </div>
            <div>
              <h2 className="text-base sm:text-lg font-bold text-ink">Đổi mật khẩu</h2>
              <p className="text-xs text-ink-muted">
                Đổi mật khẩu định kỳ để bảo vệ tài khoản FunnyShop của bạn
              </p>
            </div>
          </div>

          {/* Server Error Alert */}
          {passwordServerError && (
            <div
              role="alert"
              className="mb-4 flex items-start gap-3 p-3.5 rounded-xl bg-red-50 border border-red-200 text-red-700 text-sm animate-in shake duration-200"
            >
              <AlertCircle className="size-5 shrink-0 mt-0.5 text-red-600" aria-hidden="true" />
              <div className="flex-1 font-medium">{passwordServerError}</div>
            </div>
          )}

          <form onSubmit={handlePasswordSubmit} className="space-y-4" noValidate>
            <Input
              label="Mật khẩu hiện tại"
              id="profile-currentPassword"
              name="currentPassword"
              type="password"
              value={passwordForm.currentPassword}
              onChange={handlePasswordChange}
              placeholder="Nhập mật khẩu bạn đang dùng"
              error={passwordErrors.currentPassword}
              leftIcon={Lock}
              required
              disabled={passwordSubmitting}
            />

            <div>
              <Input
                label="Mật khẩu mới"
                id="profile-newPassword"
                name="newPassword"
                type="password"
                value={passwordForm.newPassword}
                onChange={handlePasswordChange}
                placeholder="Tối thiểu 6 ký tự"
                error={passwordErrors.newPassword}
                leftIcon={Lock}
                required
                disabled={passwordSubmitting}
              />

              {/* Password Strength Meter */}
              {passwordForm.newPassword && (
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

            <div>
              <Input
                label="Xác nhận mật khẩu mới"
                id="profile-confirmPassword"
                name="confirmPassword"
                type="password"
                value={passwordForm.confirmPassword}
                onChange={handlePasswordChange}
                placeholder="Nhập lại mật khẩu mới"
                error={passwordErrors.confirmPassword}
                leftIcon={Lock}
                required
                disabled={passwordSubmitting}
              />

              {isConfirmMatching && (
                <div className="flex items-center gap-1.5 text-xs text-emerald-600 font-medium mt-1">
                  <Check className="size-3.5" />
                  <span>Mật khẩu xác nhận trùng khớp</span>
                </div>
              )}
            </div>

            {/* Save Button: only enabled if form has changes per Design.md */}
            <div className="pt-2 flex items-center justify-end">
              <Button
                type="submit"
                variant="primary"
                size="md"
                loading={passwordSubmitting}
                disabled={!isPasswordChanged || passwordSubmitting}
                className="font-bold shadow-xs px-6"
              >
                <Save className="size-4 mr-2" />
                <span>Cập nhật mật khẩu</span>
              </Button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}

