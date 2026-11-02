import { useState, useEffect, useCallback } from 'react';
import { Layers, Plus, Pencil, Trash2, X, Check } from 'lucide-react';
import Table from '../../components/ui/Table';
import ConfirmDialog from '../../components/ui/ConfirmDialog';
import StatCard from '../../components/admin/StatCard';
import { categoryApi } from '../../api/category';
import { adminApi } from '../../api/admin';
import { toast } from '../../store/toastStore';

export default function AdminCategories() {
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Form modal
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editTarget, setEditTarget] = useState(null);
  const [formName, setFormName] = useState('');
  const [formDescription, setFormDescription] = useState('');
  const [formError, setFormError] = useState('');
  const [saving, setSaving] = useState(false);

  // Delete confirm
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const fetchCategories = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await categoryApi.getCategories();
      setCategories(Array.isArray(res) ? res : (res?.content || []));
    } catch (err) {
      console.error('Lỗi tải danh mục:', err);
      setError(err.message || 'Không thể tải danh sách danh mục.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchCategories();
  }, [fetchCategories]);

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
        await adminApi.updateCategory(editTarget.id, { name: formName.trim(), description: formDescription.trim() });
        toast.success(`Đã cập nhật danh mục "${formName.trim()}".`);
      } else {
        await adminApi.createCategory({ name: formName.trim(), description: formDescription.trim() });
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

  const handleDeleteConfirm = async () => {
    if (!deleteTarget) return;
    try {
      setIsDeleting(true);
      await adminApi.deleteCategory(deleteTarget.id);
      toast.success(`Đã xóa danh mục "${deleteTarget.name}".`);
      setDeleteTarget(null);
      await fetchCategories();
    } catch (err) {
      console.error('Lỗi xóa danh mục:', err);
      toast.error(err.message || 'Không thể xóa danh mục. Vui lòng thử lại.');
    } finally {
      setIsDeleting(false);
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
      render: (row) => <span className="font-semibold text-ink">{row.name}</span>,
    },
    {
      key: 'description',
      header: 'Mô tả',
      render: (row) => (
        <span className="text-sm text-ink-muted line-clamp-1">{row.description || '—'}</span>
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
          <button
            type="button"
            onClick={() => setDeleteTarget(row)}
            className="p-1.5 rounded-lg text-ink-muted hover:text-red-700 hover:bg-red-50 transition-colors cursor-pointer"
            title="Xóa danh mục"
          >
            <Trash2 className="size-4" />
          </button>
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
            Tạo, chỉnh sửa và quản lý các danh mục sản phẩm trong FunnyShop
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

      {/* Stat */}
      <div className="max-w-xs">
        <StatCard
          icon={Layers}
          label="Tổng danh mục"
          value={categories.length}
          variant="primary"
          subtext="Danh mục đang hoạt động"
        />
      </div>

      {/* Table */}
      <Table
        columns={columns}
        data={categories}
        loading={loading}
        error={error}
        onRetry={fetchCategories}
        emptyTitle="Chưa có danh mục nào"
        emptyDescription="Nhấn 'Thêm danh mục' để tạo danh mục đầu tiên."
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
                  onChange={(e) => { setFormName(e.target.value); setFormError(''); }}
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

              {formError && (
                <p className="text-sm text-red-600 font-medium">{formError}</p>
              )}

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

      <ConfirmDialog
        isOpen={Boolean(deleteTarget)}
        onClose={() => !isDeleting && setDeleteTarget(null)}
        onConfirm={handleDeleteConfirm}
        title="Xóa danh mục này?"
        description={`Bạn có chắc chắn muốn xóa danh mục "${deleteTarget?.name}"? Thao tác này không thể hoàn tác.`}
        confirmText="Xóa danh mục"
        cancelText="Hủy"
        variant="danger"
        loading={isDeleting}
      />
    </div>
  );
}
