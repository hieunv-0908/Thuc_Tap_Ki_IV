import { Check, ClipboardList, Package, Truck, CheckCircle2, AlertTriangle } from 'lucide-react';
import { ORDER_STATUS } from '../../utils/constants';

const STEPS = [
  { key: ORDER_STATUS.PENDING, label: 'Chờ xử lý', icon: ClipboardList },
  { key: ORDER_STATUS.PROCESSING, label: 'Đang xử lý', icon: Package },
  { key: ORDER_STATUS.SHIPPING, label: 'Đang giao', icon: Truck },
  { key: ORDER_STATUS.COMPLETED, label: 'Hoàn thành', icon: CheckCircle2 },
];

/**
 * OrderTimeline component complying with Design.md 7.6
 * Icons per v2.0: ClipboardList, Package, Truck, CheckCircle2
 */
export default function OrderTimeline({ status }) {
  if (status === ORDER_STATUS.CANCELLED) {
    return (
      <div className="rounded-xl border border-red-200 bg-red-50 p-4 sm:p-5 text-red-800 flex items-center gap-3">
        <div className="size-10 rounded-full bg-red-100 flex items-center justify-center shrink-0 text-red-600">
          <AlertTriangle className="size-5" />
        </div>
        <div>
          <h4 className="font-semibold text-base">Đơn hàng đã bị hủy</h4>
          <p className="text-xs sm:text-sm text-red-700 mt-0.5">
            Đơn hàng này đã bị hủy. Các mặt hàng đã được hoàn trả lại tồn kho.
          </p>
        </div>
      </div>
    );
  }

  const currentIdx = STEPS.findIndex((s) => s.key === status);
  const activeIndex = currentIdx >= 0 ? currentIdx : 0;

  return (
    <div className="w-full py-4 sm:py-6">
      <div className="relative flex items-center justify-between">
        {/* Background track line */}
        <div className="absolute top-5 left-5 right-5 sm:left-8 sm:right-8 h-1 bg-gray-200 -z-0" />

        {/* Colored progress line */}
        <div
          className="absolute top-5 left-5 sm:left-8 h-1 bg-primary-700 transition-all duration-500 -z-0"
          style={{
            width: `${(activeIndex / (STEPS.length - 1)) * 100}%`,
            maxWidth: 'calc(100% - 2.5rem)',
          }}
        />

        {STEPS.map((step, index) => {
          const isPassed = index < activeIndex;
          const isCurrent = index === activeIndex;
          const Icon = step.icon;

          return (
            <div
              key={step.key}
              className="relative z-10 flex flex-col items-center flex-1 text-center"
            >
              {/* Step Circle */}
              <div
                className={`size-10 sm:size-11 rounded-full flex items-center justify-center font-bold text-sm transition-all duration-200 ${
                  isPassed
                    ? 'bg-primary-700 text-white shadow-xs'
                    : isCurrent
                    ? 'bg-primary-700 text-white ring-4 ring-primary-100 shadow-sm scale-105'
                    : 'bg-gray-100 border-2 border-line text-ink-subtle'
                }`}
              >
                {isPassed ? (
                  <Check className="size-5 text-white" />
                ) : (
                  <Icon className="size-5" />
                )}
              </div>

              {/* Label */}
              <div className="mt-2.5">
                <span
                  className={`block text-xs sm:text-sm font-semibold ${
                    isCurrent
                      ? 'text-primary-700'
                      : isPassed
                      ? 'text-ink'
                      : 'text-ink-subtle'
                  }`}
                >
                  {step.label}
                </span>
                {isCurrent && (
                  <span className="hidden sm:inline-block text-[11px] text-primary-600 font-medium">
                    (Hiện tại)
                  </span>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
