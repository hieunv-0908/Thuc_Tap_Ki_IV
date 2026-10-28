import { useState } from 'react';
import { Package, Star, ShoppingCart } from 'lucide-react';
import { formatCurrency } from '../../utils/formatCurrency';
import { useCartStore } from '../../store/cartStore';
import { toast } from '../../store/toastStore';
import Button from '../ui/Button';

/**
 * ProductCard component complying with Design.md 6.11
 */
export default function ProductCard({ product, onClick }) {
  const [imgError, setImgError] = useState(false);
  const addItem = useCartStore((s) => s.addItem);

  const isOutOfStock = !product || product.stock <= 0;

  const handleAddToCart = (e) => {
    e.stopPropagation();
    if (isOutOfStock) return;

    const success = addItem(product, 1);
    if (success) {
      toast.success('Đã thêm vào giỏ hàng');
    } else {
      toast.warning(`Chỉ còn ${product.stock} sản phẩm trong kho`);
    }
  };

  const handleCardClick = () => {
    if (onClick) {
      onClick(product);
    }
  };

  return (
    <div
      onClick={handleCardClick}
      className="group flex flex-col overflow-hidden rounded-xl border border-line bg-white shadow-sm transition hover:shadow-md hover:-translate-y-0.5 cursor-pointer"
    >
      {/* Square Image container */}
      <div className="relative aspect-square w-full overflow-hidden bg-gray-50 flex items-center justify-center">
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
              isOutOfStock ? 'opacity-60 grayscale-[30%]' : ''
            }`}
          />
        )}

        {/* Out of stock badge */}
        {isOutOfStock && (
          <div className="absolute top-2.5 left-2.5">
            <span className="bg-gray-900/80 backdrop-blur-xs text-white text-xs font-medium rounded-md px-2 py-1 shadow-xs">
              Hết hàng
            </span>
          </div>
        )}

        {/* Category tag */}
        {product.category?.name && (
          <div className="absolute top-2.5 right-2.5">
            <span className="bg-white/90 backdrop-blur-xs text-ink-muted text-[11px] font-medium rounded-md px-2 py-0.5 border border-line shadow-2xs">
              {product.category.name}
            </span>
          </div>
        )}
      </div>

      {/* Card Content */}
      <div className="p-3.5 flex-1 flex flex-col justify-between">
        <div>
          <h3
            className="text-sm font-medium text-ink line-clamp-2 group-hover:text-primary-700 transition-colors leading-snug"
            title={product.name}
          >
            {product.name}
          </h3>

          <div className="flex items-center justify-between text-xs text-ink-muted mt-2">
            <div className="flex items-center gap-1 font-medium text-amber-600">
              <Star className="size-3.5 fill-amber-400 text-amber-400" />
              <span>{product.rating || '4.5'}</span>
            </div>
            <span>
              {isOutOfStock
                ? 'Hết hàng'
                : product.stock <= 5
                ? `Chỉ còn ${product.stock}`
                : `Còn ${product.stock}`}
            </span>
          </div>
        </div>

        <div className="mt-3 pt-3 border-t border-line flex flex-col gap-2.5">
          <div className="text-lg font-bold text-primary-700 leading-tight">
            {formatCurrency(product.price)}
          </div>

          <Button
            variant={isOutOfStock ? 'outline' : 'primary'}
            size="md"
            fullWidth
            disabled={isOutOfStock}
            leftIcon={isOutOfStock ? undefined : ShoppingCart}
            onClick={handleAddToCart}
          >
            {isOutOfStock ? 'Hết hàng' : 'Thêm vào giỏ'}
          </Button>
        </div>
      </div>
    </div>
  );
}
