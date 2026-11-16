import { useState, useEffect, useMemo, useCallback } from 'react';
import {
  Layers,
  Plus,
  Pencil,
  Trash2,
  X,
  RotateCcw,
  EyeOff,
  Package,
  AlertTriangle,
  CheckCircle2,
} from 'lucide-react';
import Table from '../../components/ui/Table';
import ConfirmDialog from '../../components/ui/ConfirmDialog';
import StatCard from '../../components/admin/StatCard';
import Button from '../../components/ui/Button';
import { adminApi } from '../../api/admin';
import { toast } from '../../store/toastStore';

export default function AdminCategories() {
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filterTab, setFilterTab] = useState('ALL'); // 'ALL' | 'ACTIVE' | 'DELETED'

  // Form modal (Thêm / Sửa danh mục)
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editTarget, setEditTarget] = useState(null);
  const [formName, setFormName] = useState('');
  const [formDescription, setFormDescription] = useState('');
  const [formError, setFormError] = useState('');
  const [saving, setSaving] = useState(false);

  // Soft delete (Ẩn danh mục)
  const [softDeleteTarget, setSoftDeleteTarget] = useState(null);
  const [isSoftDeleting, setIsSoftDeleting] = useState(false);

  // Hard delete (Xóa vĩnh viễn)
  const [hardDeleteTarget, setHardDeleteTarget] = useState(null);
  const [isHardDeleting, setIsHardDeleting] = useState(false);

  // Restore (Khôi phục)
  const [restoreTarget, setRestoreTarget] = useState(null);
  const [isRestoring, setIsRestoring] = useState(false);

  // Fetch danh mục từ API Admin (dùng cho refresh sau thao tác)
  const fetchCategories = useCallback(async () => {
    try {
      const res = await adminApi.getCategories();
      const list = Array.isArray(res) ? res : (res?.content || []);
      setCategories(list);
    } catch (err) {
      console.error('Lỗi tải danh mục:', err);
      toast.error(err.response?.data?.message || err.message || 'Không thể tải danh sách danh mục.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    let ignore = false;
    async function load() {
      try {
        const res = await adminApi.getCategories();
        if (!ignore) {
          const list = Array.isArray(res) ? res : (res?.content || []);
          setCategories(list);
        }
      } catch (err) {
        if (!ignore) {
          console.error('Lỗi nạp danh mục ban đầu:', err);
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
  }, []);

  // Thống kê
  const stats = useMemo(() => {
    const total = categories.length;
    const active = categories.filter((c) => !c.isDeleted).length;
    const deleted = categories.filter((c) => c.isDeleted).length;
    return { total, active, deleted };
  }, [categories]);

  // Lọc theo Tab
  const filteredCategories = useMemo(() => {
    if (filterTab === 'ACTIVE') return categories.filter((c) => !c.isDeleted);
    if (filterTab === 'DELETED') return categories.filter((c) => c.isDeleted);
    return categories;
  }, [categories, filterTab]);

  // Mở form thêm mới
  const openCreate = () => {
    setEditTarget(null);
    setFormName('');
    setFormDescription('');
    setFormError('');
    setIsFormOpen(true);
  };

  // Mở form chỉnh sửa
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

  // Lưu danh mục
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
      setFormError(err.response?.data?.message || err.message || 'Không thể lưu danh mục.');
    } finally {
      setSaving(false);
    }
  };

  // Kiểm tra trước khi ẩn
  const handleRequestSoftDelete = (cat) => {
    const count = Number(cat.productCount) || 0;
    if (count > 0) {
      toast.warning(
        `Không thể ẩn danh mục "${cat.name}" vì vẫn còn ${count} sản phẩm đang liên kết. Hãy chuyển các sản phẩm sang danh mục khác trước!`
      );
      return;
    }
    setSoftDeleteTarget(cat);
  };

  // Xác nhận ẩn danh mục
  const handleConfirmSoftDelete = async () => {
    if (!softDeleteTarget) return;
    try {
      setIsSoftDeleting(true);
      await adminApi.deleteCategory(softDeleteTarget.id);
      toast.success(`Đã ẩn danh mục "${softDeleteTarget.name}".`);
      setSoftDeleteTarget(null);
      await fetchCategories();
    } catch (err) {
      console.error('Lỗi ẩn danh mục:', err);
      toast.error(err.response?.data?.message || err.message || 'Không thể ẩn danh mục.');
    } finally {
      setIsSoftDeleting(false);
    }
  };

  // Xác nhận khôi phục danh mục
  const handleConfirmRestore = async () => {
    if (!restoreTarget) return;
    try {
      setIsRestoring(true);
      await adminApi.restoreCategory(restoreTarget.id);
      toast.success(`Đã khôi phục danh mục "${restoreTarget.name}".`);
      setRestoreTarget(null);
      await fetchCategories();
    } catch (err) {
      console.error('Lỗi khôi phục danh mục:', err);
      toast.error(err.response?.data?.message || err.message || 'Không thể khôi phục danh mục.');
    } finally {
      setIsRestoring(false);
    }
  };

  // Kiểm tra trước khi xóa vĩnh viễn
  const handleRequestHardDelete = (cat) => {
    const count = Number(cat.productCount) || 0;
    if (count > 0) {
      toast.warning(
        `Không thể xóa vĩnh viễn danh mục "${cat.name}" vì còn ${count} sản phẩm liên kết!`
      );
      return;
    }
    setHardDeleteTarget(cat);
  };

  // Xác nhận xóa cứng theo chính sách Zero Data Loss (chỉ thông báo, không mất dữ liệu)
  const handleConfirmHardDelete = async () => {
    if (!hardDeleteTarget) return;
    try {
      setIsHardDeleting(true);
      const res = await adminApi.hardDeleteCategory(hardDeleteTarget.id);
      toast.info(res?.message || `Chính sách bảo toàn dữ liệu: Danh mục "${hardDeleteTarget.name}" đã được lưu trữ an toàn ở trạng thái Ẩn, không làm mất dữ liệu khỏi CSDL.`);
      setHardDeleteTarget(null);
      await fetchCategories();
    } catch (err) {
      console.error('Lỗi khi xử lý danh mục:', err);
      toast.error(err.response?.data?.message || err.message || 'Không thể xử lý yêu cầu.');
    } finally {
      setIsHardDeleting(false);
    }
  };

  // Cấu hình bảng
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
        <div>
          <div className="flex items-center gap-2">
            <span className="font-semibold text-ink">{row.name}</span>
            {row.isDeleted ? (
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-gray-100 text-gray-600 border border-gray-300">
                Đã ẩn
              </span>
            ) : (
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200">
                Đang kinh doanh
              </span>
            )}
          </div>
          {row.description && (
            <p className="text-xs text-ink-muted line-clamp-1 mt-0.5">{row.description}</p>
          )}
        </div>
      ),
    },
    {
      key: 'products',
      header: 'Sản phẩm liên kết',
      className: 'whitespace-nowrap',
      render: (row) => {
        const count = Number(row.productCount) || 0;
        return count > 0 ? (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-semibold bg-primary-50 text-primary-700 border border-primary-200">
            <Package className="size-3.5" />
            <span>{count} sản phẩm</span>
          </span>
        ) : (
          <span className="text-xs text-ink-subtle italic">0 sản phẩm (có thể ẩn/xóa)</span>
        );
      },
    },
    {
      key: 'actions',
      header: 'Thao tác',
      headerClassName: 'text-right',
      className: 'text-right whitespace-nowrap',
      render: (row) => (
        <div className="flex items-center justify-end gap-1.5">
          {row.isDeleted ? (
            <>
              <button
                type="button"
                onClick={() => setRestoreTarget(row)}
                className="p-1.5 rounded-lg text-emerald-600 hover:text-emerald-800 hover:bg-emerald-50 transition-colors cursor-pointer"
                title="Khôi phục danh mục"
                aria-label={`Khôi phục ${row.name}`}
              >
                <RotateCcw className="size-4" />
              </button>
              <button
                type="button"
                onClick={() => handleRequestHardDelete(row)}
                className="p-1.5 rounded-lg text-ink-muted hover:text-red-700 hover:bg-red-50 transition-colors cursor-pointer"
                title="Xóa vĩnh viễn danh mục"
                aria-label={`Xóa vĩnh viễn ${row.name}`}
              >
                <Trash2 className="size-4" />
              </button>
            </>
          ) : (
            <>
              <button
                type="button"
                onClick={() => openEdit(row)}
                className="p-1.5 rounded-lg text-ink-muted hover:text-secondary-700 hover:bg-secondary-50 transition-colors cursor-pointer"
                title="Chỉnh sửa danh mục"
                aria-label={`Chỉnh sửa ${row.name}`}
              >
                <Pencil className="size-4" />
              </button>
              <button
                type="button"
                onClick={() => handleRequestSoftDelete(row)}
                className={`p-1.5 rounded-lg transition-colors cursor-pointer ${
                  (Number(row.productCount) || 0) > 0
                    ? 'text-gray-400 hover:text-amber-600 hover:bg-amber-50'
                    : 'text-ink-muted hover:text-orange-700 hover:bg-orange-50'
                }`}
                title={
                  (Number(row.productCount) || 0) > 0
                    ? `Còn ${row.productCount} sản phẩm, không thể ẩn`
                    : 'Ẩn danh mục (Dừng bán)'
                }
                aria-label={`Ẩn danh mục ${row.name}`}
              >
                <EyeOff className="size-4" />
              </button>
            </>
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
            Quản lý các nhóm thời trang, kiểm soát liên kết sản phẩm và trạng thái hiển thị
          </p>
        </div>
        <Button variant="primary" leftIcon={Plus} onClick={openCreate}>
          Thêm danh mục
        </Button>
      </div>

      {/* StatCards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <StatCard
          icon={Layers}
          label="Tổng danh mục"
          value={stats.total}
          variant="primary"
          subtext="Toàn bộ danh mục hệ thống"
        />
        <StatCard
          icon={CheckCircle2}
          label="Đang hoạt động"
          value={stats.active}
          variant="success"
          subtext="Hiển thị cho khách hàng"
        />
        <StatCard
          icon={AlertTriangle}
          label="Đã ẩn"
          value={stats.deleted}
          variant="warning"
          subtext="Không hiện trên cửa hàng"
        />
      </div>

      {/* Filter Tabs */}
      <div className="flex items-center gap-2 p-1.5 rounded-xl bg-gray-100/80 w-fit">
        <button
          type="button"
          onClick={() => setFilterTab('ALL')}
          className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
            filterTab === 'ALL'
              ? 'bg-white text-ink shadow-xs'
              : 'text-ink-muted hover:text-ink'
          }`}
        >
          Tất cả ({categories.length})
        </button>
        <button
          type="button"
          onClick={() => setFilterTab('ACTIVE')}
          className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
            filterTab === 'ACTIVE'
              ? 'bg-white text-emerald-700 shadow-xs'
              : 'text-ink-muted hover:text-ink'
          }`}
        >
          Đang hoạt động ({stats.active})
        </button>
        <button
          type="button"
          onClick={() => setFilterTab('DELETED')}
          className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
            filterTab === 'DELETED'
              ? 'bg-white text-gray-700 shadow-xs'
              : 'text-ink-muted hover:text-ink'
          }`}
        >
          Đã ẩn ({stats.deleted})
        </button>
      </div>

      {/* Table */}
      <div className="bg-white rounded-2xl border border-line shadow-soft overflow-hidden">
        <Table
          columns={columns}
          data={filteredCategories}
          loading={loading}
          emptyMessage="Chưa có danh mục nào phù hợp với bộ lọc."
        />
      </div>

      {/* Form Modal (Thêm / Sửa) */}
      {isFormOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-xs animate-in fade-in duration-200">
          <div className="w-full max-w-md bg-white rounded-2xl border border-line p-6 shadow-xl space-y-5 animate-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between border-b border-line pb-3">
              <h3 className="text-lg font-bold text-ink">
                {editTarget ? 'Chỉnh sửa danh mục' : 'Thêm mới danh mục'}
              </h3>
              <button
                type="button"
                onClick={closeForm}
                className="p-1 rounded-lg text-ink-subtle hover:text-ink hover:bg-gray-100 transition cursor-pointer"
              >
                <X className="size-5" />
              </button>
            </div>

            {formError && (
              <div className="p-3 rounded-lg bg-red-50 text-red-700 border border-red-200 text-xs">
                {formError}
              </div>
            )}

            <form onSubmit={handleFormSubmit} className="space-y-4">
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-ink">
                  Tên danh mục <span className="text-red-600">*</span>
                </label>
                <input
                  type="text"
                  value={formName}
                  onChange={(e) => setFormName(e.target.value)}
                  placeholder="Ví dụ: Áo Sơ Mi Nam"
                  className="w-full h-10 px-3 rounded-lg border border-line bg-page text-sm text-ink focus:bg-white focus:outline-none focus:border-secondary-500 focus:ring-2 focus:ring-secondary-200"
                  required
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-ink">Mô tả danh mục</label>
                <textarea
                  rows={3}
                  value={formDescription}
                  onChange={(e) => setFormDescription(e.target.value)}
                  placeholder="Mô tả phong cách hoặc thông tin danh mục..."
                  className="w-full p-3 rounded-lg border border-line bg-page text-sm text-ink focus:bg-white focus:outline-none focus:border-secondary-500 focus:ring-2 focus:ring-secondary-200"
                />
              </div>

              <div className="flex items-center justify-end gap-2.5 pt-2 border-t border-line">
                <Button variant="ghost" onClick={closeForm} disabled={saving}>
                  Hủy
                </Button>
                <Button type="submit" variant="primary" loading={saving}>
                  {editTarget ? 'Lưu thay đổi' : 'Thêm danh mục'}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Confirm Soft Delete (Ẩn danh mục) */}
      <ConfirmDialog
        isOpen={Boolean(softDeleteTarget)}
        onClose={() => setSoftDeleteTarget(null)}
        onConfirm={handleConfirmSoftDelete}
        title={`Ẩn danh mục "${softDeleteTarget?.name}"?`}
        message="Danh mục này sẽ bị ẩn khỏi cửa hàng của khách hàng. Bạn có thể khôi phục lại bất kỳ lúc nào."
        confirmText="Xác nhận ẩn"
        confirmVariant="warning"
        loading={isSoftDeleting}
      />

      {/* Confirm Restore (Khôi phục) */}
      <ConfirmDialog
        isOpen={Boolean(restoreTarget)}
        onClose={() => setRestoreTarget(null)}
        onConfirm={handleConfirmRestore}
        title={`Khôi phục danh mục "${restoreTarget?.name}"?`}
        message="Danh mục này sẽ hiển thị trở lại trên thanh điều hướng và bộ lọc sản phẩm của cửa hàng."
        confirmText="Xác nhận khôi phục"
        confirmVariant="primary"
        loading={isRestoring}
      />

      {/* Confirm Hard Delete (Chính sách Zero Data Loss) */}
      <ConfirmDialog
        isOpen={Boolean(hardDeleteTarget)}
        onClose={() => setHardDeleteTarget(null)}
        onConfirm={handleConfirmHardDelete}
        title="Chính sách bảo toàn dữ liệu (Không mất dữ liệu)"
        message={`Danh mục "${hardDeleteTarget?.name}" sẽ được lưu trữ an toàn ở trạng thái Đã ẩn. Để bảo toàn tính toàn vẹn hệ thống, dữ liệu không bị xóa vĩnh viễn khỏi CSDL.`}
        confirmText="Xác nhận lưu trữ an toàn"
        confirmVariant="warning"
        loading={isHardDeleting}
      />
    </div>
  );
}
