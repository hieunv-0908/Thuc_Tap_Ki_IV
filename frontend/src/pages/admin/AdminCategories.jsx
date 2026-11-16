import { useState, useEffect, useCallback, useMemo } from 'react';
import {
  Layers,
  Plus,
  Pencil,
  EyeOff,
  RotateCcw,
  X,
  Check,
  Package,
  CheckCircle2,
  AlertTriangle,
} from 'lucide-react';
import Table from '../../components/ui/Table';
import ConfirmDialog from '../../components/ui/ConfirmDialog';
import StatCard from '../../components/admin/StatCard';
import { adminApi } from '../../api/admin';
import { toast } from '../../store/toastStore';

export default function AdminCategories() {
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [statusFilter, setStatusFilter] = useState('ALL'); // 'ALL' | 'ACTIVE' | 'HIDDEN'

  // Form modal
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editTarget, setEditTarget] = useState(null);
  const [formName, setFormName] = useState('');
  const [formDescription, setFormDescription] = useState('');
  const [formError, setFormError] = useState('');
  const [saving, setSaving] = useState(false);

  // Hide (Soft delete) confirm
  const [hideTarget, setHideTarget] = useState(null);
  const [isHiding, setIsHiding] = useState(false);

  // Restore confirm
  const [restoreTarget, setRestoreTarget] = useState(null);
  const [isRestoring, setIsRestoring] = useState(false);

  // Tải toàn bộ danh mục quản trị (kèm số lượng sản phẩm liên kết và trạng thái isDeleted)
  const fetchCategories = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await adminApi.getCategories();
      const list = Array.isArray(res) ? res : (res?.content || []);
      setCategories(list);
    } catch (err) {
      console.error('Lỗi tải danh mục quản trị:', err);
      setError(err.message || 'Không thể tải danh sách danh mục.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    let isCancelled = false;
    adminApi
      .getCategories()
      .then((res) => {
        if (isCancelled) return;
        setError(null);
        setCategories(Array.isArray(res) ? res : (res?.content || []));
      })
      .catch((err) => {
        if (isCancelled) return;
        console.error('Lỗi tải danh mục quản trị:', err);
        setError(err.message || 'Không thể tải danh sách danh mục.');
      })
      .finally(() => {
        if (!isCancelled) setLoading(false);
      });

    return () => {
      isCancelled = true;
    };
  }, []);

  // Thống kê nhanh
  const stats = useMemo(() => {
    const total = categories.length;
    const active = categories.filter((c) => !c.isDeleted).length;
    const hidden = categories.filter((c) => c.isDeleted).length;
    return { total, active, hidden };
  }, [categories]);

  // Lọc theo tab trạng thái
  const filteredCategories = useMemo(() => {
    if (statusFilter === 'ACTIVE') {
      return categories.filter((c) => !c.isDeleted);
    }
    if (statusFilter === 'HIDDEN') {
      return categories.filter((c) => c.isDeleted);
    }
    return categories;
  }, [categories, statusFilter]);

  const openCreate = () => {
    setEditTarget(null);
    setFormName('');
    setFormDescription('');
    setFormError('');
    setIsFormOpen(true);
  };

  const openEdit = (cat) => {
    setEditTarget(cat);
    setFormName(cat.name || '');
    setFormDescription(cat.description || '');
    setFormError('');
    setIsFormOpen(true);
  };

  const closeForm = () => {
    if (saving) return;
    setIsFormOpen(false);
  };

  const handleFormSubmit = async (e) => {
    e.preventDefault();
    if (!formName.trim()) {
      setFormError('Vui lòng nhập tên danh mục.');
      return;
    }
    try {
      setSaving(true);
      setFormError('');
      if (editTarget) {
        await adminApi.updateCategory(editTarget.id, {
          name: formName.trim(),
          description: formDescription.trim(),
        });
        toast.success(`Đã cập nhật danh mục "${formName.trim()}".`);
      } else {
        await adminApi.createCategory({
          name: formName.trim(),
          description: formDescription.trim(),
        });
        toast.success(`Đã thêm danh mục "${formName.trim()}".`);
      }
      setIsFormOpen(false);
      await fetchCategories();
    } catch (err) {
      console.error('Lỗi lưu danh mục:', err);
      setFormError(err.message || 'Không thể lưu danh mục. Vui lòng thử lại.');
    } finally {
      setSaving(false);
    }
  };

  // Xác nhận ẩn danh mục (xóa mềm)
  const handleHideConfirm = async () => {
    if (!hideTarget) return;

    // Kiểm tra ràng buộc: Nếu còn sản phẩm liên kết thì chặn ngay ở FE
    if (Number(hideTarget.productCount) > 0) {
      toast.error(
        `Không thể ẩn danh mục "${hideTarget.name}" vì vẫn còn ${hideTarget.productCount} sản phẩm liên kết.`
      );
      setHideTarget(null);
      return;
    }

    try {
      setIsHiding(true);
      await adminApi.deleteCategory(hideTarget.id);
      toast.success(`Đã ẩn danh mục "${hideTarget.name}".`);
      setHideTarget(null);
      await fetchCategories();
    } catch (err) {
      console.error('Lỗi ẩn danh mục:', err);
      toast.error(
        err.response?.data?.message || err.message || 'Không thể ẩn danh mục. Vui lòng thử lại.'
      );
    } finally {
      setIsHiding(false);
    }
  };

  // Xác nhận khôi phục danh mục
  const handleRestoreConfirm = async () => {
    if (!restoreTarget) return;
    try {
      setIsRestoring(true);
      await adminApi.restoreCategory(restoreTarget.id);
      toast.success(`Đã khôi phục danh mục "${restoreTarget.name}".`);
      setRestoreTarget(null);
      await fetchCategories();
    } catch (err) {
      console.error('Lỗi khôi phục danh mục:', err);
      toast.error(
        err.response?.data?.message || err.message || 'Không thể khôi phục danh mục. Vui lòng thử lại.'
      );
    } finally {
      setIsRestoring(false);
    }
  };

  const columns = [
    {
      key: 'id',
      header: 'ID',
      className: 'w-16 font-mono text-ink-muted text-sm',
      render: (row) => <span>#{row.id}</span>,
    },
    {
      key: 'name',
      header: 'Tên danh mục',
      render: (row) => (
        <div className="flex items-center gap-2">
          <span className="font-semibold text-ink">{row.name}</span>
          {row.isDeleted && (
            <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-gray-100 text-gray-600 border border-gray-200">
              Đã ẩn
            </span>
          )}
        </div>
      ),
    },
    {
      key: 'description',
      header: 'Mô tả',
      render: (row) => (
        <span className="text-sm text-ink-muted line-clamp-1">{row.description || '—'}</span>
      ),
    },
    {
      key: 'productCount',
      header: 'Sản phẩm',
      className: 'whitespace-nowrap',
      render: (row) => {
        const count = Number(row.productCount) || 0;
        return (
          <span
            className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold ${
              count > 0
                ? 'bg-primary-50 text-primary-700 border border-primary-200'
                : 'bg-gray-100 text-ink-subtle'
            }`}
          >
            <Package className="size-3.5" />
            <span>{count} sản phẩm</span>
          </span>
        );
      },
    },
    {
      key: 'status',
      header: 'Trạng thái',
      className: 'whitespace-nowrap',
      render: (row) => (
        row.isDeleted ? (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-gray-100 text-gray-600 border border-gray-200">
            <EyeOff className="size-3" />
            Đã ẩn
          </span>
        ) : (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
            <CheckCircle2 className="size-3" />
            Đang hoạt động
          </span>
        )
      ),
    },
    {
      key: 'actions',
      header: 'Thao tác',
      headerClassName: 'text-right',
      className: 'text-right whitespace-nowrap',
      render: (row) => (
        <div className="flex items-center justify-end gap-1.5">
          <button
            type="button"
            onClick={() => openEdit(row)}
            className="p-1.5 rounded-lg text-ink-muted hover:text-secondary-700 hover:bg-secondary-50 transition-colors cursor-pointer"
            title="Chỉnh sửa danh mục"
          >
            <Pencil className="size-4" />
          </button>

          {row.isDeleted ? (
            <button
              type="button"
              onClick={() => setRestoreTarget(row)}
              className="p-1.5 rounded-lg text-emerald-600 hover:text-emerald-800 hover:bg-emerald-50 transition-colors cursor-pointer"
              title="Khôi phục danh mục"
              aria-label={`Khôi phục danh mục ${row.name}`}
            >
              <RotateCcw className="size-4" />
            </button>
          ) : (
            <button
              type="button"
              onClick={() => {
                if (Number(row.productCount) > 0) {
                  toast.warning(
                    `Không thể ẩn danh mục "${row.name}" vì vẫn còn ${row.productCount} sản phẩm liên kết.`
                  );
                } else {
                  setHideTarget(row);
                }
              }}
              className={`p-1.5 rounded-lg transition-colors cursor-pointer ${
                Number(row.productCount) > 0
                  ? 'text-gray-300 hover:text-gray-400 hover:bg-gray-50'
                  : 'text-ink-muted hover:text-orange-700 hover:bg-orange-50'
              }`}
              title={
                Number(row.productCount) > 0
                  ? 'Không thể ẩn: Còn sản phẩm liên kết'
                  : 'Ẩn danh mục (ngưng kinh doanh)'
              }
              aria-label={`Ẩn danh mục ${row.name}`}
            >
              <EyeOff className="size-4" />
            </button>
          )}
        </div>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold text-ink">Quản lý danh mục</h1>
          <p className="text-sm text-ink-muted mt-0.5">
            Tạo, chỉnh sửa, kiểm soát liên kết sản phẩm và quản lý trạng thái danh mục
          </p>
        </div>
        <button
          type="button"
          onClick={openCreate}
          className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-primary-700 text-white font-semibold text-sm hover:bg-primary-800 transition-colors cursor-pointer shadow-sm"
        >
          <Plus className="size-4" />
          Thêm danh mục
        </button>
      </div>

      {/* Stat Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <StatCard
          icon={Layers}
          label="Tổng danh mục"
          value={stats.total}
          variant="primary"
          subtext="Toàn bộ danh mục trong hệ thống"
        />
        <StatCard
          icon={CheckCircle2}
          label="Đang hoạt động"
          value={stats.active}
          variant="success"
          subtext="Hiển thị trên gian hàng khách"
        />
        <StatCard
          icon={EyeOff}
          label="Đã ẩn"
          value={stats.hidden}
          variant="secondary"
          subtext="Đã dừng hoặc xóa mềm"
        />
      </div>

      {/* Status Filter Tabs */}
      <div className="flex items-center gap-2 border-b border-line pb-1">
        <button
          type="button"
          onClick={() => setStatusFilter('ALL')}
          className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold transition cursor-pointer ${
            statusFilter === 'ALL'
              ? 'bg-primary-700 text-white'
              : 'text-ink-muted hover:bg-gray-100 hover:text-ink'
          }`}
        >
          Tất cả ({stats.total})
        </button>
        <button
          type="button"
          onClick={() => setStatusFilter('ACTIVE')}
          className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold transition cursor-pointer ${
            statusFilter === 'ACTIVE'
              ? 'bg-primary-700 text-white'
              : 'text-ink-muted hover:bg-gray-100 hover:text-ink'
          }`}
        >
          Đang hoạt động ({stats.active})
        </button>
        <button
          type="button"
          onClick={() => setStatusFilter('HIDDEN')}
          className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold transition cursor-pointer ${
            statusFilter === 'HIDDEN'
              ? 'bg-primary-700 text-white'
              : 'text-ink-muted hover:bg-gray-100 hover:text-ink'
          }`}
        >
          Đã ẩn ({stats.hidden})
        </button>
      </div>

      {/* Table */}
      <Table
        columns={columns}
        data={filteredCategories}
        loading={loading}
        error={error}
        onRetry={fetchCategories}
        emptyTitle="Chưa có danh mục nào phù hợp"
        emptyDescription="Hãy chọn tab trạng thái khác hoặc nhấn 'Thêm danh mục' để tạo mới."
      />

      {/* Form Modal */}
      {isFormOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div
            className="fixed inset-0 bg-black/50 backdrop-blur-sm"
            onClick={closeForm}
            aria-hidden="true"
          />
          <div className="relative z-10 w-full max-w-md bg-white rounded-2xl shadow-2xl p-6">
            <div className="flex items-center justify-between mb-5">
              <h2 className="text-lg font-bold text-ink">
                {editTarget ? 'Chỉnh sửa danh mục' : 'Thêm danh mục mới'}
              </h2>
              <button
                type="button"
                onClick={closeForm}
                className="p-1.5 rounded-lg text-ink-muted hover:text-ink hover:bg-gray-100 transition-colors cursor-pointer"
                disabled={saving}
              >
                <X className="size-5" />
              </button>
            </div>

            <form onSubmit={handleFormSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-semibold text-ink mb-1.5" htmlFor="cat-name">
                  Tên danh mục <span className="text-red-500">*</span>
                </label>
                <input
                  id="cat-name"
                  type="text"
                  value={formName}
                  onChange={(e) => {
                    setFormName(e.target.value);
                    setFormError('');
                  }}
                  placeholder="VD: Đồ chơi, Phụ kiện..."
                  className="h-10 w-full px-3 rounded-lg border border-line bg-page text-sm text-ink placeholder:text-ink-subtle focus:bg-white focus:outline-none focus:border-secondary-500 focus:ring-2 focus:ring-secondary-200 transition-colors"
                  autoFocus
                  disabled={saving}
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-ink mb-1.5" htmlFor="cat-desc">
                  Mô tả <span className="text-ink-subtle font-normal">(tuỳ chọn)</span>
                </label>
                <textarea
                  id="cat-desc"
                  value={formDescription}
                  onChange={(e) => setFormDescription(e.target.value)}
                  placeholder="Mô tả ngắn về danh mục..."
                  rows={3}
                  className="w-full px-3 py-2 rounded-lg border border-line bg-page text-sm text-ink placeholder:text-ink-subtle focus:bg-white focus:outline-none focus:border-secondary-500 focus:ring-2 focus:ring-secondary-200 transition-colors resize-none"
                  disabled={saving}
                />
              </div>

              {formError && <p className="text-sm text-red-600 font-medium">{formError}</p>}

              <div className="flex gap-2.5 pt-1">
                <button
                  type="button"
                  onClick={closeForm}
                  disabled={saving}
                  className="flex-1 h-10 rounded-xl border border-line bg-white text-ink text-sm font-semibold hover:bg-gray-50 transition-colors cursor-pointer disabled:opacity-50"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="flex-1 h-10 rounded-xl bg-primary-700 text-white text-sm font-semibold hover:bg-primary-800 transition-colors cursor-pointer disabled:opacity-60 flex items-center justify-center gap-2"
                >
                  {saving ? (
                    <div className="size-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  ) : (
                    <Check className="size-4" />
                  )}
                  {editTarget ? 'Lưu thay đổi' : 'Thêm danh mục'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Confirm Hide Dialog */}
      <ConfirmDialog
        isOpen={Boolean(hideTarget)}
        onClose={() => !isHiding && setHideTarget(null)}
        onConfirm={handleHideConfirm}
        title="Ẩn danh mục này?"
        description={
          Number(hideTarget?.productCount) > 0 ? (
            <span className="text-red-600 font-medium flex items-center gap-2">
              <AlertTriangle className="size-4 shrink-0" />
              Danh mục này vẫn còn {hideTarget?.productCount} sản phẩm liên kết! Bạn không được phép ẩn danh mục khi còn sản phẩm.
            </span>
          ) : (
            `Bạn có chắc chắn muốn ẩn danh mục "${hideTarget?.name}"? Danh mục này sẽ không còn hiển thị trên gian hàng người dùng.`
          )
        }
        confirmText="Xác nhận ẩn"
        cancelText="Hủy"
        variant="danger"
        loading={isHiding}
        disabled={Number(hideTarget?.productCount) > 0}
      />

      {/* Confirm Restore Dialog */}
      <ConfirmDialog
        isOpen={Boolean(restoreTarget)}
        onClose={() => !isRestoring && setRestoreTarget(null)}
        onConfirm={handleRestoreConfirm}
        title="Khôi phục danh mục?"
        description={`Bạn có chắc chắn muốn khôi phục danh mục "${restoreTarget?.name}"? Danh mục sẽ xuất hiện trở lại trên cửa hàng.`}
        confirmText="Khôi phục"
        cancelText="Hủy"
        loading={isRestoring}
      />
    </div>
  );
}
