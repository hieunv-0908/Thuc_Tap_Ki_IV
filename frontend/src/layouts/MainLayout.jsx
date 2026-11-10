import { useState } from 'react';
import { Outlet } from 'react-router-dom';
import AnnouncementBar from '../components/layout/AnnouncementBar';
import Navbar from '../components/layout/Navbar';
import Footer from '../components/layout/Footer';
import ChatWidget from '../components/chat/ChatWidget';
import ScrollToTop from '../components/ui/ScrollToTop';
import ToastContainer from '../components/ui/ToastContainer';
import Modal from '../components/ui/Modal';
import Button from '../components/ui/Button';
import QuantityStepper from '../components/ui/QuantityStepper';
import ProductVariantSelector from '../components/product/ProductVariantSelector';
import { formatCurrency } from '../utils/formatCurrency';
import { getCategoryMeta } from '../utils/constants';
import { Star, ShoppingCart, CheckCircle2, ShieldCheck, Truck, RotateCcw } from 'lucide-react';
import { useCartStore } from '../store/cartStore';
import { toast } from '../store/toastStore';

/**
 * MainLayout complying with Design.md 3.4 & Fashion Variants
 */
export default function MainLayout({ onSearch, searchQuery }) {
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [selectedVariant, setSelectedVariant] = useState(null);
  const [currentImage, setCurrentImage] = useState(null);
  const [modalQuantity, setModalQuantity] = useState(1);
  const addItem = useCartStore((s) => s.addItem);

  const handleSelectProduct = (product) => {
    setSelectedProduct(product);
    setModalQuantity(1);
    setCurrentImage(product?.imageUrl || null);
    if (product?.variants && product.variants.length > 0) {
      setSelectedVariant(product.variants[0]);
    } else {
      setSelectedVariant(null);
    }
  };

  const currentPrice = selectedVariant ? selectedVariant.price : (selectedProduct?.price || 0);
  const currentStock = selectedVariant ? selectedVariant.stockQuantity : (selectedProduct?.stockQuantity ?? selectedProduct?.stock ?? 0);
  const isOutOfStock = currentStock <= 0;

  const handleAddToCartFromModal = () => {
    if (!selectedProduct) return;
    const targetVariant = selectedVariant || selectedProduct.variants?.[0];

    const cartPayload = targetVariant
      ? {
          variantId: targetVariant.id,
          productId: selectedProduct.id,
          product: selectedProduct,
          name: selectedProduct.name,
          sku: targetVariant.sku,
          color: targetVariant.color,
          size: targetVariant.size,
          price: targetVariant.price,
          imageUrl: currentImage || selectedProduct.imageUrl,
          stockQuantity: targetVariant.stockQuantity,
        }
      : selectedProduct;

    const ok = addItem(cartPayload, modalQuantity);
    if (ok) {
      toast.success(`Đã thêm ${modalQuantity} sản phẩm vào giỏ hàng`);
      setSelectedProduct(null);
    } else {
      toast.warning(`Chỉ còn ${currentStock} sản phẩm trong kho`);
    }
  };

  const categoryName = selectedProduct?.category?.name || '';
  const meta = getCategoryMeta(categoryName);

  return (
    <div className="min-h-screen flex flex-col bg-page text-ink antialiased selection:bg-primary-100 selection:text-primary-900">
      <ToastContainer />
      <AnnouncementBar />
      <Navbar onSearch={onSearch} initialSearchQuery={searchQuery} />

      <main className="flex-1 min-h-[calc(100vh-4rem)]">
        <Outlet context={{ onSelectProduct: handleSelectProduct }} />
      </main>

      <Footer />
      <ChatWidget onSelectProduct={handleSelectProduct} />
      <ScrollToTop />

      {/* Quick Product Detail Modal (Design.md 7.2 & Fashion Variants) */}
      <Modal
        isOpen={Boolean(selectedProduct)}
        onClose={() => setSelectedProduct(null)}
        title="Chi tiết sản phẩm"
        maxWidth="max-w-2xl"
      >
        {selectedProduct && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-1">
            {/* Image Gallery */}
            <div className="relative aspect-square rounded-2xl overflow-hidden bg-primary-50 border border-line flex items-center justify-center">
              <img
                src={currentImage || selectedProduct.imageUrl}
                alt={selectedProduct.name}
                className="w-full h-full object-cover transition-all duration-300"
              />
              <span className="absolute bottom-2.5 left-2.5 inline-flex items-center gap-1.5 rounded-full bg-white/95 backdrop-blur-xs px-2.5 py-1 text-xs font-medium text-ink-muted shadow-2xs">
                <span>{meta.emoji}</span>
                <span>{categoryName}</span>
              </span>
            </div>

            {/* Info */}
            <div className="flex flex-col justify-between">
              <div>
                <h2 className="text-xl font-bold text-ink mb-1.5 leading-snug">
                  {selectedProduct.name}
                </h2>

                {/* Fashion Attributes */}
                {(selectedProduct.brand || selectedProduct.material || selectedProduct.genderType) && (
                  <div className="flex flex-wrap items-center gap-1.5 text-[11px] text-ink-muted mb-2.5">
                    {selectedProduct.brand && (
                      <span className="bg-gray-100 text-ink px-2 py-0.5 rounded font-medium">
                        {selectedProduct.brand}
                      </span>
                    )}
                    {selectedProduct.material && (
                      <span className="bg-gray-100 text-ink-muted px-2 py-0.5 rounded">
                        {selectedProduct.material}
                      </span>
                    )}
                    {selectedProduct.genderType && (
                      <span className="bg-primary-50 text-primary-700 px-2 py-0.5 rounded font-bold uppercase">
                        {selectedProduct.genderType}
                      </span>
                    )}
                  </div>
                )}

                {/* Rating & Stock */}
                <div className="flex items-center gap-3 text-sm text-ink-muted mb-3">
                  <span className="flex items-center gap-1 font-semibold text-amber-600">
                    <Star className="size-4 fill-amber-400 text-amber-400" aria-hidden="true" />
                    {selectedProduct.rating || 4.5}
                  </span>
                  <span>|</span>
                  <span className="inline-flex items-center gap-1 font-medium">
                    {isOutOfStock ? (
                      <span className="text-red-600 font-semibold">Hết hàng</span>
                    ) : currentStock <= 5 ? (
                      <span className="text-amber-700 font-semibold">
                        Chỉ còn {currentStock} sản phẩm
                      </span>
                    ) : (
                      <span className="text-emerald-700 font-medium flex items-center gap-1">
                        <CheckCircle2 className="size-3.5 text-emerald-600" /> Còn hàng ({currentStock})
                      </span>
                    )}
                  </span>
                </div>

                {/* Price Box */}
                <div className="rounded-xl bg-primary-50 p-3.5 mb-2">
                  <div className="text-2xl font-bold text-primary-700">
                    {formatCurrency(currentPrice)}
                  </div>
                </div>

                {/* Bộ chọn Biến thể (Variants Selector) */}
                <ProductVariantSelector
                  variants={selectedProduct.variants}
                  images={selectedProduct.images}
                  selectedVariant={selectedVariant}
                  onSelectVariant={setSelectedVariant}
                  onSelectImage={setCurrentImage}
                />

                <p className="text-sm text-ink-muted leading-relaxed mb-4 line-clamp-3">
                  {selectedProduct.description}
                </p>

                {/* Trust mini icons */}
                <div className="border-t border-dashed border-line pt-3 mb-4 grid grid-cols-3 gap-2 text-[11px] text-ink-muted">
                  <div className="flex items-center gap-1">
                    <Truck className="size-3.5 text-primary-600 shrink-0" />
                    <span>Giao toàn quốc</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <ShieldCheck className="size-3.5 text-secondary-600 shrink-0" />
                    <span>Thanh toán COD</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <RotateCcw className="size-3.5 text-amber-600 shrink-0" />
                    <span>Đổi trả dễ dàng</span>
                  </div>
                </div>
              </div>

              {/* Add to Cart Actions */}
              <div className="pt-3 border-t border-line space-y-3">
                {!isOutOfStock && (
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium text-ink">Số lượng:</span>
                    <QuantityStepper
                      value={modalQuantity}
                      min={1}
                      max={currentStock}
                      onChange={setModalQuantity}
                    />
                  </div>
                )}

                <Button
                  variant="primary"
                  size="lg"
                  fullWidth
                  disabled={isOutOfStock}
                  leftIcon={ShoppingCart}
                  onClick={handleAddToCartFromModal}
                >
                  {isOutOfStock ? 'Hết hàng' : 'Thêm vào giỏ hàng'}
                </Button>
              </div>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}
