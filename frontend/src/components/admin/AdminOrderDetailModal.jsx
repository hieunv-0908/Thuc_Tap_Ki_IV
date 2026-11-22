import { useState, useEffect, useCallback } from 'react';
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
  RotateCcw,
  CheckCircle2,
  XCircle,
  Printer,
} from 'lucide-react';
import Modal from '../ui/Modal';
import Button from '../ui/Button';
import { OrderBadge } from '../ui/Badge';
import { formatCurrency } from '../../utils/formatCurrency';
import { formatDate } from '../../utils/formatDate';
import { orderApi } from '../../api/order';
import { returnApi } from '../../api/return';
import { toast } from '../../store/toastStore';
import OrderInvoiceModal from '../order/OrderInvoiceModal';

function AdminOrderDetailModalContent({ onClose, order, onOrderUpdated }) {
  const [timeline, setTimeline] = useState([]);
  const [returnRequest, setReturnRequest] = useState(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [showReviewModal, setShowReviewModal] = useState(false);
  const [reviewAction, setReviewAction] = useState('APPROVE'); // 'APPROVE' | 'REJECT'
  const [adminNote, setAdminNote] = useState('');
  const [showInvoiceModal, setShowInvoiceModal] = useState(false);

  const loadData = useCallback(() => {
    orderApi
      .getOrderTimeline(order.id)
      .then((data) => setTimeline(Array.isArray(data) ? data : []))
      .catch(() => setTimeline([]));

    returnApi
      .getReturnRequestByOrder(order.id)
      .then((data) => setReturnRequest(data))
      .catch(() => setReturnRequest(null));
  }, [order.id]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const handleOpenReview = (action) => {
    setReviewAction(action);
    setAdminNote(
      action === 'APPROVE'
        ? 'Shop đã đồng ý yêu cầu trả hàng. Vui lòng đóng gói cẩn thận và gửi về địa chỉ kho của shop.'
        : ''
    );
    setShowReviewModal(true);
  };

  const handleSubmitReview = async () => {
    if (!returnRequest) return;
    if (reviewAction === 'REJECT' && !adminNote.trim()) {
      toast.error('Bắt buộc phải nhập lý do từ chối yêu cầu trả hàng.');
      return;
    }

    try {
      setIsProcessing(true);
      await returnApi.adminReviewReturn(returnRequest.id, {
        action: reviewAction,
        adminNote: adminNote.trim(),
      });
      toast.success(
        reviewAction === 'APPROVE'
          ? 'Đã phê duyệt yêu cầu trả hàng!'
          : 'Đã từ chối yêu cầu trả hàng!'
      );
      setShowReviewModal(false);
      loadData();
      if (onOrderUpdated) onOrderUpdated();
    } catch (err) {
      toast.error(err.response?.data?.message || err.message || 'Lỗi khi duyệt yêu cầu.');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleCompleteReturn = async () => {
    if (!returnRequest) return;
    const confirmed = window.confirm(
      'Xác nhận bạn đã nhận được hàng hoàn về kho?\nHệ thống sẽ tự động hoàn lại tồn kho nguyên tử cho các sản phẩm trong đơn.'
    );
    if (!confirmed) return;

    try {
      setIsProcessing(true);
      await returnApi.adminCompleteReturn(returnRequest.id, 'Đã nhận hàng tại kho & hoàn tiền');
      toast.success('Đã hoàn tất trả hàng! Tồn kho đã được hoàn lại thành công.');
      loadData();
      if (onOrderUpdated) onOrderUpdated();
    } catch (err) {
      toast.error(err.response?.data?.message || err.message || 'Lỗi khi hoàn tất trả hàng.');
    } finally {
      setIsProcessing(false);
    }
  };

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

      {/* Return Request Management Block (nếu có yêu cầu đổi trả) */}
      {returnRequest && (
        <div className="p-4.5 rounded-xl border border-orange-200 bg-orange-50/60 text-orange-950 space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-2 border-b border-orange-200/80 pb-3">
            <div className="flex items-center gap-2">
              <RotateCcw className="size-5 text-orange-700" />
              <h5 className="font-bold text-sm text-orange-900">
                Thông tin yêu cầu trả hàng #{returnRequest.id}
              </h5>
            </div>
            <div>
              {returnRequest.status === 'PENDING' && (
                <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-amber-200 text-amber-900">
                  Chờ duyệt
                </span>
              )}
              {returnRequest.status === 'APPROVED' && (
                <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-purple-200 text-purple-900">
                  Đã duyệt (Chờ khách gửi hàng)
                </span>
              )}
              {returnRequest.status === 'REJECTED' && (
                <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-red-200 text-red-900">
                  Đã từ chối
                </span>
              )}
              {returnRequest.status === 'COMPLETED' && (
                <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-green-200 text-green-900">
                  Đã hoàn tất & hoàn kho
                </span>
              )}
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs sm:text-sm">
            <div className="space-y-1.5">
              <p><span className="text-ink-muted">Lý do khách khai:</span> <strong className="text-ink">{returnRequest.reason}</strong></p>
              {returnRequest.description && (
                <p><span className="text-ink-muted">Mô tả chi tiết:</span> <span className="text-ink">{returnRequest.description}</span></p>
              )}
              <p><span className="text-ink-muted">Tiền hoàn:</span> <strong className="text-primary-700">{formatCurrency(returnRequest.refundAmount)}</strong></p>
            </div>

            <div className="p-3 rounded-lg bg-white/90 border border-orange-200 text-xs space-y-1">
              <p className="font-semibold text-ink">Thông tin STK hoàn tiền:</p>
              <p><span className="text-ink-muted">Ngân hàng:</span> <strong>{returnRequest.bankName}</strong></p>
              <p><span className="text-ink-muted">STK:</span> <strong className="font-mono">{returnRequest.bankAccountNumber}</strong></p>
              <p><span className="text-ink-muted">Chủ TK:</span> <strong>{returnRequest.bankAccountName}</strong></p>
            </div>
          </div>

          {returnRequest.adminNote && (
            <div className="p-2.5 rounded-lg bg-white border border-orange-200 text-xs">
              <p className="font-bold text-ink mb-0.5">Ghi chú của Admin:</p>
              <p className="text-ink-muted">{returnRequest.adminNote}</p>
            </div>
          )}

          {returnRequest.evidenceImages?.length > 0 && (
            <div>
              <p className="text-xs font-semibold text-ink-muted mb-1.5">Ảnh bằng chứng:</p>
              <div className="flex flex-wrap gap-2">
                {returnRequest.evidenceImages.map((img, idx) => (
                  <a key={idx} href={img} target="_blank" rel="noreferrer" className="block size-14 rounded-lg border border-line overflow-hidden hover:opacity-80">
                    <img src={img} alt="Bằng chứng" className="size-full object-cover" />
                  </a>
                ))}
              </div>
            </div>
          )}

          {/* Admin Return Actions */}
          <div className="pt-2 border-t border-orange-200/80 flex flex-wrap items-center justify-end gap-2">
            {returnRequest.status === 'PENDING' && (
              <>
                <Button
                  size="sm"
                  variant="outline"
                  className="text-red-700 border-red-300 hover:bg-red-50 text-xs"
                  onClick={() => handleOpenReview('REJECT')}
                  disabled={isProcessing}
                >
                  <XCircle className="size-3.5 mr-1" />
                  Từ chối yêu cầu
                </Button>
                <Button
                  size="sm"
                  variant="primary"
                  className="bg-green-700 hover:bg-green-800 text-xs"
                  onClick={() => handleOpenReview('APPROVE')}
                  disabled={isProcessing}
                >
                  <CheckCircle2 className="size-3.5 mr-1" />
                  Duyệt yêu cầu trả hàng
                </Button>
              </>
            )}

            {returnRequest.status === 'APPROVED' && (
              <Button
                size="sm"
                variant="primary"
                className="bg-purple-700 hover:bg-purple-800 text-xs"
                onClick={handleCompleteReturn}
                loading={isProcessing}
              >
                <CheckCircle2 className="size-3.5 mr-1" />
                Xác nhận đã nhận hàng hoàn & Hoàn kho
              </Button>
            )}
          </div>
        </div>
      )}

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
              <span className="font-medium text-ink">
                {order.paymentMethod === 'PAYOS' ? 'Thanh toán online (PayOS / VietQR)' : 'Thanh toán khi nhận hàng (COD)'}
              </span>
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

      {/* Review Modal Prompt */}
      {showReviewModal && (
        <div className="fixed inset-0 z-60 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs">
          <div className="w-full max-w-md bg-white rounded-2xl p-5 shadow-2xl border border-line space-y-4">
            <h4 className="font-bold text-base text-ink">
              {reviewAction === 'APPROVE' ? 'Phê duyệt yêu cầu trả hàng' : 'Từ chối yêu cầu trả hàng'}
            </h4>
            <div>
              <label className="block text-xs font-semibold text-ink mb-1.5">
                {reviewAction === 'APPROVE'
                  ? 'Hướng dẫn gửi hàng (hiển thị cho khách):'
                  : 'Lý do từ chối (bắt buộc):'}
              </label>
              <textarea
                rows={3}
                value={adminNote}
                onChange={(e) => setAdminNote(e.target.value)}
                placeholder={
                  reviewAction === 'APPROVE'
                    ? 'Nhập địa chỉ nhận hàng hoàn và hướng dẫn đóng gói...'
                    : 'Nhập lý do từ chối yêu cầu trả hàng...'
                }
                className="w-full p-2.5 rounded-xl border border-line text-sm focus:outline-none focus:ring-2 focus:ring-primary-500/20"
              />
            </div>
            <div className="flex justify-end gap-2">
              <Button size="sm" variant="ghost" onClick={() => setShowReviewModal(false)} disabled={isProcessing}>
                Hủy
              </Button>
              <Button
                size="sm"
                variant="primary"
                className={reviewAction === 'APPROVE' ? 'bg-green-700 hover:bg-green-800' : 'bg-red-700 hover:bg-red-800'}
                onClick={handleSubmitReview}
                loading={isProcessing}
              >
                Xác nhận
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Footer actions */}
      <div className="flex justify-between items-center pt-2">
        <Button
          variant="outline"
          size="sm"
          leftIcon={Printer}
          onClick={() => setShowInvoiceModal(true)}
          className="font-semibold text-gray-700 hover:bg-gray-50"
        >
          In hóa đơn / Phiếu gửi
        </Button>
        <Button variant="outline" onClick={onClose}>
          Đóng
        </Button>
      </div>

      <OrderInvoiceModal
        isOpen={showInvoiceModal}
        onClose={() => setShowInvoiceModal(false)}
        order={order}
      />
    </div>
  );
}

export default function AdminOrderDetailModal({ isOpen, onClose, order, onOrderUpdated }) {
  if (!isOpen || !order) return null;

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={`Chi tiết đơn hàng #${order.id}`}
      maxWidth="max-w-2xl"
    >
      <AdminOrderDetailModalContent onClose={onClose} order={order} onOrderUpdated={onOrderUpdated} />
    </Modal>
  );
}
