import { useState, useEffect, useMemo } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import {
  Star,
  ShoppingCart,
  Truck,
  ShieldCheck,
  RotateCcw,
  Heart,
  Share2,
  CheckCircle2,
  ZoomIn,
  Package,
  Flame,
  Check,
  Zap,
  ArrowLeft,
  ChevronRight,
  Sparkles,
} from 'lucide-react';
import { productApi } from '../api/product';
import Button from '../components/ui/Button';
import QuantityStepper from '../components/ui/QuantityStepper';
import ProductVariantSelector from '../components/product/ProductVariantSelector';
import ProductCard from '../components/product/ProductCard';
import SectionHeader from '../components/ui/SectionHeader';
import Modal from '../components/ui/Modal';
import { Skeleton, ProductCardSkeleton } from '../components/ui/Skeleton';
import EmptyState from '../components/ui/EmptyState';
import { formatCurrency } from '../utils/formatCurrency';
import { getCategoryMeta } from '../utils/constants';
import { useCartStore } from '../store/cartStore';
import { toast } from '../store/toastStore';

export default function ProductDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const addItem = useCartStore((s) => s.addItem);

  const [product, setProduct] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Variant & Image state
  const [selectedVariant, setSelectedVariant] = useState(null);
  const [currentImage, setCurrentImage] = useState(null);
  const [quantity, setQuantity] = useState(1);
  const [isLiked, setIsLiked] = useState(false);
  const [justAdded, setJustAdded] = useState(false);
  const [isLightboxOpen, setIsLightboxOpen] = useState(false);

  // Tabs state
  const [activeTab, setActiveTab] = useState('description');

  // Related products state
  const [relatedProducts, setRelatedProducts] = useState([]);
  const [loadingRelated, setLoadingRelated] = useState(false);

  // Load product detail
  useEffect(() => {
    let isCancelled = false;

    async function fetchProduct() {
      if (!id) return;
      setLoading(true);
      setError(null);
      setQuantity(1);
      window.scrollTo({ top: 0, behavior: 'smooth' });

      try {
        const data = await productApi.getProductById(id);
        if (!isCancelled) {
          if (!data || !data.id) {
            setError('Không tìm thấy thông tin sản phẩm này.');
            return;
          }
          setProduct(data);
          setCurrentImage(data.imageUrl || null);

          // Chọn biến thể đầu tiên khả dụng nếu có
          if (data.variants && data.variants.length > 0) {
            const firstAvailable =
              data.variants.find((v) => !v.isDeleted && v.stockQuantity > 0) || data.variants[0];
            setSelectedVariant(firstAvailable);
          } else {
            setSelectedVariant(null);
          }
        }
      } catch (err) {
        if (!isCancelled) {
          console.error('Lỗi khi tải chi tiết sản phẩm:', err);
          setError(err.message || 'Không thể tải thông tin sản phẩm. Vui lòng thử lại sau.');
        }
      } finally {
        if (!isCancelled) {
          setLoading(false);
        }
      }
    }

    fetchProduct();

    return () => {
      isCancelled = true;
    };
  }, [id]);

  // Load related products
  useEffect(() => {
    let isCancelled = false;

    async function fetchRelated() {
      if (!product?.category?.id) return;
      setLoadingRelated(true);
      try {
        const res = await productApi.getProducts({
          categoryId: product.category.id,
          size: 8,
        });
        if (!isCancelled) {
          const filtered = (res.content || []).filter((p) => String(p.id) !== String(product.id));
          setRelatedProducts(filtered.slice(0, 4));
        }
      } catch (err) {
        if (!isCancelled) {
          console.error('Lỗi khi tải sản phẩm liên quan:', err);
        }
      } finally {
        if (!isCancelled) {
          setLoadingRelated(false);
        }
      }
    }

    if (product) {
      fetchRelated();
    }

    return () => {
      isCancelled = true;
    };
  }, [product]);

  // Image list (gallery)
  const galleryImages = useMemo(() => {
    if (!product) return [];
    const list = [];
    if (product.imageUrl) list.push(product.imageUrl);

    if (Array.isArray(product.images)) {
      product.images.forEach((img) => {
        const url = img?.imageUrl || img?.url || img;
        if (url && typeof url === 'string' && !list.includes(url)) {
          list.push(url);
        }
      });
    }

    // Biến thể có thể chứa ảnh
    if (Array.isArray(product.variants)) {
      product.variants.forEach((v) => {
        if (v.imageUrl && !list.includes(v.imageUrl)) {
          list.push(v.imageUrl);
        }
      });
    }

    return list;
  }, [product]);

  // Derived price & stock
  const currentPrice = selectedVariant ? selectedVariant.price : (product?.price || 0);
  const currentStock = selectedVariant
    ? selectedVariant.stockQuantity
    : (product?.stockQuantity ?? product?.stock ?? 0);
  const isOutOfStock = currentStock <= 0;

  // Discount percentage
  const originalPrice = product?.originalPrice;
  const hasDiscount = Boolean(originalPrice && originalPrice > currentPrice);
  const discountPercent = hasDiscount
    ? Math.round(((originalPrice - currentPrice) / originalPrice) * 100)
    : 0;

  const rating = Number(product?.rating || 4.8);
  const isFeatured = rating >= 4.8;
  const categoryName = product?.category?.name || '';
  const meta = getCategoryMeta(categoryName);

  // Add to cart handler
  const handleAddToCart = () => {
    if (!product || isOutOfStock) return;

    const targetVariant = selectedVariant || product.variants?.[0];
    const cartPayload = targetVariant
      ? {
          variantId: targetVariant.id,
          productId: product.id,
          product,
          name: product.name,
          sku: targetVariant.sku,
          color: targetVariant.color,
          size: targetVariant.size,
          price: targetVariant.price,
          imageUrl: currentImage || product.imageUrl,
          stockQuantity: targetVariant.stockQuantity,
        }
      : product;

    const ok = addItem(cartPayload, quantity);
    if (ok) {
      setJustAdded(true);
      toast.success(`Đã thêm ${quantity} sản phẩm vào giỏ hàng`);
      setTimeout(() => setJustAdded(false), 1500);
    } else {
      toast.warning(`Chỉ còn ${currentStock} sản phẩm trong kho`);
    }
  };

  // Buy now handler
  const handleBuyNow = () => {
    if (!product || isOutOfStock) return;

    const targetVariant = selectedVariant || product.variants?.[0];
    const cartPayload = targetVariant
      ? {
          variantId: targetVariant.id,
          productId: product.id,
          product,
          name: product.name,
          sku: targetVariant.sku,
          color: targetVariant.color,
          size: targetVariant.size,
          price: targetVariant.price,
          imageUrl: currentImage || product.imageUrl,
          stockQuantity: targetVariant.stockQuantity,
        }
      : product;

    const ok = addItem(cartPayload, quantity);
    if (ok) {
      navigate('/checkout');
    } else {
      toast.warning(`Chỉ còn ${currentStock} sản phẩm trong kho`);
    }
  };

  // Share link handler
  const handleShare = async () => {
    try {
      if (navigator?.clipboard?.writeText) {
        await navigator.clipboard.writeText(window.location.href);
        toast.success('Đã sao chép liên kết sản phẩm!');
      } else {
        toast.info('Vui lòng sao chép đường link trên trình duyệt.');
      }
    } catch {
      toast.info('Không thể sao chép liên kết.');
    }
  };

  // Like handler
  const handleToggleLike = () => {
    setIsLiked((prev) => {
      const next = !prev;
      if (next) {
        toast.success('Đã lưu sản phẩm vào danh sách yêu thích ❤️');
      }
      return next;
    });
  };

  // Loading Skeleton State
  if (loading) {
    return (
      <div className="mx-auto w-full max-w-7xl px-4 sm:px-6 lg:px-8 py-6 md:py-10 space-y-8 animate-pulse">
        {/* Breadcrumb Skeleton */}
        <div className="flex items-center gap-2">
          <Skeleton className="h-4 w-16" />
          <Skeleton className="h-4 w-4" />
          <Skeleton className="h-4 w-24" />
          <Skeleton className="h-4 w-4" />
          <Skeleton className="h-4 w-32" />
        </div>

        {/* 2-column Detail Skeleton */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 lg:gap-12">
          <div className="space-y-4">
            <Skeleton className="aspect-square w-full rounded-2xl" />
            <div className="flex gap-3">
              <Skeleton className="size-16 rounded-lg" />
              <Skeleton className="size-16 rounded-lg" />
              <Skeleton className="size-16 rounded-lg" />
            </div>
          </div>

          <div className="space-y-5">
            <Skeleton className="h-6 w-32 rounded-full" />
            <Skeleton className="h-9 w-3/4 rounded-lg" />
            <Skeleton className="h-4 w-44" />
            <Skeleton className="h-20 w-full rounded-2xl" />
            <Skeleton className="h-24 w-full rounded-xl" />
            <Skeleton className="h-12 w-full rounded-xl" />
          </div>
        </div>
      </div>
    );
  }

  // Error / Not Found State
  if (error || !product) {
    return (
      <div className="mx-auto w-full max-w-4xl px-4 py-16 text-center">
        <EmptyState
          icon={Package}
          title="Không tìm thấy sản phẩm"
          description={error || 'Sản phẩm bạn đang tìm kiếm không tồn tại hoặc đã ngừng kinh doanh.'}
          actionLabel="Quay lại cửa hàng"
          onAction={() => navigate('/')}
        />
      </div>
    );
  }

  return (
    <div className="mx-auto w-full max-w-7xl px-4 sm:px-6 lg:px-8 py-6 md:py-10 space-y-10 md:space-y-14">
      {/* 1. Breadcrumbs */}
      <nav aria-label="Breadcrumb" className="flex items-center gap-2 text-xs sm:text-sm text-ink-muted">
        <Link to="/" className="hover:text-primary-700 transition-colors flex items-center gap-1">
          <ArrowLeft className="size-3.5" />
          Trang chủ
        </Link>
        <ChevronRight className="size-3.5 text-ink-subtle" />
        {product.category ? (
          <Link
            to={`/?category=${product.category.id}`}
            className="hover:text-primary-700 transition-colors"
          >
            {categoryName}
          </Link>
        ) : (
          <span>Danh mục</span>
        )}
        <ChevronRight className="size-3.5 text-ink-subtle" />
        <span className="text-ink font-semibold truncate max-w-[200px] sm:max-w-md">
          {product.name}
        </span>
      </nav>

      {/* 2. Main Product Info: 2 Columns */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 lg:gap-12 items-start">
        {/* Left Column: Image Gallery & Lightbox */}
        <div className="md:sticky md:top-24 space-y-4">
          <div className="group relative aspect-square w-full rounded-2xl overflow-hidden border border-line bg-white p-2 shadow-soft flex items-center justify-center">
            {/* Badges Stack */}
            <div className="absolute top-4 left-4 flex flex-col gap-1.5 z-10 pointer-events-none">
              {isOutOfStock && (
                <span className="bg-gray-900/85 text-white text-xs font-semibold rounded-md px-2.5 py-1 shadow-sm">
                  Hết hàng
                </span>
              )}

              {!isOutOfStock && hasDiscount && discountPercent > 0 && (
                <span className="bg-primary-700 text-white text-xs font-bold rounded-md px-2.5 py-1 shadow-sm">
                  -{discountPercent}%
                </span>
              )}

              {!isOutOfStock && isFeatured && (
                <span className="inline-flex items-center gap-1 bg-secondary-500 text-white text-xs font-semibold rounded-md px-2.5 py-1 shadow-sm">
                  <Flame className="size-3.5 fill-current" />
                  Yêu thích
                </span>
              )}
            </div>

            {/* Quick Actions (Share & Like) */}
            <div className="absolute top-4 right-4 flex items-center gap-2 z-10">
              <button
                type="button"
                onClick={handleShare}
                className="size-9 rounded-full bg-white/90 backdrop-blur-xs shadow-soft hover:bg-white flex items-center justify-center text-ink-subtle hover:text-ink transition-transform hover:scale-105 active:scale-95 cursor-pointer"
                title="Chia sẻ sản phẩm"
                aria-label="Chia sẻ sản phẩm"
              >
                <Share2 className="size-4.5" />
              </button>

              <button
                type="button"
                onClick={handleToggleLike}
                className="size-9 rounded-full bg-white/90 backdrop-blur-xs shadow-soft hover:bg-white flex items-center justify-center transition-transform hover:scale-105 active:scale-95 cursor-pointer"
                title={isLiked ? 'Bỏ thích' : 'Yêu thích'}
                aria-label={isLiked ? 'Bỏ thích' : 'Yêu thích'}
              >
                <Heart
                  className={`size-4.5 transition-colors ${
                    isLiked
                      ? 'fill-primary-500 text-primary-500 animate-[pop_300ms_ease-out]'
                      : 'text-ink-subtle hover:text-primary-600'
                  }`}
                />
              </button>
            </div>

            {/* Main Image */}
            <img
              src={currentImage || product.imageUrl}
              alt={product.name}
              className={`w-full h-full object-cover rounded-xl transition-all duration-300 cursor-zoom-in ${
                isOutOfStock ? 'opacity-60 grayscale' : 'hover:scale-105'
              }`}
              onClick={() => setIsLightboxOpen(true)}
            />

            {/* Zoom In Hint */}
            <button
              type="button"
              onClick={() => setIsLightboxOpen(true)}
              className="absolute bottom-4 right-4 inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-white/90 backdrop-blur-xs text-xs font-semibold text-ink shadow-sm hover:bg-white transition-opacity cursor-pointer"
            >
              <ZoomIn className="size-3.5" />
              <span>Phóng to</span>
            </button>
          </div>

          {/* Thumbnails row (shown if > 1 image) */}
          {galleryImages.length > 1 && (
            <div className="flex items-center gap-3 overflow-x-auto pb-1 scrollbar-none">
              {galleryImages.map((imgUrl, index) => {
                const isSelected = (currentImage || product.imageUrl) === imgUrl;
                return (
                  <button
                    key={index}
                    type="button"
                    onClick={() => setCurrentImage(imgUrl)}
                    className={`shrink-0 size-16 sm:size-20 rounded-xl overflow-hidden border p-1 bg-white transition-all cursor-pointer ${
                      isSelected
                        ? 'border-primary-600 ring-2 ring-primary-500/30'
                        : 'border-line hover:border-primary-300 opacity-70 hover:opacity-100'
                    }`}
                  >
                    <img
                      src={imgUrl}
                      alt={`${product.name} thumbnail ${index + 1}`}
                      className="w-full h-full object-cover rounded-lg"
                    />
                  </button>
                );
              })}
            </div>
          )}
        </div>

        {/* Right Column: Product Information & Purchase */}
        <div className="flex flex-col space-y-6">
          {/* Header & Category Badge */}
          <div>
            <div className="inline-flex items-center gap-1.5 rounded-full bg-primary-50 border border-primary-200/60 px-3 py-1 text-xs font-semibold text-primary-700 mb-3">
              <span>{meta.emoji}</span>
              <span>{categoryName || 'Sản phẩm FunnyShop'}</span>
            </div>

            <h1 className="text-2xl sm:text-3xl font-extrabold text-ink leading-tight">
              {product.name}
            </h1>

            {/* Fashion Attributes (Brand, Material, Gender) */}
            {(product.brand || product.material || product.genderType) && (
              <div className="flex flex-wrap items-center gap-2 mt-2.5">
                {product.brand && (
                  <span className="inline-flex items-center gap-1 bg-gray-100 text-ink text-xs px-2.5 py-1 rounded-md font-medium">
                    <span className="text-ink-subtle">Hãng:</span> {product.brand}
                  </span>
                )}
                {product.material && (
                  <span className="inline-flex items-center gap-1 bg-gray-100 text-ink-muted text-xs px-2.5 py-1 rounded-md">
                    <span className="text-ink-subtle">Chất liệu:</span> {product.material}
                  </span>
                )}
                {product.genderType && (
                  <span className="bg-primary-50 text-primary-700 text-xs px-2.5 py-1 rounded-md font-bold uppercase tracking-wider">
                    {product.genderType}
                  </span>
                )}
              </div>
            )}

            {/* Rating & Sold count */}
            <div className="flex items-center gap-4 text-xs sm:text-sm text-ink-muted mt-3">
              <span className="flex items-center gap-1.5 font-bold text-amber-600">
                <Star className="size-4 fill-amber-400 text-amber-400" />
                {rating.toFixed(1)}
              </span>
              <span>•</span>
              <span className="text-ink-muted">
                {product.soldCount ? `Đã bán ${product.soldCount}` : 'Mới ra mắt'}
              </span>
              <span>•</span>
              <span className="text-ink-subtle">Mã SP: #{product.id}</span>
            </div>
          </div>

          {/* Price Box */}
          <div className="rounded-2xl bg-primary-50/80 border border-primary-200/80 p-5 flex flex-col sm:flex-row sm:items-baseline justify-between gap-3">
            <div className="flex items-baseline gap-3">
              <span className="text-3xl sm:text-4xl font-extrabold text-primary-700">
                {formatCurrency(currentPrice)}
              </span>

              {hasDiscount && (
                <span className="text-sm sm:text-base text-ink-subtle line-through">
                  {formatCurrency(originalPrice)}
                </span>
              )}
            </div>

            {hasDiscount && (
              <span className="inline-flex items-center gap-1 text-xs font-bold text-primary-700 bg-white px-2.5 py-1 rounded-full border border-primary-200 shadow-2xs">
                <Sparkles className="size-3.5 text-primary-500" />
                Tiết kiệm {formatCurrency(originalPrice - currentPrice)} ({discountPercent}%)
              </span>
            )}
          </div>

          {/* Variants Selector */}
          {product.variants && product.variants.length > 0 && (
            <ProductVariantSelector
              variants={product.variants}
              images={product.images}
              selectedVariant={selectedVariant}
              onSelectVariant={setSelectedVariant}
              onSelectImage={setCurrentImage}
            />
          )}

          {/* Stock Status indicator */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between text-xs sm:text-sm font-semibold">
              <span className="text-ink-muted">Tình trạng:</span>
              {isOutOfStock ? (
                <span className="text-red-600 font-bold">Hết hàng</span>
              ) : currentStock <= 5 ? (
                <span className="text-amber-700 font-bold">
                  Chỉ còn {currentStock} sản phẩm trong kho!
                </span>
              ) : (
                <span className="text-emerald-700 font-semibold flex items-center gap-1">
                  <CheckCircle2 className="size-4 text-emerald-600" /> Còn hàng ({currentStock})
                </span>
              )}
            </div>

            {!isOutOfStock && currentStock <= 10 && (
              <div className="h-2 w-full rounded-full bg-gray-100 overflow-hidden">
                <div
                  className="h-full bg-amber-500 rounded-full transition-all"
                  style={{ width: `${Math.min(100, (currentStock / 10) * 100)}%` }}
                />
              </div>
            )}
          </div>

          {/* Quantity Stepper & Action Buttons */}
          <div className="space-y-4 pt-2">
            {!isOutOfStock && (
              <div className="flex items-center gap-4">
                <span className="text-xs sm:text-sm font-semibold text-ink">Số lượng:</span>
                <QuantityStepper
                  value={quantity}
                  min={1}
                  max={currentStock}
                  onChange={setQuantity}
                />
              </div>
            )}

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
              <Button
                variant="primary"
                size="lg"
                fullWidth
                disabled={isOutOfStock || justAdded}
                leftIcon={justAdded ? Check : ShoppingCart}
                onClick={handleAddToCart}
                className="font-bold shadow-brand"
              >
                {isOutOfStock ? 'Hết hàng' : justAdded ? '✓ Đã thêm vào giỏ' : 'Thêm vào giỏ hàng'}
              </Button>

              <Button
                variant="secondary"
                size="lg"
                fullWidth
                disabled={isOutOfStock}
                leftIcon={Zap}
                onClick={handleBuyNow}
                className="font-bold"
              >
                Mua ngay
              </Button>
            </div>
          </div>

          {/* Shop Commitments / Trust Bar */}
          <div className="border-t border-dashed border-line pt-5 space-y-3">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs text-ink-muted">
              <div className="flex items-start gap-2.5 p-3 rounded-xl bg-gray-50 border border-line/60">
                <Truck className="size-4.5 text-primary-600 shrink-0 mt-0.5" />
                <div>
                  <h4 className="font-bold text-ink">Giao toàn quốc</h4>
                  <p className="text-[11px] text-ink-subtle">Miễn phí từ 300.000₫</p>
                </div>
              </div>

              <div className="flex items-start gap-2.5 p-3 rounded-xl bg-gray-50 border border-line/60">
                <ShieldCheck className="size-4.5 text-secondary-600 shrink-0 mt-0.5" />
                <div>
                  <h4 className="font-bold text-ink">Thanh toán COD</h4>
                  <p className="text-[11px] text-ink-subtle">Kiểm tra khi nhận hàng</p>
                </div>
              </div>

              <div className="flex items-start gap-2.5 p-3 rounded-xl bg-gray-50 border border-line/60">
                <RotateCcw className="size-4.5 text-amber-600 shrink-0 mt-0.5" />
                <div>
                  <h4 className="font-bold text-ink">Đổi trả 7 ngày</h4>
                  <p className="text-[11px] text-ink-subtle">Nhanh chóng & tiện lợi</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* 3. Detailed Tabs (Description, Policies, Reviews) */}
      <div className="rounded-3xl border border-line bg-white shadow-soft overflow-hidden">
        {/* Tab Headers */}
        <div className="flex border-b border-line bg-gray-50/70 overflow-x-auto">
          <button
            type="button"
            onClick={() => setActiveTab('description')}
            className={`px-6 py-4 text-sm font-bold border-b-2 transition-colors cursor-pointer whitespace-nowrap ${
              activeTab === 'description'
                ? 'border-primary-600 text-primary-700 bg-white'
                : 'border-transparent text-ink-muted hover:text-ink hover:bg-gray-100/50'
            }`}
          >
            Mô tả sản phẩm
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('shipping')}
            className={`px-6 py-4 text-sm font-bold border-b-2 transition-colors cursor-pointer whitespace-nowrap ${
              activeTab === 'shipping'
                ? 'border-primary-600 text-primary-700 bg-white'
                : 'border-transparent text-ink-muted hover:text-ink hover:bg-gray-100/50'
            }`}
          >
            Giao hàng & Đổi trả
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('reviews')}
            className={`px-6 py-4 text-sm font-bold border-b-2 transition-colors cursor-pointer whitespace-nowrap ${
              activeTab === 'reviews'
                ? 'border-primary-600 text-primary-700 bg-white'
                : 'border-transparent text-ink-muted hover:text-ink hover:bg-gray-100/50'
            }`}
          >
            Đánh giá ({product.rating || '4.8'})
          </button>
        </div>

        {/* Tab Content */}
        <div className="p-6 sm:p-8">
          {activeTab === 'description' && (
            <div className="space-y-4 max-w-4xl">
              <h3 className="text-lg font-bold text-ink">Chi tiết sản phẩm</h3>
              <div className="text-sm sm:text-base text-ink-muted leading-relaxed whitespace-pre-line">
                {product.description ||
                  'Sản phẩm quà tặng và đồ dùng dễ thương chất lượng cao từ FunnyShop. Đảm bảo an toàn, thiết kế bắt mắt và phù hợp cho mọi lứa tuổi.'}
              </div>

              {/* Technical Specifications Table */}
              <div className="mt-6 pt-6 border-t border-line">
                <h4 className="text-sm font-bold text-ink uppercase tracking-wider mb-3">
                  Thông số chi tiết
                </h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs sm:text-sm">
                  <div className="flex py-2 border-b border-line/60">
                    <span className="w-36 text-ink-subtle">Danh mục:</span>
                    <span className="font-semibold text-ink">{categoryName}</span>
                  </div>
                  {product.brand && (
                    <div className="flex py-2 border-b border-line/60">
                      <span className="w-36 text-ink-subtle">Thương hiệu:</span>
                      <span className="font-semibold text-ink">{product.brand}</span>
                    </div>
                  )}
                  {product.material && (
                    <div className="flex py-2 border-b border-line/60">
                      <span className="w-36 text-ink-subtle">Chất liệu:</span>
                      <span className="font-semibold text-ink">{product.material}</span>
                    </div>
                  )}
                  {product.genderType && (
                    <div className="flex py-2 border-b border-line/60">
                      <span className="w-36 text-ink-subtle">Đối tượng:</span>
                      <span className="font-semibold text-ink uppercase">{product.genderType}</span>
                    </div>
                  )}
                  <div className="flex py-2 border-b border-line/60">
                    <span className="w-36 text-ink-subtle">Tình trạng:</span>
                    <span className="font-semibold text-emerald-700">Mới 100%</span>
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'shipping' && (
            <div className="space-y-6 max-w-3xl text-sm leading-relaxed text-ink-muted">
              <div>
                <h4 className="font-bold text-ink mb-1.5 flex items-center gap-2">
                  <Truck className="size-4 text-primary-600" />
                  1. Chính sách vận chuyển
                </h4>
                <p>
                  FunnyShop hỗ trợ giao hàng tận nơi trên toàn quốc qua các đối tác vận chuyển uy tín
                  (Giao Hàng Nhanh, Viettel Post, SPX).
                </p>
                <ul className="list-disc list-inside mt-2 space-y-1 text-ink">
                  <li>Nội thành (Hà Nội, TP.HCM): 1 - 2 ngày làm việc.</li>
                  <li>Các tỉnh thành khác: 2 - 4 ngày làm việc.</li>
                  <li>
                    <strong>Miễn phí vận chuyển</strong> cho tất cả đơn hàng từ 300.000₫ trở lên.
                  </li>
                </ul>
              </div>

              <div>
                <h4 className="font-bold text-ink mb-1.5 flex items-center gap-2">
                  <ShieldCheck className="size-4 text-secondary-600" />
                  2. Hình thức thanh toán
                </h4>
                <p>
                  Thanh toán khi nhận hàng (COD): Bạn được quyền kiểm tra hàng trước khi thanh toán
                  tiền cho nhân viên giao hàng.
                </p>
              </div>

              <div>
                <h4 className="font-bold text-ink mb-1.5 flex items-center gap-2">
                  <RotateCcw className="size-4 text-amber-600" />
                  3. Đổi trả & Bảo hành
                </h4>
                <p>
                  Đổi trả miễn phí trong vòng 7 ngày kể từ khi nhận hàng đối với sản phẩm lỗi do nhà
                  sản xuất hoặc không đúng mô tả. Đội ngũ chăm sóc khách hàng luôn sẵn sàng hỗ trợ bạn
                  24/7.
                </p>
              </div>
            </div>
          )}

          {activeTab === 'reviews' && (
            <div className="space-y-6 max-w-3xl">
              <div className="flex flex-col sm:flex-row sm:items-center gap-6 p-5 rounded-2xl bg-secondary-50/50 border border-secondary-200">
                <div className="text-center sm:text-left">
                  <div className="text-4xl font-extrabold text-ink">{rating.toFixed(1)}</div>
                  <div className="flex items-center justify-center sm:justify-start gap-1 my-1 text-amber-500">
                    {Array.from({ length: 5 }).map((_, i) => (
                      <Star key={i} className="size-4 fill-amber-400 text-amber-400" />
                    ))}
                  </div>
                  <div className="text-xs text-ink-muted">Dựa trên các đánh giá đã xác thực</div>
                </div>

                <div className="flex-1 space-y-1.5 text-xs text-ink-muted">
                  <div className="flex items-center gap-2">
                    <span>5 sao</span>
                    <div className="h-2 flex-1 rounded-full bg-gray-200 overflow-hidden">
                      <div className="h-full bg-amber-400 rounded-full w-[90%]" />
                    </div>
                    <span className="w-8 text-right">90%</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span>4 sao</span>
                    <div className="h-2 flex-1 rounded-full bg-gray-200 overflow-hidden">
                      <div className="h-full bg-amber-400 rounded-full w-[8%]" />
                    </div>
                    <span className="w-8 text-right">8%</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span>3 sao</span>
                    <div className="h-2 flex-1 rounded-full bg-gray-200 overflow-hidden">
                      <div className="h-full bg-amber-400 rounded-full w-[2%]" />
                    </div>
                    <span className="w-8 text-right">2%</span>
                  </div>
                </div>
              </div>

              {/* Sample Verified Reviews */}
              <div className="space-y-4 pt-2">
                <div className="p-4 rounded-xl border border-line bg-white shadow-2xs space-y-2">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className="size-8 rounded-full bg-primary-100 text-primary-700 font-bold text-xs flex items-center justify-center">
                        HN
                      </div>
                      <div>
                        <h4 className="text-xs font-bold text-ink">Hoàng Nam</h4>
                        <span className="text-[11px] text-emerald-600 font-medium">
                          ✓ Đã mua hàng tại FunnyShop
                        </span>
                      </div>
                    </div>
                    <div className="flex text-amber-400">
                      {Array.from({ length: 5 }).map((_, i) => (
                        <Star key={i} className="size-3.5 fill-amber-400 text-amber-400" />
                      ))}
                    </div>
                  </div>
                  <p className="text-xs sm:text-sm text-ink-muted">
                    Sản phẩm siêu dễ thương, đóng gói cẩn thận 2 lớp hộp và có kèm thiệp cảm ơn.
                    Rất hài lòng!
                  </p>
                </div>

                <div className="p-4 rounded-xl border border-line bg-white shadow-2xs space-y-2">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className="size-8 rounded-full bg-secondary-100 text-secondary-700 font-bold text-xs flex items-center justify-center">
                        TT
                      </div>
                      <div>
                        <h4 className="text-xs font-bold text-ink">Thanh Thảo</h4>
                        <span className="text-[11px] text-emerald-600 font-medium">
                          ✓ Đã mua hàng tại FunnyShop
                        </span>
                      </div>
                    </div>
                    <div className="flex text-amber-400">
                      {Array.from({ length: 5 }).map((_, i) => (
                        <Star key={i} className="size-3.5 fill-amber-400 text-amber-400" />
                      ))}
                    </div>
                  </div>
                  <p className="text-xs sm:text-sm text-ink-muted">
                    Chất vải và đường may rất tỉ mỉ, sờ êm ái cực kỳ. Giao hàng hỏa tốc trong 1 ngày
                    đã nhận được rồi.
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* 4. Related Products (Có thể bạn cũng thích) */}
      {(loadingRelated || relatedProducts.length > 0) && (
        <section className="space-y-6 pt-4">
          <SectionHeader
            eyebrow="✨ Có thể bạn cũng thích"
            title="Sản phẩm cùng danh mục"
            description={`Khám phá thêm các sản phẩm khác thuộc nhóm ${categoryName}`}
            actionLabel="Xem tất cả →"
            actionHref={`/?category=${product.category?.id || ''}`}
          />

          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-5">
            {loadingRelated
              ? Array.from({ length: 4 }).map((_, i) => <ProductCardSkeleton key={i} />)
              : relatedProducts.map((p) => <ProductCard key={p.id} product={p} />)}
          </div>
        </section>
      )}

      {/* 5. Mobile Sticky Bottom Bar */}
      <div className="fixed bottom-0 left-0 right-0 z-40 bg-white/95 backdrop-blur-md border-t border-line p-3 md:hidden flex items-center justify-between gap-3 shadow-2xl">
        <div>
          <span className="text-[11px] text-ink-subtle">Giá sản phẩm</span>
          <div className="text-base font-bold text-primary-700 leading-tight">
            {formatCurrency(currentPrice)}
          </div>
        </div>

        <div className="flex items-center gap-2">
          {!isOutOfStock && (
            <QuantityStepper
              value={quantity}
              min={1}
              max={currentStock}
              onChange={setQuantity}
            />
          )}

          <Button
            variant="primary"
            size="md"
            disabled={isOutOfStock || justAdded}
            leftIcon={justAdded ? Check : ShoppingCart}
            onClick={handleAddToCart}
            className="font-bold shrink-0"
          >
            {isOutOfStock ? 'Hết hàng' : justAdded ? 'Đã thêm' : 'Thêm giỏ'}
          </Button>
        </div>
      </div>

      {/* 6. Image Zoom Lightbox Modal */}
      <Modal
        isOpen={isLightboxOpen}
        onClose={() => setIsLightboxOpen(false)}
        title={product.name}
        maxWidth="max-w-3xl"
      >
        <div className="flex flex-col items-center justify-center p-2">
          <img
            src={currentImage || product.imageUrl}
            alt={product.name}
            className="max-h-[75vh] w-auto object-contain rounded-xl"
          />
          <div className="mt-4 text-center">
            <h3 className="font-bold text-ink">{product.name}</h3>
            <p className="text-sm text-primary-700 font-semibold mt-0.5">
              {formatCurrency(currentPrice)}
            </p>
          </div>
        </div>
      </Modal>
    </div>
  );
}
