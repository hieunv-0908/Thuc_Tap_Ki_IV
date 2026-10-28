import { useState, useEffect } from 'react';
import { X, Sparkles } from 'lucide-react';

const STORAGE_KEY = 'funnyshop_announcement_dismissed';

/**
 * AnnouncementBar component complying with Design.md 6.17
 * Height: h-9, bg-secondary-700, marquee on mobile, static centered on desktop
 */
export default function AnnouncementBar() {
  const [dismissed, setDismissed] = useState(true);

  useEffect(() => {
    const isDismissed = sessionStorage.getItem(STORAGE_KEY);
    if (!isDismissed) {
      setDismissed(false);
    }
  }, []);

  const handleDismiss = () => {
    sessionStorage.setItem(STORAGE_KEY, 'true');
    setDismissed(true);
  };

  if (dismissed) return null;

  const content = '🚚 Giao hàng COD toàn quốc · 🎁 Quà tặng vui nhộn mỗi ngày · ⚡ Đổi trả tiện lợi';

  return (
    <div className="relative z-50 h-9 w-full bg-secondary-700 text-white text-xs sm:text-sm font-medium flex items-center justify-between px-3 sm:px-4 overflow-hidden select-none">
      {/* Decorative icon left */}
      <div className="hidden sm:flex items-center gap-1.5 text-secondary-200">
        <Sparkles className="size-3.5" aria-hidden="true" />
      </div>

      {/* Message: marquee on mobile, centered static on desktop */}
      <div className="flex-1 overflow-hidden mx-2 sm:mx-4">
        {/* Mobile Marquee */}
        <div className="sm:hidden whitespace-nowrap inline-block animate-[marquee_20s_linear_infinite]">
          <span className="mx-4">{content}</span>
          <span className="mx-4">{content}</span>
        </div>

        {/* Desktop Static */}
        <div className="hidden sm:block text-center font-medium truncate">
          {content}
        </div>
      </div>

      {/* Dismiss button */}
      <button
        type="button"
        onClick={handleDismiss}
        className="p-1 text-white/80 hover:text-white hover:bg-white/10 rounded transition-colors shrink-0 cursor-pointer"
        aria-label="Đóng thanh thông báo"
      >
        <X className="size-3.5" />
      </button>
    </div>
  );
}
