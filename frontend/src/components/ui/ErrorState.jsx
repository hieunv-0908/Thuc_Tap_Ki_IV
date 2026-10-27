import { AlertCircle, RefreshCw } from 'lucide-react';
import Button from './Button';

/**
 * ErrorState component per Design.md 6.10
 */
export default function ErrorState({
  title = 'Đã có lỗi xảy ra',
  message = 'Không tải được dữ liệu. Vui lòng thử lại.',
  onRetry,
  className = '',
}) {
  return (
    <div className={`flex flex-col items-center justify-center text-center py-16 px-4 ${className}`}>
      <div className="w-16 h-16 rounded-2xl bg-red-50 flex items-center justify-center text-red-600 mb-4">
        <AlertCircle className="size-8" aria-hidden="true" />
      </div>
      <h3 className="text-lg font-semibold text-ink mb-1">{title}</h3>
      <p className="text-sm text-ink-muted max-w-md mb-6">{message}</p>
      {onRetry && (
        <Button variant="primary" leftIcon={RefreshCw} onClick={onRetry}>
          Thử lại
        </Button>
      )}
    </div>
  );
}
