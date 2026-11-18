import { Check, ClipboardList, Package, Truck, CheckCircle2, AlertTriangle, Clock } from 'lucide-react';
import { ORDER_STATUS } from '../../utils/constants';
import { formatDate } from '../../utils/formatDate';

const STEPS = [
  { key: ORDER_STATUS.PENDING, label: 'Chờ xử lý', icon: ClipboardList },
  { key: ORDER_STATUS.PROCESSING, label: 'Đang xử lý', icon: Package },
  { key: ORDER_STATUS.SHIPPING, label: 'Đang giao', icon: Truck },
  { key: ORDER_STATUS.COMPLETED, label: 'Hoàn thành', icon: CheckCircle2 },
];

/**
 * OrderTimeline component complying with Design.md 7.6
 * Hỗ trợ hiển thị lý do hủy đơn chi tiết và dòng thời gian xử lý
 */
export default function OrderTimeline({ status, cancelReason, timeline = [] }) {
  // Tìm thông tin mốc CANCELLED trong timeline nếu cancelReason chưa có trực tiếp
  const cancelledRecord = timeline?.find?.((t) => t.newStatus === ORDER_STATUS.CANCELLED);
  const displayReason = cancelReason || cancelledRecord?.note;
  const cancelledBy = cancelledRecord?.changedBy;
  const cancelledTime = cancelledRecord?.createdAt;

  if (status === ORDER_STATUS.CANCELLED) {
    return (
      <div className="space-y-4">
        <div className="rounded-xl border border-red-200 bg-red-50 p-4 sm:p-5 text-red-900">
          <div className="flex items-start gap-3.5">
            <div className="size-10 rounded-full bg-red-100 flex items-center justify-center shrink-0 text-red-600 mt-0.5">
              <AlertTriangle className="size-5" />
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <h4 className="font-bold text-base text-red-800">Đơn hàng đã bị hủy</h4>
                {cancelledTime && (
                  <div className="flex items-center gap-1 text-xs text-red-600">
                    <Clock className="size-3.5" />
                    <span>{formatDate(cancelledTime)}</span>
                  </div>
                )}
              </div>

              {displayReason && (
                <div className="mt-2.5 p-3 rounded-lg bg-white/90 border border-red-200 text-sm">
                  <span className="font-semibold text-red-800 block text-xs uppercase tracking-wider mb-1">
                    Lý do hủy đơn:
                  </span>
                  <p className="text-ink font-medium leading-relaxed">
                    "{displayReason}"
                  </p>
                  {cancelledBy && (
                    <span className="block text-xs text-ink-muted mt-1.5">
                      Thực hiện bởi: <strong className="text-ink">{cancelledBy}</strong>
                    </span>
                  )}
                </div>
              )}

              <p className="text-xs text-red-700 mt-2">
                Tồn kho sản phẩm trong đơn đã được tự động hoàn lại hệ thống.
              </p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  const isReturnFlow =
    status === ORDER_STATUS.RETURN_REQUESTED ||
    status === ORDER_STATUS.RETURNING ||
    status === ORDER_STATUS.RETURNED ||
    status === ORDER_STATUS.RETURN_REJECTED;

  const currentIdx = isReturnFlow
    ? STEPS.length - 1
    : STEPS.findIndex((s) => s.key === status);
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
