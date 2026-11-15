import { useState, useEffect } from 'react';
import {
  User,
  Phone,
  MapPin,
  Calendar,
  CreditCard,
  Package,
  AlertTriangle,
  Clock,
  History,
} from 'lucide-react';
import Modal from '../ui/Modal';
import Button from '../ui/Button';
import { OrderBadge } from '../ui/Badge';
import { formatCurrency } from '../../utils/formatCurrency';
import { formatDate } from '../../utils/formatDate';
import { orderApi } from '../../api/order';

function AdminOrderDetailModalContent({ onClose, order }) {
  const [timeline, setTimeline] = useState([]);

  useEffect(() => {
    let isMounted = true;
    orderApi
      .getOrderTimeline(order.id)
      .then((data) => {
        if (isMounted) setTimeline(Array.isArray(data) ? data : []);
      })
      .catch(() => {
        if (isMounted) setTimeline([]);
      });

    return () => {
      isMounted = false;
    };
  }, [order.id]);

  const items = order.items || [];
  const subtotal = items.reduce(
    (acc, item) => acc + (item.price || 0) * (item.quantity || 1),
    0
  );
  const totalPrice = order.totalPrice || subtotal;

  const cancelledRecord = timeline.find((t) => t.newStatus === 'CANCELLED');
  const displayCancelReason = order.cancelReason || cancelledRecord?.note;

  return (
    <div className="space-y-6 max-h-[75vh] overflow-y-auto pr-1">
      {/* Header Summary */}
      <div className="flex flex-wrap items-center justify-between gap-3 p-4 rounded-xl bg-gray-50 border border-line">
        <div>
          <p className="text-xs text-ink-muted">Mã đơn hàng</p>
          <p className="text-base font-bold text-ink">#{order.id}</p>
        </div>
        <div>
          <p className="text-xs text-ink-muted">Ngày đặt</p>
          <div className="flex items-center gap-1.5 text-sm text-ink font-medium">
            <Calendar className="size-4 text-ink-subtle" />
            <span>{formatDate(order.createdAt || order.id)}</span>
          </div>
        </div>
        <div>
          <p className="text-xs text-ink-muted">Trạng thái</p>
          <div className="mt-0.5">
            <OrderBadge status={order.status} />
          </div>
        </div>
      </div>

      {/* Cancel Banner (nếu đơn hàng bị hủy) */}
      {order.status === 'CANCELLED' && (
        <div className="p-4 rounded-xl bg-red-50 border border-red-200 text-red-900">
          <div className="flex items-start gap-3">
            <AlertTriangle className="size-5 text-red-600 shrink-0 mt-0.5" />
            <div className="flex-1 min-w-0">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <h5 className="font-bold text-sm text-red-800">Đơn hàng đã bị hủy</h5>
                {cancelledRecord?.createdAt && (
                  <div className="flex items-center gap-1 text-xs text-red-600">
                    <Clock className="size-3.5" />
                    <span>{formatDate(cancelledRecord.createdAt)}</span>
                  </div>
                )}
              </div>

              {displayCancelReason && (
                <div className="mt-2 p-2.5 rounded-lg bg-white/90 border border-red-200 text-xs sm:text-sm">
                  <span className="font-semibold text-red-800 block text-[11px] uppercase tracking-wider mb-0.5">
                    Lý do hủy đơn:
                  </span>
                  <p className="font-medium text-ink leading-relaxed">
                    "{displayCancelReason}"
                  </p>
                  {cancelledRecord?.changedBy && (
                    <span className="block text-xs text-ink-muted mt-1">
                      Người thực hiện: <strong className="text-ink">{cancelledRecord.changedBy}</strong>
                    </span>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Customer & Shipping Information */}
      <div className="rounded-xl border border-line p-4 space-y-3">
        <h4 className="text-sm font-semibold text-ink flex items-center gap-2">
          <User className="size-4 text-primary-700" />
          Thông tin người nhận & giao hàng
        </h4>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm">
          <div className="flex items-start gap-2.5">
            <User className="size-4 text-ink-subtle shrink-0 mt-0.5" />
            <div>
              <span className="text-xs text-ink-subtle block">Họ và tên:</span>
              <span className="font-medium text-ink">{order.fullName || '—'}</span>
            </div>
          </div>
          <div className="flex items-start gap-2.5">
            <Phone className="size-4 text-ink-subtle shrink-0 mt-0.5" />
            <div>
              <span className="text-xs text-ink-subtle block">Số điện thoại:</span>
              <span className="font-medium text-ink">{order.phone || '—'}</span>
            </div>
          </div>
          <div className="flex items-start gap-2.5 md:col-span-2">
            <MapPin className="size-4 text-ink-subtle shrink-0 mt-0.5" />
            <div>
              <span className="text-xs text-ink-subtle block">Địa chỉ nhận hàng:</span>
              <span className="font-medium text-ink">{order.address || '—'}</span>
            </div>
          </div>
          <div className="flex items-start gap-2.5 md:col-span-2">
            <CreditCard className="size-4 text-ink-subtle shrink-0 mt-0.5" />
            <div>
              <span className="text-xs text-ink-subtle block">Phương thức thanh toán:</span>
              <span className="font-medium text-ink">Thanh toán khi nhận hàng (COD)</span>
            </div>
          </div>
        </div>
      </div>

      {/* Ordered Items Table */}
      <div className="rounded-xl border border-line overflow-hidden">
        <div className="p-3 bg-gray-50 border-b border-line flex items-center gap-2">
          <Package className="size-4 text-secondary-600" />
          <h4 className="text-sm font-semibold text-ink">
            Sản phẩm trong đơn ({items.length})
          </h4>
        </div>
        <div className="divide-y divide-line">
          {items.map((item, idx) => {
            const itemTotal = (item.price || 0) * (item.quantity || 1);
            return (
              <div
                key={item.id || item.variantId || `${item.productId}-${item.sku || idx}`}
                className="p-3.5 flex items-center gap-3.5"
              >
                <img
                  src={item.imageUrl || 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=200'}
                  alt={item.productName || item.name}
                  className="size-14 rounded-lg object-cover bg-gray-100 border border-line shrink-0"
                  onError={(e) => {
                    e.target.src = 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=200';
                  }}
                />
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-semibold text-ink line-clamp-1">
                    {item.productName || item.name}
                  </p>
                  {(item.color || item.size || item.sku) && (
                    <p className="text-[11px] text-ink-subtle mt-0.5">
                      Phân loại: {[item.color, item.size].filter(Boolean).join(' - ')}{' '}
                      {item.sku ? `(SKU: ${item.sku})` : ''}
                    </p>
                  )}
                  <p className="text-xs text-ink-muted mt-0.5">
                    Đơn giá: {formatCurrency(item.price)} × {item.quantity}
                  </p>
                </div>
                <div className="text-right shrink-0">
                  <p className="text-sm font-bold text-primary-700">
                    {formatCurrency(itemTotal)}
                  </p>
                </div>
              </div>
            );
          })}
        </div>

        {/* Pricing summary */}
        <div className="p-4 bg-gray-50/70 border-t border-line space-y-2">
          <div className="flex justify-between text-xs text-ink-muted">
            <span>Tạm tính:</span>
            <span className="font-medium text-ink">{formatCurrency(subtotal)}</span>
          </div>
          <div className="flex justify-between text-xs text-ink-muted">
            <span>Phí vận chuyển:</span>
            <span className="font-medium text-green-700">Miễn phí</span>
          </div>
          <div className="flex justify-between text-base font-bold text-ink pt-2 border-t border-line">
            <span>Tổng thanh toán:</span>
            <span className="text-primary-700">{formatCurrency(totalPrice)}</span>
          </div>
        </div>
      </div>

      {/* Timeline History (Audit Trail) */}
      {timeline && timeline.length > 0 && (
        <div className="rounded-xl border border-line p-4 space-y-3">
          <h4 className="text-sm font-semibold text-ink flex items-center gap-2">
            <History className="size-4 text-primary-700" />
            Lịch sử trạng thái đơn hàng ({timeline.length})
          </h4>
          <div className="space-y-2.5">
            {timeline.map((step, idx) => (
              <div
                key={step.id || idx}
                className="flex items-start gap-3 p-2.5 rounded-lg bg-gray-50/70 border border-line text-xs"
              >
                <div className="size-2 rounded-full bg-primary-600 mt-1.5 shrink-0" />
                <div className="flex-1 min-w-0">
                  <div className="flex flex-wrap items-center justify-between gap-1.5">
                    <div className="flex items-center gap-2">
                      <OrderBadge status={step.newStatus} />
                      <span className="text-ink-muted">
                        bởi <strong className="text-ink">{step.changedBy || 'Hệ thống'}</strong>
                      </span>
                    </div>
                    <span className="text-ink-subtle">{formatDate(step.createdAt)}</span>
                  </div>
                  {step.note && (
                    <p className="text-ink-muted mt-1 bg-white p-1.5 rounded border border-line">
                      💬 <strong className="text-ink">Ghi chú:</strong> {step.note}
                    </p>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Footer actions */}
      <div className="flex justify-end pt-2">
        <Button variant="outline" onClick={onClose}>
          Đóng
        </Button>
      </div>
    </div>
  );
}

export default function AdminOrderDetailModal({ isOpen, onClose, order }) {
  if (!isOpen || !order) return null;

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={`Chi tiết đơn hàng #${order.id}`}
      maxWidth="max-w-2xl"
    >
      <AdminOrderDetailModalContent onClose={onClose} order={order} />
    </Modal>
  );
}
