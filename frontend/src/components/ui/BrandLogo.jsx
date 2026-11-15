/**
 * BrandLogo component - Professional Typographic Fashion Wordmark
 * Clean, high-end fashion branding without emojis or amateur icons.
 */
export default function BrandLogo({ onDark = false, size = 'md', className = '' }) {
  const isSm = size === 'sm';
  const isLg = size === 'lg';

  const titleSize = isLg
    ? 'text-2xl sm:text-3xl'
    : isSm
      ? 'text-lg sm:text-xl'
      : 'text-xl sm:text-2xl';

  const subSize = isLg ? 'text-[10px]' : isSm ? 'text-[8px]' : 'text-[8.5px] sm:text-[9px]';

  return (
    <div className={`inline-flex flex-col select-none leading-none ${className}`}>
      {/* Main Wordmark */}
      <div className="flex items-baseline">
        <span
          className={`font-black tracking-tight ${titleSize} ${onDark ? 'text-white' : 'text-ink'
            } transition-colors`}
        >
          FUNNY
        </span>
        <span
          className={`font-black tracking-tight ml-1 ${titleSize} ${onDark ? 'text-primary-400' : 'text-primary-700'
            } transition-colors`}
        >
          SHOP
        </span>
        <span
          className={`size-1.5 rounded-full ml-1 mb-0.5 inline-block ${onDark ? 'bg-secondary-400' : 'bg-secondary-500'
            }`}
          aria-hidden="true"
        />
      </div>

      {/* Modern Fashion Subline */}
      <span
        className={`font-bold uppercase tracking-[0.26em] ${subSize} mt-1 ${onDark ? 'text-gray-400' : 'text-ink-subtle'
          } transition-colors`}
      >
        FASHION STUDIO
      </span>
    </div>
  );
}
