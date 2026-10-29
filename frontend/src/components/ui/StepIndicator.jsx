import { Check } from 'lucide-react';

/**
 * StepIndicator component complying with Design.md 6.22 & 7.5
 */
export default function StepIndicator({
  steps = ['Giỏ hàng', 'Thông tin giao hàng', 'Hoàn tất'],
  currentStep = 1, // 0-indexed
  className = '',
}) {
  return (
    <div className={`w-full py-3 ${className}`}>
      <div className="flex items-center justify-between relative max-w-xl mx-auto">
        {/* Background track line */}
        <div className="absolute top-4 left-4 right-4 h-0.5 bg-gray-200 -z-0" />

        {/* Active progress line */}
        <div
          className="absolute top-4 left-4 h-0.5 bg-primary-700 transition-all duration-300 -z-0"
          style={{
            width: `${(currentStep / Math.max(1, steps.length - 1)) * 100}%`,
            maxWidth: 'calc(100% - 2rem)',
          }}
        />

        {steps.map((label, index) => {
          const isPassed = index < currentStep;
          const isCurrent = index === currentStep;

          return (
            <div key={label} className="relative z-10 flex flex-col items-center">
              {/* Step circle */}
              <div
                className={`size-8 rounded-full flex items-center justify-center text-xs font-bold transition-all duration-200 ${
                  isPassed
                    ? 'bg-primary-700 text-white shadow-xs'
                    : isCurrent
                    ? 'bg-white border-2 border-primary-700 text-primary-700 ring-4 ring-primary-100 shadow-xs'
                    : 'bg-gray-200 text-ink-muted'
                }`}
                aria-current={isCurrent ? 'step' : undefined}
              >
                {isPassed ? <Check className="size-4 text-white" /> : index + 1}
              </div>

              {/* Label */}
              <span
                className={`mt-2 text-xs font-semibold ${
                  isCurrent
                    ? 'text-primary-700'
                    : isPassed
                    ? 'text-ink'
                    : 'text-ink-muted'
                } ${isCurrent ? 'block' : 'hidden sm:block'}`}
              >
                {label}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
