import { ArrowRight, ClipboardList, ShieldCheck } from 'lucide-react';
import { formatCurrency } from '../../utils/formatCurrency';
import Button from '../ui/Button';

/**
 * CartSummary component complying with Design.md 7.4
 * Top accent gradient h-1, dotted dashed line before Total, COD footnote
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
      <div className="rounded-2xl border border-line bg-white shadow-soft overflow-hidden space-y-5">
        {/* Top accent gradient bar (Design.md 2.7.2) */}
        <div className="h-1 w-full bg-gradient-to-r from-primary-500 via-secondary-500 to-primary-500" />

        <div className="p-5 sm:p-6 space-y-5 pt-1">
          <h3 className="text-lg font-bold text-ink border-b border-line pb-3 flex items-center gap-2">
            <ClipboardList className="size-5 text-primary-700" />
            <span>Tóm tắt đơn hàng</span>
          </h3>

          <div className="space-y-3 text-sm">
            <div className="flex justify-between items-center text-ink-muted">
              <span>Tạm tính ({itemCount} sản phẩm)</span>
              <span className="font-semibold text-ink">{formatCurrency(subtotal)}</span>
            </div>

            <div className="flex justify-between items-center text-ink-muted">
              <span>Phí giao hàng</span>
              <span className="font-semibold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-md text-xs">
                Miễn phí
              </span>
            </div>

            {/* Dotted border before total per Design.md 7.4 */}
            <div className="border-t border-dashed border-line pt-3 flex justify-between items-baseline">
              <span className="text-base font-bold text-ink">Tổng thanh toán</span>
              <div className="text-right">
                <span className="text-xl sm:text-2xl font-bold text-primary-700 block">
                  {formatCurrency(total)}
                </span>
                <span className="text-xs text-ink-subtle">(Đã bao gồm thuế nếu có)</span>
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
              className="font-bold shadow-brand"
            >
              Tiến hành đặt hàng
            </Button>
          </div>

          {/* COD Notice & Security */}
          <div className="pt-3 border-t border-line/70 space-y-2 text-xs text-ink-muted">
            <div className="flex items-center gap-2 font-medium text-ink">
              <span>💵</span>
              <span>Thanh toán khi nhận hàng (COD)</span>
            </div>
            <div className="flex items-center gap-2 text-ink-subtle">
              <ShieldCheck className="size-4 text-secondary-500 shrink-0" />
              <span>Kiểm tra hàng trước khi thanh toán</span>
            </div>
          </div>
        </div>
      </div>

      {/* Mobile Sticky Bottom Bar per Design.md 7.4 */}
      <div className="sm:hidden fixed bottom-0 left-0 right-0 z-30 bg-white/95 backdrop-blur-md border-t border-line p-3 shadow-lg flex items-center justify-between gap-3">
        <div>
          <span className="text-xs text-ink-muted block">Tổng cộng:</span>
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
          className="px-5 shrink-0 font-bold shadow-brand"
        >
          Đặt hàng ({itemCount})
        </Button>
      </div>
    </>
  );
}
