import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { Bell, CheckCheck, Package, Tag, Megaphone, Settings, ChevronLeft, ChevronRight } from 'lucide-react';
import {
  getMyNotifications,
  markAsRead,
  markAllAsRead,
} from '../api/notification';
import { toast } from '../store/toastStore';

const TYPE_LABELS = {
  PROMOTION: { label: 'Ưu đãi', color: 'text-orange-600 bg-orange-50 border-orange-200' },
  VOUCHER: { label: 'Voucher', color: 'text-green-600 bg-green-50 border-green-200' },
  SYSTEM: { label: 'Hệ thống', color: 'text-blue-600 bg-blue-50 border-blue-200' },
  ORDER: { label: 'Đơn hàng', color: 'text-purple-600 bg-purple-50 border-purple-200' },
};

const TYPE_ICONS = {
  PROMOTION: Megaphone,
  VOUCHER: Tag,
  SYSTEM: Settings,
  ORDER: Package,
};

const TABS = [
  { key: 'ALL', label: 'Tất cả' },
  { key: 'UNREAD', label: 'Chưa đọc' },
  { key: 'PROMOTION', label: 'Ưu đãi' },
  { key: 'VOUCHER', label: 'Voucher' },
  { key: 'SYSTEM', label: 'Hệ thống' },
  { key: 'ORDER', label: 'Đơn hàng' },
];

function timeAgo(dateStr) {
  const now = new Date();
  const date = new Date(dateStr);
  const diffMs = now - date;
  const diffMins = Math.floor(diffMs / 60000);
  if (diffMins < 1) return 'Vừa xong';
  if (diffMins < 60) return `${diffMins} phút trước`;
  const diffHours = Math.floor(diffMins / 60);
  if (diffHours < 24) return `${diffHours} giờ trước`;
  const diffDays = Math.floor(diffHours / 24);
  if (diffDays < 7) return `${diffDays} ngày trước`;
  return date.toLocaleDateString('vi-VN');
}

