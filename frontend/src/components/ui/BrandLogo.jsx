/**
 * BrandLogo component - Japanese Minimalist Typographic Wordmark
 * Ref: funnyshop-homepage-design.md Section 3.2
 * Serif chữ giãn cách, kèm ô vuông đỏ son 10px kiểu dấu hanko.
 */
export default function BrandLogo({ onDark = false, size = 'md', className = '' }) {
  const isSm = size === 'sm';
  const isLg = size === 'lg';

  const titleSize = isLg
    ? 'text-2xl sm:text-3xl'
    : isSm
      ? 'text-lg sm:text-xl'
      : 'text-xl sm:text-2xl';

  return (
    <div className={`inline-flex items-center gap-1.5 select-none ${className}`}>
      <span
        className={`font-serif tracking-[0.14em] font-light ${titleSize} ${
          onDark ? 'text-paper' : 'text-ink'
        } transition-colors`}
      >
        FUNNYSHOP
      </span>
      <span
        className="size-2.5 bg-vermilion inline-block shrink-0 shadow-2xs"
        aria-hidden="true"
        title="FunnyShop Hanko"
      />
    </div>
  );
}
