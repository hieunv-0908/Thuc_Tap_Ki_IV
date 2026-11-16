import { useState, useId, useMemo } from 'react';
import { formatCurrency } from '../../../utils/formatCurrency';

/**
 * Modern Interactive SVG Donut / Pie Chart for Admin Dashboard
 * Cleanly aligned, responsive, perfectly fits within grid columns without overflow.
 */
export default function DonutChart({
  data = [],
  title = '',
  subtitle = '',
  totalLabel = 'Tổng cộng',
  formatValue = (val) => formatCurrency(val),
  size = 180,
  strokeWidth = 24,
  showHeader = true,
  className = '',
}) {
  const [activeIndex, setActiveIndex] = useState(null);
  const chartId = useId();

  const totalValue = data.reduce((acc, item) => acc + (Number(item.value) || 0), 0);

  // SVG dimensions
  const center = size / 2;
  const radius = center - strokeWidth / 2 - 4;
  const circumference = 2 * Math.PI * radius;

  // Compute stroke-dasharray and offsets in a purely functional, immutable way
  const segments = useMemo(() => {
    return data.map((item, index) => {
      const val = Number(item.value) || 0;
      const ratio = totalValue > 0 ? val / totalValue : 0;
      const strokeLength = ratio * circumference;

      // Sum of previous segment stroke lengths (pure immutable reduction)
      const offset = data.slice(0, index).reduce((sum, prev) => {
        const prevVal = Number(prev.value) || 0;
        const prevRatio = totalValue > 0 ? prevVal / totalValue : 0;
        return sum + prevRatio * circumference;
      }, 0);

      const percent = Math.round(ratio * 100);

      return {
        ...item,
        strokeLength,
        offset,
        percent,
        index,
      };
    });
  }, [data, totalValue, circumference]);

  const activeSegment = activeIndex !== null ? segments[activeIndex] : null;

  return (
    <div className={`flex flex-col w-full ${className}`}>
      {/* Optional Header */}
      {showHeader && title && (
        <div className="mb-4">
          <h3 className="text-base font-bold text-ink">{title}</h3>
          {subtitle && <p className="text-xs text-ink-muted mt-0.5">{subtitle}</p>}
        </div>
      )}

      {/* Chart & Legend Container: Side-by-side on sm+, nicely spaced, perfectly aligned */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4 sm:gap-6 w-full">
        {/* Donut SVG Ring */}
        <div className="relative shrink-0 flex items-center justify-center">
          <svg
            width={size}
            height={size}
            viewBox={`0 0 ${size} ${size}`}
            className="transform -rotate-90 select-none"
          >
            {/* Background Track */}
            <circle
              cx={center}
              cy={center}
              r={radius}
              fill="transparent"
              stroke="#F3F4F6"
              strokeWidth={strokeWidth}
            />

            {/* Data Segments */}
            {segments.map((seg) => {
              const isActive = activeIndex === seg.index;
              const isOtherActive = activeIndex !== null && !isActive;

              return (
                <circle
                  key={`${chartId}-${seg.label}-${seg.index}`}
                  cx={center}
                  cy={center}
                  r={radius}
                  fill="transparent"
                  stroke={seg.color}
                  strokeWidth={isActive ? strokeWidth + 4 : strokeWidth}
                  strokeDasharray={`${Math.max(0, seg.strokeLength - 2)} ${circumference}`}
                  strokeDashoffset={-seg.offset}
                  className="transition-all duration-200 ease-out cursor-pointer"
                  style={{
                    opacity: isOtherActive ? 0.35 : 1,
                  }}
                  onMouseEnter={() => setActiveIndex(seg.index)}
                  onMouseLeave={() => setActiveIndex(null)}
                />
              );
            })}
          </svg>

          {/* Center Hub Info */}
          <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none text-center px-2">
            {activeSegment ? (
              <div className="animate-in fade-in duration-150">
                <span
                  className="inline-block text-[10px] font-bold px-2 py-0.5 rounded-full mb-0.5 text-white shadow-2xs truncate max-w-[100px]"
                  style={{ backgroundColor: activeSegment.color }}
                >
                  {activeSegment.label}
                </span>
                <p className="text-sm sm:text-base font-extrabold text-ink leading-tight tabular-nums">
                  {formatValue(activeSegment.value)}
                </p>
                <p className="text-[10px] font-bold text-primary-700 mt-0.5">
                  {activeSegment.percent}%
                </p>
              </div>
            ) : (
              <div>
                <p className="text-[10px] font-semibold text-ink-subtle uppercase tracking-wider leading-tight">
                  {totalLabel}
                </p>
                <p className="text-sm sm:text-base font-black text-ink tabular-nums mt-0.5 leading-tight">
                  {formatValue(totalValue)}
                </p>
                <p className="text-[10px] text-ink-muted mt-0.5 font-medium">
                  {data.length} danh mục
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Legend List */}
        <div className="flex-1 min-w-0 w-full space-y-1.5">
          {segments.map((seg) => {
            const isActive = activeIndex === seg.index;
            return (
              <button
                key={seg.label}
                type="button"
                className={`w-full flex items-center justify-between text-left px-2.5 py-1.5 rounded-lg transition-all cursor-pointer ${
                  isActive
                    ? 'bg-primary-50 ring-1 ring-primary-300 shadow-2xs'
                    : 'hover:bg-gray-50'
                }`}
                onMouseEnter={() => setActiveIndex(seg.index)}
                onMouseLeave={() => setActiveIndex(null)}
              >
                <div className="flex items-center gap-2 min-w-0 mr-2">
                  <span
                    className="size-2.5 rounded-full shrink-0 shadow-2xs transition-transform"
                    style={{
                      backgroundColor: seg.color,
                      transform: isActive ? 'scale(1.25)' : 'scale(1)',
                    }}
                  />
                  <div className="min-w-0">
                    <p className="text-xs font-semibold text-ink truncate leading-tight">
                      {seg.label}
                    </p>
                    {seg.subtext && (
                      <p className="text-[10px] text-ink-subtle truncate">{seg.subtext}</p>
                    )}
                  </div>
                </div>

                <div className="text-right shrink-0">
                  <span className="text-xs font-bold text-ink tabular-nums block leading-tight">
                    {formatValue(seg.value)}
                  </span>
                  <span className="text-[10px] font-semibold text-ink-muted block">
                    {seg.percent}%
                  </span>
                </div>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}
