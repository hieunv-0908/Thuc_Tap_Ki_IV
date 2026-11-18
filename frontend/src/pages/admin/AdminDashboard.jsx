import { useState, useEffect, useMemo, useCallback } from 'react';
import { Link } from 'react-router-dom';
import {
  TrendingUp,
  ShoppingBag,
  Users,
  Shirt,
  RefreshCw,
  Calendar,
  ArrowRight,
  Sparkles,
  Layers,
  ClipboardList,
} from 'lucide-react';
import StatCard from '../../components/admin/StatCard';
import DonutChart from '../../components/admin/charts/DonutChart';
import SlantedAreaChart from '../../components/admin/charts/SlantedAreaChart';
import SlantedBarChart from '../../components/admin/charts/SlantedBarChart';
import { OrderBadge } from '../../components/ui/Badge';
import Button from '../../components/ui/Button';
import { adminApi } from '../../api/admin';
import { categoryApi } from '../../api/category';
import { formatCurrency } from '../../utils/formatCurrency';
import { formatDate } from '../../utils/formatDate';
import { toast } from '../../store/toastStore';
import { ORDER_STATUS } from '../../utils/constants';

// Time filter options
const TIME_RANGES = [
  { id: '7_days', label: '7 ngày qua' },
  { id: '30_days', label: '30 ngày qua' },
  { id: 'this_month', label: 'Tháng này' },
  { id: 'this_year', label: 'Năm nay' },
];

/**
 * Safely parse date from string or Jackson array representation
 */
function parseOrderDate(dateVal) {
  if (!dateVal) return null;
  if (Array.isArray(dateVal)) {
    return new Date(dateVal[0], (dateVal[1] || 1) - 1, dateVal[2] || 1, dateVal[3] || 0, dateVal[4] || 0);
  }
  const d = new Date(dateVal);
  return isNaN(d.getTime()) ? null : d;
}

