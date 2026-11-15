import { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { useSearchParams, useNavigate, Link } from 'react-router-dom';
import {
  Search,
  Shirt,
  X,
  ArrowRight,
  Truck,
  Wallet,
  RotateCcw,
  Sparkles,
  Quote,
  ChevronLeft,
  ChevronRight,
  CheckCircle2,
  Mail,
  Send,
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
import { toast } from '../store/toastStore';
import { SORT_OPTIONS, getCategoryMeta } from '../utils/constants';

/**
 * Home page component complying with Design.md 7.1 (v2.1 Fashion & Full-Bleed Hero)
 * Retains 100% of business logic while upgrading UI presentation.
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

  // Search input state
  const [searchTerm, setSearchTerm] = useState(queryQ);
  const [previousQueryQ, setPreviousQueryQ] = useState(queryQ);
  const productSectionRef = useRef(null);
  const carouselRef = useRef(null);

  // Newsletter state (UI only)
  const [newsletterEmail, setNewsletterEmail] = useState('');

  // High-performance Lerp physics spotlight for side flanks (Zero React re-renders)
  const leftGlowRef = useRef(null);
  const rightGlowRef = useRef(null);
  const targetY = useRef(350);
  const currentY = useRef(350);
  const isGlowVisible = useRef(false);

  useEffect(() => {
    if (typeof window === 'undefined') return;

    let rafId = null;

    const handleMouseMove = (e) => {
      targetY.current = e.clientY;
      if (!isGlowVisible.current) {
        isGlowVisible.current = true;
        if (leftGlowRef.current) leftGlowRef.current.style.opacity = '0.75';
        if (rightGlowRef.current) rightGlowRef.current.style.opacity = '0.75';
      }
    };

    const handleMouseLeave = () => {
      isGlowVisible.current = false;
      if (leftGlowRef.current) leftGlowRef.current.style.opacity = '0';
      if (rightGlowRef.current) rightGlowRef.current.style.opacity = '0';
    };

    // Buttery smooth linear interpolation loop (Lerp with 0.08 damping factor)
    const animateGlow = () => {
      currentY.current += (targetY.current - currentY.current) * 0.08;

      const y = currentY.current;
      if (leftGlowRef.current) {
        leftGlowRef.current.style.transform = `translate3d(-33.33%, ${y}px, 0) translate3d(0, -50%, 0)`;
      }
      if (rightGlowRef.current) {
        rightGlowRef.current.style.transform = `translate3d(33.33%, ${y}px, 0) translate3d(0, -50%, 0)`;
      }

      rafId = requestAnimationFrame(animateGlow);
    };

    window.addEventListener('mousemove', handleMouseMove, { passive: true });
    document.addEventListener('mouseleave', handleMouseLeave);
    rafId = requestAnimationFrame(animateGlow);

    return () => {
      if (rafId) cancelAnimationFrame(rafId);
      window.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseleave', handleMouseLeave);
    };
  }, []);

  if (previousQueryQ !== queryQ) {
    setPreviousQueryQ(queryQ);
    setSearchTerm(queryQ);
  }

  // Helper to update filter params
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
          toast.error('Không thể tải danh mục sản phẩm. Một số tính năng lọc có thể bị hạn chế.');
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
  // "Khi đang lọc/tìm/phân trang: ẩn Hero, TrustBar, Bán chạy, Banner đôi, Đánh giá, Bản tin; thay bằng tiêu đề gọn"
  const isFilteringOrSearching = Boolean(queryQ || queryCategory || queryPage > 1);
  const hasActiveFilters = Boolean(queryQ || queryCategory || querySort);

  // Featured products (rating >= 4.8 or top rated) for the highlight block
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

  // Cuộn tự động liên tục nếu có > 5 danh mục
  const hasManyCategories = categories.length > 5 || allCategoryItems.length > 5;

  // Nhân đôi mảng để seamless infinite loop (scrollLeft reset tại midpoint)
  const marqueeItems = useMemo(() => {
    return [...allCategoryItems, ...allCategoryItems];
  }, [allCategoryItems]);

  // Ref cho track danh mục (overflow-x scroll hidden scrollbar)
  const categoryTrackRef = useRef(null);

  // Category marquee: RAF smooth scroll + reverse wheel + pause on hover
  useEffect(() => {
    if (isFilteringOrSearching || !hasManyCategories) return;

    const track = categoryTrackRef.current;
    if (!track) return;

    const CAT_SPEED = 0.6; // px/frame base speed
    let rafId = null;
    let lastTime = null;
    let isPaused = false;
    let wheelVelocity = 0;
    let wheelTarget = 0;

    const handleWheel = (e) => {
      e.preventDefault();
      // Reverse: wheel scroll down → move LEFT (negative direction)
      wheelTarget += e.deltaY * -0.9;
    };

    const animate = (time) => {
      if (!lastTime) lastTime = time;
      const elapsed = Math.min(time - lastTime, 50);
      lastTime = time;
      const dt = elapsed / 16.67;

      // Smooth lerp for wheel inertia
      wheelVelocity += (wheelTarget - wheelVelocity) * 0.1;
      wheelTarget *= 0.85; // friction

      const autoStep = isPaused ? 0 : CAT_SPEED * dt;
      const totalStep = autoStep + wheelVelocity * dt;

      if (track && Math.abs(totalStep) > 0.005) {
        track.scrollLeft += totalStep;
        // Seamless infinite: when past halfway, jump back; when before 0, jump forward
        const half = track.scrollWidth / 2;
        if (track.scrollLeft >= half) {
          track.scrollLeft -= half;
          wheelVelocity = 0;
          wheelTarget = 0;
        } else if (track.scrollLeft < 0) {
          track.scrollLeft += half;
          wheelVelocity = 0;
          wheelTarget = 0;
        }
      }

      rafId = requestAnimationFrame(animate);
    };

    const onEnter = () => { isPaused = true; };
    const onLeave = () => { isPaused = false; };

    track.addEventListener('wheel', handleWheel, { passive: false });
    track.addEventListener('mouseenter', onEnter);
    track.addEventListener('mouseleave', onLeave);
    track.addEventListener('touchstart', onEnter, { passive: true });
    track.addEventListener('touchend', onLeave, { passive: true });

    rafId = requestAnimationFrame(animate);

    return () => {
      if (rafId) cancelAnimationFrame(rafId);
      track.removeEventListener('wheel', handleWheel);
      track.removeEventListener('mouseenter', onEnter);
      track.removeEventListener('mouseleave', onLeave);
      track.removeEventListener('touchstart', onEnter);
      track.removeEventListener('touchend', onLeave);
    };
  }, [isFilteringOrSearching, hasManyCategories, marqueeItems.length]);

  const scrollCarousel = (direction) => {
    if (carouselRef.current) {
      const offset = direction === 'left' ? -300 : 300;
      carouselRef.current.scrollBy({ left: offset, behavior: 'smooth' });
    }
  };

  // Best-sellers: smooth continuous RAF scroll with reverse-wheel + inertia
  useEffect(() => {
    if (isFilteringOrSearching || featuredProducts.length <= 1) return;

    // Retry until DOM is ready (data loads async so ref may attach after first render)
    let retryCount = 0;
    let rafId = null;
    let cleanupFn = null;

    const start = () => {
      const container = carouselRef.current;
      if (!container) {
        if (retryCount++ < 20) {
          rafId = requestAnimationFrame(start);
        }
        return;
      }

      const BASE_SPEED = 0.5; // px/frame auto-scroll (sub-pixel, smooth)
      let lastTime = null;
      let isPaused = false;
      let wheelTarget = 0;
      let wheelVelocity = 0;
      let autoDirection = 1; // 1 = right, -1 = left (ping-pong)

      const handleWheel = (e) => {
        e.preventDefault();
        // Reverse wheel: scroll down → move LEFT
        wheelTarget += e.deltaY * -1.0;
      };

      const animate = (time) => {
        if (!lastTime) lastTime = time;
        const elapsed = Math.min(time - lastTime, 50); // cap delta (tab-switch guard)
        lastTime = time;
        const dt = elapsed / 16.67;

        // Smooth inertia decay for wheel
        wheelVelocity += (wheelTarget - wheelVelocity) * 0.1;
        wheelTarget *= 0.84;

        const autoStep = isPaused ? 0 : BASE_SPEED * autoDirection * dt;
        const totalStep = autoStep + wheelVelocity * dt;

        const maxScroll = container.scrollWidth - container.clientWidth;
        if (maxScroll > 0 && Math.abs(totalStep) > 0.003) {
          let next = container.scrollLeft + totalStep;

          // Ping-pong: reverse at edges
          if (next >= maxScroll - 1) {
            next = maxScroll;
            autoDirection = -1;
            wheelVelocity = 0;
            wheelTarget = 0;
          } else if (next <= 1) {
            next = 0;
            autoDirection = 1;
            wheelVelocity = 0;
            wheelTarget = 0;
          }

          container.scrollLeft = next;
        }

        rafId = requestAnimationFrame(animate);
      };

      const onEnter = () => { isPaused = true; };
      const onLeave = () => { isPaused = false; };

      container.addEventListener('wheel', handleWheel, { passive: false });
      container.addEventListener('mouseenter', onEnter);
      container.addEventListener('mouseleave', onLeave);
      container.addEventListener('touchstart', onEnter, { passive: true });
      container.addEventListener('touchend', onLeave, { passive: true });

      rafId = requestAnimationFrame(animate);

      cleanupFn = () => {
        cancelAnimationFrame(rafId);
        container.removeEventListener('wheel', handleWheel);
        container.removeEventListener('mouseenter', onEnter);
        container.removeEventListener('mouseleave', onLeave);
        container.removeEventListener('touchstart', onEnter);
        container.removeEventListener('touchend', onLeave);
      };
    };

    rafId = requestAnimationFrame(start);

    return () => {
      cancelAnimationFrame(rafId);
      if (cleanupFn) {
        cleanupFn();
      }
    };
  }, [isFilteringOrSearching, featuredProducts.length]);

  // Newsletter submission handler (UI mock)
  const handleNewsletterSubmit = (e) => {
    e.preventDefault();
    if (!newsletterEmail.trim() || !newsletterEmail.includes('@')) {
      toast.warning('Vui lòng nhập địa chỉ email hợp lệ');
      return;
    }
    toast.success('Cảm ơn bạn đã đăng ký nhận bản tin thời trang FunnyShop!');
    setNewsletterEmail('');
  };

  // Render single category tile with GPU-accelerated hover & active transitions
  const renderCategoryCard = (cat, keySuffix, isClone = false) => {
    const isAll = cat.isAll || !cat.id;
    const meta = isAll
      ? {
          emoji: '✨',
          bg: 'bg-primary-50/70',
          sticker: 'bg-primary-100',
          border: 'border-primary-200',
          text: 'text-primary-700',
        }
      : getCategoryMeta(cat.name);
    const isSelected = isAll ? !queryCategory : String(cat.id) === String(queryCategory);

    return (
      <button
        key={`${cat.id || 'all'}-${keySuffix}`}
        type="button"
        tabIndex={isClone ? -1 : 0}
        onClick={() => {
          updateFilter({ category: cat.id || '', page: 1 });
          if (productSectionRef.current) {
            productSectionRef.current.scrollIntoView({ behavior: 'smooth', block: 'start' });
          }
        }}
        className={`group/card relative flex flex-col items-center justify-center shrink-0 w-52 sm:w-60 md:w-64 h-48 sm:h-56 rounded-3xl p-6 sm:p-7 text-center transition-transform duration-300 ease-out hover:-translate-y-2 hover:shadow-xl cursor-pointer ${
          isSelected
            ? `ring-4 ring-primary-700 ${meta.bg} shadow-md`
            : `${meta.bg} border border-line/70 shadow-soft hover:border-primary-300`
        }`}
      >
        {isSelected && (
          <div className="absolute top-3.5 right-3.5 bg-primary-700 text-white rounded-full p-1 shadow-xs">
            <CheckCircle2 className="size-4" />
          </div>
        )}

        <div
          className={`size-18 sm:size-22 rounded-3xl ${meta.sticker} flex items-center justify-center text-3xl sm:text-4xl shadow-xs transition-transform duration-300 ease-out -rotate-6 group-hover/card:rotate-0 group-hover/card:scale-110`}
        >
          {meta.emoji}
        </div>

        <h4 className="mt-3 text-base sm:text-lg font-bold text-ink group-hover/card:text-primary-700 transition-colors line-clamp-1">
          {cat.name}
        </h4>

        <span className="text-xs sm:text-sm font-medium text-ink-muted mt-1">
          {isAll ? 'Tất cả sản phẩm' : 'Xem bộ sưu tập →'}
        </span>
      </button>
    );
  };

  return (
    <div className="relative w-full overflow-hidden bg-page min-h-screen">
      {/* =========================================================================
          FADED DOT-MATRIX MARGINS (Ý tưởng 4: Họa tiết chấm bi kỹ thuật mờ dần 2 bên sườn)
          Chỉ hiển thị trên màn hình rộng (xl trở lên) ở phần khoảng trống ngoài container
          ========================================================================= */}
      {/* Sườn trái */}
      <div
        className="hidden xl:block absolute inset-y-0 left-0 w-[calc((100%-80rem)/2)] pointer-events-none select-none z-0 overflow-hidden"
        aria-hidden="true"
      >
        <div className="absolute inset-0 bg-dots opacity-80" />
        <div className="absolute inset-0 bg-gradient-to-r from-transparent via-transparent to-page" />
        <div className="absolute inset-y-0 right-0 w-px bg-line" />

        {/* Dynamic mouse-follow spotlight glow on left flank (GPU Accelerated) */}
        <div
          ref={leftGlowRef}
          className="fixed left-0 top-0 w-88 h-88 rounded-full pointer-events-none transition-opacity duration-500 ease-out opacity-0 will-change-transform"
          style={{
            background: 'radial-gradient(circle, rgba(255, 107, 74, 0.32) 0%, rgba(108, 92, 231, 0.16) 45%, transparent 70%)',
            filter: 'blur(36px)',
          }}
        />
      </div>

      {/* Sườn phải */}
      <div
        className="hidden xl:block absolute inset-y-0 right-0 w-[calc((100%-80rem)/2)] pointer-events-none select-none z-0 overflow-hidden"
        aria-hidden="true"
      >
        <div className="absolute inset-0 bg-dots opacity-80" />
        <div className="absolute inset-0 bg-gradient-to-l from-transparent via-transparent to-page" />
        <div className="absolute inset-y-0 left-0 w-px bg-line" />

        {/* Dynamic mouse-follow spotlight glow on right flank (GPU Accelerated) */}
        <div
          ref={rightGlowRef}
          className="fixed right-0 top-0 w-88 h-88 rounded-full pointer-events-none transition-opacity duration-500 ease-out opacity-0 will-change-transform"
          style={{
            background: 'radial-gradient(circle, rgba(108, 92, 231, 0.28) 0%, rgba(255, 107, 74, 0.16) 45%, transparent 70%)',
            filter: 'blur(36px)',
          }}
        />
      </div>

      {/* 1. Hero & Decorative Blocks (Shown ONLY when not searching/filtering/paging) */}
      {!isFilteringOrSearching && (
        <>
          {/* Hero Banner Full-Bleed (Design.md 7.1 & 2.7.1) */}
          <section className="relative w-full overflow-hidden min-h-[460px] md:min-h-[540px] lg:min-h-[600px] flex items-center bg-gray-950">
            {/* Layer 1: Lookbook Fashion Background Image */}
            <img
              src="https://images.unsplash.com/photo-1490481651871-ab68de25d43d?q=80&w=1920&auto=format&fit=crop"
              alt="Bộ sưu tập thời trang FunnyShop"
              fetchPriority="high"
              className="absolute inset-0 h-full w-full object-cover object-center select-none"
            />

            {/* Layer 2: Brand Gradient Overlay (Design.md 2.7.2) */}
            <div
              className="absolute inset-0 bg-gradient-to-r from-gray-950/90 via-primary-950/75 to-secondary-950/50"
              aria-hidden="true"
            />

            {/* Layer 3: Soft ambient glow blobs & floating fashion emojis (Design.md 2.7.3) */}
            <div
              className="absolute -top-16 -right-16 size-72 rounded-full bg-primary-500/20 blur-3xl pointer-events-none"
              aria-hidden="true"
            />
            <div
              className="absolute -bottom-20 -left-20 size-80 rounded-full bg-secondary-500/20 blur-3xl pointer-events-none"
              aria-hidden="true"
            />

            <span
              className="absolute top-10 right-20 text-4xl opacity-50 animate-[float_5s_ease-in-out_infinite] select-none pointer-events-none hidden md:block"
              aria-hidden="true"
            >
              👕
            </span>
            <span
              className="absolute bottom-16 right-1/4 text-4xl opacity-40 animate-[float-slow_8s_ease-in-out_infinite] select-none pointer-events-none hidden lg:block"
              aria-hidden="true"
            >
              👗
            </span>
            <span
              className="absolute top-1/2 right-12 text-3xl opacity-40 animate-[float_5s_ease-in-out_infinite] select-none pointer-events-none hidden md:block"
              aria-hidden="true"
            >
              🧥
            </span>

            {/* Content Container (Standard Grid max-w-7xl) */}
            <div className="relative z-10 mx-auto w-full max-w-7xl px-4 py-12 sm:px-6 md:py-16 lg:px-8 flex flex-col lg:flex-row lg:items-center lg:justify-between gap-10">
              {/* Left Column Content */}
              <div className="max-w-2xl text-left text-white">
                <div className="inline-flex items-center gap-2 rounded-full bg-white/15 backdrop-blur-xs border border-white/25 px-3.5 py-1 text-xs sm:text-sm font-semibold mb-4 text-white">
                  <Sparkles className="size-3.5 text-primary-300" aria-hidden="true" />
                  <span>✨ Bộ sưu tập Thời trang Mới 2026</span>
                </div>

                <h1 className="text-3xl sm:text-4xl md:text-5xl font-extrabold tracking-tight text-white mb-4 leading-tight">
                  Phong cách trẻ trung,{' '}
                  <span className="underline decoration-wavy decoration-primary-300 underline-offset-8">
                    tự tin mỗi ngày!
                  </span>
                </h1>

                <p className="text-base sm:text-lg font-medium text-gray-100 mb-8 leading-relaxed max-w-xl">
                  Khám phá thiết kế hiện đại, chất liệu thoáng mát, chuẩn form dáng Việt. Tôn lên cá tính riêng của bạn trong từng outfit.
                </p>

                <div className="flex flex-wrap items-center gap-3.5 mb-8">
                  <a href="#products-catalog">
                    <Button
                      variant="light"
                      size="lg"
                      rightIcon={ArrowRight}
                      className="font-bold shadow-brand"
                    >
                      Khám phá ngay
                    </Button>
                  </a>

                  <Button
                    variant="onDark"
                    size="lg"
                    onClick={() => updateFilter({ sort: 'rating_desc', page: 1 })}
                  >
                    🔥 Mẫu bán chạy
                  </Button>
                </div>

                {/* Real stats row (Design.md 7.1) */}
                <div className="pt-4 border-t border-white/20 flex flex-wrap items-center gap-4 text-xs sm:text-sm text-gray-200 font-medium">
                  <span>✨ {totalElements}+ mẫu thiết kế</span>
                  <span>•</span>
                  <span>🏷️ {categories.length} danh mục thời trang</span>
                  <span>•</span>
                  <span>🚚 Đổi size miễn phí trong 7 ngày</span>
                </div>
              </div>

              {/* Right Column: Fashion Lookbook Stack (from lg:) */}
              <div className="hidden lg:flex relative items-center justify-center w-80 h-96">
                {/* Back card left */}
                <div className="absolute -left-6 top-4 w-48 aspect-[3/4] rounded-2xl border-2 border-white/60 bg-white shadow-xl overflow-hidden -rotate-6 transition-transform hover:rotate-0 animate-[float_5s_ease-in-out_infinite]">
                  <img
                    src="https://images.unsplash.com/photo-1521572267360-ee0c2909d518?q=80&w=600&auto=format&fit=crop"
                    alt="Áo thun Boxy"
                    className="w-full h-full object-cover object-top"
                  />
                  <div className="absolute bottom-2 inset-x-2 bg-black/60 backdrop-blur-xs rounded-lg p-1.5 text-center text-white text-[11px] font-semibold">
                    Áo Thun Boxy 👕
                  </div>
                </div>

                {/* Back card right */}
                <div className="absolute -right-6 top-6 w-48 aspect-[3/4] rounded-2xl border-2 border-white/60 bg-white shadow-xl overflow-hidden rotate-6 transition-transform hover:rotate-0 animate-[float-slow_8s_ease-in-out_infinite]">
                  <img
                    src="https://images.unsplash.com/photo-1551028719-00167b16eac5?q=80&w=600&auto=format&fit=crop"
                    alt="Áo khoác Streetwear"
                    className="w-full h-full object-cover object-top"
                  />
                  <div className="absolute bottom-2 inset-x-2 bg-black/60 backdrop-blur-xs rounded-lg p-1.5 text-center text-white text-[11px] font-semibold">
                    Áo Khoác Bomber 🧥
                  </div>
                </div>

                {/* Center front card */}
                <div className="relative z-10 w-52 aspect-[3/4] rounded-2xl border-2 border-white bg-white shadow-2xl overflow-hidden hover:scale-105 transition-transform">
                  <img
                    src="https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?q=80&w=600&auto=format&fit=crop"
                    alt="Váy đầm nữ tính"
                    className="w-full h-full object-cover object-top"
                  />
                  <div className="absolute top-2 left-2 bg-primary-700 text-white text-[10px] font-bold rounded-md px-2 py-0.5 shadow-xs">
                    Lookbook 2026
                  </div>
                  <div className="absolute bottom-2 inset-x-2 bg-white/95 backdrop-blur-xs rounded-xl p-2 text-ink shadow-md text-left">
                    <span className="text-[10px] font-bold text-secondary-600 uppercase tracking-wider block">
                      Váy & Đầm 👗
                    </span>
                    <h4 className="text-xs font-bold text-ink truncate">Đầm Xòe Nữ Tính Floral</h4>
                    <span className="text-xs font-extrabold text-primary-700">389.000 ₫</span>
                  </div>
                </div>
              </div>
            </div>
          </section>

          {/* 2. TrustBar (Section 6.20 & 7.1) */}
          <div className="w-full bg-white border-b border-line shadow-2xs">
            <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-4 sm:py-5">
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 sm:gap-6">
                <div className="flex items-center gap-3">
                  <div className="size-11 rounded-xl bg-primary-50 text-primary-700 flex items-center justify-center shrink-0">
                    <Truck className="size-5" />
                  </div>
                  <div>
                    <h4 className="text-xs sm:text-sm font-semibold text-ink">Giao hàng toàn quốc</h4>
                    <p className="text-[11px] sm:text-xs text-ink-muted">Nhận hàng tận nhà 2–4 ngày</p>
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
                    <h4 className="text-xs sm:text-sm font-semibold text-ink">Hỗ trợ đổi size</h4>
                    <p className="text-[11px] sm:text-xs text-ink-muted">Đổi size linh hoạt trong 7 ngày</p>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <div className="size-11 rounded-xl bg-secondary-50 text-secondary-700 flex items-center justify-center shrink-0">
                    <Sparkles className="size-5" />
                  </div>
                  <div>
                    <h4 className="text-xs sm:text-sm font-semibold text-ink">Stylist AI tư vấn</h4>
                    <p className="text-[11px] sm:text-xs text-ink-muted">Gợi ý phối đồ & chọn size 24/7</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </>
      )}

      {/* Main Container for Catalog & Content */}
      <div className="mx-auto w-full max-w-7xl px-4 sm:px-6 lg:px-8 py-6 md:py-10 space-y-10 md:space-y-14">
        {/* 3. CategoryGrid & Tiles (Shown ONLY when not searching/filtering) */}
        {!isFilteringOrSearching && (
          <div className="relative">
            <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 mb-6">
              <SectionHeader
                eyebrow="✨ Khám phá"
                title="DANH MỤC TRANG PHỤC"
                description="Chọn nhanh trang phục theo phong cách và nhu cầu thường ngày của bạn"
                className="mb-0"
              />

              {hasManyCategories && (
                <div className="hidden sm:inline-flex items-center gap-1.5 text-xs font-medium text-ink-muted bg-white border border-line rounded-full px-3.5 py-1.5 shadow-2xs">
                  <span>✨</span>
                  <span>Tự động lướt liên tục • Rê chuột để dừng</span>
                </div>
              )}
            </div>

            {hasManyCategories ? (
              <div className="relative -mx-4 sm:-mx-6 lg:-mx-8 px-4 sm:px-6 lg:px-8 py-2">
                {/* Gradient edge masks: mờ dần mềm mại 2 bên mép */}
                <div className="pointer-events-none absolute left-0 top-0 bottom-0 w-12 sm:w-24 bg-gradient-to-r from-page via-page/85 to-transparent z-10" />
                <div className="pointer-events-none absolute right-0 top-0 bottom-0 w-12 sm:w-24 bg-gradient-to-l from-page via-page/85 to-transparent z-10" />

                {/* RAF-driven scroll track: overflow-x scroll with hidden scrollbar.
                    marqueeItems is doubled so scrollLeft can seamlessly loop at midpoint. */}
                <div
                  ref={categoryTrackRef}
                  className="flex items-center gap-4 sm:gap-6 overflow-x-scroll py-3 select-none [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden"
                >
                  {marqueeItems.map((cat, idx) =>
                    renderCategoryCard(cat, `m-${idx}`, idx >= marqueeItems.length / 2)
                  )}
                </div>
              </div>
            ) : (
              /* Grid layout khi danh mục <= 5 */
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4 sm:gap-6 justify-center">
                {allCategoryItems.map((cat, idx) =>
                  renderCategoryCard(cat, `grid-${idx}`)
                )}
              </div>
            )}
          </div>
        )}

        {/* 4. Trang phục bán chạy nhất Block (Design.md 7.1: bg-primary-50 bg-dots rounded-3xl) */}
        {!isFilteringOrSearching && featuredProducts.length > 0 && (
          <div className="rounded-3xl bg-primary-50 bg-dots p-6 sm:p-8 md:p-10 border border-primary-200 relative overflow-hidden">
            <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 mb-6">
              <div>
                <span className="inline-flex items-center gap-1 rounded-full bg-primary-100 px-3 py-1 text-xs font-semibold text-primary-700 mb-2.5">
                  🔥 Bán chạy
                </span>
                <h2 className="text-xl md:text-2xl font-bold text-ink tracking-tight">
                  Trang phục bán chạy nhất
                </h2>
                <div className="mt-2 h-1 w-12 rounded-full bg-primary-500" />
                <p className="mt-2 text-sm text-ink-muted leading-relaxed max-w-xl">
                  Những thiết kế hot nhất được giới trẻ yêu thích và đánh giá cao tuần qua
                </p>
              </div>

              <div className="flex items-center gap-2">
                {/* Carousel navigation buttons */}
                <button
                  type="button"
                  onClick={() => scrollCarousel('left')}
                  className="size-9 rounded-full bg-white shadow-soft hover:bg-gray-50 border border-line flex items-center justify-center text-ink hover:text-primary-700 transition cursor-pointer"
                  aria-label="Cuộn sang trái"
                >
                  <ChevronLeft className="size-4" />
                </button>
                <button
                  type="button"
                  onClick={() => scrollCarousel('right')}
                  className="size-9 rounded-full bg-white shadow-soft hover:bg-gray-50 border border-line flex items-center justify-center text-ink hover:text-primary-700 transition cursor-pointer"
                  aria-label="Cuộn sang phải"
                >
                  <ChevronRight className="size-4" />
                </button>
                <a href="#products-catalog" className="ml-2">
                  <Button variant="link" size="sm" rightIcon={ArrowRight} className="font-semibold">
                    Xem tất cả
                  </Button>
                </a>
              </div>
            </div>

            {/* Carousel track — RAF auto-scroll, reverse-wheel. No CSS snap to avoid conflict. */}
            <div
              ref={carouselRef}
              className="flex gap-4 overflow-x-auto pb-3 [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden"
            >
              {featuredProducts.map((p) => (
                <div key={p.id} className="w-56 sm:w-64 shrink-0">
                  <ProductCard product={p} onClick={(prod) => navigate(`/products/${prod.id}`)} />
                </div>
              ))}
            </div>
          </div>
        )}

        {/* 5. Dual Promo Banners (Section 6.23 & 2.7.1) */}
        {!isFilteringOrSearching && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            <div className="rounded-2xl p-6 sm:p-8 overflow-hidden relative bg-primary-50 border border-primary-200 shadow-soft flex flex-col justify-between">
              <span
                className="absolute right-4 bottom-2 text-7xl select-none opacity-40 animate-[float_5s_ease-in-out_infinite] pointer-events-none"
                aria-hidden="true"
              >
                👕
              </span>
              <div className="relative z-10 max-w-xs">
                <span className="text-xs font-bold text-primary-700 uppercase tracking-wider">
                  Basic Everyday
                </span>
                <h3 className="text-xl font-bold text-ink mt-1 mb-2">
                  Thoải mái & Năng động mỗi ngày
                </h3>
                <p className="text-xs sm:text-sm text-ink-muted mb-4">
                  Áo thun cotton 100% thoáng mát, sơ mi form rộng chuẩn phong cách tối giản thanh lịch.
                </p>
              </div>
              <div className="relative z-10">
                <a href="#products-catalog">
                  <Button variant="link" size="sm" rightIcon={ArrowRight}>
                    Khám phá phong cách →
                  </Button>
                </a>
              </div>
            </div>

            <div className="rounded-2xl p-6 sm:p-8 overflow-hidden relative bg-secondary-50 border border-secondary-200 shadow-soft flex flex-col justify-between">
              <span
                className="absolute right-4 bottom-2 text-7xl select-none opacity-40 animate-[float-slow_8s_ease-in-out_infinite] pointer-events-none"
                aria-hidden="true"
              >
                👗
              </span>
              <div className="relative z-10 max-w-xs">
                <span className="text-xs font-bold text-secondary-700 uppercase tracking-wider">
                  Streetwear & Trendy
                </span>
                <h3 className="text-xl font-bold text-ink mt-1 mb-2">
                  Cá tính & Tự tin xuống phố
                </h3>
                <p className="text-xs sm:text-sm text-ink-muted mb-4">
                  Váy đầm tôn dáng, áo khoác bomber và hoodie phong cách trẻ trung chuẩn xu hướng 2026.
                </p>
              </div>
              <div className="relative z-10">
                <a href="#products-catalog">
                  <Button variant="link" size="sm" rightIcon={ArrowRight}>
                    Xem bộ sưu tập →
                  </Button>
                </a>
              </div>
            </div>
          </div>
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
                      : currentCategoryName || 'Danh mục trang phục'}
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
              title="Tất cả trang phục"
              description="Đa dạng thiết kế, cập nhật xu hướng thời trang mới nhất mỗi tuần"
            />
          )}

          {/* Toolbar: Category Chips Scroll + Search + Sort */}
          <div className="sticky top-16 z-30 bg-page/95 backdrop-blur-md py-3 border-y border-line space-y-3">
            {/* Category Chips Scroll */}
            <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none">
              <button
                type="button"
                onClick={() => updateFilter({ category: '', page: 1 })}
                className={`shrink-0 h-9 px-4 rounded-full text-xs sm:text-sm font-semibold transition-all cursor-pointer ${!queryCategory
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
                    className={`shrink-0 inline-flex items-center gap-1.5 h-9 px-3.5 rounded-full text-xs sm:text-sm font-semibold transition-all cursor-pointer ${isSelected
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
                  placeholder="Tìm áo thun, quần jeans, váy đầm..."
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
                    aria-label="Sắp xếp trang phục"
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
                title="Không tải được danh sách trang phục"
                message={error}
                onRetry={() => updateFilter({ page: queryPage })}
              />
            ) : products.length === 0 ? (
              <div className="bg-grid rounded-3xl p-8 sm:p-12 border border-line">
                <EmptyState
                  icon={Shirt}
                  title="Không tìm thấy trang phục phù hợp"
                  description="Hãy thử đổi từ khóa tìm kiếm hoặc chọn một danh mục trang phục khác nhé!"
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
                      onClick={(prod) => navigate(`/products/${prod.id}`)}
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
              title="Khách nói gì về FunnyShop Fashion"
              description="Những phản hồi chân thật về chất vải, form dáng và trải nghiệm phối đồ từ khách hàng FunnyShop"
              variant="secondary"
            />

            <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
              <div className="bg-white rounded-2xl p-5 shadow-soft border border-line flex flex-col justify-between">
                <div>
                  <Quote className="size-6 text-secondary-300 mb-2" />
                  <p className="text-sm text-ink leading-relaxed mb-4">
                    &ldquo;Áo thun boxy chất vải cotton 250gsm dày dặn, đứng form chuẩn không bị nhão hay bai xù sau nhiều lần giặt. Giao hàng cực nhanh!&rdquo;
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
                    &ldquo;Váy đầm và áo sơ mi tôn dáng lắm, đường may cẩn thận tỉ mỉ từng chi tiết. Stylist AI tư vấn chọn size S chuẩn đét luôn.&rdquo;
                  </p>
                </div>
                <div className="flex items-center gap-3 pt-3 border-t border-line">
                  <div className="size-9 rounded-full bg-secondary-100 text-secondary-700 font-bold text-xs flex items-center justify-center">
                    KV
                  </div>
                  <div>
                    <h4 className="text-xs font-bold text-ink">Khánh Vy</h4>
                    <p className="text-[11px] text-ink-muted">TP. Hồ Chí Minh</p>
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-2xl p-5 shadow-soft border border-line flex flex-col justify-between">
                <div>
                  <Quote className="size-6 text-secondary-300 mb-2" />
                  <p className="text-sm text-ink leading-relaxed mb-4">
                    &ldquo;Mua áo khoác hoodie và quần ống rộng mặc ưng ý dã man. Đóng hộp chỉn chu, có hỗ trợ đổi size tiện lợi trong 7 ngày.&rdquo;
                  </p>
                </div>
                <div className="flex items-center gap-3 pt-3 border-t border-line">
                  <div className="size-9 rounded-full bg-amber-100 text-amber-800 font-bold text-xs flex items-center justify-center">
                    HN
                  </div>
                  <div>
                    <h4 className="text-xs font-bold text-ink">Hoàng Nam</h4>
                    <p className="text-[11px] text-ink-muted">Đà Nẵng</p>
                  </div>
                </div>
              </div>
            </div>
          </section>
        )}

        {/* 9. Newsletter Block 🔹 (Design.md 6.23 & 2.7.2) */}
        {!isFilteringOrSearching && (
          <section className="rounded-3xl bg-gradient-to-br from-primary-600 via-primary-500 to-secondary-600 p-6 sm:p-10 md:p-12 text-white shadow-brand relative overflow-hidden">
            <div
              className="absolute -top-12 -right-12 size-56 rounded-full bg-white/10 blur-2xl pointer-events-none"
              aria-hidden="true"
            />
            <div
              className="absolute -bottom-16 -left-12 size-64 rounded-full bg-secondary-900/30 blur-2xl pointer-events-none"
              aria-hidden="true"
            />

            <div className="relative z-10 max-w-2xl mx-auto text-center">
              <span className="inline-flex items-center gap-1.5 rounded-full bg-white/20 backdrop-blur-xs px-3.5 py-1 text-xs font-semibold text-white mb-3">
                <Sparkles className="size-3.5" aria-hidden="true" />
                Ưu đãi thành viên
              </span>
              <h2 className="text-2xl sm:text-3xl md:text-4xl font-extrabold tracking-tight text-white mb-3">
                Nhận thông báo bộ sưu tập & deal hot
              </h2>
              <p className="text-sm sm:text-base text-white/90 mb-6 max-w-lg mx-auto">
                Đăng ký nhận tin để không bỏ lỡ các đợt phát hành mẫu thiết kế mới và nhận mã giảm giá 10% cho đơn hàng đầu tiên.
              </p>

              <form
                onSubmit={handleNewsletterSubmit}
                className="flex flex-col sm:flex-row items-center justify-center gap-3 max-w-md mx-auto"
              >
                <div className="relative w-full">
                  <Mail className="size-4 text-ink-subtle absolute left-3.5 top-3.5 pointer-events-none" />
                  <input
                    type="email"
                    value={newsletterEmail}
                    onChange={(e) => setNewsletterEmail(e.target.value)}
                    placeholder="Nhập địa chỉ email của bạn..."
                    className="h-11 w-full rounded-lg bg-white pl-10 pr-4 text-sm text-ink placeholder:text-ink-subtle focus:outline-none focus:ring-2 focus:ring-secondary-300"
                    required
                  />
                </div>
                <Button
                  type="submit"
                  variant="light"
                  size="md"
                  rightIcon={Send}
                  className="w-full sm:w-auto font-bold shrink-0"
                >
                  Đăng ký
                </Button>
              </form>
            </div>
          </section>
        )}
      </div>
    </div>
  );
}
