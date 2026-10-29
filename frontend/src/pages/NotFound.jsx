import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Home, ArrowLeft, Search } from 'lucide-react';
import Button from '../components/ui/Button';

/**
 * 404 NotFound page complying with Design.md 7.11 (v2.0)
 * Background: bg-gradient-to-br from-primary-50 via-white to-secondary-50 + bg-dots
 * Giant 404 in text-primary-200 with floating lost teddy 🧸
 */
export default function NotFound() {
  const navigate = useNavigate();
  const [searchTerm, setSearchTerm] = useState('');

  const handleSearch = (e) => {
    e.preventDefault();
    if (searchTerm.trim()) {
      navigate(`/?q=${encodeURIComponent(searchTerm.trim())}`);
    }
  };

  return (
    <div className="relative min-h-[calc(100vh-10rem)] flex flex-col items-center justify-center text-center px-4 py-16 bg-gradient-to-br from-primary-50 via-white to-secondary-50 bg-dots overflow-hidden">
      {/* Giant 404 backdrop text & Floating Teddy (Design.md 7.11) */}
      <div className="relative flex items-center justify-center mb-6 select-none">
        <span
          className="text-8xl sm:text-9xl md:text-[12rem] font-black text-primary-200/80 leading-none tracking-tight"
          aria-hidden="true"
        >
          404
        </span>
        <span
          className="absolute text-6xl sm:text-7xl md:text-8xl animate-[float_5s_ease-in-out_infinite]"
          aria-hidden="true"
        >
          🧸
        </span>
      </div>

      <span className="text-xs font-bold uppercase tracking-widest text-primary-700 bg-primary-100 px-3 py-1 rounded-full mb-3">
        Lỗi không tìm thấy trang
      </span>

      <h1 className="text-2xl sm:text-3xl md:text-4xl font-extrabold text-ink mb-3 max-w-lg">
        Úi, chú gấu bông này đã bị lạc mất rồi!
      </h1>

      <p className="text-sm sm:text-base text-ink-muted max-w-md mb-8 leading-relaxed">
        Trang bạn đang tìm kiếm có thể đã được đổi tên, chuyển đi hoặc không tồn tại trên FunnyShop.
      </p>

      {/* Quick Search Box (Design.md 7.11) */}
      <form onSubmit={handleSearch} className="w-full max-w-md relative mb-6">
        <input
          type="text"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          placeholder="Tìm sản phẩm quà tặng khác..."
          className="h-11 w-full rounded-full border border-line bg-white pl-11 pr-24 text-sm text-ink placeholder:text-ink-subtle focus:outline-none focus:border-secondary-500 focus:ring-2 focus:ring-secondary-200 shadow-soft"
        />
        <Search className="size-4 text-ink-subtle absolute left-4 top-3.5 pointer-events-none" />
        <button
          type="submit"
          className="absolute right-1.5 top-1.5 h-8 px-4 rounded-full bg-primary-700 text-white text-xs font-semibold hover:bg-primary-800 transition-colors cursor-pointer"
        >
          Tìm
        </button>
      </form>

      {/* Suggested category chips */}
      <div className="flex items-center justify-center gap-2 flex-wrap text-xs mb-8">
        <span className="text-ink-subtle">Gợi ý xem nhanh:</span>
        <Link
          to="/?category=3"
          className="px-3 py-1 rounded-full bg-white border border-line shadow-2xs hover:bg-primary-50 hover:text-primary-700 transition-colors font-medium"
        >
          🧩 Đồ chơi vui nhộn
        </Link>
        <Link
          to="/?category=4"
          className="px-3 py-1 rounded-full bg-white border border-line shadow-2xs hover:bg-primary-50 hover:text-primary-700 transition-colors font-medium"
        >
          🧸 Gối ôm Capybara
        </Link>
        <Link
          to="/?category=1"
          className="px-3 py-1 rounded-full bg-white border border-line shadow-2xs hover:bg-primary-50 hover:text-primary-700 transition-colors font-medium"
        >
          🔑 Phụ kiện độc lạ
        </Link>
      </div>

      {/* Two Action Buttons */}
      <div className="flex items-center gap-3">
        <Link to="/">
          <Button variant="primary" size="md" leftIcon={Home} className="font-semibold shadow-brand">
            Về trang chủ
          </Button>
        </Link>
        <Button
          variant="outline"
          size="md"
          leftIcon={ArrowLeft}
          onClick={() => navigate(-1)}
          className="font-semibold"
        >
          Quay lại
        </Button>
      </div>
    </div>
  );
}
