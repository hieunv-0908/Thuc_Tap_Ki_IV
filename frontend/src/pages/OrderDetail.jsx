import { useState, useEffect, useCallback } from 'react';
import { useParams, Link, useNavigate, useSearchParams } from 'react-router-dom';
import {
  ArrowLeft,
  Truck,
  User,
  Phone,
  MapPin,
  CreditCard,
  Package,
  Calendar,
  RotateCcw,
  ExternalLink,
} from 'lucide-react';
import { orderApi } from '../api/order';
import { returnApi } from '../api/return';
import { formatCurrency } from '../utils/formatCurrency';
import { formatDate } from '../utils/formatDate';
import { ORDER_STATUS } from '../utils/constants';
import { OrderBadge } from '../components/ui/Badge';
import OrderTimeline from '../components/order/OrderTimeline';
import ErrorState from '../components/ui/ErrorState';
import Button from '../components/ui/Button';
import CancelOrderModal from '../components/order/CancelOrderModal';
import PayOSQRModal from '../components/payment/PayOSQRModal';
import ReturnRequestModal from '../components/order/ReturnRequestModal';
import { useCartStore } from '../store/cartStore';
import { toast } from '../store/toastStore';

/**
 * Order detail page complying with Design.md 7.6 (v2.0)
 */
