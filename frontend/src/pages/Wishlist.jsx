import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Heart, ArrowLeft, Loader2, ShoppingBag } from 'lucide-react';
import wishlistApi from '../api/wishlist';
import ProductCard from '../components/product/ProductCard';
import Button from '../components/ui/Button';

import { useWishlistStore } from '../store/wishlistStore';

export default function Wishlist() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [totalElements, setTotalElements] = useState(0);

  const wishlistIds = useWishlistStore((s) => s.wishlistIds);

  useEffect(() => {
    let isMounted = true;
    async function load() {
      try {
        const res = await wishlistApi.getMyWishlist({ page, size: 12 });
        if (!isMounted) return;
        if (res.data) {
          setItems(res.data.content || []);
          setTotalPages(res.data.totalPages || 0);
          setTotalElements(res.data.totalElements || 0);
        }
      } catch (err) {
        console.error('Failed to load wishlist:', err);
      } finally {
        if (isMounted) setLoading(false);
      }
    }
    load();
    return () => { isMounted = false; };
  }, [page, wishlistIds.length]);

  return (
    <div className="mx-auto w-full max-w-7xl px-4 sm:px-6 lg:px-8 py-6 md:py-10 space-y-8">
      {/* Breadcrumb & Header */}
      <div>
        <div className="text-xs text-ink-muted flex items-center gap-1.5 mb-2">
          <Link to="/" className="hover:text-primary-700">
            Trang chủ
          </Link>
          <span>/</span>
          <span className="text-ink font-semibold">Danh sách yêu thích</span>
        </div>

        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-line pb-5">
          <div>
            <h1 className="text-2xl sm:text-3xl font-serif font-bold text-ink flex items-center gap-3">
              <span>Sản phẩm yêu thích</span>
              <span className="text-sm font-normal text-vermilion bg-red-50 border border-red-200 px-3 py-0.5 rounded-full">
                {totalElements} món
              </span>
            </h1>
            <p className="text-xs sm:text-sm text-ink-muted mt-1">
              Lưu giữ những bộ trang phục và phụ kiện bạn đang quan tâm để mua sắm thuận tiện hơn
            </p>
          </div>

          <Link to="/">
            <Button variant="outline" size="sm" leftIcon={ArrowLeft}>
              Tiếp tục mua sắm
            </Button>
          </Link>
        </div>
      </div>

      {/* Main Content */}
      {loading ? (
        <div className="py-24 flex flex-col items-center justify-center gap-3">
          <Loader2 className="size-8 text-vermilion animate-spin" />
          <p className="text-xs text-ink-muted">Đang tải danh sách yêu thích...</p>
        </div>
      ) : items.length === 0 ? (
        <div className="py-20 text-center rounded-3xl bg-gray-50/70 border border-line space-y-4 max-w-lg mx-auto">
          <div className="size-16 rounded-full bg-red-50 text-vermilion flex items-center justify-center mx-auto">
            <Heart className="size-8 stroke-[1.5]" />
          </div>
          <div className="space-y-1">
            <h3 className="text-base font-bold text-ink">Chưa có sản phẩm yêu thích nào</h3>
            <p className="text-xs text-ink-muted">
              Hãy bấm vào biểu tượng trái tim ở bất kỳ sản phẩm nào bạn yêu thích để lưu lại tại đây nhé!
            </p>
          </div>
          <Link to="/">
            <Button variant="primary" size="md" leftIcon={ShoppingBag} className="mt-2">
              Khám phá sản phẩm ngay
            </Button>
          </Link>
        </div>
      ) : (
        <div className="space-y-8">
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 sm:gap-6">
            {items.map((item) => (
              <ProductCard
                key={item.id}
                product={item.product}
              />
            ))}
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex items-center justify-center gap-2 pt-6 border-t border-line">
              <Button
                size="sm"
                variant="outline"
                disabled={page === 0}
                onClick={() => setPage((p) => Math.max(0, p - 1))}
              >
                ← Trang trước
              </Button>
              <span className="text-xs text-ink-muted font-medium px-3">
                Trang {page + 1} / {totalPages}
              </span>
              <Button
                size="sm"
                variant="outline"
                disabled={page >= totalPages - 1}
                onClick={() => setPage((p) => p + 1)}
              >
                Trang sau →
              </Button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

