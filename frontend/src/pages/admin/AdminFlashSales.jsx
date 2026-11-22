import { useState, useEffect, useCallback } from 'react';
import {
  Zap,
  Plus,
  Pencil,
  Trash2,
  Power,
  X,
  Check,
  Search,
} from 'lucide-react';
import Button from '../../components/ui/Button';
import Input from '../../components/ui/Input';
import Table from '../../components/ui/Table';
import ConfirmDialog from '../../components/ui/ConfirmDialog';
import { flashSaleApi } from '../../api/flashSale';
import { categoryApi } from '../../api/category';
import { productApi } from '../../api/product';
import { toast } from '../../store/toastStore';
import { formatDate } from '../../utils/formatDate';

export default function AdminFlashSales() {
  const [sales, setSales] = useState([]);
  const [loading, setLoading] = useState(true);
  const [categories, setCategories] = useState([]);
  const [products, setProducts] = useState([]);

  // Modal create/edit
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingSale, setEditingSale] = useState(null);
  const [saving, setSaving] = useState(false);

  // Form State
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    startTime: '',
    endTime: '',
    discountPercent: 30,
    scope: 'ALL',
    categoryIds: [],
    items: [],
    isActive: true,
  });

  const [productSearch, setProductSearch] = useState('');

  // Delete Confirm
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const fetchSales = useCallback(async () => {
    try {
      setLoading(true);
      const res = await flashSaleApi.getAllFlashSales();
      const list = res?.data || res || [];
      setSales(Array.isArray(list) ? list : []);
    } catch (err) {
      toast.error(err.response?.data?.message || err.message || 'Không thể tải danh sách Flash Sale');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    let ignore = false;

    async function loadData() {
      try {
        setLoading(true);
        const res = await flashSaleApi.getAllFlashSales();
        if (!ignore) {
          const list = res?.data || res || [];
          setSales(Array.isArray(list) ? list : []);
        }
      } catch (err) {
        if (!ignore) {
          toast.error(err.response?.data?.message || err.message || 'Không thể tải danh sách Flash Sale');
        }
      } finally {
        if (!ignore) {
          setLoading(false);
        }
      }

      try {
        const res = await categoryApi.getCategories();
        if (!ignore) {
          const list = res?.data || res || [];
          setCategories(Array.isArray(list) ? list : []);
        }
      } catch {
        // ignore
      }

      try {
        const res = await productApi.getProducts({ size: 100 });
        if (!ignore) {
          const data = res?.data || res;
          const content = data?.content || (Array.isArray(data) ? data : []);
          setProducts(content);
        }
      } catch {
        // ignore
      }
    }

    loadData();

    return () => {
      ignore = true;
    };
  }, []);

  const handleOpenAdd = () => {
    const now = new Date();
    const startStr = new Date(now.getTime() - now.getTimezoneOffset() * 60000).toISOString().slice(0, 16);
    const endStr = new Date(now.getTime() + 24 * 60 * 60 * 1000 - now.getTimezoneOffset() * 60000).toISOString().slice(0, 16);

    setEditingSale(null);
    setFormData({
      name: 'Flash Sale Giờ Vàng',
      description: 'Giảm giá cực sốc có hạn trong ngày',
      startTime: startStr,
      endTime: endStr,
      discountPercent: 30,
      scope: 'ALL',
      categoryIds: [],
      items: [],
      isActive: true,
    });
    setIsModalOpen(true);
  };

  const handleOpenEdit = (sale) => {
    setEditingSale(sale);
    const startStr = sale.startTime ? sale.startTime.slice(0, 16) : '';
    const endStr = sale.endTime ? sale.endTime.slice(0, 16) : '';

    setFormData({
      name: sale.name || '',
      description: sale.description || '',
      startTime: startStr,
      endTime: endStr,
      discountPercent: sale.discountPercent || 30,
      scope: sale.scope || 'ALL',
      categoryIds: sale.categoryIds || [],
      items: (sale.items || []).map((i) => ({
        productId: i.productId,
        discountPercent: i.discountPercent,
        flashSaleStock: i.flashSaleStock || 50,
      })),
      isActive: sale.isActive ?? true,
    });
    setIsModalOpen(true);
  };

  const handleToggleActive = async (id) => {
    try {
      await flashSaleApi.toggleActive(id);
      toast.success('Cập nhật trạng thái thành công');
      fetchSales();
    } catch (err) {
      toast.error(err.response?.data?.message || err.message || 'Lỗi cập nhật trạng thái');
    }
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    try {
      setIsDeleting(true);
      await flashSaleApi.deleteFlashSale(deleteTarget.id);
      toast.success('Đã xóa chiến dịch Flash Sale');
      setDeleteTarget(null);
      fetchSales();
    } catch (err) {
      toast.error(err.response?.data?.message || err.message || 'Không thể xóa Flash Sale');
    } finally {
      setIsDeleting(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.name.trim()) {
      toast.error('Vui lòng nhập tên chiến dịch');
      return;
    }
    if (!formData.startTime || !formData.endTime) {
      toast.error('Vui lòng chọn thời gian bắt đầu và kết thúc');
      return;
    }
    if (new Date(formData.startTime) >= new Date(formData.endTime)) {
      toast.error('Thời gian bắt đầu phải trước thời gian kết thúc');
      return;
    }

    try {
      setSaving(true);
      const payload = {
        name: formData.name.trim(),
        description: formData.description?.trim(),
        startTime: formData.startTime,
        endTime: formData.endTime,
        discountPercent: Number(formData.discountPercent),
        scope: formData.scope,
        categoryIds: formData.categoryIds,
        items: formData.items,
        isActive: formData.isActive,
      };

      if (editingSale) {
        await flashSaleApi.updateFlashSale(editingSale.id, payload);
        toast.success('Cập nhật Flash Sale thành công!');
      } else {
        await flashSaleApi.createFlashSale(payload);
        toast.success('Tạo chiến dịch Flash Sale thành công!');
      }

      setIsModalOpen(false);
      fetchSales();
    } catch (err) {
      toast.error(err.response?.data?.message || err.message || 'Thao tác thất bại');
    } finally {
      setSaving(false);
    }
  };

  const toggleCategory = (catId) => {
    setFormData((prev) => {
      const exists = prev.categoryIds.includes(catId);
      return {
        ...prev,
        categoryIds: exists
          ? prev.categoryIds.filter((id) => id !== catId)
          : [...prev.categoryIds, catId],
      };
    });
  };

  const toggleProduct = (prod) => {
    setFormData((prev) => {
      const exists = prev.items.some((i) => i.productId === prod.id);
      return {
        ...prev,
        items: exists
          ? prev.items.filter((i) => i.productId !== prod.id)
          : [
              ...prev.items,
              {
                productId: prod.id,
                discountPercent: prev.discountPercent,
                flashSaleStock: 50,
              },
            ],
      };
    });
  };

  const filteredProducts = products.filter((p) =>
    p.name.toLowerCase().includes(productSearch.toLowerCase())
  );

  return (
    <div className="space-y-6">
      {/* Page Title & Add Button */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-ink flex items-center gap-2.5">
            <Zap className="size-6 text-amber-500 fill-amber-500" />
            <span>Quản lý Flash Sale</span>
          </h1>
          <p className="text-sm text-ink-muted mt-1">
            Tạo các đợt giảm giá chớp nhoáng có đồng hồ đếm ngược để kích thích mua sắm
          </p>
        </div>

        <Button
          type="button"
          variant="primary"
          leftIcon={Plus}
          onClick={handleOpenAdd}
          className="font-semibold shadow-brand"
        >
          Tạo đợt Flash Sale mới
        </Button>
      </div>

      {/* Table of Flash Sales */}
      <div className="rounded-2xl border border-line bg-white shadow-soft overflow-hidden">
        <Table>
          <Table.Header>
            <Table.Row>
              <Table.Head>Chiến dịch</Table.Head>
              <Table.Head>Mức giảm</Table.Head>
              <Table.Head>Phạm vi áp dụng</Table.Head>
              <Table.Head>Thời gian</Table.Head>
              <Table.Head>Trạng thái</Table.Head>
              <Table.Head className="text-right">Hành động</Table.Head>
            </Table.Row>
          </Table.Header>

          <Table.Body>
            {loading ? (
              <Table.Row>
                <Table.Cell colSpan={6} className="text-center py-8 text-ink-muted">
                  Đang tải danh sách Flash Sale...
                </Table.Cell>
              </Table.Row>
            ) : sales.length === 0 ? (
              <Table.Row>
                <Table.Cell colSpan={6} className="text-center py-12 text-ink-muted">
                  Chưa có chiến dịch Flash Sale nào. Hãy tạo chiến dịch đầu tiên!
                </Table.Cell>
              </Table.Row>
            ) : (
              sales.map((sale) => (
                <Table.Row key={sale.id}>
                  <Table.Cell>
                    <div className="font-bold text-ink">{sale.name}</div>
                    {sale.description && (
                      <div className="text-xs text-ink-subtle line-clamp-1">{sale.description}</div>
                    )}
                  </Table.Cell>

                  <Table.Cell>
                    <span className="px-2.5 py-1 rounded-full text-xs font-black bg-red-100 text-red-700">
                      -{sale.discountPercent}%
                    </span>
                  </Table.Cell>

                  <Table.Cell>
                    <span className="text-xs font-semibold px-2 py-0.5 rounded-md border border-line bg-gray-50 text-ink">
                      {sale.scope === 'ALL'
                        ? 'Toàn bộ cửa hàng'
                        : sale.scope === 'CATEGORY'
                        ? `Theo ${sale.categoryIds?.length || 0} danh mục`
                        : `Theo ${sale.items?.length || 0} sản phẩm`}
                    </span>
                  </Table.Cell>

                  <Table.Cell className="text-xs text-ink-muted">
                    <div>{formatDate(sale.startTime)}</div>
                    <div>➔ {formatDate(sale.endTime)}</div>
                  </Table.Cell>

                  <Table.Cell>
                    {sale.status === 'ONGOING' ? (
                      <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-green-100 text-green-700 flex items-center gap-1 w-fit animate-pulse">
                        <span className="size-2 rounded-full bg-green-500" />
                        Đang diễn ra
                      </span>
                    ) : sale.status === 'UPCOMING' ? (
                      <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-amber-100 text-amber-700 w-fit">
                        Sắp diễn ra
                      </span>
                    ) : (
                      <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-gray-100 text-gray-600 w-fit">
                        Đã kết thúc
                      </span>
                    )}
                  </Table.Cell>

                  <Table.Cell className="text-right">
                    <div className="flex items-center justify-end gap-1.5">
                      <button
                        type="button"
                        onClick={() => handleToggleActive(sale.id)}
                        className={`p-1.5 rounded-lg border transition-colors cursor-pointer ${
                          sale.isActive
                            ? 'text-green-600 border-green-200 hover:bg-green-50'
                            : 'text-gray-400 border-gray-200 hover:bg-gray-50'
                        }`}
                        title={sale.isActive ? 'Tạm dừng' : 'Kích hoạt'}
                      >
                        <Power className="size-4" />
                      </button>

                      <button
                        type="button"
                        onClick={() => handleOpenEdit(sale)}
                        className="p-1.5 text-ink-muted hover:text-primary-700 hover:bg-primary-50 rounded-lg border border-line transition-colors cursor-pointer"
                        title="Chỉnh sửa"
                      >
                        <Pencil className="size-4" />
                      </button>

                      <button
                        type="button"
                        onClick={() => setDeleteTarget(sale)}
                        className="p-1.5 text-red-600 hover:text-red-700 hover:bg-red-50 rounded-lg border border-line transition-colors cursor-pointer"
                        title="Xóa"
                      >
                        <Trash2 className="size-4" />
                      </button>
                    </div>
                  </Table.Cell>
                </Table.Row>
              ))
            )}
          </Table.Body>
        </Table>
      </div>

      {/* Modal Create / Edit Flash Sale */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-ink/50 backdrop-blur-xs animate-in fade-in duration-200">
          <div className="relative w-full max-w-2xl bg-white rounded-3xl border border-line shadow-2xl overflow-hidden max-h-[90vh] flex flex-col">
            {/* Header */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-line bg-gray-50/50">
              <div className="flex items-center gap-2.5">
                <div className="size-9 rounded-xl bg-amber-100 text-amber-700 flex items-center justify-center font-bold">
                  <Zap className="size-5 fill-amber-500" />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-ink">
                    {editingSale ? 'Chỉnh sửa chiến dịch Flash Sale' : 'Tạo đợt Flash Sale mới'}
                  </h3>
                  <p className="text-xs text-ink-muted">Cài đặt thời gian và phạm vi giảm giá có hạn giờ</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsModalOpen(false)}
                className="p-1.5 text-ink-subtle hover:text-ink hover:bg-gray-100 rounded-lg transition-colors cursor-pointer"
              >
                <X className="size-5" />
              </button>
            </div>

            {/* Form Body */}
            <form onSubmit={handleSubmit} className="p-6 space-y-4 overflow-y-auto flex-1">
              <Input
                label="Tên chiến dịch Flash Sale"
                value={formData.name}
                onChange={(e) => setFormData((p) => ({ ...p, name: e.target.value }))}
                placeholder="Ví dụ: Siêu Sale Giờ Vàng 12h"
                required
              />

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <Input
                  label="Thời gian bắt đầu"
                  type="datetime-local"
                  value={formData.startTime}
                  onChange={(e) => setFormData((p) => ({ ...p, startTime: e.target.value }))}
                  required
                />

                <Input
                  label="Thời gian kết thúc"
                  type="datetime-local"
                  value={formData.endTime}
                  onChange={(e) => setFormData((p) => ({ ...p, endTime: e.target.value }))}
                  required
                />

                <Input
                  label="% Giảm giá chung"
                  type="number"
                  min="1"
                  max="99"
                  value={formData.discountPercent}
                  onChange={(e) => setFormData((p) => ({ ...p, discountPercent: e.target.value }))}
                  required
                />
              </div>

              {/* Scope Selection */}
              <div className="space-y-1.5">
                <label className="block text-xs font-semibold text-ink-muted uppercase tracking-wider">
                  Phạm vi áp dụng Flash Sale
                </label>
                <div className="grid grid-cols-3 gap-2">
                  <button
                    type="button"
                    onClick={() => setFormData((p) => ({ ...p, scope: 'ALL' }))}
                    className={`py-2.5 px-3 rounded-xl border text-xs font-bold transition-all cursor-pointer ${
                      formData.scope === 'ALL'
                        ? 'border-amber-500 bg-amber-50 text-amber-800 ring-2 ring-amber-200'
                        : 'border-line bg-white text-ink hover:bg-gray-50'
                    }`}
                  >
                    Toàn hệ thống
                  </button>

                  <button
                    type="button"
                    onClick={() => setFormData((p) => ({ ...p, scope: 'CATEGORY' }))}
                    className={`py-2.5 px-3 rounded-xl border text-xs font-bold transition-all cursor-pointer ${
                      formData.scope === 'CATEGORY'
                        ? 'border-amber-500 bg-amber-50 text-amber-800 ring-2 ring-amber-200'
                        : 'border-line bg-white text-ink hover:bg-gray-50'
                    }`}
                  >
                    Theo danh mục
                  </button>

                  <button
                    type="button"
                    onClick={() => setFormData((p) => ({ ...p, scope: 'PRODUCT' }))}
                    className={`py-2.5 px-3 rounded-xl border text-xs font-bold transition-all cursor-pointer ${
                      formData.scope === 'PRODUCT'
                        ? 'border-amber-500 bg-amber-50 text-amber-800 ring-2 ring-amber-200'
                        : 'border-line bg-white text-ink hover:bg-gray-50'
                    }`}
                  >
                    Sản phẩm cụ thể
                  </button>
                </div>
              </div>

              {/* Category Scope Selection */}
              {formData.scope === 'CATEGORY' && (
                <div className="space-y-2 p-3.5 rounded-2xl border border-line bg-gray-50/70">
                  <label className="block text-xs font-semibold text-ink">
                    Chọn danh mục áp dụng:
                  </label>
                  <div className="flex flex-wrap gap-2">
                    {categories.map((cat) => {
                      const selected = formData.categoryIds.includes(cat.id);
                      return (
                        <button
                          key={cat.id}
                          type="button"
                          onClick={() => toggleCategory(cat.id)}
                          className={`px-3 py-1.5 rounded-xl border text-xs font-semibold transition-all cursor-pointer flex items-center gap-1.5 ${
                            selected
                              ? 'bg-amber-500 text-white border-amber-600 shadow-xs'
                              : 'bg-white text-ink border-line hover:border-amber-400'
                          }`}
                        >
                          {selected && <Check className="size-3 stroke-[3]" />}
                          <span>{cat.name}</span>
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Product Scope Selection */}
              {formData.scope === 'PRODUCT' && (
                <div className="space-y-3 p-3.5 rounded-2xl border border-line bg-gray-50/70">
                  <div className="flex items-center justify-between">
                    <label className="text-xs font-semibold text-ink">
                      Chọn sản phẩm tham gia sale ({formData.items.length} đã chọn):
                    </label>
                    <div className="relative w-48">
                      <Search className="size-3.5 absolute left-2.5 top-2.5 text-ink-subtle" />
                      <input
                        type="text"
                        value={productSearch}
                        onChange={(e) => setProductSearch(e.target.value)}
                        placeholder="Tìm sản phẩm..."
                        className="w-full text-xs pl-8 pr-3 py-1.5 rounded-lg border border-line bg-white"
                      />
                    </div>
                  </div>

                  <div className="max-h-48 overflow-y-auto space-y-1.5 pr-1">
                    {filteredProducts.map((prod) => {
                      const selected = formData.items.some((i) => i.productId === prod.id);
                      return (
                        <div
                          key={prod.id}
                          onClick={() => toggleProduct(prod)}
                          className={`p-2 rounded-xl border text-xs flex items-center justify-between cursor-pointer transition-all ${
                            selected
                              ? 'border-amber-500 bg-amber-50/70'
                              : 'border-line bg-white hover:border-gray-300'
                          }`}
                        >
                          <div className="flex items-center gap-2 min-w-0">
                            <img
                              src={prod.imageUrl}
                              alt={prod.name}
                              className="size-8 rounded-lg object-cover border"
                            />
                            <span className="font-medium text-ink truncate">{prod.name}</span>
                          </div>

                          <div className="shrink-0 flex items-center gap-1.5">
                            {selected ? (
                              <span className="text-[11px] font-bold text-amber-700 bg-amber-100 px-2 py-0.5 rounded-md">
                                Đã thêm
                              </span>
                            ) : (
                              <span className="text-[11px] text-ink-subtle">+ Thêm</span>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Switch Active */}
              <div className="pt-2">
                <label className="flex items-center gap-2.5 cursor-pointer select-none">
                  <input
                    type="checkbox"
                    checked={formData.isActive}
                    onChange={(e) => setFormData((p) => ({ ...p, isActive: e.target.checked }))}
                    className="size-4 rounded border-line text-amber-600 focus:ring-amber-500"
                  />
                  <span className="text-sm font-medium text-ink">
                    Kích hoạt chiến dịch Flash Sale ngay lập tức
                  </span>
                </label>
              </div>

              {/* Footer Actions */}
              <div className="pt-4 flex items-center justify-end gap-3 border-t border-line">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setIsModalOpen(false)}
                  disabled={saving}
                >
                  Hủy
                </Button>
                <Button
                  type="submit"
                  variant="primary"
                  loading={saving}
                  className="font-bold shadow-brand"
                >
                  {editingSale ? 'Lưu thay đổi' : 'Tạo chiến dịch'}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Confirmation */}
      <ConfirmDialog
        isOpen={Boolean(deleteTarget)}
        title="Xóa chiến dịch Flash Sale"
        message={`Bạn có chắc chắn muốn xóa chiến dịch "${deleteTarget?.name}" không?`}
        confirmText="Xóa chiến dịch"
        confirmVariant="danger"
        isLoading={isDeleting}
        onConfirm={handleDelete}
        onClose={() => setDeleteTarget(null)}
      />
    </div>
  );
}

