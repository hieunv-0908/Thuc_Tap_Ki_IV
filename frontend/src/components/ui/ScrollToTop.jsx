import { useState, useEffect } from 'react';
import { ArrowUp } from 'lucide-react';

/**
 * ScrollToTop floating button complying with funnyshop-homepage-design.md Section 3.14
 * Minimalist square border, no rounded bubbles.
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
      className="fixed bottom-6 left-6 lg:left-auto lg:right-36 z-40 size-10 bg-paper text-ink border border-line hover:border-ink hover:text-vermilion transition-colors flex items-center justify-center cursor-pointer shadow-none"
      aria-label="Cuộn lên đầu trang"
      title="Lên đầu trang"
    >
      <ArrowUp className="size-4" strokeWidth={1.5} />
    </button>
  );
}
