import { useState, useId } from 'react';
import { formatCurrency } from '../../../utils/formatCurrency';

/**
 * Modern Interactive Slanted / Angled Bar Chart
 * Features diagonal slanted top caps on bars, target vs actual comparison, and interactive tooltips.
 */
export default function SlantedBarChart({
  data = [],
  title = 'Doanh thu các ngày trong tuần',
  subtitle = 'So sánh thực tế và mục tiêu ngày (vát xiên góc 45°)',
  formatValue = (val) => formatCurrency(val),
  className = '',
}) {
  const [hoveredIndex, setHoveredIndex] = useState(null);
  const chartId = useId();

  if (!data || data.length === 0) {
    return (
      <div className={`flex flex-col items-center justify-center p-8 bg-white rounded-2xl border border-line ${className}`}>
        <p className="text-sm text-ink-muted">Chưa có đủ dữ liệu</p>
      </div>
    );
  }

  const width = 560;
  const height = 240;
  const padding = { top: 25, right: 20, bottom: 35, left: 55 };

  const chartW = width - padding.left - padding.right;
  const chartH = height - padding.top - padding.bottom;

  const maxVal = Math.max(
    ...data.map((d) => Math.max(Number(d.value) || 0, Number(d.target) || 0)),
    1000
  );

  const numBars = data.length;
  const colWidth = chartW / numBars;
  const barWidth = Math.min(colWidth * 0.55, 36);
  const slantOffset = 6; // pixels of diagonal slant cut at the top

  const ySteps = 4;
  const gridLines = Array.from({ length: ySteps + 1 }, (_, i) => {
    const val = (maxVal / ySteps) * (ySteps - i);
    const y = padding.top + (chartH / ySteps) * i;
    return { val, y };
  });

  return (
    <div className={`flex flex-col h-full ${className}`}>
      {/* Header */}
      <div className="flex items-center justify-between gap-3 mb-4">
        <div>
          <h3 className="text-base font-bold text-ink">{title}</h3>
          {subtitle && <p className="text-xs text-ink-muted mt-0.5">{subtitle}</p>}
        </div>

        {/* Legend */}
        <div className="flex items-center gap-3 text-xs">
          <span className="flex items-center gap-1.5">
            <span className="size-2.5 rounded-sm bg-primary-500 transform -skew-x-12" />
            <span className="font-medium text-ink-muted">Doanh thu</span>
          </span>
          <span className="flex items-center gap-1.5">
            <span className="size-2.5 rounded-sm bg-secondary-400 opacity-60 transform -skew-x-12" />
            <span className="font-medium text-ink-muted">Mục tiêu</span>
          </span>
        </div>
      </div>

      {/* SVG Canvas */}
      <div className="relative flex-1 w-full min-h-[220px] select-none">
        <svg viewBox={`0 0 ${width} ${height}`} className="w-full h-full overflow-visible">
          <defs>
            <linearGradient id={`${chartId}-bar-grad`} x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#FF6B4A" />
              <stop offset="100%" stopColor="#C93E22" />
            </linearGradient>

            <linearGradient id={`${chartId}-bar-hover`} x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#6C5CE7" />
              <stop offset="100%" stopColor="#4A3BB0" />
            </linearGradient>
          </defs>

          {/* Horizontal Grid */}
          {gridLines.map((line, idx) => (
            <g key={idx}>
              <line
                x1={padding.left}
                y1={line.y}
                x2={padding.left + chartW}
                y2={line.y}
                stroke="#F3F4F6"
                strokeWidth="1"
              />
              <text
                x={padding.left - 8}
                y={line.y + 4}
                textAnchor="end"
                className="text-[10px] fill-gray-400 font-medium tabular-nums"
              >
                {line.val >= 1000000
                  ? `${(line.val / 1000000).toFixed(1).replace('.0', '')}tr`
                  : line.val >= 1000
                  ? `${(line.val / 1000).toFixed(0)}k`
                  : Math.round(line.val)}
              </text>
            </g>
          ))}

          {/* Slanted Bars */}
          {data.map((item, i) => {
            const centerX = padding.left + colWidth * i + colWidth / 2;
            const barX = centerX - barWidth / 2;

            const val = Number(item.value) || 0;
            const target = Number(item.target) || 0;

            const barH = (val / maxVal) * chartH;
            const targetH = (target / maxVal) * chartH;

            const baseY = padding.top + chartH;
            const barTopY = baseY - barH;
            const targetTopY = baseY - targetH;

            const isHovered = hoveredIndex === i;

            // Polygon points for slanted / diagonal top cap
            // Top-left: (barX, barTopY + slantOffset)
            // Top-right: (barX + barWidth, barTopY)
            // Bottom-right: (barX + barWidth, baseY)
            // Bottom-left: (barX, baseY)
            const slantedBarPoints = `
              ${barX},${Math.min(baseY, barTopY + slantOffset)}
              ${barX + barWidth},${barTopY}
              ${barX + barWidth},${baseY}
              ${barX},${baseY}
            `;

            const slantedTargetPoints = `
              ${barX - 2},${Math.min(baseY, targetTopY + slantOffset)}
              ${barX + barWidth + 2},${targetTopY}
              ${barX + barWidth + 2},${baseY}
              ${barX - 2},${baseY}
            `;

            return (
              <g key={i} className="cursor-pointer">
                {/* Target Ghost Bar in Background */}
                <polygon
                  points={slantedTargetPoints}
                  fill="#E6E2FC"
                  opacity={isHovered ? 0.9 : 0.45}
                  className="transition-all duration-200"
                />

                {/* Main Actual Bar with Slanted Top */}
                <polygon
                  points={slantedBarPoints}
                  fill={isHovered ? `url(#${chartId}-bar-hover)` : `url(#${chartId}-bar-grad)`}
                  className="transition-all duration-200"
                  filter={isHovered ? 'drop-shadow(0 4px 6px rgba(108,92,231,0.3))' : 'none'}
                />

                {/* X-axis Label */}
                <text
                  x={centerX}
                  y={baseY + 18}
                  textAnchor="middle"
                  className={`text-[11px] font-semibold transition-colors ${
                    isHovered ? 'fill-primary-700 font-bold' : 'fill-gray-500'
                  }`}
                >
                  {item.label}
                </text>

                {/* Value on top when hovered */}
                {isHovered && (
                  <text
                    x={centerX}
                    y={barTopY - 6}
                    textAnchor="middle"
                    className="text-[11px] font-extrabold fill-ink tabular-nums animate-in fade-in"
                  >
                    {formatValue(val)}
                  </text>
                )}

                {/* Invisible hover hitbox */}
                <rect
                  x={padding.left + colWidth * i}
                  y={padding.top}
                  width={colWidth}
                  height={chartH + 20}
                  fill="transparent"
                  onMouseEnter={() => setHoveredIndex(i)}
                  onMouseLeave={() => setHoveredIndex(null)}
                />
              </g>
            );
          })}
        </svg>
      </div>
    </div>
  );
}

