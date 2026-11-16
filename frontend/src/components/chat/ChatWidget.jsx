import { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  MessageCircle,
  X,
  Send,
  Sparkles,
  Bot,
  AlertCircle,
  Zap,
  ShoppingBag,
  Truck,
  CreditCard,
  Loader2,
  ExternalLink,
  ArrowRight,
} from 'lucide-react';
import { aiApi } from '../../api/ai';
import { orderApi } from '../../api/order';
import { formatCurrency } from '../../utils/formatCurrency';
import { useAuthStore } from '../../store/authStore';
import { toast } from '../../store/toastStore';
import { isValidPhone, isValidAddress } from '../../utils/validators';
import PayOSQRModal from '../payment/PayOSQRModal';

let messageCounter = 0;
function createMessageId(prefix) {
  messageCounter += 1;
  return `${prefix}-${messageCounter}`;
}

/**
 * ChatWidget component complying with Design.md 6.16
 * Hỗ trợ tư vấn thông minh từ danh mục sản phẩm thực tế và Đặt hàng trực tiếp qua Chat.
 */
export default function ChatWidget({ onSelectProduct }) {
  const navigate = useNavigate();
  const { user, isAuthenticated } = useAuthStore();

  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState([
    {
      id: 'welcome-1',
      sender: 'ai',
      text: 'Xin chào! Mình là Trợ lý AI FunnyShop. Mình có thể giúp bạn chọn trang phục thời trang nam/nữ, tư vấn size, phối đồ hoặc đặt hàng trực tiếp ngay trong chat hôm nay 👔👗',
      products: [],
    },
  ]);
  const [inputMessage, setInputMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [lastUserPrompt, setLastUserPrompt] = useState('');

  // Trạng thái Đặt hàng nhanh qua Chat
  const [orderingProduct, setOrderingProduct] = useState(null);
  const [orderQuantity, setOrderQuantity] = useState(1);
  const [orderFullName, setOrderFullName] = useState(user?.fullName || '');
  const [orderPhone, setOrderPhone] = useState(user?.phone || '');
  const [orderAddress, setOrderAddress] = useState(user?.shippingAddress || user?.address || '');
  const [orderPaymentMethod, setOrderPaymentMethod] = useState('COD');
  const [isSubmittingOrder, setIsSubmittingOrder] = useState(false);

  // PayOS modal state
  const [showPayOSModal, setShowPayOSModal] = useState(false);
  const [pendingPayOSOrder, setPendingPayOSOrder] = useState(null);

  const messagesEndRef = useRef(null);

  const quickSuggestions = [
    'Áo Polo & Sơ mi nam',
    'Đầm & Blazer nữ công sở',
    'Chính sách giao hàng & đổi size',
  ];

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    if (isOpen) {
      scrollToBottom();
    }
  }, [messages, isOpen, isLoading, orderingProduct]);

  const handleStartQuickOrder = (product) => {
    setOrderingProduct(product);
    setOrderQuantity(1);
    if (user) {
      if (!orderFullName) setOrderFullName(user.fullName || '');
      if (!orderPhone) setOrderPhone(user.phone || '');
      if (!orderAddress) setOrderAddress(user.shippingAddress || user.address || '');
    }
  };

  const handleGoToFullCheckout = (product, quantity = 1) => {
    const directItem = {
      cartItemId: `chat-direct-${product.id}`,
      id: product.id,
      variantId: product.variantId || (product.variants && product.variants[0]?.id) || null,
      productId: product.id,
      product,
      name: product.name,
      sku: product.sku || `SKU-${product.id}`,
      color: '',
      size: '',
      price: Number(product.price ?? 0),
      imageUrl: product.imageUrl,
      stock: product.stockQuantity ?? product.stock ?? 10,
      quantity,
    };

    setIsOpen(false);
    navigate('/checkout', {
      state: {
        checkoutItems: [directItem],
        isDirectBuy: true,
      },
    });
  };

  const handleConfirmQuickOrder = async () => {
    if (!orderingProduct) return;

    if (!orderFullName.trim()) {
      toast.warning('Vui lòng nhập họ và tên người nhận hàng');
      return;
    }

    if (!isValidPhone(orderPhone)) {
      toast.warning('Số điện thoại không hợp lệ (cần đúng 10 số, ví dụ: 0912345678)');
      return;
    }

    if (!isValidAddress(orderAddress)) {
      toast.warning('Địa chỉ nhận hàng cần tối thiểu 10 ký tự');
      return;
    }

    // Nếu chưa đăng nhập, hướng dẫn người dùng đăng nhập để lưu đơn
    if (!isAuthenticated) {
      toast.info('Vui lòng đăng nhập để hoàn tất đơn hàng!');
      handleGoToFullCheckout(orderingProduct, orderQuantity);
      return;
    }

    setIsSubmittingOrder(true);
    try {
      const payload = {
        fullName: orderFullName.trim(),
        phone: orderPhone.trim(),
        address: orderAddress.trim(),
        paymentMethod: orderPaymentMethod,
        items: [
          {
            productId: orderingProduct.id,
            variantId: orderingProduct.variantId || (orderingProduct.variants && orderingProduct.variants[0]?.id) || null,
            quantity: orderQuantity,
          },
        ],
        idempotencyKey: typeof crypto !== 'undefined' && crypto.randomUUID ? crypto.randomUUID() : undefined,
      };

      const orderRes = await orderApi.createOrder(payload);
      const createdOrder = orderRes?.data || orderRes;
      const orderId = createdOrder?.id || createdOrder?.orderId;
      const totalPrice = orderingProduct.price * orderQuantity;

      if (orderPaymentMethod === 'PAYOS') {
        setPendingPayOSOrder(createdOrder);
        setShowPayOSModal(true);
      } else {
        // Đặt hàng COD thành công
        const orderSuccessMsg = {
          id: createMessageId('ai'),
          sender: 'ai',
          text: `🎉 Chúc mừng bạn! Đơn hàng **#${orderId}** (${formatCurrency(totalPrice)}) đã được đặt thành công qua FunnyShop AI.\nĐịa chỉ giao: ${orderAddress.trim()}.\nShop sẽ liên hệ xác nhận và giao hàng cho bạn trong 2 - 4 ngày tới nhé! 🚚`,
          orderAction: { id: orderId },
        };
        setMessages((prev) => [...prev, orderSuccessMsg]);
        toast.success(`Đặt hàng thành công! Mã đơn: #${orderId}`);
      }

      setOrderingProduct(null);
    } catch (err) {
      const errMsg = err?.response?.data?.message || err?.message || 'Có lỗi xảy ra khi tạo đơn hàng';
      toast.error(errMsg);
    } finally {
      setIsSubmittingOrder(false);
    }
  };

  const handlePayOSSuccess = () => {
    setShowPayOSModal(false);
    if (pendingPayOSOrder) {
      const successMsg = {
        id: createMessageId('ai'),
        sender: 'ai',
        text: `🎉 Thanh toán VietQR PayOS thành công cho đơn hàng **#${pendingPayOSOrder.id}**! Đơn hàng đang được chuẩn bị để giao tới bạn sớm nhất. Cảm ơn bạn đã mua sắm tại FunnyShop! 👗👔`,
        orderAction: { id: pendingPayOSOrder.id },
      };
      setMessages((prev) => [...prev, successMsg]);
      toast.success('Thanh toán qua PayOS thành công!');
    }
  };

  const handleSendMessage = async (textToSend) => {
    const text = (textToSend || inputMessage).trim();
    if (!text || isLoading) return;

    setLastUserPrompt(text);
    const userMsg = {
      id: createMessageId('user'),
      sender: 'user',
      text,
    };

    setMessages((prev) => [...prev, userMsg]);
    setInputMessage('');
    setIsLoading(true);

    try {
      const response = await aiApi.chat(text);
      const data = response?.data || response;

      // 1. Nếu tin nhắn chứa thông tin đặt hàng đầy đủ (Họ tên, SĐT, Địa chỉ, Sản phẩm) -> Đặt hàng tự động ngay lập tức
      if (data?.isAutoOrder && data?.orderPayload) {
        try {
          const payload = {
            ...data.orderPayload,
            idempotencyKey: typeof crypto !== 'undefined' && crypto.randomUUID ? crypto.randomUUID() : undefined,
          };
          const orderRes = await orderApi.createOrder(payload);
          const createdOrder = orderRes?.data || orderRes;
          const orderId = createdOrder?.id || createdOrder?.orderId || 0;

          let totalAmount = 0;
          if (data.products && data.products.length > 0) {
            totalAmount = data.products.reduce((acc, p) => acc + (p.price * (p.orderQuantity || 1)), 0);
          } else if (createdOrder?.totalAmount) {
            totalAmount = createdOrder.totalAmount;
          }

          const itemsText = (data.products || [])
            .map((p) => `- **${p.name}** (x${p.orderQuantity || 1}) - ${formatCurrency(p.price * (p.orderQuantity || 1))}`)
            .join('\n');

          const paymentMethodText = data.orderPayload.paymentMethod === 'COD'
            ? 'Thanh toán khi nhận hàng (COD)'
            : 'VietQR PayOS';

          if (data.orderPayload.paymentMethod === 'PAYOS') {
            setPendingPayOSOrder(createdOrder);
            setShowPayOSModal(true);
          }

          const successMsg = {
            id: createMessageId('ai'),
            sender: 'ai',
            text: `🎉 **FunnyShop đã tiếp nhận và đặt hàng thành công cho bạn!**\n\n📦 **Thông tin đơn hàng:**\n- **Mã đơn hàng:** #${orderId}\n- **Khách hàng:** ${data.orderPayload.fullName} (${data.orderPayload.phone})\n- **Địa chỉ giao:** ${data.orderPayload.address}\n- **Phương thức:** ${paymentMethodText}\n\n🛍️ **Sản phẩm:**\n${itemsText || '- Đã ghi nhận theo yêu cầu của bạn'}\n\n💰 **Tổng thanh toán:** ${formatCurrency(totalAmount)}\n\nShop sẽ sớm liên hệ xác nhận và tiến hành giao hàng trong 2 - 4 ngày tới cho bạn nhé! Cảm ơn bạn rất nhiều! 👗👔`,
            orderAction: { id: orderId },
            products: data.products || [],
          };

          setMessages((prev) => [...prev, successMsg]);
          toast.success(`Đặt hàng thành công! Mã đơn: #${orderId}`);
          return;
        } catch (err) {
          const errMsg = err?.response?.data?.message || err?.message || 'Có lỗi xảy ra khi tạo đơn hàng';
          const failMsg = {
            id: createMessageId('ai'),
            sender: 'ai',
            isError: true,
            text: `Dạ mình đã nhận được thông tin đặt hàng của bạn, tuy nhiên: ${errMsg}. Bạn có thể bấm nút Đặt mua ngay bên dưới để kiểm tra lại nhé!`,
            products: data.products || [],
          };
          setMessages((prev) => [...prev, failMsg]);
          return;
        }
      }

      // 2. Nếu phát hiện ý định đặt hàng từ lời chat, tự động mở form đặt hàng nhanh cho sản phẩm
      if (data?.isOrderIntent && data?.targetProduct) {
        handleStartQuickOrder(data.targetProduct);
      }

      const aiMsg = {
        id: createMessageId('ai'),
        sender: 'ai',
        text: data?.reply || 'Mình có một số gợi ý trang phục thời trang phù hợp cho bạn:',
        products: data?.products || [],
      };
      setMessages((prev) => [...prev, aiMsg]);
    } catch {
      const errorMsg = {
        id: createMessageId('err'),
        sender: 'ai',
        isError: true,
        text: 'Mình chưa trả lời được lúc này. Bạn vui lòng thử lại nhé.',
      };
      setMessages((prev) => [...prev, errorMsg]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleRetry = () => {
    if (lastUserPrompt) {
      handleSendMessage(lastUserPrompt);
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  return (
    <>
      {/* Floating trigger button */}
      {!isOpen && (
        <button
          type="button"
          onClick={() => setIsOpen(true)}
          className="fixed bottom-4 right-4 z-[45] size-14 rounded-full bg-secondary-500 text-white shadow-violet hover:bg-secondary-600 active:bg-secondary-700 flex items-center justify-center transition-transform hover:scale-105 active:scale-95 cursor-pointer"
          aria-label="Mở trò chuyện với trợ lý FunnyShop"
        >
          <MessageCircle className="size-7" />
          <span className="absolute -top-1 -right-1 flex h-3.5 w-3.5">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary-400 opacity-75" />
            <span className="relative inline-flex rounded-full h-3.5 w-3.5 bg-primary-500" />
          </span>
        </button>
      )}

      {/* Chat Panel */}
      {isOpen && (
        <div className="fixed inset-x-2 bottom-2 sm:inset-x-auto sm:bottom-24 sm:right-4 z-[45] w-auto sm:w-[390px] h-[550px] max-h-[85vh] rounded-2xl bg-white shadow-xl border border-line flex flex-col overflow-hidden animate-in slide-in-from-bottom-4 duration-200">
          {/* Header */}
          <div className="bg-secondary-500 text-white px-4 py-3.5 flex items-center justify-between shrink-0 shadow-xs">
            <div className="flex items-center gap-2.5">
              <div className="size-8 rounded-full bg-white/20 flex items-center justify-center">
                <Sparkles className="size-4.5 text-white" />
              </div>
              <div>
                <h3 className="text-sm font-semibold leading-tight">Trợ lý FunnyShop</h3>
                <span className="text-[11px] text-secondary-100 flex items-center gap-1">
                  <span className="size-1.5 rounded-full bg-emerald-400" />
                  Tư vấn & Đặt hàng 24/7
                </span>
              </div>
            </div>

            <button
              type="button"
              onClick={() => setIsOpen(false)}
              className="p-1 rounded-lg text-white/80 hover:text-white hover:bg-white/10 transition-colors cursor-pointer"
              aria-label="Đóng bảng trò chuyện"
            >
              <X className="size-5" />
            </button>
          </div>

          {/* Messages container */}
          <div className="flex-1 p-3.5 overflow-y-auto space-y-3 bg-gray-50/50">
            {messages.map((m) => (
              <div
                key={m.id}
                className={`flex gap-2 ${m.sender === 'user' ? 'justify-end' : 'justify-start'}`}
              >
                {m.sender === 'ai' && (
                  <div className="size-7 rounded-full bg-secondary-100 text-secondary-700 flex items-center justify-center shrink-0 mt-0.5">
                    <Bot className="size-4" />
                  </div>
                )}

                <div className="max-w-[85%] flex flex-col gap-1.5">
                  <div
                    className={`px-3.5 py-2 text-sm leading-relaxed whitespace-pre-wrap ${
                      m.sender === 'user'
                        ? 'bg-secondary-500 text-white rounded-2xl rounded-br-xs self-end'
                        : m.isError
                        ? 'bg-red-50 text-red-700 border border-red-200 rounded-2xl rounded-bl-xs'
                        : 'bg-white text-ink border border-line rounded-2xl rounded-bl-xs shadow-2xs'
                    }`}
                  >
                    {m.isError && (
                      <div className="flex items-center gap-1.5 font-semibold text-red-700 mb-1">
                        <AlertCircle className="size-3.5 shrink-0" />
                        <span>Thông báo</span>
                      </div>
                    )}
                    {m.text}
                    {m.isError && (
                      <div className="mt-2">
                        <button
                          type="button"
                          onClick={handleRetry}
                          className="text-xs font-semibold text-red-700 underline hover:text-red-900 cursor-pointer"
                        >
                          Thử lại
                        </button>
                      </div>
                    )}
                  </div>

                  {/* Nút hành động xem đơn hàng nếu có */}
                  {m.orderAction && (
                    <div className="p-2.5 bg-emerald-50 border border-emerald-200 rounded-xl flex items-center justify-between gap-2 shadow-2xs">
                      <div className="text-xs font-bold text-emerald-800">
                        Đơn hàng #{m.orderAction.id}
                      </div>
                      <button
                        type="button"
                        onClick={() => {
                          setIsOpen(false);
                          navigate(`/orders/${m.orderAction.id}`);
                        }}
                        className="text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-700 px-3 py-1 rounded-lg cursor-pointer flex items-center gap-1 transition-colors"
                      >
                        <span>Xem đơn hàng</span>
                        <ArrowRight className="size-3" />
                      </button>
                    </div>
                  )}

                  {/* Product Cards inside AI response if any */}
                  {m.products && m.products.length > 0 && (
                    <div className="flex flex-col gap-2 mt-1">
                      {m.products.map((p) => (
                        <div
                          key={p.id}
                          className="p-2.5 bg-white rounded-xl border border-line shadow-2xs hover:border-secondary-300 transition-colors flex flex-col gap-2"
                        >
                          <div className="flex items-center gap-2.5">
                            <img
                              src={p.imageUrl}
                              alt={p.name}
                              className="size-12 rounded-lg object-cover bg-gray-100 shrink-0"
                            />
                            <div className="flex-1 min-w-0">
                              <p className="text-xs font-semibold text-ink truncate">{p.name}</p>
                              <p className="text-xs font-bold text-primary-700">
                                {formatCurrency(p.price)}
                              </p>
                            </div>
                          </div>

                          <div className="flex items-center gap-1.5 pt-1.5 border-t border-line/60">
                            <button
                              type="button"
                              onClick={() => handleStartQuickOrder(p)}
                              className="flex-1 py-1.5 px-2 rounded-lg bg-primary-600 hover:bg-primary-700 text-white text-[11px] font-bold flex items-center justify-center gap-1 transition-colors cursor-pointer"
                            >
                              <Zap className="size-3" />
                              <span>Đặt mua ngay</span>
                            </button>
                            <button
                              type="button"
                              onClick={() => {
                                if (onSelectProduct) {
                                  onSelectProduct(p);
                                } else {
                                  setIsOpen(false);
                                  navigate(`/products/${p.id}`);
                                }
                              }}
                              className="py-1.5 px-2.5 rounded-lg bg-gray-100 hover:bg-gray-200 text-ink text-[11px] font-medium flex items-center justify-center gap-1 transition-colors cursor-pointer"
                            >
                              <span>Xem</span>
                              <ExternalLink className="size-3 text-gray-500" />
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            ))}

            {/* AI is thinking bubble */}
            {isLoading && (
              <div className="flex items-center gap-2">
                <div className="size-7 rounded-full bg-secondary-100 text-secondary-700 flex items-center justify-center shrink-0">
                  <Bot className="size-4" />
                </div>
                <div className="bg-white border border-line rounded-2xl rounded-bl-xs px-3.5 py-2.5 flex items-center gap-1.5 shadow-2xs">
                  <span className="size-2 rounded-full bg-secondary-400 animate-bounce" />
                  <span
                    className="size-2 rounded-full bg-secondary-400 animate-bounce"
                    style={{ animationDelay: '150ms' }}
                  />
                  <span
                    className="size-2 rounded-full bg-secondary-400 animate-bounce"
                    style={{ animationDelay: '300ms' }}
                  />
                </div>
              </div>
            )}

            <div ref={messagesEndRef} />
          </div>

          {/* Quick Suggestions Chips */}
          {messages.length <= 3 && !isLoading && !orderingProduct && (
            <div className="px-3 py-2 border-t border-line/60 bg-white flex items-center gap-1.5 overflow-x-auto no-scrollbar">
              {quickSuggestions.map((sug, idx) => (
                <button
                  key={idx}
                  type="button"
                  onClick={() => handleSendMessage(sug)}
                  className="shrink-0 text-xs text-secondary-700 bg-secondary-50 hover:bg-secondary-100 border border-secondary-200 rounded-full px-2.5 py-1 transition-colors cursor-pointer"
                >
                  {sug}
                </button>
              ))}
            </div>
          )}

          {/* Hộp Đặt Hàng Nhanh qua Chat */}
          {orderingProduct && (
            <div className="p-3 bg-secondary-50/80 border-t border-line flex flex-col gap-2.5 animate-in slide-in-from-bottom-2 duration-150">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-1.5 text-xs font-bold text-secondary-900">
                  <ShoppingBag className="size-3.5 text-primary-600" />
                  <span>Đặt hàng nhanh qua AI</span>
                </div>
                <button
                  type="button"
                  onClick={() => setOrderingProduct(null)}
                  className="text-gray-400 hover:text-gray-600 p-0.5 cursor-pointer"
                  aria-label="Đóng đặt hàng nhanh"
                >
                  <X className="size-3.5" />
                </button>
              </div>

              {/* Product mini info & quantity stepper */}
              <div className="flex items-center gap-2 p-1.5 bg-white rounded-lg border border-line">
                <img
                  src={orderingProduct.imageUrl}
                  alt={orderingProduct.name}
                  className="size-10 rounded-md object-cover bg-gray-100 shrink-0"
                />
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-semibold text-ink truncate">{orderingProduct.name}</p>
                  <p className="text-xs font-bold text-primary-700">
                    {formatCurrency(orderingProduct.price * orderQuantity)}
                  </p>
                </div>
                <div className="flex items-center border border-line rounded-md bg-gray-50">
                  <button
                    type="button"
                    onClick={() => setOrderQuantity(Math.max(1, orderQuantity - 1))}
                    className="px-2 py-0.5 text-xs font-bold text-gray-600 hover:bg-gray-200 rounded-l-md cursor-pointer"
                  >
                    -
                  </button>
                  <span className="px-2 text-xs font-semibold text-ink">{orderQuantity}</span>
                  <button
                    type="button"
                    onClick={() => setOrderQuantity(orderQuantity + 1)}
                    className="px-2 py-0.5 text-xs font-bold text-gray-600 hover:bg-gray-200 rounded-r-md cursor-pointer"
                  >
                    +
                  </button>
                </div>
              </div>

              {/* Input fields */}
              <div className="grid grid-cols-2 gap-1.5">
                <input
                  type="text"
                  placeholder="Họ và tên người nhận *"
                  value={orderFullName}
                  onChange={(e) => setOrderFullName(e.target.value)}
                  className="h-8 px-2.5 text-xs rounded-lg border border-line bg-white text-ink placeholder:text-gray-400 focus:outline-none focus:border-secondary-500"
                />
                <input
                  type="text"
                  placeholder="Số điện thoại (10 số) *"
                  value={orderPhone}
                  onChange={(e) => setOrderPhone(e.target.value)}
                  className="h-8 px-2.5 text-xs rounded-lg border border-line bg-white text-ink placeholder:text-gray-400 focus:outline-none focus:border-secondary-500"
                />
              </div>

              <input
                type="text"
                placeholder="Địa chỉ nhận hàng chi tiết *"
                value={orderAddress}
                onChange={(e) => setOrderAddress(e.target.value)}
                className="h-8 px-2.5 text-xs rounded-lg border border-line bg-white text-ink placeholder:text-gray-400 focus:outline-none focus:border-secondary-500"
              />

              {/* Payment method selector */}
              <div className="flex items-center gap-1.5">
                <button
                  type="button"
                  onClick={() => setOrderPaymentMethod('COD')}
                  className={`flex-1 py-1 px-2 rounded-lg text-xs font-semibold flex items-center justify-center gap-1 transition-colors cursor-pointer border ${
                    orderPaymentMethod === 'COD'
                      ? 'bg-secondary-600 text-white border-secondary-600'
                      : 'bg-white text-gray-700 border-line hover:bg-gray-50'
                  }`}
                >
                  <Truck className="size-3" />
                  <span>COD (Tiền mặt)</span>
                </button>

                <button
                  type="button"
                  onClick={() => setOrderPaymentMethod('PAYOS')}
                  className={`flex-1 py-1 px-2 rounded-lg text-xs font-semibold flex items-center justify-center gap-1 transition-colors cursor-pointer border ${
                    orderPaymentMethod === 'PAYOS'
                      ? 'bg-primary-600 text-white border-primary-600'
                      : 'bg-white text-gray-700 border-line hover:bg-gray-50'
                  }`}
                >
                  <CreditCard className="size-3" />
                  <span>VietQR PayOS</span>
                </button>
              </div>

              {/* Action buttons */}
              <div className="flex flex-col gap-1 mt-0.5">
                <button
                  type="button"
                  onClick={handleConfirmQuickOrder}
                  disabled={isSubmittingOrder}
                  className="w-full h-8.5 rounded-lg bg-primary-600 hover:bg-primary-700 text-white text-xs font-bold flex items-center justify-center gap-1.5 transition-colors cursor-pointer disabled:opacity-50"
                >
                  {isSubmittingOrder ? (
                    <Loader2 className="size-3.5 animate-spin" />
                  ) : (
                    <Zap className="size-3.5" />
                  )}
                  <span>Xác nhận đặt hàng • {formatCurrency(orderingProduct.price * orderQuantity)}</span>
                </button>

                <button
                  type="button"
                  onClick={() => handleGoToFullCheckout(orderingProduct, orderQuantity)}
                  className="text-[11px] text-center text-secondary-700 hover:text-secondary-900 font-medium underline py-0.5 cursor-pointer"
                >
                  Hoặc chuyển sang trang thanh toán đầy đủ →
                </button>
              </div>
            </div>
          )}

          {/* Input Box */}
          <div className="p-3 bg-white border-t border-line flex items-center gap-2">
            <input
              type="text"
              value={inputMessage}
              onChange={(e) => setInputMessage(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Nhập câu hỏi hoặc yêu cầu đặt hàng..."
              disabled={isLoading}
              className="flex-1 h-10 rounded-full border border-line bg-gray-50 px-3.5 text-sm text-ink placeholder:text-ink-subtle focus:bg-white focus:outline-none focus:border-secondary-500 focus:ring-1 focus:ring-secondary-200"
            />
            <button
              type="button"
              onClick={() => handleSendMessage()}
              disabled={!inputMessage.trim() || isLoading}
              className="size-10 rounded-full bg-secondary-500 text-white flex items-center justify-center hover:bg-secondary-600 disabled:opacity-40 disabled:cursor-not-allowed transition-colors shrink-0 cursor-pointer"
              aria-label="Gửi tin nhắn"
            >
              <Send className="size-4" />
            </button>
          </div>
        </div>
      )}

      {/* PayOS VietQR Modal tích hợp trong Chat */}
      {showPayOSModal && pendingPayOSOrder && (
        <PayOSQRModal
          isOpen={showPayOSModal}
          order={pendingPayOSOrder}
          onSuccess={handlePayOSSuccess}
          onClose={() => setShowPayOSModal(false)}
        />
      )}
    </>
  );
}
