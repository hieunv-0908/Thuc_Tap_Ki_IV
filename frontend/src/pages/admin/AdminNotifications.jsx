import { useState, useEffect, useCallback } from 'react';
import {
  Bell,
  Plus,
  Pencil,
  Trash2,
  Power,
  Search,
  X,
  ChevronLeft,
  ChevronRight,
  Tag,
  Megaphone,
  Package,
  Settings,
} from 'lucide-react';
import {
  adminGetNotifications,
  adminGetNotificationById,
  adminCreateNotification,
  adminUpdateNotification,
  adminDeleteNotification,
  adminToggleStatus,
} from '../../api/notification';
import { toast } from '../../store/toastStore';
import ConfirmDialog from '../../components/ui/ConfirmDialog';

/* ─────────── Constants ─────────── */
const TYPE_OPTIONS = [
  { value: '', label: 'Tất cả loại' },
  { value: 'PROMOTION', label: 'Ưu đãi' },
  { value: 'VOUCHER', label: 'Voucher' },
  { value: 'SYSTEM', label: 'Hệ thống' },
  { value: 'ORDER', label: 'Đơn hàng' },
];

const TARGET_OPTIONS = [
  { value: '', label: 'Tất cả đối tượng' },
  { value: 'ALL', label: 'Tất cả người dùng' },
  { value: 'SPECIFIC', label: 'Người dùng cụ thể' },
];

const TYPE_LABELS = {
  PROMOTION: { label: 'Ưu đãi', color: 'text-orange-600 bg-orange-50 border-orange-200', icon: Megaphone },
  VOUCHER: { label: 'Voucher', color: 'text-green-600 bg-green-50 border-green-200', icon: Tag },
  SYSTEM: { label: 'Hệ thống', color: 'text-blue-600 bg-blue-50 border-blue-200', icon: Settings },
  ORDER: { label: 'Đơn hàng', color: 'text-purple-600 bg-purple-50 border-purple-200', icon: Package },
};

const EMPTY_FORM = {
  title: '',
  content: '',
  type: 'SYSTEM',
  target: 'ALL',
  userId: '',
  targetUrl: '',
  imageUrl: '',
  isActive: true,
};

