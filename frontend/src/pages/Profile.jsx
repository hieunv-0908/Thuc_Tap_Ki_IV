import { useState, useEffect, useMemo } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import {
  User,
  Mail,
  Lock,
  Phone,
  Package,
  CheckCircle2,
  Calendar,
  Save,
  ArrowRight,
  AlertCircle,
  Check,
} from 'lucide-react';
import { useAuthStore } from '../store/authStore';
import { userApi } from '../api/user';
import { orderApi } from '../api/order';
import { toast } from '../store/toastStore';
import { isValidPassword, isValidPhone } from '../utils/validators';
import { formatDate } from '../utils/formatDate';
import Input from '../components/ui/Input';
import Button from '../components/ui/Button';
import Badge from '../components/ui/Badge';
import Skeleton from '../components/ui/Skeleton';

/**
 * Hồ sơ cá nhân — /profile (Design.md 7.7 v2.0)
 *
 * - Thẻ `max-w-2xl` có cover: dải `h-24 rounded-t-2xl bg-gradient-to-r from-primary-100 to-secondary-100`
 *   (kèm 3–4 chấm/emoji mờ); avatar chữ cái đầu `size-16 rounded-full bg-primary-100 text-primary-700
 *   ring-4 ring-white -mt-8` đè lên mép cover; bên cạnh là họ tên (H2), email `text-ink-muted` và `Badge`
 *   vai trò ("Khách hàng"/"Quản trị").
 * - Hàng số liệu nhỏ 🔹 (Đơn hàng đã đặt, Thành viên từ ngày…) chỉ hiện khi lấy được từ API;
 *   mỗi ô `rounded-xl bg-gray-50 p-3 text-center`.
 * - 2 khối form tách thành hai thẻ có header sticker: Thông tin (icon User: Họ tên, Email)
 *   và Đổi mật khẩu (icon Lock: Mật khẩu hiện tại, Mật khẩu mới có thanh độ mạnh, Xác nhận).
 * - Mỗi khối có nút lưu riêng; thành công thì toast "Cập nhật thành công"; lỗi hiện dưới ô tương ứng.
 *   Nút lưu chỉ bật khi form có thay đổi.
 */
