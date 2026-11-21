import { useState, useEffect, useCallback } from 'react';
import {
  Star,
  Search,
  MessageSquare,
  Trash2,
  Reply,
  Store,
  CheckCircle2,
  ExternalLink,
  Filter,
  RefreshCw,
  Send,
  Calendar,
  User,
  Package,
} from 'lucide-react';
import reviewApi from '../../api/review';
import { toast } from '../../store/toastStore';
import Button from '../../components/ui/Button';
import Input from '../../components/ui/Input';
import Modal from '../../components/ui/Modal';
import ConfirmDialog from '../../components/ui/ConfirmDialog';
import { Link } from 'react-router-dom';

export default function AdminReviews() {
  const [reviews, setReviews] = useState([]);
  const [loading, setLoading] = useState(true);
  const [keyword, setKeyword] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [ratingFilter, setRatingFilter] = useState('');
  const [page, setPage] = useState(0);
  const [pageSize, setPageSize] = useState(10);
  const [totalElements, setTotalElements] = useState(0);
  const [totalPages, setTotalPages] = useState(0);

  // Reply modal state
  const [replyTarget, setReplyTarget] = useState(null);
  const [replyText, setReplyText] = useState('');
  const [submittingReply, setSubmittingReply] = useState(false);

  // Delete confirm state
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [deleting, setDeleting] = useState(false);

  // Fetch reviews list
  const fetchReviews = useCallback(async () => {
    setLoading(true);
    try {
      const res = await reviewApi.adminGetReviews({
        keyword: searchQuery || undefined,
        rating: ratingFilter ? Number(ratingFilter) : undefined,
        page,
        size: pageSize,
        sortBy: 'createdAt',
        sortDir: 'desc',
      });
      if (res.data) {
        setReviews(res.data.content || []);
        setTotalElements(res.data.totalElements || 0);
        setTotalPages(res.data.totalPages || 0);
      }
    } catch (err) {
      console.error('Failed to load admin reviews:', err);
      toast.error('Không thể tải danh sách đánh giá');
    } finally {
      setLoading(false);
    }
  }, [searchQuery, ratingFilter, page, pageSize]);

  useEffect(() => {
    fetchReviews();
  }, [fetchReviews]);

  // Handle Search submit
  const handleSearch = (e) => {
    e.preventDefault();
    setSearchQuery(keyword.trim());
    setPage(0);
  };

  // Open reply modal
  const handleOpenReplyModal = (review) => {
    setReplyTarget(review);
    setReplyText(review.adminReply || '');
  };

  // Submit reply
  const handleSubmitReply = async (e) => {
    e.preventDefault();
    if (!replyTarget) return;
    if (!replyText.trim()) {
      toast.warning('Vui lòng nhập nội dung phản hồi');
      return;
    }

    setSubmittingReply(true);
    try {
      await reviewApi.adminReplyReview(replyTarget.id, {
        reply: replyText.trim(),
      });
      toast.success('Đã gửi phản hồi đánh giá thành công!');
      setReplyTarget(null);
      fetchReviews();
    } catch (err) {
      const msg = err.response?.data?.message || 'Không thể gửi phản hồi';
      toast.error(msg);
    } finally {
      setSubmittingReply(false);
    }
  };

  // Confirm delete review
  const handleConfirmDelete = async () => {
    if (!deleteTarget) return;
    setDeleting(true);
    try {
      await reviewApi.adminDeleteReview(deleteTarget.id);
      toast.success('Đã xóa đánh giá thành công!');
      setDeleteTarget(null);
      fetchReviews();
    } catch (err) {
      const msg = err.response?.data?.message || 'Không thể xóa đánh giá';
      toast.error(msg);
    } finally {
      setDeleting(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* 1. Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-serif font-bold text-ink">Quản lý Đánh giá Sản phẩm</h1>
          <p className="text-xs sm:text-sm text-ink-muted mt-1">
            Theo dõi, kiểm duyệt và phản hồi các bình phẩm, đánh giá từ khách hàng ({totalElements} đánh giá)
          </p>
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={fetchReviews}
          disabled={loading}
          className="self-start sm:self-auto"
        >
          <RefreshCw className={`size-4 mr-1.5 ${loading ? 'animate-spin' : ''}`} />
          Làm mới
        </Button>
      </div>

      {/* 2. Filters & Search Bar */}
      <div className="p-4 rounded-2xl bg-white border border-line shadow-2xs space-y-3">
        <form onSubmit={handleSearch} className="grid grid-cols-1 sm:grid-cols-12 gap-3">
          <div className="sm:col-span-6 relative">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 size-4 text-ink-subtle" />
            <input
              type="text"
              value={keyword}
              onChange={(e) => setKeyword(e.target.value)}
              placeholder="Tìm theo tên sản phẩm, khách hàng, hoặc nội dung bình phẩm..."
              className="w-full pl-10 pr-4 py-2 text-xs sm:text-sm rounded-xl border border-line focus:border-primary-500 focus:ring-2 focus:ring-primary-100 outline-hidden"
            />
          </div>

          <div className="sm:col-span-4 flex items-center gap-2">
            <select
              value={ratingFilter}
              onChange={(e) => {
                setRatingFilter(e.target.value);
                setPage(0);
              }}
              className="w-full py-2 px-3 text-xs sm:text-sm rounded-xl border border-line bg-white focus:border-primary-500 outline-hidden cursor-pointer"
            >
              <option value="">Tất cả số sao (1 - 5 ⭐)</option>
              <option value="5">⭐⭐⭐⭐⭐ (5 sao)</option>
              <option value="4">⭐⭐⭐⭐ (4 sao)</option>
              <option value="3">⭐⭐⭐ (3 sao)</option>
              <option value="2">⭐⭐ (2 sao)</option>
              <option value="1">⭐ (1 sao)</option>
            </select>
          </div>

          <div className="sm:col-span-2 flex items-center gap-2">
            <Button type="submit" variant="primary" size="sm" className="w-full">
              Tìm kiếm
            </Button>
            {(searchQuery || ratingFilter) && (
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => {
                  setKeyword('');
                  setSearchQuery('');
                  setRatingFilter('');
                  setPage(0);
                }}
              >
                Xóa lọc
              </Button>
            )}
          </div>
        </form>
      </div>

      {/* 3. Review List Table */}
      <div className="rounded-2xl bg-white border border-line shadow-soft overflow-hidden">
        {loading ? (
          <div className="py-20 flex flex-col items-center justify-center gap-3">
            <RefreshCw className="size-6 text-primary-600 animate-spin" />
            <p className="text-xs text-ink-muted">Đang tải danh sách đánh giá...</p>
          </div>
        ) : reviews.length === 0 ? (
          <div className="py-16 text-center space-y-2">
            <MessageSquare className="size-10 text-ink-subtle mx-auto stroke-[1.2]" />
            <h3 className="text-base font-bold text-ink">Không tìm thấy đánh giá nào</h3>
            <p className="text-xs text-ink-muted">
              {searchQuery || ratingFilter
                ? 'Không có đánh giá nào phù hợp với bộ lọc hiện tại'
                : 'Chưa có đánh giá nào trong hệ thống'}
            </p>
          </div>
        ) : (
          <div className="divide-y divide-line">
            {reviews.map((rev) => (
              <div key={rev.id} className="p-5 hover:bg-gray-50/50 transition-colors space-y-3">
                <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
                  {/* Left: Product & User Info */}
                  <div className="flex items-start gap-4 flex-1">
                    {/* Product Thumbnail */}
                    <Link
                      to={`/products/${rev.productId}`}
                      target="_blank"
                      className="size-14 rounded-xl border border-line overflow-hidden shrink-0 bg-gray-50 hover:opacity-80 transition-opacity"
                    >
                      {rev.productImageUrl ? (
                        <img
                          src={rev.productImageUrl}
                          alt={rev.productName}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-ink-subtle">
                          <Package className="size-5" />
                        </div>
                      )}
                    </Link>

                    {/* Meta info */}
                    <div className="space-y-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <Link
                          to={`/products/${rev.productId}`}
                          target="_blank"
                          className="text-sm font-bold text-ink hover:text-primary-700 flex items-center gap-1"
                        >
                          {rev.productName}
                          <ExternalLink className="size-3 text-ink-subtle" />
                        </Link>
                      </div>

                      <div className="flex items-center gap-2 text-xs text-ink-muted flex-wrap">
                        <span className="font-semibold text-ink flex items-center gap-1">
                          <User className="size-3.5 text-ink-subtle" />
                          {rev.userName}
                        </span>
                        {rev.userEmail && <span>({rev.userEmail})</span>}
                        {rev.isVerifiedPurchase && (
                          <span className="inline-flex items-center gap-0.5 text-[10px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                            <CheckCircle2 className="size-3" />
                            Đã mua hàng
                          </span>
                        )}
                        <span>•</span>
                        <span className="flex items-center gap-1 text-ink-subtle">
                          <Calendar className="size-3" />
                          {rev.createdAt
                            ? new Date(rev.createdAt).toLocaleString('vi-VN', {
                                hour: '2-digit',
                                minute: '2-digit',
                                day: '2-digit',
                                month: '2-digit',
                                year: 'numeric',
                              })
                            : ''}
                        </span>
                      </div>

                      {/* Stars */}
                      <div className="flex items-center gap-1 pt-0.5">
                        <div className="flex text-amber-400">
                          {Array.from({ length: 5 }).map((_, i) => (
                            <Star
                              key={i}
                              className={`size-4 ${
                                i < rev.rating
                                  ? 'fill-amber-400 text-amber-400'
                                  : 'fill-gray-200 text-gray-200'
                              }`}
                            />
                          ))}
                        </div>
                        <span className="text-xs font-bold text-amber-700 ml-1">
                          {rev.rating} / 5 sao
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Right Actions */}
                  <div className="flex items-center gap-2 self-end sm:self-start shrink-0">
                    <Button
                      size="xs"
                      variant="outline"
                      onClick={() => handleOpenReplyModal(rev)}
                      className={rev.adminReply ? 'text-primary-700 border-primary-300' : ''}
                    >
                      <Reply className="size-3.5 mr-1" />
                      {rev.adminReply ? 'Sửa phản hồi' : 'Trả lời'}
                    </Button>
                    <Button
                      size="xs"
                      variant="outline"
                      className="text-vermilion hover:bg-red-50 border-red-200"
                      onClick={() => setDeleteTarget(rev)}
                      title="Xóa đánh giá vi phạm"
                    >
                      <Trash2 className="size-3.5" />
                    </Button>
                  </div>
                </div>

                {/* Comment content */}
                <div className="pl-0 sm:pl-18">
                  <div className="p-3.5 rounded-xl bg-gray-50 border border-line text-xs sm:text-sm text-ink leading-relaxed">
                    <span className="font-semibold text-ink-muted mr-1.5">Bình phẩm:</span>
                    {rev.comment}
                  </div>

                  {/* Existing Admin Reply */}
                  {rev.adminReply && (
                    <div className="mt-2 p-3.5 rounded-xl bg-secondary-50/80 border border-secondary-200 text-xs space-y-1">
                      <div className="flex items-center justify-between text-secondary-900 font-bold">
                        <span className="flex items-center gap-1.5">
                          <Store className="size-3.5 text-secondary-700" />
                          Phản hồi của Cửa hàng (FunnyShop)
                        </span>
                        {rev.adminReplyAt && (
                          <span className="text-[10px] font-normal text-ink-subtle">
                            {new Date(rev.adminReplyAt).toLocaleDateString('vi-VN')}
                          </span>
                        )}
                      </div>
                      <p className="text-ink-muted leading-relaxed pl-5">{rev.adminReply}</p>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}

        {/* 4. Pagination */}
        {totalPages > 1 && (
          <div className="p-4 border-t border-line flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-ink-muted">
            <div>
              Hiển thị trang <strong>{page + 1}</strong> / <strong>{totalPages}</strong> (Tổng cộng {totalElements} đánh giá)
            </div>
            <div className="flex items-center gap-2">
              <Button
                size="xs"
                variant="outline"
                disabled={page === 0}
                onClick={() => setPage((p) => Math.max(0, p - 1))}
              >
                ← Trang trước
              </Button>
              <Button
                size="xs"
                variant="outline"
                disabled={page >= totalPages - 1}
                onClick={() => setPage((p) => p + 1)}
              >
                Trang sau →
              </Button>
            </div>
          </div>
        )}
      </div>

      {/* Modal Reply */}
      <Modal
        isOpen={Boolean(replyTarget)}
        onClose={() => setReplyTarget(null)}
        title="Phản hồi đánh giá của khách hàng"
      >
        {replyTarget && (
          <form onSubmit={handleSubmitReply} className="space-y-4">
            <div className="p-3 rounded-xl bg-gray-50 border border-line text-xs space-y-1">
              <div className="font-bold text-ink">
                {replyTarget.userName} ({replyTarget.rating} ⭐ cho {replyTarget.productName})
              </div>
              <p className="text-ink-muted italic">"{replyTarget.comment}"</p>
            </div>

            <div className="space-y-1.5">
              <label className="block text-xs font-bold text-ink">
                Nội dung phản hồi từ FunnyShop <span className="text-vermilion">*</span>
              </label>
              <textarea
                rows={4}
                value={replyText}
                onChange={(e) => setReplyText(e.target.value)}
                placeholder="Cảm ơn bạn đã mua sắm và ủng hộ FunnyShop..."
                className="w-full text-xs sm:text-sm p-3 rounded-xl border border-line focus:border-primary-500 focus:ring-2 focus:ring-primary-100 outline-hidden resize-none"
              />
            </div>

            <div className="flex items-center justify-end gap-2 pt-2">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setReplyTarget(null)}
              >
                Hủy
              </Button>
              <Button
                type="submit"
                variant="primary"
                size="sm"
                disabled={submittingReply}
              >
                <Send className="size-3.5 mr-1.5" />
                {submittingReply ? 'Đang gửi...' : 'Gửi phản hồi'}
              </Button>
            </div>
          </form>
        )}
      </Modal>

      {/* Confirm Delete Dialog */}
      <ConfirmDialog
        isOpen={Boolean(deleteTarget)}
        title="Xác nhận xóa đánh giá"
        message={`Bạn có chắc chắn muốn xóa đánh giá của khách hàng '${deleteTarget?.userName}' không? Thao tác này sẽ xóa vĩnh viễn đánh giá khỏi hệ thống.`}
        confirmText="Xóa vĩnh viễn"
        cancelText="Hủy"
        variant="danger"
        isLoading={deleting}
        onConfirm={handleConfirmDelete}
        onCancel={() => setDeleteTarget(null)}
      />
    </div>
  );
}

