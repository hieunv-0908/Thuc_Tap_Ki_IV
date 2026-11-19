import { useState, useEffect } from 'react';
import {
  MessageSquare,
  Search,
  X,
  ChevronLeft,
  ChevronRight,
  Clock,
  Trash2,
  Reply,
  AlertCircle,
  Sparkles,
  LifeBuoy,
  HelpCircle,
  Send,
} from 'lucide-react';
import { feedbackApi } from '../../api/feedback';
import { toast } from '../../store/toastStore';
import { formatDate } from '../../utils/formatDate';
import ConfirmDialog from '../../components/ui/ConfirmDialog';

const FEEDBACK_TYPES = [
  { value: '', label: 'Tất cả loại' },
  { value: 'BUG', label: 'Báo lỗi hệ thống', icon: AlertCircle, color: 'text-rose-600 bg-rose-50 border-rose-200' },
  { value: 'FEATURE', label: 'Đề xuất tính năng', icon: Sparkles, color: 'text-amber-600 bg-amber-50 border-amber-200' },
  { value: 'SERVICE', label: 'Dịch vụ & Hỗ trợ', icon: LifeBuoy, color: 'text-blue-600 bg-blue-50 border-blue-200' },
  { value: 'OTHER', label: 'Ý kiến khác', icon: HelpCircle, color: 'text-gray-600 bg-gray-50 border-gray-200' },
];

const STATUS_OPTIONS = [
  { value: '', label: 'Tất cả trạng thái' },
  { value: 'PENDING', label: 'Chờ phản hồi', color: 'bg-amber-50 text-amber-700 border-amber-200', dot: 'bg-amber-500' },
  { value: 'PROCESSING', label: 'Đang xử lý', color: 'bg-blue-50 text-blue-700 border-blue-200', dot: 'bg-blue-500' },
  { value: 'REPLIED', label: 'Đã trả lời', color: 'bg-emerald-50 text-emerald-700 border-emerald-200', dot: 'bg-emerald-500' },
  { value: 'CLOSED', label: 'Đã đóng', color: 'bg-gray-100 text-gray-600 border-gray-200', dot: 'bg-gray-400' },
];

