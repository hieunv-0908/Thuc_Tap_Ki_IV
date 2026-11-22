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
  KeyRound,
  Send,
  RefreshCw,
  MapPin,
  Award,
  Crown,
  Coins,
  Sparkles,
} from 'lucide-react';
import { useAuthStore } from '../store/authStore';
import { userApi } from '../api/user';
import { orderApi } from '../api/order';
import { authApi } from '../api/auth';
import { toast } from '../store/toastStore';
import { isValidPassword, isValidPhone } from '../utils/validators';
import { formatDate } from '../utils/formatDate';
import { formatCurrency } from '../utils/formatCurrency';
import Input from '../components/ui/Input';
import Button from '../components/ui/Button';
import Badge from '../components/ui/Badge';
import Skeleton from '../components/ui/Skeleton';
import AddressBook from '../components/profile/AddressBook';

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
  const [activeTab, setActiveTab] = useState('info');

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

  // Form 2: Đổi mật khẩu kèm xác thực OTP Gmail
  const [passwordForm, setPasswordForm] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  });
  const [otp, setOtp] = useState('');
  const [isSendingOtp, setIsSendingOtp] = useState(false);
  const [otpSent, setOtpSent] = useState(false);
  const [resendCountdown, setResendCountdown] = useState(0);
  const [canResend, setCanResend] = useState(true);
  const [passwordErrors, setPasswordErrors] = useState({});
  const [passwordSubmitting, setPasswordSubmitting] = useState(false);
  const [passwordServerError, setPasswordServerError] = useState('');

  // Đếm ngược thời gian gửi lại mã OTP
  useEffect(() => {
    let timer;
    if (resendCountdown > 0) {
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
    return () => {
      if (timer) clearInterval(timer);
    };
  }, [resendCountdown]);

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
      passwordForm.confirmPassword ||
      otp
    );
  }, [passwordForm, otp]);

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

  // --- Form 2 Handlers: Đổi mật khẩu với OTP Gmail ---
  const handleSendOtp = async () => {
    const targetEmail = (profileData?.email || storeUser?.email || '').trim();
    if (!targetEmail) {
      toast.error('Không tìm thấy địa chỉ email tài khoản để nhận mã OTP.');
      return;
    }

    if (!canResend || isSendingOtp) return;

    try {
      setIsSendingOtp(true);
      setPasswordServerError('');
      const res = await authApi.forgotPassword({ email: targetEmail });
      setOtpSent(true);
      setResendCountdown(60);
      setCanResend(false);
      toast.success(res?.message || `Mã OTP đã được gửi đến email ${targetEmail}.`);
    } catch (err) {
      toast.error(err.message || 'Không thể gửi mã OTP. Vui lòng thử lại sau.');
    } finally {
      setIsSendingOtp(false);
    }
  };

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

    if (!otp.trim()) {
      newErrors.otp = 'Vui lòng nhấn "Lấy mã OTP" và nhập mã 6 số từ Gmail';
    } else if (!/^\d{6}$/.test(otp.trim())) {
      newErrors.otp = 'Mã OTP phải gồm 6 chữ số';
    }

    if (Object.keys(newErrors).length > 0) {
      setPasswordErrors(newErrors);
      return;
    }

    const targetEmail = (profileData?.email || storeUser?.email || '').trim();
    if (!targetEmail) {
      setPasswordServerError('Không tìm thấy email của tài khoản.');
      return;
    }

    setPasswordSubmitting(true);
    try {
      // Bước 1: Xác thực OTP và lấy resetToken
      const verifyRes = await authApi.verifyResetOtp({
        email: targetEmail,
        otp: otp.trim(),
      });

      const resetToken = verifyRes?.resetToken;
      if (!resetToken) {
        throw new Error('Mã OTP không hợp lệ hoặc đã hết hạn.');
      }

      // Bước 2: Cập nhật mật khẩu mới bằng resetToken
      await authApi.resetPassword({
        resetToken,
        newPassword: passwordForm.newPassword,
        confirmPassword: passwordForm.confirmPassword,
      });

      setPasswordForm({
        currentPassword: '',
        newPassword: '',
        confirmPassword: '',
      });
      setOtp('');
      setOtpSent(false);
      setResendCountdown(0);
      setCanResend(true);

      toast.success('Đổi mật khẩu thành công!');
    } catch (err) {
      setPasswordServerError(err.message || 'Không thể đổi mật khẩu. Vui lòng kiểm tra lại mã OTP.');
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

        {/* --- Card VIP Member & Tích Điểm Đổi Quà --- */}
        {(() => {
          const tier = profileData?.membershipTier || 'BRONZE';
          const points = Number(profileData?.rewardPoints || 0);
          const spending = Number(profileData?.totalSpending || 0);
          const nextTierNeeded = Number(profileData?.nextTierSpending || 0);

          const tierConfigs = {
            BRONZE: {
              name: 'Thành viên Đồng',
              badgeBg: 'bg-amber-100 text-amber-800 border-amber-300',
              gradient: 'from-amber-600 via-orange-600 to-amber-700',
              nextTierName: 'Bạc',
              nextThreshold: 2000000,
              icon: Award,
            },
            SILVER: {
              name: 'Thành viên Bạc',
              badgeBg: 'bg-slate-100 text-slate-800 border-slate-300',
              gradient: 'from-slate-600 via-slate-700 to-zinc-800',
              nextTierName: 'Vàng',
              nextThreshold: 5000000,
              icon: Award,
            },
            GOLD: {
              name: 'Thành viên Vàng',
              badgeBg: 'bg-yellow-100 text-yellow-800 border-yellow-300',
              gradient: 'from-amber-500 via-yellow-600 to-amber-600',
              nextTierName: 'Kim Cương',
              nextThreshold: 10000000,
              icon: Crown,
            },
            DIAMOND: {
              name: 'Thành viên Kim Cương',
              badgeBg: 'bg-purple-100 text-purple-800 border-purple-300',
              gradient: 'from-indigo-600 via-purple-600 to-pink-600',
              nextTierName: null,
              nextThreshold: 10000000,
              icon: Crown,
            },
          };

          const config = tierConfigs[tier] || tierConfigs.BRONZE;
          const TierIcon = config.icon;

          // Tính % tiến độ lên hạng kế tiếp
          let progressPercent = 100;
          if (config.nextThreshold && spending < config.nextThreshold) {
            progressPercent = Math.min(100, Math.max(5, Math.round((spending / config.nextThreshold) * 100)));
          }

          return (
            <div className={`relative overflow-hidden rounded-2xl bg-gradient-to-r ${config.gradient} text-white p-5 sm:p-6 mb-6 shadow-lg`}>
              <div className="absolute -right-8 -bottom-8 opacity-15 pointer-events-none select-none">
                <TierIcon className="size-48" />
              </div>

              <div className="relative z-10 space-y-4">
                <div className="flex items-center justify-between gap-3 flex-wrap">
                  <div className="flex items-center gap-2.5">
                    <div className="size-10 rounded-xl bg-white/20 backdrop-blur-md flex items-center justify-center border border-white/30 shadow-inner">
                      <TierIcon className="size-5 text-yellow-300" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-xs uppercase font-extrabold tracking-wider text-white/80">Hạng Thành Viên</span>
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-white text-gray-900 shadow-2xs">
                          {config.name}
                        </span>
                      </div>
                      <h3 className="text-lg font-black tracking-tight text-white mt-0.5">
                        FunnyShop VIP Club
                      </h3>
                    </div>
                  </div>

                  <div className="text-right">
                    <span className="text-xs text-white/80 block">Điểm tích lũy Funny</span>
                    <div className="flex items-center justify-end gap-1.5 text-xl sm:text-2xl font-black text-yellow-300">
                      <Coins className="size-5 text-yellow-300" />
                      <span>{points.toLocaleString('vi-VN')}</span>
                      <span className="text-xs font-semibold text-white/80">điểm</span>
                    </div>
                    <span className="text-[10px] text-white/75 block">
                      ≈ {formatCurrency(points * 1000)} (dùng giảm trực tiếp khi mua hàng)
                    </span>
                  </div>
                </div>

                {/* Thanh tiến độ lên hạng */}
                <div className="pt-2 border-t border-white/20 space-y-1.5">
                  <div className="flex justify-between items-center text-xs text-white/90">
                    <span>
                      Tổng chi tiêu tích lũy: <strong className="text-white font-bold">{formatCurrency(spending)}</strong>
                    </span>
                    {config.nextTierName ? (
                      <span className="text-white/80">
                        Hạng tiếp theo: <strong className="text-yellow-300">{config.nextTierName}</strong>
                      </span>
                    ) : (
                      <span className="text-yellow-300 font-bold flex items-center gap-1">
                        <Sparkles className="size-3.5" /> Hạng tối cao
                      </span>
                    )}
                  </div>

                  <div className="w-full bg-black/25 rounded-full h-2.5 overflow-hidden p-0.5 border border-white/20">
                    <div
                      className="bg-gradient-to-r from-yellow-300 to-amber-200 h-full rounded-full transition-all duration-500 shadow-xs"
                      style={{ width: `${progressPercent}%` }}
                    />
                  </div>

                  <div className="flex justify-between items-center text-[11px] text-white/75">
                    {nextTierNeeded > 0 && config.nextTierName ? (
                      <span>
                        Chi tiêu thêm <strong>{formatCurrency(nextTierNeeded)}</strong> để thăng hạng <strong>{config.nextTierName}</strong>
                      </span>
                    ) : (
                      <span>Bạn đang tận hưởng trọn vẹn đặc quyền VIP cao nhất tại FunnyShop!</span>
                    )}
                    <span>{progressPercent}%</span>
                  </div>
                </div>
              </div>
            </div>
          );
        })()}

        {/* --- Tab Navigation --- */}
        <div className="flex items-center gap-2 mb-6 p-1.5 rounded-2xl bg-white border border-line shadow-xs">
          <button
            type="button"
            onClick={() => setActiveTab('info')}
            className={`flex-1 flex items-center justify-center gap-2 py-2.5 px-3 rounded-xl text-xs sm:text-sm font-bold transition-all cursor-pointer ${
              activeTab === 'info'
                ? 'bg-primary-50 text-primary-700 shadow-xs ring-1 ring-primary-200'
                : 'text-ink-muted hover:text-ink hover:bg-gray-50'
            }`}
          >
            <User className="size-4" />
            <span>Thông tin cá nhân</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('address')}
            className={`flex-1 flex items-center justify-center gap-2 py-2.5 px-3 rounded-xl text-xs sm:text-sm font-bold transition-all cursor-pointer ${
              activeTab === 'address'
                ? 'bg-primary-50 text-primary-700 shadow-xs ring-1 ring-primary-200'
                : 'text-ink-muted hover:text-ink hover:bg-gray-50'
            }`}
          >
            <MapPin className="size-4" />
            <span>Sổ địa chỉ</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('password')}
            className={`flex-1 flex items-center justify-center gap-2 py-2.5 px-3 rounded-xl text-xs sm:text-sm font-bold transition-all cursor-pointer ${
              activeTab === 'password'
                ? 'bg-secondary-50 text-secondary-700 shadow-xs ring-1 ring-secondary-200'
                : 'text-ink-muted hover:text-ink hover:bg-gray-50'
            }`}
          >
            <Lock className="size-4" />
            <span>Đổi mật khẩu</span>
          </button>
        </div>

        {/* Tab 1: Form Thông tin (Design.md 7.7) */}
        {activeTab === 'info' && (
          <div className="rounded-2xl border border-line bg-white shadow-soft p-5 sm:p-6 mb-6 animate-in fade-in duration-150">
            {/* Header sticker icon User */}
            <div className="flex items-center gap-3 mb-5 pb-4 border-b border-line">
              <div className="grid size-10 place-items-center rounded-xl bg-primary-100 text-primary-700 -rotate-3 shrink-0">
                <User className="size-5" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-ink">Thông tin cá nhân</h3>
                <p className="text-xs text-ink-muted">Cập nhật họ tên và số điện thoại liên hệ</p>
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
        )}

        {/* Tab 2: Sổ địa chỉ nhận hàng */}
        {activeTab === 'address' && (
          <div className="rounded-2xl border border-line bg-white shadow-soft p-5 sm:p-6 mb-6 animate-in fade-in duration-150">
            <AddressBook />
          </div>
        )}

        {/* Tab 3: Form Đổi mật khẩu (Design.md 7.7) */}
        {activeTab === 'password' && (
          <div className="rounded-2xl border border-line bg-white shadow-soft p-5 sm:p-6 animate-in fade-in duration-150">
            {/* Header sticker icon Lock */}
            <div className="flex items-center gap-3 mb-5 pb-4 border-b border-line">
              <div className="grid size-10 place-items-center rounded-xl bg-secondary-100 text-secondary-700 rotate-3 shrink-0">
                <Lock className="size-5" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-ink">Đổi mật khẩu</h3>
                <p className="text-xs text-ink-muted">Bảo mật tài khoản thông qua xác thực OTP Gmail</p>
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

              {/* Mã xác thực OTP gửi về Gmail */}
              <div className="rounded-xl border border-line bg-gray-50/70 p-4 space-y-2">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1">
                  <label htmlFor="profile-otp" className="text-sm font-semibold text-ink flex items-center gap-1.5">
                    <KeyRound className="size-4 text-primary-700" />
                    <span>Mã xác thực OTP (từ Gmail)</span>
                    <span className="text-red-500">*</span>
                  </label>
                  <span className="text-xs text-ink-muted">
                    Gửi tới: <strong className="text-ink">{profileData?.email || storeUser?.email}</strong>
                  </span>
                </div>

                <div className="flex gap-2 items-start pt-1">
                  <div className="flex-1">
                    <Input
                      id="profile-otp"
                      name="otp"
                      type="text"
                      maxLength={6}
                      value={otp}
                      onChange={(e) => {
                        setOtp(e.target.value.replace(/\D/g, '').slice(0, 6));
                        if (passwordErrors.otp) {
                          setPasswordErrors((prev) => ({ ...prev, otp: '' }));
                        }
                      }}
                      placeholder="Nhập mã 6 số"
                      error={passwordErrors.otp}
                      disabled={passwordSubmitting}
                    />
                  </div>

                  <Button
                    type="button"
                    variant={otpSent ? 'outline' : 'primary'}
                    size="md"
                    onClick={handleSendOtp}
                    loading={isSendingOtp}
                    disabled={isSendingOtp || (!canResend && resendCountdown > 0) || passwordSubmitting}
                    leftIcon={otpSent ? RefreshCw : Send}
                    className="shrink-0 h-10 px-3 sm:px-4 text-xs font-semibold cursor-pointer"
                  >
                    {isSendingOtp
                      ? 'Đang gửi...'
                      : resendCountdown > 0
                      ? `Gửi lại (${resendCountdown}s)`
                      : otpSent
                      ? 'Gửi lại mã'
                      : 'Nhận mã OTP'}
                  </Button>
                </div>

                {otpSent && (
                  <p className="text-xs text-emerald-600 font-medium flex items-center gap-1 mt-1.5">
                    <Check className="size-3.5" />
                    <span>Mã OTP đã được gửi đến Gmail của bạn. Vui lòng kiểm tra hòm thư!</span>
                  </p>
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
        )}
      </div>
    </div>
  );
}
