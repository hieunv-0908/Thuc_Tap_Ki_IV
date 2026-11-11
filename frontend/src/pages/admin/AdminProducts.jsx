import { useState, useEffect, useMemo, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Package,
  Plus,
  Sparkles,
  Search,
  Pencil,
  Trash2,
  AlertTriangle,
  PackageX,
  X,
  RotateCcw,
  EyeOff,
} from 'lucide-react';
import Button from '../../components/ui/Button';
import Table from '../../components/ui/Table';
import Pagination from '../../components/ui/Pagination';
import ConfirmDialog from '../../components/ui/ConfirmDialog';
import StatCard from '../../components/admin/StatCard';
import AiMockModal from '../../components/admin/AiMockModal';
import { productApi } from '../../api/product';
import { categoryApi } from '../../api/category';
import { adminApi } from '../../api/admin';
import { toast } from '../../store/toastStore';
import { formatCurrency } from '../../utils/formatCurrency';
import { getCategoryMeta } from '../../utils/constants';

const ITEMS_PER_PAGE = 8;

export default function AdminProducts() {
  const navigate = useNavigate();

  // State
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Filters & Pagination
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('');
  const [selectedStockStatus, setSelectedStockStatus] = useState('ALL'); // 'ALL' | 'IN_STOCK' | 'LOW_STOCK' | 'OUT_OF_STOCK'
  const [currentPage, setCurrentPage] = useState(1);

  // Modals
  const [isAiModalOpen, setIsAiModalOpen] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState(null); // { id, name }
  const [isDeleting, setIsDeleting] = useState(false);
  const [restoreTarget, setRestoreTarget] = useState(null); // { id, name }
  const [isRestoring, setIsRestoring] = useState(false);

  // Fetch data for user actions (retry, after delete/restore)
  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const [prodResult, catResult] = await Promise.allSettled([
        adminApi.getProducts ? adminApi.getProducts({ size: 100 }) : productApi.getProducts({ size: 100 }),
        categoryApi.getCategories(),
      ]);

      if (prodResult.status === 'fulfilled') {
        const prodRes = prodResult.value;
        const productList = prodRes?.content || (Array.isArray(prodRes?.data) ? prodRes.data : (Array.isArray(prodRes) ? prodRes : []));
        setProducts(productList);
      } else {
        console.error('Lỗi tải sản phẩm:', prodResult.reason);
        setError(prodResult.reason?.message || 'Không thể tải danh sách sản phẩm.');
      }

      if (catResult.status === 'fulfilled') {
        const catRes = catResult.value;
        const categoryList = Array.isArray(catRes) ? catRes : (Array.isArray(catRes?.data) ? catRes.data : (catRes?.content || []));
        setCategories(categoryList);
      }
    } catch (err) {
      console.error('Lỗi tải danh sách sản phẩm:', err);
      setError(err.message || 'Không thể tải danh sách sản phẩm.');
    } finally {
      setLoading(false);
    }
  }, []);

  // Initial load
  useEffect(() => {
    let ignore = false;
    async function loadInitial() {
      try {
        setError(null);
        const [prodResult, catResult] = await Promise.allSettled([
          adminApi.getProducts ? adminApi.getProducts({ size: 100 }) : productApi.getProducts({ size: 100 }),
          categoryApi.getCategories(),
        ]);
        if (!ignore) {
          if (prodResult.status === 'fulfilled') {
            const prodRes = prodResult.value;
            const productList = prodRes?.content || (Array.isArray(prodRes?.data) ? prodRes.data : (Array.isArray(prodRes) ? prodRes : []));
            setProducts(productList);
          } else {
            console.error('Lỗi tải sản phẩm:', prodResult.reason);
            setError(prodResult.reason?.message || 'Không thể tải danh sách sản phẩm.');
          }

          if (catResult.status === 'fulfilled') {
            const catRes = catResult.value;
            const categoryList = Array.isArray(catRes) ? catRes : (Array.isArray(catRes?.data) ? catRes.data : (catRes?.content || []));
            setCategories(categoryList);
          }
        }
      } catch (err) {
        if (!ignore) {
          console.error('Lỗi tải danh sách sản phẩm:', err);
          setError(err.message || 'Không thể tải danh sách sản phẩm.');
        }
      } finally {
        if (!ignore) {
          setLoading(false);
        }
      }
    }
    loadInitial();
    return () => {
      ignore = true;
    };
  }, []);

  // Overall statistics calculated from full list
  const stats = useMemo(() => {
    const total = products.length;
    const hidden = products.filter((p) => p.isDeleted === true).length;
    const lowStock = products.filter((p) => {
      const stock = p.totalStock !== undefined ? p.totalStock : (p.stockQuantity ?? p.stock ?? 0);
      return stock > 0 && stock <= 10;
    }).length;
    const outOfStock = products.filter((p) => {
      const stock = p.totalStock !== undefined ? p.totalStock : (p.stockQuantity ?? p.stock ?? 0);
      return stock <= 0;
    }).length;
    const inStock = products.filter((p) => {
      const stock = p.totalStock !== undefined ? p.totalStock : (p.stockQuantity ?? p.stock ?? 0);
      return stock > 10;
    }).length;

    return { total, hidden, lowStock, outOfStock, inStock };
  }, [products]);

  // Filter products
  const filteredProducts = useMemo(() => {
    return products.filter((product) => {
      // Search by name
      if (searchQuery.trim()) {
        const query = searchQuery.trim().toLowerCase();
        const matchesName = product.name?.toLowerCase().includes(query);
        const matchesCat = product.category?.name?.toLowerCase().includes(query);
        if (!matchesName && !matchesCat) return false;
      }

      // Filter by category
      if (selectedCategory) {
        if (String(product.category?.id) !== String(selectedCategory)) {
          return false;
        }
      }

      // Filter by stock status
      const stock = product.totalStock !== undefined ? product.totalStock : (product.stockQuantity ?? product.stock ?? 0);
      if (selectedStockStatus === 'LOW_STOCK') {
        if (stock <= 0 || stock > 10) return false;
      } else if (selectedStockStatus === 'OUT_OF_STOCK') {
        if (stock > 0) return false;
      } else if (selectedStockStatus === 'IN_STOCK') {
        if (stock <= 10) return false;
      }

      return true;
    });
  }, [products, searchQuery, selectedCategory, selectedStockStatus]);

  // Pagination calculation
  const totalPages = Math.ceil(filteredProducts.length / ITEMS_PER_PAGE) || 1;
  const paginatedProducts = useMemo(() => {
    const start = (currentPage - 1) * ITEMS_PER_PAGE;
    return filteredProducts.slice(start, start + ITEMS_PER_PAGE);
  }, [filteredProducts, currentPage]);

  // Handle Search Input
  const handleSearchChange = (val) => {
    setSearchQuery(val);
    setCurrentPage(1);
  };

  // Handle Category Change
  const handleCategoryChange = (val) => {
    setSelectedCategory(val);
    setCurrentPage(1);
  };

  // Handle Stock Filter Change
  const handleStockStatusChange = (val) => {
    setSelectedStockStatus(val);
    setCurrentPage(1);
  };

  // Reset all filters
  const handleResetFilters = () => {
    setSearchQuery('');
    setSelectedCategory('');
    setSelectedStockStatus('ALL');
    setCurrentPage(1);
  };

  // Handle Delete
  const handleDeleteConfirm = async () => {
    if (!deleteTarget) return;
    try {
      setIsDeleting(true);
      await adminApi.deleteProduct(deleteTarget.id);
      toast.success(`Đã xóa sản phẩm "${deleteTarget.name}".`);
      setDeleteTarget(null);
      await fetchData();
    } catch (err) {
      console.error('Lỗi xóa sản phẩm:', err);
      toast.error(err.message || 'Không thể xóa sản phẩm. Vui lòng thử lại.');
    } finally {
      setIsDeleting(false);
    }
  };

  // Handle Restore
  const handleRestoreProduct = async () => {
    if (!restoreTarget) return;
    try {
      setIsRestoring(true);
      await adminApi.restoreProduct(restoreTarget.id);
      toast.success(`Đã khôi phục sản phẩm "${restoreTarget.name}".`);
      setRestoreTarget(null);
      await fetchData();
    } catch (err) {
      console.error('Lỗi khôi phục sản phẩm:', err);
      toast.error(err.message || 'Không thể khôi phục sản phẩm. Vui lòng thử lại.');
    } finally {
      setIsRestoring(false);
    }
  };

  // Table Columns Definition
  const columns = [
    {
      key: 'image',
      header: 'Ảnh',
      headerClassName: 'w-16',
      render: (row) => (
        <img
          src={row.imageUrl || 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=200'}
          alt={row.name}
          className="size-12 rounded-lg object-cover bg-gray-100 border border-line"
          onError={(e) => {
            e.target.src = 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=200';
          }}
        />
      ),
    },
    {
      key: 'name',
      header: 'Tên sản phẩm',
      render: (row) => {
        const catMeta = getCategoryMeta(row.category?.name);
        return (
          <div className="max-w-md">
            <div className="flex items-center gap-2">
              <p className="font-semibold text-ink line-clamp-1 hover:text-primary-700 transition-colors">
                {row.name}
              </p>
              {row.isDeleted && (
                <span className="shrink-0 text-[10px] font-bold px-1.5 py-0.5 rounded bg-gray-100 text-gray-600 border border-gray-200">
                  Đã ẩn
                </span>
              )}
            </div>
            <div className="flex items-center gap-1.5 mt-1">
              <span
                className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-xs font-medium border ${catMeta.bg} ${catMeta.border} ${catMeta.text}`}
              >
                <span>{catMeta.emoji}</span>
                <span>{row.category?.name || 'Khác'}</span>
              </span>
            </div>
          </div>
        );
      },
    },
    {
      key: 'price',
      header: 'Giá bán',
      className: 'whitespace-nowrap',
      render: (row) => {
        const hasRange = row.minPrice && row.maxPrice && row.minPrice < row.maxPrice;
        if (hasRange) {
          return (
            <div className="flex flex-col">
              <span className="font-bold text-primary-700 text-sm">
                {formatCurrency(row.minPrice)} - {formatCurrency(row.maxPrice)}
              </span>
              <span className="text-[11px] text-ink-subtle">Khoảng giá biến thể</span>
            </div>
          );
        }
        return (
          <span className="font-bold text-primary-700 text-sm">
            {formatCurrency(row.price ?? row.minPrice ?? 0)}
          </span>
        );
      },
    },
    {
      key: 'stock',
      header: 'Tồn kho',
      className: 'whitespace-nowrap',
      render: (row) => {
        const stock = row.totalStock !== undefined ? row.totalStock : (row.stockQuantity ?? row.stock ?? 0);
        const variantCount = Array.isArray(row.variants)
          ? row.variants.filter((v) => !v.isDeleted).length
          : 0;

        if (stock <= 0) {
          return (
            <div className="flex flex-col gap-0.5">
              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-red-100 text-red-800 border border-red-200 w-fit">
                Hết hàng
              </span>
              {variantCount > 0 && (
                <span className="text-[11px] text-ink-subtle">
                  {variantCount} biến thể
                </span>
              )}
            </div>
          );
        }

        if (stock <= 10) {
          return (
            <div className="flex flex-col gap-0.5">
              <div className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-amber-50 text-amber-700 border border-amber-200 font-bold text-xs w-fit">
                <AlertTriangle className="size-3.5" />
                <span>Chỉ còn {stock}</span>
              </div>
              {variantCount > 0 && (
                <span className="text-[11px] text-ink-subtle">
                  {variantCount} biến thể
                </span>
              )}
            </div>
          );
        }

        return (
          <div className="flex flex-col">
            <span className="text-ink font-semibold text-sm">
              {stock} chiếc
            </span>
            {variantCount > 0 && (
              <span className="text-[11px] text-ink-subtle">
                {variantCount} biến thể
              </span>
            )}
          </div>
        );
      },
    },
    {
      key: 'status',
      header: 'Trạng thái',
      className: 'whitespace-nowrap',
      render: (row) => {
        if (row.isDeleted) {
          return (
            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-gray-100 text-gray-600 border border-gray-200">
              <EyeOff className="size-3" />
              Đã ẩn
            </span>
          );
        }
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-100 text-emerald-800 border border-emerald-200">
            <span className="size-1.5 rounded-full bg-emerald-500 inline-block" />
            Đang bán
          </span>
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
            <button
              type="button"
              onClick={() => setRestoreTarget({ id: row.id, name: row.name })}
              className="p-1.5 rounded-lg text-emerald-600 hover:text-emerald-800 hover:bg-emerald-50 transition-colors cursor-pointer"
              title="Khôi phục sản phẩm"
              aria-label={`Khôi phục ${row.name}`}
            >
              <RotateCcw className="size-4" />
            </button>
          ) : (
            <>
              <button
                type="button"
                onClick={() => navigate(`/admin/products/${row.id}`)}
                className="p-1.5 rounded-lg text-ink-muted hover:text-secondary-700 hover:bg-secondary-50 transition-colors cursor-pointer"
                title="Chỉnh sửa sản phẩm"
                aria-label={`Chỉnh sửa ${row.name}`}
              >
                <Pencil className="size-4" />
              </button>
              <button
                type="button"
                onClick={() => setDeleteTarget(row)}
                className="p-1.5 rounded-lg text-ink-muted hover:text-red-700 hover:bg-red-50 transition-colors cursor-pointer"
                title="Xóa sản phẩm"
                aria-label={`Xóa ${row.name}`}
              >
                <Trash2 className="size-4" />
              </button>
            </>
          )}
        </div>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      {/* Top Header & Page Title */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold text-ink">
            Quản lý sản phẩm
          </h1>
          <p className="text-sm text-ink-muted mt-0.5">
            Xem danh sách, kiểm soát tồn kho và cập nhật danh mục sản phẩm FunnyShop
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          <Button
            variant="secondary"
            leftIcon={Sparkles}
            onClick={() => setIsAiModalOpen(true)}
            title="Sử dụng AI sinh dữ liệu mẫu"
          >
            <span className="hidden sm:inline">✨ Tạo dữ liệu mẫu bằng AI</span>
            <span className="sm:hidden">AI tạo mẫu</span>
          </Button>

          <Button
            variant="primary"
            leftIcon={Plus}
            onClick={() => navigate('/admin/products/new')}
          >
            Thêm sản phẩm
          </Button>
        </div>
      </div>

      {/* StatCards Row */}
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <StatCard
          icon={Package}
          label="Tổng sản phẩm"
          value={stats.total}
          variant="primary"
          subtext="Đang lưu trong kho"
        />
        <StatCard
          icon={AlertTriangle}
          label="Sắp hết hàng"
          value={stats.lowStock}
          variant="warning"
          subtext="Tồn kho ≤ 10 chiếc"
        />
        <StatCard
          icon={PackageX}
          label="Đã hết hàng"
          value={stats.outOfStock}
          variant="danger"
          subtext="Cần nhập thêm hàng"
        />
        <StatCard
          icon={EyeOff}
          label="Đang ẩn"
          value={stats.hidden}
          variant="secondary"
          subtext="Đã xóa mềm (ẩn khỏi shop)"
        />
      </div>

      {/* Toolbar: Search & Filters */}
      <div className="p-4 rounded-xl border border-line bg-white shadow-soft space-y-3">
        <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-3">
          {/* Search Input */}
          <div className="md:col-span-2 relative flex items-center">
            <Search className="size-4 text-ink-subtle absolute left-3 pointer-events-none" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => handleSearchChange(e.target.value)}
              placeholder="Tìm theo tên sản phẩm hoặc danh mục..."
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

          {/* Category Filter */}
          <div>
            <select
              value={selectedCategory}
              onChange={(e) => handleCategoryChange(e.target.value)}
              className="h-10 w-full px-3 rounded-lg border border-line bg-page text-sm text-ink focus:bg-white focus:outline-none focus:border-secondary-500 focus:ring-2 focus:ring-secondary-200 transition-colors cursor-pointer"
            >
              <option value="">Tất cả danh mục</option>
              {categories.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>
          </div>

          {/* Stock Filter */}
          <div>
            <select
              value={selectedStockStatus}
              onChange={(e) => handleStockStatusChange(e.target.value)}
              className="h-10 w-full px-3 rounded-lg border border-line bg-page text-sm text-ink focus:bg-white focus:outline-none focus:border-secondary-500 focus:ring-2 focus:ring-secondary-200 transition-colors cursor-pointer"
            >
              <option value="ALL">Tất cả tồn kho</option>
              <option value="IN_STOCK">Còn hàng (&gt; 5)</option>
              <option value="LOW_STOCK">Sắp hết hàng (≤ 5)</option>
              <option value="OUT_OF_STOCK">Đã hết hàng (0)</option>
            </select>
          </div>
        </div>

        {/* Filter stats summary */}
        {(searchQuery || selectedCategory || selectedStockStatus !== 'ALL') && (
          <div className="flex items-center justify-between text-xs text-ink-muted pt-2 border-t border-line">
            <span>
              Tìm thấy <strong className="text-ink">{filteredProducts.length}</strong> sản phẩm phù hợp
            </span>
            <button
              type="button"
              onClick={handleResetFilters}
              className="text-primary-700 hover:underline font-medium cursor-pointer"
            >
              Xóa bộ lọc
            </button>
          </div>
        )}
      </div>

      {/* Table & Pagination */}
      <div className="space-y-4">
        <Table
          columns={columns}
          data={paginatedProducts}
          loading={loading}
          error={error}
          onRetry={fetchData}
          emptyTitle="Không tìm thấy sản phẩm"
          emptyDescription="Không có sản phẩm nào phù hợp với điều kiện tìm kiếm và bộ lọc hiện tại."
        />

        {/* Pagination */}
        {!loading && !error && filteredProducts.length > 0 && (
          <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-2">
            <p className="text-xs text-ink-muted">
              Hiển thị {Math.min((currentPage - 1) * ITEMS_PER_PAGE + 1, filteredProducts.length)} -{' '}
              {Math.min(currentPage * ITEMS_PER_PAGE, filteredProducts.length)} trên tổng số{' '}
              <strong className="text-ink">{filteredProducts.length}</strong> sản phẩm
            </p>
            <Pagination
              currentPage={currentPage}
              totalPages={totalPages}
              onPageChange={(page) => setCurrentPage(page)}
            />
          </div>
        )}
      </div>

      {/* AI Mock Modal */}
      <AiMockModal
        isOpen={isAiModalOpen}
        onClose={() => setIsAiModalOpen(false)}
        onSuccess={fetchData}
      />

      {/* Confirm Delete Dialog */}
      <ConfirmDialog
        isOpen={Boolean(deleteTarget)}
        onClose={() => !isDeleting && setDeleteTarget(null)}
        onConfirm={handleDeleteConfirm}
        title="Xóa sản phẩm này?"
        description={`Bạn có chắc chắn muốn xóa "${deleteTarget?.name}"? Hành động này không thể hoàn tác.`}
        confirmText="Xóa sản phẩm"
        cancelText="Hủy"
        variant="danger"
        loading={isDeleting}
      />

      {/* Confirm Restore Dialog */}
      <ConfirmDialog
        isOpen={Boolean(restoreTarget)}
        onClose={() => !isRestoring && setRestoreTarget(null)}
        onConfirm={handleRestoreProduct}
        title="Khôi phục sản phẩm này?"
        description={`Bạn có chắc chắn muốn khôi phục "${restoreTarget?.name}"? Sản phẩm sẽ hiển thị trở lại trên cửa hàng.`}
        confirmText="Khôi phục"
        cancelText="Hủy"
        variant="primary"
        loading={isRestoring}
      />
    </div>
  );
}
