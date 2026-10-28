import { ArrowRight, ShieldCheck, Truck } from 'lucide-react';
import { formatCurrency } from '../../utils/formatCurrency';
import Button from '../ui/Button';

/**
 * CartSummary component complying with Design.md 7.4
 * Sticky on desktop, fixed bottom bar on mobile.
 */
export default function CartSummary({
  subtotal = 0,
  total = 0,
  itemCount = 0,
  onCheckout,
  disabled = false,
}) {
  return (
    <>
      {/* Desktop & Tablet Sidebar Box */}
      <div className="rounded-2xl border border-line bg-white p-5 sm:p-6 shadow-sm space-y-5">
        <h3 className="text-lg font-bold text-ink border-b border-line pb-3">
          Tóm tắt đơn hàng
        </h3>

        <div className="space-y-3 text-sm">
          <div className="flex justify-between items-center text-ink-muted">
            <span>Tạm tính ({itemCount} sản phẩm)</span>
            <span className="font-medium text-ink">{formatCurrency(subtotal)}</span>
          </div>

          <div className="flex justify-between items-center text-ink-muted">
            <span className="inline-flex items-center gap-1.5">
              <Truck className="size-4 text-emerald-600" />
              Phí vận chuyển
            </span>
            <span className="font-medium text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-md text-xs font-semibold">
              Miễn phí
            </span>
          </div>

          <div className="border-t border-line pt-3 flex justify-between items-baseline">
            <span className="text-base font-bold text-ink">Tổng cộng</span>
            <div className="text-right">
              <span className="text-2xl font-bold text-primary-700 block">
                {formatCurrency(total)}
              </span>
              <span className="text-xs text-ink-subtle">(Đã bao gồm VAT nếu có)</span>
            </div>
          </div>
        </div>

        {/* Desktop Checkout Button */}
        <div className="hidden sm:block pt-2">
          <Button
            variant="primary"
            size="lg"
            fullWidth
            disabled={disabled || itemCount === 0}
            rightIcon={ArrowRight}
            onClick={onCheckout}
          >
            Tiến hành đặt hàng
          </Button>
        </div>

        {/* Guarantees */}
        <div className="pt-3 border-t border-line/60 space-y-2 text-xs text-ink-muted">
          <div className="flex items-center gap-2">
            <ShieldCheck className="size-4 text-secondary-500 shrink-0" />
            <span>Cam kết chất lượng 100% chính hãng</span>
          </div>
          <div className="flex items-center gap-2">
            <Truck className="size-4 text-primary-500 shrink-0" />
            <span>Giao hàng COD tận nơi toàn quốc</span>
          </div>
        </div>
      </div>

      {/* Mobile Sticky Bottom Bar per Design.md 7.4 */}
      <div className="sm:hidden fixed bottom-0 left-0 right-0 z-30 bg-white/95 backdrop-blur-md border-t border-line p-3 shadow-lg flex items-center justify-between gap-3">
        <div>
          <span className="text-xs text-ink-muted block">Tổng thanh toán:</span>
          <span className="text-lg font-bold text-primary-700">
            {formatCurrency(total)}
          </span>
        </div>

        <Button
          variant="primary"
          size="md"
          disabled={disabled || itemCount === 0}
          rightIcon={ArrowRight}
          onClick={onCheckout}
          className="px-5 shrink-0"
        >
          Đặt hàng ({itemCount})
        </Button>
      </div>
    </>
  );
}
