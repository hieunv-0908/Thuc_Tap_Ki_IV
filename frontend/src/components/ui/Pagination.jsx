import { ChevronLeft, ChevronRight } from 'lucide-react';

/**
 * Pagination component per Design.md 6.8
 */
export default function Pagination({
  currentPage = 1,
  totalPages = 1,
  onPageChange,
  className = '',
}) {
  if (totalPages <= 1) return null;

  const handlePrev = () => {
    if (currentPage > 1) {
      onPageChange(currentPage - 1);
    }
  };

  const handleNext = () => {
    if (currentPage < totalPages) {
      onPageChange(currentPage + 1);
    }
  };

  // Generate page numbers with ellipsis
  const getPageNumbers = () => {
    const pages = [];
    const maxVisible = 5;

    if (totalPages <= maxVisible) {
      for (let i = 1; i <= totalPages; i++) pages.push(i);
    } else {
      if (currentPage <= 3) {
        pages.push(1, 2, 3, 4, '...', totalPages);
      } else if (currentPage >= totalPages - 2) {
        pages.push(1, '...', totalPages - 3, totalPages - 2, totalPages - 1, totalPages);
      } else {
        pages.push(1, '...', currentPage - 1, currentPage, currentPage + 1, '...', totalPages);
      }
    }
    return pages;
  };

  return (
    <nav
      className={`flex items-center justify-center gap-1.5 md:gap-2 select-none ${className}`}
      aria-label="Phân trang"
    >
      <button
        type="button"
        onClick={handlePrev}
        disabled={currentPage === 1}
        className="h-10 px-3 md:px-3.5 inline-flex items-center justify-center gap-1 rounded-lg border border-line bg-white text-sm font-medium text-ink hover:bg-gray-50 active:bg-gray-100 disabled:opacity-40 disabled:cursor-not-allowed transition-colors cursor-pointer"
        aria-label="Trang trước"
      >
        <ChevronLeft className="size-4" />
        <span className="hidden sm:inline">Trước</span>
      </button>

      {/* Mobile view: Trang x / N */}
      <span className="sm:hidden px-3 text-sm font-medium text-ink">
        Trang {currentPage} / {totalPages}
      </span>

      {/* Desktop view: 1 2 3 ... N */}
      <div className="hidden sm:flex items-center gap-1.5">
        {getPageNumbers().map((page, index) => {
          if (page === '...') {
            return (
              <span key={`dots-${index}`} className="size-10 inline-flex items-center justify-center text-ink-subtle">
                …
              </span>
            );
          }

          const isActive = page === currentPage;
          return (
            <button
              key={page}
              type="button"
              onClick={() => onPageChange(page)}
              aria-current={isActive ? 'page' : undefined}
              className={`size-10 inline-flex items-center justify-center rounded-lg text-sm font-semibold transition-colors cursor-pointer ${
                isActive
                  ? 'bg-primary-700 text-white shadow-sm'
                  : 'border border-line bg-white text-ink hover:bg-gray-50'
              }`}
            >
              {page}
            </button>
          );
        })}
      </div>

      <button
        type="button"
        onClick={handleNext}
        disabled={currentPage === totalPages}
        className="h-10 px-3 md:px-3.5 inline-flex items-center justify-center gap-1 rounded-lg border border-line bg-white text-sm font-medium text-ink hover:bg-gray-50 active:bg-gray-100 disabled:opacity-40 disabled:cursor-not-allowed transition-colors cursor-pointer"
        aria-label="Trang sau"
      >
        <span className="hidden sm:inline">Sau</span>
        <ChevronRight className="size-4" />
      </button>
    </nav>
  );
}