export default function Profile() {
  const navigate = useNavigate();
  const { user: storeUser, isAuthenticated, _hasHydrated, updateUser } = useAuthStore();

  const [loading, setLoading] = useState(true);
  const [profileData, setProfileData] = useState(null);
  const [orderCount, setOrderCount] = useState(null);

  // Form 1: Thông tin
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

  // Form 2: Đổi mật khẩu
  const [passwordForm, setPasswordForm] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  });
  const [passwordErrors, setPasswordErrors] = useState({});
  const [passwordSubmitting, setPasswordSubmitting] = useState(false);
  const [passwordServerError, setPasswordServerError] = useState('');

  // Kiểm tra đăng nhập
  useEffect(() => {
    if (_hasHydrated && !isAuthenticated) {
      navigate('/login', { state: { from: '/profile' } });
    }
  }, [_hasHydrated, isAuthenticated, navigate]);

  // Lấy thông tin user và số đơn hàng từ API backend
  useEffect(() => {
    if (!isAuthenticated) return;

    let isMounted = true;
    const fetchProfileAndStats = async () => {
      setLoading(true);
      try {
        const [userResult, ordersResult] = await Promise.allSettled([
          userApi.getMe(),
          orderApi.getMyOrders(),
        ]);

        if (!isMounted) return;

        let userData = {};
        if (userResult.status === 'fulfilled' && userResult.value) {
          userData = userResult.value;
        } else if (userResult.status === 'rejected') {
          console.warn('[Profile] Lỗi tải thông tin user từ backend:', userResult.reason);
        }

        let totalOrders = null;
        if (ordersResult.status === 'fulfilled' && ordersResult.value) {
          const list = ordersResult.value;
          totalOrders = Array.isArray(list) ? list.length : (list?.content?.length ?? 0);
        } else if (ordersResult.status === 'rejected') {
          console.warn('[Profile] Lỗi tải đơn hàng của user:', ordersResult.reason);
        }

        setOrderCount(totalOrders);

        const merged = {
          ...storeUser,
          ...userData,
          ...(totalOrders !== null ? { orderCount: totalOrders } : {}),
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

    fetchProfileAndStats();
    return () => {
      isMounted = false;
    };
  }, [isAuthenticated, storeUser]);

  // Chữ cái đầu cho Avatar
  const getInitials = (name) => {
    if (!name) return 'U';
    const parts = name.trim().split(' ');
    if (parts.length === 1) return parts[0].charAt(0).toUpperCase();
    return (parts[0].charAt(0) + parts[parts.length - 1].charAt(0)).toUpperCase();
  };

  // Tính độ mạnh mật khẩu (Design.md 7.7)
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

  // Kiểm tra Form 1 thay đổi (email cố định không sửa được)
  const isInfoChanged = useMemo(() => {
    return (
      infoForm.fullName.trim() !== initialInfo.fullName.trim() ||
      (infoForm.phone || '').trim() !== (initialInfo.phone || '').trim()
    );
  }, [infoForm.fullName, infoForm.phone, initialInfo.fullName, initialInfo.phone]);

  // Kiểm tra Form 2 thay đổi
  const isPasswordChanged = useMemo(() => {
    return Boolean(
      passwordForm.currentPassword ||
      passwordForm.newPassword ||
      passwordForm.confirmPassword
    );
  }, [passwordForm]);

  // --- Form 1 Handlers ---
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
      newErrors.fullName = 'Vui lòng nhập họ tên';
    } else if (infoForm.fullName.trim().length < 2) {
      newErrors.fullName = 'Họ tên phải từ 2 ký tự trở lên';
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
        phone: infoForm.phone.trim() || null,
      });

      updateUser({
        fullName: updated.fullName || infoForm.fullName.trim(),
        phone: updated.phone !== undefined ? updated.phone : (infoForm.phone.trim() || null),
      });

      setProfileData((prev) => ({
        ...prev,
        fullName: updated.fullName || infoForm.fullName.trim(),
        phone: updated.phone !== undefined ? updated.phone : (infoForm.phone.trim() || null),
      }));

      const newInit = {
        fullName: updated.fullName || infoForm.fullName.trim(),
        email: profileData?.email || initialInfo.email,
        phone: updated.phone !== undefined ? (updated.phone || '') : infoForm.phone.trim(),
        username: infoForm.username,
      };
      setInitialInfo(newInit);
      setInfoForm(newInit);

      toast.success('Cập nhật thành công');
    } catch (err) {
      toast.error(err.message || 'Cập nhật thất bại. Vui lòng thử lại.');
    } finally {
      setInfoSubmitting(false);
    }
  };

  // --- Form 2 Handlers ---
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

      toast.success('Cập nhật thành công');
    } catch (err) {
      setPasswordServerError(err.message || 'Không thể đổi mật khẩu. Vui lòng kiểm tra lại.');
    } finally {
      setPasswordSubmitting(false);
    }
  };

  if (!_hasHydrated || (loading && !profileData)) {
    return (
      <div className="min-h-[calc(100vh-8rem)] bg-page py-8 px-4 sm:px-6">
        <div className="max-w-2xl mx-auto space-y-6">
          <Skeleton className="h-48 w-full rounded-2xl" />
          <Skeleton className="h-64 w-full rounded-2xl" />
          <Skeleton className="h-64 w-full rounded-2xl" />
        </div>
      </div>
    );
  }

  const roleLabel = profileData?.role === 'ADMIN' ? 'Quản trị' : 'Khách hàng';
  const roleVariant = profileData?.role === 'ADMIN' ? 'secondary' : 'primary';

  return (
    <div className="min-h-[calc(100vh-8rem)] bg-page py-8 px-4 sm:px-6">
      <div className="max-w-2xl mx-auto">
        {/* Breadcrumb / Top Action Button */}
        <div className="mb-4 flex items-center justify-between text-xs text-ink-subtle">
          <div className="flex items-center gap-1.5">
            <Link to="/" className="hover:text-primary-700 transition-colors">
              Trang chủ
            </Link>
            <span>/</span>
            <span className="text-ink font-semibold">Hồ sơ cá nhân</span>
          </div>

          <Button
            variant="outline"
            size="sm"
            rightIcon={ArrowRight}
            onClick={() => navigate('/orders')}
            className="font-semibold text-xs"
          >
            Xem đơn hàng
          </Button>
        </div>

        {/* --- Card 1: Thẻ có cover & avatar theo Design.md 7.7 --- */}
        <div className="rounded-2xl border border-line bg-white shadow-soft overflow-hidden mb-6">
          {/* Cover: dải h-24 rounded-t-2xl bg-gradient-to-r from-primary-100 to-secondary-100 kèm 3-4 chấm/emoji mờ */}
          <div className="h-24 rounded-t-2xl bg-gradient-to-r from-primary-100 to-secondary-100 relative overflow-hidden select-none">
            <span
              className="absolute top-3 left-8 text-2xl opacity-30 select-none pointer-events-none"
              aria-hidden="true"
            >
              🎈
            </span>
            <span
              className="absolute top-4 right-12 text-2xl opacity-25 select-none pointer-events-none"
              aria-hidden="true"
            >
              ⭐
            </span>
            <span
              className="absolute bottom-2 left-1/3 text-xl opacity-25 select-none pointer-events-none"
              aria-hidden="true"
            >
              🎁
            </span>
            <span
              className="absolute top-3 right-1/3 text-xl opacity-20 select-none pointer-events-none"
              aria-hidden="true"
            >
              🧸
            </span>
          </div>

          {/* Identity info */}
          <div className="relative z-10 px-6 pb-6 pt-0">
            <div className="flex items-end gap-4">
              {/* Avatar chữ cái đầu size-16 rounded-full có viền đè lên mép cover, relative z-10 để không bị lấp bởi background */}
              <div
                className={`relative z-10 size-16 rounded-full ${
                  profileData?.role === 'ADMIN'
                    ? 'bg-secondary-100 text-secondary-700 border-2 border-secondary-400'
                    : 'bg-primary-100 text-primary-700 border-2 border-primary-400'
                } ring-4 ring-white -mt-8 font-bold text-xl flex items-center justify-center shrink-0 shadow-md select-none overflow-hidden`}
                aria-hidden="true"
              >
                {profileData?.avatarUrl || profileData?.avatar || profileData?.imageUrl ? (
                  <img
                    src={profileData.avatarUrl || profileData.avatar || profileData.imageUrl}
                    alt={profileData?.fullName || 'Avatar'}
                    className="w-full h-full object-cover rounded-full"
                  />
                ) : (
                  getInitials(profileData?.fullName)
                )}
              </div>

              {/* Bên cạnh là họ tên (H2), email text-ink-muted và Badge vai trò ("Khách hàng"/"Quản trị") */}
              <div className="min-w-0 pb-1">
                <div className="flex items-center gap-2 flex-wrap">
                  <h2 className="text-xl font-bold text-ink truncate">
                    {profileData?.fullName || 'Người dùng FunnyShop'}
                  </h2>
                  <Badge variant={roleVariant} className="font-semibold text-xs">
                    {roleLabel}
                  </Badge>
                </div>
                <p className="text-sm text-ink-muted truncate mt-0.5">
                  {profileData?.email || 'Chưa liên kết email'}
                </p>
              </div>
            </div>

            {/* Hàng số liệu: Đơn hàng đã đặt & Trạng thái tài khoản */}
            <div className={`grid ${profileData?.createdAt ? 'grid-cols-2 sm:grid-cols-3' : 'grid-cols-2'} gap-3 pt-5 mt-5 border-t border-line`}>
              {/* Ô 1: Đơn hàng đã đặt */}
              <Link
                to="/orders"
                className="rounded-xl bg-gray-50/80 border border-gray-100 p-3 text-center transition-all hover:bg-primary-50/50 hover:border-primary-200 block group cursor-pointer"
                title="Bấm để xem danh sách đơn hàng đã đặt"
              >
                <div className="inline-flex p-1.5 rounded-lg bg-primary-50 text-primary-700 mb-1 group-hover:bg-primary-100 transition-colors">
                  <Package className="size-4" />
                </div>
                <div className="text-base sm:text-lg font-bold text-ink group-hover:text-primary-700 transition-colors">
                  {orderCount ?? 0}
                </div>
                <div className="text-[11px] text-ink-subtle font-medium">Đơn hàng đã đặt</div>
              </Link>

              {/* Ô 2: Trạng thái tài khoản */}
              <div className="rounded-xl bg-gray-50/80 border border-gray-100 p-3 text-center transition-colors hover:bg-gray-100/60">
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

              {/* Ô 3: Thành viên từ ngày (nếu có từ API) */}
              {profileData?.createdAt && (
                <div className="col-span-2 sm:col-span-1 rounded-xl bg-gray-50/80 border border-gray-100 p-3 text-center transition-colors hover:bg-gray-100/60">
                  <div className="inline-flex p-1.5 rounded-lg bg-secondary-50 text-secondary-700 mb-1">
                    <Calendar className="size-4" />
                  </div>
                  <div className="text-base sm:text-lg font-bold text-ink truncate">
                    {formatDate(profileData.createdAt).split(' ')[0]}
                  </div>
                  <div className="text-[11px] text-ink-subtle font-medium">Thành viên từ ngày</div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* --- Card 2: Form Thông tin (Design.md 7.7) --- */}
        <div className="rounded-2xl border border-line bg-white shadow-soft p-5 sm:p-6 mb-6">
          {/* Header sticker icon User */}
          <div className="flex items-center gap-3 mb-5 pb-4 border-b border-line">
            <div className="grid size-10 place-items-center rounded-xl bg-primary-100 text-primary-700 -rotate-3 shrink-0">
              <User className="size-5" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-ink">Thông tin</h3>
            </div>
          </div>

          <form onSubmit={handleInfoSubmit} className="space-y-4" noValidate>
            <Input
              label="Họ tên"
              id="profile-fullName"
              name="fullName"
              type="text"
              value={infoForm.fullName}
              onChange={handleInfoChange}
              placeholder="Nhập họ và tên"
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
                disabled
                leftIcon={Mail}
                helperText="Email cố định, không thể thay đổi"
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

            {/* Nút lưu chỉ bật khi form có thay đổi (Design.md 7.7) */}
            <div className="pt-3 flex items-center justify-end border-t border-line">
              <Button
                type="submit"
                variant="primary"
                size="md"
                leftIcon={Save}
                loading={infoSubmitting}
                disabled={!isInfoChanged || infoSubmitting}
                className="w-full sm:w-auto font-semibold shadow-brand px-6"
              >
                Lưu thay đổi
              </Button>
            </div>
          </form>
        </div>

        {/* --- Card 3: Form Đổi mật khẩu (Design.md 7.7) --- */}
        <div className="rounded-2xl border border-line bg-white shadow-soft p-5 sm:p-6">
          {/* Header sticker icon Lock */}
          <div className="flex items-center gap-3 mb-5 pb-4 border-b border-line">
            <div className="grid size-10 place-items-center rounded-xl bg-secondary-100 text-secondary-700 rotate-3 shrink-0">
              <Lock className="size-5" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-ink">Đổi mật khẩu</h3>
            </div>
          </div>

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
              placeholder="Nhập mật khẩu hiện tại"
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

              {/* Thanh độ mạnh mật khẩu (Design.md 7.7) */}
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
                label="Xác nhận mật khẩu"
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

            {/* Nút lưu chỉ bật khi form có thay đổi (Design.md 7.7) */}
            <div className="pt-3 flex items-center justify-end border-t border-line">
              <Button
                type="submit"
                variant="secondary"
                size="md"
                leftIcon={Lock}
                loading={passwordSubmitting}
                disabled={!isPasswordChanged || passwordSubmitting}
                className="w-full sm:w-auto font-semibold shadow-violet px-6"
              >
                Cập nhật mật khẩu
              </Button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
