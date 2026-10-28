import { useState } from 'react';
import { Trash2, Package } from 'lucide-react';
import { formatCurrency } from '../../utils/formatCurrency';
import QuantityStepper from '../ui/QuantityStepper';
import { toast } from '../../store/toastStore';

/**
 * CartItem component complying with Design.md 6.12
 * Desktop: [ảnh 80×80] [tên + đơn giá] [stepper] [thành tiền] [xóa]
 * Mobile: ảnh + tên/đơn giá ở trên, dưới là stepper và thành tiền, nút xóa góc phải trên.
 */
export default function CartItem({
  item,
  onUpdateQuantity,
  onRemove,
}) {
  const { product, quantity } = item;
  const [imgError, setImgError] = useState(false);

  const maxStock = product.stock || 1;
  const itemTotal = (product.price || 0) * quantity;

  const handleQuantityChange = (newQty) => {
    if (newQty > maxStock) {
      toast.warning(`Chỉ còn ${maxStock} sản phẩm trong kho`);
      onUpdateQuantity(product.id, maxStock);
      return;
    }
    onUpdateQuantity(product.id, newQty);
  };

  const handleRemove = () => {
    onRemove(product.id);
    toast.info('Đã xóa khỏi giỏ hàng');
  };

  return (
    <div className="relative flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 rounded-xl border border-line bg-white shadow-2xs hover:border-gray-300 transition-colors">
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
        <div className="size-20 sm:size-20 shrink-0 rounded-lg overflow-hidden border border-line bg-gray-50 flex items-center justify-center">
          {imgError ? (
            <div className="w-full h-full bg-primary-50 flex items-center justify-center text-primary-400">
              <Package className="size-8" />
            </div>
          ) : (
            <img
              src={product.imageUrl}
              alt={product.name}
              onError={() => setImgError(true)}
              className="w-full h-full object-cover"
              loading="lazy"
            />
          )}
        </div>

        <div className="min-w-0 flex-1">
          <h4 className="text-sm sm:text-base font-medium text-ink line-clamp-2 leading-snug">
            {product.name}
          </h4>
          <div className="mt-1 flex items-center gap-2 text-xs sm:text-sm">
            <span className="text-ink-muted">Đơn giá:</span>
            <span className="font-semibold text-primary-700">
              {formatCurrency(product.price)}
            </span>
          </div>
          {maxStock <= 5 && (
            <p className="mt-1 text-xs text-amber-700 font-medium">
              Chỉ còn {maxStock} sản phẩm trong kho
            </p>
          )}
        </div>
      </div>

      {/* Middle & Right: Stepper, Total, Desktop Delete */}
      <div className="flex items-center justify-between sm:justify-end gap-4 sm:gap-6 pt-3 sm:pt-0 border-t sm:border-t-0 border-line">
        {/* Quantity Stepper */}
        <div className="flex items-center gap-1.5">
          <QuantityStepper
            value={quantity}
            min={1}
            max={maxStock}
            onChange={handleQuantityChange}
          />
        </div>

        {/* Subtotal */}
        <div className="text-right min-w-28">
          <span className="sm:hidden text-xs text-ink-muted block">Thành tiền:</span>
          <span className="text-base sm:text-lg font-bold text-primary-700">
            {formatCurrency(itemTotal)}
          </span>
        </div>

        {/* Desktop delete button */}
        <button
          type="button"
          onClick={handleRemove}
          className="hidden sm:inline-flex items-center justify-center size-9 text-ink-subtle hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors cursor-pointer"
          aria-label="Xóa sản phẩm"
          title="Xóa khỏi giỏ"
        >
          <Trash2 className="size-5" />
        </button>
      </div>
    </div>
  );
}