/* ─────────── Modal ─────────── */
function NotificationModal({ isOpen, onClose, editData, onSaved }) {
  const [form, setForm] = useState(EMPTY_FORM);
  const [saving, setSaving] = useState(false);
  const [errors, setErrors] = useState({});

  useEffect(() => {
    if (isOpen) {
      if (editData) {
        setForm({
          title: editData.title || '',
          content: editData.content || '',
          type: editData.type || 'SYSTEM',
          target: editData.target || 'ALL',
          userId: editData.userId || '',
          targetUrl: editData.targetUrl || '',
          imageUrl: editData.imageUrl || '',
          isActive: editData.isActive ?? true,
        });
      } else {
        setForm(EMPTY_FORM);
      }
      setErrors({});
    }
  }, [isOpen, editData]);

  const validate = () => {
    const errs = {};
    if (!form.title.trim()) errs.title = 'Tiêu đề không được để trống';
    if (!form.content.trim()) errs.content = 'Nội dung không được để trống';
    if (form.target === 'SPECIFIC' && !form.userId) errs.userId = 'Vui lòng nhập ID người dùng nhận';
    return errs;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const errs = validate();
    if (Object.keys(errs).length > 0) {
      setErrors(errs);
      return;
    }
    setSaving(true);
    try {
      const payload = {
        title: form.title.trim(),
        content: form.content.trim(),
        type: form.type,
        target: form.target,
        userId: form.target === 'SPECIFIC' ? (form.userId ? Number(form.userId) : null) : null,
        targetUrl: form.targetUrl.trim() || null,
        imageUrl: form.imageUrl.trim() || null,
        isActive: form.isActive,
      };
      if (editData) {
        await adminUpdateNotification(editData.id, payload);
        toast.success('Đã cập nhật thông báo');
      } else {
        await adminCreateNotification(payload);
        toast.success('Đã tạo thông báo mới');
      }
      onSaved();
      onClose();
    } catch (err) {
      toast.error(err?.response?.data?.message || 'Có lỗi xảy ra');
    } finally {
      setSaving(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/40" onClick={onClose} />

      {/* Panel */}
      <div className="relative bg-paper border border-line shadow-xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-line">
          <h2 className="text-base font-semibold text-ink">
            {editData ? 'Chỉnh sửa thông báo' : 'Tạo thông báo mới'}
          </h2>
          <button type="button" onClick={onClose} className="p-1.5 hover:bg-sand/50 rounded transition-colors cursor-pointer">
            <X className="size-4 text-ink-muted" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {/* Tiêu đề */}
          <div>
            <label className="block text-xs font-semibold text-ink-muted uppercase tracking-wider mb-1.5">
              Tiêu đề <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={form.title}
              onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))}
              placeholder="VD: Khuyến mãi mùa hè 50%"
              className={`w-full px-3 py-2 border text-sm bg-paper text-ink outline-none focus:border-ink transition-colors ${
                errors.title ? 'border-red-400' : 'border-line'
              }`}
            />
            {errors.title && <p className="text-xs text-red-500 mt-1">{errors.title}</p>}
          </div>

          {/* Nội dung */}
          <div>
            <label className="block text-xs font-semibold text-ink-muted uppercase tracking-wider mb-1.5">
              Nội dung <span className="text-red-500">*</span>
            </label>
            <textarea
              rows={3}
              value={form.content}
              onChange={(e) => setForm((f) => ({ ...f, content: e.target.value }))}
              placeholder="Mô tả chi tiết thông báo..."
              className={`w-full px-3 py-2 border text-sm bg-paper text-ink outline-none focus:border-ink transition-colors resize-none ${
                errors.content ? 'border-red-400' : 'border-line'
              }`}
            />
            {errors.content && <p className="text-xs text-red-500 mt-1">{errors.content}</p>}
          </div>

          {/* Loại + Đối tượng */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-ink-muted uppercase tracking-wider mb-1.5">
                Loại <span className="text-red-500">*</span>
              </label>
              <select
                value={form.type}
                onChange={(e) => setForm((f) => ({ ...f, type: e.target.value }))}
                className="w-full px-3 py-2 border border-line text-sm bg-paper text-ink outline-none focus:border-ink transition-colors cursor-pointer"
              >
                {TYPE_OPTIONS.filter((o) => o.value).map((o) => (
                  <option key={o.value} value={o.value}>{o.label}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs font-semibold text-ink-muted uppercase tracking-wider mb-1.5">
                Đối tượng <span className="text-red-500">*</span>
              </label>
              <select
                value={form.target}
                onChange={(e) => setForm((f) => ({ ...f, target: e.target.value, userId: '' }))}
                className="w-full px-3 py-2 border border-line text-sm bg-paper text-ink outline-none focus:border-ink transition-colors cursor-pointer"
              >
                {TARGET_OPTIONS.filter((o) => o.value).map((o) => (
                  <option key={o.value} value={o.value}>{o.label}</option>
                ))}
              </select>
            </div>
          </div>

          {/* User ID nếu SPECIFIC */}
          {form.target === 'SPECIFIC' && (
            <div>
              <label className="block text-xs font-semibold text-ink-muted uppercase tracking-wider mb-1.5">
                ID người nhận <span className="text-red-500">*</span>
              </label>
              <input
                type="number"
                value={form.userId}
                onChange={(e) => setForm((f) => ({ ...f, userId: e.target.value }))}
                placeholder="Nhập ID người dùng"
                className={`w-full px-3 py-2 border text-sm bg-paper text-ink outline-none focus:border-ink transition-colors ${
                  errors.userId ? 'border-red-400' : 'border-line'
                }`}
              />
              {errors.userId && <p className="text-xs text-red-500 mt-1">{errors.userId}</p>}
            </div>
          )}

          {/* Link + Ảnh */}
          <div>
            <label className="block text-xs font-semibold text-ink-muted uppercase tracking-wider mb-1.5">
              Link chuyển hướng
            </label>
            <input
              type="text"
              value={form.targetUrl}
              onChange={(e) => setForm((f) => ({ ...f, targetUrl: e.target.value }))}
              placeholder="/vouchers, /products/123, ..."
              className="w-full px-3 py-2 border border-line text-sm bg-paper text-ink outline-none focus:border-ink transition-colors"
            />
          </div>

          {/* Phát ngay */}
          <div className="flex items-center gap-3 pt-1">
            <button
              type="button"
              onClick={() => setForm((f) => ({ ...f, isActive: !f.isActive }))}
              className={`relative inline-flex h-5 w-9 items-center rounded-full transition-colors cursor-pointer ${
                form.isActive ? 'bg-primary-600' : 'bg-gray-300'
              }`}
            >
              <span
                className={`inline-block size-4 transform rounded-full bg-white shadow transition-transform ${
                  form.isActive ? 'translate-x-4' : 'translate-x-0.5'
                }`}
              />
            </button>
            <span className="text-sm text-ink-muted">
              {form.isActive ? 'Phát thông báo ngay' : 'Lưu nháp (chưa phát)'}
            </span>
          </div>

          {/* Actions */}
          <div className="flex gap-3 pt-2 border-t border-line">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 py-2 border border-line text-sm text-ink-muted hover:border-ink hover:text-ink transition-colors cursor-pointer"
            >
              Hủy
            </button>
            <button
              type="submit"
              disabled={saving}
              className="flex-1 py-2 bg-ink text-paper text-sm font-medium hover:bg-ink/80 transition-colors disabled:opacity-50 cursor-pointer"
            >
              {saving ? 'Đang lưu...' : editData ? 'Lưu thay đổi' : 'Tạo thông báo'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

/* ─────────── Main Page ─────────── */
export default function AdminNotifications() {
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [totalElements, setTotalElements] = useState(0);

  // Filters
  const [filterType, setFilterType] = useState('');
  const [filterTarget, setFilterTarget] = useState('');
  const [filterActive, setFilterActive] = useState('');
  const [keyword, setKeyword] = useState('');
  const [keywordInput, setKeywordInput] = useState('');

  // Modal
  const [modalOpen, setModalOpen] = useState(false);
  const [editData, setEditData] = useState(null);

  // Delete confirm
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [deleting, setDeleting] = useState(false);

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const params = { page, size: 10 };
      if (filterType) params.type = filterType;
      if (filterTarget) params.target = filterTarget;
      if (filterActive !== '') params.isActive = filterActive === 'true';
      if (keyword) params.keyword = keyword;
      const data = await adminGetNotifications(params);
      setNotifications(data.content || []);
      setTotalPages(data.totalPages || 0);
      setTotalElements(data.totalElements || 0);
    } catch (err) {
      toast.error('Không thể tải danh sách thông báo');
    } finally {
      setLoading(false);
    }
  }, [page, filterType, filterTarget, filterActive, keyword]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleSearch = (e) => {
    e.preventDefault();
    setKeyword(keywordInput);
    setPage(0);
  };

  const handleFilterChange = (setter) => (e) => {
    setter(e.target.value);
    setPage(0);
  };

  const openCreate = () => {
    setEditData(null);
    setModalOpen(true);
  };

  const openEdit = async (n) => {
    try {
      const detail = await adminGetNotificationById(n.id);
      setEditData(detail);
      setModalOpen(true);
    } catch {
      toast.error('Không thể tải dữ liệu thông báo');
    }
  };

  const handleToggle = async (n) => {
    try {
      await adminToggleStatus(n.id);
      setNotifications((prev) =>
        prev.map((item) => (item.id === n.id ? { ...item, isActive: !item.isActive } : item))
      );
      toast.success(n.isActive ? 'Đã tạm dừng phát thông báo' : 'Đã bật phát thông báo');
    } catch {
      toast.error('Có lỗi xảy ra');
    }
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    setDeleting(true);
    try {
      await adminDeleteNotification(deleteTarget.id);
      toast.success('Đã xóa thông báo');
      setDeleteTarget(null);
      fetchData();
    } catch {
      toast.error('Không thể xóa thông báo');
    } finally {
      setDeleting(false);
    }
  };

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold text-ink tracking-tight">Quản lý thông báo</h1>
          <p className="text-sm text-ink-muted mt-0.5">
            {totalElements} thông báo tổng cộng
          </p>
        </div>
        <button
          type="button"
          onClick={openCreate}
          className="flex items-center gap-2 px-4 py-2 bg-ink text-paper text-sm font-medium hover:bg-ink/80 transition-colors cursor-pointer"
        >
          <Plus className="size-4" />
          Tạo thông báo
        </button>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-3 items-center bg-paper border border-line p-4">
        {/* Search */}
        <form onSubmit={handleSearch} className="flex gap-2 flex-1 min-w-48">
          <div className="relative flex-1">
            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 size-4 text-ink-muted" />
            <input
              type="text"
              value={keywordInput}
              onChange={(e) => setKeywordInput(e.target.value)}
              placeholder="Tìm theo tiêu đề..."
              className="w-full pl-8 pr-3 py-1.5 border border-line text-sm bg-paper text-ink outline-none focus:border-ink transition-colors"
            />
          </div>
          <button
            type="submit"
            className="px-3 py-1.5 border border-line text-sm text-ink hover:border-ink transition-colors cursor-pointer"
          >
            Tìm
          </button>
          {(keyword || keywordInput) && (
            <button
              type="button"
              onClick={() => { setKeyword(''); setKeywordInput(''); setPage(0); }}
              className="p-1.5 border border-line text-ink-muted hover:text-ink transition-colors cursor-pointer"
            >
              <X className="size-4" />
            </button>
          )}
        </form>

        {/* Type Filter */}
        <select
          value={filterType}
          onChange={handleFilterChange(setFilterType)}
          className="px-3 py-1.5 border border-line text-sm bg-paper text-ink outline-none focus:border-ink transition-colors cursor-pointer"
        >
          {TYPE_OPTIONS.map((o) => (
            <option key={o.value} value={o.value}>{o.label}</option>
          ))}
        </select>

        {/* Target Filter */}
        <select
          value={filterTarget}
          onChange={handleFilterChange(setFilterTarget)}
          className="px-3 py-1.5 border border-line text-sm bg-paper text-ink outline-none focus:border-ink transition-colors cursor-pointer"
        >
          {TARGET_OPTIONS.map((o) => (
            <option key={o.value} value={o.value}>{o.label}</option>
          ))}
        </select>

        {/* Status Filter */}
        <select
          value={filterActive}
          onChange={handleFilterChange(setFilterActive)}
          className="px-3 py-1.5 border border-line text-sm bg-paper text-ink outline-none focus:border-ink transition-colors cursor-pointer"
        >
          <option value="">Tất cả trạng thái</option>
          <option value="true">Đang phát</option>
          <option value="false">Tạm dừng</option>
        </select>
      </div>

      {/* Table */}
      <div className="bg-paper border border-line overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-line bg-sand/30">
              <th className="text-left px-4 py-3 font-semibold text-ink-muted text-xs uppercase tracking-wider">Thông báo</th>
              <th className="text-left px-4 py-3 font-semibold text-ink-muted text-xs uppercase tracking-wider w-24">Loại</th>
              <th className="text-left px-4 py-3 font-semibold text-ink-muted text-xs uppercase tracking-wider w-32">Đối tượng</th>
              <th className="text-left px-4 py-3 font-semibold text-ink-muted text-xs uppercase tracking-wider w-28">Trạng thái</th>
              <th className="text-left px-4 py-3 font-semibold text-ink-muted text-xs uppercase tracking-wider w-32">Ngày tạo</th>
              <th className="text-right px-4 py-3 font-semibold text-ink-muted text-xs uppercase tracking-wider w-32">Hành động</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              Array.from({ length: 5 }).map((_, i) => (
                <tr key={i} className="border-b border-line">
                  <td className="px-4 py-3" colSpan={6}>
                    <div className="animate-pulse h-4 bg-gray-200 rounded w-3/4" />
                  </td>
                </tr>
              ))
            ) : notifications.length === 0 ? (
              <tr>
                <td colSpan={6} className="px-4 py-16 text-center text-ink-muted">
                  <Bell className="size-10 mx-auto mb-2 opacity-20" />
                  <p>Không có thông báo nào</p>
                </td>
              </tr>
            ) : (
              notifications.map((n) => {
                const typeInfo = TYPE_LABELS[n.type] || { label: n.type, color: 'text-gray-600 bg-gray-50 border-gray-200', icon: Bell };
                const TypeIcon = typeInfo.icon;
                return (
                  <tr key={n.id} className="border-b border-line hover:bg-sand/20 transition-colors">
                    {/* Tiêu đề + Nội dung */}
                    <td className="px-4 py-3">
                      <p className="font-medium text-ink truncate max-w-xs">{n.title}</p>
                      <p className="text-xs text-ink-muted mt-0.5 truncate max-w-xs">{n.content}</p>
                    </td>

                    {/* Loại */}
                    <td className="px-4 py-3">
                      <span className={`inline-flex items-center gap-1 text-xs px-2 py-0.5 rounded border font-medium ${typeInfo.color}`}>
                        <TypeIcon className="size-3" />
                        {typeInfo.label}
                      </span>
                    </td>

                    {/* Đối tượng */}
                    <td className="px-4 py-3 text-xs text-ink-muted">
                      {n.target === 'ALL' ? 'Tất cả' : `Người dùng #${n.userId || '?'}`}
                    </td>

                    {/* Trạng thái */}
                    <td className="px-4 py-3">
                      <span
                        className={`inline-flex items-center gap-1 text-xs px-2 py-0.5 rounded-full font-medium ${
                          n.isActive
                            ? 'bg-green-50 text-green-700 border border-green-200'
                            : 'bg-gray-100 text-gray-500 border border-gray-200'
                        }`}
                      >
                        <span className={`size-1.5 rounded-full ${n.isActive ? 'bg-green-500' : 'bg-gray-400'}`} />
                        {n.isActive ? 'Đang phát' : 'Tạm dừng'}
                      </span>
                    </td>

                    {/* Ngày tạo */}
                    <td className="px-4 py-3 text-xs text-ink-muted">
                      {n.createdAt ? new Date(n.createdAt).toLocaleDateString('vi-VN') : '—'}
                    </td>

                    {/* Actions */}
                    <td className="px-4 py-3">
                      <div className="flex items-center justify-end gap-1">
                        {/* Toggle */}
                        <button
                          type="button"
                          title={n.isActive ? 'Tạm dừng' : 'Bật phát'}
                          onClick={() => handleToggle(n)}
                          className={`p-1.5 rounded transition-colors cursor-pointer ${
                            n.isActive
                              ? 'text-green-600 hover:bg-green-50'
                              : 'text-gray-400 hover:bg-gray-100'
                          }`}
                        >
                          <Power className="size-4" />
                        </button>

                        {/* Edit */}
                        <button
                          type="button"
                          title="Chỉnh sửa"
                          onClick={() => openEdit(n)}
                          className="p-1.5 rounded text-ink-muted hover:text-ink hover:bg-sand/50 transition-colors cursor-pointer"
                        >
                          <Pencil className="size-4" />
                        </button>

                        {/* Delete */}
                        <button
                          type="button"
                          title="Xóa"
                          onClick={() => setDeleteTarget(n)}
                          className="p-1.5 rounded text-ink-muted hover:text-red-600 hover:bg-red-50 transition-colors cursor-pointer"
                        >
                          <Trash2 className="size-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between">
          <p className="text-sm text-ink-muted">
            Trang {page + 1} / {totalPages} ({totalElements} thông báo)
          </p>
          <div className="flex items-center gap-2">
            <button
              type="button"
              disabled={page === 0}
              onClick={() => setPage((p) => p - 1)}
              className="p-2 border border-line hover:border-ink transition-colors disabled:opacity-30 cursor-pointer"
            >
              <ChevronLeft className="size-4" />
            </button>
            <button
              type="button"
              disabled={page >= totalPages - 1}
              onClick={() => setPage((p) => p + 1)}
              className="p-2 border border-line hover:border-ink transition-colors disabled:opacity-30 cursor-pointer"
            >
              <ChevronRight className="size-4" />
            </button>
          </div>
        </div>
      )}

      {/* Create / Edit Modal */}
      <NotificationModal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        editData={editData}
        onSaved={fetchData}
      />

      {/* Delete Confirm */}
      <ConfirmDialog
        isOpen={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        onConfirm={handleDelete}
        title="Xác nhận xóa thông báo"
        description={`Bạn có chắc muốn xóa thông báo "${deleteTarget?.title}"? Hành động này không thể hoàn tác.`}
        confirmText={deleting ? 'Đang xóa...' : 'Xóa thông báo'}
        cancelText="Hủy"
        variant="danger"
      />
    </div>
  );
}

