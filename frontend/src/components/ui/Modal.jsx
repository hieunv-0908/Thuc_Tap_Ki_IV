import { useEffect, useRef } from 'react';
import { X } from 'lucide-react';

/**
 * Modal component complying with Design.md 6.6
 */
export default function Modal({
  isOpen,
  onClose,
  title,
  children,
  maxWidth = 'max-w-md',
  showCloseButton = true,
}) {
  const modalRef = useRef(null);

  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };

    // Lock body scroll
    const originalOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';

    window.addEventListener('keydown', handleKeyDown);

    return () => {
      document.body.style.overflow = originalOverflow;
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs transition-opacity animate-in fade-in duration-200"
      role="dialog"
      aria-modal="true"
      onClick={(e) => {
        if (e.target === e.currentTarget) {
          onClose();
        }
      }}
    >
      <div
        ref={modalRef}
        className={`bg-white rounded-xl shadow-xl w-full ${maxWidth} p-6 relative border border-line transform transition-all animate-in zoom-in-95 duration-200`}
      >
        <div className="flex items-center justify-between mb-4">
          {title ? (
            <h3 className="text-lg font-semibold text-ink leading-tight">{title}</h3>
          ) : (
            <div />
          )}

          {showCloseButton && (
            <button
              type="button"
              onClick={onClose}
              className="p-1 rounded-lg text-ink-subtle hover:text-ink hover:bg-gray-100 transition-colors cursor-pointer"
              aria-label="Đóng cửa sổ"
            >
              <X className="size-5" />
            </button>
          )}
        </div>

        <div>{children}</div>
      </div>
    </div>
  );
}
