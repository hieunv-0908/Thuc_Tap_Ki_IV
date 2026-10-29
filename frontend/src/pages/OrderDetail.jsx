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
  RotateCcw,
} from 'lucide-react';
import { orderApi } from '../api/order';
import { formatCurrency } from '../utils/formatCurrency';
import { formatDate } from '../utils/formatDate';
import { ORDER_STATUS } from '../utils/constants';
import { OrderBadge } from '../components/ui/Badge';
import OrderTimeline from '../components/order/OrderTimeline';
import ErrorState from '../components/ui/ErrorState';
import Button from '../components/ui/Button';
import { useCartStore } from '../store/cartStore';
import { toast } from '../store/toastStore';

/**
 * Order detail page complying with Design.md 7.6 (v2.0)
 */
export default function OrderDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const addItem = useCartStore((s) => s.addItem);

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

  const handleReorder = () => {
    if (!order || !order.items) return;
    let addedCount = 0;
    order.items.forEach((item) => {
      const product = {
        id: item.productId || item.id,
        name: item.name,
        price: item.price,
        imageUrl: item.imageUrl,
        stock: 99,
      };
      const ok = addItem(product, item.quantity || 1);
      if (ok) addedCount++;
    });

    if (addedCount > 0) {
      toast.success('Đã thêm sản phẩm vào giỏ hàng');
      navigate('/cart');
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
            {isCompleted && (
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
        <OrderTimeline status={order.status} />
      </div>

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
              <div>
                <span className="text-xs text-ink-subtle block">Phương thức thanh toán:</span>
                <span className="font-semibold text-secondary-700">
                  Thanh toán khi nhận hàng (COD)
                </span>
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
              <span className="font-medium text-ink">{formatCurrency(order.totalPrice)}</span>
            </div>
            <div className="flex justify-between text-ink-muted">
              <span>Phí vận chuyển</span>
              <span className="font-semibold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-md text-xs">
                Miễn phí
              </span>
            </div>
            <div className="flex justify-between items-baseline pt-3 border-t border-dashed border-line">
              <span className="text-base font-bold text-ink">Tổng thanh toán</span>
              <span className="text-2xl font-extrabold text-primary-700">
                {formatCurrency(order.totalPrice)}
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
              key={item.productId || idx}
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
    </div>
  );
}
