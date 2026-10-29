import { useState } from 'react';
import { Package, Star, ShoppingCart, Heart, Flame, Check } from 'lucide-react';
import { formatCurrency } from '../../utils/formatCurrency';
import { getCategoryMeta } from '../../utils/constants';
import { useCartStore } from '../../store/cartStore';
import { toast } from '../../store/toastStore';
import Button from '../ui/Button';

/**
 * ProductCard component complying with Design.md 6.11
 */
export default function ProductCard({ product, onClick }) {
  const [imgError, setImgError] = useState(false);
  const [isLiked, setIsLiked] = useState(false);
  const [justAdded, setJustAdded] = useState(false);
  const addItem = useCartStore((s) => s.addItem);

  const isOutOfStock = !product || product.stock <= 0;
  const rating = Number(product?.rating || 4.5);
  const isFeatured = rating >= 4.8;
  const categoryName = product?.category?.name || '';
  const meta = getCategoryMeta(categoryName);

  // Discount percentage if originalPrice exists
  const hasDiscount = Boolean(product?.originalPrice && product.originalPrice > product.price);
  const discountPercent = hasDiscount
    ? Math.round(((product.originalPrice - product.price) / product.originalPrice) * 100)
    : 0;

  const handleAddToCart = (e) => {
    e.stopPropagation();
    if (isOutOfStock) return;

    const success = addItem(product, 1);
    if (success) {
      setJustAdded(true);
      toast.success('Đã thêm vào giỏ hàng');
      setTimeout(() => {
        setJustAdded(false);
      }, 1200);
    } else {
      toast.warning(`Chỉ còn ${product.stock} sản phẩm trong kho`);
    }
  };

  const handleLikeClick = (e) => {
    e.stopPropagation();
    setIsLiked((prev) => !prev);
  };

  const handleCardClick = () => {
    if (onClick) {
      onClick(product);
    }
  };

  return (
    <div
      onClick={handleCardClick}
      className={`group relative flex flex-col overflow-hidden rounded-xl border border-line bg-white shadow-soft transition duration-200 cursor-pointer ${
        isOutOfStock
          ? 'opacity-85'
          : 'hover:-translate-y-1 hover:border-primary-200 hover:shadow-brand motion-reduce:hover:translate-y-0'
      }`}
    >
      {/* Square Image container */}
      <div className="relative aspect-square w-full overflow-hidden bg-primary-50 flex items-center justify-center">
        {imgError ? (
          <div className="w-full h-full bg-primary-50 flex flex-col items-center justify-center text-primary-400 gap-1.5 p-4 text-center">
            <Package className="size-10" aria-hidden="true" />
            <span className="text-xs font-medium text-ink-subtle">Ảnh minh họa</span>
          </div>
        ) : (
          <img
            src={product.imageUrl}
            alt={product.name}
            loading="lazy"
            onError={() => setImgError(true)}
            className={`w-full h-full object-cover transition-transform duration-300 group-hover:scale-105 ${
              isOutOfStock ? 'opacity-60 grayscale' : ''
            }`}
          />
        )}

        {/* Top-left Badges Stack: Hết hàng, -% discount, Được yêu thích */}
        <div className="absolute top-2 left-2 flex flex-col gap-1 z-10">
          {isOutOfStock && (
            <span className="bg-gray-900/80 text-white text-xs font-semibold rounded-md px-2 py-1 shadow-xs">
              Hết hàng
            </span>
          )}

          {!isOutOfStock && hasDiscount && discountPercent > 0 && (
            <span className="bg-primary-700 text-white text-xs font-bold rounded-md px-2 py-0.5 shadow-xs">
              -{discountPercent}%
            </span>
          )}

          {!isOutOfStock && isFeatured && (
            <span className="inline-flex items-center gap-1 bg-secondary-500 text-white text-[11px] font-semibold rounded-md px-2 py-0.5 shadow-xs">
              <Flame className="size-3 fill-current" aria-hidden="true" />
              Yêu thích
            </span>
          )}
        </div>

        {/* Top-right Favorite Heart Button */}
        <button
          type="button"
          onClick={handleLikeClick}
          className="absolute top-2 right-2 z-10 size-8 sm:size-9 rounded-full bg-white/90 backdrop-blur-xs shadow-soft hover:bg-white flex items-center justify-center transition-transform hover:scale-110 active:scale-95 cursor-pointer"
          aria-label={isLiked ? 'Bỏ thích sản phẩm' : 'Yêu thích sản phẩm'}
        >
          <Heart
            className={`size-4.5 transition-colors ${
              isLiked
                ? 'fill-primary-500 text-primary-500 animate-[pop_300ms_ease-out]'
                : 'text-ink-subtle hover:text-primary-600'
            }`}
          />
        </button>

        {/* Bottom-left Category Chip */}
        {categoryName && (
          <div className="absolute bottom-2 left-2 z-10">
            <span
              className="inline-flex items-center gap-1 rounded-full bg-white/95 backdrop-blur-xs px-2.5 py-0.5 text-[11px] sm:text-xs font-medium text-ink-muted border border-line/60 shadow-2xs"
              onClick={(e) => e.stopPropagation()}
            >
              <span>{meta.emoji}</span>
              <span className="truncate max-w-[110px]">{categoryName}</span>
            </span>
          </div>
        )}
      </div>

      {/* Card Content */}
      <div className="p-3.5 sm:p-4 flex-1 flex flex-col justify-between">
        <div>
          {/* Product Name (line-clamp-2, min-h-10) */}
          <h3
            className="text-sm font-medium text-ink line-clamp-2 min-h-10 group-hover:text-primary-700 transition-colors leading-snug"
            title={product.name}
          >
            {product.name}
          </h3>

          {/* Meta row: rating ★ + sold count 🔹 */}
          <div className="flex items-center gap-2 text-xs text-ink-muted mt-2">
            <span className="flex items-center gap-1 font-semibold text-amber-600">
              <Star className="size-3.5 fill-amber-400 text-amber-400" aria-hidden="true" />
              {rating.toFixed(1)}
            </span>
            {product.soldCount && (
              <>
                <span>•</span>
                <span>Đã bán {product.soldCount}</span>
              </>
            )}
          </div>

          {/* Price & Original Price */}
          <div className="mt-2.5 flex items-baseline gap-2 flex-wrap">
            <span className="text-lg font-bold text-primary-700">
              {formatCurrency(product.price)}
            </span>
            {hasDiscount && (
              <span className="text-xs text-ink-subtle line-through">
                {formatCurrency(product.originalPrice)}
              </span>
            )}
          </div>

          {/* Inventory bar when 1 <= stock <= 10 */}
          {!isOutOfStock && product.stock <= 10 && (
            <div className="mt-2.5 space-y-1">
              <div className="flex justify-between text-[11px] font-semibold text-amber-700">
                <span>Chỉ còn {product.stock}</span>
              </div>
              <div className="h-1.5 w-full rounded-full bg-gray-100 overflow-hidden">
                <div
                  className="h-full bg-primary-500 rounded-full transition-all"
                  style={{ width: `${Math.min(100, (product.stock / 10) * 100)}%` }}
                />
              </div>
            </div>
          )}
        </div>

        {/* Action Button */}
        <div className="mt-3.5 pt-3 border-t border-line">
          <Button
            variant={justAdded ? 'soft' : isOutOfStock ? 'outline' : 'primary'}
            size="md"
            fullWidth
            disabled={isOutOfStock || justAdded}
            leftIcon={justAdded ? Check : isOutOfStock ? undefined : ShoppingCart}
            onClick={handleAddToCart}
            className={`font-semibold transition-all ${
              justAdded ? 'text-emerald-700 bg-emerald-50 border border-emerald-200' : ''
            }`}
          >
            {isOutOfStock ? 'Hết hàng' : justAdded ? '✓ Đã thêm' : 'Thêm vào giỏ'}
          </Button>
        </div>
      </div>
    </div>
  );
}
