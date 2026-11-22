import { useState, useEffect, useMemo } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import {
  CheckCircle2,
  AlertCircle,
  MapPin,
  Wallet,
  ArrowLeft,
  Lock,
  Clock,
  Package,
  Truck,
  Ticket,
  X,
  Tag,
  CreditCard,
  ExternalLink,
  Plus,
  Check,
} from 'lucide-react';
import { useCartStore } from '../store/cartStore';
import { useAuthStore } from '../store/authStore';
import { orderApi } from '../api/order';
import { voucherApi } from '../api/voucher';
import { addressApi } from '../api/address';
import VoucherSelectorModal from '../components/voucher/VoucherSelectorModal';
import AddressModal from '../components/address/AddressModal';
import { toast } from '../store/toastStore';
import { formatCurrency } from '../utils/formatCurrency';
import { formatDate } from '../utils/formatDate';
import { isValidPhone, isValidAddress } from '../utils/validators';
import StepIndicator from '../components/ui/StepIndicator';
import Input from '../components/ui/Input';
import Button from '../components/ui/Button';
import PayOSQRModal from '../components/payment/PayOSQRModal';

/**
 * Checkout page component complying with Design.md 7.5 (v2.0)
 */
export default function Checkout() {
  const navigate = useNavigate();
  const location = useLocation();
  const { items, removeItems } = useCartStore();
  const { user } = useAuthStore();

  // Xác định danh sách sản phẩm cần thanh toán (từ state Mua ngay / Chọn trong giỏ, hoặc fallback giỏ hàng)
  const isDirectBuy = Boolean(location.state?.isDirectBuy);
  const checkoutItems = useMemo(() => {
    if (Array.isArray(location.state?.checkoutItems) && location.state.checkoutItems.length > 0) {
      return location.state.checkoutItems;
    }
    return items;
  }, [location.state?.checkoutItems, items]);

  const [formData, setFormData] = useState({
    fullName: user?.fullName || '',
    phone: '',
    address: '',
    note: '',
  });

  const [errors, setErrors] = useState({});
  const [serverError, setServerError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [createdOrder, setCreatedOrder] = useState(null);
  const [paymentMethod, setPaymentMethod] = useState('COD');
  const [pendingPayOSOrder, setPendingPayOSOrder] = useState(null);
  const [showPayOSModal, setShowPayOSModal] = useState(false);

  // Address states
  const [addresses, setAddresses] = useState([]);
  const [selectedAddressId, setSelectedAddressId] = useState(null);
  const [showAddressModal, setShowAddressModal] = useState(false);
  const [isCreatingAddress, setIsCreatingAddress] = useState(false);
  const [isCustomAddress, setIsCustomAddress] = useState(false);

  // Sinh Idempotency Key theo vòng đời trang Checkout (chống tạo đơn trùng khi click đúp/lag mạng)
  const [idempotencyKey, setIdempotencyKey] = useState(() => {
    return typeof crypto !== 'undefined' && crypto.randomUUID
      ? crypto.randomUUID()
      : 'order-' + Date.now() + '-' + Math.random().toString(36).substring(2, 9);
  });

  const totalPrice = useMemo(() => {
    return checkoutItems.reduce((acc, i) => {
      const p = Number(i.price ?? i.product?.price ?? 0);
      return acc + p * (i.quantity || 1);
    }, 0);
  }, [checkoutItems]);

  const totalCount = useMemo(() => {
    return checkoutItems.reduce((acc, i) => acc + (i.quantity || 1), 0);
  }, [checkoutItems]);

  // Voucher states
  const [voucherInput, setVoucherInput] = useState('');
  const [appliedVoucher, setAppliedVoucher] = useState(null);
  const [isApplyingVoucher, setIsApplyingVoucher] = useState(false);
  const [isVoucherModalOpen, setIsVoucherModalOpen] = useState(false);

  const discountAmount = appliedVoucher ? Number(appliedVoucher.discountAmount || 0) : 0;
  const finalTotal = Math.max(0, totalPrice - discountAmount);

  const handleApplyVoucher = async (codeOverride) => {
    const code = (codeOverride || voucherInput).trim().toUpperCase();
    if (!code) {
      toast.error('Vui lòng nhập mã giảm giá');
      return;
    }
    setIsApplyingVoucher(true);
    try {
      const res = await voucherApi.applyVoucher(code, totalPrice);
      if (res.valid) {
        setAppliedVoucher(res);
        setVoucherInput(res.voucherCode);
        toast.success(`Áp dụng mã ${res.voucherCode} thành công! Giảm ${formatCurrency(res.discountAmount)}`);
      }
    } catch (err) {
      toast.error(err.response?.data?.message || err.message || 'Không thể áp dụng mã giảm giá');
    } finally {
      setIsApplyingVoucher(false);
    }
  };

  const handleRemoveVoucher = () => {
    setAppliedVoucher(null);
    setVoucherInput('');
    toast.info('Đã hủy áp dụng mã giảm giá');
  };

  // Tải sổ địa chỉ nhận hàng của người dùng nếu đã đăng nhập
  useEffect(() => {
    if (!user) return;
    let isMounted = true;
    addressApi
      .getMyAddresses()
      .then((res) => {
        if (!isMounted) return;
        const list = Array.isArray(res) ? res : res?.data || [];
        setAddresses(list);
        if (list.length > 0) {
          const defaultAddr = list.find((a) => a.isDefault) || list[0];
          setSelectedAddressId(defaultAddr.id);
          setFormData((prev) => ({
            ...prev,
            fullName: defaultAddr.recipientName || prev.fullName,
            phone: defaultAddr.phone || prev.phone,
            address: defaultAddr.fullAddress || prev.address,
          }));
        }
      })
      .catch((err) => {
        console.warn('Lỗi tải sổ địa chỉ:', err);
      });

    return () => {
      isMounted = false;
    };
  }, [user]);

  const handleSelectAddress = (addr) => {
    setSelectedAddressId(addr.id);
    setIsCustomAddress(false);
    setFormData((prev) => ({
      ...prev,
      fullName: addr.recipientName,
      phone: addr.phone,
      address: addr.fullAddress,
    }));
    setErrors((prev) => ({ ...prev, fullName: '', phone: '', address: '' }));
  };

  const handleCreateAddressQuick = async (payload) => {
    try {
      setIsCreatingAddress(true);
      const newAddr = await addressApi.createAddress(payload);
      toast.success('Thêm địa chỉ mới thành công!');
      setShowAddressModal(false);
      const res = await addressApi.getMyAddresses();
      const list = Array.isArray(res) ? res : res?.data || [];
      setAddresses(list);
      const target = list.find((a) => a.id === newAddr.id) || newAddr;
      handleSelectAddress(target);
    } catch (err) {
      toast.error(err.response?.data?.message || err.message || 'Không thể thêm địa chỉ');
    } finally {
      setIsCreatingAddress(false);
    }
  };

  // Redirect if checkout list is empty and no order has just been created
  useEffect(() => {
    if (checkoutItems.length === 0 && !createdOrder) {
      navigate('/cart', { replace: true });
    }
  }, [checkoutItems.length, createdOrder, navigate]);

  const validateField = (name, value) => {
    let error = '';
    if (name === 'fullName') {
      if (!value.trim()) {
        error = 'Vui lòng nhập họ và tên người nhận';
      }
    } else if (name === 'phone') {
      if (!value.trim()) {
        error = 'Vui lòng nhập số điện thoại';
      } else if (!isValidPhone(value)) {
        error = 'Số điện thoại không hợp lệ (ví dụ: 0912345678)';
      }
    } else if (name === 'address') {
      if (!value.trim()) {
        error = 'Vui lòng nhập địa chỉ giao hàng';
      } else if (!isValidAddress(value)) {
        error = 'Địa chỉ tối thiểu 10 ký tự';
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
    if (e?.preventDefault) e.preventDefault();
    if (isSubmitting) return;

    if (checkoutItems.length === 0) {
      toast.error('Không có sản phẩm nào trong danh sách thanh toán.');
      return;
    }

    setServerError('');

    const nameErr = validateField('fullName', formData.fullName);
    const phoneErr = validateField('phone', formData.phone);
    const addressErr = validateField('address', formData.address);

    if (nameErr || phoneErr || addressErr) {
      setErrors({
        fullName: nameErr,
        phone: phoneErr,
        address: addressErr,
      });
      toast.error(nameErr || phoneErr || addressErr || 'Vui lòng kiểm tra lại thông tin nhận hàng');
      return;
    }

    setIsSubmitting(true);

    try {
      const orderPayload = {
        fullName: formData.fullName.trim(),
        phone: formData.phone.trim(),
        address: formData.address.trim(),
        paymentMethod: paymentMethod,
        idempotencyKey,
        voucherCode: appliedVoucher ? appliedVoucher.voucherCode : undefined,
        items: checkoutItems.map((i) => ({
          variantId: i.variantId || undefined,
          productId: i.productId || i.product?.id,
          quantity: i.quantity,
        })),
      };

      const result = await orderApi.createOrder(orderPayload);

      // Nếu phương thức thanh toán là COD: Xác nhận đặt hàng thành công ngay
      if (paymentMethod !== 'PAYOS') {
        if (!isDirectBuy) {
          const paidKeys = checkoutItems.map(
            (i) => i.cartItemId || (i.variantId ? `var-${i.variantId}` : `prod-${i.productId || i.id}`)
          );
          removeItems(paidKeys);
        }

        if (typeof crypto !== 'undefined' && crypto.randomUUID) {
          setIdempotencyKey(crypto.randomUUID());
        }

        setCreatedOrder(result);
        toast.success('Đặt hàng thành công!');
      } else {
        // Nếu phương thức thanh toán là PayOS Online:
        // CHƯA xóa giỏ hàng, mở Modal QR và giữ người dùng tại trang thanh toán
        setPendingPayOSOrder(result);
        setShowPayOSModal(true);
      }
    } catch (err) {
      setServerError(
        err.message || 'Không thể đặt hàng. Vui lòng kiểm tra lại thông tin.'
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  // Chỉ khi thanh toán thành công mới xóa giỏ hàng và chuyển sang màn hình "Đặt hàng thành công"
  const handlePayOSSuccess = () => {
    setShowPayOSModal(false);

    if (!isDirectBuy) {
      const paidKeys = checkoutItems.map(
        (i) => i.cartItemId || (i.variantId ? `var-${i.variantId}` : `prod-${i.productId || i.id}`)
      );
      removeItems(paidKeys);
    }

    if (typeof crypto !== 'undefined' && crypto.randomUUID) {
      setIdempotencyKey(crypto.randomUUID());
    }

    setCreatedOrder({
      ...(pendingPayOSOrder || {}),
      paymentStatus: 'PAID',
      status: 'PROCESSING',
    });
    setPendingPayOSOrder(null);
    toast.success('Thanh toán thành công! Đơn hàng của bạn đã được ghi nhận.');
  };

  // Nếu chưa thanh toán mà tắt cửa sổ QR: Ở lại trang đặt hàng, chưa đặt được hàng
  const handlePayOSClose = async () => {
    setShowPayOSModal(false);

    if (pendingPayOSOrder?.id) {
      const orderIdToCancel = pendingPayOSOrder.id;
      setPendingPayOSOrder(null);
      try {
        await orderApi.cancelOrder(orderIdToCancel, 'Khách hàng hủy thanh toán trực tuyến');
      } catch {
        // Bỏ qua lỗi nếu đơn đã được xử lý
      }
    }

    // Cấp Idempotency Key mới để khách hàng có thể bấm đặt lại
    if (typeof crypto !== 'undefined' && crypto.randomUUID) {
      setIdempotencyKey(crypto.randomUUID());
    }

    toast.warning('Bạn chưa hoàn tất thanh toán. Đơn hàng chưa được đặt.');
  };

  // Màn hình "Đặt hàng thành công" per Design.md 7.5 (v2.0)
  if (createdOrder) {
    return (
      <div className="min-h-[calc(100vh-8rem)] py-8 md:py-16 px-4 bg-gradient-to-br from-primary-50 via-white to-secondary-50 relative overflow-hidden">
        {/* Step Indicator fully completed */}
        <div className="max-w-2xl mx-auto mb-8">
          <StepIndicator currentStep={2} />
        </div>

        <div className="relative z-10 max-w-2xl mx-auto bg-white rounded-3xl border border-line p-6 sm:p-10 shadow-soft text-center animate-in fade-in zoom-in-95 duration-200">
          {/* Confetti / floating emojis */}
          <span
            className="absolute top-6 left-8 text-4xl opacity-50 animate-[float_5s_ease-in-out_infinite] pointer-events-none select-none"
            aria-hidden="true"
          >
            🎉
          </span>
          <span
            className="absolute top-6 right-8 text-4xl opacity-50 animate-[float-slow_8s_ease-in-out_infinite] pointer-events-none select-none"
            aria-hidden="true"
          >
            🎈
          </span>

          {/* Animated check circle */}
          <div className="size-20 rounded-full bg-green-50 text-green-600 border border-green-200 flex items-center justify-center mx-auto mb-4 animate-[pop_300ms_ease-out]">
            <CheckCircle2 className="size-12 text-green-600" aria-hidden="true" />
          </div>

          <h1 className="text-2xl sm:text-3xl font-extrabold text-ink mb-2">
            Đặt hàng thành công!
          </h1>
          <p className="text-sm text-ink-muted max-w-md mx-auto mb-8">
            Cảm ơn bạn đã lựa chọn FunnyShop. Đơn hàng của bạn đã được ghi nhận và đang chuẩn bị đóng gói!
          </p>

          {/* Ticket Card for Order Info (Design.md 7.5: border-2 border-dashed border-primary-200 bg-white p-6) */}
          <div className="rounded-2xl border-2 border-dashed border-primary-200 bg-primary-50/40 p-5 sm:p-6 mb-8 text-left space-y-3.5">
            <div className="flex justify-between items-center border-b border-primary-100 pb-3">
              <span className="text-xs sm:text-sm text-ink-muted">Mã đơn hàng:</span>
              <span className="text-2xl sm:text-3xl font-extrabold text-primary-700">
                #{createdOrder.id}
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs sm:text-sm">
              <div>
                <span className="text-ink-muted block text-xs">Người nhận:</span>
                <span className="font-semibold text-ink">{createdOrder.fullName}</span>
              </div>
              <div>
                <span className="text-ink-muted block text-xs">Số điện thoại:</span>
                <span className="font-semibold text-ink">{createdOrder.phone}</span>
              </div>
            </div>

            <div className="text-xs sm:text-sm">
              <span className="text-ink-muted block text-xs">Địa chỉ giao nhận:</span>
              <span className="font-medium text-ink leading-relaxed">{createdOrder.address}</span>
            </div>

            <div className="text-xs sm:text-sm">
              <span className="text-ink-muted block text-xs">Thời gian đặt:</span>
              <span className="font-medium text-ink">{formatDate(createdOrder.createdAt || new Date())}</span>
            </div>

            <div className="flex justify-between items-center border-t border-primary-100 pt-3">
              <div>
                <span className="text-xs text-ink-muted block">Phương thức:</span>
                <span className="text-xs font-semibold text-secondary-700">
                  {createdOrder.paymentMethod === 'PAYOS'
                    ? 'Thanh toán online qua PayOS (VietQR)'
                    : 'Thanh toán khi nhận hàng (COD)'}
                </span>
                {createdOrder.paymentMethod === 'PAYOS' && (
                  <span className={`inline-block mt-0.5 text-[11px] font-bold px-2 py-0.5 rounded-full ${createdOrder.paymentStatus === 'PAID'
                      ? 'bg-green-100 text-green-700'
                      : 'bg-amber-100 text-amber-700'
                    }`}>
                    {createdOrder.paymentStatus === 'PAID' ? '✓ Đã thanh toán' : '⏳ Chờ thanh toán'}
                  </span>
                )}
              </div>
              <div className="text-right">
                <span className="text-xs text-ink-muted block">Tổng tiền:</span>
                <span className="text-xl font-extrabold text-primary-700">
                  {formatCurrency(createdOrder.totalPrice || totalPrice)}
                </span>
              </div>
            </div>
          </div>

          {/* Banner thúc đẩy thanh toán nếu là PayOS và chưa thanh toán */}
          {createdOrder.paymentMethod === 'PAYOS' && createdOrder.paymentStatus !== 'PAID' && createdOrder.paymentUrl && (
            <div className="mb-8 p-5 rounded-2xl bg-secondary-50 border-2 border-secondary-300 text-left space-y-3">
              <div className="flex items-start gap-3">
                <div className="size-10 rounded-xl bg-secondary-600 text-white flex items-center justify-center shrink-0">
                  <CreditCard className="size-5" />
                </div>
                <div>
                  <h4 className="font-bold text-ink text-sm sm:text-base">
                    Hoàn tất thanh toán qua PayOS (VietQR)
                  </h4>
                  <p className="text-xs text-ink-muted mt-1 leading-relaxed">
                    Đơn hàng đã được tạo. Vui lòng bấm nút bên dưới để chuyển sang cổng PayOS quét mã VietQR hoặc chuyển khoản ngân hàng tự động duyệt 24/7.
                  </p>
                </div>
              </div>

              <div className="pt-2">
                <a
                  href={createdOrder.paymentUrl}
                  className="w-full inline-flex items-center justify-center gap-2 h-11 px-5 rounded-xl bg-secondary-600 hover:bg-secondary-700 text-white font-bold text-sm shadow-md transition-all cursor-pointer"
                >
                  <span>Thanh toán ngay bằng PayOS</span>
                  <ExternalLink className="size-4" />
                </a>
              </div>
            </div>
          )}

          {/* Next Steps (Design.md 7.5: 3 bước mờ Chờ xử lý -> Đang xử lý -> Đang giao) */}
          <div className="mb-8 p-4 rounded-xl bg-gray-50 border border-line text-left">
            <h4 className="text-xs font-bold uppercase tracking-wider text-ink-muted mb-3">
              Các bước tiếp theo:
            </h4>
            <div className="grid grid-cols-3 gap-2 text-center text-xs">
              <div className="flex flex-col items-center gap-1.5 p-2 rounded-lg bg-white border border-primary-200 text-primary-700 font-semibold">
                <Clock className="size-4" />
                <span>1. Chờ xử lý</span>
              </div>
              <div className="flex flex-col items-center gap-1.5 p-2 rounded-lg bg-white border border-line text-ink-muted">
                <Package className="size-4" />
                <span>2. Đang xử lý</span>
              </div>
              <div className="flex flex-col items-center gap-1.5 p-2 rounded-lg bg-white border border-line text-ink-muted">
                <Truck className="size-4" />
                <span>3. Đang giao</span>
              </div>
            </div>
          </div>

          {/* 2 Action Buttons: "Xem đơn hàng" (primary) + "Tiếp tục mua sắm" (outline) */}
          <div className="flex flex-col sm:flex-row items-center justify-center gap-3 sm:gap-4 max-w-md mx-auto">
            <Button
              variant="primary"
              size="lg"
              fullWidth
              onClick={() => navigate(`/orders/${createdOrder.id}`)}
              className="font-bold shadow-brand"
            >
              Xem đơn hàng
            </Button>
            <Button
              variant="outline"
              size="lg"
              fullWidth
              onClick={() => navigate('/')}
            >
              Tiếp tục mua sắm
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto w-full max-w-7xl px-4 sm:px-6 lg:px-8 py-6 md:py-10 space-y-6">
      {/* 3-Step Indicator on top (Design.md 7.5) */}
      <StepIndicator currentStep={1} />

      {/* Breadcrumb / Back Link */}
      <div>
        <Link
          to="/cart"
          className="inline-flex items-center gap-1.5 text-sm font-semibold text-ink-muted hover:text-primary-700 transition-colors"
        >
          <ArrowLeft className="size-4" />
          Quay lại giỏ hàng
        </Link>
        <h1 className="text-2xl md:text-3xl font-extrabold text-ink mt-2">
          Thông tin giao hàng & Đặt hàng
        </h1>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
        {/* Left Column: Numbered Cards Form (2 cols) */}
        <div className="lg:col-span-2 space-y-6">
          {/* Server Error Alert */}
          {serverError && (
            <div
              className="bg-red-50 border border-red-200 text-red-800 p-4 rounded-xl flex items-start gap-3 animate-in fade-in duration-150"
              role="alert"
            >
              <AlertCircle className="size-5 shrink-0 text-red-600 mt-0.5" />
              <div className="text-sm">
                <p className="font-semibold">Không thể hoàn tất đơn hàng</p>
                <p className="mt-0.5">{serverError}</p>
              </div>
            </div>
          )}

          <form id="checkout-form" onSubmit={handleSubmit} noValidate className="space-y-6">
            {/* Card 1: MapPin Thông tin nhận hàng (Design.md 7.5) */}
            <div className="bg-white rounded-2xl border border-line p-5 sm:p-7 shadow-soft space-y-5">
              <div className="flex items-center justify-between border-b border-line pb-4 flex-wrap gap-2">
                <div className="flex items-center gap-3">
                  <div className="size-9 rounded-xl bg-primary-100 text-primary-700 flex items-center justify-center font-bold shrink-0">
                    <MapPin className="size-5" />
                  </div>
                  <div>
                    <h3 className="text-base sm:text-lg font-bold text-ink">
                      1. Thông tin nhận hàng
                    </h3>
                    <p className="text-xs text-ink-muted">
                      Chọn từ sổ địa chỉ đã lưu hoặc nhập địa chỉ mới
                    </p>
                  </div>
                </div>

                {user && (
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    leftIcon={Plus}
                    onClick={() => setShowAddressModal(true)}
                    className="font-semibold text-xs py-1.5 px-3"
                  >
                    Thêm địa chỉ mới
                  </Button>
                )}
              </div>

              {/* Danh sách địa chỉ đã lưu (nếu có) */}
              {addresses.length > 0 && (
                <div className="space-y-3">
                  <div className="flex items-center justify-between text-xs font-semibold text-ink-muted">
                    <span>ĐỊA CHỈ ĐÃ LƯU ({addresses.length}):</span>
                    <button
                      type="button"
                      onClick={() => setIsCustomAddress(!isCustomAddress)}
                      className="text-primary-700 hover:underline cursor-pointer"
                    >
                      {isCustomAddress ? '← Chọn địa chỉ có sẵn' : '+ Nhập địa chỉ khác'}
                    </button>
                  </div>

                  {!isCustomAddress && (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      {addresses.map((addr) => {
                        const isSelected = selectedAddressId === addr.id;
                        const isHome = addr.addressType === 'HOME';
                        return (
                          <div
                            key={addr.id}
                            onClick={() => handleSelectAddress(addr)}
                            className={`p-3.5 rounded-xl border text-xs sm:text-sm cursor-pointer transition-all flex flex-col justify-between ${
                              isSelected
                                ? 'border-primary-500 bg-primary-50/50 ring-2 ring-primary-200 shadow-xs'
                                : 'border-line bg-white hover:border-primary-200'
                            }`}
                          >
                            <div className="space-y-1.5">
                              <div className="flex items-center justify-between gap-1.5">
                                <span className="font-bold text-ink truncate">
                                  {addr.recipientName}
                                </span>
                                <div className="flex items-center gap-1 shrink-0">
                                  {addr.isDefault && (
                                    <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-md bg-green-100 text-green-700">
                                      Mặc định
                                    </span>
                                  )}
                                  <span
                                    className={`text-[10px] font-medium px-1.5 py-0.5 rounded-md ${
                                      isHome
                                        ? 'bg-primary-100 text-primary-700'
                                        : 'bg-secondary-100 text-secondary-700'
                                    }`}
                                  >
                                    {isHome ? 'Nhà riêng' : 'Văn phòng'}
                                  </span>
                                </div>
                              </div>

                              <p className="text-ink-muted font-medium flex items-center gap-1">
                                <span>{addr.phone}</span>
                              </p>

                              <p className="text-ink-muted line-clamp-2 leading-relaxed">
                                {addr.fullAddress}
                              </p>
                            </div>

                            <div className="pt-2 mt-2 border-t border-line/60 flex items-center justify-between text-xs">
                              <span
                                className={`font-semibold flex items-center gap-1 ${
                                  isSelected ? 'text-primary-700' : 'text-ink-subtle'
                                }`}
                              >
                                {isSelected ? (
                                  <>
                                    <Check className="size-3.5 stroke-[3]" />
                                    <span>Đang giao tới địa chỉ này</span>
                                  </>
                                ) : (
                                  'Bấm để chọn'
                                )}
                              </span>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              )}

              {/* Form nhập thông tin người nhận (hiện khi chưa có địa chỉ lưu hoặc bấm nhập địa chỉ khác) */}
              {(addresses.length === 0 || isCustomAddress) && (
                <div className="space-y-4 pt-2">
                  {isCustomAddress && (
                    <div className="p-3 rounded-xl bg-amber-50 border border-amber-200 text-amber-800 text-xs font-medium">
                      Bạn đang nhập địa chỉ giao hàng tùy chỉnh cho đơn hàng này.
                    </div>
                  )}

                  <Input
                    label="Họ và tên người nhận"
                    name="fullName"
                    value={formData.fullName}
                    onChange={handleChange}
                    onBlur={handleBlur}
                    placeholder="Ví dụ: Nguyễn Văn An"
                    error={errors.fullName}
                    required
                  />

                  <Input
                    label="Số điện thoại"
                    name="phone"
                    type="tel"
                    value={formData.phone}
                    onChange={handleChange}
                    onBlur={handleBlur}
                    placeholder="Ví dụ: 0912345678"
                    error={errors.phone}
                    required
                  />

                  <div className="space-y-1.5">
                    <div className="flex items-center justify-between text-sm font-medium text-ink">
                      <label htmlFor="address-textarea">
                        Địa chỉ nhận hàng <span className="text-primary-700">*</span>
                      </label>
                      <span className="text-xs text-ink-subtle">
                        {formData.address.length} ký tự
                      </span>
                    </div>
                    <textarea
                      id="address-textarea"
                      name="address"
                      rows={3}
                      value={formData.address}
                      onChange={handleChange}
                      onBlur={handleBlur}
                      placeholder="Số nhà, tên đường, phường/xã, quận/huyện, tỉnh/thành phố..."
                      aria-invalid={Boolean(errors.address)}
                      className={`w-full min-h-24 rounded-lg border bg-white px-3.5 py-2.5 text-base text-ink placeholder:text-ink-subtle focus:border-secondary-500 focus:ring-2 focus:ring-secondary-200 transition-all ${
                        errors.address ? 'border-red-500' : 'border-line'
                      }`}
                    />
                    {errors.address && (
                      <p className="flex items-center gap-1.5 text-xs text-red-700 mt-1">
                        <AlertCircle className="size-3.5 shrink-0" />
                        {errors.address}
                      </p>
                    )}
                  </div>
                </div>
              )}

              {/* Ghi chú giao hàng luôn hiển thị */}
              <div className="space-y-1.5 pt-2 border-t border-line">
                <label
                  htmlFor="note-textarea"
                  className="block text-sm font-medium text-ink"
                >
                  Ghi chú giao hàng (tùy chọn)
                </label>
                <textarea
                  id="note-textarea"
                  name="note"
                  rows={2}
                  value={formData.note}
                  onChange={handleChange}
                  placeholder="Ví dụ: Giao giờ hành chính, gọi trước khi giao 15 phút..."
                  className="w-full rounded-lg border border-line bg-white px-3.5 py-2.5 text-base text-ink placeholder:text-ink-subtle focus:border-secondary-500 focus:ring-2 focus:ring-secondary-200 transition-all"
                />
              </div>
            </div>

            {/* Card 2: Phương thức thanh toán */}
            <div className="bg-white rounded-2xl border border-line p-5 sm:p-7 shadow-soft space-y-4">
              <div className="flex items-center gap-3 border-b border-line pb-4">
                <div className="size-9 rounded-xl bg-secondary-100 text-secondary-700 flex items-center justify-center font-bold shrink-0">
                  <Wallet className="size-5" />
                </div>
                <div>
                  <h3 className="text-base sm:text-lg font-bold text-ink">
                    2. Phương thức thanh toán
                  </h3>
                  <p className="text-xs text-ink-muted">
                    Chọn hình thức thanh toán thuận tiện nhất cho bạn
                  </p>
                </div>
              </div>

              <div className="space-y-3">
                {/* Lựa chọn 1: COD */}
                <div
                  onClick={() => setPaymentMethod('COD')}
                  className={`rounded-xl border-2 p-4 flex items-center justify-between cursor-pointer transition-all ${paymentMethod === 'COD'
                      ? 'border-primary-500 bg-primary-50/50 shadow-xs'
                      : 'border-line hover:border-gray-300 bg-white'
                    }`}
                  role="radio"
                  aria-checked={paymentMethod === 'COD'}
                >
                  <div className="flex items-center gap-3.5">
                    <div className={`size-10 rounded-xl flex items-center justify-center shadow-2xs ${paymentMethod === 'COD' ? 'bg-primary-500 text-white' : 'bg-gray-100 text-ink-muted'
                      }`}>
                      <Wallet className="size-5" />
                    </div>
                    <div>
                      <h4 className="font-bold text-ink text-sm sm:text-base">
                        Thanh toán khi nhận hàng (COD)
                      </h4>
                      <p className="text-xs text-ink-muted mt-0.5">
                        Trả tiền mặt khi kiểm tra và nhận được hàng
                      </p>
                    </div>
                  </div>

                  {paymentMethod === 'COD' ? (
                    <CheckCircle2 className="size-5 text-primary-600 shrink-0" aria-hidden="true" />
                  ) : (
                    <div className="size-5 rounded-full border-2 border-line shrink-0" />
                  )}
                </div>

                {/* Lựa chọn 2: PayOS Online */}
                <div
                  onClick={() => setPaymentMethod('PAYOS')}
                  className={`rounded-xl border-2 p-4 flex items-center justify-between cursor-pointer transition-all ${paymentMethod === 'PAYOS'
                      ? 'border-secondary-500 bg-secondary-50/50 shadow-xs'
                      : 'border-line hover:border-gray-300 bg-white'
                    }`}
                  role="radio"
                  aria-checked={paymentMethod === 'PAYOS'}
                >
                  <div className="flex items-center gap-3.5">
                    <div className={`size-10 rounded-xl flex items-center justify-center shadow-2xs ${paymentMethod === 'PAYOS' ? 'bg-secondary-600 text-white' : 'bg-gray-100 text-ink-muted'
                      }`}>
                      <CreditCard className="size-5" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2 flex-wrap">
                        <h4 className="font-bold text-ink text-sm sm:text-base">
                          Thanh toán online qua PayOS (VietQR)
                        </h4>
                        <span className="inline-flex items-center gap-1 rounded-md bg-secondary-100 text-secondary-700 px-2 py-0.5 text-[10px] font-bold">
                          ✨ Tự động duyệt 24/7
                        </span>
                      </div>
                      <p className="text-xs text-ink-muted mt-0.5">
                        Quét mã VietQR chuyển khoản nhanh bằng mọi app ngân hàng
                      </p>
                    </div>
                  </div>

                  {paymentMethod === 'PAYOS' ? (
                    <CheckCircle2 className="size-5 text-secondary-600 shrink-0" aria-hidden="true" />
                  ) : (
                    <div className="size-5 rounded-full border-2 border-line shrink-0" />
                  )}
                </div>
              </div>
            </div>
          </form>
        </div>

        {/* Right Column: Order Summary Sidebar (1 col, sticky top-24) */}
        <div className="lg:col-span-1 lg:sticky lg:top-24 space-y-4">
          <div className="bg-white rounded-2xl border border-line p-5 sm:p-6 shadow-soft space-y-5">
            <h3 className="text-lg font-bold text-ink border-b border-line pb-3 flex items-center justify-between">
              <span>Đơn hàng ({totalCount} sản phẩm)</span>
            </h3>

            {/* Mini items list with quantity badge */}
            <div className="max-h-72 overflow-y-auto divide-y divide-line pr-1 space-y-2">
              {checkoutItems.map((item) => {
                const img = item.imageUrl || item.product?.imageUrl;
                const name = item.name || item.product?.name;
                const price = item.price ?? item.product?.price ?? 0;
                const itemKey = item.cartItemId || (item.variantId ? `var-${item.variantId}` : `prod-${item.productId || item.product?.id}`);

                return (
                  <div key={itemKey} className="pt-2.5 first:pt-0 flex items-center gap-3">
                    <div className="relative size-12 rounded-lg border border-line bg-gray-50 overflow-hidden shrink-0 flex items-center justify-center">
                      <img
                        src={img}
                        alt={name}
                        className="w-full h-full object-cover"
                        loading="lazy"
                      />
                      <span className="absolute -top-1 -right-1 min-w-4 h-4 px-1 rounded-full bg-gray-900/85 text-white text-[10px] font-bold flex items-center justify-center">
                        {item.quantity}
                      </span>
                    </div>

                    <div className="min-w-0 flex-1">
                      <h5 className="text-xs sm:text-sm font-medium text-ink line-clamp-1">
                        {name}
                      </h5>
                      {(item.color || item.size) && (
                        <p className="text-[10px] text-ink-subtle">
                          Phân loại: {item.color} - {item.size}
                        </p>
                      )}
                      <p className="text-xs font-bold text-primary-700 mt-0.5">
                        {formatCurrency(price * item.quantity)}
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Voucher Section */}
            <div className="pt-3 border-t border-line space-y-2.5">
              <div className="flex items-center justify-between text-xs font-semibold text-ink">
                <span className="flex items-center gap-1.5">
                  <Ticket className="size-3.5 text-primary-600" />
                  Mã giảm giá
                </span>
                <button
                  type="button"
                  onClick={() => setIsVoucherModalOpen(true)}
                  className="text-primary-600 hover:text-primary-700 hover:underline flex items-center gap-1 font-medium text-xs transition"
                >
                  <Tag className="size-3" />
                  Chọn mã có sẵn
                </button>
              </div>

              {appliedVoucher ? (
                <div className="flex items-center justify-between p-2.5 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 text-xs">
                  <div className="flex items-center gap-2 min-w-0">
                    <span className="font-mono font-bold uppercase text-emerald-700 dark:text-emerald-300 px-2 py-0.5 rounded bg-emerald-100 dark:bg-emerald-900/60">
                      {appliedVoucher.voucherCode}
                    </span>
                    <span className="text-emerald-700 dark:text-emerald-300 font-medium truncate">
                      - {formatCurrency(discountAmount)}
                    </span>
                  </div>
                  <button
                    type="button"
                    onClick={handleRemoveVoucher}
                    title="Gỡ mã"
                    className="p-1 text-emerald-600 hover:text-rose-600 rounded transition"
                  >
                    <X className="size-3.5" />
                  </button>
                </div>
              ) : (
                <div className="flex items-center gap-2">
                  <input
                    type="text"
                    value={voucherInput}
                    onChange={(e) => setVoucherInput(e.target.value.toUpperCase())}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault();
                        handleApplyVoucher();
                      }
                    }}
                    placeholder="Nhập mã voucher..."
                    className="flex-1 px-3 py-1.5 text-xs rounded-lg border border-line bg-gray-50 focus:bg-white focus:outline-none focus:ring-1 focus:ring-primary-500 uppercase font-mono font-bold tracking-wider"
                  />
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    loading={isApplyingVoucher}
                    disabled={isApplyingVoucher || !voucherInput.trim()}
                    onClick={() => handleApplyVoucher()}
                    className="text-xs px-3 py-1.5 h-auto whitespace-nowrap"
                  >
                    Áp dụng
                  </Button>
                </div>
              )}
            </div>

            {/* Dotted border calculation section */}
            <div className="space-y-2.5 pt-3 border-t border-dashed border-line text-sm">
              <div className="flex justify-between text-ink-muted">
                <span>Tạm tính</span>
                <span className="font-medium text-ink">{formatCurrency(totalPrice)}</span>
              </div>
              {appliedVoucher && (
                <div className="flex justify-between text-emerald-600 dark:text-emerald-400 font-medium">
                  <span className="flex items-center gap-1">
                    <Ticket className="size-3.5" />
                    Giảm giá ({appliedVoucher.voucherCode})
                  </span>
                  <span>-{formatCurrency(discountAmount)}</span>
                </div>
              )}
              <div className="flex justify-between text-ink-muted">
                <span>Phí giao hàng</span>
                <span className="font-semibold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-md text-xs">
                  Miễn phí
                </span>
              </div>
              <div className="flex justify-between items-baseline pt-2 border-t border-line">
                <span className="text-base font-bold text-ink">Tổng thanh toán</span>
                <span className="text-xl font-extrabold text-primary-700">
                  {formatCurrency(finalTotal)}
                </span>
              </div>
            </div>

            {/* Submit Button with multi-click prevention */}
            <div className="pt-2">
              <Button
                type="submit"
                form="checkout-form"
                onClick={handleSubmit}
                variant="primary"
                size="lg"
                fullWidth
                loading={isSubmitting}
                disabled={isSubmitting || checkoutItems.length === 0}
                className="font-bold shadow-brand"
              >
                {isSubmitting ? 'Đang hoàn tất đặt hàng...' : 'Xác nhận đặt hàng'}
              </Button>
            </div>

            <div className="text-center flex items-center justify-center gap-1.5 text-xs text-ink-subtle pt-1">
              <Lock className="size-3.5 text-emerald-600" />
              <span>Thông tin của bạn được bảo mật tuyệt đối</span>
            </div>
          </div>
        </div>
      </div>

      {/* PayOS QR Modal */}
      <PayOSQRModal
        isOpen={showPayOSModal}
        order={pendingPayOSOrder}
        onSuccess={handlePayOSSuccess}
        onClose={handlePayOSClose}
      />

      {/* Voucher Selector Modal */}
      <VoucherSelectorModal
        isOpen={isVoucherModalOpen}
        onClose={() => setIsVoucherModalOpen(false)}
        currentSubtotal={totalPrice}
        appliedCode={appliedVoucher?.voucherCode}
        onSelectVoucher={(code) => handleApplyVoucher(code)}
      />

      {/* Address Modal (Thêm địa chỉ nhanh ngay tại Checkout) */}
      <AddressModal
        isOpen={showAddressModal}
        onClose={() => setShowAddressModal(false)}
        onSubmit={handleCreateAddressQuick}
        isSubmitting={isCreatingAddress}
      />
    </div>
  );
}
