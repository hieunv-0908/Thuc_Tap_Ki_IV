import { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import {
  ArrowLeft,
  Sparkles,
  Image as ImageIcon,
  Check,
  AlertCircle,
  RotateCcw,
  Package,
} from 'lucide-react';
import Button from '../../components/ui/Button';
import Input from '../../components/ui/Input';
import Select from '../../components/ui/Select';
import { productApi } from '../../api/product';
import { categoryApi } from '../../api/category';
import { adminApi } from '../../api/admin';
import { aiApi } from '../../api/ai';
import { toast } from '../../store/toastStore';
import { formatCurrency } from '../../utils/formatCurrency';

export default function AdminProductForm() {
  const { id } = useParams();
  const navigate = useNavigate();
  const isEditMode = Boolean(id);

  // Categories
  const [categories, setCategories] = useState([]);
  const [fetchingProduct, setFetchingProduct] = useState(isEditMode);
  const [productError, setProductError] = useState(null);

  // Form Fields
  const [name, setName] = useState('');
  const [categoryId, setCategoryId] = useState('');
  const [price, setPrice] = useState('');
  const [stock, setStock] = useState('10');
  const [imageUrl, setImageUrl] = useState('');
  const [description, setDescription] = useState('');

  // Validation Errors
  const [errors, setErrors] = useState({});
  const [saving, setSaving] = useState(false);

  // AI Description Generator States
  // 'idle' | 'generating' | 'success' | 'error'
  const [aiState, setAiState] = useState('idle');
  const [aiError, setAiError] = useState(null);

  // Image preview error handler
  const [imageLoadError, setImageLoadError] = useState(false);

  // Load categories & product if edit mode
  useEffect(() => {
    let isMounted = true;

    async function loadData() {
      try {
        const catRes = await categoryApi.getCategories();
        if (isMounted) {
          const catList = Array.isArray(catRes) ? catRes : (Array.isArray(catRes?.data) ? catRes.data : (catRes?.content || []));
          setCategories(catList);
          if (!isEditMode && catList && catList.length > 0) {
            setCategoryId(String(catList[0].id));
          }
        }

        if (isEditMode) {
          setFetchingProduct(true);
          const prod = await productApi.getProductById(id);
          if (isMounted && prod) {
            setName(prod.name || '');
            setCategoryId(String(prod.category?.id || prod.categoryId || ''));
            setPrice(String(prod.price || ''));
            setStock(String(prod.stock !== undefined ? prod.stock : (prod.stockQuantity !== undefined ? prod.stockQuantity : 0)));
            setImageUrl(prod.imageUrl || prod.image || '');
            setDescription(prod.description || '');
          }
        }
      } catch (err) {
        console.error('Lỗi nạp dữ liệu form:', err);
        if (isMounted) {
          setProductError(err.message || 'Không thể tải thông tin sản phẩm.');
        }
      } finally {
        if (isMounted) {
          setFetchingProduct(false);
        }
      }
    }

    loadData();
    return () => {
      isMounted = false;
    };
  }, [id, isEditMode]);

  // Handle URL change
  const handleImageUrlChange = (e) => {
    setImageUrl(e.target.value);
    setImageLoadError(false);
  };

  // Validate Form
  const validate = () => {
    const newErrors = {};

    if (!name.trim()) {
      newErrors.name = 'Vui lòng nhập tên sản phẩm';
    }

    if (!categoryId) {
      newErrors.categoryId = 'Vui lòng chọn danh mục';
    }

    const numPrice = Number(price);
    if (!price || isNaN(numPrice) || numPrice <= 0) {
      newErrors.price = 'Giá sản phẩm phải là số lớn hơn 0';
    }

    const numStock = Number(stock);
    if (stock === '' || isNaN(numStock) || numStock < 0 || !Number.isInteger(numStock)) {
      newErrors.stock = 'Tồn kho phải là số nguyên lớn hơn hoặc bằng 0';
    }

    if (imageUrl.trim()) {
      try {
        new URL(imageUrl);
      } catch {
        newErrors.imageUrl = 'Đường dẫn ảnh (URL) không đúng định dạng';
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // Handle AI Description Generation
  const handleGenerateAiDescription = async () => {
    if (!name.trim()) {
      toast.warning('Vui lòng nhập tên sản phẩm trước khi tạo mô tả bằng AI.');
      return;
    }

    try {
      setAiState('generating');
      setAiError(null);
      const res = await aiApi.generateDescription(name.trim());
      setDescription(res.description || '');
      setAiState('success');
      toast.success('✨ Đã tạo mô tả bằng AI! Bạn có thể xem và chỉnh sửa.');
    } catch (err) {
      console.error('Lỗi tạo mô tả AI:', err);
      setAiState('error');
      setAiError(err.message || 'Không thể tạo mô tả tự động lúc này.');
    }
  };

  // Handle Form Submit
  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validate()) return;

    try {
      setSaving(true);
      const payload = {
        name: name.trim(),
        categoryId: Number(categoryId),
        price: Number(price),
        stock: Number(stock),
        stockQuantity: Number(stock),
        imageUrl: imageUrl.trim() || 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=600',
        description: description.trim(),
      };

      if (isEditMode) {
        await adminApi.updateProduct(id, payload);
        toast.success(`Đã cập nhật sản phẩm "${payload.name}" thành công!`);
      } else {
        await adminApi.createProduct(payload);
        toast.success(`Đã thêm sản phẩm mới "${payload.name}" thành công!`);
      }

      navigate('/admin/products');
    } catch (err) {
      console.error('Lỗi lưu sản phẩm:', err);
      toast.error(err.message || 'Không thể lưu sản phẩm. Vui lòng thử lại.');
    } finally {
      setSaving(false);
    }
  };

  if (fetchingProduct) {
    return (
      <div className="py-20 flex flex-col items-center justify-center gap-3">
        <div className="size-8 border-3 border-primary-200 border-t-primary-700 rounded-full animate-spin" />
        <p className="text-sm text-ink-muted">Đang tải thông tin sản phẩm...</p>
      </div>
    );
  }

  if (productError) {
    return (
      <div className="py-16 text-center max-w-md mx-auto">
        <AlertCircle className="size-12 text-red-500 mx-auto mb-3" />
        <h2 className="text-xl font-bold text-ink mb-1">Không tìm thấy sản phẩm</h2>
        <p className="text-sm text-ink-muted mb-6">{productError}</p>
        <Button variant="primary" onClick={() => navigate('/admin/products')}>
          Quay lại danh sách
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-4xl mx-auto pb-12">
      {/* Header & Back link */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => navigate('/admin/products')}
            className="p-2 rounded-lg text-ink-muted hover:text-ink hover:bg-gray-100 transition-colors cursor-pointer"
            aria-label="Quay lại danh sách sản phẩm"
          >
            <ArrowLeft className="size-5" />
          </button>
          <div>
            <h1 className="text-2xl font-bold text-ink">
              {isEditMode ? 'Chỉnh sửa sản phẩm' : 'Thêm sản phẩm mới'}
            </h1>
            <p className="text-sm text-ink-muted mt-0.5">
              {isEditMode
                ? `Cập nhật thông tin cho sản phẩm #${id}`
                : 'Điền đầy đủ thông tin để thêm sản phẩm vào kệ hàng FunnyShop'}
            </p>
          </div>
        </div>

        <Link
          to="/admin/products"
          className="text-sm text-ink-muted hover:text-ink font-medium"
        >
          Hủy bỏ
        </Link>
      </div>

      {/* Main Form */}
      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Left Column: Basic Details (7 cols on lg) */}
          <div className="lg:col-span-7 rounded-xl border border-line bg-white p-5 md:p-6 shadow-soft space-y-4">
            <h3 className="text-base font-semibold text-ink border-b border-line pb-3 flex items-center gap-2">
              <Package className="size-4 text-primary-700" />
              Thông tin cơ bản
            </h3>

            {/* Product Name */}
            <Input
              label="Tên sản phẩm"
              name="name"
              value={name}
              onChange={(e) => {
                setName(e.target.value);
                if (errors.name) setErrors((prev) => ({ ...prev, name: null }));
              }}
              placeholder="VD: Gối ôm hình đùi gà siêu khổng lồ 1m..."
              required
              error={errors.name}
            />

            {/* Category Select */}
            <Select
              label="Danh mục sản phẩm"
              name="categoryId"
              value={categoryId}
              onChange={(e) => {
                setCategoryId(e.target.value);
                if (errors.categoryId) setErrors((prev) => ({ ...prev, categoryId: null }));
              }}
              options={categories.map((c) => ({
                value: String(c.id),
                label: c.name,
              }))}
              placeholder="-- Chọn danh mục sản phẩm --"
              required
              error={errors.categoryId}
            />

            {/* Price & Stock in 2 cols */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Input
                label="Giá bán (₫)"
                name="price"
                type="number"
                min="1000"
                step="1000"
                value={price}
                onChange={(e) => {
                  setPrice(e.target.value);
                  if (errors.price) setErrors((prev) => ({ ...prev, price: null }));
                }}
                placeholder="VD: 150000"
                required
                error={errors.price}
                helperText={price && !isNaN(Number(price)) ? formatCurrency(price) : undefined}
              />

              <Input
                label="Số lượng tồn kho"
                name="stock"
                type="number"
                min="0"
                step="1"
                value={stock}
                onChange={(e) => {
                  setStock(e.target.value);
                  if (errors.stock) setErrors((prev) => ({ ...prev, stock: null }));
                }}
                placeholder="VD: 25"
                required
                error={errors.stock}
                helperText="Số lượng thực tế có trong kho"
              />
            </div>
          </div>

          {/* Right Column: Image URL & Preview (5 cols on lg) */}
          <div className="lg:col-span-5 rounded-xl border border-line bg-white p-5 md:p-6 shadow-soft space-y-4 flex flex-col">
            <h3 className="text-base font-semibold text-ink border-b border-line pb-3 flex items-center gap-2">
              <ImageIcon className="size-4 text-secondary-600" />
              Hình ảnh sản phẩm
            </h3>

            <Input
              label="Đường dẫn ảnh (URL)"
              name="imageUrl"
              value={imageUrl}
              onChange={handleImageUrlChange}
              placeholder="https://images.unsplash.com/..."
              error={errors.imageUrl}
              helperText="Dán link ảnh trực tiếp từ Unsplash hoặc CDN"
            />

            {/* Image Preview Box (Aspect square) */}
            <div className="flex-1 flex flex-col items-center justify-center">
              <p className="text-xs font-medium text-ink-muted self-start mb-1.5">
                Xem trước ảnh hiển thị:
              </p>
              <div className="aspect-square w-full max-w-[240px] rounded-xl border-2 border-dashed border-line bg-gray-50 overflow-hidden flex flex-col items-center justify-center p-2 relative group shadow-2xs">
                {imageUrl && !imageLoadError ? (
                  <img
                    src={imageUrl}
                    alt="Xem trước sản phẩm"
                    className="w-full h-full object-cover rounded-lg"
                    onError={() => setImageLoadError(true)}
                  />
                ) : (
                  <div className="text-center p-4">
                    <div className="size-12 rounded-full bg-gray-200/70 text-ink-subtle flex items-center justify-center mx-auto mb-2">
                      <ImageIcon className="size-6" />
                    </div>
                    <p className="text-xs text-ink-muted">
                      {imageLoadError
                        ? 'Không thể tải ảnh từ URL đã nhập'
                        : 'Dán URL ảnh để xem trước'}
                    </p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Full Width: Product Description with AI Integration */}
        <div className="rounded-xl border border-line bg-white p-5 md:p-6 shadow-soft space-y-3">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-line pb-3">
            <div>
              <h3 className="text-base font-semibold text-ink">Mô tả sản phẩm</h3>
              <p className="text-xs text-ink-muted">
                Giới thiệu tính năng, chất liệu và lợi ích nổi bật của sản phẩm
              </p>
            </div>

            {/* AI Generate Description Button per Design.md 7.9 */}
            <div>
              <Button
                variant="secondary"
                size="sm"
                leftIcon={Sparkles}
                disabled={!name.trim() || aiState === 'generating'}
                loading={aiState === 'generating'}
                onClick={handleGenerateAiDescription}
                title={!name.trim() ? 'Nhập tên sản phẩm trước' : 'Tạo tự động bằng AI'}
                className="shadow-2xs"
              >
                {aiState === 'generating' ? 'Đang tạo mô tả…' : '✨ Tạo mô tả bằng AI'}
              </Button>
            </div>
          </div>

          {/* AI Helper Tooltip / Status hint */}
          {!name.trim() && (
            <p className="text-xs text-ink-subtle italic">
              💡 Mẹo: Nhập tên sản phẩm ở trên để kích hoạt tính năng viết mô tả tự động bằng AI.
            </p>
          )}

          {/* Description Textarea */}
          <div className="relative">
            <textarea
              rows={5}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              disabled={aiState === 'generating'}
              placeholder="Nhập mô tả chi tiết sản phẩm hoặc nhấn nút Tạo mô tả bằng AI để sinh tự động..."
              className={`w-full rounded-lg border bg-white p-3 text-base text-ink placeholder:text-ink-subtle transition-colors focus:outline-none focus:border-secondary-500 focus:ring-2 focus:ring-secondary-200 ${
                aiState === 'generating' ? 'opacity-50 cursor-not-allowed bg-gray-50' : 'border-line'
              }`}
            />

            {aiState === 'generating' && (
              <div className="absolute inset-0 flex items-center justify-center bg-white/70 backdrop-blur-2xs rounded-lg">
                <div className="flex items-center gap-2 text-sm font-medium text-secondary-800">
                  <Sparkles className="size-4 animate-spin text-secondary-600" />
                  <span>Funny AI đang sáng tạo nội dung mô tả…</span>
                </div>
              </div>
            )}
          </div>

          {/* AI Error Notification with Retry */}
          {aiState === 'error' && (
            <div className="p-3 rounded-lg bg-red-50 border border-red-200 text-sm text-red-700 flex items-center justify-between gap-3">
              <div className="flex items-center gap-2">
                <AlertCircle className="size-4 shrink-0" />
                <span>Không tạo được mô tả bằng AI: {aiError}</span>
              </div>
              <button
                type="button"
                onClick={handleGenerateAiDescription}
                className="inline-flex items-center gap-1 font-semibold text-xs text-red-800 hover:underline cursor-pointer"
              >
                <RotateCcw className="size-3.5" />
                <span>Thử lại</span>
              </button>
            </div>
          )}

          {/* AI Success Notification */}
          {aiState === 'success' && (
            <div className="p-2.5 rounded-lg bg-green-50 border border-green-200 text-xs text-green-800 flex items-center gap-2">
              <Check className="size-4 shrink-0 text-green-600" />
              <span>Đã tạo mô tả thành công! Bạn có thể tự do chỉnh sửa nội dung trong ô văn bản phía trên.</span>
            </div>
          )}
        </div>

        {/* Action Buttons */}
        <div className="flex items-center justify-end gap-3 pt-4 border-t border-line">
          <Button
            variant="outline"
            onClick={() => navigate('/admin/products')}
            disabled={saving}
          >
            Hủy
          </Button>

          <Button
            type="submit"
            variant="primary"
            loading={saving}
          >
            {saving
              ? 'Đang lưu…'
              : isEditMode
              ? 'Cập nhật sản phẩm'
              : 'Lưu sản phẩm mới'}
          </Button>
        </div>
      </form>
    </div>
  );
}