export default function Notifications() {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('ALL');
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [markingAll, setMarkingAll] = useState(false);
  const [page, setPage] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [totalUnread, setTotalUnread] = useState(0);

  const fetchNotifications = useCallback(async (tab, pg) => {
    setLoading(true);
    try {
      const params = { page: pg, size: 15 };
      if (tab !== 'ALL' && tab !== 'UNREAD') params.type = tab;
      if (tab === 'UNREAD') params.unreadOnly = true;
      const data = await getMyNotifications(params);
      setNotifications(data.content || []);
      setTotalPages(data.totalPages || 0);
      setTotalUnread(data.content?.filter((n) => !n.isRead).length || 0);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    setPage(0);
  }, [activeTab]);

  useEffect(() => {
    fetchNotifications(activeTab, page);
  }, [activeTab, page, fetchNotifications]);

  const handleClickNotification = async (n) => {
    if (!n.isRead) {
      try {
        await markAsRead(n.id);
        setNotifications((prev) =>
          prev.map((item) => (item.id === n.id ? { ...item, isRead: true } : item))
        );
        setTotalUnread((prev) => Math.max(0, prev - 1));
      } catch (err) {
        console.error(err);
      }
    }
    if (n.targetUrl) navigate(n.targetUrl);
  };

  const handleMarkAllAsRead = async () => {
    setMarkingAll(true);
    try {
      await markAllAsRead();
      setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
      setTotalUnread(0);
      toast.success('Đã đánh dấu tất cả là đã đọc');
    } catch (err) {
      toast.error('Có lỗi xảy ra, vui lòng thử lại');
    } finally {
      setMarkingAll(false);
    }
  };

  return (
    <div className="max-w-3xl mx-auto px-4 py-10">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <Bell className="size-6 text-ink" />
          <h1 className="text-2xl font-light tracking-tight text-ink">Thông báo</h1>
          {totalUnread > 0 && (
            <span className="px-2 py-0.5 rounded-full bg-ink text-paper text-xs font-bold">
              {totalUnread}
            </span>
          )}
        </div>
        {totalUnread > 0 && (
          <button
            type="button"
            onClick={handleMarkAllAsRead}
            disabled={markingAll}
            className="flex items-center gap-1.5 text-sm text-ink-muted hover:text-ink transition-colors disabled:opacity-50 cursor-pointer"
          >
            <CheckCheck className="size-4" />
            {markingAll ? 'Đang xử lý...' : 'Đánh dấu tất cả đã đọc'}
          </button>
        )}
      </div>

      {/* Tabs */}
      <div className="flex gap-1 mb-6 border-b border-line overflow-x-auto">
        {TABS.map((tab) => (
          <button
            key={tab.key}
            type="button"
            onClick={() => setActiveTab(tab.key)}
            className={`px-4 py-2.5 text-sm font-medium whitespace-nowrap transition-colors border-b-2 cursor-pointer ${
              activeTab === tab.key
                ? 'border-ink text-ink'
                : 'border-transparent text-ink-muted hover:text-ink'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Content */}
      {loading ? (
        <div className="space-y-3">
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="animate-pulse flex gap-3 p-4 border border-line">
              <div className="size-10 rounded-full bg-gray-200 shrink-0" />
              <div className="flex-1 space-y-2">
                <div className="h-4 bg-gray-200 rounded w-3/4" />
                <div className="h-3 bg-gray-200 rounded w-full" />
                <div className="h-3 bg-gray-200 rounded w-1/4" />
              </div>
            </div>
          ))}
        </div>
      ) : notifications.length === 0 ? (
        <div className="text-center py-20">
          <Bell className="size-12 text-ink-subtle mx-auto mb-3 opacity-30" />
          <p className="text-ink-muted font-light">Không có thông báo nào</p>
        </div>
      ) : (
        <div className="space-y-1">
          {notifications.map((n) => {
            const TypeIcon = TYPE_ICONS[n.type] || Bell;
            const typeInfo = TYPE_LABELS[n.type] || { label: n.type, color: 'text-gray-600 bg-gray-50 border-gray-200' };
            return (
              <div
                key={n.id}
                onClick={() => handleClickNotification(n)}
                className={`flex gap-3 p-4 border border-line transition-colors cursor-pointer hover:bg-sand/30 ${
                  !n.isRead ? 'bg-blue-50/40' : 'bg-paper'
                }`}
              >
                {/* Icon */}
                <div
                  className={`size-10 rounded-full flex items-center justify-center shrink-0 border ${typeInfo.color}`}
                >
                  <TypeIcon className="size-4" />
                </div>

                {/* Body */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-2">
                    <p className={`text-sm leading-snug ${!n.isRead ? 'font-semibold text-ink' : 'font-medium text-ink-muted'}`}>
                      {n.title}
                    </p>
                    {!n.isRead && (
                      <span className="size-2 rounded-full bg-primary-500 mt-1.5 shrink-0" />
                    )}
                  </div>
                  <p className="text-xs text-ink-muted mt-0.5 line-clamp-2 leading-relaxed">
                    {n.content}
                  </p>
                  <div className="flex items-center gap-2 mt-1.5">
                    <span className={`text-[10px] font-medium px-1.5 py-0.5 rounded border ${typeInfo.color}`}>
                      {typeInfo.label}
                    </span>
                    <span className="text-[11px] text-ink-subtle">{timeAgo(n.createdAt)}</span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-3 mt-8">
          <button
            type="button"
            disabled={page === 0}
            onClick={() => setPage((p) => p - 1)}
            className="p-2 border border-line hover:border-ink transition-colors disabled:opacity-30 cursor-pointer"
          >
            <ChevronLeft className="size-4" />
          </button>
          <span className="text-sm text-ink-muted">
            Trang {page + 1} / {totalPages}
          </span>
          <button
            type="button"
            disabled={page >= totalPages - 1}
            onClick={() => setPage((p) => p + 1)}
            className="p-2 border border-line hover:border-ink transition-colors disabled:opacity-30 cursor-pointer"
          >
            <ChevronRight className="size-4" />
          </button>
        </div>
      )}
    </div>
  );
}
