import { useState, useEffect } from 'react';
import {
  MessageSquare,
  Plus,
  Send,
  AlertCircle,
  Sparkles,
  LifeBuoy,
  HelpCircle,
  Clock,
  ChevronLeft,
  ChevronRight,
  X,
  MessageCircle,
  ShieldCheck,
} from 'lucide-react';
import { feedbackApi } from '../api/feedback';
import { toast } from '../store/toastStore';
import { formatDate } from '../utils/formatDate';

const FEEDBACK_TYPES = [
  { value: 'BUG', label: 'Báo lỗi hệ thống', icon: AlertCircle, color: 'text-rose-600 bg-rose-50 border-rose-200' },
  { value: 'FEATURE', label: 'Đề xuất tính năng', icon: Sparkles, color: 'text-amber-600 bg-amber-50 border-amber-200' },
  { value: 'SERVICE', label: 'Dịch vụ & Hỗ trợ', icon: LifeBuoy, color: 'text-blue-600 bg-blue-50 border-blue-200' },
  { value: 'OTHER', label: 'Ý kiến khác', icon: HelpCircle, color: 'text-gray-600 bg-gray-50 border-gray-200' },
];

const STATUS_MAP = {
  PENDING: { label: 'Chờ phản hồi', color: 'bg-amber-50 text-amber-700 border-amber-200', dot: 'bg-amber-500' },
  PROCESSING: { label: 'Đang xử lý', color: 'bg-blue-50 text-blue-700 border-blue-200', dot: 'bg-blue-500' },
  REPLIED: { label: 'Đã trả lời', color: 'bg-emerald-50 text-emerald-700 border-emerald-200', dot: 'bg-emerald-500' },
  CLOSED: { label: 'Đã đóng', color: 'bg-gray-100 text-gray-600 border-gray-200', dot: 'bg-gray-400' },
};

const TABS = [
  { key: '', label: 'Tất cả' },
  { key: 'PENDING', label: 'Chờ phản hồi' },
  { key: 'REPLIED', label: 'Đã trả lời' },
  { key: 'CLOSED', label: 'Đã đóng' },
];

