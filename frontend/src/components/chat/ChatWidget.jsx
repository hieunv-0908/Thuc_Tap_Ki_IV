import { useState, useRef, useEffect } from 'react';
import { MessageCircle, X, Send, Sparkles, Bot, AlertCircle } from 'lucide-react';
import { aiApi } from '../../api/ai';
import { formatCurrency } from '../../utils/formatCurrency';

let messageCounter = 0;
function createMessageId(prefix) {
  messageCounter += 1;
  return `${prefix}-${messageCounter}`;
}

/**
 * ChatWidget component complying with Design.md 6.16
 */
export default function ChatWidget({ onSelectProduct }) {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState([
    {
      id: 'welcome-1',
      sender: 'ai',
      text: 'Xin chào! Mình là Trợ lý AI FunnyShop. Mình có thể giúp bạn tìm quà tặng độc đáo hoặc gợi ý sản phẩm hôm nay 🎁',
      products: [],
    },
  ]);
  const [inputMessage, setInputMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [lastUserPrompt, setLastUserPrompt] = useState('');

  const messagesEndRef = useRef(null);

  const quickSuggestions = [
    'Gợi ý quà tặng dưới 200.000đ',
    'Sản phẩm bán chạy nhất',
    'Chính sách giao hàng',
  ];

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    if (isOpen) {
      scrollToBottom();
    }
  }, [messages, isOpen, isLoading]);

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
      const aiMsg = {
        id: createMessageId('ai'),
        sender: 'ai',
        text: response.reply || 'Mình có một số gợi ý phù hợp cho bạn:',
        products: response.products || [],
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
      {/* Floating trigger button (Design.md 6.16) */}
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
        <div className="fixed inset-x-2 bottom-2 sm:inset-x-auto sm:bottom-24 sm:right-4 z-[45] w-auto sm:w-[380px] h-[520px] max-h-[85vh] rounded-2xl bg-white shadow-xl border border-line flex flex-col overflow-hidden animate-in slide-in-from-bottom-4 duration-200">
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
                  Sẵn sàng giải đáp
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

                <div className="max-w-[82%] flex flex-col gap-1.5">
                  <div
                    className={`px-3.5 py-2 text-sm leading-relaxed ${
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

                  {/* Product Cards inside AI response if any */}
                  {m.products && m.products.length > 0 && (
                    <div className="flex flex-col gap-2 mt-1">
                      {m.products.map((p) => (
                        <div
                          key={p.id}
                          onClick={() => onSelectProduct && onSelectProduct(p)}
                          className="flex items-center gap-2.5 p-2 bg-white rounded-xl border border-line shadow-2xs hover:border-secondary-300 transition-colors cursor-pointer"
                        >
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
                          <span className="text-[11px] font-semibold text-secondary-600 shrink-0 pr-1">
                            Xem &rarr;
                          </span>
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
          {messages.length <= 3 && !isLoading && (
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

          {/* Input Box */}
          <div className="p-3 bg-white border-t border-line flex items-center gap-2">
            <input
              type="text"
              value={inputMessage}
              onChange={(e) => setInputMessage(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Nhập câu hỏi cho trợ lý..."
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
    </>
  );
}
