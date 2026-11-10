import { useMemo } from 'react';

const COLOR_MAP = {
  black: '#1a1a1a',
  white: '#ffffff',
  navy: '#0f2b5c',
  'light blue': '#7bb4ec',
  'dark blue': '#1b3b6f',
  'ruby red': '#9b111e',
  red: '#dc2626',
  beige: '#e8dcbe',
  standard: '#6366f1',
  blue: '#2563eb',
  pink: '#ec4899',
  yellow: '#eab308',
  gray: '#6b7280',
};

function resolveColorHex(colorName) {
  if (!colorName) return '#94a3b8';
  const lower = colorName.toLowerCase().trim();
  return COLOR_MAP[lower] || lower;
}

export default function ProductVariantSelector({
  variants = [],
  images = [],
  selectedVariant,
  onSelectVariant,
  onSelectImage,
}) {
  // Nhóm các biến thể hợp lệ (chưa xóa mềm)
  const activeVariants = useMemo(() => {
    return variants.filter((v) => !v.isDeleted);
  }, [variants]);

  // Danh sách màu duy nhất
  const uniqueColors = useMemo(() => {
    const set = new Set();
    const result = [];
    activeVariants.forEach((v) => {
      if (v.color && !set.has(v.color)) {
        set.add(v.color);
        result.push(v.color);
      }
    });
    return result;
  }, [activeVariants]);

  // Danh sách kích cỡ ứng với màu hiện tại
  const selectedColor = selectedVariant?.color;
  const availableSizesForColor = useMemo(() => {
    if (!selectedColor) return [];
    return activeVariants.filter((v) => v.color === selectedColor);
  }, [activeVariants, selectedColor]);

  if (!activeVariants || activeVariants.length <= 1 && (!activeVariants[0]?.color || activeVariants[0]?.color === 'Standard')) {
    return null;
  }

  const handleColorChange = (color) => {
    // Tìm ảnh khớp với biến thể màu này
    const matchVariant = activeVariants.find((v) => v.color === color);
    if (matchVariant) {
      if (onSelectImage) {
        const variantImg = images.find((img) => img.variantId === matchVariant.id);
        if (variantImg) {
          onSelectImage(variantImg.imageUrl);
        }
      }

      // Giữ size hiện tại nếu màu mới cũng có size đó, ngược lại lấy size đầu tiên
      const sameSizeVariant = activeVariants.find(
        (v) => v.color === color && v.size === selectedVariant?.size
      );
      onSelectVariant(sameSizeVariant || matchVariant);
    }
  };

  const handleSizeChange = (variant) => {
    onSelectVariant(variant);
  };

  return (
    <div className="space-y-4 py-2 border-y border-line my-3">
      {/* 1. Chọn Màu Sắc (Color Swatches) */}
      {uniqueColors.length > 0 && (
        <div>
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-semibold text-ink-muted uppercase tracking-wider">
              Màu sắc:
            </span>
            <span className="text-xs font-bold text-ink">
              {selectedVariant?.color || 'Chưa chọn'}
            </span>
          </div>

          <div className="flex flex-wrap gap-2.5">
            {uniqueColors.map((color) => {
              const isSelected = selectedVariant?.color === color;
              const hex = resolveColorHex(color);
              const isLight = hex === '#ffffff' || hex.toLowerCase() === '#e8dcbe';

              return (
                <button
                  key={color}
                  type="button"
                  onClick={() => handleColorChange(color)}
                  className={`group relative flex items-center gap-1.5 px-3 py-1.5 rounded-full border text-xs font-medium transition-all cursor-pointer ${
                    isSelected
                      ? 'border-primary-600 bg-primary-50 text-primary-900 ring-2 ring-primary-500/20'
                      : 'border-line bg-white hover:border-ink-subtle text-ink'
                  }`}
                >
                  <span
                    className={`size-3.5 rounded-full shrink-0 border ${
                      isLight ? 'border-gray-300' : 'border-transparent'
                    }`}
                    style={{ backgroundColor: hex }}
                  />
                  <span>{color}</span>
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* 2. Chọn Kích cỡ (Size Buttons) */}
      {availableSizesForColor.length > 0 && (
        <div>
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-semibold text-ink-muted uppercase tracking-wider">
              Kích thước:
            </span>
            <span className="text-xs font-bold text-ink">
              {selectedVariant?.size || 'Chưa chọn'}
            </span>
          </div>

          <div className="flex flex-wrap gap-2">
            {availableSizesForColor.map((v) => {
              const isSelected = selectedVariant?.id === v.id;
              const isOutOfStock = v.stockQuantity <= 0;

              return (
                <button
                  key={v.id}
                  type="button"
                  disabled={isOutOfStock}
                  onClick={() => handleSizeChange(v)}
                  className={`min-w-10 px-3 py-1.5 rounded-lg border text-xs font-semibold transition-all cursor-pointer ${
                    isOutOfStock
                      ? 'opacity-40 border-dashed border-gray-300 bg-gray-50 text-ink-subtle cursor-not-allowed line-through'
                      : isSelected
                      ? 'border-primary-600 bg-primary-600 text-white shadow-xs'
                      : 'border-line bg-white hover:border-primary-400 text-ink'
                  }`}
                >
                  {v.size}
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* 3. SKU & Tồn kho của biến thể đang chọn */}
      {selectedVariant && (
        <div className="flex items-center justify-between text-[11px] text-ink-subtle pt-1">
          <span>
            Mã SKU: <span className="font-mono font-medium text-ink-muted">{selectedVariant.sku}</span>
          </span>
          <span>
            Tồn kho phân loại: <span className="font-semibold text-ink">{selectedVariant.stockQuantity}</span>
          </span>
        </div>
      )}
    </div>
  );
}

