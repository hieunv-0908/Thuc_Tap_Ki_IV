import { useState } from 'react';
import { X, Sparkles } from 'lucide-react';

const STORAGE_KEY = 'funnyshop_announcement_dismissed';

/**
 * AnnouncementBar component complying with funnyshop-homepage-design.md Section 3.1
 * Height: h-9, bg-ink, text-paper 12px, centered, marquee on mobile, static on desktop
 */
export default function AnnouncementBar() {
  const [dismissed, setDismissed] = useState(() => {
    if (typeof window === 'undefined') return false;
    return Boolean(sessionStorage.getItem(STORAGE_KEY));
  });

  const handleDismiss = () => {
    sessionStorage.setItem(STORAGE_KEY, 'true');
    setDismissed(true);
  };

  if (dismissed) return null;

  const content = 'Miễn phí giao hàng toàn quốc · Đổi size miễn phí 7 ngày · Stylist AI 24/7';

  return (
    <div className="relative z-50 h-9 w-full bg-ink text-paper text-xs font-light tracking-[0.05em] flex items-center justify-between px-4 sm:px-6 overflow-hidden select-none border-b border-line/20">
      {/* Decorative label left */}
      <div className="hidden md:flex items-center gap-1.5 text-mute font-normal text-[11px] uppercase tracking-widest">
        <span>FUNNYSHOP</span>
      </div>

      {/* Marquee on mobile, static on desktop */}
      <div className="flex-1 flex justify-center items-center overflow-hidden px-2">
        <div className="md:hidden whitespace-nowrap animate-marquee">
          <span>{content}</span>
          <span className="mx-6">·</span>
          <span>{content}</span>
        </div>
        <div className="hidden md:block truncate text-center">
          {content}
        </div>
      </div>

      {/* Close button */}
      <button
        type="button"
        onClick={handleDismiss}
        className="p-1 text-paper/60 hover:text-paper hover:bg-paper/10 transition-colors cursor-pointer shrink-0 ml-2"
        aria-label="Đóng thanh thông báo"
      >
        <X className="size-3.5" />
      </button>
    </div>
  );
}
