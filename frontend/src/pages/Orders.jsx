import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { ClipboardList, ArrowRight, Calendar } from 'lucide-react';
import { orderApi } from '../api/order';
import { useAuthStore } from '../store/authStore';
import { formatCurrency } from '../utils/formatCurrency';
import { formatDate } from '../utils/formatDate';
import { OrderBadge } from '../components/ui/Badge';
import Table from '../components/ui/Table';
import EmptyState from '../components/ui/EmptyState';
import ErrorState from '../components/ui/ErrorState';
import Button from '../components/ui/Button';

/**
 * Orders history page complying with Design.md 7.6
 * Desktop: Table with [Mã đơn, Ngày đặt, Số sản phẩm, Tổng tiền, Trạng thái, Thao tác]
 * Mobile: Cards list
 */
export default function Orders() {
  const navigate = useNavigate();
  const { isAuthenticated } = useAuthStore();

  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchOrders = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await orderApi.getMyOrders();
      // Sort newest first
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

  // Columns for Desktop Table
  const columns = [
    {
      key: 'id',
      header: 'Mã đơn hàng',
      render: (row) => (
        <span className="font-bold text-primary-700">#{row.id}</span>
      ),
    },
    {
      key: 'createdAt',
      header: 'Ngày đặt',
      render: (row) => (
        <span className="text-ink-muted">{formatDate(row.createdAt)}</span>
      ),
    },
    {
      key: 'itemCount',
      header: 'Số sản phẩm',
      render: (row) => {
        const count = (row.items || []).reduce((acc, curr) => acc + (curr.quantity || 1), 0);
        return <span className="text-ink font-medium">{count} sản phẩm</span>;
      },
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
    <div className="mx-auto w-full max-w-7xl px-4 sm:px-6 lg:px-8 py-6 md:py-10">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6 md:mb-8">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold text-ink">
            Đơn hàng của tôi
          </h1>
          <p className="text-sm text-ink-muted mt-1">
            Theo dõi trạng thái và lịch sử mua sắm của bạn tại FunnyShop
          </p>
        </div>
      </div>

      {loading ? (
        <div className="space-y-4">
          <div className="hidden md:block">
            <Table columns={columns} data={[]} loading={true} />
          </div>
          <div className="md:hidden space-y-3">
            {Array.from({ length: 3 }).map((_, i) => (
              <div
                key={i}
                className="bg-white rounded-xl border border-line p-4 animate-pulse space-y-3"
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
      ) : orders.length === 0 ? (
        <div className="bg-white rounded-2xl border border-line p-8 sm:p-12 shadow-xs">
          <EmptyState
            icon={ClipboardList}
            title="Bạn chưa có đơn hàng nào"
            description="Hãy bắt đầu khám phá các sản phẩm vui nhộn và đặt đơn hàng đầu tiên nhé!"
            actionLabel="Mua sắm ngay"
            onAction={() => navigate('/')}
          />
        </div>
      ) : (
        <>
          {/* Desktop Table View */}
          <div className="hidden md:block">
            <Table columns={columns} data={orders} />
          </div>

          {/* Mobile Cards View */}
          <div className="md:hidden space-y-3.5">
            {orders.map((order) => {
              const itemCount = (order.items || []).reduce(
                (sum, item) => sum + (item.quantity || 1),
                0
              );

              return (
                <div
                  key={order.id}
                  onClick={() => navigate(`/orders/${order.id}`)}
                  className="bg-white rounded-xl border border-line p-4 shadow-2xs hover:border-primary-300 transition-colors cursor-pointer space-y-3"
                >
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-base text-primary-700">
                      #{order.id}
                    </span>
                    <OrderBadge status={order.status} />
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
