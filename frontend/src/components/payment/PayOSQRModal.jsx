import { useState, useEffect, useRef } from 'react';
import {
  Copy,
  Check,
  ExternalLink,
  Clock,
  ShieldCheck,
  AlertCircle,
  Loader2,
  CheckCircle2,
  X,
} from 'lucide-react';
import { formatCurrency } from '../../utils/formatCurrency';
import { orderApi } from '../../api/order';
import { toast } from '../../store/toastStore';
import Button from '../ui/Button';

export default function PayOSQRModal({
  isOpen,
  order,
  onSuccess,
  onClose,
  cancelLabel = 'Hủy thanh toán & Quay lại',
}) {
  const [copiedField, setCopiedField] = useState(null);
  const [timeLeft, setTimeLeft] = useState(15 * 60); // 15 phút
  const [isPaid, setIsPaid] = useState(false);
  const [isSimulating, setIsSimulating] = useState(false);
  const pollingTimerRef = useRef(null);

  const orderId = order?.id;
  const amount = order?.totalPrice || order?.totalAmount || 0;
  const description = order?.payosOrderCode
    ? `Don hang #${order.id}`
    : `Don hang #${orderId}`;

  const accountNumber = order?.accountNumber || '0388888888';
  const accountName = order?.accountName || 'FUNNYSHOP OFFICIAL';
  const bin = order?.bin || '970422'; // MB Bank
  const checkoutUrl = order?.paymentUrl || order?.payosCheckoutUrl;
  const qrString = order?.qrCode;

  // URL ảnh VietQR chuẩn
  const qrImageUrl = `https://img.vietqr.io/image/${bin}-${accountNumber}-compact2.png?amount=${Math.round(amount)}&addInfo=${encodeURIComponent(description)}&accountName=${encodeURIComponent(accountName)}`;

  // Đếm ngược 15 phút
  useEffect(() => {
    if (!isOpen || isPaid) return;
    const interval = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          clearInterval(interval);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [isOpen, isPaid]);

  // Polling tự động kiểm tra trạng thái thanh toán từ Backend / PayOS mỗi 2.5s
  useEffect(() => {
    if (!isOpen || !orderId || isPaid) return;

    const checkStatus = async () => {
      try {
        const res = await orderApi.getPayOSPaymentStatus(orderId);
        const status = res?.paymentStatus || res?.data?.paymentStatus;
        if (status === 'PAID') {
          setIsPaid(true);
          toast.success('Thanh toán qua PayOS thành công!');
          setTimeout(() => {
            if (onSuccess) onSuccess();
          }, 1500);
        }
      } catch {
        // Bỏ qua lỗi polling mạng nhẹ
      }
    };

    pollingTimerRef.current = setInterval(checkStatus, 2500);

    return () => {
      if (pollingTimerRef.current) clearInterval(pollingTimerRef.current);
    };
  }, [isOpen, orderId, isPaid, onSuccess]);

  if (!isOpen || !order) return null;

  const copyToClipboard = (text, field) => {
    if (typeof navigator !== 'undefined' && navigator.clipboard) {
      navigator.clipboard.writeText(String(text));
      setCopiedField(field);
      toast.info(`Đã sao chép: ${text}`);
      setTimeout(() => setCopiedField(null), 2000);
    }
  };

  const handleSimulatePayment = async () => {
    try {
      setIsSimulating(true);
      await orderApi.simulatePayOSSuccess(orderId);
      setIsPaid(true);
      toast.success('Xác nhận thanh toán mô phỏng thành công!');
      setTimeout(() => {
        if (onSuccess) onSuccess();
      }, 1200);
    } catch (err) {
      toast.error('Không thể mô phỏng thanh toán: ' + (err.message || 'Lỗi server'));
    } finally {
      setIsSimulating(false);
    }
  };

  const minutes = Math.floor(timeLeft / 60);
  const seconds = timeLeft % 60;
  const timeFormatted = `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="relative w-full max-w-lg bg-white rounded-3xl shadow-2xl border border-line overflow-hidden max-h-[92vh] flex flex-col animate-in zoom-in-95 duration-200">
        {/* Header Modal */}
        <div className="relative bg-gradient-to-r from-secondary-700 via-secondary-600 to-primary-600 text-white p-5 sm:p-6 shrink-0">
          <button
            type="button"
            onClick={onClose}
            className="absolute top-4 right-4 p-1.5 rounded-full bg-white/15 hover:bg-white/25 text-white transition-colors cursor-pointer"
            aria-label="Đóng hộp thoại"
          >
            <X className="size-5" />
          </button>

          <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-secondary-200 mb-1">
            <ShieldCheck className="size-4 text-emerald-300" />
            <span>Cổng thanh toán VietQR · PayOS 24/7</span>
          </div>

          <h3 className="text-xl sm:text-2xl font-extrabold tracking-tight">
            Quét mã QR để thanh toán
          </h3>

          <div className="flex items-center justify-between text-xs sm:text-sm text-white/90 mt-2">
            <span>Đơn hàng #{order.id}</span>
            <div className="flex items-center gap-1.5 bg-black/20 px-2.5 py-1 rounded-full font-mono font-bold">
              <Clock className="size-3.5 text-amber-300" />
              <span>Hết hạn sau: {timeFormatted}</span>
            </div>
          </div>
        </div>

        {/* Modal Body */}
        <div className="p-5 sm:p-6 overflow-y-auto space-y-5">
          {/* Trạng thái đã thanh toán thành công */}
          {isPaid ? (
            <div className="py-8 text-center space-y-4 animate-in zoom-in-95">
              <div className="size-20 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center mx-auto shadow-md animate-[pop_300ms_ease-out]">
                <CheckCircle2 className="size-12" />
              </div>
              <h4 className="text-xl font-extrabold text-ink">
                Thanh toán thành công!
              </h4>
              <p className="text-sm text-ink-muted max-w-xs mx-auto">
                Hệ thống đã nhận được tiền và tự động duyệt đơn hàng của bạn. Đang chuyển tiếp...
              </p>
            </div>
          ) : (
            <>
              {/* Khu vực mã QR */}
              <div className="flex flex-col items-center justify-center p-4 bg-gray-50 rounded-2xl border border-line">
                <div className="relative p-3 bg-white rounded-2xl shadow-md border border-line">
                  <img
                    src={qrImageUrl}
                    alt="Mã VietQR thanh toán"
                    className="w-56 h-56 sm:w-64 sm:h-64 object-contain rounded-lg select-none"
                    onError={(e) => {
                      // Fallback nếu img.vietqr.io gặp sự cố
                      e.target.onerror = null;
                      e.target.src = `https://api.qrserver.com/v1/create-qr-code/?size=250x250&data=${encodeURIComponent(
                        qrString || checkoutUrl || description
                      )}`;
                    }}
                  />
                  {/* Watermark logo góc QR */}
                  <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 size-11 bg-white rounded-xl shadow-md border border-line flex items-center justify-center text-xs font-black text-secondary-600 pointer-events-none">
                    VietQR
                  </div>
                </div>

                {/* Radar radar loading bar */}
                <div className="flex items-center gap-2 text-xs font-semibold text-secondary-700 bg-secondary-50 border border-secondary-200 px-3.5 py-1.5 rounded-full mt-3 animate-pulse">
                  <Loader2 className="size-3.5 animate-spin text-secondary-600" />
                  <span>Đang chờ bạn quét mã & chuyển khoản...</span>
                </div>
              </div>

              {/* Bảng chi tiết chuyển khoản thủ công */}
              <div className="rounded-2xl border border-line p-4 bg-white shadow-2xs space-y-2.5 text-xs sm:text-sm">
                <div className="flex items-center justify-between py-1 border-b border-gray-100">
                  <span className="text-ink-muted">Số tiền cần thanh toán:</span>
                  <div className="flex items-center gap-1.5">
                    <span className="font-extrabold text-base text-primary-700">
                      {formatCurrency(amount)}
                    </span>
                    <button
                      type="button"
                      onClick={() => copyToClipboard(Math.round(amount), 'amount')}
                      className="p-1 text-ink-subtle hover:text-ink cursor-pointer"
                      title="Sao chép số tiền"
                    >
                      {copiedField === 'amount' ? (
                        <Check className="size-4 text-emerald-600" />
                      ) : (
                        <Copy className="size-4" />
                      )}
                    </button>
                  </div>
                </div>

                <div className="flex items-center justify-between py-1 border-b border-gray-100">
                  <span className="text-ink-muted">Ngân hàng:</span>
                  <span className="font-bold text-ink">Quân Đội (MB Bank)</span>
                </div>

                <div className="flex items-center justify-between py-1 border-b border-gray-100">
                  <span className="text-ink-muted">Chủ tài khoản:</span>
                  <span className="font-semibold text-ink uppercase">{accountName}</span>
                </div>

                <div className="flex items-center justify-between py-1 border-b border-gray-100">
                  <span className="text-ink-muted">Số tài khoản:</span>
                  <div className="flex items-center gap-1.5">
                    <span className="font-mono font-bold text-ink text-sm sm:text-base">
                      {accountNumber}
                    </span>
                    <button
                      type="button"
                      onClick={() => copyToClipboard(accountNumber, 'acc')}
                      className="p-1 text-ink-subtle hover:text-ink cursor-pointer"
                      title="Sao chép số tài khoản"
                    >
                      {copiedField === 'acc' ? (
                        <Check className="size-4 text-emerald-600" />
                      ) : (
                        <Copy className="size-4" />
                      )}
                    </button>
                  </div>
                </div>

                <div className="flex items-center justify-between py-1">
                  <span className="text-ink-muted">Nội dung chuyển khoản:</span>
                  <div className="flex items-center gap-1.5">
                    <span className="font-mono font-bold text-secondary-700 text-sm">
                      {description}
                    </span>
                    <button
                      type="button"
                      onClick={() => copyToClipboard(description, 'desc')}
                      className="p-1 text-ink-subtle hover:text-ink cursor-pointer"
                      title="Sao chép nội dung"
                    >
                      {copiedField === 'desc' ? (
                        <Check className="size-4 text-emerald-600" />
                      ) : (
                        <Copy className="size-4" />
                      )}
                    </button>
                  </div>
                </div>
              </div>

              {/* Lưu ý chuyển khoản */}
              <div className="p-3 bg-amber-50 rounded-xl border border-amber-200 flex items-start gap-2.5 text-xs text-amber-900">
                <AlertCircle className="size-4 text-amber-600 shrink-0 mt-0.5" />
                <p className="leading-relaxed">
                  <strong>Quan trọng:</strong> Vui lòng giữ nguyên <strong>nội dung chuyển khoản</strong> để hệ thống tự động ghi nhận thanh toán trong 3–5 giây.
                </p>
              </div>

              {/* Nút hành động bổ sung */}
              <div className="space-y-2 pt-1">
                {checkoutUrl && (
                  <a
                    href={checkoutUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="w-full inline-flex items-center justify-center gap-2 h-10 px-4 rounded-xl bg-gray-100 hover:bg-gray-200 text-ink font-semibold text-xs sm:text-sm transition cursor-pointer"
                  >
                    <span>Mở trang thanh toán PayOS riêng</span>
                    <ExternalLink className="size-3.5" />
                  </a>
                )}

                {/* Nút mô phỏng thanh toán thành công (hỗ trợ test local khi chưa có tiền thật) */}
                <button
                  type="button"
                  disabled={isSimulating}
                  onClick={handleSimulatePayment}
                  className="w-full h-9 rounded-xl border border-dashed border-secondary-300 bg-secondary-50/50 hover:bg-secondary-100 text-secondary-700 font-medium text-xs transition cursor-pointer flex items-center justify-center gap-1.5"
                >
                  {isSimulating ? (
                    <Loader2 className="size-3.5 animate-spin" />
                  ) : (
                    <span>🧪 Tôi đã thanh toán (Mô phỏng Test Local)</span>
                  )}
                </button>
              </div>
            </>
          )}
        </div>

        {/* Modal Footer */}
        <div className="p-4 bg-gray-50 border-t border-line flex items-center justify-between shrink-0">
          <Button variant="ghost" size="sm" onClick={onClose} className="text-red-600 hover:text-red-700 hover:bg-red-50">
            {cancelLabel}
          </Button>

          <span className="text-xs text-ink-subtle">
            An toàn · Bảo mật bởi PayOS
          </span>
        </div>
      </div>
    </div>
  );
}

