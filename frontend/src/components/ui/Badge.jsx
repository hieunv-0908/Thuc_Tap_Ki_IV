/**
 * Standard Badge & OrderBadge components complying with Design.md 2.4 & 6.4
 */
export default function Badge({
  children,
  variant = 'neutral',
  className = '',
  ...props
}) {
  const variants = {
    neutral: 'bg-gray-100 text-ink',
    primary: 'bg-primary-50 text-primary-700 border border-primary-200',
    secondary: 'bg-secondary-50 text-secondary-700 border border-secondary-200',
    success: 'bg-green-50 text-green-800 border border-green-200',
    warning: 'bg-amber-50 text-amber-800 border border-amber-200',
    danger: 'bg-red-50 text-red-800 border border-red-200',
    info: 'bg-blue-50 text-blue-800 border border-blue-200',
  };

  const variantClass = variants[variant] || variants.neutral;

  return (
    <span
      className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold ${variantClass} ${className}`}
      {...props}
    >
      {children}
    </span>
  );
}

export function OrderBadge({ status, className = '' }) {
  const statusConfig = {
    PENDING: { label: 'Chờ xử lý', className: 'bg-amber-100 text-amber-800' },
    PROCESSING: { label: 'Đang xử lý', className: 'bg-blue-100 text-blue-800' },
    SHIPPING: { label: 'Đang giao', className: 'bg-violet-100 text-violet-800' },
    COMPLETED: { label: 'Hoàn thành', className: 'bg-green-100 text-green-800' },
    CANCELLED: { label: 'Đã hủy', className: 'bg-red-100 text-red-800' },
  };

  const config = statusConfig[status] || {
    label: status || 'Không rõ',
    className: 'bg-gray-100 text-gray-800',
  };

  return (
    <span
      className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold ${config.className} ${className}`}
    >
      {config.label}
    </span>
  );
}
