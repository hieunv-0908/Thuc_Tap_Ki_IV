import { PackageOpen } from 'lucide-react';
import Button from './Button';

/**
 * EmptyState component per Design.md 6.10
 */
export default function EmptyState({
  icon: Icon = PackageOpen,
  title = 'Không có dữ liệu',
  description = 'Hiện tại chưa có thông tin nào để hiển thị.',
  actionLabel,
  onAction,
  className = '',
}) {
  return (
    <div className={`flex flex-col items-center justify-center text-center py-16 px-4 ${className}`}>
      <div className="w-16 h-16 rounded-2xl bg-primary-50 flex items-center justify-center text-primary-400 mb-4">
        <Icon className="size-8" aria-hidden="true" />
      </div>
      <h3 className="text-lg font-semibold text-ink mb-1">{title}</h3>
      <p className="text-sm text-ink-muted max-w-md mb-6">{description}</p>
      {actionLabel && onAction && (
        <Button variant="primary" onClick={onAction}>
          {actionLabel}
        </Button>
      )}
    </div>
  );
}
