import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Bell,
  CheckCheck,
  Tag,
  Ticket,
  Info,
  PackageCheck,
  ExternalLink,
  Sparkles,
} from 'lucide-react';
import { notificationApi } from '../../api/notification';
import { useAuthStore } from '../../store/authStore';

export default function NotificationDropdown() {
  const navigate = useNavigate();
  const { isAuthenticated } = useAuthStore();

  const [isOpen, setIsOpen] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(false);
  const dropdownRef = useRef(null);

  const effectiveUnreadCount = isAuthenticated ? unreadCount : 0;

  // Lấy số lượng thông báo chưa đọc định kỳ hoặc khi đăng nhập
  useEffect(() => {
    if (!isAuthenticated) return;

    let ignore = false;
    const loadUnreadCount = async () => {
      try {
        const count = await notificationApi.getUnreadCount();
        if (!ignore) {
          setUnreadCount(count);
        }
      } catch {
        // Ignored
      }
    };

    loadUnreadCount();
    const interval = setInterval(loadUnreadCount, 30000); // 30s polling
    return () => {
      ignore = true;
      clearInterval(interval);
    };
  }, [isAuthenticated]);

  // Click outside to close
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Khi mở dropdown -> fetch danh sách thông báo
  const handleToggle = async () => {
    if (!isOpen) {
      setIsOpen(true);
      if (isAuthenticated) {
        setLoading(true);
        try {
          const res = await notificationApi.getMyNotifications({ page: 0, size: 6 });
          const items = res?.content || (Array.isArray(res) ? res : []);
          setNotifications(items);
        } catch {
          // Ignored
        } finally {
          setLoading(false);
        }
      }
    } else {
      setIsOpen(false);
    }
  };

  // Đánh dấu 1 thông báo đã đọc và chuyển hướng
  const handleClickItem = async (item) => {
    if (!item.isRead) {
      try {
        await notificationApi.markAsRead(item.id);
        setNotifications((prev) =>
          prev.map((n) => (n.id === item.id ? { ...n, isRead: true } : n))
        );
        setUnreadCount((prev) => Math.max(0, prev - 1));
      } catch {
        // Ignored
      }
    }

    setIsOpen(false);

    if (item.targetUrl) {
      if (item.targetUrl.startsWith('http')) {
        window.open(item.targetUrl, '_blank', 'noreferrer');
      } else {
        navigate(item.targetUrl);
      }
    }
  };

  // Đánh dấu tất cả là đã đọc
  const handleMarkAllAsRead = async () => {
    try {
      await notificationApi.markAllAsRead();
      setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
      setUnreadCount(0);
    } catch {
      // Ignored
    }
  };

  const getTypeMeta = (type) => {
    switch (type) {
      case 'PROMOTION':
        return {
          label: 'Ưu đãi',
          icon: Tag,
          className: 'bg-rose-50 text-rose-700 border-rose-200',
        };
      case 'VOUCHER':
        return {
          label: 'Mã giảm giá',
          icon: Ticket,
          className: 'bg-purple-50 text-purple-700 border-purple-200',
        };
      case 'ORDER':
        return {
          label: 'Đơn hàng',
          icon: PackageCheck,
          className: 'bg-emerald-50 text-emerald-700 border-emerald-200',
        };
      case 'SYSTEM':
      default:
        return {
          label: 'Tin tức',
          icon: Info,
          className: 'bg-blue-50 text-blue-700 border-blue-200',
        };
    }
  };

  const formatTime = (dateStr) => {
    if (!dateStr) return '';
    try {
      const date = new Date(dateStr);
      return date.toLocaleDateString('vi-VN', {
        day: '2-digit',
        month: '2-digit',
        hour: '2-digit',
        minute: '2-digit',
      });
    } catch {
      return dateStr;
    }
  };

  return (
    <div className="relative" ref={dropdownRef}>
      {/* Chuông thông báo */}
      <button
        type="button"
        onClick={handleToggle}
        className="relative p-2 text-ink hover:text-mute transition-colors flex items-center justify-center cursor-pointer"
        aria-label="Thông báo"
        title="Thông báo"
      >
        <Bell className="size-5" />
        {effectiveUnreadCount > 0 && (
          <span className="absolute -top-0.5 -right-0.5 min-w-4 h-4 px-1 rounded-full bg-vermilion text-paper text-[10px] font-bold flex items-center justify-center animate-pulse">
            {effectiveUnreadCount > 99 ? '99+' : effectiveUnreadCount}
          </span>
        )}
      </button>

      {/* Popover Dropdown */}
      {isOpen && (
        <div className="absolute right-0 mt-2 w-80 sm:w-96 bg-white border border-line shadow-xl z-50 animate-in fade-in zoom-in-95 duration-150 overflow-hidden">
          {/* Header */}
          <div className="p-3.5 bg-paper border-b border-line flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Sparkles className="size-4 text-vermilion" />
              <h3 className="font-serif text-sm font-medium text-ink">Thông báo</h3>
              {effectiveUnreadCount > 0 && (
                <span className="px-1.5 py-0.5 text-[10px] bg-vermilion/10 text-vermilion font-medium rounded-full">
                  {effectiveUnreadCount} mới
                </span>
              )}
            </div>

            {isAuthenticated && effectiveUnreadCount > 0 && (
              <button
                type="button"
                onClick={handleMarkAllAsRead}
                className="text-[11px] text-mute hover:text-ink flex items-center gap-1 transition-colors cursor-pointer"
                title="Đánh dấu tất cả là đã đọc"
              >
                <CheckCheck className="size-3.5" />
                <span>Đã đọc tất cả</span>
              </button>
            )}
          </div>

          {/* Body */}
          <div className="max-h-[380px] overflow-y-auto divide-y divide-line">
            {!isAuthenticated ? (
              <div className="p-6 text-center text-xs text-mute font-light space-y-2">
                <p>Vui lòng đăng nhập để xem thông báo ưu đãi và voucher dành riêng cho bạn.</p>
                <button
                  type="button"
                  onClick={() => {
                    setIsOpen(false);
                    navigate('/login');
                  }}
                  className="px-3 py-1.5 bg-ink text-paper text-xs uppercase tracking-wider font-light hover:bg-ink/85 transition-colors cursor-pointer inline-block mt-1"
                >
                  Đăng nhập ngay
                </button>
              </div>
            ) : loading ? (
              <div className="p-8 text-center text-xs text-mute font-light">
                <div className="inline-block size-5 border-2 border-mute/30 border-t-ink rounded-full animate-spin mb-2" />
                <p>Đang tải thông báo...</p>
              </div>
            ) : notifications.length === 0 ? (
              <div className="p-8 text-center text-xs text-mute font-light">
                <Bell className="size-7 mx-auto mb-2 text-mute/40" />
                <p>Bạn chưa có thông báo nào mới.</p>
              </div>
            ) : (
              notifications.map((item) => {
                const meta = getTypeMeta(item.type);
                const Icon = meta.icon;

                return (
                  <div
                    key={item.id}
                    onClick={() => handleClickItem(item)}
                    className={`p-3.5 transition-colors cursor-pointer flex gap-3 items-start ${
                      item.isRead ? 'bg-white hover:bg-gray-50' : 'bg-vermilion/5 hover:bg-vermilion/10'
                    }`}
                  >
                    <div className={`p-2 rounded-lg border shrink-0 mt-0.5 ${meta.className}`}>
                      <Icon className="size-4" />
                    </div>

                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-1 mb-1">
                        <span className={`text-[10px] px-1.5 py-0.2 rounded border font-medium ${meta.className}`}>
                          {meta.label}
                        </span>
                        <span className="text-[10px] text-mute font-light">
                          {formatTime(item.createdAt)}
                        </span>
                      </div>

                      <h4 className={`text-xs text-ink leading-snug line-clamp-1 ${!item.isRead ? 'font-semibold' : 'font-medium'}`}>
                        {item.title}
                      </h4>

                      <p className="text-[11px] text-mute font-light line-clamp-2 mt-0.5 leading-relaxed">
                        {item.content}
                      </p>

                      {item.targetUrl && (
                        <div className="flex items-center gap-1 text-[10px] text-vermilion hover:underline mt-1 font-medium">
                          <span>Xem chi tiết</span>
                          <ExternalLink className="size-2.5" />
                        </div>
                      )}
                    </div>

                    {!item.isRead && (
                      <span className="size-2 rounded-full bg-vermilion shrink-0 mt-2" title="Chưa đọc" />
                    )}
                  </div>
                );
              })
            )}
          </div>

          {/* Footer */}
          {isAuthenticated && (
            <div className="p-2.5 bg-paper border-t border-line text-center">
              <button
                type="button"
                onClick={() => {
                  setIsOpen(false);
                  navigate('/notifications');
                }}
                className="text-xs text-ink hover:text-vermilion font-medium transition-colors cursor-pointer"
              >
                Xem tất cả thông báo →
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