export default function Feedback() {
  const [activeTab, setActiveTab] = useState('');
  const [feedbacks, setFeedbacks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [totalElements, setTotalElements] = useState(0);

  // Modal gửi góp ý
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [formData, setFormData] = useState({
    title: '',
    content: '',
    type: 'BUG',
  });
  const [submitting, setSubmitting] = useState(false);
  const [formErrors, setFormErrors] = useState({});

  // Trigger reload list
  const [reloadTrigger, setReloadTrigger] = useState(0);

  useEffect(() => {
    let ignore = false;
    async function loadFeedbacks() {
      try {
        const data = await feedbackApi.getMyFeedbacks({
          page,
          size: 10,
          status: activeTab || undefined,
        });
        if (!ignore && data) {
          setFeedbacks(data.content || []);
          setTotalPages(data.totalPages || 0);
          setTotalElements(data.totalElements || 0);
          setLoading(false);
        }
      } catch {
        if (!ignore) {
          toast.error('Không thể tải danh sách phản hồi');
          setLoading(false);
        }
      }
    }

    loadFeedbacks();
    return () => {
      ignore = true;
    };
  }, [activeTab, page, reloadTrigger]);

  const validateForm = () => {
    const errors = {};
    if (!formData.title.trim()) {
      errors.title = 'Vui lòng nhập tiêu đề góp ý';
    } else if (formData.title.trim().length > 200) {
      errors.title = 'Tiêu đề không được vượt quá 200 ký tự';
    }
    if (!formData.content.trim()) {
      errors.content = 'Vui lòng nhập nội dung góp ý chi tiết';
    }
    return errors;
  };

  const handleOpenModal = () => {
    setFormData({ title: '', content: '', type: 'BUG' });
    setFormErrors({});
    setIsModalOpen(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const errors = validateForm();
    if (Object.keys(errors).length > 0) {
      setFormErrors(errors);
      return;
    }

    setSubmitting(true);
    try {
      await feedbackApi.createFeedback(formData);
      toast.success('Gửi phản hồi thành công! Cảm ơn bạn đã đóng góp ý kiến.');
      setIsModalOpen(false);
      setFormData({ title: '', content: '', type: 'BUG' });
      setPage(0);
      setReloadTrigger((prev) => prev + 1);
    } catch (err) {
      toast.error(err?.response?.data?.message || 'Có lỗi xảy ra khi gửi phản hồi');
    } finally {
      setSubmitting(false);
    }
  };

  const getTypeMeta = (type) => {
    return FEEDBACK_TYPES.find((t) => t.value === type) || FEEDBACK_TYPES[3];
  };

  return (
    <div className="max-w-4xl mx-auto px-4 py-8 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-5 border-b border-line">
        <div>
          <div className="flex items-center gap-2.5">
            <div className="p-2 bg-primary-50 rounded-xl text-primary-700">
              <MessageSquare className="size-5" />
            </div>
            <h1 className="text-2xl font-bold text-ink tracking-tight">Góp ý & Phản hồi</h1>
          </div>
          <p className="text-sm text-ink-muted mt-1">
            Mọi ý kiến của bạn đều giúp FunnyShop cải thiện sản phẩm và phục vụ bạn tốt hơn.
          </p>
        </div>

        <button
          type="button"
          onClick={handleOpenModal}
          className="inline-flex items-center justify-center gap-2 px-4 py-2.5 bg-primary-600 hover:bg-primary-700 text-white font-medium text-sm rounded-xl transition-colors shadow-sm cursor-pointer"
        >
          <Plus className="size-4" />
          Gửi góp ý mới
        </button>
      </div>

      {/* Tabs */}
      <div className="flex flex-wrap gap-2 border-b border-line pb-2">
        {TABS.map((tab) => (
          <button
            key={tab.key}
            type="button"
            onClick={() => {
              setActiveTab(tab.key);
              setPage(0);
              setLoading(true);
            }}
            className={`px-3.5 py-1.5 text-xs font-semibold rounded-lg transition-colors cursor-pointer ${
              activeTab === tab.key
                ? 'bg-primary-700 text-white shadow-xs'
                : 'text-ink-muted hover:text-ink hover:bg-gray-100'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Content list */}
      {loading ? (
        <div className="p-12 text-center text-sm text-ink-muted">
          <div className="inline-block size-6 border-2 border-primary-200 border-t-primary-700 rounded-full animate-spin mb-2" />
          <p>Đang tải danh sách phản hồi...</p>
        </div>
      ) : feedbacks.length === 0 ? (
        <div className="p-12 text-center bg-paper border border-line rounded-2xl space-y-3">
          <div className="size-12 rounded-full bg-sand/40 text-ink-muted flex items-center justify-center mx-auto">
            <MessageCircle className="size-6" />
          </div>
          <h3 className="text-base font-semibold text-ink">Chưa có phản hồi nào</h3>
          <p className="text-xs text-ink-muted max-w-sm mx-auto">
            {activeTab
              ? 'Không tìm thấy phản hồi nào phù hợp với bộ lọc hiện tại.'
              : 'Bạn chưa gửi góp ý nào cho hệ thống. Hãy gửi ý kiến nếu gặp sự cố hoặc cần hỗ trợ nhé!'}
          </p>
          <button
            type="button"
            onClick={handleOpenModal}
            className="inline-flex items-center gap-2 px-4 py-2 bg-primary-600 text-white text-xs font-semibold rounded-xl hover:bg-primary-700 transition-colors cursor-pointer"
          >
            <Plus className="size-3.5" />
            Tạo góp ý đầu tiên
          </button>
        </div>
      ) : (
        <div className="space-y-4">
          {feedbacks.map((f) => {
            const typeMeta = getTypeMeta(f.type);
            const statusMeta = STATUS_MAP[f.status] || STATUS_MAP.PENDING;
            const TypeIcon = typeMeta.icon;

            return (
              <div
                key={f.id}
                className="bg-paper border border-line rounded-2xl p-5 shadow-xs transition-shadow hover:shadow-soft space-y-4"
              >
                {/* Meta Header */}
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <span
                      className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium border ${typeMeta.color}`}
                    >
                      <TypeIcon className="size-3.5" />
                      {typeMeta.label}
                    </span>
                    <span
                      className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium border ${statusMeta.color}`}
                    >
                      <span className={`size-1.5 rounded-full ${statusMeta.dot}`} />
                      {statusMeta.label}
                    </span>
                  </div>

                  <span className="text-xs text-ink-muted flex items-center gap-1">
                    <Clock className="size-3.5" />
                    {formatDate(f.createdAt)}
                  </span>
                </div>

                {/* Question / User Content */}
                <div>
                  <h3 className="text-base font-bold text-ink leading-snug">{f.title}</h3>
                  <p className="text-sm text-ink-muted mt-2 whitespace-pre-line leading-relaxed bg-gray-50/70 p-3.5 rounded-xl border border-line/60">
                    {f.content}
                  </p>
                </div>

                {/* Admin Reply Section (if present) */}
                {f.adminReply ? (
                  <div className="border-t border-line/80 pt-3.5 space-y-2">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2 text-xs font-bold text-emerald-800">
                        <ShieldCheck className="size-4 text-emerald-600" />
                        <span>Phản hồi từ Admin {f.repliedByName ? `(${f.repliedByName})` : ''}</span>
                      </div>
                      {f.repliedAt && (
                        <span className="text-[11px] text-ink-muted">{formatDate(f.repliedAt)}</span>
                      )}
                    </div>
                    <div className="bg-emerald-50/60 border border-emerald-200/80 rounded-xl p-3.5 text-sm text-ink leading-relaxed whitespace-pre-line">
                      {f.adminReply}
                    </div>
                  </div>
                ) : (
                  <div className="flex items-center gap-2 text-xs text-ink-muted pt-1 border-t border-line/40">
                    <Clock className="size-3.5 text-amber-500" />
                    <span>Đội ngũ quản trị viên đang xem xét và sẽ sớm phản hồi bạn.</span>
                  </div>
                )}
              </div>
            );
          })}

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex items-center justify-between pt-4 border-t border-line text-xs text-ink-muted">
              <span>
                Hiển thị trang {page + 1} / {totalPages} ({totalElements} phản hồi)
              </span>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  disabled={page === 0}
                  onClick={() => setPage((p) => p - 1)}
                  className="p-1.5 border border-line rounded-lg hover:border-ink transition-colors disabled:opacity-30 cursor-pointer"
                >
                  <ChevronLeft className="size-4" />
                </button>
                <button
                  type="button"
                  disabled={page >= totalPages - 1}
                  onClick={() => setPage((p) => p + 1)}
                  className="p-1.5 border border-line rounded-lg hover:border-ink transition-colors disabled:opacity-30 cursor-pointer"
                >
                  <ChevronRight className="size-4" />
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Modal gửi góp ý */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="fixed inset-0 bg-black/50 backdrop-blur-xs" onClick={() => setIsModalOpen(false)} />
          <div className="relative bg-paper rounded-2xl border border-line shadow-2xl max-w-lg w-full p-6 space-y-4 animate-in fade-in zoom-in-95 duration-150">
            {/* Header */}
            <div className="flex items-center justify-between pb-3 border-b border-line">
              <div className="flex items-center gap-2">
                <div className="p-1.5 bg-primary-100 text-primary-700 rounded-lg">
                  <Send className="size-4" />
                </div>
                <h3 className="text-base font-bold text-ink">Gửi góp ý & Phản hồi</h3>
              </div>
              <button
                type="button"
                onClick={() => setIsModalOpen(false)}
                className="p-1 text-ink-muted hover:text-ink hover:bg-gray-100 rounded-lg transition-colors cursor-pointer"
              >
                <X className="size-5" />
              </button>
            </div>

            {/* Form */}
            <form onSubmit={handleSubmit} className="space-y-4">
              {/* Loại góp ý */}
              <div>
                <label className="block text-xs font-semibold text-ink uppercase tracking-wider mb-1.5">
                  Loại phản hồi <span className="text-rose-500">*</span>
                </label>
                <div className="grid grid-cols-2 gap-2">
                  {FEEDBACK_TYPES.map((t) => {
                    const isSelected = formData.type === t.value;
                    const Icon = t.icon;
                    return (
                      <button
                        key={t.value}
                        type="button"
                        onClick={() => setFormData((f) => ({ ...f, type: t.value }))}
                        className={`flex items-center gap-2 p-2.5 rounded-xl border text-xs font-medium transition-all cursor-pointer ${
                          isSelected
                            ? 'border-primary-600 bg-primary-50 text-primary-800 ring-1 ring-primary-600'
                            : 'border-line hover:border-ink/40 text-ink-muted hover:text-ink bg-white'
                        }`}
                      >
                        <Icon className="size-4 shrink-0" />
                        <span className="truncate">{t.label}</span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Tiêu đề */}
              <div>
                <label className="block text-xs font-semibold text-ink uppercase tracking-wider mb-1">
                  Tiêu đề <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  value={formData.title}
                  onChange={(e) => setFormData((f) => ({ ...f, title: e.target.value }))}
                  placeholder="VD: Lỗi thanh toán giỏ hàng, gợi ý tính năng..."
                  className={`w-full px-3.5 py-2 border rounded-xl text-sm bg-white text-ink outline-none transition-colors ${
                    formErrors.title ? 'border-rose-400 focus:border-rose-500' : 'border-line focus:border-primary-600'
                  }`}
                />
                {formErrors.title && <p className="text-xs text-rose-500 mt-1">{formErrors.title}</p>}
              </div>

              {/* Nội dung */}
              <div>
                <label className="block text-xs font-semibold text-ink uppercase tracking-wider mb-1">
                  Nội dung chi tiết <span className="text-rose-500">*</span>
                </label>
                <textarea
                  rows={5}
                  value={formData.content}
                  onChange={(e) => setFormData((f) => ({ ...f, content: e.target.value }))}
                  placeholder="Mô tả cụ thể sự cố bạn gặp phải, hoặc đề xuất của bạn..."
                  className={`w-full px-3.5 py-2 border rounded-xl text-sm bg-white text-ink outline-none transition-colors resize-none ${
                    formErrors.content
                      ? 'border-rose-400 focus:border-rose-500'
                      : 'border-line focus:border-primary-600'
                  }`}
                />
                {formErrors.content && <p className="text-xs text-rose-500 mt-1">{formErrors.content}</p>}
              </div>

              {/* Actions */}
              <div className="flex items-center justify-end gap-2 pt-3 border-t border-line">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  disabled={submitting}
                  className="px-4 py-2 border border-line text-xs font-semibold text-ink hover:bg-gray-100 rounded-xl transition-colors cursor-pointer"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="inline-flex items-center gap-2 px-5 py-2 bg-primary-600 hover:bg-primary-700 text-white text-xs font-semibold rounded-xl transition-colors disabled:opacity-50 cursor-pointer shadow-xs"
                >
                  {submitting ? (
                    <>
                      <div className="size-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                      Đang gửi...
                    </>
                  ) : (
                    <>
                      <Send className="size-3.5" />
                      Gửi góp ý
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
