import { useState, useEffect, useCallback, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { ClipboardList, ArrowRight, Calendar, Package } from 'lucide-react';
import { orderApi } from '../api/order';
import { useAuthStore } from '../store/authStore';
import { formatCurrency } from '../utils/formatCurrency';
import { formatDate } from '../utils/formatDate';
import { ORDER_STATUS, ORDER_STATUS_LABELS } from '../utils/constants';
import { OrderBadge } from '../components/ui/Badge';
import Table from '../components/ui/Table';
import EmptyState from '../components/ui/EmptyState';
import ErrorState from '../components/ui/ErrorState';
import Button from '../components/ui/Button';

/**
 * Orders history page complying with Design.md 7.6 (v2.0)
 * Status filter chips with counts, thumbnail strip in rows/cards
 */
export default function Orders() {
  const navigate = useNavigate();
  const { isAuthenticated } = useAuthStore();

  const [orders, setOrders] = useState([]);
  const [selectedStatus, setSelectedStatus] = useState('ALL');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchOrders = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await orderApi.getMyOrders();
      const sorted = (data || []).sort(
        (a, b) => new Date(b.createdAt || 0) - new Date(a.createdAt || 0)
      );
      setOrders(sorted);
    } catch (err) {
      setError(err.message || 'Không thể tải danh sách đơn hàng.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (!isAuthenticated) {
      navigate('/login', { state: { from: '/orders' } });
      return;
    }

    let isMounted = true;
    orderApi
      .getMyOrders()
      .then((data) => {
        if (!isMounted) return;
        const sorted = (data || []).sort(
          (a, b) => new Date(b.createdAt || 0) - new Date(a.createdAt || 0)
        );
        setOrders(sorted);
        setLoading(false);
      })
      .catch((err) => {
        if (!isMounted) return;
        setError(err.message || 'Không thể tải danh sách đơn hàng.');
        setLoading(false);
      });

    return () => {
      isMounted = false;
    };
  }, [isAuthenticated, navigate]);

  // Status counts
  const statusCounts = useMemo(() => {
    const counts = { ALL: orders.length };
    Object.values(ORDER_STATUS).forEach((status) => {
      counts[status] = orders.filter((o) => o.status === status).length;
    });
    return counts;
  }, [orders]);

  // Filtered orders by status
  const filteredOrders = useMemo(() => {
    if (selectedStatus === 'ALL') return orders;
    return orders.filter((o) => o.status === selectedStatus);
  }, [orders, selectedStatus]);

  // Columns for Desktop Table per Design.md 7.6 (v2.0 with thumbnail strip)
  const columns = [
    {
      key: 'id',
      header: 'Mã đơn',
      render: (row) => (
        <span className="font-bold text-primary-700">#{row.id}</span>
      ),
    },
    {
      key: 'itemsPreview',
      header: 'Sản phẩm',
      render: (row) => {
        const items = row.items || [];
        const previewItems = items.slice(0, 3);
        const remainingCount = items.length - previewItems.length;

        return (
          <div className="flex items-center gap-1.5 py-1">
            {previewItems.map((item, idx) => (
              <div
                key={idx}
                className="size-10 rounded-lg overflow-hidden border border-line bg-gray-50 shrink-0"
                title={item.name}
              >
                {item.imageUrl ? (
                  <img
                    src={item.imageUrl}
                    alt={item.name || 'Sản phẩm'}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-ink-subtle">
                    <Package className="size-4" />
                  </div>
                )}
              </div>
            ))}
            {remainingCount > 0 && (
              <span className="size-10 rounded-lg bg-gray-100 border border-line flex items-center justify-center text-xs font-semibold text-ink-subtle">
                +{remainingCount}
              </span>
            )}
          </div>
        );
      },
    },
    {
      key: 'createdAt',
      header: 'Ngày đặt',
      render: (row) => (
        <span className="text-ink-muted text-xs sm:text-sm">{formatDate(row.createdAt)}</span>
      ),
    },
    {
      key: 'totalPrice',
      header: 'Tổng tiền',
      render: (row) => (
        <span className="font-bold text-ink">{formatCurrency(row.totalPrice)}</span>
      ),
    },
    {
      key: 'status',
      header: 'Trạng thái',
      render: (row) => <OrderBadge status={row.status} />,
    },
    {
      key: 'actions',
      header: 'Thao tác',
      className: 'text-right',
      headerClassName: 'text-right',
      render: (row) => (
        <Button
          variant="outline"
          size="sm"
          rightIcon={ArrowRight}
          onClick={() => navigate(`/orders/${row.id}`)}
        >
          Xem
        </Button>
      ),
    },
  ];

  return (
    <div className="mx-auto w-full max-w-7xl px-4 sm:px-6 lg:px-8 py-6 md:py-10 space-y-6">
      {/* Page Title */}
      <div>
        <h1 className="text-2xl md:text-3xl font-extrabold text-ink">
          Đơn hàng của tôi
        </h1>
        <p className="text-sm text-ink-muted mt-1">
          Theo dõi hành trình và xem lại lịch sử các món quà bạn đã đặt mua
        </p>
      </div>

      {/* Status Filter Chips (Design.md 7.6: Tất cả + 5 trạng thái kèm số đơn) */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none">
        <button
          type="button"
          onClick={() => setSelectedStatus('ALL')}
          className={`shrink-0 inline-flex items-center gap-2 h-9 px-4 rounded-full text-xs sm:text-sm font-semibold transition-all cursor-pointer ${
            selectedStatus === 'ALL'
              ? 'bg-primary-700 text-white shadow-xs'
              : 'bg-white border border-line text-ink hover:bg-gray-50'
          }`}
        >
          <span>Tất cả</span>
          <span
            className={`text-xs px-1.5 py-0.2 rounded-full ${
              selectedStatus === 'ALL'
                ? 'bg-white/20 text-white'
                : 'bg-gray-100 text-ink-muted'
            }`}
          >
            {statusCounts.ALL || 0}
          </span>
        </button>

        {Object.entries(ORDER_STATUS).map(([key, val]) => {
          const isSelected = selectedStatus === val;
          const count = statusCounts[val] || 0;
          return (
            <button
              key={key}
              type="button"
              onClick={() => setSelectedStatus(val)}
              className={`shrink-0 inline-flex items-center gap-2 h-9 px-4 rounded-full text-xs sm:text-sm font-semibold transition-all cursor-pointer ${
                isSelected
                  ? 'bg-primary-700 text-white shadow-xs'
                  : 'bg-white border border-line text-ink hover:bg-gray-50'
              }`}
            >
              <span>{ORDER_STATUS_LABELS[val]}</span>
              {count > 0 && (
                <span
                  className={`text-xs px-1.5 py-0.2 rounded-full ${
                    isSelected
                      ? 'bg-white/20 text-white'
                      : 'bg-gray-100 text-ink-muted'
                  }`}
                >
                  {count}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* Main Content Area */}
      {loading ? (
        <div className="space-y-4">
          <div className="hidden md:block">
            <Table columns={columns} data={[]} loading={true} />
          </div>
          <div className="md:hidden space-y-3">
            {Array.from({ length: 3 }).map((_, i) => (
              <div
                key={i}
                className="bg-white rounded-xl border border-line p-4 animate-pulse space-y-3 shadow-soft"
              >
                <div className="h-5 bg-gray-200 rounded-md w-1/3" />
                <div className="h-4 bg-gray-200 rounded-md w-1/2" />
                <div className="h-8 bg-gray-200 rounded-md w-full" />
              </div>
            ))}
          </div>
        </div>
      ) : error ? (
        <ErrorState
          title="Không tải được lịch sử đơn hàng"
          message={error}
          onRetry={fetchOrders}
        />
      ) : filteredOrders.length === 0 ? (
        <div className="bg-white rounded-2xl border border-line p-8 sm:p-12 shadow-soft text-center">
          <EmptyState
            icon={ClipboardList}
            title={
              selectedStatus === 'ALL'
                ? 'Bạn chưa có đơn hàng nào'
                : `Không có đơn hàng nào ở trạng thái "${ORDER_STATUS_LABELS[selectedStatus]}"`
            }
            description="Hãy bắt đầu khám phá các sản phẩm độc đáo và đặt đơn hàng đầu tiên của bạn nhé!"
            actionLabel={selectedStatus === 'ALL' ? 'Mua sắm ngay' : 'Xem tất cả đơn'}
            onAction={
              selectedStatus === 'ALL'
                ? () => navigate('/')
                : () => setSelectedStatus('ALL')
            }
          />
        </div>
      ) : (
        <>
          {/* Desktop Table View */}
          <div className="hidden md:block shadow-soft rounded-xl overflow-hidden">
            <Table columns={columns} data={filteredOrders} />
          </div>

          {/* Mobile Cards View with thumbnail preview strip */}
          <div className="md:hidden space-y-3.5">
            {filteredOrders.map((order) => {
              const items = order.items || [];
              const itemCount = items.reduce(
                (sum, item) => sum + (item.quantity || 1),
                0
              );
              const previewItems = items.slice(0, 3);
              const remainingCount = items.length - previewItems.length;

              return (
                <div
                  key={order.id}
                  onClick={() => navigate(`/orders/${order.id}`)}
                  className="bg-white rounded-2xl border border-line p-4 shadow-soft hover:border-primary-300 transition-colors cursor-pointer space-y-3"
                >
                  <div className="flex items-center justify-between">
                    <span className="font-extrabold text-base text-primary-700">
                      #{order.id}
                    </span>
                    <OrderBadge status={order.status} />
                  </div>

                  {/* Thumbnail strip on mobile */}
                  <div className="flex items-center gap-2 py-1">
                    {previewItems.map((item, idx) => (
                      <div
                        key={idx}
                        className="size-11 rounded-lg overflow-hidden border border-line bg-gray-50 shrink-0"
                      >
                        {item.imageUrl ? (
                          <img
                            src={item.imageUrl}
                            alt={item.name}
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center text-ink-subtle">
                            <Package className="size-4" />
                          </div>
                        )}
                      </div>
                    ))}
                    {remainingCount > 0 && (
                      <span className="size-11 rounded-lg bg-gray-100 border border-line flex items-center justify-center text-xs font-semibold text-ink-subtle">
                        +{remainingCount}
                      </span>
                    )}
                  </div>

                  <div className="text-xs text-ink-muted flex items-center gap-1.5">
                    <Calendar className="size-3.5" />
                    <span>{formatDate(order.createdAt)}</span>
                    <span>•</span>
                    <span>{itemCount} sản phẩm</span>
                  </div>

                  <div className="flex items-center justify-between pt-2 border-t border-line">
                    <div>
                      <span className="text-xs text-ink-muted block">Tổng tiền:</span>
                      <span className="text-base font-bold text-ink">
                        {formatCurrency(order.totalPrice)}
                      </span>
                    </div>

                    <Button
                      variant="outline"
                      size="sm"
                      rightIcon={ArrowRight}
                      onClick={(e) => {
                        e.stopPropagation();
                        navigate(`/orders/${order.id}`);
                      }}
                    >
                      Chi tiết
                    </Button>
                  </div>
                </div>
              );
            })}
          </div>
        </>
      )}
    </div>
  );
}
