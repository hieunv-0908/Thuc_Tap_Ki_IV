import { useState, useEffect, useMemo } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  Zap,
  Clock,
  Flame,
  ShoppingCart,
  Filter,
  Check,
} from 'lucide-react';
import { flashSaleApi } from '../api/flashSale';
import { formatCurrency } from '../utils/formatCurrency';
import { formatDate } from '../utils/formatDate';
import { useCartStore } from '../store/cartStore';
import { toast } from '../store/toastStore';
import Button from '../components/ui/Button';

export default function FlashSale() {
  const navigate = useNavigate();
  const addItem = useCartStore((s) => s.addItem);

  const [activeSale, setActiveSale] = useState(null);
  const [upcomingSales, setUpcomingSales] = useState([]);
  const [selectedTab, setSelectedTab] = useState('active'); // 'active' | upcomingId
  const [loading, setLoading] = useState(true);

  // Filters
  const [selectedCategory, setSelectedCategory] = useState('ALL');
  const [sortBy, setSortBy] = useState('discount_desc'); // 'discount_desc' | 'price_asc' | 'price_desc' | 'popular'

  // Countdown timer cho đợt sale đang chọn
  const [timeLeft, setTimeLeft] = useState({ hours: 0, minutes: 0, seconds: 0, isEnded: false });
  const [justAddedId, setJustAddedId] = useState(null);

  useEffect(() => {
    let ignore = false;
    async function loadData() {
      try {
        setLoading(true);
        const [activeRes, upcomingRes] = await Promise.all([
          flashSaleApi.getActiveFlashSale().catch(() => null),
          flashSaleApi.getUpcomingFlashSales().catch(() => []),
        ]);

        if (!ignore) {
          const actData = activeRes?.data || activeRes;
          setActiveSale(actData || null);

          const upList = upcomingRes?.data || upcomingRes || [];
          const validUpList = Array.isArray(upList) ? upList : [];
          setUpcomingSales(validUpList);

          if (!actData && validUpList.length > 0) {
            setSelectedTab(validUpList[0].id);
          } else {
            setSelectedTab('active');
          }
        }
      } catch (err) {
        if (!ignore) {
          console.warn('Lỗi tải dữ liệu Flash Sale:', err);
        }
      } finally {
        if (!ignore) setLoading(false);
      }
    }

    loadData();
    return () => {
      ignore = true;
    };
  }, []);

  // Xác định đợt sale hiện đang được hiển thị theo Tab
  const currentSale = useMemo(() => {
    if (selectedTab === 'active') return activeSale;
    return upcomingSales.find((s) => s.id === selectedTab) || null;
  }, [selectedTab, activeSale, upcomingSales]);

  const isOngoing = selectedTab === 'active' && activeSale != null;

  // Countdown Timer
  useEffect(() => {
    const targetTimeStr = isOngoing ? currentSale?.endTime : currentSale?.startTime;
    if (!targetTimeStr) return;

    function calculateTime() {
      const diff = new Date(targetTimeStr).getTime() - new Date().getTime();
      if (diff <= 0) {
        return { hours: 0, minutes: 0, seconds: 0, isEnded: true };
      }
      return {
        hours: Math.floor(diff / (1000 * 60 * 60)),
        minutes: Math.floor((diff / (1000 * 60)) % 60),
        seconds: Math.floor((diff / 1000) % 60),
        isEnded: false,
      };
    }

    const timer = setInterval(() => {
      const remaining = calculateTime();
      setTimeLeft(remaining);
      if (remaining.isEnded) {
        clearInterval(timer);
      }
    }, 1000);

    return () => clearInterval(timer);
  }, [currentSale, isOngoing]);

  // Danh mục duy nhất có trong đợt sale hiện tại
  const availableCategories = useMemo(() => {
    if (!currentSale?.items) return [];
    const map = new Map();
    currentSale.items.forEach((item) => {
      if (item.categoryId && item.categoryName) {
        map.set(item.categoryId, item.categoryName);
      }
    });
    return Array.from(map.entries()).map(([id, name]) => ({ id, name }));
  }, [currentSale]);

  // Lọc và sắp xếp sản phẩm
  const filteredItems = useMemo(() => {
    if (!currentSale?.items) return [];
    let list = [...currentSale.items];

    if (selectedCategory !== 'ALL') {
      list = list.filter((item) => String(item.categoryId) === String(selectedCategory));
    }

    if (sortBy === 'discount_desc') {
      list.sort((a, b) => (b.discountPercent || 0) - (a.discountPercent || 0));
    } else if (sortBy === 'price_asc') {
      list.sort((a, b) => Number(a.flashSalePrice || 0) - Number(b.flashSalePrice || 0));
    } else if (sortBy === 'price_desc') {
      list.sort((a, b) => Number(b.flashSalePrice || 0) - Number(a.flashSalePrice || 0));
    } else if (sortBy === 'popular') {
      list.sort((a, b) => (b.soldCount || 0) - (a.soldCount || 0));
    }

    return list;
  }, [currentSale, selectedCategory, sortBy]);

  const handleQuickBuy = (item, e) => {
    e.stopPropagation();
    if (item.isOutOfStock) {
      toast.warning('Sản phẩm đã hết suất Flash Sale!');
      return;
    }

    const payload = {
      variantId: item.productId,
      productId: item.productId,
      name: item.productName,
      price: item.flashSalePrice,
      imageUrl: item.imageUrl,
      stockQuantity: item.flashSaleStock || 99,
    };

    const ok = addItem(payload, 1);
    if (ok) {
      setJustAddedId(item.productId);
      toast.success(`Đã thêm "${item.productName}" vào giỏ hàng`);
      setTimeout(() => setJustAddedId(null), 1500);
    }
  };

  const padZero = (num) => String(num).padStart(2, '0');

  return (
    <div className="min-h-screen bg-gray-50/60 pb-16">
      {/* Top Breadcrumb */}
      <div className="bg-white border-b border-line py-3 px-4 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-7xl flex items-center gap-2 text-xs text-ink-muted">
          <Link to="/" className="hover:text-primary-700 transition-colors">
            Trang chủ
          </Link>
          <span>/</span>
          <span className="text-red-600 font-bold flex items-center gap-1">
            <Zap className="size-3.5 fill-red-600 text-red-600" />
            Flash Sale
          </span>
        </div>
      </div>

      {/* Hero Banner Bốc Lửa */}
      <div className="relative bg-gradient-to-r from-red-600 via-rose-600 to-amber-500 text-white overflow-hidden shadow-md">
        {/* Decor background elements */}
        <div className="absolute -top-24 -right-24 size-96 rounded-full bg-white/10 blur-3xl pointer-events-none" />
        <div className="absolute -bottom-24 -left-24 size-96 rounded-full bg-black/15 blur-3xl pointer-events-none" />

        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-8 sm:py-12 relative z-10">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
            <div className="space-y-3">
              <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-amber-400 text-red-950 text-xs sm:text-sm font-black shadow-md uppercase tracking-wider animate-pulse">
                <Flame className="size-4 fill-red-950 text-red-950" />
                Sự Kiện Giảm Giá Chớp Nhoáng
              </div>

              <h1 className="text-3xl sm:text-5xl font-black uppercase tracking-tight text-white drop-shadow-md">
                ⚡ ĐẠI TIỆC FLASH SALE
              </h1>

              <p className="text-sm sm:text-base text-white/90 max-w-xl font-medium leading-relaxed">
                {currentSale?.name || 'Săn hàng ngàn deal sốc giảm sâu chưa từng có. Số lượng có hạn - Chốt đơn ngay kẻo lỡ!'}
              </p>
            </div>

            {/* Countdown Box To Bản */}
            {currentSale && (
              <div className="bg-black/35 backdrop-blur-md p-5 sm:p-6 rounded-3xl border border-white/20 shadow-2xl flex flex-col items-center shrink-0">
                <div className="flex items-center gap-2 text-xs font-bold text-amber-300 uppercase tracking-widest mb-3">
                  <Clock className="size-4 animate-spin-slow" />
                  <span>{isOngoing ? 'KẾT THÚC TRONG' : 'SẼ BẮT ĐẦU SAU'}</span>
                </div>

                <div className="flex items-center gap-2 text-white font-mono">
                  <div className="flex flex-col items-center">
                    <span className="min-w-12 h-14 bg-white/15 rounded-2xl flex items-center justify-center text-2xl sm:text-3xl font-black px-2 shadow-inner border border-white/20">
                      {padZero(timeLeft.hours)}
                    </span>
                    <span className="text-[10px] text-white/70 uppercase mt-1">Giờ</span>
                  </div>
                  <span className="text-2xl font-black text-amber-300 -mt-4">:</span>
                  <div className="flex flex-col items-center">
                    <span className="min-w-12 h-14 bg-white/15 rounded-2xl flex items-center justify-center text-2xl sm:text-3xl font-black px-2 shadow-inner border border-white/20">
                      {padZero(timeLeft.minutes)}
                    </span>
                    <span className="text-[10px] text-white/70 uppercase mt-1">Phút</span>
                  </div>
                  <span className="text-2xl font-black text-amber-300 -mt-4">:</span>
                  <div className="flex flex-col items-center">
                    <span className="min-w-12 h-14 bg-amber-400 text-red-950 rounded-2xl flex items-center justify-center text-2xl sm:text-3xl font-black px-2 shadow-inner border border-white/30 animate-pulse">
                      {padZero(timeLeft.seconds)}
                    </span>
                    <span className="text-[10px] text-white/70 uppercase mt-1">Giây</span>
                  </div>
                </div>

                <div className="mt-3 text-[11px] text-white/80 font-medium">
                  {isOngoing
                    ? `Áp dụng đến: ${formatDate(currentSale.endTime)}`
                    : `Bắt đầu lúc: ${formatDate(currentSale.startTime)}`}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 mt-6 sm:mt-8 space-y-6">
        {/* Timeline Tabs (Các khung giờ Flash Sale) */}
        <div className="bg-white rounded-2xl border border-line p-2 shadow-xs flex items-center gap-2 overflow-x-auto scrollbar-none">
          {activeSale && (
            <button
              type="button"
              onClick={() => setSelectedTab('active')}
              className={`flex-1 min-w-44 py-3 px-4 rounded-xl text-center transition-all cursor-pointer ${
                selectedTab === 'active'
                  ? 'bg-gradient-to-r from-red-600 to-rose-600 text-white font-bold shadow-md'
                  : 'hover:bg-gray-100 text-ink-muted'
              }`}
            >
              <div className="flex items-center justify-center gap-1.5 text-xs uppercase tracking-wider">
                <Flame className={`size-4 ${selectedTab === 'active' ? 'fill-amber-300 text-amber-300' : 'text-red-500'}`} />
                <span>Đang Diễn Ra</span>
              </div>
              <div className="text-sm font-black mt-0.5">
                {activeSale.name || 'Flash Sale Giờ Vàng'}
              </div>
            </button>
          )}

          {upcomingSales.map((sale) => (
            <button
              key={sale.id}
              type="button"
              onClick={() => setSelectedTab(sale.id)}
              className={`flex-1 min-w-44 py-3 px-4 rounded-xl text-center transition-all cursor-pointer ${
                selectedTab === sale.id
                  ? 'bg-gradient-to-r from-amber-600 to-orange-600 text-white font-bold shadow-md'
                  : 'hover:bg-gray-100 text-ink-muted'
              }`}
            >
              <div className="flex items-center justify-center gap-1.5 text-xs uppercase tracking-wider">
                <Clock className="size-3.5" />
                <span>{formatDate(sale.startTime).split(' ')[1] || 'Sắp diễn ra'}</span>
              </div>
              <div className="text-sm font-bold truncate mt-0.5">
                {sale.name || 'Khung giờ tới'}
              </div>
            </button>
          ))}
        </div>

        {/* Filter & Sort Bar */}
        {currentSale && (
          <div className="bg-white rounded-2xl border border-line p-4 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            {/* Category pills */}
            <div className="flex items-center gap-2 overflow-x-auto scrollbar-none pb-1 sm:pb-0">
              <button
                type="button"
                onClick={() => setSelectedCategory('ALL')}
                className={`px-3 py-1.5 rounded-full text-xs font-bold whitespace-nowrap transition cursor-pointer ${
                  selectedCategory === 'ALL'
                    ? 'bg-red-600 text-white shadow-xs'
                    : 'bg-gray-100 text-ink-muted hover:bg-gray-200'
                }`}
              >
                Tất cả sản phẩm ({currentSale.items?.length || 0})
              </button>

              {availableCategories.map((cat) => (
                <button
                  key={cat.id}
                  type="button"
                  onClick={() => setSelectedCategory(cat.id)}
                  className={`px-3 py-1.5 rounded-full text-xs font-bold whitespace-nowrap transition cursor-pointer ${
                    String(selectedCategory) === String(cat.id)
                      ? 'bg-red-600 text-white shadow-xs'
                      : 'bg-gray-100 text-ink-muted hover:bg-gray-200'
                  }`}
                >
                  {cat.name}
                </button>
              ))}
            </div>

            {/* Sort Selector */}
            <div className="flex items-center gap-2 shrink-0 self-end sm:self-auto text-xs">
              <span className="text-ink-muted font-medium flex items-center gap-1">
                <Filter className="size-3.5" />
                Sắp xếp:
              </span>
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                className="bg-gray-50 border border-line text-ink rounded-lg px-2.5 py-1.5 text-xs font-semibold focus:outline-none focus:ring-1 focus:ring-red-500 cursor-pointer"
              >
                <option value="discount_desc">🔥 Giảm nhiều nhất</option>
                <option value="popular">⚡ Bán chạy nhất</option>
                <option value="price_asc">Giá: Thấp đến Cao</option>
                <option value="price_desc">Giá: Cao đến Thấp</option>
              </select>
            </div>
          </div>
        )}

        {/* Product Grid */}
        {loading ? (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4 sm:gap-6">
            {[...Array(8)].map((_, i) => (
              <div key={i} className="bg-white rounded-2xl border border-line p-4 space-y-3 animate-pulse">
                <div className="aspect-square bg-gray-200 rounded-xl" />
                <div className="h-4 bg-gray-200 rounded w-3/4" />
                <div className="h-5 bg-gray-200 rounded w-1/2" />
                <div className="h-3 bg-gray-200 rounded w-full" />
              </div>
            ))}
          </div>
        ) : !currentSale || filteredItems.length === 0 ? (
          <div className="bg-white rounded-3xl border border-line p-12 text-center max-w-lg mx-auto shadow-sm space-y-4 my-8">
            <div className="size-16 rounded-full bg-red-50 text-red-600 flex items-center justify-center mx-auto shadow-inner">
              <Zap className="size-8 fill-red-600 text-red-600" />
            </div>
            <h3 className="text-xl font-bold text-ink">
              Chưa có đợt Flash Sale nào đang mở
            </h3>
            <p className="text-xs text-ink-muted leading-relaxed">
              Các deal sốc Flash Sale sẽ được mở vào các khung giờ vàng trong ngày. Vui lòng quay lại sau hoặc khám phá các sản phẩm hot khác tại FunnyShop!
            </p>
            <div className="pt-2">
              <Button variant="primary" onClick={() => navigate('/')}>
                Khám phá cửa hàng ngay
              </Button>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4 sm:gap-6">
            {filteredItems.map((item) => {
              const progress = item.progressPercent || 0;
              const isHot = progress >= 75;

              return (
                <div
                  key={item.id || item.productId}
                  onClick={() => navigate(`/products/${item.productId}`)}
                  className="group relative bg-white rounded-2xl border border-line p-3 sm:p-4 shadow-soft hover:shadow-xl hover:border-red-300 transition-all duration-200 flex flex-col cursor-pointer overflow-hidden"
                >
                  {/* Badge giảm giá góc chéo */}
                  <div className="absolute top-3 left-3 z-10 flex items-center gap-1 bg-gradient-to-r from-red-600 to-rose-600 text-white text-[11px] font-black px-2.5 py-0.5 rounded-full shadow-md">
                    <Flame className="size-3 fill-amber-300 text-amber-300" />
                    <span>-{item.discountPercent}%</span>
                  </div>

                  {/* Ảnh sản phẩm */}
                  <div className="relative aspect-square w-full rounded-xl overflow-hidden bg-gray-50 mb-3 flex items-center justify-center">
                    <img
                      src={item.imageUrl}
                      alt={item.productName}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                      loading="lazy"
                    />

                    {item.isOutOfStock && (
                      <div className="absolute inset-0 bg-black/60 backdrop-blur-2xs flex items-center justify-center text-white text-xs font-black uppercase tracking-wider">
                        ĐÃ BÁN HẾT
                      </div>
                    )}
                  </div>

                  {/* Thông tin sản phẩm */}
                  <div className="flex-1 flex flex-col justify-between space-y-2">
                    <div>
                      <span className="text-[10px] text-ink-subtle uppercase tracking-wider font-semibold">
                        {item.categoryName || 'Sản phẩm'}
                      </span>
                      <h4
                        className="text-xs sm:text-sm font-semibold text-ink line-clamp-2 leading-snug group-hover:text-red-600 transition-colors mt-0.5"
                        title={item.productName}
                      >
                        {item.productName}
                      </h4>
                    </div>

                    <div className="space-y-2 pt-1">
                      {/* Giá bán */}
                      <div className="flex items-baseline gap-2 flex-wrap">
                        <span className="text-base sm:text-lg font-black text-red-600">
                          {formatCurrency(item.flashSalePrice)}
                        </span>
                        <span className="text-xs text-gray-400 line-through">
                          {formatCurrency(item.originalPrice)}
                        </span>
                      </div>

                      {/* Thanh tiến độ bán hàng (Shopee style) */}
                      <div className="space-y-1">
                        <div className="relative w-full h-3.5 bg-red-100 rounded-full overflow-hidden p-0.5">
                          <div
                            className="h-full bg-gradient-to-r from-red-600 via-rose-500 to-amber-500 rounded-full transition-all duration-500"
                            style={{ width: `${Math.max(10, progress)}%` }}
                          />
                          <span className="absolute inset-0 flex items-center justify-center text-[9px] font-black uppercase tracking-wider text-white drop-shadow-xs">
                            {isHot ? '🔥 SẮP CHÁY HÀNG' : `ĐÃ BÁN ${item.soldCount || 12}`}
                          </span>
                        </div>
                      </div>

                      {/* Nút hành động */}
                      {isOngoing ? (
                        <button
                          type="button"
                          onClick={(e) => handleQuickBuy(item, e)}
                          disabled={item.isOutOfStock}
                          className={`w-full py-2 px-3 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 transition-all shadow-xs cursor-pointer ${
                            item.isOutOfStock
                              ? 'bg-gray-200 text-gray-500 cursor-not-allowed'
                              : justAddedId === item.productId
                              ? 'bg-green-600 text-white'
                              : 'bg-red-600 hover:bg-red-700 text-white shadow-brand hover:shadow-lg'
                          }`}
                        >
                          {justAddedId === item.productId ? (
                            <>
                              <Check className="size-3.5" />
                              <span>Đã thêm</span>
                            </>
                          ) : item.isOutOfStock ? (
                            <span>Hết suất sale</span>
                          ) : (
                            <>
                              <ShoppingCart className="size-3.5" />
                              <span>MUA NGAY</span>
                            </>
                          )}
                        </button>
                      ) : (
                        <div className="w-full py-2 px-3 rounded-xl text-xs font-bold text-center bg-amber-50 text-amber-800 border border-amber-200">
                          ⏰ Khung giờ sắp mở
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
