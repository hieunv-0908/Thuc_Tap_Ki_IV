import { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { Shirt, Heart, Check, Plus } from 'lucide-react';
import { formatCurrency } from '../../utils/formatCurrency';
import { useCartStore } from '../../store/cartStore';
import { toast } from '../../store/toastStore';

/**
 * ProductCard component complying with funnyshop-homepage-design.md Section 3.10
 * Japanese Minimalist aesthetic:
 * - Aspect 3:4, neutral tones, 1px border.
 * - Line 1: Category (12px uppercase, letter-spaced).
 * - Line 2: Name (Noto Serif, max 2 lines).
 * - Line 3: Available sizes (left) & Price (right).
 * - Discount tag -% on image in vermilion.
 * - Out-of-stock 50% opacity.
 * - Rating >= 4.8 tag "NỔI BẬT".
 * - Subtle hover-revealed favorite button & Add to cart button.
 * - Retains 100% existing business logic.
 */
export default function ProductCard({ product, onClick }) {
  const [imgError, setImgError] = useState(false);
  const [isLiked, setIsLiked] = useState(false);
  const [justAdded, setJustAdded] = useState(false);
  const navigate = useNavigate();
  const addItem = useCartStore((s) => s.addItem);

  const isOutOfStock = !product || product.stock <= 0;
  const rating = Number(product?.rating || 4.5);
  const isFeatured = rating >= 4.8;
  const categoryName = product?.category?.name || '';

  // Discount percentage if originalPrice exists
  const hasDiscount = Boolean(product?.originalPrice && product.originalPrice > product.price);
  const discountPercent = hasDiscount
    ? Math.round(((product.originalPrice - product.price) / product.originalPrice) * 100)
    : 0;

  const variants = product?.variants;
  const activeVariants = useMemo(
    () => variants?.filter((v) => !v.isDeleted) || [],
    [variants]
  );
  const hasMultipleVariants = activeVariants.length > 1;

  // Extract available sizes
  const displaySizes = useMemo(() => {
    if (Array.isArray(product?.sizes) && product.sizes.length > 0) {
      return product.sizes;
    }
    if (activeVariants.length > 0) {
      const sizes = [...new Set(activeVariants.map((v) => v.size).filter(Boolean))];
      if (sizes.length > 0) return sizes;
    }
    return [];
  }, [product, activeVariants]);

  const handleAddToCart = (e) => {
    e.stopPropagation();
    if (isOutOfStock) return;

    // Nếu sản phẩm có nhiều biến thể (màu, size) -> điều hướng đến trang chi tiết để khách chọn chính xác
    if (hasMultipleVariants) {
      if (onClick) {
        onClick(product);
      } else {
        navigate(`/products/${product.id}`);
      }
      return;
    }

    // Nếu có 1 biến thể duy nhất hoặc mặc định
    const targetVariant = activeVariants[0];
    const cartPayload = targetVariant
      ? {
          variantId: targetVariant.id,
          productId: product.id,
          product,
          name: product.name,
          sku: targetVariant.sku,
          color: targetVariant.color,
          size: targetVariant.size,
          price: targetVariant.price,
          imageUrl: targetVariant.imageUrl || product.imageUrl,
          stockQuantity: targetVariant.stockQuantity,
        }
      : product;

    const success = addItem(cartPayload, 1);
    if (success) {
      setJustAdded(true);
      const variantDesc = targetVariant?.color && targetVariant?.size
        ? ` (${targetVariant.color} - ${targetVariant.size})`
        : '';
      toast.success(`Đã thêm biến thể${variantDesc} vào giỏ hàng`);
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
    } else if (product?.id) {
      navigate(`/products/${product.id}`);
    }
  };

  return (
    <article
      onClick={handleCardClick}
      className={`group relative flex flex-col bg-paper cursor-pointer select-none transition-opacity duration-200 ${
        isOutOfStock ? 'opacity-50' : 'hover:opacity-95'
      }`}
    >
      {/* 3:4 Aspect Ratio Image */}
      <div className="relative aspect-[3/4] w-full overflow-hidden bg-sand/40 border border-line flex items-center justify-center">
        {imgError ? (
          <div className="w-full h-full flex flex-col items-center justify-center text-mute gap-2 p-4 text-center">
            <Shirt className="size-8 stroke-[1.2]" aria-hidden="true" />
            <span className="text-[11px] font-light uppercase tracking-widest text-mute">Trang phục</span>
          </div>
        ) : (
          <img
            src={product.imageUrl}
            alt={product.name}
            loading="lazy"
            onError={() => setImgError(true)}
            className="w-full h-full object-cover object-top transition-transform duration-500 ease-out group-hover:scale-105"
          />
        )}

        {/* Top-left Badges */}
        <div className="absolute top-2.5 left-2.5 flex flex-col gap-1.5 z-10">
          {isOutOfStock && (
            <span className="bg-ink text-paper text-[10px] font-light uppercase tracking-widest px-2 py-0.5">
              Hết hàng
            </span>
          )}

          {!isOutOfStock && hasDiscount && discountPercent > 0 && (
            <span className="bg-vermilion text-paper text-[10px] font-medium tracking-wider px-1.5 py-0.5">
              -{discountPercent}%
            </span>
          )}

          {!isOutOfStock && isFeatured && (
            <span className="bg-paper text-ink text-[10px] font-light uppercase tracking-widest px-2 py-0.5 border border-line">
              Nổi bật
            </span>
          )}
        </div>

        {/* Top-right Favorite Button (Subtle, visible on hover) */}
        <button
          type="button"
          onClick={handleLikeClick}
          className={`absolute top-2.5 right-2.5 z-10 size-7 flex items-center justify-center transition-all cursor-pointer ${
            isLiked
              ? 'opacity-100 text-vermilion'
              : 'opacity-0 group-hover:opacity-100 text-ink/70 hover:text-ink'
          }`}
          aria-label={isLiked ? 'Bỏ thích' : 'Yêu thích'}
        >
          <Heart
            className={`size-4 transition-colors ${
              isLiked ? 'fill-vermilion text-vermilion' : 'stroke-[1.5]'
            }`}
          />
        </button>

        {/* Hover "Thêm vào giỏ" button on Image (Slide up) */}
        {!isOutOfStock && (
          <button
            type="button"
            onClick={handleAddToCart}
            className={`absolute bottom-0 inset-x-0 py-2.5 bg-ink text-paper text-xs uppercase tracking-[0.15em] font-light flex items-center justify-center gap-1.5 transition-transform duration-200 cursor-pointer ${
              justAdded
                ? 'translate-y-0 bg-ink text-paper'
                : 'translate-y-full group-hover:translate-y-0'
            }`}
          >
            {justAdded ? (
              <>
                <Check className="size-3.5" />
                <span>Đã thêm vào giỏ</span>
              </>
            ) : hasMultipleVariants ? (
              <span>Chọn kích cỡ & màu →</span>
            ) : (
              <>
                <Plus className="size-3.5" />
                <span>Thêm vào giỏ</span>
              </>
            )}
          </button>
        )}
      </div>

      {/* Product Details under image */}
      <div className="pt-3 pb-1 flex flex-col">
        {/* Dòng 1: Danh mục (12px, giãn chữ) */}
        <div className="text-[11px] font-light uppercase tracking-[0.18em] text-mute truncate">
          {categoryName || 'BỘ SƯU TẬP'}
        </div>

        {/* Dòng 2: Tên sản phẩm (Noto Serif, tối đa 2 dòng) */}
        <h3
          className="font-serif font-light text-[15px] sm:text-base text-ink line-clamp-2 mt-1 mb-2 leading-snug group-hover:text-vermilion transition-colors"
          title={product.name}
        >
          {product.name}
        </h3>

        {/* Dòng 3: Size còn hàng (trái) và Giá (phải) */}
        <div className="flex items-baseline justify-between gap-2 mt-auto pt-1 border-t border-line/60">
          {/* Size còn hàng */}
          <div className="flex items-center gap-1 flex-wrap text-[11px] font-light text-mute">
            {displaySizes.length > 0 ? (
              <span>{displaySizes.slice(0, 3).join(' · ')}{displaySizes.length > 3 ? ' +' : ''}</span>
            ) : (
              <span>Free size</span>
            )}
          </div>

          {/* Giá bán */}
          <div className="flex items-baseline gap-2">
            {hasDiscount && (
              <span className="text-xs text-mute/80 line-through font-light">
                {formatCurrency(product.originalPrice)}
              </span>
            )}
            <span className="text-sm sm:text-[15px] font-medium text-ink tracking-tight">
              {product.minPrice && product.maxPrice && product.minPrice < product.maxPrice
                ? `Từ ${formatCurrency(product.minPrice)}`
                : formatCurrency(product.price)}
            </span>
          </div>
        </div>
      </div>
    </article>
  );
}
