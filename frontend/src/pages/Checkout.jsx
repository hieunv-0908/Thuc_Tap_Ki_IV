import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
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
} from 'lucide-react';
import { useCartStore } from '../store/cartStore';
import { useAuthStore } from '../store/authStore';
import { orderApi } from '../api/order';
import { toast } from '../store/toastStore';
import { formatCurrency } from '../utils/formatCurrency';
import { formatDate } from '../utils/formatDate';
import { isValidPhone, isValidAddress } from '../utils/validators';
import StepIndicator from '../components/ui/StepIndicator';
import Input from '../components/ui/Input';
import Button from '../components/ui/Button';

/**
 * Checkout page component complying with Design.md 7.5 (v2.0)
 */
export default function Checkout() {
  const navigate = useNavigate();
  const { items, clearCart, getTotalPrice, getTotalCount } = useCartStore();
  const { user } = useAuthStore();

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

  const totalPrice = getTotalPrice();
  const totalCount = getTotalCount();

  // Redirect if cart is empty and no order has just been created
  useEffect(() => {
    if (items.length === 0 && !createdOrder) {
      navigate('/cart', { replace: true });
    }
  }, [items.length, createdOrder, navigate]);

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
    e.preventDefault();
    if (isSubmitting) return;

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
      return;
    }

    setIsSubmitting(true);

    try {
      const orderPayload = {
        fullName: formData.fullName.trim(),
        phone: formData.phone.trim(),
        address: formData.address.trim(),
        items: items.map((i) => ({
          productId: i.product.id,
          quantity: i.quantity,
        })),
      };

      const result = await orderApi.createOrder(orderPayload);
      clearCart();
      setCreatedOrder(result);
      toast.success('Đặt hàng thành công!');
    } catch (err) {
      setServerError(
        err.message || 'Không thể đặt hàng. Vui lòng kiểm tra lại thông tin.'
      );
    } finally {
      setIsSubmitting(false);
    }
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
                <span className="text-xs font-semibold text-secondary-700">Thanh toán khi nhận hàng (COD)</span>
              </div>
              <div className="text-right">
                <span className="text-xs text-ink-muted block">Tổng tiền:</span>
                <span className="text-xl font-extrabold text-primary-700">
                  {formatCurrency(createdOrder.totalPrice || totalPrice)}
                </span>
              </div>
            </div>
          </div>

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

          <form id="checkout-form" onSubmit={handleSubmit} className="space-y-6">
            {/* Card 1: MapPin Thông tin nhận hàng (Design.md 7.5) */}
            <div className="bg-white rounded-2xl border border-line p-5 sm:p-7 shadow-soft space-y-5">
              <div className="flex items-center gap-3 border-b border-line pb-4">
                <div className="size-9 rounded-xl bg-primary-100 text-primary-700 flex items-center justify-center font-bold shrink-0">
                  <MapPin className="size-5" />
                </div>
                <div>
                  <h3 className="text-base sm:text-lg font-bold text-ink">
                    1. Thông tin nhận hàng
                  </h3>
                  <p className="text-xs text-ink-muted">
                    Địa chỉ và thông tin liên hệ của người nhận
                  </p>
                </div>
              </div>

              <div className="space-y-4">
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

                <div className="space-y-1.5">
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
            </div>

            {/* Card 2: Wallet Phương thức thanh toán (Design.md 7.5: rounded-xl border-2 border-secondary-500 bg-secondary-50 p-4) */}
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
                    Phương thức thanh toán an toàn, minh bạch
                  </p>
                </div>
              </div>

              <div
                className="rounded-xl border-2 border-secondary-500 bg-secondary-50 p-4 flex items-center justify-between cursor-pointer"
                role="radio"
                aria-checked="true"
              >
                <div className="flex items-center gap-3.5">
                  <div className="size-10 rounded-xl bg-white text-secondary-600 flex items-center justify-center shadow-2xs">
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

                <CheckCircle2 className="size-5 text-secondary-600 shrink-0" aria-hidden="true" />
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
              {items.map(({ product, quantity }) => (
                <div key={product.id} className="pt-2.5 first:pt-0 flex items-center gap-3">
                  <div className="relative size-12 rounded-lg border border-line bg-gray-50 overflow-hidden shrink-0 flex items-center justify-center">
                    <img
                      src={product.imageUrl}
                      alt={product.name}
                      className="w-full h-full object-cover"
                      loading="lazy"
                    />
                    {/* Quantity pill badge (Design.md 7.5: bg-gray-900/80 text-white text-xs rounded-full) */}
                    <span className="absolute -top-1 -right-1 min-w-4 h-4 px-1 rounded-full bg-gray-900/85 text-white text-[10px] font-bold flex items-center justify-center">
                      {quantity}
                    </span>
                  </div>

                  <div className="min-w-0 flex-1">
                    <h5 className="text-xs sm:text-sm font-medium text-ink line-clamp-1">
                      {product.name}
                    </h5>
                    <p className="text-xs font-bold text-primary-700 mt-0.5">
                      {formatCurrency((product.price || 0) * quantity)}
                    </p>
                  </div>
                </div>
              ))}
            </div>

            {/* Dotted border calculation section */}
            <div className="space-y-2.5 pt-3 border-t border-dashed border-line text-sm">
              <div className="flex justify-between text-ink-muted">
                <span>Tạm tính</span>
                <span className="font-medium text-ink">{formatCurrency(totalPrice)}</span>
              </div>
              <div className="flex justify-between text-ink-muted">
                <span>Phí giao hàng</span>
                <span className="font-semibold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-md text-xs">
                  Miễn phí
                </span>
              </div>
              <div className="flex justify-between items-baseline pt-2 border-t border-line">
                <span className="text-base font-bold text-ink">Tổng thanh toán</span>
                <span className="text-xl font-extrabold text-primary-700">
                  {formatCurrency(totalPrice)}
                </span>
              </div>
            </div>

            {/* Submit Button with multi-click prevention */}
            <div className="pt-2">
              <Button
                type="submit"
                form="checkout-form"
                variant="primary"
                size="lg"
                fullWidth
                loading={isSubmitting}
                disabled={isSubmitting || items.length === 0}
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
    </div>
  );
}
