import { useState, useEffect, useCallback } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import {
  ArrowLeft,
  Truck,
  User,
  Phone,
  MapPin,
  CreditCard,
  Package,
  Calendar,
} from 'lucide-react';
import { orderApi } from '../api/order';
import { formatCurrency } from '../utils/formatCurrency';
import { formatDate } from '../utils/formatDate';
import { OrderBadge } from '../components/ui/Badge';
import OrderTimeline from '../components/order/OrderTimeline';
import ErrorState from '../components/ui/ErrorState';
import Button from '../components/ui/Button';

/**
 * Order detail page complying with Design.md 7.6
 */
export default function OrderDetail() {
  const { id } = useParams();
  const navigate = useNavigate();

  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchOrder = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await orderApi.getOrderById(id);
      setOrder(data);
    } catch (err) {
      setError(err.message || 'Không tìm thấy thông tin đơn hàng.');
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    if (!id) return;

    let isMounted = true;
    orderApi
      .getOrderById(id)
      .then((data) => {
        if (!isMounted) return;
        setOrder(data);
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

  if (loading) {
    return (
      <div className="mx-auto w-full max-w-5xl px-4 sm:px-6 lg:px-8 py-6 md:py-10 space-y-6">
        <div className="h-6 bg-gray-200 rounded w-36 animate-pulse" />
        <div className="h-28 bg-white border border-line rounded-2xl p-6 animate-pulse" />
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="h-44 bg-white border border-line rounded-2xl p-6 animate-pulse md:col-span-2" />
          <div className="h-44 bg-white border border-line rounded-2xl p-6 animate-pulse" />
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

  return (
    <div className="mx-auto w-full max-w-5xl px-4 sm:px-6 lg:px-8 py-6 md:py-10 space-y-6">
      {/* Top Header: Back Link, ID, Status */}
      <div>
        <Link
          to="/orders"
          className="inline-flex items-center gap-1.5 text-sm font-medium text-ink-muted hover:text-primary-700 transition-colors mb-3"
        >
          <ArrowLeft className="size-4" />
          Quay lại danh sách đơn hàng
        </Link>

        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white rounded-2xl border border-line p-5 sm:p-6 shadow-xs">
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-xl sm:text-2xl font-bold text-ink">
                Đơn hàng #{order.id}
              </h1>
              <OrderBadge status={order.status} />
            </div>
            <div className="flex items-center gap-2 text-xs sm:text-sm text-ink-muted mt-1.5">
              <Calendar className="size-3.5" />
              <span>Thời gian đặt: {formatDate(order.createdAt)}</span>
            </div>
          </div>

          <div className="text-left sm:text-right pt-2 sm:pt-0 border-t sm:border-t-0 border-line">
            <span className="text-xs text-ink-muted block">Tổng thanh toán:</span>
            <span className="text-xl sm:text-2xl font-bold text-primary-700">
              {formatCurrency(order.totalPrice)}
            </span>
          </div>
        </div>
      </div>

      {/* Progress Timeline or Cancelled Alert */}
      <div className="bg-white rounded-2xl border border-line p-5 sm:p-7 shadow-xs">
        <h3 className="text-sm font-bold uppercase tracking-wider text-ink-muted mb-2">
          Tiến trình đơn hàng
        </h3>
        <OrderTimeline status={order.status} />
      </div>

      {/* Grid: Delivery Info (Left) vs Products & Cost Breakdown (Right) */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-start">
        {/* Delivery Information Box */}
        <div className="md:col-span-1 bg-white rounded-2xl border border-line p-5 sm:p-6 shadow-xs space-y-4">
          <h3 className="text-base font-bold text-ink border-b border-line pb-3 flex items-center gap-2">
            <Truck className="size-4 text-primary-700" />
            Thông tin nhận hàng
          </h3>

          <div className="space-y-3 text-sm">
            <div className="flex items-start gap-2.5">
              <User className="size-4 text-ink-muted shrink-0 mt-0.5" />
              <div>
                <span className="text-xs text-ink-subtle block">Người nhận</span>
                <span className="font-semibold text-ink">{order.fullName}</span>
              </div>
            </div>

            <div className="flex items-start gap-2.5">
              <Phone className="size-4 text-ink-muted shrink-0 mt-0.5" />
              <div>
                <span className="text-xs text-ink-subtle block">Số điện thoại</span>
                <span className="font-medium text-ink">{order.phone}</span>
              </div>
            </div>

            <div className="flex items-start gap-2.5">
              <MapPin className="size-4 text-ink-muted shrink-0 mt-0.5" />
              <div>
                <span className="text-xs text-ink-subtle block">Địa chỉ nhận</span>
                <span className="font-medium text-ink leading-relaxed">{order.address}</span>
              </div>
            </div>

            <div className="flex items-start gap-2.5 pt-2 border-t border-line">
              <CreditCard className="size-4 text-secondary-600 shrink-0 mt-0.5" />
              <div>
                <span className="text-xs text-ink-subtle block">Hình thức thanh toán</span>
                <span className="font-medium text-ink">Thanh toán khi nhận hàng (COD)</span>
              </div>
            </div>
          </div>
        </div>

        {/* Product Items Table and Pricing Details */}
        <div className="md:col-span-2 bg-white rounded-2xl border border-line p-5 sm:p-6 shadow-xs space-y-5">
          <h3 className="text-base font-bold text-ink border-b border-line pb-3 flex items-center justify-between">
            <span>Danh sách sản phẩm ({totalQuantity})</span>
          </h3>

          <div className="divide-y divide-line">
            {items.map((item, idx) => (
              <div
                key={item.productId || idx}
                className="py-3.5 first:pt-0 last:pb-0 flex items-center justify-between gap-4"
              >
                <div className="flex items-center gap-3.5 min-w-0 flex-1">
                  <div className="size-14 sm:size-16 rounded-lg border border-line bg-gray-50 overflow-hidden shrink-0 flex items-center justify-center">
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
                    <h4 className="text-sm sm:text-base font-medium text-ink line-clamp-1">
                      {item.name}
                    </h4>
                    <p className="text-xs text-ink-muted mt-0.5">
                      Số lượng: <span className="font-semibold text-ink">{item.quantity}</span>
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

          {/* Pricing summary */}
          <div className="pt-4 border-t border-line space-y-2 text-sm">
            <div className="flex justify-between text-ink-muted">
              <span>Tạm tính</span>
              <span className="font-medium text-ink">{formatCurrency(order.totalPrice)}</span>
            </div>
            <div className="flex justify-between text-ink-muted">
              <span>Phí vận chuyển</span>
              <span className="font-semibold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-md text-xs">
                Miễn phí
              </span>
            </div>
            <div className="flex justify-between items-baseline pt-2 border-t border-line">
              <span className="text-base font-bold text-ink">Tổng thanh toán</span>
              <span className="text-xl sm:text-2xl font-bold text-primary-700">
                {formatCurrency(order.totalPrice)}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Bottom Navigation Buttons */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-4">
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
    </div>
  );
}
