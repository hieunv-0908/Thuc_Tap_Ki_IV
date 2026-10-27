import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { ShoppingCart, ArrowLeft, Trash2 } from 'lucide-react';
import { useCartStore } from '../store/cartStore';
import { useAuthStore } from '../store/authStore';
import CartItem from '../components/cart/CartItem';
import CartSummary from '../components/cart/CartSummary';
import EmptyState from '../components/ui/EmptyState';
import ConfirmDialog from '../components/ui/ConfirmDialog';

/**
 * Cart page component complying with Design.md 7.4 and FR-03
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
      // Per task.md: "Chưa đăng nhập bấm đặt hàng → /login rồi quay lại"
      navigate('/login', { state: { from: '/checkout' } });
    } else {
      navigate('/checkout');
    }
  };

  const handleConfirmClear = () => {
    clearCart();
    setIsClearModalOpen(false);
  };

  if (items.length === 0) {
    return (
      <div className="mx-auto w-full max-w-7xl px-4 sm:px-6 lg:px-8 py-10 sm:py-16">
        <div className="bg-white rounded-2xl border border-line p-8 sm:p-12 shadow-xs">
          <EmptyState
            icon={ShoppingCart}
            title="Giỏ hàng của bạn đang trống"
            description="Hãy khám phá thêm hàng trăm món đồ chơi, quà tặng thú vị tại FunnyShop nhé!"
            actionLabel="Tiếp tục mua sắm"
            onAction={() => navigate('/')}
          />
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto w-full max-w-7xl px-4 sm:px-6 lg:px-8 py-6 md:py-10 pb-24 sm:pb-10">
      {/* Page Title & Back Link */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6 md:mb-8">
        <div>
          <Link
            to="/"
            className="inline-flex items-center gap-1.5 text-sm font-medium text-ink-muted hover:text-primary-700 transition-colors mb-2"
          >
            <ArrowLeft className="size-4" />
            Tiếp tục mua sắm
          </Link>
          <h1 className="text-2xl md:text-3xl font-bold text-ink">
            Giỏ hàng ({totalCount} sản phẩm)
          </h1>
        </div>

        <button
          type="button"
          onClick={() => setIsClearModalOpen(true)}
          className="self-start sm:self-auto inline-flex items-center gap-1.5 text-sm text-ink-subtle hover:text-red-600 transition-colors cursor-pointer"
        >
          <Trash2 className="size-4" />
          Xóa toàn bộ giỏ hàng
        </button>
      </div>

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
