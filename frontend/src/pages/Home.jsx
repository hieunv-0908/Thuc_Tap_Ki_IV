import { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { useSearchParams, useNavigate, Link } from 'react-router-dom';
import {
  Search,
  X,
  ArrowRight,
  ChevronLeft,
  ChevronRight,
  ArrowLeft,
} from 'lucide-react';
import { productApi } from '../api/product';
import { categoryApi } from '../api/category';
import ProductCard from '../components/product/ProductCard';
import { ProductCardSkeleton } from '../components/ui/Skeleton';
import { toast } from '../store/toastStore';
import { SORT_OPTIONS } from '../utils/constants';

/**
 * Home page component complying with funnyshop-homepage-design.md
 * Japanese Minimalist (Ma 間, Kanso 簡素)
 * Retains 100% of business logic, API calls, filters, sorting and routing.
 */
export default function Home() {
  const [searchParams, setSearchParams] = useSearchParams();
  const navigate = useNavigate();

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

  // Search input state (debounce 300ms)
  const [searchTerm, setSearchTerm] = useState(queryQ);
  const [previousQueryQ, setPreviousQueryQ] = useState(queryQ);
  const productSectionRef = useRef(null);
  const carouselRef = useRef(null);

  // Newsletter state
  const [newsletterEmail, setNewsletterEmail] = useState('');
  const [newsletterError, setNewsletterError] = useState('');

  // Synchronize external search updates
  if (previousQueryQ !== queryQ) {
    setPreviousQueryQ(queryQ);
    setSearchTerm(queryQ);
  }

  // Helper to update search params
  const updateFilter = useCallback(
    (newParams) => {
      setSearchParams((prevParams) => {
        const updated = new URLSearchParams(prevParams);
        Object.entries(newParams).forEach(([key, value]) => {
          if (value === '' || value === null || value === undefined) {
            updated.delete(key);
          } else if (key === 'page') {
            if (value === 1 || value === '1' || value === 0 || value === '0') {
              updated.delete('page');
            } else {
              updated.set('page', value);
            }
          } else {
            updated.set(key, value);
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
        if (!isCancelled) {
          console.error('Failed to load categories', err);
          toast.error('Không thể tải danh mục sản phẩm. Một số bộ lọc có thể bị hạn chế.');
        }
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
          page: Math.max(0, queryPage - 1),
          size: 8,
        });

        if (!isCancelled) {
          setProducts(response.content || []);
          setTotalPages(response.totalPages || 1);
          setTotalElements(response.totalElements || 0);
        }
      } catch (err) {
        if (!isCancelled) {
          setError(err.message || 'Không thể tải danh sách sản phẩm.');
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

  // Check if filtering/searching or beyond page 1 (Focus View)
  const isFilteringOrSearching = Boolean(queryQ || queryCategory || queryPage > 1);
  const hasActiveFilters = Boolean(queryQ || queryCategory || querySort);

  // Featured products (rating >= 4.8 or top rated)
  const featuredProducts = useMemo(() => {
    return [...products]
      .sort((a, b) => (b.rating || 0) - (a.rating || 0))
      .slice(0, 8);
  }, [products]);

  // Current category name for focused header
  const currentCategoryName = useMemo(() => {
    if (!queryCategory) return '';
    const match = categories.find((c) => String(c.id) === String(queryCategory));
    return match ? match.name : 'Danh mục';
  }, [categories, queryCategory]);

  // Combined categories with "Tất cả" option
  const allCategoryItems = useMemo(() => {
    const allItem = { id: '', name: 'Tất cả', isAll: true };
    return [allItem, ...categories];
  }, [categories]);

  const scrollCarousel = (direction) => {
    if (carouselRef.current) {
      const offset = direction === 'left' ? -300 : 300;
      carouselRef.current.scrollBy({ left: offset, behavior: 'smooth' });
    }
  };

  // Newsletter submission handler
  const handleNewsletterSubmit = (e) => {
    e.preventDefault();
    setNewsletterError('');
    if (!newsletterEmail.trim() || !newsletterEmail.includes('@')) {
      setNewsletterError('Vui lòng nhập địa chỉ email hợp lệ.');
      return;
    }
    toast.success('Cảm ơn bạn đã đăng ký nhận bản tin thời trang FunnyShop!');
    setNewsletterEmail('');
  };

  return (
    <div className="relative w-full bg-paper min-h-screen text-ink antialiased">
      {/* Container: tối đa 1200px, padding ngang 32px */}
      <div className="mx-auto w-full max-w-[1200px] px-6 sm:px-8 py-8 md:py-12 space-y-20 md:space-y-24">
        
        {/* =========================================================================
            1. HERO SECTION (Chỉ ở chế độ mặc định)
            Ref: funnyshop-homepage-design.md Section 3.3
            ========================================================================= */}
        {!isFilteringOrSearching && (
          <section className="pt-4 md:pt-8">
            <div className="grid grid-cols-1 lg:grid-cols-[1.1fr_1fr] items-center gap-12 lg:gap-16">
              {/* Left Column */}
              <div>
                <span className="text-xs uppercase tracking-[0.25em] font-medium text-vermilion block mb-4">
                  BỘ SƯU TẬP 2026
                </span>

                <h1 className="font-serif font-light text-4xl sm:text-5xl lg:text-[56px] text-ink leading-[1.18] tracking-[0.04em] mb-6">
                  Giản dị, mà có chiều sâu.
                </h1>

                <p className="text-base sm:text-lg font-light text-mute leading-relaxed max-w-xl mb-10">
                  Thời trang tối giản lấy cảm hứng từ tinh thần Nhật Bản. Chất liệu cotton tự nhiên thoáng mát, đường may chuẩn xác, tôn lên form dáng thanh thoát của người Việt.
                </p>

                <div className="flex items-center gap-6 mb-12">
                  <a href="#products-catalog">
                    <button
                      type="button"
                      className="border border-ink bg-transparent text-ink hover:bg-ink hover:text-paper px-8 py-3.5 text-xs sm:text-sm uppercase tracking-[0.16em] font-light transition-colors duration-200 cursor-pointer"
                    >
                      Khám phá ngay
                    </button>
                  </a>

                  <button
                    type="button"
                    onClick={() => updateFilter({ sort: 'rating_desc', page: 1 })}
                    className="text-xs sm:text-sm uppercase tracking-[0.16em] font-light text-ink hover:text-vermilion underline underline-offset-8 transition-colors cursor-pointer"
                  >
                    Mẫu bán chạy
                  </button>
                </div>

                {/* Real stats row under 1px line */}
                <div className="pt-6 border-t border-line flex flex-wrap items-center gap-6 text-xs font-light text-mute uppercase tracking-[0.12em]">
                  <span>{totalElements}+ mẫu thiết kế</span>
                  <span className="text-line">·</span>
                  <span>{categories.length} danh mục</span>
                  <span className="text-line">·</span>
                  <span>7 ngày đổi size miễn phí</span>
                </div>
              </div>

              {/* Right Column: Lookbook image 4:5 with vertical kanji text */}
              <div className="relative aspect-[4/5] w-full max-w-md mx-auto lg:max-w-none bg-sand border border-line overflow-hidden">
                <img
                  src="https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?q=80&w=1200&auto=format&fit=crop"
                  alt="FunnyShop Lookbook 2026"
                  fetchPriority="high"
                  className="w-full h-full object-cover object-top filter grayscale-[15%]"
                />
                {/* Chữ dọc 新作 2026 (Bộ sưu tập mới 2026) */}
                <div className="absolute top-6 right-6 writing-vertical-rl text-xs font-serif font-light tracking-[0.3em] text-paper bg-ink/75 py-3 px-1.5 select-none pointer-events-none">
                  新作 2026
                </div>
              </div>
            </div>
          </section>
        )}

        {/* =========================================================================
            2. TRUSTBAR (4 cột chữ thanh lịch giữa 2 đường kẻ 1px)
            Ref: funnyshop-homepage-design.md Section 3.4
            ========================================================================= */}
        {!isFilteringOrSearching && (
          <div className="border-y border-line py-8">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-6 sm:gap-8 text-center sm:text-left">
              <div className="space-y-1">
                <h4 className="text-xs sm:text-sm font-medium uppercase tracking-[0.14em] text-ink">
                  Giao hàng toàn quốc
                </h4>
                <p className="text-xs font-light text-mute">Nhận hàng tận nhà trong 2–4 ngày</p>
              </div>

              <div className="space-y-1">
                <h4 className="text-xs sm:text-sm font-medium uppercase tracking-[0.14em] text-ink">
                  Thanh toán khi nhận
                </h4>
                <p className="text-xs font-light text-mute">Kiểm tra đồng kiểm rồi mới trả COD</p>
              </div>

              <div className="space-y-1">
                <h4 className="text-xs sm:text-sm font-medium uppercase tracking-[0.14em] text-ink">
                  Hỗ trợ đổi size
                </h4>
                <p className="text-xs font-light text-mute">Đổi size linh hoạt trong vòng 7 ngày</p>
              </div>

              <div className="space-y-1">
                <h4 className="text-xs sm:text-sm font-medium uppercase tracking-[0.14em] text-ink">
                  Stylist AI tư vấn
                </h4>
                <p className="text-xs font-light text-mute">Gợi ý phối đồ và chọn size 24/7</p>
              </div>
            </div>
          </div>
        )}

        {/* =========================================================================
            3. KHÁM PHÁ DANH MỤC (Lưới ô viền mảnh 1px + số thứ tự 01-06)
            Ref: funnyshop-homepage-design.md Section 3.5
            ========================================================================= */}
        {!isFilteringOrSearching && (
          <section className="space-y-8">
            <div className="flex items-baseline justify-between border-b border-line pb-4">
              <div>
                <span className="text-xs font-light uppercase tracking-[0.25em] text-mute block mb-1">
                  CATEGORY
                </span>
                <h2 className="font-serif font-light text-2xl sm:text-3xl text-ink">
                  Danh mục trang phục
                </h2>
              </div>
              <span className="text-xs font-light text-mute uppercase tracking-widest hidden sm:inline">
                00 — {String(allCategoryItems.length - 1).padStart(2, '0')}
              </span>
            </div>

            {/* Category Grid */}
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4 sm:gap-6">
              {allCategoryItems.map((cat, idx) => {
                const isAll = cat.isAll || !cat.id;
                const isSelected = isAll ? !queryCategory : String(cat.id) === String(queryCategory);
                const orderNumber = String(idx).padStart(2, '0');

                return (
                  <button
                    key={cat.id || 'all'}
                    type="button"
                    onClick={() => {
                      updateFilter({ category: cat.id || '', page: 1 });
                      if (productSectionRef.current) {
                        productSectionRef.current.scrollIntoView({ behavior: 'smooth', block: 'start' });
                      }
                    }}
                    className={`group text-left p-5 sm:p-6 border transition-colors duration-200 cursor-pointer flex flex-col justify-between min-h-[140px] ${
                      isSelected
                        ? 'border-ink bg-sand/30'
                        : 'border-line hover:border-ink bg-paper'
                    }`}
                  >
                    <span className="text-[11px] font-mono font-light text-mute tracking-widest">
                      {orderNumber}
                    </span>

                    <div className="mt-4">
                      <h3 className="font-serif font-light text-base text-ink group-hover:text-vermilion transition-colors line-clamp-1">
                        {cat.name}
                      </h3>
                      <span className="text-[11px] uppercase tracking-wider text-mute mt-1 block">
                        {isAll ? 'Tất cả' : 'Khám phá →'}
                      </span>
                    </div>
                  </button>
                );
              })}
            </div>
          </section>
        )}

        {/* =========================================================================
            4. BÁN CHẠY (Rating >= 4.8)
            Ref: funnyshop-homepage-design.md Section 3.6
            ========================================================================= */}
        {!isFilteringOrSearching && featuredProducts.length > 0 && (
          <section className="space-y-6">
            <div className="flex items-baseline justify-between border-b border-line pb-4">
              <div>
                <span className="text-xs font-light uppercase tracking-[0.25em] text-mute block mb-1">
                  BESTSELLERS
                </span>
                <h2 className="font-serif font-light text-2xl sm:text-3xl text-ink">
                  Trang phục bán chạy nhất
                </h2>
              </div>

              <div className="flex items-center gap-4">
                <a
                  href="#products-catalog"
                  className="text-xs uppercase tracking-wider text-ink hover:text-vermilion underline underline-offset-4 font-light"
                >
                  Xem tất cả
                </a>
                <div className="hidden sm:flex items-center gap-1 border-l border-line pl-4">
                  <button
                    type="button"
                    onClick={() => scrollCarousel('left')}
                    className="size-8 border border-line text-ink hover:border-ink flex items-center justify-center transition-colors cursor-pointer"
                    aria-label="Cuộn sang trái"
                  >
                    <ChevronLeft className="size-4" strokeWidth={1.5} />
                  </button>
                  <button
                    type="button"
                    onClick={() => scrollCarousel('right')}
                    className="size-8 border border-line text-ink hover:border-ink flex items-center justify-center transition-colors cursor-pointer"
                    aria-label="Cuộn sang phải"
                  >
                    <ChevronRight className="size-4" strokeWidth={1.5} />
                  </button>
                </div>
              </div>
            </div>

            {/* Bestseller Carousel */}
            <div
              ref={carouselRef}
              className="flex gap-6 overflow-x-auto pb-4 [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden"
            >
              {featuredProducts.map((p) => (
                <div key={p.id} className="w-56 sm:w-64 shrink-0">
                  <ProductCard product={p} onClick={(prod) => navigate(`/products/${prod.id}`)} />
                </div>
              ))}
            </div>
          </section>
        )}

        {/* =========================================================================
            5. HAI BANNER PHONG CÁCH
            Ref: funnyshop-homepage-design.md Section 3.7
            Banner 1: nền sand, Banner 2: nền ink
            ========================================================================= */}
        {!isFilteringOrSearching && (
          <section className="grid grid-cols-1 md:grid-cols-2 gap-6 sm:gap-8">
            {/* Banner 1: Thường ngày, tối giản (Nền sand) */}
            <div className="bg-sand p-8 sm:p-10 border border-line flex flex-col justify-between min-h-[220px]">
              <div>
                <span className="text-xs uppercase tracking-[0.2em] font-light text-mute block mb-2">
                  01 / EVERYDAY BASIC
                </span>
                <h3 className="font-serif font-light text-2xl sm:text-3xl text-ink mb-3">
                  Thường ngày, tối giản
                </h3>
                <p className="text-xs sm:text-sm font-light text-mute leading-relaxed max-w-sm mb-6">
                  Áo thun 100% cotton thoáng mát, sơ mi form rộng chuẩn phong cách tối giản thanh lịch.
                </p>
              </div>

              <div>
                <a href="#products-catalog">
                  <span className="inline-flex items-center gap-2 text-xs uppercase tracking-[0.16em] font-light text-ink hover:text-vermilion underline underline-offset-6 transition-colors">
                    Khám phá phong cách <ArrowRight className="size-3.5" />
                  </span>
                </a>
              </div>
            </div>

            {/* Banner 2: Dạo phố, nổi bật (Nền ink, chữ paper) */}
            <div className="bg-ink text-paper p-8 sm:p-10 border border-line flex flex-col justify-between min-h-[220px]">
              <div>
                <span className="text-xs uppercase tracking-[0.2em] font-light text-sand/80 block mb-2">
                  02 / STREETWEAR &amp; TRENDY
                </span>
                <h3 className="font-serif font-light text-2xl sm:text-3xl text-paper mb-3">
                  Dạo phố, nổi bật
                </h3>
                <p className="text-xs sm:text-sm font-light text-sand/80 leading-relaxed max-w-sm mb-6">
                  Váy đầm tôn dáng, áo khoác bomber và hoodie phong cách trẻ trung chuẩn xu hướng 2026.
                </p>
              </div>

              <div>
                <a href="#products-catalog">
                  <span className="inline-flex items-center gap-2 text-xs uppercase tracking-[0.16em] font-light text-paper hover:text-vermilion underline underline-offset-6 transition-colors">
                    Xem bộ sưu tập <ArrowRight className="size-3.5" />
                  </span>
                </a>
              </div>
            </div>
          </section>
        )}

        {/* =========================================================================
            6. MAIN CATALOG SECTION (Sticky Toolbar + Grid + Pagination)
            Ref: funnyshop-homepage-design.md Section 3.8 & 3.9
            ========================================================================= */}
        <section id="products-catalog" ref={productSectionRef} className="pt-4 scroll-mt-24">
          
          {/* Focus View Breadcrumb (Hiện khi có lọc, tìm kiếm hoặc trang >= 2) */}
          {isFilteringOrSearching ? (
            <div className="mb-6 pb-4 border-b border-line flex flex-col sm:flex-row sm:items-baseline justify-between gap-4">
              <div>
                <div className="text-xs font-light uppercase tracking-wider text-mute flex items-center gap-2 mb-1.5">
                  <Link to="/" onClick={clearAllFilters} className="hover:text-ink">
                    Trang chủ
                  </Link>
                  <span>/</span>
                  <span className="text-ink">
                    {queryQ
                      ? `Tìm kiếm: "${queryQ}"`
                      : currentCategoryName || 'Danh mục trang phục'}
                  </span>
                </div>
                <h2 className="font-serif font-light text-2xl sm:text-3xl text-ink">
                  {queryQ ? `Kết quả tìm kiếm cho "${queryQ}"` : currentCategoryName}
                </h2>
              </div>

              <button
                type="button"
                onClick={clearAllFilters}
                className="text-xs uppercase tracking-wider text-mute hover:text-ink underline underline-offset-4 font-light cursor-pointer self-start sm:self-auto"
              >
                Xóa tất cả bộ lọc
              </button>
            </div>
          ) : (
            <div className="border-b border-line pb-4 mb-6">
              <span className="text-xs font-light uppercase tracking-[0.25em] text-mute block mb-1">
                COLLECTION
              </span>
              <h2 className="font-serif font-light text-2xl sm:text-3xl text-ink">
                Tất cả trang phục
              </h2>
            </div>
          )}

          {/* Sticky Toolbar: Category Chips + Search + Sort */}
          <div className="sticky top-[72px] z-30 bg-paper/95 backdrop-blur-md py-4 border-b border-line space-y-3">
            {/* Category Chips Scroll */}
            <div className="flex items-center gap-6 overflow-x-auto pb-1 scrollbar-none">
              <button
                type="button"
                onClick={() => updateFilter({ category: '', page: 1 })}
                className={`shrink-0 text-xs uppercase tracking-[0.15em] font-light pb-1 transition-colors cursor-pointer ${
                  !queryCategory
                    ? 'border-b-2 border-ink font-medium text-ink'
                    : 'text-mute hover:text-ink'
                }`}
              >
                Tất cả
              </button>

              {categories.map((cat) => {
                const isSelected = String(cat.id) === String(queryCategory);
                return (
                  <button
                    key={cat.id}
                    type="button"
                    onClick={() => updateFilter({ category: cat.id, page: 1 })}
                    className={`shrink-0 text-xs uppercase tracking-[0.15em] font-light pb-1 transition-colors cursor-pointer ${
                      isSelected
                        ? 'border-b-2 border-ink font-medium text-ink'
                        : 'text-mute hover:text-ink'
                    }`}
                  >
                    {cat.name}
                  </button>
                );
              })}
            </div>

            {/* Search Input, Count & Sort */}
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4 pt-1">
              {/* Search box with underline */}
              <div className="relative flex-1 max-w-sm">
                <input
                  type="text"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  placeholder="Tìm theo tên trang phục..."
                  className="h-9 w-full border-b border-line bg-transparent pl-7 pr-7 text-xs font-light text-ink placeholder:text-mute focus:outline-none focus:border-ink transition-colors"
                />
                <Search className="size-3.5 text-mute absolute left-0 top-3 pointer-events-none" />
                {searchTerm && (
                  <button
                    type="button"
                    onClick={() => {
                      setSearchTerm('');
                      updateFilter({ q: '', page: 1 });
                    }}
                    className="absolute right-0 top-2.5 text-mute hover:text-ink p-0.5 cursor-pointer"
                    aria-label="Xóa từ khóa"
                  >
                    <X className="size-3.5" />
                  </button>
                )}
              </div>

              <div className="flex items-center justify-between sm:justify-end gap-6 text-xs font-light text-mute">
                <span className="uppercase tracking-wider">
                  {loading ? 'Đang tìm...' : `Tìm thấy ${totalElements} sản phẩm`}
                </span>

                {/* Sort Dropdown */}
                <div className="relative">
                  <select
                    value={querySort}
                    onChange={(e) => updateFilter({ sort: e.target.value, page: 1 })}
                    aria-label="Sắp xếp sản phẩm"
                    className="h-9 border-b border-line bg-transparent px-2 pr-6 text-xs uppercase tracking-wider font-light text-ink focus:outline-none focus:border-ink cursor-pointer"
                  >
                    {SORT_OPTIONS.map((opt) => (
                      <option key={opt.value} value={opt.value} className="bg-paper text-ink">
                        {opt.label}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            </div>

            {/* Active Filters Badges */}
            {hasActiveFilters && (
              <div className="flex items-center gap-3 flex-wrap text-xs pt-1 border-t border-line/60">
                <span className="text-mute font-light uppercase tracking-wider text-[11px]">Đang lọc:</span>
                {queryQ && (
                  <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 border border-line text-ink text-xs font-light">
                    Từ khóa: &quot;{queryQ}&quot;
                    <button
                      type="button"
                      onClick={() => {
                        setSearchTerm('');
                        updateFilter({ q: '', page: 1 });
                      }}
                      className="hover:text-vermilion cursor-pointer"
                      aria-label="Xóa từ khóa"
                    >
                      <X className="size-3" />
                    </button>
                  </span>
                )}
                {queryCategory && (
                  <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 border border-line text-ink text-xs font-light">
                    Danh mục: {currentCategoryName}
                    <button
                      type="button"
                      onClick={() => updateFilter({ category: '', page: 1 })}
                      className="hover:text-vermilion cursor-pointer"
                      aria-label="Xóa danh mục"
                    >
                      <X className="size-3" />
                    </button>
                  </span>
                )}
                {querySort && (
                  <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 border border-line text-ink text-xs font-light">
                    Sắp xếp: {SORT_OPTIONS.find((s) => s.value === querySort)?.label || querySort}
                    <button
                      type="button"
                      onClick={() => updateFilter({ sort: '', page: 1 })}
                      className="hover:text-vermilion cursor-pointer"
                      aria-label="Xóa sắp xếp"
                    >
                      <X className="size-3" />
                    </button>
                  </span>
                )}
                <button
                  type="button"
                  onClick={clearAllFilters}
                  className="text-xs uppercase tracking-wider text-vermilion hover:underline ml-2 font-light cursor-pointer"
                >
                  Xóa tất cả
                </button>
              </div>
            )}
          </div>

          {/* Product Grid */}
          <div className="pt-8">
            {loading ? (
              <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-x-6 gap-y-12">
                {Array.from({ length: 8 }).map((_, i) => (
                  <ProductCardSkeleton key={i} />
                ))}
              </div>
            ) : error ? (
              <div className="py-16 text-center border border-line p-8 space-y-4">
                <p className="font-serif text-lg text-ink font-light">Không thể tải danh sách sản phẩm.</p>
                <p className="text-xs text-mute font-light">{error}</p>
                <button
                  type="button"
                  onClick={() => updateFilter({ page: queryPage })}
                  className="border border-ink px-6 py-2.5 text-xs uppercase tracking-widest text-ink hover:bg-ink hover:text-paper transition-colors"
                >
                  Thử lại
                </button>
              </div>
            ) : products.length === 0 ? (
              <div className="py-20 text-center border border-line p-8 space-y-4">
                <p className="font-serif text-xl text-ink font-light">
                  Không tìm thấy trang phục phù hợp.
                </p>
                <p className="text-xs text-mute font-light">
                  Hãy thử chọn từ khóa khác hoặc danh mục khác.
                </p>
                {hasActiveFilters && (
                  <button
                    type="button"
                    onClick={clearAllFilters}
                    className="border border-ink px-6 py-2.5 text-xs uppercase tracking-widest text-ink hover:bg-ink hover:text-paper transition-colors mt-2"
                  >
                    Xóa tất cả bộ lọc
                  </button>
                )}
              </div>
            ) : (
              <>
                <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-x-6 gap-y-12">
                  {products.map((p) => (
                    <ProductCard
                      key={p.id}
                      product={p}
                      onClick={(prod) => navigate(`/products/${prod.id}`)}
                    />
                  ))}
                </div>

                {/* Minimalist Text-based Pagination: ← 1 2 3 → */}
                {totalPages > 1 && (
                  <div className="mt-16 pt-8 border-t border-line flex items-center justify-center gap-6 text-sm font-light">
                    <button
                      type="button"
                      disabled={queryPage <= 1}
                      onClick={() => handlePageChange(queryPage - 1)}
                      className="p-2 text-ink disabled:text-line hover:text-vermilion transition-colors cursor-pointer disabled:cursor-not-allowed"
                      aria-label="Trang trước"
                    >
                      <ArrowLeft className="size-4" strokeWidth={1.5} />
                    </button>

                    <div className="flex items-center gap-4">
                      {Array.from({ length: totalPages }).map((_, idx) => {
                        const pageNum = idx + 1;
                        const isCurrent = pageNum === queryPage;
                        return (
                          <button
                            key={pageNum}
                            type="button"
                            onClick={() => handlePageChange(pageNum)}
                            className={`min-w-6 pb-1 transition-colors cursor-pointer ${
                              isCurrent
                                ? 'border-b-2 border-ink font-medium text-ink'
                                : 'text-mute hover:text-ink'
                            }`}
                          >
                            {pageNum}
                          </button>
                        );
                      })}
                    </div>

                    <button
                      type="button"
                      disabled={queryPage >= totalPages}
                      onClick={() => handlePageChange(queryPage + 1)}
                      className="p-2 text-ink disabled:text-line hover:text-vermilion transition-colors cursor-pointer disabled:cursor-not-allowed"
                      aria-label="Trang sau"
                    >
                      <ArrowRight className="size-4" strokeWidth={1.5} />
                    </button>
                  </div>
                )}
              </>
            )}
          </div>
        </section>

        {/* =========================================================================
            7. ĐÁNH GIÁ KHÁCH HÀNG (3 cột trích dẫn thanh lịch)
            Ref: funnyshop-homepage-design.md Section 3.11
            ========================================================================= */}
        {!isFilteringOrSearching && (
          <section className="space-y-8 pt-8 border-t border-line">
            <div className="border-b border-line pb-4">
              <span className="text-xs font-light uppercase tracking-[0.25em] text-mute block mb-1">
                TESTIMONIALS
              </span>
              <h2 className="font-serif font-light text-2xl sm:text-3xl text-ink">
                Đánh giá từ khách hàng
              </h2>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              {/* Review 1 */}
              <div className="space-y-4 md:border-r md:border-line md:pr-8 last:border-r-0">
                <p className="font-serif font-light text-base text-ink leading-relaxed">
                  &ldquo;Áo thun boxy chất vải cotton 250gsm dày dặn, đứng form chuẩn không bị nhão hay bai xù sau nhiều lần giặt. Giao hàng rất nhanh.&rdquo;
                </p>
                <div className="text-xs uppercase tracking-[0.16em] font-light text-mute pt-2">
                  MAI LINH · HÀ NỘI
                </div>
              </div>

              {/* Review 2 */}
              <div className="space-y-4 md:border-r md:border-line md:pr-8 last:border-r-0">
                <p className="font-serif font-light text-base text-ink leading-relaxed">
                  &ldquo;Váy đầm và áo sơ mi tôn dáng lắm, đường may cẩn thận tỉ mỉ từng chi tiết. Stylist AI tư vấn chọn size chuẩn luôn.&rdquo;
                </p>
                <div className="text-xs uppercase tracking-[0.16em] font-light text-mute pt-2">
                  KHÁNH VY · TP. HỒ CHÍ MINH
                </div>
              </div>

              {/* Review 3 */}
              <div className="space-y-4">
                <p className="font-serif font-light text-base text-ink leading-relaxed">
                  &ldquo;Mua áo khoác hoodie và quần ống rộng mặc ưng ý. Đóng gói chỉn chu, có chính sách đổi size 7 ngày tiện lợi.&rdquo;
                </p>
                <div className="text-xs uppercase tracking-[0.16em] font-light text-mute pt-2">
                  HOÀNG NAM · ĐÀ NẴNG
                </div>
              </div>
            </div>
          </section>
        )}

        {/* =========================================================================
            8. NEWSLETTER (Nền sand, input chỉ có gạch chân + nút viền)
            Ref: funnyshop-homepage-design.md Section 3.12
            ========================================================================= */}
        {!isFilteringOrSearching && (
          <section className="bg-sand p-10 sm:p-14 border border-line text-center space-y-6">
            <span className="text-xs uppercase tracking-[0.25em] font-light text-mute block">
              BẢN TIN THỜI TRANG
            </span>

            <h2 className="font-serif font-light text-2xl sm:text-3xl text-ink">
              Nhận bản tin, giảm 10% đơn đầu tiên.
            </h2>

            <p className="text-xs sm:text-sm font-light text-mute max-w-md mx-auto leading-relaxed">
              Cập nhật sớm nhất về các mẫu thiết kế mới, câu chuyện thương hiệu và ưu đãi đặc quyền cho thành viên.
            </p>

            <form onSubmit={handleNewsletterSubmit} className="max-w-md mx-auto space-y-3">
              <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-4">
                <input
                  type="email"
                  value={newsletterEmail}
                  onChange={(e) => setNewsletterEmail(e.target.value)}
                  placeholder="Nhập địa chỉ email của bạn..."
                  className="flex-1 h-10 border-b border-ink bg-transparent text-xs font-light text-ink placeholder:text-mute focus:outline-none transition-colors"
                />

                <button
                  type="submit"
                  className="h-10 px-6 border border-ink text-xs uppercase tracking-widest font-light text-ink hover:bg-ink hover:text-paper transition-colors cursor-pointer shrink-0"
                >
                  Đăng ký
                </button>
              </div>

              {newsletterError && (
                <p className="text-xs text-vermilion text-left font-light">{newsletterError}</p>
              )}
            </form>
          </section>
        )}

      </div>
    </div>
  );
}
