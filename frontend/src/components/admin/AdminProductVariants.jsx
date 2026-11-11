import { useState, useMemo } from 'react';
import {
  Plus,
  Pencil,
  Trash2,
  RotateCcw,
  Layers,
  AlertTriangle,
  PackageX,
  Package,
  Sparkles,
} from 'lucide-react';
import Button from '../ui/Button';
import Modal from '../ui/Modal';
import Input from '../ui/Input';
import ConfirmDialog from '../ui/ConfirmDialog';
import { adminApi } from '../../api/admin';
import { toast } from '../../store/toastStore';
import { formatCurrency } from '../../utils/formatCurrency';

// Mapping màu phổ biến sang CSS color swatch
const COLOR_MAP = {
  white: '#ffffff',
  trắng: '#ffffff',
  black: '#111827',
  đen: '#111827',
  gray: '#6b7280',
  grey: '#6b7280',
  xám: '#6b7280',
  ghi: '#9ca3af',
  red: '#ef4444',
  đỏ: '#ef4444',
  blue: '#3b82f6',
  'xanh dương': '#3b82f6',
  navy: '#1e3a8a',
  'xanh navy': '#1e3a8a',
  green: '#10b981',
  'xanh lá': '#10b981',
  yellow: '#f59e0b',
  vàng: '#f59e0b',
  pink: '#ec4899',
  hồng: '#ec4899',
  purple: '#8b5cf6',
  tím: '#8b5cf6',
  brown: '#78350f',
  nâu: '#78350f',
  beige: '#f5f5dc',
  kem: '#fef3c7',
  cam: '#f97316',
  orange: '#f97316',
};

function getColorDot(colorName = '') {
  const normalized = colorName.toLowerCase().trim();
  const hex = COLOR_MAP[normalized] || '#9ca3af';
  const isLight = normalized === 'white' || normalized === 'trắng' || normalized === 'beige' || normalized === 'kem';
  return (
    <span
      className={`size-3.5 rounded-full inline-block shrink-0 shadow-2xs ${isLight ? 'border border-gray-300' : ''}`}
      style={{ backgroundColor: hex }}
      title={colorName}
    />
  );
}

