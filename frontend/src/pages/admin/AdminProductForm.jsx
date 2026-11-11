import { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate, useSearchParams, Link } from 'react-router-dom';
import {
  ArrowLeft,
  Sparkles,
  Image as ImageIcon,
  Check,
  AlertCircle,
  RotateCcw,
  Package,
  Layers,
  Lock,
  ArrowRight,
} from 'lucide-react';
import Button from '../../components/ui/Button';
import Input from '../../components/ui/Input';
import Select from '../../components/ui/Select';
import AdminProductVariants from '../../components/admin/AdminProductVariants';
import AdminProductImages from '../../components/admin/AdminProductImages';
import { productApi } from '../../api/product';
import { categoryApi } from '../../api/category';
import { adminApi } from '../../api/admin';
import { aiApi } from '../../api/ai';
import { toast } from '../../store/toastStore';
import { formatCurrency } from '../../utils/formatCurrency';

export default function AdminProductForm() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const isEditMode = Boolean(id);

  // Tab State: 'base' | 'variants' | 'images'
  const currentTab = searchParams.get('tab') || 'base';
  const activeTab = isEditMode ? currentTab : 'base';

  const handleTabChange = (tabKey) => {
    if (!isEditMode && tabKey !== 'base') {
      toast.info('Vui lòng lưu thông tin chung trước khi thiết lập biến thể và thư viện ảnh.');
      return;
    }
    setSearchParams({ tab: tabKey });
  };

  // Categories & Product Data
  const [categories, setCategories] = useState([]);
  const [productData, setProductData] = useState(null);
  const [fetchingProduct, setFetchingProduct] = useState(isEditMode);
  const [productError, setProductError] = useState(null);

  // Form Fields (Tab 1 - Base Info)
  const [name, setName] = useState('');
  const [categoryId, setCategoryId] = useState('');
  const [brand, setBrand] = useState('');
  const [material, setMaterial] = useState('');
  const [genderType, setGenderType] = useState('');
  const [price, setPrice] = useState('');
  const [stock, setStock] = useState('10');
  const [imageUrl, setImageUrl] = useState('');
  const [description, setDescription] = useState('');

  // Validation Errors & States
  const [errors, setErrors] = useState({});
  const [saving, setSaving] = useState(false);
  const [savingAndNext, setSavingAndNext] = useState(false);

  // AI Description Generator States
  const [aiState, setAiState] = useState('idle');
  const [aiError, setAiError] = useState(null);
  const [imageLoadError, setImageLoadError] = useState(false);

  // Reload product data (for variants/images updates)
  const reloadProduct = useCallback(async () => {
    if (!id) return;
    try {
      const prod = await productApi.getProductById(id);
      if (prod) {
        setProductData(prod);
        setName(prod.name || '');
        setCategoryId(String(prod.category?.id || prod.categoryId || ''));
        setBrand(prod.brand || '');
        setMaterial(prod.material || '');
        setGenderType(prod.genderType || '');
        setPrice(String(prod.price || ''));
        setStock(String(prod.stock !== undefined ? prod.stock : (prod.stockQuantity !== undefined ? prod.stockQuantity : 0)));
        setImageUrl(prod.imageUrl || prod.image || '');
        setDescription(prod.description || '');
      }
    } catch (err) {
      console.error('Lỗi làm mới dữ liệu sản phẩm:', err);
    }
  }, [id]);

  // Load initial categories & product
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
            setProductData(prod);
            setName(prod.name || '');
            setCategoryId(String(prod.category?.id || prod.categoryId || ''));
            setBrand(prod.brand || '');
            setMaterial(prod.material || '');
            setGenderType(prod.genderType || '');
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

  // Validate Form Tab 1
  const validate = () => {
    const newErrors = {};

    if (!name.trim()) {
      newErrors.name = 'Vui lòng nhập tên sản phẩm';
    }

    if (!categoryId) {
      newErrors.categoryId = 'Vui lòng chọn danh mục';
    }

    const numPrice = Number(price);
    if (!price || isNaN(numPrice) || numPrice < 0) {
      newErrors.price = 'Giá sản phẩm phải là số không âm';
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

  // Build payload
  const buildPayload = () => ({
    name: name.trim(),
    categoryId: Number(categoryId),
    brand: brand.trim() || undefined,
    material: material.trim() || undefined,
    genderType: genderType || undefined,
    price: Number(price) || 0,
    stock: Number(stock) || 0,
    stockQuantity: Number(stock) || 0,
    imageUrl: imageUrl.trim() || 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=600',
    description: description.trim(),
  });

  // Handle Submit Form Tab 1
  const handleSubmit = async (e, proceedToVariants = false) => {
    if (e) e.preventDefault();
    if (!validate()) return;

    try {
      if (proceedToVariants) {
        setSavingAndNext(true);
      } else {
        setSaving(true);
      }

      const payload = buildPayload();

      if (isEditMode) {
        await adminApi.updateProduct(id, payload);
        toast.success(`Đã cập nhật thông tin sản phẩm "${payload.name}" thành công!`);
        await reloadProduct();
        if (proceedToVariants) {
          setSearchParams({ tab: 'variants' });
        }
      } else {
        const created = await adminApi.createProduct(payload);
        const newId = created?.id || created?.data?.id || (typeof created === 'number' ? created : null);
        toast.success(`Đã tạo sản phẩm gốc "${payload.name}" thành công!`);

        if (proceedToVariants && newId) {
          navigate(`/admin/products/${newId}?tab=variants`);
        } else {
          navigate('/admin/products');
        }
      }
    } catch (err) {
      console.error('Lỗi lưu sản phẩm:', err);
      toast.error(err.message || 'Không thể lưu sản phẩm. Vui lòng thử lại.');
    } finally {
      setSaving(false);
      setSavingAndNext(false);
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
    <div className="space-y-6 max-w-5xl mx-auto pb-12">
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
              {isEditMode ? `Chỉnh sửa: ${productData?.name || name}` : 'Thêm sản phẩm mới'}
            </h1>
            <p className="text-sm text-ink-muted mt-0.5">
              {isEditMode
                ? `Mã sản phẩm: #${id} • Thiết lập thông tin chung, biến thể và thư viện hình ảnh`
                : 'Quy trình tạo sản phẩm: Điền thông tin cơ bản trước, sau đó thiết lập biến thể màu/size'}
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

      {/* Tabs Wizard Navigation (TASK-FE-07) */}
      <div className="border-b border-line bg-white rounded-xl shadow-2xs p-1.5 flex flex-wrap sm:flex-nowrap gap-1">
        {/* Tab 1: Thông tin chung */}
        <button
          type="button"
          onClick={() => handleTabChange('base')}
          className={`flex-1 min-w-[140px] flex items-center justify-center gap-2 py-2.5 px-3 rounded-lg text-sm font-semibold transition-all cursor-pointer ${
            activeTab === 'base'
              ? 'bg-primary-50 text-primary-800 shadow-2xs border border-primary-200'
              : 'text-ink-muted hover:text-ink hover:bg-gray-50'
          }`}
        >
          <Package className={`size-4 ${activeTab === 'base' ? 'text-primary-700' : 'text-ink-subtle'}`} />
          <span>1. Thông tin chung</span>
        </button>

        {/* Tab 2: Biến thể & Kho */}
        <button
          type="button"
          onClick={() => handleTabChange('variants')}
          className={`flex-1 min-w-[140px] flex items-center justify-center gap-2 py-2.5 px-3 rounded-lg text-sm font-semibold transition-all ${
            !isEditMode
              ? 'opacity-50 cursor-not-allowed text-gray-400 bg-gray-50/50'
              : activeTab === 'variants'
              ? 'bg-primary-50 text-primary-800 shadow-2xs border border-primary-200 cursor-pointer'
              : 'text-ink-muted hover:text-ink hover:bg-gray-50 cursor-pointer'
          }`}
          title={!isEditMode ? 'Cần lưu sản phẩm trước khi thiết lập biến thể' : 'Quản lý biến thể'}
        >
          {!isEditMode ? (
            <Lock className="size-3.5 text-gray-400" />
          ) : (
            <Layers className={`size-4 ${activeTab === 'variants' ? 'text-primary-700' : 'text-ink-subtle'}`} />
          )}
          <span>2. Biến thể & Kho</span>
          {isEditMode && productData?.variants?.length > 0 && (
            <span className="text-[11px] font-bold px-1.5 py-0.2 rounded-full bg-primary-100 text-primary-800">
              {productData.variants.length}
            </span>
          )}
        </button>

        {/* Tab 3: Thư viện hình ảnh */}
        <button
          type="button"
          onClick={() => handleTabChange('images')}
          className={`flex-1 min-w-[140px] flex items-center justify-center gap-2 py-2.5 px-3 rounded-lg text-sm font-semibold transition-all ${
            !isEditMode
              ? 'opacity-50 cursor-not-allowed text-gray-400 bg-gray-50/50'
              : activeTab === 'images'
              ? 'bg-primary-50 text-primary-800 shadow-2xs border border-primary-200 cursor-pointer'
              : 'text-ink-muted hover:text-ink hover:bg-gray-50 cursor-pointer'
          }`}
          title={!isEditMode ? 'Cần lưu sản phẩm trước khi thêm hình ảnh' : 'Quản lý thư viện ảnh'}
        >
          {!isEditMode ? (
            <Lock className="size-3.5 text-gray-400" />
          ) : (
            <ImageIcon className={`size-4 ${activeTab === 'images' ? 'text-primary-700' : 'text-ink-subtle'}`} />
          )}
          <span>3. Thư viện ảnh</span>
          {isEditMode && productData?.images?.length > 0 && (
            <span className="text-[11px] font-bold px-1.5 py-0.2 rounded-full bg-secondary-100 text-secondary-800">
              {productData.images.length}
            </span>
          )}
        </button>
      </div>

      {/* Tab 1 Content: Base Information Form */}
      {activeTab === 'base' && (
        <form onSubmit={(e) => handleSubmit(e, false)} className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            {/* Left Column: Basic Details (7 cols on lg) */}
            <div className="lg:col-span-7 rounded-xl border border-line bg-white p-5 md:p-6 shadow-soft space-y-4">
              <h3 className="text-base font-semibold text-ink border-b border-line pb-3 flex items-center gap-2">
                <Package className="size-4 text-primary-700" />
                Thông tin sản phẩm gốc
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
                placeholder="VD: Áo Sơ Mi Nam Oxford Dài Tay Cao Cấp..."
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

              {/* Fashion Attributes: Brand, Material, Gender (TASK-FE-06) */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <Input
                  label="Thương hiệu (Brand)"
                  name="brand"
                  value={brand}
                  onChange={(e) => setBrand(e.target.value)}
                  placeholder="VD: FunnyStyle"
                  helperText="Tên thương hiệu / nhãn hiệu"
                />

                <Input
                  label="Chất liệu (Material)"
                  name="material"
                  value={material}
                  onChange={(e) => setMaterial(e.target.value)}
                  placeholder="VD: Vải Oxford Premium 100%"
                  helperText="Chất liệu chính cấu thành"
                />
              </div>

              <Select
                label="Đối tượng sử dụng (Gender Type)"
                name="genderType"
                value={genderType}
                onChange={(e) => setGenderType(e.target.value)}
                options={[
                  { value: 'MEN', label: '👨 Dành cho Nam (MEN)' },
                  { value: 'WOMEN', label: '👩 Dành cho Nữ (WOMEN)' },
                  { value: 'UNISEX', label: '🧑 Mọi giới tính (UNISEX)' },
                ]}
                placeholder="-- Không phân loại giới tính --"
                helperText="Phân loại thời trang phù hợp cho đối tượng khách hàng"
              />

              {/* Price & Stock in 2 cols */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <Input
                  label="Giá cơ bản (₫)"
                  name="price"
                  type="number"
                  min="0"
                  step="1000"
                  value={price}
                  onChange={(e) => {
                    setPrice(e.target.value);
                    if (errors.price) setErrors((prev) => ({ ...prev, price: null }));
                  }}
                  placeholder="VD: 380000"
                  required
                  error={errors.price}
                  helperText={price && !isNaN(Number(price)) ? formatCurrency(price) : 'Giá mặc định nếu chưa có biến thể'}
                />

                <Input
                  label="Số lượng tồn kho cơ bản"
                  name="stock"
                  type="number"
                  min="0"
                  step="1"
                  value={stock}
                  onChange={(e) => {
                    setStock(e.target.value);
                    if (errors.stock) setErrors((prev) => ({ ...prev, stock: null }));
                  }}
                  placeholder="VD: 50"
                  required
                  error={errors.stock}
                  helperText="Tự động tính theo tổng kho của các biến thể"
                />
              </div>
            </div>

            {/* Right Column: Image URL & Preview (5 cols on lg) */}
            <div className="lg:col-span-5 rounded-xl border border-line bg-white p-5 md:p-6 shadow-soft space-y-4 flex flex-col">
              <h3 className="text-base font-semibold text-ink border-b border-line pb-3 flex items-center gap-2">
                <ImageIcon className="size-4 text-secondary-600" />
                Ảnh đại diện chính
              </h3>

              <Input
                label="Đường dẫn ảnh đại diện (URL)"
                name="imageUrl"
                value={imageUrl}
                onChange={handleImageUrlChange}
                placeholder="https://images.unsplash.com/..."
                error={errors.imageUrl}
                helperText="Dán link ảnh đại diện từ CDN hoặc Unsplash"
              />

              {/* Image Preview Box */}
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
                  Giới thiệu tính năng, chất liệu và điểm nổi bật của sản phẩm
                </p>
              </div>

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

            {!name.trim() && (
              <p className="text-xs text-ink-subtle italic">
                💡 Mẹo: Nhập tên sản phẩm ở trên để kích hoạt tính năng viết mô tả tự động bằng AI.
              </p>
            )}

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

            {aiState === 'success' && (
              <div className="p-2.5 rounded-lg bg-green-50 border border-green-200 text-xs text-green-800 flex items-center gap-2">
                <Check className="size-4 shrink-0 text-green-600" />
                <span>Đã tạo mô tả thành công! Bạn có thể tự do chỉnh sửa nội dung trong ô văn bản phía trên.</span>
              </div>
            )}
          </div>

          {/* Action Buttons */}
          <div className="flex flex-wrap items-center justify-between gap-3 pt-4 border-t border-line">
            <Button
              type="button"
              variant="outline"
              onClick={() => navigate('/admin/products')}
              disabled={saving || savingAndNext}
            >
              Hủy bỏ
            </Button>

            <div className="flex items-center gap-3">
              <Button
                type="submit"
                variant="outline"
                loading={saving}
                disabled={savingAndNext}
              >
                {saving
                  ? 'Đang lưu…'
                  : isEditMode
                  ? 'Cập nhật thông tin'
                  : 'Lưu sản phẩm'}
              </Button>

              <Button
                type="button"
                variant="primary"
                loading={savingAndNext}
                disabled={saving}
                rightIcon={ArrowRight}
                onClick={(e) => handleSubmit(e, true)}
              >
                {savingAndNext
                  ? 'Đang xử lý…'
                  : isEditMode
                  ? 'Lưu & Sang quản lý Biến thể'
                  : 'Lưu & Tiếp tục thiết lập Biến thể'}
              </Button>
            </div>
          </div>
        </form>
      )}

      {/* Tab 2 Content: Variants Management (TASK-FE-08) */}
      {activeTab === 'variants' && isEditMode && (
        <AdminProductVariants
          productId={id}
          variants={productData?.variants || []}
          onRefresh={reloadProduct}
        />
      )}

      {/* Tab 3 Content: Images Management (TASK-FE-11 to 13) */}
      {activeTab === 'images' && isEditMode && (
        <AdminProductImages
          productId={id}
          images={productData?.images || []}
          variants={productData?.variants || []}
          onRefresh={reloadProduct}
        />
      )}
    </div>
  );
}
