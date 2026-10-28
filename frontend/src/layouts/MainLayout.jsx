import { useState } from 'react';
import { Outlet } from 'react-router-dom';
import Navbar from '../components/layout/Navbar';
import Footer from '../components/layout/Footer';
import ChatWidget from '../components/chat/ChatWidget';
import ToastContainer from '../components/ui/ToastContainer';
import Modal from '../components/ui/Modal';
import Button from '../components/ui/Button';
import { formatCurrency } from '../utils/formatCurrency';
import { Star, ShoppingCart } from 'lucide-react';
import { useCartStore } from '../store/cartStore';
import { toast } from '../store/toastStore';
import QuantityStepper from '../components/ui/QuantityStepper';

/**
 * MainLayout complying with Design.md 3.4
 */
export default function MainLayout({ onSearch, searchQuery }) {
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [modalQuantity, setModalQuantity] = useState(1);
  const addItem = useCartStore((s) => s.addItem);

  const handleSelectProduct = (product) => {
    setSelectedProduct(product);
    setModalQuantity(1);
  };

  const handleAddToCartFromModal = () => {
    if (!selectedProduct) return;
    const ok = addItem(selectedProduct, modalQuantity);
    if (ok) {
      toast.success(`Đã thêm ${modalQuantity} sản phẩm vào giỏ hàng`);
      setSelectedProduct(null);
    } else {
      toast.warning(`Chỉ còn ${selectedProduct.stock} sản phẩm trong kho`);
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-page text-ink antialiased selection:bg-primary-100 selection:text-primary-900">
      <ToastContainer />
      <Navbar onSearch={onSearch} initialSearchQuery={searchQuery} />

      <main className="flex-1 min-h-[calc(100vh-4rem)]">
        <Outlet context={{ onSelectProduct: handleSelectProduct }} />
      </main>

      <Footer />
      <ChatWidget onSelectProduct={handleSelectProduct} />

      {/* Quick Product Detail Modal */}
      <Modal
        isOpen={Boolean(selectedProduct)}
        onClose={() => setSelectedProduct(null)}
        title="Chi tiết sản phẩm"
        maxWidth="max-w-2xl"
      >
        {selectedProduct && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-2">
            <div className="aspect-square rounded-xl overflow-hidden bg-gray-50 border border-line flex items-center justify-center">
              <img
                src={selectedProduct.imageUrl}
                alt={selectedProduct.name}
                className="w-full h-full object-cover"
              />
            </div>

            <div className="flex flex-col justify-between">
              <div>
                <span className="text-xs font-semibold text-secondary-600 uppercase tracking-wider">
                  {selectedProduct.category?.name}
                </span>
                <h2 className="text-xl font-bold text-ink mt-1 mb-2 leading-snug">
                  {selectedProduct.name}
                </h2>

                <div className="flex items-center gap-3 text-sm text-ink-muted mb-3">
                  <span className="flex items-center gap-1 font-semibold text-amber-600">
                    <Star className="size-4 fill-amber-400 text-amber-400" />
                    {selectedProduct.rating || 4.5}
                  </span>
                  <span>|</span>
                  <span
                    className={
                      selectedProduct.stock <= 5
                        ? 'text-amber-700 font-medium'
                        : 'text-ink-muted'
                    }
                  >
                    {selectedProduct.stock === 0
                      ? 'Hết hàng'
                      : selectedProduct.stock <= 5
                      ? `Chỉ còn ${selectedProduct.stock} sản phẩm`
                      : `Còn ${selectedProduct.stock} sản phẩm`}
                  </span>
                </div>

                <div className="text-2xl font-bold text-primary-700 mb-4">
                  {formatCurrency(selectedProduct.price)}
                </div>

                <p className="text-sm text-ink-muted leading-relaxed mb-4">
                  {selectedProduct.description}
                </p>
              </div>

              <div className="pt-4 border-t border-line space-y-4">
                {selectedProduct.stock > 0 && (
                  <div className="flex items-center gap-3">
                    <span className="text-sm font-medium text-ink">Số lượng:</span>
                    <QuantityStepper
                      value={modalQuantity}
                      min={1}
                      max={selectedProduct.stock}
                      onChange={setModalQuantity}
                    />
                  </div>
                )}

                <div className="flex gap-2">
                  <Button
                    variant="primary"
                    fullWidth
                    disabled={selectedProduct.stock <= 0}
                    leftIcon={ShoppingCart}
                    onClick={handleAddToCartFromModal}
                  >
                    {selectedProduct.stock <= 0 ? 'Hết hàng' : 'Thêm vào giỏ hàng'}
                  </Button>
                </div>
              </div>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}
