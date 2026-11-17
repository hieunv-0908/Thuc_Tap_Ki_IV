import { useState, useEffect, useCallback } from 'react';
import {
  Ticket,
  Plus,
  Search,
  Pencil,
  Trash2,
  CheckCircle2,
  XCircle,
  Clock,
  Percent,
  Coins,
} from 'lucide-react';
import Button from '../../components/ui/Button';
import Table from '../../components/ui/Table';
import Pagination from '../../components/ui/Pagination';
import ConfirmDialog from '../../components/ui/ConfirmDialog';
import StatCard from '../../components/admin/StatCard';
import VoucherModal from '../../components/admin/VoucherModal';
import { voucherApi } from '../../api/voucher';
import { toast } from '../../store/toastStore';
import { formatCurrency } from '../../utils/formatCurrency';
import { formatDate } from '../../utils/formatDate';

const ITEMS_PER_PAGE = 10;

export default function AdminVouchers() {
  const [vouchers, setVouchers] = useState([]);
  const [totalPages, setTotalPages] = useState(1);
  const [totalElements, setTotalElements] = useState(0);
  const [currentPage, setCurrentPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Filters
  const [search, setSearch] = useState('');
  const [activeFilter, setActiveFilter] = useState('');

  // Modals
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingVoucher, setEditingVoucher] = useState(null);
  const [saving, setSaving] = useState(false);

  // Delete Confirm
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const fetchVouchers = useCallback(async () => {
    try {
      const res = await voucherApi.adminGetVouchers({
        page: currentPage - 1,
        size: ITEMS_PER_PAGE,
        search: search.trim(),
        isActive: activeFilter === '' ? null : activeFilter === 'true',
      });

      const content = res?.content || (Array.isArray(res) ? res : []);
      setVouchers(content);
      setTotalPages(res?.totalPages || 1);
      setTotalElements(res?.totalElements || content.length);
      setError(null);
    } catch (err) {
      console.error('Lỗi tải danh sách voucher:', err);
      setError(err.message || 'Không thể tải danh sách mã giảm giá.');
    } finally {
      setLoading(false);
    }
  }, [currentPage, search, activeFilter]);

  useEffect(() => {
    let ignore = false;
    async function load() {
      try {
        const res = await voucherApi.adminGetVouchers({
          page: currentPage - 1,
          size: ITEMS_PER_PAGE,
          search: search.trim(),
          isActive: activeFilter === '' ? null : activeFilter === 'true',
        });
        if (!ignore) {
          const content = res?.content || (Array.isArray(res) ? res : []);
          setVouchers(content);
          setTotalPages(res?.totalPages || 1);
          setTotalElements(res?.totalElements || content.length);
          setError(null);
        }
      } catch (err) {
        if (!ignore) {
          console.error('Lỗi tải danh sách voucher:', err);
          setError(err.message || 'Không thể tải danh sách mã giảm giá.');
        }
      } finally {
        if (!ignore) {
          setLoading(false);
        }
      }
    }
    load();
    return () => {
      ignore = true;
    };
  }, [currentPage, search, activeFilter]);

  const handleOpenCreate = () => {
    setEditingVoucher(null);
    setIsModalOpen(true);
  };

  const handleOpenEdit = (v) => {
    setEditingVoucher(v);
    setIsModalOpen(true);
  };

  const handleSave = async (payload) => {
    try {
      setSaving(true);
      if (editingVoucher) {
        await voucherApi.adminUpdateVoucher(editingVoucher.id, payload);
        toast.success(`Cập nhật voucher ${editingVoucher.code} thành công!`);
      } else {
        await voucherApi.adminCreateVoucher(payload);
        toast.success(`Tạo mới voucher ${payload.code} thành công!`);
      }
      setIsModalOpen(false);
      fetchVouchers();
    } catch (err) {
      console.error('Lỗi lưu voucher:', err);
      toast.error(err.response?.data?.message || err.message || 'Lỗi khi lưu voucher.');
    } finally {
      setSaving(false);
    }
  };

  const handleToggle = async (v) => {
    try {
      await voucherApi.adminToggleVoucher(v.id);
      toast.success(`Đã ${v.isActive ? 'tạm dừng' : 'kích hoạt'} voucher ${v.code}`);
      fetchVouchers();
    } catch (err) {
      console.error('Lỗi đổi trạng thái:', err);
      toast.error(err.response?.data?.message || err.message || 'Không thể đổi trạng thái.');
    }
  };

  const handleConfirmDelete = async () => {
    if (!deleteTarget) return;
    try {
      setIsDeleting(true);
      await voucherApi.adminDeleteVoucher(deleteTarget.id);
      toast.success(`Đã xóa voucher ${deleteTarget.code}`);
      setDeleteTarget(null);
      fetchVouchers();
    } catch (err) {
      console.error('Lỗi xóa voucher:', err);
      toast.error(err.response?.data?.message || err.message || 'Không thể xóa voucher.');
    } finally {
      setIsDeleting(false);
    }
  };

  // Metrics
  const activeCount = vouchers.filter((v) => v.isActive && !v.isExpired).length;
  const expiredCount = vouchers.filter((v) => v.isExpired).length;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white flex items-center gap-2.5">
            <Ticket className="w-7 h-7 text-primary-600 dark:text-primary-400" />
            Quản lý Mã Giảm Giá
          </h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
            Quản lý danh sách voucher, cấu hình tỷ lệ giảm giá và lượt dùng cho khách hàng
          </p>
        </div>

        <Button variant="primary" onClick={handleOpenCreate} className="flex items-center gap-2 shadow-sm">
          <Plus className="w-4 h-4" />
          Tạo Voucher Mới
        </Button>
      </div>

      {/* Stat Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <StatCard
          icon={Ticket}
          title="Tổng số Voucher"
          value={totalElements}
          color="primary"
          subtitle="Tất cả mã trong hệ thống"
        />
        <StatCard
          icon={CheckCircle2}
          title="Đang khả dụng"
          value={activeCount}
          color="emerald"
          subtitle="Đang kích hoạt & còn hạn"
        />
        <StatCard
          icon={Clock}
          title="Hết hạn / Tạm dừng"
          value={expiredCount}
          color="amber"
          subtitle="Không còn áp dụng được"
        />
      </div>

      {/* Filter & Search Bar */}
      <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col md:flex-row gap-4 justify-between items-center">
        <div className="relative w-full md:w-80">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input
            type="text"
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setCurrentPage(1);
            }}
            placeholder="Tìm theo mã code, tên voucher..."
            className="w-full pl-10 pr-4 py-2 text-sm rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 transition"
          />
        </div>

        <div className="flex items-center gap-3 w-full md:w-auto">
          <select
            value={activeFilter}
            onChange={(e) => {
              setActiveFilter(e.target.value);
              setCurrentPage(1);
            }}
            className="px-3 py-2 text-sm rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white font-medium focus:outline-none focus:ring-2 focus:ring-primary-500/20"
          >
            <option value="">Tất cả trạng thái</option>
            <option value="true">Đang kích hoạt</option>
            <option value="false">Tạm dừng</option>
          </select>
        </div>
      </div>

      {error && (
        <div className="p-4 rounded-xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800 text-rose-700 dark:text-rose-300 text-sm flex items-center justify-between">
          <span>{error}</span>
          <Button variant="outline" size="sm" onClick={() => fetchVouchers()}>
            Thử lại
          </Button>
        </div>
      )}

      {/* Table */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden">
        <Table>
          <Table.Header>
            <Table.Row>
              <Table.Head>Mã & Tên Voucher</Table.Head>
              <Table.Head>Loại & Mức giảm</Table.Head>
              <Table.Head>Đơn tối thiểu / Tối đa</Table.Head>
              <Table.Head>Lượt dùng (Đã dùng/Tổng)</Table.Head>
              <Table.Head>Thời hạn</Table.Head>
              <Table.Head className="text-center">Kích hoạt</Table.Head>
              <Table.Head className="text-right">Thao tác</Table.Head>
            </Table.Row>
          </Table.Header>

          <Table.Body>
            {loading ? (
              <Table.Row>
                <Table.Cell colSpan={7} className="text-center py-12 text-slate-400">
                  <div className="flex flex-col items-center justify-center gap-2">
                    <div className="w-6 h-6 border-2 border-primary-600 border-t-transparent rounded-full animate-spin"></div>
                    <p className="text-xs">Đang tải danh sách voucher...</p>
                  </div>
                </Table.Cell>
              </Table.Row>
            ) : vouchers.length === 0 ? (
              <Table.Row>
                <Table.Cell colSpan={7} className="text-center py-12 text-slate-400">
                  <Ticket className="w-10 h-10 mx-auto text-slate-300 dark:text-slate-600 mb-2 stroke-[1.5]" />
                  <p className="text-sm font-medium">Chưa có mã giảm giá nào</p>
                  <p className="text-xs text-slate-400 mt-1">Bấm "Tạo Voucher Mới" để thêm mã khuyến mãi đầu tiên</p>
                </Table.Cell>
              </Table.Row>
            ) : (
              vouchers.map((v) => {
                const percent = v.usageLimit ? Math.min(100, Math.round((v.usedCount / v.usageLimit) * 100)) : null;

                return (
                  <Table.Row key={v.id} className="hover:bg-slate-50/70 dark:hover:bg-slate-800/50 transition">
                    {/* Code & Name */}
                    <Table.Cell>
                      <div className="flex items-start gap-2.5">
                        <div className="p-2 rounded-xl bg-primary-50 dark:bg-primary-950/50 text-primary-600 dark:text-primary-400 shrink-0">
                          <Ticket className="w-4 h-4" />
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="font-mono font-bold text-sm tracking-wide text-primary-600 dark:text-primary-400">
                              {v.code}
                            </span>
                            {v.isExpired && (
                              <span className="px-1.5 py-0.5 text-[10px] font-semibold bg-rose-100 text-rose-700 dark:bg-rose-950/60 dark:text-rose-400 rounded">
                                Hết hạn
                              </span>
                            )}
                          </div>
                          <p className="text-xs font-medium text-slate-800 dark:text-slate-200 mt-0.5 line-clamp-1">
                            {v.name}
                          </p>
                        </div>
                      </div>
                    </Table.Cell>

                    {/* Discount Type & Value */}
                    <Table.Cell>
                      <div className="flex items-center gap-1.5">
                        {v.discountType === 'PERCENTAGE' ? (
                          <div className="flex items-center gap-1 text-indigo-600 dark:text-indigo-400 font-semibold text-sm">
                            <Percent className="w-3.5 h-3.5" />
                            <span>Giảm {v.discountValue}%</span>
                          </div>
                        ) : (
                          <div className="flex items-center gap-1 text-emerald-600 dark:text-emerald-400 font-semibold text-sm">
                            <Coins className="w-3.5 h-3.5" />
                            <span>Giảm {formatCurrency(v.discountValue)}</span>
                          </div>
                        )}
                      </div>
                    </Table.Cell>

                    {/* Min Order & Max Discount */}
                    <Table.Cell>
                      <div className="text-xs space-y-0.5">
                        <div className="text-slate-600 dark:text-slate-400">
                          Đơn min: <span className="font-medium text-slate-900 dark:text-white">{formatCurrency(v.minOrderValue)}</span>
                        </div>
                        {v.maxDiscountAmount && (
                          <div className="text-slate-500 text-[11px]">
                            Giảm max: {formatCurrency(v.maxDiscountAmount)}
                          </div>
                        )}
                      </div>
                    </Table.Cell>

                    {/* Usage Progress */}
                    <Table.Cell>
                      <div className="w-36 space-y-1">
                        <div className="flex justify-between text-xs font-medium">
                          <span className="text-slate-700 dark:text-slate-300">
                            {v.usedCount} {v.usageLimit ? `/ ${v.usageLimit}` : 'lượt'}
                          </span>
                          {percent !== null && <span className="text-slate-400 text-[11px]">{percent}%</span>}
                        </div>
                        {v.usageLimit ? (
                          <div className="w-full h-1.5 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                            <div
                              className={`h-full rounded-full transition-all ${
                                percent >= 100 ? 'bg-rose-500' : percent >= 75 ? 'bg-amber-500' : 'bg-primary-600'
                              }`}
                              style={{ width: `${percent}%` }}
                            ></div>
                          </div>
                        ) : (
                          <span className="text-[11px] text-slate-400">Không giới hạn</span>
                        )}
                      </div>
                    </Table.Cell>

                    {/* Validity Period */}
                    <Table.Cell>
                      <div className="text-xs space-y-0.5">
                        <p className="text-slate-700 dark:text-slate-300">
                          {v.startDate ? formatDate(v.startDate) : '---'}
                        </p>
                        <p className="text-slate-400 text-[11px]">
                          đến {v.endDate ? formatDate(v.endDate) : '---'}
                        </p>
                      </div>
                    </Table.Cell>

                    {/* Active Toggle Switch */}
                    <Table.Cell className="text-center">
                      <button
                        onClick={() => handleToggle(v)}
                        title={v.isActive ? 'Bấm để tạm dừng' : 'Bấm để kích hoạt'}
                        className="inline-flex items-center transition hover:opacity-80 focus:outline-none"
                      >
                        {v.isActive ? (
                          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-100 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-400">
                            <CheckCircle2 className="w-3 h-3" /> Hoạt động
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400">
                            <XCircle className="w-3 h-3" /> Tạm dừng
                          </span>
                        )}
                      </button>
                    </Table.Cell>

                    {/* Actions */}
                    <Table.Cell className="text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        <button
                          onClick={() => handleOpenEdit(v)}
                          title="Chỉnh sửa"
                          className="p-1.5 text-slate-500 hover:text-primary-600 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition"
                        >
                          <Pencil className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => setDeleteTarget(v)}
                          title="Xóa voucher"
                          className="p-1.5 text-slate-500 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40 rounded-lg transition"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </Table.Cell>
                  </Table.Row>
                );
              })
            )}
          </Table.Body>
        </Table>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="p-4 border-t border-slate-200 dark:border-slate-800 flex justify-between items-center">
            <span className="text-xs text-slate-500">
              Trang {currentPage} / {totalPages} (Tổng {totalElements} mã)
            </span>
            <Pagination
              currentPage={currentPage}
              totalPages={totalPages}
              onPageChange={(page) => setCurrentPage(page)}
            />
          </div>
        )}
      </div>

      {/* Add / Edit Modal */}
      {isModalOpen && (
        <VoucherModal
          isOpen={isModalOpen}
          onClose={() => setIsModalOpen(false)}
          onSave={handleSave}
          voucher={editingVoucher}
          saving={saving}
        />
      )}

      {/* Delete Confirm */}
      <ConfirmDialog
        isOpen={!!deleteTarget}
        title="Xóa Mã Giảm Giá"
        message={
          deleteTarget?.usedCount > 0
            ? `Voucher "${deleteTarget?.code}" đã được sử dụng ${deleteTarget?.usedCount} lần trong các đơn hàng trước đó. Hệ thống sẽ tự động tắt kích hoạt (soft disable) để đảm bảo toàn vẹn dữ liệu báo cáo.`
            : `Bạn có chắc chắn muốn xóa vĩnh viễn voucher "${deleteTarget?.code}"? Thao tác này không thể hoàn tác.`
        }
        confirmText="Xác nhận xóa"
        confirmVariant="danger"
        loading={isDeleting}
        onConfirm={handleConfirmDelete}
        onCancel={() => setDeleteTarget(null)}
      />
    </div>
  );
}
