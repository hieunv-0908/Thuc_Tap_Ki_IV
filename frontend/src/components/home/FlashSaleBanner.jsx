import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Zap, Clock, Flame } from 'lucide-react';
import { flashSaleApi } from '../../api/flashSale';
import { formatCurrency } from '../../utils/formatCurrency';

export default function FlashSaleBanner() {
  const [flashSale, setFlashSale] = useState(null);
  const [timeLeft, setTimeLeft] = useState({ hours: 0, minutes: 0, seconds: 0 });
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    let isMounted = true;
    async function loadActiveSale() {
      try {
        setLoading(true);
        const res = await flashSaleApi.getActiveFlashSale();
        const data = res?.data || res;
        if (isMounted && data) {
          setFlashSale(data);
        }
      } catch (err) {
        console.warn('Lỗi tải Flash Sale:', err);
      } finally {
        if (isMounted) setLoading(false);
      }
    }
    loadActiveSale();
    return () => {
      isMounted = false;
    };
  }, []);

  // Countdown timer
  useEffect(() => {
    if (!flashSale?.endTime) return;

    function calculateTimeLeft() {
      const difference = new Date(flashSale.endTime).getTime() - new Date().getTime();
      if (difference <= 0) {
        return { hours: 0, minutes: 0, seconds: 0, isEnded: true };
      }
      return {
        hours: Math.floor(difference / (1000 * 60 * 60)),
        minutes: Math.floor((difference / 1000 / 60) % 60),
        seconds: Math.floor((difference / 1000) % 60),
        isEnded: false,
      };
    }

    const timer = setInterval(() => {
      const remaining = calculateTimeLeft();
      setTimeLeft(remaining);
      if (remaining.isEnded) {
        clearInterval(timer);
      }
    }, 1000);

    return () => clearInterval(timer);
  }, [flashSale?.endTime]);

  if (loading || !flashSale || !flashSale.items || flashSale.items.length === 0) {
    return null;
  }

  const padZero = (num) => String(num).padStart(2, '0');

  return (
    <section className="relative my-8 sm:my-12 overflow-hidden rounded-3xl bg-gradient-to-r from-red-600 via-rose-600 to-amber-500 p-5 sm:p-8 text-white shadow-xl">
      {/* Background Decor */}
      <div className="absolute -top-16 -right-16 size-64 rounded-full bg-white/10 blur-2xl pointer-events-none" />
      <div className="absolute -bottom-16 -left-16 size-64 rounded-full bg-black/10 blur-2xl pointer-events-none" />

      {/* Header: Title + Countdown Timer */}
      <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-white/20 pb-5 mb-6">
        <div className="flex items-center gap-3">
          <div className="size-12 rounded-2xl bg-amber-400 text-red-700 flex items-center justify-center font-black shadow-lg animate-bounce">
            <Zap className="size-7 fill-red-700" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-2xl sm:text-3xl font-black uppercase tracking-wider text-white drop-shadow-sm">
                FLASH SALE GIỜ VÀNG
              </h2>
              <span className="hidden sm:inline-block px-2.5 py-0.5 rounded-full text-xs font-bold bg-amber-400 text-red-900 shadow-sm animate-pulse">
                Giảm tới {flashSale.discountPercent}%
              </span>
            </div>
            <p className="text-xs sm:text-sm text-white/90 mt-0.5">
              {flashSale.name || 'Cơ hội săn deal hot giá sốc có hạn trong ngày'}
            </p>
          </div>
        </div>

        {/* Countdown Box */}
        <div className="flex items-center gap-2 bg-black/30 backdrop-blur-md px-4 py-2.5 rounded-2xl border border-white/20 self-start md:self-auto">
          <div className="flex items-center gap-1.5 text-xs font-bold text-amber-300 uppercase tracking-wider mr-1">
            <Clock className="size-4 animate-spin-slow" />
            <span>Kết thúc sau:</span>
          </div>

          <div className="flex items-center gap-1 font-mono font-black text-sm sm:text-base">
            <span className="bg-white text-red-600 px-2 py-1 rounded-lg shadow-sm">
              {padZero(timeLeft.hours)}
            </span>
            <span className="text-white font-bold">:</span>
            <span className="bg-white text-red-600 px-2 py-1 rounded-lg shadow-sm">
              {padZero(timeLeft.minutes)}
            </span>
            <span className="text-white font-bold">:</span>
            <span className="bg-white text-red-600 px-2 py-1 rounded-lg shadow-sm">
              {padZero(timeLeft.seconds)}
            </span>
          </div>
        </div>
      </div>

      {/* Product List Grid */}
      <div className="relative z-10 grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3 sm:gap-4">
        {flashSale.items.slice(0, 8).map((item) => {
          const discount = item.discountPercent || flashSale.discountPercent;
          const soldCount = item.soldCount || 10;
          const stock = item.flashSaleStock || 50;
          const progress = item.progressPercent || Math.min(100, Math.round((soldCount / stock) * 100));

          return (
            <div
              key={item.id || item.productId}
              onClick={() => navigate(`/products/${item.productId}`)}
              className="group bg-white rounded-2xl p-3 sm:p-4 text-ink flex flex-col justify-between cursor-pointer transition-all duration-300 hover:-translate-y-1 hover:shadow-2xl select-none"
            >
              <div>
                {/* Image Container with Badge */}
                <div className="relative aspect-square w-full rounded-xl overflow-hidden bg-gray-100 mb-3">
                  <img
                    src={item.imageUrl}
                    alt={item.productName}
                    loading="lazy"
                    className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                  />
                  {/* Badge Discount */}
                  <span className="absolute top-2 left-2 px-2 py-0.5 rounded-lg bg-red-600 text-white font-black text-xs shadow-md">
                    -{discount}%
                  </span>
                </div>

                {/* Product Name */}
                <h3 className="font-bold text-xs sm:text-sm text-ink line-clamp-2 leading-snug group-hover:text-red-600 transition-colors">
                  {item.productName}
                </h3>
              </div>

              {/* Price & Progress */}
              <div className="mt-3 space-y-2">
                <div className="flex items-baseline gap-2 flex-wrap">
                  <span className="text-base sm:text-lg font-black text-red-600">
                    {formatCurrency(item.flashSalePrice)}
                  </span>
                  <span className="text-xs text-ink-subtle line-through">
                    {formatCurrency(item.originalPrice)}
                  </span>
                </div>

                {/* Sold progress bar */}
                <div className="space-y-1">
                  <div className="relative h-4 w-full rounded-full bg-red-100 overflow-hidden flex items-center justify-center">
                    <div
                      className="absolute left-0 top-0 bottom-0 bg-gradient-to-r from-amber-400 to-red-500 rounded-full transition-all duration-500"
                      style={{ width: `${progress}%` }}
                    />
                    <span className="relative z-10 text-[10px] font-bold text-red-900 uppercase flex items-center gap-1">
                      <Flame className="size-3 fill-amber-300 text-red-600" />
                      <span>Đã bán {soldCount}</span>
                    </span>
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
}

