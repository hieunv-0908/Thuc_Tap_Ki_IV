import { Truck, CheckCircle2 } from 'lucide-react';
import { formatCurrency } from '../../utils/formatCurrency';
import { FREE_SHIP_THRESHOLD } from '../../utils/constants';

/**
 * FreeShipBar component per Design.md 7.4
 */
export default function FreeShipBar({ currentTotal = 0 }) {
  const isReached = currentTotal >= FREE_SHIP_THRESHOLD;
  const remaining = Math.max(0, FREE_SHIP_THRESHOLD - currentTotal);
  const percentage = Math.min(100, Math.round((currentTotal / FREE_SHIP_THRESHOLD) * 100));

  return (
    <div className="rounded-xl border border-primary-200 bg-primary-50 p-4 shadow-2xs">
      <div className="flex items-center justify-between text-xs sm:text-sm font-semibold mb-2 text-ink">
        <div className="flex items-center gap-2">
          {isReached ? (
            <CheckCircle2 className="size-4.5 text-emerald-600" aria-hidden="true" />
          ) : (
            <Truck className="size-4.5 text-primary-700" aria-hidden="true" />
          )}
          <span>
            {isReached ? (
              <span className="text-emerald-700 font-bold">
                🎉 Bạn đã đủ điều kiện được Miễn phí giao hàng!
              </span>
            ) : (
              <>
                Mua thêm{' '}
                <strong className="text-primary-700">{formatCurrency(remaining)}</strong> để được
                miễn phí giao hàng
              </>
            )}
          </span>
        </div>
        <span className="text-xs text-ink-muted hidden sm:inline">
          {percentage}%
        </span>
      </div>

      {/* Progress Bar */}
      <div className="h-2 w-full rounded-full bg-white/80 overflow-hidden border border-primary-100">
        <div
          className={`h-full transition-all duration-300 rounded-full ${
            isReached ? 'bg-emerald-600' : 'bg-primary-500'
          }`}
          style={{ width: `${percentage}%` }}
        />
      </div>
    </div>
  );
}
