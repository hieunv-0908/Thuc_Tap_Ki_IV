import Modal from './Modal';
import Button from './Button';
import { AlertCircle } from 'lucide-react';

/**
 * ConfirmDialog component per Design.md 6.6
 */
export default function ConfirmDialog({
  isOpen,
  onClose,
  onConfirm,
  title = 'Xác nhận hành động',
  description = 'Bạn có chắc chắn muốn thực hiện hành động này? Thao tác không thể hoàn tác.',
  confirmText = 'Xác nhận',
  cancelText = 'Hủy',
  variant = 'primary', // 'primary' | 'danger'
  loading = false,
}) {
  return (
    <Modal isOpen={isOpen} onClose={onClose} title={null} maxWidth="max-w-md">
      <div className="flex items-start gap-4">
        <div
          className={`size-11 rounded-full flex items-center justify-center shrink-0 ${
            variant === 'danger' ? 'bg-red-50 text-red-600' : 'bg-primary-50 text-primary-700'
          }`}
        >
          <AlertCircle className="size-6" />
        </div>
        <div>
          <h3 className="text-lg font-semibold text-ink mb-1">{title}</h3>
          <p className="text-sm text-ink-muted leading-relaxed">{description}</p>
        </div>
      </div>

      <div className="mt-6 flex items-center justify-end gap-3">
        <Button variant="outline" onClick={onClose} disabled={loading}>
          {cancelText}
        </Button>
        <Button
          variant={variant === 'danger' ? 'danger' : 'primary'}
          onClick={onConfirm}
          loading={loading}
        >
          {confirmText}
        </Button>
      </div>
    </Modal>
  );
}
