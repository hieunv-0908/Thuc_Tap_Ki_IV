import { Minus, Plus } from 'lucide-react';

/**
 * QuantityStepper component per Design.md 6.3
 */
export default function QuantityStepper({
  value = 1,
  min = 1,
  max = 99,
  onChange,
  disabled = false,
  className = '',
}) {
  const handleDecrease = () => {
    if (value > min && !disabled) {
      onChange(value - 1);
    }
  };

  const handleIncrease = () => {
    if (value < max && !disabled) {
      onChange(value + 1);
    }
  };

  return (
    <div className={`inline-flex items-center gap-1.5 ${className}`}>
      <button
        type="button"
        onClick={handleDecrease}
        disabled={disabled || value <= min}
        className="size-10 rounded-lg border border-line bg-white flex items-center justify-center text-ink hover:bg-gray-50 active:bg-gray-100 disabled:opacity-40 disabled:cursor-not-allowed transition-colors cursor-pointer"
        aria-label="Giảm số lượng"
      >
        <Minus className="size-4" />
      </button>

      <span className="w-12 text-center text-base font-semibold text-ink select-none">
        {value}
      </span>

      <button
        type="button"
        onClick={handleIncrease}
        disabled={disabled || value >= max}
        className="size-10 rounded-lg border border-line bg-white flex items-center justify-center text-ink hover:bg-gray-50 active:bg-gray-100 disabled:opacity-40 disabled:cursor-not-allowed transition-colors cursor-pointer"
        aria-label="Tăng số lượng"
      >
        <Plus className="size-4" />
      </button>
    </div>
  );
}
