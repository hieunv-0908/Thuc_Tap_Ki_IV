import React from 'react';
import { Link } from 'react-router-dom';
import { Home, ArrowLeft } from 'lucide-react';
import Button from '../components/ui/Button';

/**
 * 404 NotFound page complying with Design.md 7.11
 */
export default function NotFound() {
  return (
    <div className="min-h-[calc(100vh-12rem)] flex flex-col items-center justify-center text-center px-4 py-16">
      <div className="text-7xl mb-4 select-none animate-bounce" aria-hidden="true">
        🎈🧐
      </div>

      <span className="text-sm font-bold uppercase tracking-widest text-primary-700 bg-primary-50 px-3 py-1 rounded-full mb-3">
        Lỗi 404
      </span>

      <h1 className="text-3xl sm:text-4xl font-extrabold text-ink mb-3">
        Không tìm thấy trang
      </h1>

      <p className="text-base text-ink-muted max-w-md mb-8 leading-relaxed">
        Trang bạn đang tìm kiếm có thể đã bị di chuyển, xóa hoặc không tồn tại trên FunnyShop.
      </p>

      <div className="flex items-center gap-3">
        <Link to="/">
          <Button variant="primary" size="md" leftIcon={Home}>
            Về trang chủ
          </Button>
        </Link>
      </div>
    </div>
  );
}
