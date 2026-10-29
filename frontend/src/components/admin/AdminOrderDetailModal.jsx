import { User, Phone, MapPin, Calendar, CreditCard, Package } from 'lucide-react';
import Modal from '../ui/Modal';
import Button from '../ui/Button';
import { OrderBadge } from '../ui/Badge';
import { formatCurrency } from '../../utils/formatCurrency';
import { formatDate } from '../../utils/formatDate';

export default function AdminOrderDetailModal({ isOpen, onClose, order }) {
  if (!order) return null;

  const items = order.items || [];
  const subtotal = items.reduce(
    (acc, item) => acc + (item.price || 0) * (item.quantity || 1),
    0
  );
  const totalPrice = order.totalPrice || subtotal;

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={`Chi tiết đơn hàng #${order.id}`}
      maxWidth="max-w-2xl"
    >
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
                <div key={item.productId || idx} className="p-3.5 flex items-center gap-3.5">
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

        {/* Footer actions */}
        <div className="flex justify-end pt-2">
          <Button variant="outline" onClick={onClose}>
            Đóng
          </Button>
        </div>
      </div>
    </Modal>
  );
}

