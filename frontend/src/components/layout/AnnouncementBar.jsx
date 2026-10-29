import { useState } from 'react';
import { X, Sparkles } from 'lucide-react';

const STORAGE_KEY = 'funnyshop_announcement_dismissed';

/**
 * AnnouncementBar component complying with Design.md 6.17
 * Height: h-9, bg-secondary-700, marquee on mobile, static centered on desktop
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

  const content = '🚚 Giao hàng COD toàn quốc · 🎁 Quà tặng vui nhộn mỗi ngày · ⚡ Đổi trả tiện lợi';

  return (
    <div className="relative z-50 h-9 w-full bg-secondary-700 text-white text-xs sm:text-sm font-medium flex items-center justify-between px-3 sm:px-4 overflow-hidden select-none">
      {/* Decorative sparkle left */}
      <div className="hidden md:flex items-center gap-1.5 opacity-80">
        <Sparkles className="size-3.5 text-secondary-300" />
        <span>FunnyShop Deal Hot</span>
      </div>

      {/* Marquee on mobile, static on desktop */}
      <div className="flex-1 flex justify-center items-center overflow-hidden px-2">
        <div className="md:hidden whitespace-nowrap animate-marquee">
          <span>{content}</span>
          <span className="mx-4">·</span>
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
        className="p-1 rounded-md text-white/70 hover:text-white hover:bg-white/10 transition-colors cursor-pointer shrink-0 ml-2"
        aria-label="Đóng thanh thông báo"
      >
        <X className="size-4" />
      </button>
    </div>
  );
}