export default function AdminDashboard() {
  const [timeRange, setTimeRange] = useState('7_days');
  const [metricMode, setMetricMode] = useState('revenue'); // 'revenue' | 'orders'
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  // Raw API datasets
  const [orders, setOrders] = useState([]);
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [users, setUsers] = useState([]);

  // Fetch all management data in parallel
  const loadData = useCallback(async () => {
    try {
      const [ordersRes, productsRes, categoriesRes, usersRes] = await Promise.allSettled([
        adminApi.getAllOrders({ page: 0, size: 100 }),
        adminApi.getProducts({ page: 0, size: 100 }),
        categoryApi.getCategories(),
        adminApi.getUsers(),
      ]);

      if (ordersRes.status === 'fulfilled') {
        const list = Array.isArray(ordersRes.value)
          ? ordersRes.value
          : ordersRes.value?.content || [];
        setOrders(list);
      }

      if (productsRes.status === 'fulfilled') {
        const prodList = productsRes.value?.content || (Array.isArray(productsRes.value) ? productsRes.value : []);
        setProducts(prodList);
      }

      if (categoriesRes.status === 'fulfilled') {
        setCategories(categoriesRes.value || []);
      }

      if (usersRes.status === 'fulfilled') {
        setUsers(usersRes.value || []);
      }
    } catch (err) {
      console.error('Lỗi tải dữ liệu dashboard:', err);
    }
  }, []);

  useEffect(() => {
    let ignore = false;
    async function init() {
      await loadData();
      if (!ignore) {
        setLoading(false);
      }
    }
    init();
    return () => {
      ignore = true;
    };
  }, [loadData]);

  const handleRefresh = async () => {
    setRefreshing(true);
    await loadData();
    setRefreshing(false);
    toast.success('Đã cập nhật số liệu mới nhất!');
  };

  // ── Metrics Calculation (100% Real Data) ──────────────────────────────────
  const metrics = useMemo(() => {
    // 1. Total revenue (completed/shipping/processing orders, excludes cancelled)
    const validOrders = orders.filter((o) => o.status !== ORDER_STATUS.CANCELLED);
    const totalRevenue = validOrders.reduce(
      (sum, o) => sum + (Number(o.totalPrice || o.totalAmount) || 0),
      0
    );

    // 2. Successful completed orders count
    const completedOrders = orders.filter((o) => o.status === ORDER_STATUS.COMPLETED);
    const completionRate = orders.length > 0
      ? Math.round((completedOrders.length / orders.length) * 100)
      : 0;

    // 3. Low stock and out of stock products
    const lowStockCount = products.filter(
      (p) => (Number(p.stockQuantity ?? p.stock) || 0) <= 5 && (Number(p.stockQuantity ?? p.stock) || 0) > 0
    ).length;
    const outOfStockCount = products.filter(
      (p) => (Number(p.stockQuantity ?? p.stock) || 0) <= 0
    ).length;

    return {
      totalRevenue,
      totalOrders: orders.length,
      completedOrdersCount: completedOrders.length,
      completionRate,
      totalUsers: users.length,
      totalProducts: products.length,
      lowStockCount,
      outOfStockCount,
    };
  }, [orders, products, users]);

  // ── 1. Time-Series Slanted Area Trend Data (Real Data from Orders) ──────────
  const trendData = useMemo(() => {
    const validOrders = orders.filter((o) => o.status !== ORDER_STATUS.CANCELLED);
    const now = new Date();

    if (timeRange === '7_days') {
      const dayLabels = ['CN', 'T2', 'T3', 'T4', 'T5', 'T6', 'T7'];
      const points = [];
      for (let i = 6; i >= 0; i--) {
        const d = new Date(now);
        d.setDate(now.getDate() - i);
        d.setHours(0, 0, 0, 0);

        const nextD = new Date(d);
        nextD.setDate(d.getDate() + 1);

        const dayOrders = validOrders.filter((o) => {
          const dt = parseOrderDate(o.createdAt);
          return dt && dt >= d && dt < nextD;
        });

        const rev = dayOrders.reduce(
          (sum, o) => sum + (Number(o.totalPrice || o.totalAmount) || 0),
          0
        );
        const count = dayOrders.length;
        const dateStr = `${String(d.getDate()).padStart(2, '0')}/${String(d.getMonth() + 1).padStart(2, '0')}`;
        const label = `${dayLabels[d.getDay()]} (${dateStr})`;

        points.push({
          label,
          value: metricMode === 'revenue' ? rev : count,
          secondaryValue: metricMode === 'revenue' ? count : rev,
        });
      }
      return points;
    }

    if (timeRange === '30_days') {
      const points = [];
      const blocks = [
        { label: 'Tuần 1', daysAgoStart: 30, daysAgoEnd: 22 },
        { label: 'Tuần 2', daysAgoStart: 22, daysAgoEnd: 15 },
        { label: 'Tuần 3', daysAgoStart: 15, daysAgoEnd: 8 },
        { label: 'Tuần 4', daysAgoStart: 8, daysAgoEnd: 0 },
      ];

      blocks.forEach(({ label, daysAgoStart, daysAgoEnd }) => {
        const startD = new Date(now);
        startD.setDate(now.getDate() - daysAgoStart);
        startD.setHours(0, 0, 0, 0);

        const endD = new Date(now);
        endD.setDate(now.getDate() - daysAgoEnd);
        endD.setHours(23, 59, 59, 999);

        const blockOrders = validOrders.filter((o) => {
          const dt = parseOrderDate(o.createdAt);
          return dt && dt >= startD && dt <= endD;
        });

        const rev = blockOrders.reduce(
          (sum, o) => sum + (Number(o.totalPrice || o.totalAmount) || 0),
          0
        );
        const count = blockOrders.length;

        points.push({
          label,
          value: metricMode === 'revenue' ? rev : count,
          secondaryValue: metricMode === 'revenue' ? count : rev,
        });
      });

      return points;
    }

    if (timeRange === 'this_month') {
      const currentYear = now.getFullYear();
      const currentMonth = now.getMonth();
      const lastDayOfMonth = new Date(currentYear, currentMonth + 1, 0).getDate();

      const intervals = [
        { start: 1, end: 5, label: '01–05' },
        { start: 6, end: 10, label: '06–10' },
        { start: 11, end: 15, label: '11–15' },
        { start: 16, end: 20, label: '16–20' },
        { start: 21, end: 25, label: '21–25' },
        { start: 26, end: lastDayOfMonth, label: `26–${lastDayOfMonth}` },
      ];

      return intervals.map(({ start, end, label }) => {
        const startD = new Date(currentYear, currentMonth, start, 0, 0, 0, 0);
        const endD = new Date(currentYear, currentMonth, end, 23, 59, 59, 999);

        const intOrders = validOrders.filter((o) => {
          const dt = parseOrderDate(o.createdAt);
          return dt && dt >= startD && dt <= endD;
        });

        const rev = intOrders.reduce(
          (sum, o) => sum + (Number(o.totalPrice || o.totalAmount) || 0),
          0
        );
        const count = intOrders.length;

        return {
          label,
          value: metricMode === 'revenue' ? rev : count,
          secondaryValue: metricMode === 'revenue' ? count : rev,
        };
      });
    }

    // this_year (12 months of current year)
    const currentYear = now.getFullYear();
    const points = [];
    for (let m = 0; m < 12; m++) {
      const startD = new Date(currentYear, m, 1, 0, 0, 0, 0);
      const endD = new Date(currentYear, m + 1, 0, 23, 59, 59, 999);

      const monthOrders = validOrders.filter((o) => {
        const dt = parseOrderDate(o.createdAt);
        return dt && dt >= startD && dt <= endD;
      });

      const rev = monthOrders.reduce(
        (sum, o) => sum + (Number(o.totalPrice || o.totalAmount) || 0),
        0
      );
      const count = monthOrders.length;

      points.push({
        label: `T${m + 1}`,
        value: metricMode === 'revenue' ? rev : count,
        secondaryValue: metricMode === 'revenue' ? count : rev,
      });
    }
    return points;
  }, [orders, timeRange, metricMode]);

  // ── 2. Category Revenue Breakdown (Real Data from Order Items & Catalog) ────
  const categoryChartData = useMemo(() => {
    const validOrders = orders.filter((o) => o.status !== ORDER_STATUS.CANCELLED);
    const colors = ['#FF6B4A', '#6C5CE7', '#10B981', '#3B82F6', '#F59E0B', '#8F80EE', '#EC4899', '#14B8A6'];

    // Map each product to its category
    const productCatMap = new Map();
    products.forEach((p) => {
      const catId = p.category?.id || p.categoryId;
      const catName = p.category?.name || p.categoryName || '';
      if (p.id) {
        productCatMap.set(String(p.id), { catId: catId ? String(catId) : null, catName });
      }
    });

    // Accumulate real revenue and sold quantity per category
    const catRevenueMap = new Map();
    const catQuantityMap = new Map();

    categories.forEach((cat) => {
      catRevenueMap.set(String(cat.id), 0);
      catQuantityMap.set(String(cat.id), 0);
    });

    let uncategorizedRevenue = 0;
    let uncategorizedQuantity = 0;

    validOrders.forEach((order) => {
      const items = order.items || [];
      items.forEach((item) => {
        const pId = item.productId ? String(item.productId) : null;
        const itemPrice = Number(item.price || item.priceAtOrder) || 0;
        const itemQty = Number(item.quantity) || 1;
        const itemTotal = itemPrice * itemQty;

        let matchedCatId = null;

        if (pId && productCatMap.has(pId)) {
          matchedCatId = productCatMap.get(pId).catId;
        }

        // Fallback: match by category name in item text
        if (!matchedCatId) {
          const itemText = (item.productName || item.name || '').toLowerCase();
          const found = categories.find((c) =>
            itemText.includes((c.name || '').toLowerCase())
          );
          if (found) matchedCatId = String(found.id);
        }

        if (matchedCatId && catRevenueMap.has(matchedCatId)) {
          catRevenueMap.set(matchedCatId, catRevenueMap.get(matchedCatId) + itemTotal);
          catQuantityMap.set(matchedCatId, catQuantityMap.get(matchedCatId) + itemQty);
        } else {
          uncategorizedRevenue += itemTotal;
          uncategorizedQuantity += itemQty;
        }
      });
    });

    const result = categories.map((cat, idx) => {
      const catIdStr = String(cat.id);
      const rev = catRevenueMap.get(catIdStr) || 0;
      const soldQty = catQuantityMap.get(catIdStr) || 0;
      const prodsInCat = products.filter(
        (p) => String(p.category?.id || p.categoryId) === catIdStr
      );

      return {
        label: cat.name,
        value: rev,
        count: soldQty,
        color: colors[idx % colors.length],
        subtext: soldQty > 0
          ? `Đã bán ${soldQty} sp (${prodsInCat.length} mẫu mã)`
          : `${prodsInCat.length} mẫu mã trong kho`,
      };
    });

    if (uncategorizedRevenue > 0) {
      result.push({
        label: 'Khác',
        value: uncategorizedRevenue,
        count: uncategorizedQuantity,
        color: '#9CA3AF',
        subtext: `Đã bán ${uncategorizedQuantity} sp`,
      });
    }

    // Sort by revenue descending
    result.sort((a, b) => b.value - a.value);

    return result;
  }, [orders, categories, products]);

  // ── Order Status Breakdown (Real Data from Orders) ─────────────────────────
  const orderStatusChartData = useMemo(() => {
    const counts = {
      [ORDER_STATUS.COMPLETED]: 0,
      [ORDER_STATUS.SHIPPING]: 0,
      [ORDER_STATUS.CONFIRMED]: 0,
      [ORDER_STATUS.PENDING]: 0,
      [ORDER_STATUS.CANCELLED]: 0,
    };

    orders.forEach((o) => {
      const s = o.status || ORDER_STATUS.PENDING;
      if (counts[s] !== undefined) counts[s] += 1;
      else counts[ORDER_STATUS.PENDING] += 1;
    });

    return [
      { label: 'Hoàn thành', value: counts[ORDER_STATUS.COMPLETED], color: '#10B981', subtext: 'Đã giao & thu tiền' },
      { label: 'Đang giao', value: counts[ORDER_STATUS.SHIPPING], color: '#6C5CE7', subtext: 'Shipper đang giao hàng' },
      { label: 'Đang chuẩn bị', value: counts[ORDER_STATUS.CONFIRMED], color: '#3B82F6', subtext: 'Đang đóng gói hàng' },
      { label: 'Chờ xác nhận', value: counts[ORDER_STATUS.PENDING], color: '#F59E0B', subtext: 'Đơn mới đặt' },
      { label: 'Đã hủy', value: counts[ORDER_STATUS.CANCELLED], color: '#EF4444', subtext: 'Khách hoặc admin hủy' },
    ];
  }, [orders]);

  // ── 3. Day-of-Week Slanted Bar Chart Data (Real Sales by Day of Week) ───────
  const weekdayData = useMemo(() => {
    const validOrders = orders.filter((o) => o.status !== ORDER_STATUS.CANCELLED);

    const weekdays = [
      { day: 1, label: 'T2' },
      { day: 2, label: 'T3' },
      { day: 3, label: 'T4' },
      { day: 4, label: 'T5' },
      { day: 5, label: 'T6' },
      { day: 6, label: 'T7' },
      { day: 0, label: 'CN' },
    ];

    // Compute revenue for each day of the week from actual valid orders
    const dayRevenues = weekdays.map(({ day, label }) => {
      const dayOrders = validOrders.filter((o) => {
        const dt = parseOrderDate(o.createdAt);
        return dt && dt.getDay() === day;
      });

      const value = dayOrders.reduce(
        (sum, o) => sum + (Number(o.totalPrice || o.totalAmount) || 0),
        0
      );

      return {
        label,
        value,
        ordersCount: dayOrders.length,
      };
    });

    const totalRev = dayRevenues.reduce((sum, d) => sum + d.value, 0);
    // Target is benchmarked to daily average sales
    const target = totalRev > 0 ? Math.round(totalRev / 7) : 0;

    return dayRevenues.map((d) => ({
      label: d.label,
      value: d.value,
      target,
    }));
  }, [orders]);

  // ── Top 5 Best Selling Products (Real Data from Orders & Catalog) ───────────
  const topProducts = useMemo(() => {
    const validOrders = orders.filter((o) => o.status !== ORDER_STATUS.CANCELLED);
    const soldMap = {};

    validOrders.forEach((o) => {
      (o.items || []).forEach((item) => {
        const pId = item.productId;
        if (pId) {
          soldMap[pId] = (soldMap[pId] || 0) + (Number(item.quantity) || 1);
        }
      });
    });

    const list = products
      .map((p) => ({
        ...p,
        soldCount: soldMap[p.id] !== undefined ? soldMap[p.id] : (Number(p.soldCount) || 0),
        categoryName: p.category?.name || p.categoryName || 'Thời trang',
      }))
      .sort((a, b) => b.soldCount - a.soldCount);

    return list.slice(0, 5);
  }, [products, orders]);

  // ── Recent Orders ─────────────────────────────────────────────────────────
  const recentOrders = useMemo(() => {
    return orders.slice(0, 6);
  }, [orders]);

  return (
    <div className="space-y-8 animate-in fade-in duration-200">
      {/* ── Top Header Toolbar ────────────────────────────────────────────── */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-line">
        <div>
          <div className="flex items-center gap-2.5">
            <h1 className="text-2xl md:text-3xl font-extrabold text-ink tracking-tight">
              Tổng quan kinh doanh
            </h1>
            <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-100 text-emerald-800 border border-emerald-200">
              <span className="size-2 rounded-full bg-emerald-500 animate-pulse" />
              Thời gian thực
            </span>
          </div>
          <p className="text-sm text-ink-muted mt-1">
            Báo cáo tổng hợp số liệu doanh thu, đơn hàng, danh mục thời trang và tình trạng kho
          </p>
        </div>

        {/* Filter & Actions */}
        <div className="flex flex-wrap items-center gap-2.5">
          {/* Time Range Pills */}
          <div className="inline-flex p-1 bg-gray-100 rounded-xl border border-line">
            {TIME_RANGES.map((r) => {
              const isSelected = timeRange === r.id;
              return (
                <button
                  key={r.id}
                  type="button"
                  onClick={() => setTimeRange(r.id)}
                  className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-all cursor-pointer ${isSelected
                      ? 'bg-white text-ink shadow-xs font-bold'
                      : 'text-ink-muted hover:text-ink hover:bg-white/60'
                    }`}
                >
                  {r.label}
                </button>
              );
            })}
          </div>

          {/* Refresh Button */}
          <Button
            variant="outline"
            size="sm"
            onClick={handleRefresh}
            disabled={refreshing || loading}
            leftIcon={RefreshCw}
            className={`font-semibold ${refreshing ? 'animate-spin' : ''}`}
          >
            {refreshing ? 'Đang tải...' : 'Làm mới'}
          </Button>
        </div>
      </div>

      {/* ── Row 1: KPI StatCards ──────────────────────────────────────────── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-5">
        <StatCard
          icon={TrendingUp}
          label="Tổng doanh thu"
          value={formatCurrency(metrics.totalRevenue)}
          subtext={metrics.totalOrders > 0 ? `${metrics.totalOrders} đơn hàng ghi nhận` : 'Chưa có đơn hàng'}
          variant="primary"
        />

        <StatCard
          icon={ShoppingBag}
          label="Đơn hàng thành công"
          value={`${metrics.completedOrdersCount} / ${metrics.totalOrders} đơn`}
          subtext={metrics.totalOrders > 0 ? `Tỷ lệ hoàn thành: ${metrics.completionRate}%` : 'Chưa có đơn hàng'}
          variant="success"
        />

        <StatCard
          icon={Users}
          label="Khách hàng thành viên"
          value={metrics.totalUsers}
          subtext="Tài khoản khách hàng đăng ký"
          variant="secondary"
        />

        <StatCard
          icon={Shirt}
          label="Mẫu mã trang phục"
          value={`${metrics.totalProducts} mẫu`}
          subtext={
            metrics.lowStockCount > 0
              ? `⚠️ ${metrics.lowStockCount} mẫu sắp hết hàng (≤ 5)`
              : 'Tồn kho đầy đủ'
          }
          variant={metrics.lowStockCount > 0 ? 'warning' : 'primary'}
        />
      </div>

      {/* ── Row 2: Slanted Area Chart & Category Donut Chart ──────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Slanted Area Trend Chart (7 cols) */}
        <div className="lg:col-span-7 bg-white rounded-2xl p-5 sm:p-6 border border-line shadow-soft flex flex-col justify-between">
          <div className="flex items-center justify-between mb-2">
            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-primary-100 text-primary-700">
              <Sparkles className="size-3.5" />
              Đường dốc tăng trưởng
            </span>

            {/* Metric Mode Toggle */}
            <div className="inline-flex p-1 bg-gray-100 rounded-lg text-xs font-semibold">
              <button
                type="button"
                onClick={() => setMetricMode('revenue')}
                className={`px-2.5 py-1 rounded-md transition-colors cursor-pointer ${metricMode === 'revenue' ? 'bg-white text-ink shadow-2xs font-bold' : 'text-ink-muted'
                  }`}
              >
                Doanh thu (₫)
              </button>
              <button
                type="button"
                onClick={() => setMetricMode('orders')}
                className={`px-2.5 py-1 rounded-md transition-colors cursor-pointer ${metricMode === 'orders' ? 'bg-white text-ink shadow-2xs font-bold' : 'text-ink-muted'
                  }`}
              >
                Số đơn hàng
              </button>
            </div>
          </div>

          <SlantedAreaChart
            data={trendData}
            title={metricMode === 'revenue' ? 'Biểu đồ dốc xu hướng doanh thu' : 'Biểu đồ dốc xu hướng số lượng đơn'}
            subtitle={`Số liệu theo ${TIME_RANGES.find((r) => r.id === timeRange)?.label.toLowerCase()} với đường dốc xu hướng xiên`}
            metricName={metricMode === 'revenue' ? 'Doanh thu' : 'Số đơn'}
            secondaryMetricName={metricMode === 'revenue' ? 'đơn' : '₫'}
            formatValue={metricMode === 'revenue' ? formatCurrency : (val) => `${val} đơn`}
          />
        </div>

        {/* Category Revenue Donut Chart (5 cols) */}
        <div className="lg:col-span-5 bg-white rounded-2xl p-5 sm:p-6 border border-line shadow-soft flex flex-col justify-between overflow-hidden">
          <div className="flex items-start justify-between gap-3 mb-4">
            <div>
              <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-secondary-100 text-secondary-700 mb-1.5">
                <Layers className="size-3.5" />
                Cơ cấu trang phục
              </span>
              <h3 className="text-base font-bold text-ink">Cơ cấu doanh thu danh mục</h3>
              <p className="text-xs text-ink-muted mt-0.5">Tỷ lệ đóng góp theo từng dòng trang phục</p>
            </div>
            <Link
              to="/admin/categories"
              className="text-xs font-semibold text-secondary-600 hover:text-secondary-700 inline-flex items-center gap-1 shrink-0 pt-0.5"
            >
              Xem danh mục <ArrowRight className="size-3" />
            </Link>
          </div>

          <DonutChart
            data={categoryChartData}
            totalLabel="Doanh thu"
            formatValue={formatCurrency}
            showHeader={false}
          />
        </div>
      </div>

      {/* ── Row 3: Slanted Bar Chart & Order Status Donut Chart ───────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Slanted Bar Chart: Doanh số theo ngày trong tuần (6 cols) */}
        <div className="lg:col-span-6 bg-white rounded-2xl p-5 sm:p-6 border border-line shadow-soft flex flex-col justify-between">
          <div className="flex items-center justify-between mb-2">
            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-primary-100 text-primary-700">
              <Calendar className="size-3.5" />
              Cột đỉnh vát xiên 45°
            </span>
            <span className="text-xs font-medium text-ink-subtle">Chu kỳ 7 ngày</span>
          </div>

          <SlantedBarChart
            data={weekdayData}
            title="Doanh số các ngày trong tuần"
            subtitle="Doanh thu thực tế theo các ngày trong tuần so với mức bình quân ngày"
            formatValue={formatCurrency}
          />
        </div>

        {/* Order Status Donut Chart (6 cols) */}
        <div className="lg:col-span-6 bg-white rounded-2xl p-5 sm:p-6 border border-line shadow-soft flex flex-col justify-between overflow-hidden">
          <div className="flex items-start justify-between gap-3 mb-4">
            <div>
              <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-100 text-emerald-800 mb-1.5">
                <ClipboardList className="size-3.5" />
                Trạng thái xử lý
              </span>
              <h3 className="text-base font-bold text-ink">Tỷ lệ trạng thái đơn hàng</h3>
              <p className="text-xs text-ink-muted mt-0.5">Phân bố đơn hàng theo các khâu xử lý và vận chuyển</p>
            </div>
            <Link
              to="/admin/orders"
              className="text-xs font-semibold text-primary-700 hover:underline inline-flex items-center gap-1 shrink-0 pt-0.5"
            >
              Quản lý đơn hàng <ArrowRight className="size-3" />
            </Link>
          </div>

          <DonutChart
            data={orderStatusChartData}
            totalLabel="Tổng đơn"
            formatValue={(val) => `${val} đơn`}
            showHeader={false}
          />
        </div>
      </div>

      {/* ── Row 4: Recent Orders & Top Selling Products ──────────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Recent Orders Table (7 cols) */}
        <div className="lg:col-span-7 bg-white rounded-2xl p-5 sm:p-6 border border-line shadow-soft flex flex-col justify-between">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-base font-bold text-ink">Đơn hàng mới nhất</h3>
              <p className="text-xs text-ink-muted mt-0.5">Các đơn hàng phát sinh gần đây cần theo dõi</p>
            </div>
            <Link
              to="/admin/orders"
              className="text-xs font-semibold text-primary-700 hover:text-primary-800 inline-flex items-center gap-1"
            >
              Xem tất cả ({orders.length}) <ArrowRight className="size-3.5" />
            </Link>
          </div>

          {recentOrders.length === 0 ? (
            <div className="py-12 text-center text-ink-muted text-sm border border-dashed border-line rounded-xl">
              Chưa có đơn hàng nào được ghi nhận.
            </div>
          ) : (
            <div className="overflow-x-auto rounded-xl border border-line">
              <table className="w-full text-left text-sm">
                <thead className="bg-gray-50 text-xs font-semibold uppercase text-ink-muted border-b border-line">
                  <tr>
                    <th className="px-3.5 py-3">Mã đơn</th>
                    <th className="px-3.5 py-3">Khách hàng</th>
                    <th className="px-3.5 py-3">Thời gian</th>
                    <th className="px-3.5 py-3">Tổng tiền</th>
                    <th className="px-3.5 py-3">Trạng thái</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-line">
                  {recentOrders.map((o) => (
                    <tr key={o.id} className="hover:bg-primary-50/50 transition-colors">
                      <td className="px-3.5 py-2.5 font-bold text-ink whitespace-nowrap">
                        <Link
                          to="/admin/orders"
                          className="hover:text-primary-700 hover:underline"
                        >
                          #{o.id}
                        </Link>
                      </td>
                      <td className="px-3.5 py-2.5 whitespace-nowrap">
                        <p className="font-semibold text-ink leading-tight">
                          {o.receiverName || o.customerName || o.user?.fullName || 'Khách vãng lai'}
                        </p>
                        <p className="text-xs text-ink-subtle">
                          {o.receiverPhone || o.phone || '—'}
                        </p>
                      </td>
                      <td className="px-3.5 py-2.5 text-xs text-ink-muted whitespace-nowrap">
                        {o.createdAt ? formatDate(o.createdAt) : 'Gần đây'}
                      </td>
                      <td className="px-3.5 py-2.5 font-bold text-primary-700 tabular-nums whitespace-nowrap">
                        {formatCurrency(o.totalPrice || o.totalAmount || 0)}
                      </td>
                      <td className="px-3.5 py-2.5 whitespace-nowrap">
                        <OrderBadge status={o.status || ORDER_STATUS.PENDING} />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Top 5 Best Selling Fashion Items (5 cols) */}
        <div className="lg:col-span-5 bg-white rounded-2xl p-5 sm:p-6 border border-line shadow-soft flex flex-col justify-between">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-base font-bold text-ink">Top trang phục bán chạy</h3>
              <p className="text-xs text-ink-muted mt-0.5">Sản phẩm có lượng quan tâm & mua nhiều nhất</p>
            </div>
            <Link
              to="/admin/products"
              className="text-xs font-semibold text-primary-700 hover:text-primary-800 inline-flex items-center gap-1"
            >
              Kho hàng <ArrowRight className="size-3.5" />
            </Link>
          </div>

          <div className="space-y-3.5 flex-1">
            {topProducts.length === 0 ? (
              <div className="py-12 text-center text-ink-muted text-sm border border-dashed border-line rounded-xl">
                Chưa có dữ liệu sản phẩm.
              </div>
            ) : (
              topProducts.map((p, idx) => {
                const maxSold = topProducts[0]?.soldCount || 1;
                const percent = maxSold > 0 ? Math.min(100, Math.round(((p.soldCount || 0) / maxSold) * 100)) : 0;

                return (
                  <div
                    key={p.id || idx}
                    className="flex items-center gap-3 p-2 rounded-xl hover:bg-gray-50 transition-colors"
                  >
                    <span className="size-6 rounded-full bg-primary-100 text-primary-800 text-xs font-extrabold flex items-center justify-center shrink-0">
                      {idx + 1}
                    </span>

                    <img
                      src={p.imageUrl || p.images?.[0]?.imageUrl || 'https://images.unsplash.com/photo-1521572267360-ee0c2909d518?q=80&w=200&auto=format&fit=crop'}
                      alt={p.name}
                      className="size-11 rounded-lg object-cover object-top border border-line shrink-0"
                    />

                    <div className="min-w-0 flex-1">
                      <h4 className="text-xs sm:text-sm font-semibold text-ink truncate leading-tight">
                        {p.name}
                      </h4>
                      <div className="flex items-center justify-between text-xs text-ink-muted mt-1">
                        <span className="font-bold text-primary-700 tabular-nums">
                          {formatCurrency(p.price)}
                        </span>
                        <span className="font-medium tabular-nums">
                          Đã bán: <strong className="text-ink">{p.soldCount || 0}</strong>
                        </span>
                      </div>

                      {/* Progress Bar */}
                      <div className="w-full h-1.5 bg-gray-100 rounded-full mt-1.5 overflow-hidden">
                        <div
                          className="h-full rounded-full bg-gradient-to-r from-primary-500 to-secondary-500 transition-all duration-500"
                          style={{ width: `${percent}%` }}
                        />
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
