import { useState, useEffect } from 'react';
import Modal from '../ui/Modal';
import Button from '../ui/Button';
import { AlertTriangle } from 'lucide-react';

const REASON_OPTIONS = [
  'Tôi muốn thay đổi địa chỉ nhận hàng / số điện thoại',
  'Tôi muốn đổi kích cỡ / màu sắc sản phẩm khác',
  'Tôi tìm thấy sản phẩm giá tốt hơn ở nơi khác',
  'Tôi đổi ý, không còn nhu cầu mua nữa',
  'Lý do khác...',
];

const MAX_REASON_LENGTH = 255;

/**
 * CancelOrderModal cho phép khách hàng chọn hoặc nhập lý do hủy đơn hàng
 */
export default function CancelOrderModal({
  isOpen,
  onClose,
  onConfirm,
  orderId,
  loading = false,
}) {
  const [selectedReason, setSelectedReason] = useState(REASON_OPTIONS[0]);
  const [customReason, setCustomReason] = useState('');
  const [error, setError] = useState('');

  // Reset form khi mở modal
  useEffect(() => {
    if (isOpen) {
      setSelectedReason(REASON_OPTIONS[0]);
      setCustomReason('');
      setError('');
    }
  }, [isOpen]);

  const isCustom = selectedReason === 'Lý do khác...';

  const handleReasonChange = (reason) => {
    setSelectedReason(reason);
    if (error) setError('');
  };

  const handleCustomChange = (e) => {
    const val = e.target.value;
    if (val.length <= MAX_REASON_LENGTH) {
      setCustomReason(val);
      if (error && val.trim()) setError('');
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (loading) return;

    let finalReason = selectedReason;
    if (isCustom) {
      const trimmed = customReason.trim();
      if (!trimmed) {
        setError('Vui lòng nhập lý do hủy đơn của bạn');
        return;
      }
      finalReason = trimmed;
    }

    onConfirm(finalReason);
  };

  return (
    <Modal isOpen={isOpen} onClose={loading ? () => {} : onClose} title={null} maxWidth="max-w-lg">
      <form onSubmit={handleSubmit} className="space-y-5">
        {/* Header */}
        <div className="flex items-start gap-3.5">
          <div className="size-10 rounded-full bg-red-50 text-red-600 flex items-center justify-center shrink-0 mt-0.5">
            <AlertTriangle className="size-5" />
          </div>
          <div>
            <h3 className="text-lg font-semibold text-ink">
              Hủy đơn hàng #{orderId}
            </h3>
            <p className="text-xs sm:text-sm text-ink-muted mt-0.5">
              Vui lòng cho FunnyShop biết lý do hủy đơn để chúng tôi phục vụ bạn tốt hơn.
            </p>
          </div>
        </div>

        {/* Options List */}
        <div className="space-y-2.5 pt-1">
          {REASON_OPTIONS.map((reason) => {
            const isChecked = selectedReason === reason;
            return (
              <label
                key={reason}
                className={`flex items-start gap-3 p-3 rounded-xl border text-sm cursor-pointer transition-all ${
                  isChecked
                    ? 'border-primary-500 bg-primary-50/40 text-ink font-medium shadow-xs'
                    : 'border-line hover:border-gray-300 text-ink-muted hover:bg-gray-50/50'
                }`}
              >
                <input
                  type="radio"
                  name="cancel_reason"
                  checked={isChecked}
                  onChange={() => handleReasonChange(reason)}
                  className="mt-0.5 size-4 text-primary-600 border-gray-300 focus:ring-primary-500"
                  disabled={loading}
                />
                <span className="leading-snug">{reason}</span>
              </label>
            );
          })}
        </div>

        {/* Textarea for Custom Reason */}
        {isCustom && (
          <div className="space-y-1.5 animate-in fade-in duration-150">
            <textarea
              rows={3}
              value={customReason}
              onChange={handleCustomChange}
              placeholder="Nhập chi tiết lý do hủy đơn của bạn..."
              disabled={loading}
              className={`w-full rounded-xl border px-3.5 py-2.5 text-sm text-ink placeholder:text-ink-subtle focus:outline-none transition-colors resize-none ${
                error
                  ? 'border-red-400 focus:border-red-500 focus:ring-1 focus:ring-red-500'
                  : 'border-line focus:border-primary-500 focus:ring-1 focus:ring-primary-500'
              }`}
            />
            <div className="flex items-center justify-between text-xs">
              {error ? (
                <span className="text-red-500 font-medium">{error}</span>
              ) : (
                <span className="text-ink-subtle">Tối đa 255 ký tự</span>
              )}
              <span className="text-ink-subtle ml-auto">
                {customReason.length}/{MAX_REASON_LENGTH}
              </span>
            </div>
          </div>
        )}

        {/* Note info */}
        <div className="rounded-lg bg-gray-50 border border-gray-100 p-2.5 text-xs text-ink-muted">
          ℹ️ Tồn kho sản phẩm trong đơn sẽ được tự động hoàn lại kho ngay sau khi hủy.
        </div>

        {/* Actions */}
        <div className="flex items-center justify-end gap-3 pt-2">
          <Button
            type="button"
            variant="outline"
            onClick={onClose}
            disabled={loading}
          >
            Đóng
          </Button>
          <Button
            type="submit"
            variant="danger"
            loading={loading}
          >
            Xác nhận hủy đơn
          </Button>
        </div>
      </form>
    </Modal>
  );
}