export default function AdminFeedbacks() {
  const [feedbacks, setFeedbacks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({ total: 0, pending: 0, processing: 0, replied: 0, closed: 0 });
  const [page, setPage] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [totalElements, setTotalElements] = useState(0);

  // Filters
  const [filterStatus, setFilterStatus] = useState('');
  const [filterType, setFilterType] = useState('');
  const [keyword, setKeyword] = useState('');
  const [keywordInput, setKeywordInput] = useState('');

  // Reply / Detail Modal
  const [activeFeedback, setActiveFeedback] = useState(null);
  const [replyText, setReplyText] = useState('');
  const [replyStatus, setReplyStatus] = useState('REPLIED');
  const [submittingReply, setSubmittingReply] = useState(false);

  // Delete Confirm Modal
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [deleting, setDeleting] = useState(false);

  // Trigger reload
  const [reloadTrigger, setReloadTrigger] = useState(0);

  // Tải danh sách phản hồi
  useEffect(() => {
    let ignore = false;
    async function loadData() {
      try {
        const [feedbacksRes, statsRes] = await Promise.allSettled([
          feedbackApi.adminGetFeedbacks({
            page,
            size: 10,
            status: filterStatus || undefined,
            type: filterType || undefined,
            keyword: keyword || undefined,
          }),
          feedbackApi.adminGetFeedbackStats(),
        ]);

        if (!ignore) {
          if (feedbacksRes.status === 'fulfilled' && feedbacksRes.value) {
            setFeedbacks(feedbacksRes.value.content || []);
            setTotalPages(feedbacksRes.value.totalPages || 0);
            setTotalElements(feedbacksRes.value.totalElements || 0);
          }
          if (statsRes.status === 'fulfilled' && statsRes.value) {
            setStats(statsRes.value);
          }
          setLoading(false);
        }
      } catch {
        if (!ignore) {
          toast.error('Không thể tải dữ liệu phản hồi');
          setLoading(false);
        }
      }
    }

    loadData();
    return () => {
      ignore = true;
    };
  }, [page, filterStatus, filterType, keyword, reloadTrigger]);

  const handleSearch = (e) => {
    e.preventDefault();
    setKeyword(keywordInput.trim());
    setPage(0);
    setLoading(true);
  };

  const handleClearSearch = () => {
    setKeyword('');
    setKeywordInput('');
    setPage(0);
    setLoading(true);
  };

  const openReplyModal = (f) => {
    setActiveFeedback(f);
    setReplyText(f.adminReply || '');
    setReplyStatus(f.status === 'PENDING' ? 'REPLIED' : f.status);
  };

  const handleSendReply = async (e) => {
    e.preventDefault();
    if (!replyText.trim()) {
      toast.error('Vui lòng nhập nội dung trả lời!');
      return;
    }

    setSubmittingReply(true);
    try {
      await feedbackApi.adminReplyFeedback(activeFeedback.id, {
        reply: replyText.trim(),
        status: replyStatus,
      });
      toast.success('Đã gửi phản hồi và gửi thông báo tới khách hàng thành công!');
      setActiveFeedback(null);
      setReloadTrigger((p) => p + 1);
    } catch (err) {
      toast.error(err?.response?.data?.message || 'Có lỗi xảy ra khi gửi trả lời');
    } finally {
      setSubmittingReply(false);
    }
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    setDeleting(true);
    try {
      await feedbackApi.adminDeleteFeedback(deleteTarget.id);
      toast.success('Đã xóa phản hồi thành công!');
      setDeleteTarget(null);
      setReloadTrigger((p) => p + 1);
    } catch {
      toast.error('Không thể xóa phản hồi này!');
    } finally {
      setDeleting(false);
    }
  };

  const getTypeMeta = (type) => {
    return FEEDBACK_TYPES.find((t) => t.value === type) || FEEDBACK_TYPES[4];
  };

  const getStatusMeta = (status) => {
    return STATUS_OPTIONS.find((s) => s.value === status) || STATUS_OPTIONS[1];
  };

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-ink tracking-tight flex items-center gap-2">
            <MessageSquare className="size-5 text-primary-600" />
            Quản lý phản hồi & góp ý hệ thống
          </h1>
          <p className="text-sm text-ink-muted mt-0.5">
            Xem ý kiến đóng góp của người dùng và gửi câu trả lời kèm thông báo tức thời.
          </p>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="bg-paper border border-line p-4 rounded-xl space-y-1">
          <p className="text-xs text-ink-muted font-medium">Tổng góp ý</p>
          <p className="text-xl font-bold text-ink">{stats.total || 0}</p>
        </div>
        <div className="bg-amber-50/60 border border-amber-200/80 p-4 rounded-xl space-y-1">
          <p className="text-xs text-amber-800 font-medium">Chờ phản hồi</p>
          <p className="text-xl font-bold text-amber-700">{stats.pending || 0}</p>
        </div>
        <div className="bg-emerald-50/60 border border-emerald-200/80 p-4 rounded-xl space-y-1">
          <p className="text-xs text-emerald-800 font-medium">Đã trả lời</p>
          <p className="text-xl font-bold text-emerald-700">{stats.replied || 0}</p>
        </div>
        <div className="bg-gray-50 border border-line p-4 rounded-xl space-y-1">
          <p className="text-xs text-gray-600 font-medium">Đã đóng</p>
          <p className="text-xl font-bold text-gray-700">{stats.closed || 0}</p>
        </div>
      </div>

      {/* Filter Bar */}
      <div className="flex flex-wrap gap-3 items-center bg-paper border border-line p-4 rounded-xl">
        {/* Search */}
        <form onSubmit={handleSearch} className="flex gap-2 flex-1 min-w-56">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-ink-muted" />
            <input
              type="text"
              value={keywordInput}
              onChange={(e) => setKeywordInput(e.target.value)}
              placeholder="Tìm theo tiêu đề, nội dung, tên khách hàng..."
              className="w-full pl-9 pr-3 py-1.5 border border-line text-sm bg-white text-ink rounded-lg outline-none focus:border-primary-600 transition-colors"
            />
          </div>
          <button
            type="submit"
            className="px-3 py-1.5 border border-line text-sm text-ink hover:border-ink rounded-lg transition-colors cursor-pointer"
          >
            Tìm
          </button>
          {(keyword || keywordInput) && (
            <button
              type="button"
              onClick={handleClearSearch}
              className="p-1.5 border border-line text-ink-muted hover:text-ink rounded-lg transition-colors cursor-pointer"
            >
              <X className="size-4" />
            </button>
          )}
        </form>

        {/* Status Filter */}
        <select
          value={filterStatus}
          onChange={(e) => {
            setFilterStatus(e.target.value);
            setPage(0);
            setLoading(true);
          }}
          className="px-3 py-1.5 border border-line text-sm bg-white text-ink rounded-lg outline-none focus:border-primary-600 transition-colors cursor-pointer"
        >
          {STATUS_OPTIONS.map((o) => (
            <option key={o.value} value={o.value}>
              {o.label}
            </option>
          ))}
        </select>

        {/* Type Filter */}
        <select
          value={filterType}
          onChange={(e) => {
            setFilterType(e.target.value);
            setPage(0);
            setLoading(true);
          }}
          className="px-3 py-1.5 border border-line text-sm bg-white text-ink rounded-lg outline-none focus:border-primary-600 transition-colors cursor-pointer"
        >
          {FEEDBACK_TYPES.map((o) => (
            <option key={o.value} value={o.value}>
              {o.label}
            </option>
          ))}
        </select>
      </div>

      {/* Table List */}
      <div className="bg-paper border border-line rounded-xl overflow-hidden shadow-xs">
        {loading ? (
          <div className="p-12 text-center text-sm text-ink-muted">
            <div className="inline-block size-6 border-2 border-primary-200 border-t-primary-700 rounded-full animate-spin mb-2" />
            <p>Đang tải dữ liệu...</p>
          </div>
        ) : feedbacks.length === 0 ? (
          <div className="p-12 text-center text-sm text-ink-muted">
            Không tìm thấy phản hồi nào phù hợp với điều kiện tìm kiếm.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-gray-50/80 border-b border-line text-xs uppercase text-ink-muted font-semibold tracking-wider">
                <tr>
                  <th className="px-4 py-3">Người gửi</th>
                  <th className="px-4 py-3">Tiêu đề & Nội dung</th>
                  <th className="px-4 py-3">Phân loại</th>
                  <th className="px-4 py-3">Trạng thái</th>
                  <th className="px-4 py-3">Thời gian</th>
                  <th className="px-4 py-3 text-right">Thao tác</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-line">
                {feedbacks.map((f) => {
                  const typeMeta = getTypeMeta(f.type);
                  const statusMeta = getStatusMeta(f.status);
                  const TypeIcon = typeMeta.icon;

                  return (
                    <tr key={f.id} className="hover:bg-gray-50/50 transition-colors">
                      {/* Người gửi */}
                      <td className="px-4 py-3.5 whitespace-nowrap">
                        <div className="font-semibold text-ink">{f.userFullName || f.username}</div>
                        <div className="text-xs text-ink-muted">{f.userEmail}</div>
                      </td>

                      {/* Tiêu đề & nội dung */}
                      <td className="px-4 py-3.5 max-w-xs sm:max-w-md">
                        <div className="font-semibold text-ink line-clamp-1">{f.title}</div>
                        <div className="text-xs text-ink-muted line-clamp-1 mt-0.5">{f.content}</div>
                        {f.adminReply && (
                          <div className="mt-1 text-[11px] text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200 line-clamp-1 flex items-center gap-1">
                            <span className="font-bold">Đã trả lời:</span> {f.adminReply}
                          </div>
                        )}
                      </td>

                      {/* Phân loại */}
                      <td className="px-4 py-3.5 whitespace-nowrap">
                        <span
                          className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium border ${typeMeta.color}`}
                        >
                          <TypeIcon className="size-3" />
                          {typeMeta.label}
                        </span>
                      </td>

                      {/* Trạng thái */}
                      <td className="px-4 py-3.5 whitespace-nowrap">
                        <span
                          className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium border ${statusMeta.color}`}
                        >
                          <span className={`size-1.5 rounded-full ${statusMeta.dot}`} />
                          {statusMeta.label}
                        </span>
                      </td>

                      {/* Thời gian */}
                      <td className="px-4 py-3.5 text-xs text-ink-muted whitespace-nowrap">
                        <div className="flex items-center gap-1">
                          <Clock className="size-3" />
                          {formatDate(f.createdAt)}
                        </div>
                      </td>

                      {/* Thao tác */}
                      <td className="px-4 py-3.5 text-right whitespace-nowrap">
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            type="button"
                            onClick={() => openReplyModal(f)}
                            className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-medium bg-primary-50 text-primary-700 hover:bg-primary-100 border border-primary-200 rounded-lg transition-colors cursor-pointer"
                          >
                            <Reply className="size-3.5" />
                            {f.adminReply ? 'Xem & sửa' : 'Trả lời'}
                          </button>
                          <button
                            type="button"
                            onClick={() => setDeleteTarget(f)}
                            className="p-1 text-gray-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors cursor-pointer"
                            title="Xóa phản hồi"
                          >
                            <Trash2 className="size-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}

        {/* Footer Pagination */}
        {totalPages > 1 && (
          <div className="p-4 border-t border-line flex items-center justify-between text-xs text-ink-muted">
            <span>
              Trang {page + 1} / {totalPages} ({totalElements} phản hồi)
            </span>
            <div className="flex items-center gap-2">
              <button
                type="button"
                disabled={page === 0}
                onClick={() => {
                  setPage((p) => p - 1);
                  setLoading(true);
                }}
                className="p-1.5 border border-line rounded-lg hover:border-ink transition-colors disabled:opacity-30 cursor-pointer"
              >
                <ChevronLeft className="size-4" />
              </button>
              <button
                type="button"
                disabled={page >= totalPages - 1}
                onClick={() => {
                  setPage((p) => p + 1);
                  setLoading(true);
                }}
                className="p-1.5 border border-line rounded-lg hover:border-ink transition-colors disabled:opacity-30 cursor-pointer"
              >
                <ChevronRight className="size-4" />
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Modal Trả lời / Chi tiết */}
      {activeFeedback && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="fixed inset-0 bg-black/50 backdrop-blur-xs" onClick={() => setActiveFeedback(null)} />
          <div className="relative bg-paper rounded-2xl border border-line shadow-2xl max-w-xl w-full p-6 space-y-4 animate-in fade-in zoom-in-95 duration-150 max-h-[90vh] overflow-y-auto">
            {/* Header */}
            <div className="flex items-center justify-between pb-3 border-b border-line">
              <div>
                <h3 className="text-base font-bold text-ink">Chi tiết & Trả lời phản hồi</h3>
                <p className="text-xs text-ink-muted mt-0.5">
                  Người gửi: <span className="font-semibold text-ink">{activeFeedback.userFullName || activeFeedback.username}</span> ({activeFeedback.userEmail})
                </p>
              </div>
              <button
                type="button"
                onClick={() => setActiveFeedback(null)}
                className="p-1 text-ink-muted hover:text-ink hover:bg-gray-100 rounded-lg transition-colors cursor-pointer"
              >
                <X className="size-5" />
              </button>
            </div>

            {/* Nội dung phản hồi của người dùng */}
            <div className="bg-gray-50 border border-line rounded-xl p-4 space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-primary-700 uppercase tracking-wider">
                  Nội dung đóng góp từ khách hàng
                </span>
                <span className="text-[11px] text-ink-muted">{formatDate(activeFeedback.createdAt)}</span>
              </div>
              <h4 className="text-sm font-bold text-ink">{activeFeedback.title}</h4>
              <p className="text-xs text-ink-muted whitespace-pre-line leading-relaxed">
                {activeFeedback.content}
              </p>
            </div>

            {/* Form Admin trả lời */}
            <form onSubmit={handleSendReply} className="space-y-4">
              {/* Chọn trạng thái sau khi phản hồi */}
              <div>
                <label className="block text-xs font-semibold text-ink uppercase tracking-wider mb-1">
                  Cập nhật trạng thái
                </label>
                <select
                  value={replyStatus}
                  onChange={(e) => setReplyStatus(e.target.value)}
                  className="w-full px-3 py-2 border border-line rounded-xl text-sm bg-white text-ink outline-none focus:border-primary-600 transition-colors cursor-pointer"
                >
                  <option value="REPLIED">Đã trả lời (Khách hàng nhận thông báo)</option>
                  <option value="PROCESSING">Đang xử lý</option>
                  <option value="CLOSED">Đã đóng</option>
                </select>
              </div>

              {/* Ô nhập nội dung trả lời */}
              <div>
                <label className="block text-xs font-semibold text-ink uppercase tracking-wider mb-1">
                  Nội dung phản hồi của Admin <span className="text-rose-500">*</span>
                </label>
                <textarea
                  rows={5}
                  value={replyText}
                  onChange={(e) => setReplyText(e.target.value)}
                  placeholder="Nhập nội dung giải đáp, cảm ơn hoặc hướng xử lý của ban quản trị..."
                  className="w-full px-3.5 py-2 border border-line rounded-xl text-sm bg-white text-ink outline-none focus:border-primary-600 transition-colors resize-none"
                />
                <p className="text-[11px] text-ink-muted mt-1">
                  💡 Sau khi gửi, hệ thống sẽ tự động phát thông báo đến tài khoản của khách hàng này.
                </p>
              </div>

              {/* Actions */}
              <div className="flex items-center justify-end gap-2 pt-3 border-t border-line">
                <button
                  type="button"
                  onClick={() => setActiveFeedback(null)}
                  disabled={submittingReply}
                  className="px-4 py-2 border border-line text-xs font-semibold text-ink hover:bg-gray-100 rounded-xl transition-colors cursor-pointer"
                >
                  Đóng
                </button>
                <button
                  type="submit"
                  disabled={submittingReply}
                  className="inline-flex items-center gap-2 px-5 py-2 bg-primary-600 hover:bg-primary-700 text-white text-xs font-semibold rounded-xl transition-colors disabled:opacity-50 cursor-pointer shadow-xs"
                >
                  {submittingReply ? (
                    <>
                      <div className="size-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                      Đang gửi...
                    </>
                  ) : (
                    <>
                      <Send className="size-3.5" />
                      Gửi câu trả lời
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Confirm */}
      <ConfirmDialog
        isOpen={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        onConfirm={handleDelete}
        title="Xác nhận xóa phản hồi"
        description={`Bạn có chắc muốn xóa phản hồi "${deleteTarget?.title}" của ${deleteTarget?.userFullName || deleteTarget?.username}?`}
        confirmText={deleting ? 'Đang xóa...' : 'Xóa phản hồi'}
        cancelText="Hủy"
        variant="danger"
      />
    </div>
  );
}
