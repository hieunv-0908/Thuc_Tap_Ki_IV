import React, { useState, useEffect, useRef } from 'react';
import { useSearchParams, useOutletContext } from 'react-router-dom';
import {
  Sparkles,
  SlidersHorizontal,
  Search,
  Package,
  X,
  ArrowRight,
  Gift,
  Flame,
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
import { SORT_OPTIONS } from '../utils/constants';

/**
 * Home page component complying with Design.md 7.1
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

  // Local state for search input debounce
  const [searchTerm, setSearchTerm] = useState(queryQ);
  const productSectionRef = useRef(null);

  // Sync search input if query param changes from external (e.g. Navbar)
  useEffect(() => {
    setSearchTerm(queryQ);
  }, [queryQ]);

  // Load categories once
  useEffect(() => {
    async function fetchCategories() {
      try {
        const cats = await categoryApi.getCategories();
        setCategories(cats || []);
      } catch (err) {
        console.error('Failed to load categories', err);
      }
    }
    fetchCategories();
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

  // Handle Search Input Debounce (300ms)
  useEffect(() => {
    const handler = setTimeout(() => {
      if (searchTerm !== queryQ) {
        updateFilter({ q: searchTerm, page: 1 });
      }
    }, 300);

    return () => clearTimeout(handler);
  }, [searchTerm]);

  const updateFilter = (newParams) => {
    const updated = new URLSearchParams(searchParams);
    Object.entries(newParams).forEach(([key, value]) => {
      if (value !== undefined && value !== null && value !== '' && value !== '1') {
        updated.set(key, value);
      } else if (key === 'page' && value === 1) {
        updated.delete('page');
      } else if (value === '' || value === null || value === undefined) {
        updated.delete(key);
      }
    });
    setSearchParams(updated);
  };

  const handlePageChange = (newPage) => {
    updateFilter({ page: newPage });
    // Scroll smoothly to top of products list
    if (productSectionRef.current) {
      productSectionRef.current.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  };

  const clearAllFilters = () => {
    setSearchTerm('');
    setSearchParams({});
  };

  const hasActiveFilters = Boolean(queryQ || queryCategory || querySort);

  return (
    <div className="mx-auto w-full max-w-7xl px-4 sm:px-6 lg:px-8 py-6 md:py-10">
      {/* 1. Hero Banner */}
      <section className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-primary-600 via-primary-500 to-secondary-600 text-white p-6 sm:p-8 md:p-12 mb-8 shadow-sm">
        {/* Background decorative circles */}
        <div className="absolute -top-12 -right-12 size-56 rounded-full bg-white/10 blur-2xl pointer-events-none" />
        <div className="absolute -bottom-16 -left-12 size-64 rounded-full bg-secondary-900/20 blur-2xl pointer-events-none" />

        <div className="relative z-10 max-w-2xl">
          <div className="inline-flex items-center gap-2 rounded-full bg-white/20 backdrop-blur-xs px-3 py-1 text-xs font-semibold text-white mb-3">
            <Sparkles className="size-3.5" />
            <span>Mùa lễ hội & Quà tặng bất ngờ</span>
          </div>

          <h1 className="text-3xl sm:text-4xl md:text-5xl font-extrabold tracking-tight text-white mb-4 leading-tight">
            Quà tặng vui nhộn <br className="hidden sm:inline" />cho mọi khoảnh khắc! 🎁
          </h1>

          <p className="text-sm sm:text-base text-primary-50 mb-6 leading-relaxed max-w-lg">
            Khám phá hàng trăm món đồ chơi giải trí, quà lưu niệm độc lạ và phụ kiện siêu hài hước
            giúp bạn lan tỏa niềm vui đến người thân và bạn bè.
          </p>

          <div className="flex flex-wrap items-center gap-3">
            <a href="#products-catalog">
              <Button
                variant="outline"
                size="lg"
                rightIcon={ArrowRight}
                className="bg-white text-primary-700 hover:bg-gray-100 border-none shadow-md font-bold"
              >
                Khám phá ngay
              </Button>
            </a>

            <button
              type="button"
              onClick={() => updateFilter({ sort: 'rating_desc', page: 1 })}
              className="inline-flex items-center gap-2 px-4 py-3 rounded-lg bg-black/20 hover:bg-black/30 backdrop-blur-xs text-sm font-semibold transition-colors cursor-pointer"
            >
              <Award className="size-4" />
              <span>Sản phẩm đánh giá cao</span>
            </button>
          </div>
        </div>
      </section>

      {/* 2. Quick Highlight Features */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-4 mb-8">
        <div className="flex items-center gap-3 p-3.5 bg-white rounded-xl border border-line shadow-2xs">
          <div className="size-10 rounded-lg bg-primary-50 text-primary-700 flex items-center justify-center shrink-0">
            <Gift className="size-5" />
          </div>
          <div>
            <h4 className="text-xs font-bold text-ink">Quà tặng độc lạ</h4>
            <p className="text-[11px] text-ink-muted">Cập nhật mỗi tuần</p>
          </div>
        </div>

        <div className="flex items-center gap-3 p-3.5 bg-white rounded-xl border border-line shadow-2xs">
          <div className="size-10 rounded-lg bg-secondary-50 text-secondary-600 flex items-center justify-center shrink-0">
            <Flame className="size-5" />
          </div>
          <div>
            <h4 className="text-xs font-bold text-ink">Đang Hot trend</h4>
            <p className="text-[11px] text-ink-muted">Capybara, gối ôm 1m</p>
          </div>
        </div>

        <div className="flex items-center gap-3 p-3.5 bg-white rounded-xl border border-line shadow-2xs">
          <div className="size-10 rounded-lg bg-emerald-50 text-emerald-700 flex items-center justify-center shrink-0">
            <Award className="size-5" />
          </div>
          <div>
            <h4 className="text-xs font-bold text-ink">Chất lượng tuyển chọn</h4>
            <p className="text-[11px] text-ink-muted">An toàn & bền đẹp</p>
          </div>
        </div>

        <div className="flex items-center gap-3 p-3.5 bg-white rounded-xl border border-line shadow-2xs">
          <div className="size-10 rounded-lg bg-amber-50 text-amber-700 flex items-center justify-center shrink-0">
            <Sparkles className="size-5" />
          </div>
          <div>
            <h4 className="text-xs font-bold text-ink">Trợ lý AI gợi ý</h4>
            <p className="text-[11px] text-ink-muted">Tư vấn thông minh</p>
          </div>
        </div>
      </div>

      {/* 3. Filter & Sort Bar Section */}
      <div id="products-catalog" ref={productSectionRef} className="pt-2 mb-6">
        {/* Categories Chips */}
        <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-none">
          <button
            type="button"
            onClick={() => updateFilter({ category: '', page: 1 })}
            className={`shrink-0 h-9 px-4 rounded-full text-sm font-semibold transition-all cursor-pointer ${
              !queryCategory
                ? 'bg-primary-700 text-white shadow-xs'
                : 'bg-white border border-line text-ink hover:bg-gray-50'
            }`}
          >
            Tất cả danh mục
          </button>

          {categories.map((cat) => {
            const isSelected = String(cat.id) === String(queryCategory);
            return (
              <button
                key={cat.id}
                type="button"
                onClick={() => updateFilter({ category: cat.id, page: 1 })}
                className={`shrink-0 h-9 px-4 rounded-full text-sm font-semibold transition-all cursor-pointer ${
                  isSelected
                    ? 'bg-primary-700 text-white shadow-xs'
                    : 'bg-white border border-line text-ink hover:bg-gray-50'
                }`}
              >
                {cat.name}
              </button>
            );
          })}
        </div>

        {/* Search, Filter count & Sort Row */}
        <div className="mt-4 flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3 pt-3 border-t border-line">
          {/* Live Search inside catalog */}
          <div className="relative flex-1 max-w-sm">
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Tìm theo tên sản phẩm..."
              className="h-10 w-full rounded-lg border border-line bg-white pl-9 pr-8 text-sm text-ink placeholder:text-ink-subtle focus:border-secondary-500 focus:outline-none focus:ring-1 focus:ring-secondary-200"
            />
            <Search className="size-4 text-ink-subtle absolute left-3 top-3 pointer-events-none" />
            {searchTerm && (
              <button
                type="button"
                onClick={() => {
                  setSearchTerm('');
                  updateFilter({ q: '', page: 1 });
                }}
                className="absolute right-2.5 top-2.5 text-ink-subtle hover:text-ink p-0.5"
                aria-label="Xóa từ khóa"
              >
                <X className="size-3.5" />
              </button>
            )}
          </div>

          <div className="flex items-center justify-between md:justify-end gap-3">
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
            <div className="relative flex items-center">
              <select
                value={querySort}
                onChange={(e) => updateFilter({ sort: e.target.value, page: 1 })}
                aria-label="Sắp xếp sản phẩm"
                className="h-10 rounded-lg border border-line bg-white px-3 pr-8 text-xs sm:text-sm font-medium text-ink focus:border-secondary-500 focus:outline-none focus:ring-1 focus:ring-secondary-200 cursor-pointer"
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

        {/* Active filter badges */}
        {hasActiveFilters && (
          <div className="mt-3 flex items-center gap-2 flex-wrap text-xs">
            <span className="text-ink-subtle">Bộ lọc đang áp dụng:</span>
            {queryQ && (
              <span className="inline-flex items-center gap-1 bg-primary-50 text-primary-700 px-2.5 py-1 rounded-full font-medium border border-primary-200">
                Từ khóa: &quot;{queryQ}&quot;
                <button
                  type="button"
                  onClick={() => {
                    setSearchTerm('');
                    updateFilter({ q: '', page: 1 });
                  }}
                  className="hover:text-primary-900"
                >
                  <X className="size-3" />
                </button>
              </span>
            )}
            {queryCategory && (
              <span className="inline-flex items-center gap-1 bg-secondary-50 text-secondary-700 px-2.5 py-1 rounded-full font-medium border border-secondary-200">
                Danh mục:{' '}
                {categories.find((c) => String(c.id) === String(queryCategory))?.name || queryCategory}
                <button
                  type="button"
                  onClick={() => updateFilter({ category: '', page: 1 })}
                  className="hover:text-secondary-900"
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
                  className="hover:text-ink-subtle"
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

      {/* 4. Products Grid Section with Loading, Empty & Error States */}
      <div>
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
          <EmptyState
            icon={Package}
            title="Không tìm thấy sản phẩm phù hợp"
            description="Hãy thử thay đổi từ khóa tìm kiếm hoặc chọn danh mục khác nhé!"
            actionLabel={hasActiveFilters ? 'Xóa bộ lọc' : undefined}
            onAction={hasActiveFilters ? clearAllFilters : undefined}
          />
        ) : (
          <>
            <div className="grid grid-cols-2 gap-3 md:grid-cols-3 md:gap-4 xl:grid-cols-4 xl:gap-6">
              {products.map((p) => (
                <ProductCard
                  key={p.id}
                  product={p}
                  onClick={(product) => onSelectProduct && onSelectProduct(product)}
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
    </div>
  );
}
