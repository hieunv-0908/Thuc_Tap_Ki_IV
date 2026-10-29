import { useState, useEffect } from 'react';
import { ArrowUp } from 'lucide-react';

/**
 * ScrollToTop floating button per Design.md 3.4
 */
export default function ScrollToTop() {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      if (window.scrollY > 400) {
        setVisible(true);
      } else {
        setVisible(false);
      }
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  if (!visible) return null;

  return (
    <button
      type="button"
      onClick={scrollToTop}
      className="fixed bottom-4 left-4 lg:left-auto lg:right-24 z-40 size-11 rounded-full bg-white text-ink border border-line shadow-md hover:bg-gray-50 hover:text-primary-700 hover:border-primary-200 active:scale-95 transition-all flex items-center justify-center cursor-pointer animate-in fade-in zoom-in-75 duration-200"
      aria-label="Cuộn lên đầu trang"
      title="Lên đầu trang"
    >
      <ArrowUp className="size-5" />
    </button>
  );
}
