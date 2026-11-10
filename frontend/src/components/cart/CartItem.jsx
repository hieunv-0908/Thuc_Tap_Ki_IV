import { useState } from 'react';
import { Trash2, Package } from 'lucide-react';
import { formatCurrency } from '../../utils/formatCurrency';
import { getCategoryMeta } from '../../utils/constants';
import QuantityStepper from '../ui/QuantityStepper';
import { toast } from '../../store/toastStore';

/**
 * CartItem component complying with Design.md 6.12 & Fashion Variants
 */
export default function CartItem({
  item,
  onUpdateQuantity,
  onRemove,
}) {
  const { product, quantity } = item;
  const [imgError, setImgError] = useState(false);

  const itemId = item.variantId || product?.id || item.id;
  const itemName = item.name || product?.name || 'Sản phẩm';
  const itemPrice = item.price ?? product?.price ?? 0;
  const itemImage = item.imageUrl || product?.imageUrl;
  const maxStock = item.stock || product?.stock || 1;
  const itemTotal = itemPrice * quantity;
  const categoryName = product?.category?.name || '';
  const meta = getCategoryMeta(categoryName);

  const handleQuantityChange = (newQty) => {
    if (newQty > maxStock) {
      toast.warning(`Chỉ còn ${maxStock} sản phẩm trong kho`);
      onUpdateQuantity(itemId, maxStock);
      return;
    }
    onUpdateQuantity(itemId, newQty);
  };

  const handleRemove = () => {
    onRemove(itemId);
    toast.info('Đã xóa khỏi giỏ hàng');
  };

  return (
    <div className="relative flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 rounded-xl border border-line bg-white shadow-soft hover:border-primary-200 transition-colors">
      {/* Mobile delete button: Top right */}
      <button
        type="button"
        onClick={handleRemove}
        className="sm:hidden absolute top-3 right-3 p-1.5 text-ink-subtle hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors cursor-pointer"
        aria-label="Xóa sản phẩm khỏi giỏ hàng"
      >
        <Trash2 className="size-4" />
      </button>

      {/* Left: Product image + info */}
      <div className="flex items-center gap-3.5 flex-1 min-w-0 pr-8 sm:pr-0">
        <div className="size-20 shrink-0 rounded-lg overflow-hidden border border-line bg-gray-50 flex items-center justify-center">
          {imgError || !itemImage ? (
            <div className="w-full h-full bg-primary-50 flex items-center justify-center text-primary-400">
              <Package className="size-8" />
            </div>
          ) : (
            <img
              src={itemImage}
              alt={itemName}
              onError={() => setImgError(true)}
              className="w-full h-full object-cover"
              loading="lazy"
            />
          )}
        </div>

        <div className="min-w-0 flex-1">
          {/* Category Chip */}
          {categoryName && (
            <span className="inline-flex items-center gap-1 text-[11px] font-medium text-ink-muted mb-0.5">
              <span>{meta.emoji}</span>
              <span>{categoryName}</span>
            </span>
          )}

          <h4 className="text-sm sm:text-base font-semibold text-ink line-clamp-2 leading-snug">
            {itemName}
          </h4>

          {/* Biến thể: Màu sắc, Kích thước */}
          {(item.color || item.size) && (
            <div className="flex flex-wrap items-center gap-1.5 my-1 text-xs">
              {item.color && (
                <span className="bg-primary-50 text-primary-800 font-medium px-2 py-0.5 rounded border border-primary-200">
                  Màu: {item.color}
                </span>
              )}
              {item.size && (
                <span className="bg-gray-100 text-ink font-semibold px-2 py-0.5 rounded border border-line">
                  Size: {item.size}
                </span>
              )}
              {item.sku && (
                <span className="text-[10px] text-ink-subtle font-mono hidden sm:inline">
                  ({item.sku})
                </span>
              )}
            </div>
          )}

          <div className="mt-1 flex items-center gap-2 text-xs sm:text-sm">
            <span className="text-ink-muted">Đơn giá:</span>
            <span className="font-semibold text-primary-700">
              {formatCurrency(itemPrice)}
            </span>
          </div>

          {/* Low stock warning */}
          {maxStock <= 5 && (
            <p className="mt-1 text-xs text-amber-700 font-semibold flex items-center gap-1">
              Chỉ còn {maxStock} sản phẩm trong kho
            </p>
          )}
        </div>
      </div>

      {/* Middle & Right: Stepper, Total, Desktop Delete */}
      <div className="flex items-center justify-between sm:justify-end gap-4 sm:gap-6 pt-3 sm:pt-0 border-t sm:border-t-0 border-line">
        <QuantityStepper
          value={quantity}
          min={1}
          max={maxStock}
          onChange={handleQuantityChange}
        />

        <div className="text-right min-w-[100px]">
          <span className="block text-xs text-ink-subtle sm:hidden">Thành tiền</span>
          <span className="text-base sm:text-lg font-bold text-ink">
            {formatCurrency(itemTotal)}
          </span>
        </div>

        <button
          type="button"
          onClick={handleRemove}
          className="hidden sm:inline-flex p-2 text-ink-subtle hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors cursor-pointer"
          aria-label="Xóa sản phẩm khỏi giỏ hàng"
        >
          <Trash2 className="size-5" />
        </button>
      </div>
    </div>
  );
}

