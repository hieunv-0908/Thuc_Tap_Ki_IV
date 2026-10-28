import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  CheckCircle2,
  AlertCircle,
  Truck,
  ShieldCheck,
  ArrowLeft,
} from 'lucide-react';
import { useCartStore } from '../store/cartStore';
import { useAuthStore } from '../store/authStore';
import { orderApi } from '../api/order';
import { toast } from '../store/toastStore';
import { formatCurrency } from '../utils/formatCurrency';
import { isValidPhone, isValidAddress } from '../utils/validators';
import Input from '../components/ui/Input';
import Button from '../components/ui/Button';

/**
 * Checkout page component complying with Design.md 7.5 and FR-03
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
      // Server error: e.g. out of stock or validation error; preserves form inputs
      setServerError(
        err.message || 'Không thể đặt hàng. Vui lòng kiểm tra lại hoặc thử lại sau.'
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  // Màn hình "Đặt hàng thành công" per Design.md 7.5
  if (createdOrder) {
    return (
      <div className="mx-auto w-full max-w-3xl px-4 py-12 md:py-16">
        <div className="bg-white rounded-2xl border border-line p-6 sm:p-10 shadow-sm text-center animate-in fade-in zoom-in-95 duration-200">
          <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-full bg-emerald-50 text-emerald-600 flex items-center justify-center mx-auto mb-4 border border-emerald-100">
            <CheckCircle2 className="size-10 sm:size-12" aria-hidden="true" />
          </div>

          <h1 className="text-2xl sm:text-3xl font-bold text-ink mb-2">
            Đặt hàng thành công!
          </h1>
          <p className="text-sm sm:text-base text-ink-muted max-w-md mx-auto mb-6">
            Cảm ơn bạn đã mua sắm tại FunnyShop. Đơn hàng của bạn đã được tiếp nhận và đang được xử lý.
          </p>

          {/* Order Details Card */}
          <div className="bg-gray-50 rounded-xl p-4 sm:p-6 mb-8 text-left border border-line max-w-lg mx-auto space-y-3">
            <div className="flex justify-between items-center border-b border-line pb-2.5">
              <span className="text-xs sm:text-sm text-ink-muted">Mã đơn hàng:</span>
              <span className="text-sm sm:text-base font-bold text-primary-700">
                #{createdOrder.id}
              </span>
            </div>
            <div className="flex justify-between items-center text-xs sm:text-sm">
              <span className="text-ink-muted">Người nhận:</span>
              <span className="font-semibold text-ink">{createdOrder.fullName}</span>
            </div>
            <div className="flex justify-between items-center text-xs sm:text-sm">
              <span className="text-ink-muted">Số điện thoại:</span>
              <span className="font-semibold text-ink">{createdOrder.phone}</span>
            </div>
            <div className="flex justify-between items-start text-xs sm:text-sm gap-4">
              <span className="text-ink-muted shrink-0">Địa chỉ giao:</span>
              <span className="font-medium text-ink text-right">{createdOrder.address}</span>
            </div>
            <div className="flex justify-between items-center text-xs sm:text-sm">
              <span className="text-ink-muted">Phương thức thanh toán:</span>
              <span className="font-semibold text-ink">Thanh toán khi nhận hàng (COD)</span>
            </div>
            <div className="flex justify-between items-center border-t border-line pt-2.5">
              <span className="text-sm font-bold text-ink">Tổng thanh toán:</span>
              <span className="text-base sm:text-lg font-bold text-primary-700">
                {formatCurrency(createdOrder.totalPrice || totalPrice)}
              </span>
            </div>
          </div>

          {/* Action buttons: "Xem đơn hàng" (primary) and "Tiếp tục mua sắm" (outline) */}
          <div className="flex flex-col sm:flex-row items-center justify-center gap-3 sm:gap-4 max-w-md mx-auto">
            <Button
              variant="primary"
              size="lg"
              fullWidth
              onClick={() => navigate(`/orders/${createdOrder.id}`)}
            >
              Xem chi tiết đơn hàng
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
    <div className="mx-auto w-full max-w-7xl px-4 sm:px-6 lg:px-8 py-6 md:py-10">
      {/* Breadcrumb / Back */}
      <div className="mb-6">
        <Link
          to="/cart"
          className="inline-flex items-center gap-1.5 text-sm font-medium text-ink-muted hover:text-primary-700 transition-colors"
        >
          <ArrowLeft className="size-4" />
          Quay lại giỏ hàng
        </Link>
        <h1 className="text-2xl md:text-3xl font-bold text-ink mt-2">
          Thông tin thanh toán & Đặt hàng
        </h1>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
        {/* Left: Form Giao hàng & Phương thức thanh toán (2 cols) */}
        <div className="lg:col-span-2 space-y-6">
          {/* Server Error Alert Banner per Design.md 7.5 */}
          {serverError && (
            <div
              className="bg-red-50 border border-red-200 text-red-800 p-4 rounded-xl flex items-start gap-3 animate-in fade-in duration-150"
              role="alert"
            >
              <AlertCircle className="size-5 shrink-0 text-red-600 mt-0.5" />
              <div className="text-sm">
                <p className="font-semibold">Không thể hoàn tất đặt hàng</p>
                <p className="mt-0.5">{serverError}</p>
              </div>
            </div>
          )}

          <form id="checkout-form" onSubmit={handleSubmit} className="space-y-6">
            {/* Delivery Information Section */}
            <div className="bg-white rounded-2xl border border-line p-5 sm:p-7 shadow-xs space-y-5">
              <h3 className="text-lg font-bold text-ink flex items-center gap-2 border-b border-line pb-3">
                <Truck className="size-5 text-primary-700" />
                Thông tin nhận hàng
              </h3>

              <div className="space-y-4">
                <Input
                  label="Họ và tên người nhận"
                  name="fullName"
                  value={formData.fullName}
                  onChange={handleChange}
                  onBlur={handleBlur}
                  placeholder="Ví dụ: Nguyễn Văn A"
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
                  placeholder="Ví dụ: 0987654321"
                  error={errors.phone}
                  required
                />

                <div className="space-y-1.5">
                  <label
                    htmlFor="address-textarea"
                    className="block text-sm font-medium text-ink"
                  >
                    Địa chỉ nhận hàng <span className="text-red-500">*</span>
                  </label>
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
                    placeholder="Ví dụ: Giao vào giờ hành chính, gọi trước khi giao..."
                    className="w-full rounded-lg border border-line bg-white px-3.5 py-2.5 text-base text-ink placeholder:text-ink-subtle focus:border-secondary-500 focus:ring-2 focus:ring-secondary-200 transition-all"
                  />
                </div>
              </div>
            </div>

            {/* Payment Method Section (COD only) per Design.md 7.5 */}
            <div className="bg-white rounded-2xl border border-line p-5 sm:p-7 shadow-xs">
              <h3 className="text-lg font-bold text-ink border-b border-line pb-3 mb-4 flex items-center gap-2">
                <ShieldCheck className="size-5 text-secondary-600" />
                Phương thức thanh toán
              </h3>

              <div className="rounded-xl border-2 border-primary-500 bg-primary-50/50 p-4 flex items-center justify-between cursor-pointer">
                <label className="flex items-center gap-3 cursor-pointer">
                  <input
                    type="radio"
                    name="paymentMethod"
                    value="COD"
                    checked
                    readOnly
                    className="size-4 text-primary-700 focus:ring-primary-500 accent-primary-700 cursor-pointer"
                  />
                  <div>
                    <span className="font-semibold text-ink text-sm sm:text-base block">
                      Thanh toán khi nhận hàng (COD)
                    </span>
                    <span className="text-xs text-ink-muted">
                      Bạn chỉ thanh toán khi đã kiểm tra và nhận hàng an toàn.
                    </span>
                  </div>
                </label>

                <span className="bg-primary-700 text-white text-xs font-semibold px-2.5 py-1 rounded-md">
                  Mặc định
                </span>
              </div>
            </div>
          </form>
        </div>

        {/* Right: Order Summary Sidebar (1 col) */}
        <div className="lg:col-span-1 lg:sticky lg:top-24 space-y-4">
          <div className="bg-white rounded-2xl border border-line p-5 sm:p-6 shadow-xs space-y-5">
            <h3 className="text-lg font-bold text-ink border-b border-line pb-3 flex items-center justify-between">
              <span>Đơn hàng của bạn</span>
              <span className="text-xs font-semibold text-primary-700 bg-primary-50 px-2 py-0.5 rounded-full">
                {totalCount} sản phẩm
              </span>
            </h3>

            {/* Items Mini List */}
            <div className="max-h-72 overflow-y-auto divide-y divide-line pr-1 space-y-2">
              {items.map(({ product, quantity }) => (
                <div key={product.id} className="pt-2 first:pt-0 flex items-center gap-3">
                  <div className="size-14 rounded-lg border border-line bg-gray-50 overflow-hidden shrink-0 flex items-center justify-center">
                    <img
                      src={product.imageUrl}
                      alt={product.name}
                      className="w-full h-full object-cover"
                      loading="lazy"
                    />
                  </div>
                  <div className="min-w-0 flex-1">
                    <h5 className="text-xs sm:text-sm font-medium text-ink line-clamp-1">
                      {product.name}
                    </h5>
                    <p className="text-xs text-ink-muted mt-0.5">
                      Số lượng: <span className="font-semibold text-ink">{quantity}</span>
                    </p>
                    <p className="text-xs font-bold text-primary-700 mt-0.5">
                      {formatCurrency((product.price || 0) * quantity)}
                    </p>
                  </div>
                </div>
              ))}
            </div>

            {/* Calculation details */}
            <div className="space-y-2.5 pt-3 border-t border-line text-sm">
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
                <span className="text-2xl font-bold text-primary-700">
                  {formatCurrency(totalPrice)}
                </span>
              </div>
            </div>

            {/* Submit Button */}
            <div className="pt-2">
              <Button
                type="submit"
                form="checkout-form"
                variant="primary"
                size="lg"
                fullWidth
                loading={isSubmitting}
                disabled={isSubmitting || items.length === 0}
              >
                {isSubmitting ? 'Đang xử lý đặt hàng...' : 'Xác nhận đặt hàng'}
              </Button>
            </div>

            <p className="text-center text-xs text-ink-subtle">
              Bằng việc bấm xác nhận, bạn đồng ý với các điều khoản mua hàng tại FunnyShop.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
