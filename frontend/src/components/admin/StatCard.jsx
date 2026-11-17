/**
 * StatCard component per Design.md 7.12
 */
export default function StatCard({
  icon: Icon,
  label,
  title,
  value,
  subtext,
  subtitle,
  variant,
  color,
  className = '',
}) {
  const displayLabel = label || title;
  const displaySubtext = subtext || subtitle;
  const resolvedVariant = variant || (color === 'emerald' ? 'success' : color === 'amber' ? 'warning' : color) || 'primary';

  const variantStyles = {
    primary: {
      bg: 'bg-primary-100',
      text: 'text-primary-700',
    },
    secondary: {
      bg: 'bg-secondary-100',
      text: 'text-secondary-700',
    },
    warning: {
      bg: 'bg-amber-100',
      text: 'text-amber-800',
    },
    danger: {
      bg: 'bg-red-100',
      text: 'text-red-700',
    },
    success: {
      bg: 'bg-green-100',
      text: 'text-green-800',
    },
  };

  const currentStyle = variantStyles[resolvedVariant] || variantStyles.primary;

  return (
    <div
      className={`rounded-xl border border-line bg-white p-4 shadow-soft flex items-center gap-3.5 transition-all hover:shadow-md ${className}`}
    >
      {Icon && (
        <div
          className={`size-12 rounded-2xl flex items-center justify-center shrink-0 ${currentStyle.bg} ${currentStyle.text}`}
        >
          <Icon className="size-6" aria-hidden="true" />
        </div>
      )}
      <div className="min-w-0 flex-1">
        <p className="text-xs sm:text-sm font-medium text-ink-muted truncate">
          {displayLabel}
        </p>
        <p className="text-xl sm:text-2xl font-bold text-ink tabular-nums mt-0.5">
          {value !== undefined ? value : '—'}
        </p>
        {displaySubtext && (
          <p className="text-xs text-ink-subtle mt-0.5 truncate">{displaySubtext}</p>
        )}
      </div>
    </div>
  );
}

