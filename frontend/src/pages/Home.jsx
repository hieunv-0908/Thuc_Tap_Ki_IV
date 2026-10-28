import { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { useSearchParams, useOutletContext, Link } from 'react-router-dom';
import {
  Search,
  Package,
  X,
  ArrowRight,
  Truck,
  Wallet,
  RotateCcw,
  Headphones,
  Quote,
  Sparkles,
  Award,
} from 'lucide-react';
import { productApi } from '../api/product';
import { categoryApi } from '../api/category';
import ProductCard from '../components/product/ProductCard';
import { ProductCardSkeleton } from '../components/ui/Skeleton';
import EmptyState from '../components/ui/EmptyState';
import ErrorState from '../components/ui/ErrorState';
import Pagination from '../components/ui/Pagination';
import Button from '../components/ui/Button';
import SectionHeader from '../components/ui/SectionHeader';
import { SORT_OPTIONS, getCategoryMeta } from '../utils/constants';

/**
 * Home page component complying with Design.md 7.1 (v2.0)
 */
export default function Home() {
  const [searchParams, setSearchParams] = useSearchParams();
  const { onSelectProduct } = useOutletContext() || {};

  const queryQ = searchParams.get('q') || '';
  const queryCategory = searchParams.get('category') || '';
  const querySort = searchParams.get('sort') || '';
  const queryPage = parseInt(searchParams.get('page') || '1', 10);

  const [categories, setCategories] = useState([]);
  const [products, setProducts] = useState([]);
  const [totalPages, setTotalPages] = useState(1);
  const [totalElements, setTotalElements] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Search input state
  const [searchTerm, setSearchTerm] = useState(queryQ);
  const productSectionRef = useRef(null);

  // Helper to update filter params
  const updateFilter = useCallback(
    (newParams) => {
      setSearchParams((prevParams) => {
        const updated = new URLSearchParams(prevParams);
        Object.entries(newParams).forEach(([key, value]) => {
          if (value !== undefined && value !== null && value !== '' && value !== '1') {
            updated.set(key, value);
          } else if (key === 'page' && (value === 1 || value === '1')) {
            updated.delete('page');
          } else if (value === '' || value === null || value === undefined) {
            updated.delete(key);
          }
        });
        return updated;
      });
    },
    [setSearchParams]
  );

  // Load categories once
  useEffect(() => {
    let isCancelled = false;
    categoryApi
      .getCategories()
      .then((cats) => {
        if (!isCancelled) {
          setCategories(cats || []);
        }
      })
      .catch((err) => {
        console.error('Failed to load categories', err);
      });

    return () => {
      isCancelled = true;
    };
  }, []);

  // Fetch products whenever search params change
  useEffect(() => {
    let isCancelled = false;

    async function fetchProducts() {
      setLoading(true);
      setError(null);
      try {
        const response = await productApi.getProducts({
          q: queryQ,
          categoryId: queryCategory,
          sort: querySort,
          page: queryPage,
          size: 8,
        });

        if (!isCancelled) {
          setProducts(response.content || []);
          setTotalPages(response.totalPages || 1);
          setTotalElements(response.totalElements || 0);
        }
      } catch (err) {
        if (!isCancelled) {
          setError(err.message || 'Không tải được danh sách sản phẩm.');
        }
      } finally {
        if (!isCancelled) {
          setLoading(false);
        }
      }
    }

    fetchProducts();

    return () => {
      isCancelled = true;
    };
  }, [queryQ, queryCategory, querySort, queryPage]);

  // Debounce search input
  useEffect(() => {
    const handler = setTimeout(() => {
      if (searchTerm !== queryQ) {
        updateFilter({ q: searchTerm, page: 1 });
      }
    }, 300);

    return () => clearTimeout(handler);
  }, [searchTerm, queryQ, updateFilter]);

  const handlePageChange = (newPage) => {
    updateFilter({ page: newPage });
    if (productSectionRef.current) {
      productSectionRef.current.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  };

  const clearAllFilters = () => {
    setSearchTerm('');
    setSearchParams({});
  };

  // Check if filtering/searching or beyond page 1 per Design.md 7.1:
  // "Khi đang lọc/tìm/phân trang: ẩn Hero, TrustBar, Được yêu thích, Banner đôi, Đánh giá, Bản tin; thay bằng tiêu đề gọn"
  const isFilteringOrSearching = Boolean(queryQ || queryCategory || queryPage > 1);
  const hasActiveFilters = Boolean(queryQ || queryCategory || querySort);

  // Featured products (rating >= 4.8 or top rated) for the highlight block
  const featuredProducts = useMemo(() => {
    return [...products]
      .sort((a, b) => (b.rating || 0) - (a.rating || 0))
      .slice(0, 4);
  }, [products]);

  // Current category name for focused header
  const currentCategoryName = useMemo(() => {
    if (!queryCategory) return '';
    const match = categories.find((c) => String(c.id) === String(queryCategory));
    return match ? match.name : 'Danh mục';
  }, [categories, queryCategory]);

  return (
    <div className="mx-auto w-full max-w-7xl px-4 sm:px-6 lg:px-8 py-6 md:py-10 space-y-10 md:space-y-14">
      {/* 1. Hero & Decorative Blocks (Shown ONLY when not searching/filtering/paging) */}
      {!isFilteringOrSearching && (
        <>
          {/* Hero Banner (Design.md 7.1) */}
          <section className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-primary-600 via-primary-500 to-secondary-600 p-6 sm:p-10 md:p-12 text-white shadow-brand">
            {/* Soft decorative blur blobs (Design.md 2.7.3) */}
            <div
              className="absolute -top-12 -right-12 size-56 rounded-full bg-white/10 blur-2xl pointer-events-none"
              aria-hidden="true"
            />
            <div
              className="absolute -bottom-16 -left-12 size-64 rounded-full bg-secondary-900/30 blur-2xl pointer-events-none"
              aria-hidden="true"
            />

            {/* Floating emojis (Design.md 2.7.3) */}
            <span
              className="absolute top-6 right-16 text-4xl opacity-60 animate-[float_5s_ease-in-out_infinite] select-none pointer-events-none hidden md:block"
              aria-hidden="true"
            >
              🎈
            </span>
            <span
              className="absolute bottom-10 right-1/3 text-4xl opacity-50 animate-[float-slow_8s_ease-in-out_infinite] select-none pointer-events-none hidden lg:block"
              aria-hidden="true"
            >
              🧸
            </span>
            <span
              className="absolute top-1/2 right-12 text-3xl opacity-50 animate-[float_5s_ease-in-out_infinite] select-none pointer-events-none hidden md:block"
              aria-hidden="true"
            >
              ⭐
            </span>

            <div className="relative z-10 flex flex-col md:flex-row items-center justify-between gap-8">
              {/* Left Column Content */}
              <div className="max-w-xl text-left">
                <div className="inline-flex items-center gap-2 rounded-full bg-white/20 backdrop-blur-xs px-3.5 py-1 text-xs font-semibold text-white mb-4">
                  <Sparkles className="size-3.5" aria-hidden="true" />
                  <span>🎁 Quà tặng vui nhộn</span>
                </div>

                <h1 className="text-3xl sm:text-4xl md:text-5xl font-extrabold tracking-tight text-white mb-4 leading-tight">
                  Quà tặng{' '}
                  <span className="underline decoration-wavy decoration-white/60 underline-offset-8">
                    vui nhộn
                  </span>{' '}
                  cho mọi dịp!
                </h1>

                <p className="text-base sm:text-lg font-medium text-white/90 mb-6 leading-relaxed">
                  Gấu bông, đồ chơi, phụ kiện sáng tạo giúp cuộc sống luôn tràn ngập tiếng cười và niềm vui bất ngờ.
                </p>

                <div className="flex flex-wrap items-center gap-3 mb-6">
                  <a href="#products-catalog">
                    <Button
                      variant="light"
                      size="lg"
                      rightIcon={ArrowRight}
                      className="font-bold"
                    >
                      Khám phá ngay
                    </Button>
                  </a>

                  <Button
                    variant="onDark"
                    size="lg"
                    leftIcon={Award}
                    onClick={() => updateFilter({ sort: 'rating_desc', page: 1 })}
                  >
                    Xem hàng hot
                  </Button>
                </div>

                {/* Real stats row (Design.md 7.1) */}
                <div className="pt-2 border-t border-white/20 flex items-center gap-4 text-xs sm:text-sm text-white/80 font-medium">
                  <span>✨ {totalElements}+ sản phẩm phong phú</span>
                  <span>•</span>
                  <span>🏷️ {categories.length} danh mục độc đáo</span>
                </div>
              </div>

              {/* Right Column: Hero Visual Stack (3 tilted cards on desktop) */}
              <div className="hidden md:flex relative items-center justify-center w-72 lg:w-80 h-72">
                <div className="absolute inset-0 rounded-3xl bg-white/10 backdrop-blur-sm -rotate-6 transition-transform" />
                <div className="absolute inset-2 rounded-3xl bg-white/15 backdrop-blur-sm rotate-3 transition-transform" />
                <div className="relative z-10 w-64 rounded-2xl bg-white p-4 text-ink shadow-2xl flex flex-col items-center text-center animate-[float_5s_ease-in-out_infinite]">
                  <span className="text-6xl mb-2 select-none" aria-hidden="true">
                    🧸
                  </span>
                  <span className="text-xs font-bold text-primary-700 bg-primary-50 px-2.5 py-0.5 rounded-full mb-1">
                    Bán chạy tuần này
                  </span>
                  <h4 className="text-sm font-bold text-ink">Gấu bông Capybara 40cm</h4>
                  <p className="text-xs text-ink-muted mt-0.5">Êm ái & đáng yêu</p>
                  <div className="mt-2 text-base font-bold text-primary-700">189.000 ₫</div>
                </div>
              </div>
            </div>
          </section>

          {/* 2. TrustBar (Section 6.20) */}
          <div className="rounded-2xl border border-line bg-white p-4 sm:p-6 shadow-soft">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 sm:gap-6">
              <div className="flex items-center gap-3">
                <div className="size-11 rounded-xl bg-primary-50 text-primary-700 flex items-center justify-center shrink-0">
                  <Truck className="size-5" />
                </div>
                <div>
                  <h4 className="text-xs sm:text-sm font-semibold text-ink">Giao hàng toàn quốc</h4>
                  <p className="text-[11px] sm:text-xs text-ink-muted">Nhận hàng tận nhà</p>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <div className="size-11 rounded-xl bg-secondary-50 text-secondary-700 flex items-center justify-center shrink-0">
                  <Wallet className="size-5" />
                </div>
                <div>
                  <h4 className="text-xs sm:text-sm font-semibold text-ink">Thanh toán khi nhận (COD)</h4>
                  <p className="text-[11px] sm:text-xs text-ink-muted">Kiểm tra rồi mới trả tiền</p>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <div className="size-11 rounded-xl bg-primary-50 text-primary-700 flex items-center justify-center shrink-0">
                  <RotateCcw className="size-5" />
                </div>
                <div>
                  <h4 className="text-xs sm:text-sm font-semibold text-ink">Đổi trả dễ dàng</h4>
                  <p className="text-[11px] sm:text-xs text-ink-muted">Hài lòng tuyệt đối</p>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <div className="size-11 rounded-xl bg-secondary-50 text-secondary-700 flex items-center justify-center shrink-0">
                  <Headphones className="size-5" />
                </div>
                <div>
                  <h4 className="text-xs sm:text-sm font-semibold text-ink">Trợ lý AI hỗ trợ</h4>
                  <p className="text-[11px] sm:text-xs text-ink-muted">Hỏi mình bất cứ lúc nào</p>
                </div>
              </div>
            </div>
          </div>

          {/* 3. CategoryGrid & Tiles (Section 6.19) */}
          <div>
            <SectionHeader
              eyebrow="✨ Khám phá"
              title="Danh mục sản phẩm"
              description="Tìm kiếm theo chủ đề yêu thích của bạn một cách nhanh chóng"
            />

            <div className="grid grid-cols-3 sm:grid-cols-6 gap-3 sm:gap-4">
              {/* All categories tile */}
              <button
                type="button"
                onClick={() => updateFilter({ category: '', page: 1 })}
                className={`group flex flex-col items-center gap-2 rounded-2xl p-3 sm:p-4 text-center shadow-soft transition-all hover:-translate-y-1 hover:shadow-md cursor-pointer ${
                  !queryCategory
                    ? 'ring-2 ring-primary-700 bg-primary-50'
                    : 'bg-white border border-line'
                }`}
              >
                <div className="size-11 sm:size-12 rounded-2xl bg-primary-100 flex items-center justify-center text-xl sm:text-2xl transition-transform -rotate-6 group-hover:rotate-0">
                  🎈
                </div>
                <span className="text-xs sm:text-sm font-semibold text-ink">Tất cả</span>
              </button>

              {/* Individual Category Tiles */}
              {categories.map((cat) => {
                const meta = getCategoryMeta(cat.name);
                const isSelected = String(cat.id) === String(queryCategory);

                return (
                  <button
                    key={cat.id}
                    type="button"
                    onClick={() => updateFilter({ category: cat.id, page: 1 })}
                    className={`group flex flex-col items-center gap-2 rounded-2xl p-3 sm:p-4 text-center shadow-soft transition-all hover:-translate-y-1 hover:shadow-md cursor-pointer ${
                      isSelected
                        ? `ring-2 ring-primary-700 ${meta.bg}`
                        : `${meta.bg} border border-line/60`
                    }`}
                  >
                    <div
                      className={`size-11 sm:size-12 rounded-2xl ${meta.sticker} flex items-center justify-center text-xl sm:text-2xl transition-transform -rotate-6 group-hover:rotate-0`}
                    >
                      {meta.emoji}
                    </div>
                    <span className="text-xs sm:text-sm font-semibold text-ink line-clamp-1">
                      {cat.name}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* 4. Được yêu thích nhất Block (Design.md 7.1: bg-primary-50 bg-dots rounded-3xl) */}
          {featuredProducts.length > 0 && (
            <div className="rounded-3xl bg-primary-50 bg-dots p-6 sm:p-8 md:p-10 border border-primary-200">
              <SectionHeader
                eyebrow="❤️ Được yêu thích nhất"
                title="Sản phẩm đánh giá cao"
                description="Những món đồ được khách hàng FunnyShop chọn mua và khen ngợi nhiều nhất"
                actionLabel="Xem tất cả →"
                actionHref="#products-catalog"
              />

              <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-5">
                {featuredProducts.map((p) => (
                  <ProductCard
                    key={p.id}
                    product={p}
                    onClick={(prod) => onSelectProduct && onSelectProduct(prod)}
                  />
                ))}
              </div>
            </div>
          )}

          {/* 5. Dual Promo Banners (Section 6.23 & 2.7.1) */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            <div className="rounded-2xl p-6 sm:p-8 overflow-hidden relative bg-secondary-50 border border-secondary-200 shadow-soft flex flex-col justify-between">
              <span
                className="absolute right-4 bottom-2 text-7xl select-none opacity-40 animate-[float-slow_8s_ease-in-out_infinite] pointer-events-none"
                aria-hidden="true"
              >
                🧸
              </span>
              <div className="relative z-10 max-w-xs">
                <span className="text-xs font-bold text-secondary-700 uppercase tracking-wider">
                  Bộ sưu tập mới
                </span>
                <h3 className="text-xl font-bold text-ink mt-1 mb-2">
                  Gối & Thú bông siêu mềm
                </h3>
                <p className="text-xs sm:text-sm text-ink-muted mb-4">
                  Đem lại giấc ngủ ngon và nụ cười ấm áp cho không gian sống của bạn.
                </p>
              </div>
              <div className="relative z-10">
                <Button
                  variant="link"
                  size="sm"
                  rightIcon={ArrowRight}
                  onClick={() => updateFilter({ category: 4, page: 1 })}
                >
                  Khám phá ngay
                </Button>
              </div>
            </div>

            <div className="rounded-2xl p-6 sm:p-8 overflow-hidden relative bg-primary-50 border border-primary-200 shadow-soft flex flex-col justify-between">
              <span
                className="absolute right-4 bottom-2 text-7xl select-none opacity-40 animate-[float_5s_ease-in-out_infinite] pointer-events-none"
                aria-hidden="true"
              >
                🎁
              </span>
              <div className="relative z-10 max-w-xs">
                <span className="text-xs font-bold text-primary-700 uppercase tracking-wider">
                  Ý tưởng độc lạ
                </span>
                <h3 className="text-xl font-bold text-ink mt-1 mb-2">
                  Hộp quà bất ngờ Mystery
                </h3>
                <p className="text-xs sm:text-sm text-ink-muted mb-4">
                  Mở ra những điều kỳ thú làm quà sinh nhật hay kỷ niệm đáng nhớ.
                </p>
              </div>
              <div className="relative z-10">
                <Button
                  variant="link"
                  size="sm"
                  rightIcon={ArrowRight}
                  onClick={() => updateFilter({ category: 3, page: 1 })}
                >
                  Xem chi tiết
                </Button>
              </div>
            </div>
          </div>
        </>
      )}

      {/* 6. Main Products Catalog Section */}
      <section id="products-catalog" ref={productSectionRef} className="pt-2">
        {/* If searching or filtering: display breadcrumb & clear filter title */}
        {isFilteringOrSearching ? (
          <div className="mb-6 p-5 rounded-2xl bg-white border border-line shadow-soft flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <div className="text-xs text-ink-muted flex items-center gap-1.5 mb-1">
                <Link to="/" onClick={clearAllFilters} className="hover:text-primary-700">
                  Trang chủ
                </Link>
                <span>&gt;</span>
                <span className="text-ink font-semibold">
                  {queryQ
                    ? `Tìm kiếm: "${queryQ}"`
                    : currentCategoryName || 'Danh mục sản phẩm'}
                </span>
              </div>
              <h2 className="text-xl md:text-2xl font-bold text-ink">
                {queryQ ? `Kết quả tìm kiếm cho "${queryQ}"` : currentCategoryName}
              </h2>
            </div>

            <Button variant="outline" size="sm" onClick={clearAllFilters}>
              Xóa tất cả bộ lọc
            </Button>
          </div>
        ) : (
          <SectionHeader
            eyebrow="🛍️ Mua sắm"
            title="Tất cả sản phẩm"
            description="Tìm kiếm và chọn lựa những món đồ yêu thích của bạn"
          />
        )}

        {/* Toolbar: Category Chips Scroll + Search + Sort */}
        <div className="sticky top-16 z-30 bg-page/95 backdrop-blur-md py-3 border-y border-line space-y-3">
          {/* Category Chips Scroll */}
          <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none">
            <button
              type="button"
              onClick={() => updateFilter({ category: '', page: 1 })}
              className={`shrink-0 h-9 px-4 rounded-full text-xs sm:text-sm font-semibold transition-all cursor-pointer ${
                !queryCategory
                  ? 'bg-primary-700 text-white shadow-xs'
                  : 'bg-white border border-line text-ink hover:bg-gray-50'
              }`}
            >
              Tất cả
            </button>

            {categories.map((cat) => {
              const meta = getCategoryMeta(cat.name);
              const isSelected = String(cat.id) === String(queryCategory);
              return (
                <button
                  key={cat.id}
                  type="button"
                  onClick={() => updateFilter({ category: cat.id, page: 1 })}
                  className={`shrink-0 inline-flex items-center gap-1.5 h-9 px-3.5 rounded-full text-xs sm:text-sm font-semibold transition-all cursor-pointer ${
                    isSelected
                      ? 'bg-primary-700 text-white shadow-xs'
                      : 'bg-white border border-line text-ink hover:bg-gray-50'
                  }`}
                >
                  <span>{meta.emoji}</span>
                  <span>{cat.name}</span>
                </button>
              );
            })}
          </div>

          {/* Search Input, Count & Sort row */}
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 pt-1">
            <div className="relative flex-1 max-w-sm">
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Tìm theo tên sản phẩm..."
                className="h-10 w-full rounded-lg border border-line bg-white pl-9 pr-8 text-xs sm:text-sm text-ink placeholder:text-ink-subtle focus:border-secondary-500 focus:outline-none focus:ring-2 focus:ring-secondary-200"
              />
              <Search className="size-4 text-ink-subtle absolute left-3 top-3 pointer-events-none" />
              {searchTerm && (
                <button
                  type="button"
                  onClick={() => {
                    setSearchTerm('');
                    updateFilter({ q: '', page: 1 });
                  }}
                  className="absolute right-2.5 top-2.5 text-ink-subtle hover:text-ink p-0.5 cursor-pointer"
                  aria-label="Xóa từ khóa"
                >
                  <X className="size-3.5" />
                </button>
              )}
            </div>

            <div className="flex items-center justify-between sm:justify-end gap-3">
              <span className="text-xs sm:text-sm font-medium text-ink-muted">
                {loading ? (
                  'Đang tìm...'
                ) : (
                  <>
                    Tìm thấy <strong className="text-ink">{totalElements}</strong> sản phẩm
                  </>
                )}
              </span>

              {/* Sort Select */}
              <div className="relative">
                <select
                  value={querySort}
                  onChange={(e) => updateFilter({ sort: e.target.value, page: 1 })}
                  aria-label="Sắp xếp sản phẩm"
                  className="h-10 rounded-lg border border-line bg-white px-3 pr-8 text-xs sm:text-sm font-medium text-ink focus:border-secondary-500 focus:outline-none focus:ring-2 focus:ring-secondary-200 cursor-pointer"
                >
                  {SORT_OPTIONS.map((opt) => (
                    <option key={opt.value} value={opt.value}>
                      {opt.label}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          {/* Active Filter Badges */}
          {hasActiveFilters && (
            <div className="flex items-center gap-2 flex-wrap text-xs pt-1">
              <span className="text-ink-subtle font-medium">Bộ lọc đang bật:</span>
              {queryQ && (
                <span className="inline-flex items-center gap-1 bg-secondary-50 text-secondary-700 px-2.5 py-1 rounded-full font-medium border border-secondary-200">
                  Từ khóa: &quot;{queryQ}&quot;
                  <button
                    type="button"
                    onClick={() => {
                      setSearchTerm('');
                      updateFilter({ q: '', page: 1 });
                    }}
                    className="hover:text-secondary-900 cursor-pointer"
                    aria-label="Xóa từ khóa"
                  >
                    <X className="size-3" />
                  </button>
                </span>
              )}
              {queryCategory && (
                <span className="inline-flex items-center gap-1 bg-secondary-50 text-secondary-700 px-2.5 py-1 rounded-full font-medium border border-secondary-200">
                  Danh mục: {currentCategoryName}
                  <button
                    type="button"
                    onClick={() => updateFilter({ category: '', page: 1 })}
                    className="hover:text-secondary-900 cursor-pointer"
                    aria-label="Xóa danh mục"
                  >
                    <X className="size-3" />
                  </button>
                </span>
              )}
              {querySort && (
                <span className="inline-flex items-center gap-1 bg-gray-100 text-ink px-2.5 py-1 rounded-full font-medium border border-line">
                  Sắp xếp: {SORT_OPTIONS.find((s) => s.value === querySort)?.label || querySort}
                  <button
                    type="button"
                    onClick={() => updateFilter({ sort: '', page: 1 })}
                    className="hover:text-ink-subtle cursor-pointer"
                    aria-label="Xóa sắp xếp"
                  >
                    <X className="size-3" />
                  </button>
                </span>
              )}
              <button
                type="button"
                onClick={clearAllFilters}
                className="text-primary-700 font-semibold hover:underline ml-1 cursor-pointer"
              >
                Xóa tất cả
              </button>
            </div>
          )}
        </div>

        {/* 7. Product Grid with Loading, Empty & Error States */}
        <div className="pt-6">
          {loading ? (
            <div className="grid grid-cols-2 gap-3 md:grid-cols-3 md:gap-4 xl:grid-cols-4 xl:gap-6">
              {Array.from({ length: 8 }).map((_, i) => (
                <ProductCardSkeleton key={i} />
              ))}
            </div>
          ) : error ? (
            <ErrorState
              title="Không tải được sản phẩm"
              message={error}
              onRetry={() => updateFilter({ page: queryPage })}
            />
          ) : products.length === 0 ? (
            <div className="bg-grid rounded-3xl p-8 sm:p-12 border border-line">
              <EmptyState
                icon={Package}
                title="Không tìm thấy sản phẩm phù hợp"
                description="Hãy thử đổi từ khóa tìm kiếm hoặc chọn một danh mục sản phẩm khác nhé!"
                actionLabel={hasActiveFilters ? 'Xóa bộ lọc' : undefined}
                onAction={hasActiveFilters ? clearAllFilters : undefined}
              />
            </div>
          ) : (
            <>
              <div className="grid grid-cols-2 gap-3 md:grid-cols-3 md:gap-4 xl:grid-cols-4 xl:gap-6">
                {products.map((p) => (
                  <ProductCard
                    key={p.id}
                    product={p}
                    onClick={(prod) => onSelectProduct && onSelectProduct(prod)}
                  />
                ))}
              </div>

              {/* Pagination */}
              <div className="mt-10 mb-4 flex justify-center">
                <Pagination
                  currentPage={queryPage}
                  totalPages={totalPages}
                  onPageChange={handlePageChange}
                />
              </div>
            </>
          )}
        </div>
      </section>

      {/* 8. Testimonials Section (Only shown on default home view) */}
      {!isFilteringOrSearching && (
        <section className="rounded-3xl bg-secondary-50 p-6 sm:p-10 border border-secondary-200">
          <SectionHeader
            eyebrow="💬 Đánh giá từ khách hàng"
            title="Khách nói gì về FunnyShop"
            description="Những phản hồi chân thật từ các bạn trẻ đã trải nghiệm sản phẩm của FunnyShop"
            variant="secondary"
          />

          <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
            <div className="bg-white rounded-2xl p-5 shadow-soft border border-line flex flex-col justify-between">
              <div>
                <Quote className="size-6 text-secondary-300 mb-2" />
                <p className="text-sm text-ink leading-relaxed mb-4">
                  &ldquo;Gối ôm Capybara nhận được to và êm hơn mình nghĩ, đóng gói rất cẩn thận và giao nhanh cực kỳ!&rdquo;
                </p>
              </div>
              <div className="flex items-center gap-3 pt-3 border-t border-line">
                <div className="size-9 rounded-full bg-primary-100 text-primary-700 font-bold text-xs flex items-center justify-center">
                  ML
                </div>
                <div>
                  <h4 className="text-xs font-bold text-ink">Mai Linh</h4>
                  <p className="text-[11px] text-ink-muted">Hà Nội</p>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-2xl p-5 shadow-soft border border-line flex flex-col justify-between">
              <div>
                <Quote className="size-6 text-secondary-300 mb-2" />
                <p className="text-sm text-ink leading-relaxed mb-4">
                  &ldquo;Mua hộp quà tặng sinh nhật bạn thân, bạn mình thích mê vì đồ vừa độc lạ vừa đáng yêu. Sẽ ủng hộ shop dài lâu!&rdquo;
                </p>
              </div>
              <div className="flex items-center gap-3 pt-3 border-t border-line">
                <div className="size-9 rounded-full bg-secondary-100 text-secondary-700 font-bold text-xs flex items-center justify-center">
                  HA
                </div>
                <div>
                  <h4 className="text-xs font-bold text-ink">Hoàng Anh</h4>
                  <p className="text-[11px] text-ink-muted">TP. Hồ Chí Minh</p>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-2xl p-5 shadow-soft border border-line flex flex-col justify-between">
              <div>
                <Quote className="size-6 text-secondary-300 mb-2" />
                <p className="text-sm text-ink leading-relaxed mb-4">
                  &ldquo;Trợ lý AI tư vấn chọn quà rất hợp gu, thanh toán COD kiểm tra hàng chuẩn chỉnh rồi mới thanh toán.&rdquo;
                </p>
              </div>
              <div className="flex items-center gap-3 pt-3 border-t border-line">
                <div className="size-9 rounded-full bg-amber-100 text-amber-800 font-bold text-xs flex items-center justify-center">
                  TD
                </div>
                <div>
                  <h4 className="text-xs font-bold text-ink">Tuấn Dũng</h4>
                  <p className="text-[11px] text-ink-muted">Đà Nẵng</p>
                </div>
              </div>
            </div>
          </div>
        </section>
      )}
    </div>
  );
}
