import { ArrowRight } from 'lucide-react';
import Button from './Button';

/**
 * SectionHeader component complying with Design.md 6.18
 * Eyebrow badge + H2 Title + Accent line + Optional right "Xem tất cả" link
 */
export default function SectionHeader({
  eyebrow,
  title,
  description,
  actionLabel = 'Xem tất cả',
  actionHref,
  onAction,
  variant = 'primary', // 'primary' | 'secondary'
  className = '',
}) {
  const eyebrowClasses =
    variant === 'secondary'
      ? 'bg-secondary-100 text-secondary-700'
      : 'bg-primary-100 text-primary-700';

  const lineClasses =
    variant === 'secondary' ? 'bg-secondary-500' : 'bg-primary-500';

  return (
    <div className={`flex flex-col sm:flex-row sm:items-end justify-between gap-3 mb-6 ${className}`}>
      <div>
        {eyebrow && (
          <span
            className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-semibold mb-2.5 ${eyebrowClasses}`}
          >
            {eyebrow}
          </span>
        )}
        <h2 className="text-xl md:text-2xl font-bold text-ink tracking-tight">
          {title}
        </h2>
        <div className={`mt-2 h-1 w-12 rounded-full ${lineClasses}`} />
        {description && (
          <p className="mt-2 text-sm text-ink-muted leading-relaxed max-w-xl">
            {description}
          </p>
        )}
      </div>

      {(actionHref || onAction) && (
        <div className="shrink-0 pt-1 sm:pt-0">
          {actionHref ? (
            <a href={actionHref} className="inline-flex items-center">
              <Button variant="link" size="sm" rightIcon={ArrowRight} className="font-semibold">
                {actionLabel}
              </Button>
            </a>
          ) : (
            <Button
              variant="link"
              size="sm"
              rightIcon={ArrowRight}
              onClick={onAction}
              className="font-semibold"
            >
              {actionLabel}
            </Button>
          )}
        </div>
      )}
    </div>
  );
}