export default function OrderDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const addItem = useCartStore((s) => s.addItem);

  const [order, setOrder] = useState(null);
  const [timeline, setTimeline] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showCancelModal, setShowCancelModal] = useState(false);
  const [isCancelling, setIsCancelling] = useState(false);
  const [isPaying, setIsPaying] = useState(false);
  const [showPayOSModal, setShowPayOSModal] = useState(false);
  const [showReturnModal, setShowReturnModal] = useState(false);
  const [isSubmittingReturn, setIsSubmittingReturn] = useState(false);
  const [returnRequest, setReturnRequest] = useState(null);

  const fetchOrder = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const [orderData, timelineData, returnData] = await Promise.all([
        orderApi.getOrderById(id),
        orderApi.getOrderTimeline(id).catch(() => []),
        returnApi.getReturnRequestByOrder(id).catch(() => null),
      ]);
      setOrder(orderData);
      setTimeline(Array.isArray(timelineData) ? timelineData : []);
      setReturnRequest(returnData);
    } catch (err) {
      setError(err.message || 'Không tìm thấy thông tin đơn hàng.');
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    if (!id) return;

    let isMounted = true;
    Promise.all([
      orderApi.getOrderById(id),
      orderApi.getOrderTimeline(id).catch(() => []),
      returnApi.getReturnRequestByOrder(id).catch(() => null),
    ])
      .then(([orderData, timelineData, returnData]) => {
        if (!isMounted) return;
        setOrder(orderData);
        setTimeline(Array.isArray(timelineData) ? timelineData : []);
        setReturnRequest(returnData);
        setLoading(false);
      })
      .catch((err) => {
        if (!isMounted) return;
        setError(err.message || 'Không tìm thấy thông tin đơn hàng.');
        setLoading(false);
      });

    return () => {
      isMounted = false;
    };
  }, [id]);

  // Xử lý phản hồi từ cổng thanh toán PayOS qua URL params (?payment=success hoặc ?payment=cancelled)
  useEffect(() => {
    const paymentStatusParam = searchParams.get('payment');
    if (paymentStatusParam === 'success') {
      toast.success('Thanh toán qua PayOS thành công! Hệ thống đang cập nhật đơn hàng.');
      orderApi.getPayOSPaymentStatus(id).then((res) => {
        if (res?.paymentStatus) {
          setOrder((prev) => prev ? { ...prev, paymentStatus: res.paymentStatus } : prev);
        }
      }).catch(() => {});
    } else if (paymentStatusParam === 'cancelled') {
      toast.warning('Bạn đã hủy thanh toán PayOS. Bạn có thể thanh toán lại bất kỳ lúc nào.');
    }
  }, [id, searchParams]);

  const handlePayWithPayOS = async () => {
    if (!order) return;
    try {
      setIsPaying(true);
      const res = await orderApi.createPayOSPaymentLink(order.id);
      const paymentData = res?.data || res;
      if (paymentData) {
        setOrder((prev) => ({
          ...prev,
          paymentUrl: paymentData.checkoutUrl || prev.paymentUrl,
          qrCode: paymentData.qrCode || prev.qrCode,
          accountNumber: paymentData.accountNumber || prev.accountNumber,
          accountName: paymentData.accountName || prev.accountName,
          bin: paymentData.bin || prev.bin,
        }));
      }
      setShowPayOSModal(true);
    } catch {
      setShowPayOSModal(true);
    } finally {
      setIsPaying(false);
    }
  };

  const handleReorder = () => {
    if (!order || !order.items) return;
    let addedCount = 0;
    let hasLegacyItems = false;
    let legacyProduct = null;

    order.items.forEach((item) => {
      // Nếu sản phẩm trong đơn cũ không có variantId (tạo trước khi có biến thể)
      if (!item.variantId) {
        hasLegacyItems = true;
        legacyProduct = item;
        return;
      }

      const variantPayload = {
        variantId: item.variantId,
        productId: item.productId,
        name: item.name || item.productName,
        sku: item.sku,
        color: item.color,
        size: item.size,
        price: item.price ?? item.priceAtOrder,
        imageUrl: item.imageUrl,
        stockQuantity: 99,
      };
      const ok = addItem(variantPayload, item.quantity || 1);
      if (ok) addedCount++;
    });

    if (addedCount > 0 && hasLegacyItems) {
      toast.warning(
        `Đã thêm ${addedCount} sản phẩm vào giỏ; một số sản phẩm cũ cần chọn lại phân loại.`
      );
      navigate('/cart');
    } else if (addedCount > 0) {
      toast.success(`Đã thêm ${addedCount} sản phẩm vào giỏ hàng`);
      navigate('/cart');
    } else if (hasLegacyItems) {
      toast.warning(
        `Sản phẩm '${legacyProduct?.name || 'trong đơn'}' đã có phân loại kích cỡ/màu sắc mới. Vui lòng chọn lại biến thể.`
      );
      if (legacyProduct?.productId) {
        navigate(`/products/${legacyProduct.productId}`);
      }
    }
  };

  const handleCancelOrder = async (reason) => {
    if (!order) return;
    try {
      setIsCancelling(true);
      await orderApi.cancelOrder(order.id, reason);
      toast.success('Hủy đơn hàng thành công!');
      setShowCancelModal(false);
      await fetchOrder();
    } catch (err) {
      const status = err.response?.status || err.status;
      const message = err.response?.data?.message || err.message;
      if (status === 409 && message?.includes('hủy trước đó')) {
        toast.info('Đơn hàng này đã được hủy trước đó.');
        setShowCancelModal(false);
        await fetchOrder();
      } else {
        toast.error(message || 'Không thể hủy đơn hàng.');
      }
    } finally {
      setIsCancelling(false);
    }
  };

  const handleSubmitReturn = async (payload) => {
    if (!order) return;
    try {
      setIsSubmittingReturn(true);
      const res = await returnApi.createReturnRequest(order.id, payload);
      toast.success('Gửi yêu cầu trả hàng thành công! Đang chờ quản trị viên xét duyệt.');
      setShowReturnModal(false);
      setReturnRequest(res);
      await fetchOrder();
    } catch (err) {
      toast.error(err.response?.data?.message || err.message || 'Không thể gửi yêu cầu trả hàng.');
    } finally {
      setIsSubmittingReturn(false);
    }
  };

  if (loading) {
    return (
      <div className="mx-auto w-full max-w-5xl px-4 sm:px-6 lg:px-8 py-6 md:py-10 space-y-6">
        <div className="h-6 bg-gray-200 rounded w-36 animate-pulse" />
        <div className="h-28 bg-white border border-line rounded-2xl p-6 animate-pulse shadow-soft" />
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="h-44 bg-white border border-line rounded-2xl p-6 animate-pulse shadow-soft" />
          <div className="h-44 bg-white border border-line rounded-2xl p-6 animate-pulse shadow-soft" />
        </div>
      </div>
    );
  }

  if (error || !order) {
    return (
      <div className="mx-auto w-full max-w-5xl px-4 sm:px-6 lg:px-8 py-12">
        <ErrorState
          title="Không tìm thấy đơn hàng"
          message={error || `Đơn hàng #${id} không tồn tại hoặc đã bị xóa.`}
          onRetry={fetchOrder}
        />
        <div className="text-center mt-6">
          <Button variant="outline" onClick={() => navigate('/orders')}>
            Quay lại danh sách đơn hàng
          </Button>
        </div>
      </div>
    );
  }

  const items = order.items || [];
  const totalQuantity = items.reduce((sum, item) => sum + (item.quantity || 1), 0);
  const isCompleted = order.status === ORDER_STATUS.COMPLETED;
  // Cho phép gửi yêu cầu mới khi đơn bị từ chối (RETURN_REJECTED)
  const isReturnRejected = order.status === ORDER_STATUS.RETURN_REJECTED;

  return (
    <div className="mx-auto w-full max-w-5xl px-4 sm:px-6 lg:px-8 py-6 md:py-10 space-y-6">
      {/* Top Header: Breadcrumb & Title */}
      <div>
        <div className="text-xs text-ink-muted flex items-center gap-1.5 mb-2">
          <Link to="/" className="hover:text-primary-700">
            Trang chủ
          </Link>
          <span>&gt;</span>
          <Link to="/orders" className="hover:text-primary-700">
            Đơn hàng
          </Link>
          <span>&gt;</span>
          <span className="text-ink font-semibold">#{order.id}</span>
        </div>

        <Link
          to="/orders"
          className="inline-flex items-center gap-1.5 text-sm font-semibold text-ink-muted hover:text-primary-700 transition-colors mb-3"
        >
          <ArrowLeft className="size-4" />
          Quay lại danh sách đơn hàng
        </Link>

        {/* Order Header Card */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white rounded-2xl border border-line p-5 sm:p-6 shadow-soft">
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-xl sm:text-2xl font-extrabold text-ink">
                Đơn hàng #{order.id}
              </h1>
              <OrderBadge status={order.status} />
            </div>
            <div className="flex items-center gap-2 text-xs sm:text-sm text-ink-muted mt-1.5">
              <Calendar className="size-3.5" />
              <span>Thời gian đặt: {formatDate(order.createdAt)}</span>
            </div>
          </div>

          <div className="flex items-center gap-3 self-start sm:self-auto">
            {order.status === ORDER_STATUS.PENDING && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowCancelModal(true)}
                className="font-semibold text-red-600 border-red-300 hover:bg-red-50 hover:border-red-400"
              >
                Hủy đơn
              </Button>
            )}
            {(isCompleted || isReturnRejected) && (
              <Button
                variant="soft"
                size="sm"
                leftIcon={RotateCcw}
                onClick={handleReorder}
                className="font-semibold"
              >
                Mua lại
              </Button>
            )}
            {/* Nút yêu cầu trả hàng: chỉ hiện khi COMPLETED và chưa có request nào.
                Khi RETURN_REJECTED, nút gửi lại nằm trong banner đỏ bên dưới. */}
            {isCompleted && !returnRequest && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowReturnModal(true)}
                className="font-semibold text-orange-700 border-orange-300 hover:bg-orange-50"
              >
                Yêu cầu trả hàng
              </Button>
            )}
            <div className="text-left sm:text-right">
              <span className="text-xs text-ink-muted block">Tổng thanh toán:</span>
              <span className="text-xl sm:text-2xl font-extrabold text-primary-700">
                {formatCurrency(order.totalPrice)}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Progress Timeline (Design.md 7.6) */}
      <div className="bg-white rounded-2xl border border-line p-5 sm:p-7 shadow-soft">
        <h3 className="text-xs font-bold uppercase tracking-wider text-ink-muted mb-2">
          Tiến trình xử lý đơn hàng
        </h3>
        <OrderTimeline
          status={order.status}
          cancelReason={order.cancelReason}
          timeline={timeline}
        />
      </div>

      {/* Return Request Banner & Details */}
      {returnRequest && (
        <div className={`bg-white rounded-2xl border p-5 sm:p-6 shadow-soft space-y-4 ${
          returnRequest.status === 'REJECTED' ? 'border-red-300' : 'border-line'
        }`}>
          {/* Header */}
          <div className="flex items-center justify-between border-b border-line pb-3">
            <div className="flex items-center gap-2.5">
              <div className={`size-9 rounded-xl flex items-center justify-center font-bold ${
                returnRequest.status === 'REJECTED'
                  ? 'bg-red-100 text-red-700'
                  : 'bg-orange-100 text-orange-700'
              }`}>
                ↩
              </div>
              <div>
                <h3 className="font-bold text-base text-ink">Yêu cầu trả hàng & hoàn tiền</h3>
                <p className="text-xs text-ink-muted">Gửi lúc: {formatDate(returnRequest.createdAt)}</p>
              </div>
            </div>
            <div>
              {returnRequest.status === 'PENDING' && (
                <span className="px-3 py-1 rounded-full text-xs font-semibold bg-orange-100 text-orange-800">
                  ⏳ Đang chờ Shop xét duyệt
                </span>
              )}
              {returnRequest.status === 'APPROVED' && (
                <span className="px-3 py-1 rounded-full text-xs font-semibold bg-purple-100 text-purple-800">
                  ✓ Đã duyệt • Vui lòng gửi hàng về kho
                </span>
              )}
              {returnRequest.status === 'REJECTED' && (
                <span className="px-3 py-1 rounded-full text-xs font-semibold bg-red-100 text-red-800">
                  ✕ Yêu cầu bị từ chối
                </span>
              )}
              {returnRequest.status === 'COMPLETED' && (
                <span className="px-3 py-1 rounded-full text-xs font-semibold bg-green-100 text-green-800">
                  ✓ Đã hoàn tiền thành công
                </span>
              )}
            </div>
          </div>

          {/* REJECTED: Banner cảnh báo nổi bật */}
          {returnRequest.status === 'REJECTED' && (
            <div className="p-4 rounded-xl bg-red-50 border border-red-200 text-red-900 space-y-2">
              <div className="flex items-start gap-2.5">
                <span className="text-xl">🚫</span>
                <div className="flex-1">
                  <p className="font-bold text-sm text-red-800 mb-0.5">Yêu cầu trả hàng của bạn đã bị từ chối</p>
                  {returnRequest.adminNote ? (
                    <div className="text-xs sm:text-sm text-red-700 leading-relaxed">
                      <span className="font-semibold">Lý do từ Shop: </span>
                      {returnRequest.adminNote}
                    </div>
                  ) : (
                    <p className="text-xs text-red-600">Shop chưa cung cấp lý do chi tiết. Vui lòng liên hệ hỗ trợ.</p>
                  )}
                </div>
              </div>
              {/* Nút gửi lại yêu cầu mới ngay tại đây */}
              {(isCompleted || isReturnRejected) && (
                <div className="pt-2 border-t border-red-200 flex flex-wrap items-center gap-2 justify-between">
                  <p className="text-xs text-red-600 italic">
                    Nếu bạn không đồng ý với quyết định này, bạn có thể gửi yêu cầu mới với lý do khác.
                  </p>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setShowReturnModal(true)}
                    className="font-semibold text-red-700 border-red-400 hover:bg-red-50 shrink-0"
                  >
                    Gửi yêu cầu trả hàng mới
                  </Button>
                </div>
              )}
            </div>
          )}

          {/* Chi tiết yêu cầu (ẩn khi REJECTED để tránh rối mắt) */}
          {returnRequest.status !== 'REJECTED' && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs sm:text-sm">
              <div className="space-y-2">
                <p><span className="text-ink-muted">Lý do trả hàng:</span> <strong className="text-ink">{returnRequest.reason}</strong></p>
                {returnRequest.description && (
                  <p><span className="text-ink-muted">Mô tả:</span> <span className="text-ink">{returnRequest.description}</span></p>
                )}
                <p><span className="text-ink-muted">Số tiền hoàn dự kiến:</span> <strong className="text-primary-700">{formatCurrency(returnRequest.refundAmount)}</strong></p>
              </div>

              <div className="space-y-2 p-3 rounded-xl bg-gray-50 border border-line text-xs">
                <p className="font-semibold text-ink">Tài khoản nhận tiền hoàn:</p>
                <p><span className="text-ink-muted">Ngân hàng:</span> <strong>{returnRequest.bankName}</strong></p>
                <p><span className="text-ink-muted">Số tài khoản:</span> <strong className="font-mono">{returnRequest.bankAccountNumber}</strong></p>
                <p><span className="text-ink-muted">Chủ tài khoản:</span> <strong>{returnRequest.bankAccountName}</strong></p>
              </div>
            </div>
          )}

          {/* Hướng dẫn từ Shop (khi APPROVED / COMPLETED) */}
          {returnRequest.adminNote && returnRequest.status !== 'REJECTED' && (
            <div className="p-3.5 rounded-xl border text-xs sm:text-sm bg-purple-50 border-purple-200 text-purple-900">
              <p className="font-bold mb-1">
                {returnRequest.status === 'COMPLETED' ? 'Ghi chú hoàn tất:' : 'Hướng dẫn gửi hàng từ Shop:'}
              </p>
              <p className="leading-relaxed">{returnRequest.adminNote}</p>
            </div>
          )}

          {/* Ảnh bằng chứng */}
          {returnRequest.evidenceImages?.length > 0 && (
            <div>
              <p className="text-xs font-semibold text-ink-muted mb-2">Ảnh bằng chứng sản phẩm:</p>
              <div className="flex flex-wrap gap-2">
                {returnRequest.evidenceImages.map((img, idx) => (
                  <a key={idx} href={img} target="_blank" rel="noreferrer" className="block size-16 rounded-lg border border-line overflow-hidden hover:opacity-90">
                    <img src={img} alt="Bằng chứng" className="size-full object-cover" />
                  </a>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Two side-by-side cards from md: Delivery Info & Price Summary */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-start">
        {/* Card 1: Delivery Information */}
        <div className="bg-white rounded-2xl border border-line p-5 sm:p-6 shadow-soft space-y-4">
          <h3 className="text-base font-bold text-ink border-b border-line pb-3 flex items-center gap-2">
            <Truck className="size-4.5 text-primary-700" />
            <span>Thông tin người nhận & Giao hàng</span>
          </h3>

          <div className="space-y-3 text-sm">
            <div className="flex items-start gap-2.5">
              <User className="size-4 text-ink-muted shrink-0 mt-0.5" />
              <div>
                <span className="text-xs text-ink-subtle block">Người nhận:</span>
                <span className="font-semibold text-ink">{order.fullName}</span>
              </div>
            </div>

            <div className="flex items-start gap-2.5">
              <Phone className="size-4 text-ink-muted shrink-0 mt-0.5" />
              <div>
                <span className="text-xs text-ink-subtle block">Số điện thoại:</span>
                <span className="font-medium text-ink">{order.phone}</span>
              </div>
            </div>

            <div className="flex items-start gap-2.5">
              <MapPin className="size-4 text-ink-muted shrink-0 mt-0.5" />
              <div>
                <span className="text-xs text-ink-subtle block">Địa chỉ nhận hàng:</span>
                <span className="font-medium text-ink leading-relaxed">{order.address}</span>
              </div>
            </div>

            <div className="flex items-start gap-2.5 pt-2 border-t border-line">
              <CreditCard className="size-4 text-secondary-600 shrink-0 mt-0.5" />
              <div className="flex-1">
                <span className="text-xs text-ink-subtle block">Phương thức thanh toán:</span>
                <div className="flex items-center justify-between flex-wrap gap-2 mt-0.5">
                  <span className="font-semibold text-secondary-700">
                    {order.paymentMethod === 'PAYOS'
                      ? 'Thanh toán online qua PayOS (VietQR)'
                      : 'Thanh toán khi nhận hàng (COD)'}
                  </span>
                  {order.paymentMethod === 'PAYOS' && (
                    <span
                      className={`text-xs font-bold px-2.5 py-0.5 rounded-full ${
                        order.paymentStatus === 'PAID'
                          ? 'bg-green-100 text-green-700'
                          : 'bg-amber-100 text-amber-700'
                      }`}
                    >
                      {order.paymentStatus === 'PAID' ? '✓ Đã thanh toán' : '⏳ Chờ thanh toán'}
                    </span>
                  )}
                </div>

                {/* Nút thanh toán lại nếu đơn PayOS chưa thanh toán và chưa hủy */}
                {order.paymentMethod === 'PAYOS' &&
                  order.paymentStatus !== 'PAID' &&
                  order.status === ORDER_STATUS.PENDING && (
                    <div className="mt-3">
                      <Button
                        variant="secondary"
                        size="sm"
                        rightIcon={ExternalLink}
                        loading={isPaying}
                        onClick={handlePayWithPayOS}
                        className="font-bold shadow-xs"
                      >
                        Thanh toán ngay qua PayOS
                      </Button>
                    </div>
                  )}
              </div>
            </div>
          </div>
        </div>

        {/* Card 2: Price Calculation Card */}
        <div className="bg-white rounded-2xl border border-line p-5 sm:p-6 shadow-soft space-y-4">
          <h3 className="text-base font-bold text-ink border-b border-line pb-3 flex items-center justify-between">
            <span>Tóm tắt thanh toán</span>
            <span className="text-xs font-semibold text-primary-700 bg-primary-50 px-2 py-0.5 rounded-full">
              {totalQuantity} sản phẩm
            </span>
          </h3>

          <div className="space-y-2.5 text-sm">
            <div className="flex justify-between text-ink-muted">
              <span>Tạm tính</span>
              <span className="font-medium text-ink">
                {formatCurrency(order.subtotalAmount || order.totalPrice || order.totalAmount)}
              </span>
            </div>
            {order.discountAmount > 0 && (
              <div className="flex justify-between text-emerald-600 font-medium">
                <span>Giảm giá Voucher {order.voucherCode ? `(${order.voucherCode})` : ''}</span>
                <span>-{formatCurrency(order.discountAmount)}</span>
              </div>
            )}
            <div className="flex justify-between text-ink-muted">
              <span>Phí vận chuyển</span>
              <span className="font-semibold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-md text-xs">
                Miễn phí
              </span>
            </div>
            <div className="flex justify-between items-baseline pt-3 border-t border-dashed border-line">
              <span className="text-base font-bold text-ink">Tổng thanh toán</span>
              <span className="text-2xl font-extrabold text-primary-700">
                {formatCurrency(order.totalPrice || order.totalAmount)}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Product Items List Card */}
      <div className="bg-white rounded-2xl border border-line p-5 sm:p-6 shadow-soft space-y-4">
        <h3 className="text-base font-bold text-ink border-b border-line pb-3 flex items-center justify-between">
          <span>Danh sách sản phẩm</span>
        </h3>

        <div className="divide-y divide-line">
          {items.map((item, idx) => (
            <div
              key={item.id || item.variantId || `${item.productId}-${item.sku || idx}`}
              className="py-3.5 first:pt-0 last:pb-0 flex items-center justify-between gap-4"
            >
              <div className="flex items-center gap-3.5 min-w-0 flex-1">
                <div className="size-16 rounded-xl border border-line bg-gray-50 overflow-hidden shrink-0 flex items-center justify-center">
                  {item.imageUrl ? (
                    <img
                      src={item.imageUrl}
                      alt={item.name}
                      className="w-full h-full object-cover"
                      loading="lazy"
                    />
                  ) : (
                    <Package className="size-6 text-primary-400" />
                  )}
                </div>
                <div className="min-w-0 flex-1">
                  <h4 className="text-sm sm:text-base font-semibold text-ink line-clamp-1">
                    {item.name}
                  </h4>
                  {(item.color || item.size) && (
                    <div className="flex items-center gap-2 mt-0.5 text-xs text-ink-subtle">
                      {item.color && <span>Màu: <span className="font-medium text-ink">{item.color}</span></span>}
                      {item.size && <span>Size: <span className="font-semibold text-ink">{item.size}</span></span>}
                    </div>
                  )}
                  <p className="text-xs text-ink-muted mt-1">
                    Số lượng: <span className="font-bold text-ink">{item.quantity}</span>
                    <span className="mx-2">•</span>
                    Đơn giá: {formatCurrency(item.price)}
                  </p>
                </div>
              </div>

              <div className="text-right shrink-0">
                <span className="text-sm sm:text-base font-bold text-primary-700">
                  {formatCurrency((item.price || 0) * (item.quantity || 1))}
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Lịch sử trạng thái đơn hàng (Timeline Audit Trail) */}
      {timeline && timeline.length > 0 && (
        <div className="bg-white rounded-2xl border border-line p-5 sm:p-6 shadow-soft space-y-4">
          <div className="flex items-center gap-2 border-b border-line pb-3">
            <Calendar className="size-4.5 text-primary-700" />
            <h3 className="text-base font-bold text-ink">
              Lịch sử trạng thái đơn hàng ({timeline.length})
            </h3>
          </div>
          <div className="space-y-3">
            {timeline.map((step, idx) => (
              <div
                key={step.id || idx}
                className="flex items-start gap-3 p-3 rounded-xl bg-gray-50/70 border border-line text-sm"
              >
                <div className="size-2 rounded-full bg-primary-600 mt-2 shrink-0" />
                <div className="flex-1 min-w-0">
                  <div className="flex flex-wrap items-center justify-between gap-1.5">
                    <div className="flex items-center gap-2">
                      <OrderBadge status={step.newStatus} />
                      <span className="text-xs text-ink-muted">
                        bởi <strong className="text-ink">{step.changedBy || 'Hệ thống'}</strong>
                      </span>
                    </div>
                    <span className="text-xs text-ink-subtle">
                      {formatDate(step.createdAt)}
                    </span>
                  </div>
                  {step.note && (
                    <p className="text-xs text-ink-muted mt-1.5 bg-white p-2 rounded-lg border border-line">
                      💬 <strong className="text-ink">Ghi chú / Lý do:</strong> {step.note}
                    </p>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Bottom Navigation */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-2">
        <Button
          variant="outline"
          size="md"
          leftIcon={ArrowLeft}
          onClick={() => navigate('/orders')}
        >
          Quay lại danh sách đơn hàng
        </Button>

        <Button
          variant="primary"
          size="md"
          onClick={() => navigate('/')}
        >
          Tiếp tục mua sắm
        </Button>
      </div>

      {/* PayOS QR Modal */}
      <PayOSQRModal
        isOpen={showPayOSModal}
        order={order}
        onSuccess={() => {
          setShowPayOSModal(false);
          setOrder((prev) => (prev ? { ...prev, paymentStatus: 'PAID', status: ORDER_STATUS.PROCESSING } : prev));
          fetchOrder();
        }}
        onClose={() => setShowPayOSModal(false)}
      />

      {/* Modal chọn lý do và xác nhận hủy đơn hàng */}
      <CancelOrderModal
        isOpen={showCancelModal}
        onClose={() => !isCancelling && setShowCancelModal(false)}
        onConfirm={handleCancelOrder}
        orderId={order?.id}
        loading={isCancelling}
      />

      {/* Modal gửi yêu cầu trả hàng & hoàn tiền */}
      {showReturnModal && (
        <ReturnRequestModal
          isOpen={showReturnModal}
          onClose={() => !isSubmittingReturn && setShowReturnModal(false)}
          onSubmit={handleSubmitReturn}
          order={order}
          loading={isSubmittingReturn}
        />
      )}
    </div>
  );
}
