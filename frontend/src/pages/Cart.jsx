import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { ShoppingCart, ArrowLeft, Trash2 } from 'lucide-react';
import { useCartStore } from '../store/cartStore';
import { useAuthStore } from '../store/authStore';
import CartItem from '../components/cart/CartItem';
import CartSummary from '../components/cart/CartSummary';
import FreeShipBar from '../components/cart/FreeShipBar';
import EmptyState from '../components/ui/EmptyState';
import ConfirmDialog from '../components/ui/ConfirmDialog';
import Button from '../components/ui/Button';

/**
 * Cart page component complying with Design.md 7.4 (v2.0)
 */
export default function Cart() {
  const navigate = useNavigate();
  const { items, updateQuantity, removeItem, clearCart, getTotalPrice, getTotalCount } =
    useCartStore();
  const { isAuthenticated } = useAuthStore();

  const [isClearModalOpen, setIsClearModalOpen] = useState(false);

  const totalCount = getTotalCount();
  const totalPrice = getTotalPrice();

  const handleCheckout = () => {
    if (!isAuthenticated) {
      navigate('/login', { state: { from: '/checkout' } });
    } else {
      navigate('/checkout');
    }
  };

  const handleConfirmClear = () => {
    clearCart();
    setIsClearModalOpen(false);
  };

  // Empty Cart State (Design.md 7.4: bg-grid rounded-3xl py-16 + ShoppingCart sticker + floating emoji)
  if (items.length === 0) {
    return (
      <div className="mx-auto w-full max-w-7xl px-4 sm:px-6 lg:px-8 py-10 sm:py-16">
        <div className="relative overflow-hidden bg-grid rounded-3xl border border-line p-8 sm:p-16 text-center shadow-soft">
          <span
            className="absolute top-8 left-12 text-4xl opacity-50 animate-[float_5s_ease-in-out_infinite] pointer-events-none select-none hidden sm:block"
            aria-hidden="true"
          >
            🧸
          </span>
          <span
            className="absolute bottom-8 right-12 text-4xl opacity-50 animate-[float-slow_8s_ease-in-out_infinite] pointer-events-none select-none hidden sm:block"
            aria-hidden="true"
          >
            🎁
          </span>

          <EmptyState
            icon={ShoppingCart}
            title="Giỏ hàng của bạn đang trống"
            description="Có vẻ như bạn chưa chọn được món quà ưng ý. Hãy khám phá ngay các sản phẩm vui nhộn tại FunnyShop nhé!"
            actionLabel="Tiếp tục mua sắm"
            onAction={() => navigate('/')}
          />
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto w-full max-w-7xl px-4 sm:px-6 lg:px-8 py-6 md:py-10 pb-24 sm:pb-10 space-y-6">
      {/* Page Title & Back Link */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <Link
            to="/"
            className="inline-flex items-center gap-1.5 text-sm font-semibold text-ink-muted hover:text-primary-700 transition-colors mb-2"
          >
            <ArrowLeft className="size-4" />
            Tiếp tục mua sắm
          </Link>
          <h1 className="text-2xl md:text-3xl font-extrabold text-ink">
            Giỏ hàng của bạn ({totalCount} sản phẩm)
          </h1>
        </div>

        <Button
          variant="ghost"
          size="sm"
          leftIcon={Trash2}
          onClick={() => setIsClearModalOpen(true)}
          className="self-start sm:self-auto text-ink-subtle hover:text-red-600 hover:bg-red-50"
        >
          Xóa toàn bộ giỏ hàng
        </Button>
      </div>

      {/* Free Shipping Progress Bar (Design.md 7.4) */}
      <FreeShipBar currentTotal={totalPrice} />

      {/* Main Grid: Items (2 cols) vs Summary (1 col) */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 lg:gap-8 items-start">
        {/* Left: Cart Items List */}
        <div className="lg:col-span-2 space-y-3.5">
          {items.map((item) => (
            <CartItem
              key={item.product.id}
              item={item}
              onUpdateQuantity={updateQuantity}
              onRemove={removeItem}
            />
          ))}
        </div>

        {/* Right: Sticky Cart Summary */}
        <div className="lg:col-span-1 lg:sticky lg:top-24">
          <CartSummary
            subtotal={totalPrice}
            total={totalPrice}
            itemCount={totalCount}
            onCheckout={handleCheckout}
          />
        </div>
      </div>

      {/* Confirm clear dialog */}
      <ConfirmDialog
        isOpen={isClearModalOpen}
        onClose={() => setIsClearModalOpen(false)}
        onConfirm={handleConfirmClear}
        title="Xóa toàn bộ giỏ hàng?"
        message="Tất cả sản phẩm sẽ bị xóa khỏi giỏ hàng của bạn. Hành động này không thể hoàn tác."
        confirmText="Xác nhận xóa"
        variant="danger"
      />
    </div>
  );
}
