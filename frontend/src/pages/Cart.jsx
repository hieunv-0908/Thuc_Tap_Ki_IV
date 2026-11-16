import { useState, useMemo } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { ShoppingCart, ArrowLeft, Trash2 } from 'lucide-react';
import { useCartStore } from '../store/cartStore';
import { useAuthStore } from '../store/authStore';
import { toast } from '../store/toastStore';
import CartItem from '../components/cart/CartItem';
import CartSummary from '../components/cart/CartSummary';
import FreeShipBar from '../components/cart/FreeShipBar';
import EmptyState from '../components/ui/EmptyState';
import ConfirmDialog from '../components/ui/ConfirmDialog';
import Button from '../components/ui/Button';

function getItemKey(item) {
  return (
    item.cartItemId ||
    (item.variantId ? `var-${item.variantId}` : `prod-${item.productId || item.id}`)
  );
}

/**
 * Cart page component complying with Design.md 7.4 (v2.0)
 */
export default function Cart() {
  const navigate = useNavigate();
  const { items, updateQuantity, removeItem, clearCart, getTotalCount } =
    useCartStore();
  const { isAuthenticated } = useAuthStore();

  const [isClearModalOpen, setIsClearModalOpen] = useState(false);

  // Lưu danh sách các itemKey bị BỎ chọn (mặc định rỗng = chọn tất cả sản phẩm)
  const [deselectedItemIds, setDeselectedItemIds] = useState([]);

  const allItemKeys = useMemo(() => items.map(getItemKey), [items]);

  // Danh sách các sản phẩm đang được tick chọn
  const selectedItems = useMemo(() => {
    const deselectedSet = new Set(deselectedItemIds);
    return items.filter((item) => !deselectedSet.has(getItemKey(item)));
  }, [items, deselectedItemIds]);

  const isAllSelected = items.length > 0 && selectedItems.length === items.length;

  const handleToggleSelectAll = () => {
    if (isAllSelected) {
      // Đang chọn tất cả -> bỏ chọn tất cả
      setDeselectedItemIds(allItemKeys);
    } else {
      // Chọn tất cả
      setDeselectedItemIds([]);
    }
  };

  const handleToggleSelectItem = (id) => {
    setDeselectedItemIds((prev) =>
      prev.includes(id) ? prev.filter((itId) => itId !== id) : [...prev, id]
    );
  };

  const selectedTotalCount = useMemo(
    () => selectedItems.reduce((acc, i) => acc + (i.quantity || 0), 0),
    [selectedItems]
  );

  const selectedTotalPrice = useMemo(
    () =>
      selectedItems.reduce(
        (acc, i) => acc + (Number(i.price) || 0) * (i.quantity || 0),
        0
      ),
    [selectedItems]
  );

  const totalCount = getTotalCount();

  const handleCheckout = () => {
    if (selectedItems.length === 0) {
      toast.warning('Vui lòng chọn ít nhất 1 sản phẩm để thanh toán');
      return;
    }

    if (!isAuthenticated) {
      navigate('/login', { state: { from: '/checkout', checkoutItems: selectedItems } });
    } else {
      navigate('/checkout', { state: { checkoutItems: selectedItems } });
    }
  };

  const handleConfirmClear = () => {
    clearCart();
    setDeselectedItemIds([]);
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
      <FreeShipBar currentTotal={selectedTotalPrice} />

      {/* Main Grid: Items (2 cols) vs Summary (1 col) */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 lg:gap-8 items-start">
        {/* Left: Select all bar & Cart Items List */}
        <div className="lg:col-span-2 space-y-3.5">
          {/* Select All Checkbox Header */}
          <div className="flex items-center justify-between p-3.5 sm:p-4 bg-white rounded-xl border border-line shadow-soft">
            <label className="flex items-center gap-3 cursor-pointer text-sm font-semibold text-ink select-none">
              <input
                type="checkbox"
                checked={isAllSelected}
                onChange={handleToggleSelectAll}
                className="size-5 rounded border-line text-primary-700 focus:ring-primary-500 focus:ring-offset-0 cursor-pointer accent-primary-700"
              />
              <span>Chọn tất cả ({items.length} sản phẩm)</span>
            </label>

            <span className="text-xs text-ink-muted">
              Đã chọn <strong className="text-primary-700 font-bold">{selectedItems.length}</strong> / {items.length} món
            </span>
          </div>

          {/* Cart Items */}
          {items.map((item) => {
            const itemKey = getItemKey(item);
            return (
              <CartItem
                key={itemKey}
                item={item}
                isSelected={!deselectedItemIds.includes(itemKey)}
                onToggleSelect={() => handleToggleSelectItem(itemKey)}
                onUpdateQuantity={updateQuantity}
                onRemove={removeItem}
              />
            );
          })}
        </div>

        {/* Right: Sticky Cart Summary */}
        <div className="lg:col-span-1 lg:sticky lg:top-24">
          <CartSummary
            subtotal={selectedTotalPrice}
            total={selectedTotalPrice}
            itemCount={selectedTotalCount}
            onCheckout={handleCheckout}
            disabled={selectedItems.length === 0}
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