export default function AdminProductVariants({ productId, variants = [], onRefresh }) {
  // Modal Thêm / Sửa
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingVariant, setEditingVariant] = useState(null); // null = Thêm mới
  const [submitting, setSubmitting] = useState(false);

  // Form Fields
  const [sku, setSku] = useState('');
  const [color, setColor] = useState('');
  const [size, setSize] = useState('M');
  const [price, setPrice] = useState('');
  const [stockQuantity, setStockQuantity] = useState('20');
  const [formErrors, setFormErrors] = useState({});

  // Action Dialogs
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [restoreTarget, setRestoreTarget] = useState(null);
  const [isRestoring, setIsRestoring] = useState(false);

  // Thống kê tổng hợp biến thể
  const stats = useMemo(() => {
    const total = variants.length;
    const activeVariants = variants.filter((v) => !v.isDeleted);
    const deletedCount = variants.filter((v) => v.isDeleted).length;
    const totalStock = activeVariants.reduce((sum, v) => sum + (Number(v.stockQuantity) || 0), 0);

    const prices = activeVariants.map((v) => Number(v.price) || 0);
    const minPrice = prices.length > 0 ? Math.min(...prices) : 0;
    const maxPrice = prices.length > 0 ? Math.max(...prices) : 0;

    return { total, activeCount: activeVariants.length, deletedCount, totalStock, minPrice, maxPrice };
  }, [variants]);

  // Mở modal Thêm mới
  const handleOpenAdd = () => {
    setEditingVariant(null);
    setSku(`SKU-${Date.now().toString().slice(-6)}`);
    setColor('');
    setSize('M');
    setPrice(stats.minPrice > 0 ? String(stats.minPrice) : '');
    setStockQuantity('20');
    setFormErrors({});
    setIsModalOpen(true);
  };

  // Mở modal Chỉnh sửa
  const handleOpenEdit = (v) => {
    setEditingVariant(v);
    setSku(v.sku || '');
    setColor(v.color || '');
    setSize(v.size || 'M');
    setPrice(String(v.price || ''));
    setStockQuantity(String(v.stockQuantity ?? 0));
    setFormErrors({});
    setIsModalOpen(true);
  };

  // Validate form
  const validateForm = () => {
    const errors = {};
    if (!sku.trim()) errors.sku = 'Vui lòng nhập mã SKU';
    if (!color.trim()) errors.color = 'Vui lòng nhập màu sắc';
    if (!size.trim()) errors.size = 'Vui lòng nhập kích thước';

    const numPrice = Number(price);
    if (!price || isNaN(numPrice) || numPrice < 0) {
      errors.price = 'Giá bán phải là số lớn hơn hoặc bằng 0';
    }

    const numStock = Number(stockQuantity);
    if (stockQuantity === '' || isNaN(numStock) || numStock < 0 || !Number.isInteger(numStock)) {
      errors.stockQuantity = 'Tồn kho phải là số nguyên ≥ 0';
    }

    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  // Submit Modal
  const handleSubmitVariant = async (e) => {
    e.preventDefault();
    if (!validateForm()) return;

    try {
      setSubmitting(true);
      const payload = {
        sku: sku.trim().toUpperCase(),
        color: color.trim(),
        size: size.trim(),
        price: Number(price),
        stockQuantity: Number(stockQuantity),
      };

      if (editingVariant) {
        await adminApi.updateVariant(editingVariant.id, payload);
        toast.success(`Đã cập nhật biến thể SKU "${payload.sku}" thành công!`);
      } else {
        await adminApi.createVariant(productId, payload);
        toast.success(`Đã thêm biến thể mới SKU "${payload.sku}" thành công!`);
      }

      setIsModalOpen(false);
      if (onRefresh) await onRefresh();
    } catch (err) {
      console.error('Lỗi lưu biến thể:', err);
      toast.error(err.message || 'Không thể lưu biến thể. Vui lòng thử lại.');
    } finally {
      setSubmitting(false);
    }
  };

  // Xóa mềm biến thể
  const handleDeleteVariant = async () => {
    if (!deleteTarget) return;
    try {
      setIsDeleting(true);
      await adminApi.deleteVariant(deleteTarget.id);
      toast.success(`Đã ngừng kinh doanh biến thể SKU "${deleteTarget.sku}".`);
      setDeleteTarget(null);
      if (onRefresh) await onRefresh();
    } catch (err) {
      console.error('Lỗi ngừng kinh doanh biến thể:', err);
      toast.error(err.message || 'Không thể ngừng kinh doanh biến thể.');
    } finally {
      setIsDeleting(false);
    }
  };

  // Khôi phục biến thể
  const handleRestoreVariant = async () => {
    if (!restoreTarget) return;
    try {
      setIsRestoring(true);
      await adminApi.restoreVariant(restoreTarget.id);
      toast.success(`Đã khôi phục biến thể SKU "${restoreTarget.sku}" thành công!`);
      setRestoreTarget(null);
      if (onRefresh) await onRefresh();
    } catch (err) {
      console.error('Lỗi khôi phục biến thể:', err);
      toast.error(err.message || 'Không thể khôi phục biến thể.');
    } finally {
      setIsRestoring(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header & Quick Action */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-5 rounded-xl border border-line bg-white shadow-soft">
        <div>
          <h2 className="text-lg font-bold text-ink flex items-center gap-2">
            <Layers className="size-5 text-primary-700" />
            Bảng danh sách biến thể sản phẩm
          </h2>
          <p className="text-xs text-ink-muted mt-0.5">
            Quản lý chi tiết từng SKU (Màu sắc, Size, Giá bán riêng và Tồn kho từng loại)
          </p>
        </div>

        <Button
          variant="primary"
          leftIcon={Plus}
          onClick={handleOpenAdd}
        >
          Thêm biến thể mới
        </Button>
      </div>

      {/* Summary KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="p-4 rounded-xl border border-line bg-white shadow-2xs flex items-center gap-3">
          <div className="size-11 rounded-lg bg-primary-50 text-primary-700 flex items-center justify-center shrink-0">
            <Layers className="size-5" />
          </div>
          <div>
            <p className="text-xs text-ink-muted">Tổng biến thể</p>
            <p className="text-lg font-bold text-ink">
              {stats.activeCount}{' '}
              <span className="text-xs font-normal text-ink-subtle">
                đang bán {stats.deletedCount > 0 && `(${stats.deletedCount} đã ẩn)`}
              </span>
            </p>
          </div>
        </div>

        <div className="p-4 rounded-xl border border-line bg-white shadow-2xs flex items-center gap-3">
          <div className="size-11 rounded-lg bg-emerald-50 text-emerald-700 flex items-center justify-center shrink-0">
            <Sparkles className="size-5" />
          </div>
          <div>
            <p className="text-xs text-ink-muted">Khoảng giá biến thể</p>
            <p className="text-lg font-bold text-primary-700">
              {stats.minPrice === 0 && stats.maxPrice === 0 ? (
                '0 ₫'
              ) : stats.minPrice === stats.maxPrice ? (
                formatCurrency(stats.minPrice)
              ) : (
                `${formatCurrency(stats.minPrice)} - ${formatCurrency(stats.maxPrice)}`
              )}
            </p>
          </div>
        </div>

        <div className="p-4 rounded-xl border border-line bg-white shadow-2xs flex items-center gap-3">
          <div className="size-11 rounded-lg bg-blue-50 text-blue-700 flex items-center justify-center shrink-0">
            <Package className="size-5" />
          </div>
          <div>
            <p className="text-xs text-ink-muted">Tổng tồn kho các biến thể</p>
            <p className="text-lg font-bold text-ink">
              {stats.totalStock}{' '}
              <span className="text-xs font-normal text-ink-subtle">chiếc</span>
            </p>
          </div>
        </div>
      </div>

      {/* Variants Table */}
      <div className="rounded-xl border border-line bg-white shadow-soft overflow-hidden">
        {variants.length === 0 ? (
          <div className="py-14 text-center px-4">
            <div className="size-12 rounded-full bg-gray-100 text-ink-subtle flex items-center justify-center mx-auto mb-3">
              <Layers className="size-6" />
            </div>
            <h4 className="text-base font-semibold text-ink">Chưa có biến thể nào</h4>
            <p className="text-xs text-ink-muted max-w-sm mx-auto mt-1 mb-4">
              Sản phẩm này hiện chưa thiết lập phân loại màu sắc và kích cỡ. Thêm biến thể đầu tiên để bắt đầu bán hàng.
            </p>
            <Button variant="primary" size="sm" leftIcon={Plus} onClick={handleOpenAdd}>
              Thêm biến thể đầu tiên
            </Button>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-gray-50 border-b border-line text-xs font-semibold text-ink-muted uppercase tracking-wider">
                <tr>
                  <th className="py-3 px-4">Mã SKU</th>
                  <th className="py-3 px-4">Màu sắc</th>
                  <th className="py-3 px-4">Kích cỡ</th>
                  <th className="py-3 px-4">Giá bán</th>
                  <th className="py-3 px-4">Tồn kho</th>
                  <th className="py-3 px-4">Trạng thái</th>
                  <th className="py-3 px-4 text-right">Thao tác</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-line">
                {variants.map((v) => {
                  const isDeleted = Boolean(v.isDeleted);
                  return (
                    <tr
                      key={v.id}
                      className={`transition-colors ${
                        isDeleted ? 'bg-gray-50/70 text-ink-subtle' : 'hover:bg-gray-50/50 text-ink'
                      }`}
                    >
                      {/* SKU */}
                      <td className="py-3.5 px-4">
                        <span
                          className={`font-mono text-xs font-bold px-2 py-0.5 rounded border ${
                            isDeleted
                              ? 'bg-gray-100 text-gray-500 border-gray-200 line-through'
                              : 'bg-page text-ink border-line'
                          }`}
                        >
                          {v.sku}
                        </span>
                      </td>

                      {/* Color */}
                      <td className="py-3.5 px-4">
                        <div className="flex items-center gap-2">
                          {getColorDot(v.color)}
                          <span className={`font-medium ${isDeleted ? 'line-through text-gray-400' : ''}`}>
                            {v.color}
                          </span>
                        </div>
                      </td>

                      {/* Size */}
                      <td className="py-3.5 px-4">
                        <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-semibold bg-gray-100 text-gray-800 border border-gray-200">
                          {v.size}
                        </span>
                      </td>

                      {/* Price */}
                      <td className="py-3.5 px-4 whitespace-nowrap">
                        <span className={`font-bold ${isDeleted ? 'text-gray-400 line-through' : 'text-primary-700'}`}>
                          {formatCurrency(v.price)}
                        </span>
                      </td>

                      {/* Stock */}
                      <td className="py-3.5 px-4 whitespace-nowrap">
                        {v.stockQuantity <= 0 ? (
                          <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-semibold bg-red-100 text-red-700 border border-red-200">
                            <PackageX className="size-3 mr-1" />
                            Hết hàng
                          </span>
                        ) : v.stockQuantity <= 10 ? (
                          <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-semibold bg-amber-100 text-amber-800 border border-amber-200">
                            <AlertTriangle className="size-3 mr-1" />
                            Còn {v.stockQuantity}
                          </span>
                        ) : (
                          <span className="font-semibold">{v.stockQuantity} chiếc</span>
                        )}
                      </td>

                      {/* Status */}
                      <td className="py-3.5 px-4 whitespace-nowrap">
                        {isDeleted ? (
                          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-gray-100 text-gray-600 border border-gray-200">
                            Ngừng bán
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-100 text-emerald-800 border border-emerald-200">
                            <span className="size-1.5 rounded-full bg-emerald-500 inline-block" />
                            Đang bán
                          </span>
                        )}
                      </td>

                      {/* Actions */}
                      <td className="py-3.5 px-4 text-right whitespace-nowrap">
                        <div className="flex items-center justify-end gap-1.5">
                          {isDeleted ? (
                            <button
                              type="button"
                              onClick={() => setRestoreTarget(v)}
                              className="p-1.5 rounded-lg text-emerald-600 hover:text-emerald-800 hover:bg-emerald-50 transition-colors cursor-pointer"
                              title="Khôi phục biến thể"
                              aria-label={`Khôi phục SKU ${v.sku}`}
                            >
                              <RotateCcw className="size-4" />
                            </button>
                          ) : (
                            <>
                              <button
                                type="button"
                                onClick={() => handleOpenEdit(v)}
                                className="p-1.5 rounded-lg text-ink-muted hover:text-secondary-700 hover:bg-secondary-50 transition-colors cursor-pointer"
                                title="Chỉnh sửa biến thể"
                                aria-label={`Sửa SKU ${v.sku}`}
                              >
                                <Pencil className="size-4" />
                              </button>
                              <button
                                type="button"
                                onClick={() => setDeleteTarget(v)}
                                className="p-1.5 rounded-lg text-ink-muted hover:text-red-700 hover:bg-red-50 transition-colors cursor-pointer"
                                title="Ngừng kinh doanh biến thể"
                                aria-label={`Ngừng bán SKU ${v.sku}`}
                              >
                                <Trash2 className="size-4" />
                              </button>
                            </>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Modal Thêm & Chỉnh sửa Biến thể (TASK-FE-09) */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => !submitting && setIsModalOpen(false)}
        title={editingVariant ? `Chỉnh sửa biến thể SKU: ${editingVariant.sku}` : 'Thêm biến thể mới'}
        maxWidth="max-w-lg"
      >
        <form onSubmit={handleSubmitVariant} className="space-y-4 pt-1">
          <Input
            label="Mã SKU"
            name="sku"
            value={sku}
            onChange={(e) => {
              setSku(e.target.value.toUpperCase());
              if (formErrors.sku) setFormErrors((prev) => ({ ...prev, sku: null }));
            }}
            placeholder="VD: SOMI-OXF-WHT-L"
            required
            error={formErrors.sku}
            helperText="Mã định danh duy nhất của biến thể (chữ in hoa)"
          />

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Input
              label="Màu sắc"
              name="color"
              value={color}
              onChange={(e) => {
                setColor(e.target.value);
                if (formErrors.color) setFormErrors((prev) => ({ ...prev, color: null }));
              }}
              placeholder="VD: White, Đen, Xanh..."
              required
              error={formErrors.color}
            />

            <Input
              label="Kích thước (Size)"
              name="size"
              value={size}
              onChange={(e) => {
                setSize(e.target.value);
                if (formErrors.size) setFormErrors((prev) => ({ ...prev, size: null }));
              }}
              placeholder="VD: S, M, L, XL, XXL..."
              required
              error={formErrors.size}
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Input
              label="Giá bán (₫)"
              name="price"
              type="number"
              min="0"
              step="1000"
              value={price}
              onChange={(e) => {
                setPrice(e.target.value);
                if (formErrors.price) setFormErrors((prev) => ({ ...prev, price: null }));
              }}
              placeholder="VD: 380000"
              required
              error={formErrors.price}
              helperText={price && !isNaN(Number(price)) ? formatCurrency(price) : undefined}
            />

            <Input
              label="Tồn kho"
              name="stockQuantity"
              type="number"
              min="0"
              step="1"
              value={stockQuantity}
              onChange={(e) => {
                setStockQuantity(e.target.value);
                if (formErrors.stockQuantity) setFormErrors((prev) => ({ ...prev, stockQuantity: null }));
              }}
              placeholder="VD: 50"
              required
              error={formErrors.stockQuantity}
            />
          </div>

          <div className="flex items-center justify-end gap-2.5 pt-4 border-t border-line">
            <Button
              type="button"
              variant="outline"
              onClick={() => setIsModalOpen(false)}
              disabled={submitting}
            >
              Hủy
            </Button>
            <Button
              type="submit"
              variant="primary"
              loading={submitting}
            >
              {submitting ? 'Đang lưu…' : editingVariant ? 'Lưu thay đổi' : 'Thêm biến thể'}
            </Button>
          </div>
        </form>
      </Modal>

      {/* Confirm Ngừng bán Dialog (TASK-FE-10) */}
      <ConfirmDialog
        isOpen={Boolean(deleteTarget)}
        onClose={() => !isDeleting && setDeleteTarget(null)}
        onConfirm={handleDeleteVariant}
        title="Ngừng kinh doanh biến thể này?"
        description={`Bạn có chắc chắn muốn ngừng kinh doanh biến thể "${deleteTarget?.color} - Size ${deleteTarget?.size}" (SKU: ${deleteTarget?.sku})? Biến thể sẽ bị ẩn khỏi gian hàng.`}
        confirmText="Ngừng kinh doanh"
        cancelText="Hủy"
        variant="danger"
        loading={isDeleting}
      />

      {/* Confirm Khôi phục Dialog (TASK-FE-10) */}
      <ConfirmDialog
        isOpen={Boolean(restoreTarget)}
        onClose={() => !isRestoring && setRestoreTarget(null)}
        onConfirm={handleRestoreVariant}
        title="Khôi phục biến thể này?"
        description={`Bạn có chắc chắn muốn mở bán lại biến thể "${restoreTarget?.color} - Size ${restoreTarget?.size}" (SKU: ${restoreTarget?.sku})?`}
        confirmText="Khôi phục bán"
        cancelText="Hủy"
        variant="primary"
        loading={isRestoring}
      />
    </div>
  );
}

