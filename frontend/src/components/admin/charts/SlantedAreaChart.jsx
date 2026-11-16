import { useState, useId, useRef } from 'react';
import { ArrowUpRight, ArrowDownRight } from 'lucide-react';
import { formatCurrency } from '../../../utils/formatCurrency';

/**
 * Modern Interactive SVG Slanted Area / Line Trend Chart for Admin Dashboard
 * Features smooth diagonal/slanted slopes, gradient fill, interactive crosshair, and floating tooltip.
 */
export default function SlantedAreaChart({
  data = [],
  title = 'Xu hướng doanh thu',
  subtitle = 'Biểu đồ dốc tăng trưởng theo thời gian',
  metricName = 'Doanh thu',
  secondaryMetricName = 'Đơn hàng',
  formatValue = (val) => formatCurrency(val),
  className = '',
}) {
  const [hoveredIndex, setHoveredIndex] = useState(null);
  const containerRef = useRef(null);
  const chartId = useId();

  if (!data || data.length === 0) {
    return (
      <div className={`flex flex-col items-center justify-center p-8 bg-white rounded-2xl border border-line ${className}`}>
        <p className="text-sm text-ink-muted">Chưa có đủ dữ liệu để vẽ biểu đồ xu hướng</p>
      </div>
    );
  }

  // Geometry dimensions
  const width = 640;
  const height = 260;
  const padding = { top: 24, right: 30, bottom: 36, left: 60 };

  const chartW = width - padding.left - padding.right;
  const chartH = height - padding.top - padding.bottom;

  // Compute scale boundaries
  const values = data.map((d) => Number(d.value) || 0);
  const maxValue = Math.max(...values, 1000);
  const minValue = 0;
  const range = maxValue - minValue;

  // Grid steps (4 horizontal guide lines)
  const ySteps = 4;
  const gridLines = Array.from({ length: ySteps + 1 }, (_, i) => {
    const val = minValue + (range / ySteps) * (ySteps - i);
    const y = padding.top + (chartH / ySteps) * i;
    return { val, y };
  });

  // Calculate coordinates for each data point
  const points = data.map((d, i) => {
    const x = padding.left + (chartW / (data.length - 1 || 1)) * i;
    const yRatio = (Number(d.value) - minValue) / range;
    const y = padding.top + chartH - yRatio * chartH;
    return { ...d, x, y, index: i };
  });

  // Generate smooth cubic bezier curve path through points
  const generateSmoothPath = (pts) => {
    if (pts.length < 2) return '';
    let d = `M ${pts[0].x} ${pts[0].y}`;
    for (let i = 0; i < pts.length - 1; i++) {
      const p0 = pts[i];
      const p1 = pts[i + 1];
      const cx1 = p0.x + (p1.x - p0.x) * 0.45;
      const cy1 = p0.y;
      const cx2 = p1.x - (p1.x - p0.x) * 0.45;
      const cy2 = p1.y;
      d += ` C ${cx1} ${cy1}, ${cx2} ${cy2}, ${p1.x} ${p1.y}`;
    }
    return d;
  };

  const linePath = generateSmoothPath(points);
  const lastPoint = points[points.length - 1];
  const firstPoint = points[0];
  const areaPath = `${linePath} L ${lastPoint.x} ${padding.top + chartH} L ${firstPoint.x} ${padding.top + chartH} Z`;

  // Secondary dashed trendline (diagonal average slope)
  const diagonalTrendPath = `M ${firstPoint.x} ${firstPoint.y} L ${lastPoint.x} ${lastPoint.y}`;

  // Current hovered data or latest data
  const currentItem = hoveredIndex !== null ? points[hoveredIndex] : points[points.length - 1];

  // Calculate growth between first and last data points
  const startVal = Number(data[0]?.value) || 0;
  const endVal = Number(data[data.length - 1]?.value) || 0;
  const growthRate = startVal > 0 ? (((endVal - startVal) / startVal) * 100).toFixed(1) : 0;
  const isPositive = Number(growthRate) >= 0;

  return (
    <div className={`flex flex-col h-full ${className}`}>
      {/* Header with Title and Overall Stats */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-5">
        <div>
          <div className="flex items-center gap-2">
            <h3 className="text-base font-bold text-ink">{title}</h3>
            <span
              className={`inline-flex items-center gap-0.5 text-xs font-bold px-2 py-0.5 rounded-full ${
                isPositive
                  ? 'bg-green-100 text-green-700'
                  : 'bg-red-100 text-red-700'
              }`}
            >
              {isPositive ? <ArrowUpRight className="size-3.5" /> : <ArrowDownRight className="size-3.5" />}
              {isPositive ? `+${growthRate}%` : `${growthRate}%`}
            </span>
          </div>
          {subtitle && <p className="text-xs text-ink-muted mt-0.5">{subtitle}</p>}
        </div>

        {/* Highlighted Value Card */}
        <div className="text-left sm:text-right bg-primary-50/70 border border-primary-100 rounded-xl px-3.5 py-1.5 self-start sm:self-auto">
          <span className="text-[11px] font-semibold text-primary-700 block uppercase tracking-wider">
            {currentItem.label ? `Thời điểm: ${currentItem.label}` : 'Gần nhất'}
          </span>
          <span className="text-lg font-extrabold text-ink tabular-nums">
            {formatValue(currentItem.value)}
          </span>
          {currentItem.secondaryValue !== undefined && (
            <span className="text-[11px] font-medium text-ink-muted ml-2">
              ({currentItem.secondaryValue} {secondaryMetricName})
            </span>
          )}
        </div>
      </div>

      {/* SVG Chart Canvas */}
      <div
        ref={containerRef}
        className="relative flex-1 w-full min-h-[240px] select-none"
      >
        <svg
          viewBox={`0 0 ${width} ${height}`}
          className="w-full h-full overflow-visible"
        >
          <defs>
            {/* Primary Gradient Fill */}
            <linearGradient id={`${chartId}-area-grad`} x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#FF6B4A" stopOpacity="0.32" />
              <stop offset="50%" stopColor="#6C5CE7" stopOpacity="0.12" />
              <stop offset="100%" stopColor="#FFFFFF" stopOpacity="0.0" />
            </linearGradient>

            {/* Line Stroke Gradient */}
            <linearGradient id={`${chartId}-line-grad`} x1="0" y1="0" x2="1" y2="0">
              <stop offset="0%" stopColor="#6C5CE7" />
              <stop offset="50%" stopColor="#FF6B4A" />
              <stop offset="100%" stopColor="#E04B2D" />
            </linearGradient>

            {/* Diagonal Hatch Pattern for Slanted Background Guides */}
            <pattern
              id={`${chartId}-diagonal-hatch`}
              width="20"
              height="20"
              patternTransform="rotate(45 0 0)"
              patternUnits="userSpaceOnUse"
            >
              <line x1="0" y1="0" x2="0" y2="20" stroke="#F3F4F6" strokeWidth="1" />
            </pattern>
          </defs>

          {/* Slanted subtle diagonal background fill */}
          <rect
            x={padding.left}
            y={padding.top}
            width={chartW}
            height={chartH}
            fill={`url(#${chartId}-diagonal-hatch)`}
            opacity="0.6"
          />

          {/* Horizontal Grid Lines & Y-axis Labels */}
          {gridLines.map((line, idx) => (
            <g key={idx}>
              <line
                x1={padding.left}
                y1={line.y}
                x2={padding.left + chartW}
                y2={line.y}
                stroke="#E5E7EB"
                strokeDasharray="4 4"
                strokeWidth="1"
              />
              <text
                x={padding.left - 10}
                y={line.y + 4}
                textAnchor="end"
                className="text-[10px] fill-gray-400 font-medium select-none tabular-nums"
              >
                {line.val >= 1000000
                  ? `${(line.val / 1000000).toFixed(1).replace('.0', '')}tr`
                  : line.val >= 1000
                  ? `${(line.val / 1000).toFixed(0)}k`
                  : Math.round(line.val)}
              </text>
            </g>
          ))}

          {/* Slanted Diagonal Reference Line (Đường dốc chuẩn) */}
          <path
            d={diagonalTrendPath}
            fill="none"
            stroke="#6C5CE7"
            strokeWidth="1.5"
            strokeDasharray="5 5"
            opacity="0.35"
          />

          {/* Filled Area with Gradient */}
          <path
            d={areaPath}
            fill={`url(#${chartId}-area-grad)`}
            className="transition-all duration-300"
          />

          {/* Main Slanted Curve Line */}
          <path
            d={linePath}
            fill="none"
            stroke={`url(#${chartId}-line-grad)`}
            strokeWidth="3.5"
            strokeLinecap="round"
            strokeLinejoin="round"
            className="filter drop-shadow-xs"
          />

          {/* Interactive Hover Guides & Data Dots */}
          {points.map((pt, i) => {
            const isHovered = hoveredIndex === i;

            return (
              <g key={i}>
                {/* Vertical hover crosshair indicator */}
                {isHovered && (
                  <line
                    x1={pt.x}
                    y1={padding.top}
                    x2={pt.x}
                    y2={padding.top + chartH}
                    stroke="#FF6B4A"
                    strokeWidth="1.5"
                    strokeDasharray="3 3"
                    className="animate-in fade-in duration-150"
                  />
                )}

                {/* Data Dot Circle */}
                <circle
                  cx={pt.x}
                  cy={pt.y}
                  r={isHovered ? 6 : 4}
                  fill="#FFFFFF"
                  stroke={isHovered ? '#C93E22' : '#FF6B4A'}
                  strokeWidth={isHovered ? 3 : 2}
                  className="transition-all duration-200 cursor-pointer"
                />

                {/* X-axis Label below */}
                <text
                  x={pt.x}
                  y={padding.top + chartH + 20}
                  textAnchor="middle"
                  className={`text-[11px] font-semibold select-none transition-colors ${
                    isHovered ? 'fill-primary-700 font-bold' : 'fill-gray-500'
                  }`}
                >
                  {pt.label}
                </text>

                {/* Invisible broad hitbox for effortless mouse hover */}
                <rect
                  x={pt.x - chartW / (points.length * 2)}
                  y={padding.top}
                  width={chartW / points.length}
                  height={chartH + 25}
                  fill="transparent"
                  className="cursor-pointer"
                  onMouseEnter={() => setHoveredIndex(i)}
                  onMouseLeave={() => setHoveredIndex(null)}
                />
              </g>
            );
          })}
        </svg>

        {/* Legend / Guidance Note */}
        <div className="flex flex-wrap items-center justify-between text-xs text-ink-muted pt-2 border-t border-line mt-1">
          <div className="flex items-center gap-4">
            <span className="flex items-center gap-1.5">
              <span className="size-2.5 rounded-full bg-primary-500" />
              <span>{metricName} thực tế</span>
            </span>
            <span className="flex items-center gap-1.5">
              <span className="w-4 h-0.5 border-t-2 border-dashed border-secondary-500" />
              <span>Đường dốc xu hướng xiên (Trendline)</span>
            </span>
          </div>

          <span className="hidden sm:inline-block text-[11px] text-ink-subtle">
            💡 Rê chuột vào từng điểm để xem số liệu chi tiết
          </span>
        </div>
      </div>
    </div>
  );
}
