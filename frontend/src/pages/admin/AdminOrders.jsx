import { useState, useEffect, useMemo, useCallback } from 'react';
import {
  ClipboardList,
  Search,
  Eye,
  Clock,
  Truck,
  CheckCircle2,
  X,
  Phone,
  Calendar,
} from 'lucide-react';
import Table from '../../components/ui/Table';
import Pagination from '../../components/ui/Pagination';
import { OrderBadge } from '../../components/ui/Badge';
import ConfirmDialog from '../../components/ui/ConfirmDialog';
import StatCard from '../../components/admin/StatCard';
import AdminOrderDetailModal from '../../components/admin/AdminOrderDetailModal';
import { adminApi } from '../../api/admin';
import { toast } from '../../store/toastStore';
import { formatCurrency } from '../../utils/formatCurrency';
import { formatDate } from '../../utils/formatDate';
import {
  ORDER_STATUS,
  ORDER_STATUS_LABELS,
  VALID_ORDER_TRANSITIONS,
} from '../../utils/constants';

const ITEMS_PER_PAGE = 8;

export default function AdminOrders() {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Filters
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [currentPage, setCurrentPage] = useState(1);

  // Detail Modal
  const [selectedOrder, setSelectedOrder] = useState(null);

  // Cancel Confirm Dialog
  const [cancelTarget, setCancelTarget] = useState(null); // { id }
  const [isCancelling, setIsCancelling] = useState(false);

  // Fetch orders
  const fetchOrders = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await adminApi.getAllOrders();
      // Newest orders first
      const sorted = (res || []).sort((a, b) => (b.id || 0) - (a.id || 0));
      setOrders(sorted);
    } catch (err) {
      console.error('Lỗi tải danh sách đơn hàng:', err);
      setError(err.message || 'Không thể tải danh sách đơn hàng.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    let ignore = false;
    async function init() {
      try {
        setLoading(true);
        setError(null);
        const res = await adminApi.getAllOrders();
        if (!ignore) {
          const sorted = (res || []).sort((a, b) => (b.id || 0) - (a.id || 0));
          setOrders(sorted);
        }
      } catch (err) {
        if (!ignore) {
          setError(err.message || 'Không thể tải danh sách đơn hàng.');
        }
      } finally {
        if (!ignore) {
          setLoading(false);
        }
      }
    }
    init();
    return () => {
      ignore = true;
    };
  }, []);

  // Statistics
  const stats = useMemo(() => {
    const total = orders.length;
    const pending = orders.filter((o) => o.status === ORDER_STATUS.PENDING).length;
    const shipping = orders.filter((o) => o.status === ORDER_STATUS.SHIPPING || o.status === ORDER_STATUS.PROCESSING).length;
    const completed = orders.filter((o) => o.status === ORDER_STATUS.COMPLETED).length;

    return { total, pending, shipping, completed };
  }, [orders]);

  // Filtered orders
  const filteredOrders = useMemo(() => {
    return orders.filter((order) => {
      // Status filter
      if (statusFilter !== 'ALL' && order.status !== statusFilter) {
        return false;
      }

      // Search query (Order ID, Name, Phone, Address)
      if (searchQuery.trim()) {
        const query = searchQuery.trim().toLowerCase();
        const matchesId = String(order.id).includes(query);
        const matchesName = order.fullName?.toLowerCase().includes(query);
        const matchesPhone = order.phone?.includes(query);
        const matchesAddress = order.address?.toLowerCase().includes(query);

        if (!matchesId && !matchesName && !matchesPhone && !matchesAddress) {
          return false;
        }
      }

      return true;
    });
  }, [orders, statusFilter, searchQuery]);

  // Pagination calculation
  const totalPages = Math.ceil(filteredOrders.length / ITEMS_PER_PAGE) || 1;
  const paginatedOrders = useMemo(() => {
    const start = (currentPage - 1) * ITEMS_PER_PAGE;
    return filteredOrders.slice(start, start + ITEMS_PER_PAGE);
  }, [filteredOrders, currentPage]);

  const handleSearchChange = (val) => {
    setSearchQuery(val);
    setCurrentPage(1);
  };

  const handleStatusFilterChange = (status) => {
    setStatusFilter(status);
    setCurrentPage(1);
  };

  // Handle status update
  const handleStatusChange = async (orderId, newStatus) => {
    if (!newStatus) return;

    // If cancelled, open confirm dialog
    if (newStatus === ORDER_STATUS.CANCELLED) {
      setCancelTarget({ id: orderId });
      return;
    }

    try {
      await adminApi.updateOrderStatus(orderId, newStatus);
      toast.success(
        `Đã chuyển đơn hàng #${orderId} sang trạng thái "${ORDER_STATUS_LABELS[newStatus]}".`
      );
      await fetchOrders();
    } catch (err) {
      console.error('Lỗi cập nhật trạng thái đơn:', err);
      toast.error(err.message || 'Không thể cập nhật trạng thái đơn hàng.');
    }
  };

  // Confirm cancel order
  const handleConfirmCancel = async () => {
    if (!cancelTarget) return;

    try {
      setIsCancelling(true);
      await adminApi.updateOrderStatus(cancelTarget.id, ORDER_STATUS.CANCELLED);
      toast.success(
        `Đã hủy đơn hàng #${cancelTarget.id}. Số lượng tồn kho đã được hoàn lại.`
      );
      setCancelTarget(null);
      await fetchOrders();
    } catch (err) {
      console.error('Lỗi hủy đơn hàng:', err);
      toast.error(err.message || 'Không thể hủy đơn hàng.');
    } finally {
      setIsCancelling(false);
    }
  };

  // Status Filter Chips definition
  const filterChips = [
    { key: 'ALL', label: 'Tất cả đơn', count: orders.length },
    {
      key: ORDER_STATUS.PENDING,
      label: ORDER_STATUS_LABELS.PENDING,
      count: orders.filter((o) => o.status === ORDER_STATUS.PENDING).length,
    },
    {
      key: ORDER_STATUS.PROCESSING,
      label: ORDER_STATUS_LABELS.PROCESSING,
      count: orders.filter((o) => o.status === ORDER_STATUS.PROCESSING).length,
    },
    {
      key: ORDER_STATUS.SHIPPING,
      label: ORDER_STATUS_LABELS.SHIPPING,
      count: orders.filter((o) => o.status === ORDER_STATUS.SHIPPING).length,
    },
    {
      key: ORDER_STATUS.COMPLETED,
      label: ORDER_STATUS_LABELS.COMPLETED,
      count: orders.filter((o) => o.status === ORDER_STATUS.COMPLETED).length,
    },
    {
      key: ORDER_STATUS.CANCELLED,
      label: ORDER_STATUS_LABELS.CANCELLED,
      count: orders.filter((o) => o.status === ORDER_STATUS.CANCELLED).length,
    },
  ];

  // Table columns definition per Design.md 7.10
  const columns = [
    {
      key: 'id',
      header: 'Mã đơn',
      className: 'whitespace-nowrap font-bold text-ink',
      render: (row) => <span>#{row.id}</span>,
    },
    {
      key: 'customer',
      header: 'Khách hàng',
      render: (row) => (
        <div className="max-w-xs">
          <p className="font-semibold text-ink line-clamp-1">{row.fullName || 'Khách vãng lai'}</p>
          <div className="flex items-center gap-1.5 text-xs text-ink-muted mt-0.5">
            <Phone className="size-3 text-ink-subtle shrink-0" />
            <span>{row.phone || '—'}</span>
          </div>
          <p className="text-xs text-ink-subtle line-clamp-1 mt-0.5" title={row.address}>
            {row.address || '—'}
          </p>
        </div>
      ),
    },
    {
      key: 'createdAt',
      header: 'Ngày đặt',
      className: 'whitespace-nowrap text-xs text-ink-muted',
      render: (row) => (
        <div className="flex items-center gap-1.5">
          <Calendar className="size-3.5 text-ink-subtle" />
          <span>{formatDate(row.createdAt || row.id)}</span>
        </div>
      ),
    },
    {
      key: 'totalPrice',
      header: 'Tổng tiền',
      className: 'whitespace-nowrap font-bold text-primary-700',
      render: (row) => {
        const total =
          row.totalPrice ||
          (row.items || []).reduce((acc, i) => acc + (i.price || 0) * (i.quantity || 1), 0);
        return formatCurrency(total);
      },
    },
    {
      key: 'status',
      header: 'Trạng thái',
      className: 'whitespace-nowrap',
      render: (row) => <OrderBadge status={row.status} />,
    },
    {
      key: 'updateStatus',
      header: 'Cập nhật',
      className: 'whitespace-nowrap',
      render: (row) => {
        const allowedTransitions = VALID_ORDER_TRANSITIONS[row.status] || [];

        if (allowedTransitions.length === 0) {
          return <span className="text-xs text-ink-subtle font-medium">—</span>;
        }

        return (
          <select
            value=""
            onChange={(e) => handleStatusChange(row.id, e.target.value)}
            className="text-xs font-semibold py-1.5 px-2.5 rounded-lg border border-line bg-white hover:border-gray-400 focus:outline-none focus:ring-2 focus:ring-secondary-200 transition-colors cursor-pointer text-ink"
            aria-label={`Chuyển trạng thái đơn #${row.id}`}
          >
            <option value="" disabled>
              Chuyển sang...
            </option>
            {allowedTransitions.map((nextStatus) => (
              <option key={nextStatus} value={nextStatus}>
                {nextStatus === ORDER_STATUS.CANCELLED ? '❌ Hủy đơn' : `→ ${ORDER_STATUS_LABELS[nextStatus]}`}
              </option>
            ))}
          </select>
        );
      },
    },
    {
      key: 'actions',
      header: 'Chi tiết',
      headerClassName: 'text-right',
      className: 'text-right whitespace-nowrap',
      render: (row) => (
        <button
          type="button"
          onClick={() => setSelectedOrder(row)}
          className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-semibold text-secondary-700 bg-secondary-50 hover:bg-secondary-100 border border-secondary-200 transition-colors cursor-pointer"
          title="Xem chi tiết đơn hàng"
        >
          <Eye className="size-3.5" />
          <span>Xem</span>
        </button>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl md:text-3xl font-bold text-ink">
          Quản lý đơn hàng
        </h1>
        <p className="text-sm text-ink-muted mt-0.5">
          Theo dõi tiến độ, xem chi tiết và chuyển trạng thái xử lý đơn hàng của khách hàng
        </p>
      </div>

      {/* StatCards Row */}
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <StatCard
          icon={ClipboardList}
          label="Tổng đơn hàng"
          value={stats.total}
          variant="primary"
          subtext="Toàn bộ lịch sử đặt hàng"
        />
        <StatCard
          icon={Clock}
          label="Chờ xử lý"
          value={stats.pending}
          variant="warning"
          subtext="Cần xác nhận đơn mới"
        />
        <StatCard
          icon={Truck}
          label="Đang vận chuyển"
          value={stats.shipping}
          variant="secondary"
          subtext="Đang xử lý / giao hàng"
        />
        <StatCard
          icon={CheckCircle2}
          label="Hoàn thành"
          value={stats.completed}
          variant="success"
          subtext="Giao thành công"
        />
      </div>

      {/* Status Filter Chips & Search Toolbar */}
      <div className="p-4 rounded-xl border border-line bg-white shadow-soft space-y-4">
        {/* Status Chips */}
        <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none">
          {filterChips.map((chip) => {
            const isActive = statusFilter === chip.key;
            return (
              <button
                key={chip.key}
                type="button"
                onClick={() => handleStatusFilterChange(chip.key)}
                className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold whitespace-nowrap transition-all cursor-pointer ${
                  isActive
                    ? 'bg-primary-700 text-white shadow-xs'
                    : 'bg-gray-100 text-ink-muted hover:bg-gray-200/80 hover:text-ink'
                }`}
              >
                <span>{chip.label}</span>
                <span
                  className={`px-1.5 py-0.2 rounded-full text-[10px] ${
                    isActive ? 'bg-white/20 text-white' : 'bg-white text-ink-subtle'
                  }`}
                >
                  {chip.count}
                </span>
              </button>
            );
          })}
        </div>

        {/* Search bar */}
        <div className="relative flex items-center">
          <Search className="size-4 text-ink-subtle absolute left-3 pointer-events-none" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => handleSearchChange(e.target.value)}
            placeholder="Tìm theo mã đơn (#123...), tên khách hàng, số điện thoại, địa chỉ..."
            className="h-10 w-full pl-9 pr-9 rounded-lg border border-line bg-page text-sm text-ink placeholder:text-ink-subtle focus:bg-white focus:outline-none focus:border-secondary-500 focus:ring-2 focus:ring-secondary-200 transition-colors"
          />
          {searchQuery && (
            <button
              type="button"
              onClick={() => handleSearchChange('')}
              className="absolute right-2.5 p-1 rounded-md text-ink-subtle hover:text-ink cursor-pointer"
              aria-label="Xóa ô tìm kiếm"
            >
              <X className="size-4" />
            </button>
          )}
        </div>

        {/* Filter stats summary */}
        {(searchQuery || statusFilter !== 'ALL') && (
          <div className="flex items-center justify-between text-xs text-ink-muted pt-1 border-t border-line">
            <span>
              Tìm thấy <strong className="text-ink">{filteredOrders.length}</strong> đơn hàng phù hợp
            </span>
            <button
              type="button"
              onClick={() => {
                setSearchQuery('');
                setStatusFilter('ALL');
                setCurrentPage(1);
              }}
              className="text-primary-700 hover:underline font-medium cursor-pointer"
            >
              Xóa bộ lọc
            </button>
          </div>
        )}
      </div>

      {/* Orders Table */}
      <div className="space-y-4">
        <Table
          columns={columns}
          data={paginatedOrders}
          loading={loading}
          error={error}
          onRetry={fetchOrders}
          emptyTitle="Không có đơn hàng nào"
          emptyDescription="Không tìm thấy đơn hàng nào phù hợp với bộ lọc hiện tại."
        />

        {/* Pagination */}
        {!loading && !error && filteredOrders.length > 0 && (
          <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-2">
            <p className="text-xs text-ink-muted">
              Hiển thị {Math.min((currentPage - 1) * ITEMS_PER_PAGE + 1, filteredOrders.length)} -{' '}
              {Math.min(currentPage * ITEMS_PER_PAGE, filteredOrders.length)} trên tổng số{' '}
              <strong className="text-ink">{filteredOrders.length}</strong> đơn hàng
            </p>
            <Pagination
              currentPage={currentPage}
              totalPages={totalPages}
              onPageChange={(page) => setCurrentPage(page)}
            />
          </div>
        )}
      </div>

      {/* Order Detail Modal */}
      <AdminOrderDetailModal
        isOpen={Boolean(selectedOrder)}
        onClose={() => setSelectedOrder(null)}
        order={selectedOrder}
      />

      {/* Confirm Cancel Order Dialog */}
      <ConfirmDialog
        isOpen={Boolean(cancelTarget)}
        onClose={() => !isCancelling && setCancelTarget(null)}
        onConfirm={handleConfirmCancel}
        title="Hủy đơn hàng này?"
        description={`Bạn có chắc chắn muốn hủy đơn hàng #${cancelTarget?.id}? Số lượng sản phẩm trong đơn sẽ được tự động hoàn lại vào kho hàng.`}
        confirmText="Xác nhận hủy đơn"
        cancelText="Đóng"
        variant="danger"
        loading={isCancelling}
      />
    </div>
  );
}
