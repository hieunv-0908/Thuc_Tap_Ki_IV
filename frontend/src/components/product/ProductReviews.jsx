import { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import {
  Star,
  MessageSquare,
  CheckCircle2,
  Store,
  Trash2,
  Edit3,
  Send,
  Loader2,
  Upload,
  ThumbsUp,
  X,
  Camera,
  Maximize2,
} from 'lucide-react';
import reviewApi from '../../api/review';
import { useAuthStore } from '../../store/authStore';
import { toast } from '../../store/toastStore';
import Button from '../ui/Button';
import ConfirmDialog from '../ui/ConfirmDialog';
import Modal from '../ui/Modal';

const RATING_LABELS = {
  1: 'Rất tệ',
  2: 'Không hài lòng',
  3: 'Bình thường',
  4: 'Hài lòng',
  5: 'Rất tuyệt vời!',
};

export default function ProductReviews({ productId, onReviewUpdated }) {
  const { user, isAuthenticated } = useAuthStore();

  // State reviews & stats
  const [reviews, setReviews] = useState([]);
  const [summary, setSummary] = useState({
    averageRating: 0.0,
    totalReviews: 0,
    ratingCounts: { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 },
    ratingPercentages: { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 },
  });
  const [loading, setLoading] = useState(true);
  const [ratingFilter, setRatingFilter] = useState(null); // null = all, 1..5
  const [sortBy, setSortBy] = useState('createdAt'); // 'createdAt' or 'helpfulCount'
  const [page, setPage] = useState(0);
  const [totalPages, setTotalPages] = useState(0);

  // User review state
  const [myReview, setMyReview] = useState(null);
  const [isEditing, setIsEditing] = useState(false);

  // Form state
  const [ratingInput, setRatingInput] = useState(5);
  const [hoverRating, setHoverRating] = useState(0);
  const [commentInput, setCommentInput] = useState('');
  const [imageUrls, setImageUrls] = useState([]);
  const [uploadingImages, setUploadingImages] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  // Lightbox preview modal state
  const [previewImage, setPreviewImage] = useState(null);

  // Delete modal state
  const [deleteTargetId, setDeleteTargetId] = useState(null);
  const [deleting, setDeleting] = useState(false);

  // Fetch summary
  const fetchSummary = useCallback(async () => {
    try {
      const res = await reviewApi.getProductReviewSummary(productId);
      if (res.data) {
        setSummary(res.data);
      }
    } catch (err) {
      console.error('Failed to load review summary:', err);
    }
  }, [productId]);

  // Fetch user's own review
  const fetchMyReview = useCallback(async () => {
    if (!isAuthenticated) {
      setMyReview(null);
      return;
    }
    try {
      const res = await reviewApi.getMyProductReview(productId);
      if (res.data) {
        setMyReview(res.data);
        setRatingInput(res.data.rating);
        setCommentInput(res.data.comment);
        setImageUrls(res.data.images || []);
      } else {
        setMyReview(null);
        setRatingInput(5);
        setCommentInput('');
        setImageUrls([]);
      }
    } catch {
      setMyReview(null);
    }
  }, [productId, isAuthenticated]);

  // Fetch reviews list (on user action or pagination)
  const fetchReviews = useCallback(async () => {
    try {
      const res = await reviewApi.getProductReviews(productId, {
        rating: ratingFilter || undefined,
        page,
        size: 6,
        sortBy,
        sortDir: 'desc',
      });
      if (res.data) {
        setReviews(res.data.content || []);
        setTotalPages(res.data.totalPages || 0);
      }
    } catch (err) {
      console.error('Failed to load product reviews:', err);
      toast.error('Không thể tải danh sách đánh giá');
    } finally {
      setLoading(false);
    }
  }, [productId, ratingFilter, page, sortBy]);

  useEffect(() => {
    let ignore = false;
    async function loadInitialData() {
      try {
        const res = await reviewApi.getProductReviewSummary(productId);
        if (!ignore && res.data) {
          setSummary(res.data);
        }
      } catch (err) {
        console.error('Failed to load review summary:', err);
      }

      if (isAuthenticated) {
        try {
          const res = await reviewApi.getMyProductReview(productId);
          if (!ignore) {
            if (res.data) {
              setMyReview(res.data);
              setRatingInput(res.data.rating);
              setCommentInput(res.data.comment);
              setImageUrls(res.data.images || []);
            } else {
              setMyReview(null);
              setRatingInput(5);
              setCommentInput('');
              setImageUrls([]);
            }
          }
        } catch {
          if (!ignore) setMyReview(null);
        }
      } else if (!ignore) {
        setMyReview(null);
      }
    }

    loadInitialData();
    return () => {
      ignore = true;
    };
  }, [productId, isAuthenticated]);

  useEffect(() => {
    let ignore = false;
    async function loadReviews() {
      try {
        const res = await reviewApi.getProductReviews(productId, {
          rating: ratingFilter || undefined,
          page,
          size: 6,
          sortBy,
          sortDir: 'desc',
        });
        if (!ignore && res.data) {
          setReviews(res.data.content || []);
          setTotalPages(res.data.totalPages || 0);
        }
      } catch (err) {
        if (!ignore) {
          console.error('Failed to load product reviews:', err);
          toast.error('Không thể tải danh sách đánh giá');
        }
      } finally {
        if (!ignore) {
          setLoading(false);
        }
      }
    }

    loadReviews();
    return () => {
      ignore = true;
    };
  }, [productId, ratingFilter, page, sortBy]);

  // Handle uploading images to Cloudinary
  const handleUploadImages = async (e) => {
    const files = Array.from(e.target.files || []);
    if (files.length === 0) return;

    if (imageUrls.length + files.length > 3) {
      toast.warning('Bạn chỉ có thể tải lên tối đa 3 ảnh cho mỗi đánh giá!');
      return;
    }

    setUploadingImages(true);
    const formData = new FormData();
    files.forEach((file) => formData.append('files', file));

    try {
      const res = await reviewApi.uploadReviewImages(formData);
      if (res.data) {
        setImageUrls((prev) => [...prev, ...res.data].slice(0, 3));
        toast.success(`Đã tải lên ${res.data.length} hình ảnh thực tế!`);
      }
    } catch (err) {
      const msg = err.response?.data?.message || 'Không thể tải ảnh lên. Vui lòng thử lại sau.';
      toast.error(msg);
    } finally {
      setUploadingImages(false);
      e.target.value = '';
    }
  };

  const handleRemoveImage = (indexToRemove) => {
    setImageUrls((prev) => prev.filter((_, idx) => idx !== indexToRemove));
  };

  // Toggle helpful vote
  const handleToggleHelpful = async (reviewId) => {
    if (!isAuthenticated) {
      toast.warning('Vui lòng đăng nhập để đánh giá tính hữu ích!');
      return;
    }

    try {
      const res = await reviewApi.toggleHelpfulVote(reviewId);
      if (res.data) {
        const { helpfulCount, isHelpful } = res.data;
        setReviews((prev) =>
          prev.map((r) =>
            r.id === reviewId
              ? { ...r, helpfulCount, isHelpfulByCurrentUser: isHelpful }
              : r
          )
        );
      }
    } catch (err) {
      const msg = err.response?.data?.message || 'Không thể thực hiện thao tác này';
      toast.error(msg);
    }
  };

  // Handle submit review
  const handleSubmitReview = async (e) => {
    e.preventDefault();
    if (!isAuthenticated) {
      toast.warning('Vui lòng đăng nhập để gửi đánh giá!');
      return;
    }
    if (!ratingInput || ratingInput < 1 || ratingInput > 5) {
      toast.warning('Vui lòng chọn số sao từ 1 đến 5');
      return;
    }
    if (!commentInput.trim()) {
      toast.warning('Vui lòng nhập nội dung bình phẩm sản phẩm');
      return;
    }

    setSubmitting(true);
    try {
      const payload = {
        rating: ratingInput,
        comment: commentInput.trim(),
        images: imageUrls,
      };

      if (myReview && isEditing) {
        await reviewApi.updateReview(myReview.id, payload);
        toast.success('Cập nhật đánh giá thành công!');
      } else {
        await reviewApi.createProductReview(productId, payload);
        toast.success('Gửi đánh giá thành công! Cảm ơn bạn đã phản hồi.');
      }
      setIsEditing(false);
      await fetchSummary();
      await fetchMyReview();
      await fetchReviews();
      if (onReviewUpdated) {
        onReviewUpdated();
      }
    } catch (err) {
      const msg = err.response?.data?.message || 'Không thể lưu đánh giá. Vui lòng thử lại sau.';
      toast.error(msg);
    } finally {
      setSubmitting(false);
    }
  };

  // Handle confirm delete
  const handleConfirmDelete = async () => {
    if (!deleteTargetId) return;
    setDeleting(true);
    try {
      await reviewApi.deleteReview(deleteTargetId);
      toast.success('Đã xóa đánh giá thành công');
      setDeleteTargetId(null);
      setIsEditing(false);
      setRatingInput(5);
      setCommentInput('');
      setImageUrls([]);
      await fetchSummary();
      await fetchMyReview();
      await fetchReviews();
      if (onReviewUpdated) {
        onReviewUpdated();
      }
    } catch (err) {
      const msg = err.response?.data?.message || 'Không thể xóa đánh giá';
      toast.error(msg);
    } finally {
      setDeleting(false);
    }
  };

  const currentHoverOrRating = hoverRating || ratingInput;

  return (
    <div className="space-y-8 max-w-4xl">
      {/* 1. Header Overview & Stats */}
      <div className="p-6 rounded-2xl bg-gradient-to-br from-amber-50/50 via-white to-orange-50/30 border border-amber-200/80 shadow-xs">
        <div className="grid grid-cols-1 md:grid-cols-12 gap-6 items-center">
          {/* Average Rating Score */}
          <div className="md:col-span-4 text-center md:text-left md:border-r md:border-amber-200/60 md:pr-6">
            <span className="text-xs uppercase tracking-wider font-bold text-amber-700/80">
              Đánh giá trung bình
            </span>
            <div className="flex items-baseline justify-center md:justify-start gap-2 mt-1">
              <span className="text-5xl font-black text-ink tracking-tight">
                {summary.averageRating > 0 ? summary.averageRating.toFixed(1) : '5.0'}
              </span>
              <span className="text-xl text-ink-subtle font-semibold">/ 5</span>
            </div>
            <div className="flex items-center justify-center md:justify-start gap-1 my-2">
              {Array.from({ length: 5 }).map((_, i) => {
                const filled = i < Math.round(summary.averageRating || 5);
                return (
                  <Star
                    key={i}
                    className={`size-5 ${
                      filled
                        ? 'fill-amber-400 text-amber-400'
                        : 'fill-gray-200 text-gray-200'
                    }`}
                  />
                );
              })}
            </div>
            <p className="text-xs text-ink-muted">
              Dựa trên <span className="font-bold text-ink">{summary.totalReviews}</span> lượt đánh giá thực tế
            </p>
          </div>

          {/* Star Breakdown Bars */}
          <div className="md:col-span-8 space-y-2">
            {[5, 4, 3, 2, 1].map((star) => {
              const count = summary.ratingCounts?.[star] || 0;
              const pct = summary.ratingPercentages?.[star] || 0;
              return (
                <button
                  key={star}
                  type="button"
                  onClick={() => {
                    setRatingFilter((prev) => (prev === star ? null : star));
                    setPage(0);
                  }}
                  className={`w-full flex items-center gap-3 text-xs group cursor-pointer transition-opacity ${
                    ratingFilter && ratingFilter !== star ? 'opacity-40 hover:opacity-100' : 'opacity-100'
                  }`}
                >
                  <span className="w-12 flex items-center gap-1 font-semibold text-ink group-hover:text-amber-600">
                    <span>{star}</span>
                    <Star className="size-3.5 fill-amber-400 text-amber-400" />
                  </span>
                  <div className="h-2.5 flex-1 rounded-full bg-gray-100 overflow-hidden border border-gray-200/60">
                    <div
                      className="h-full bg-gradient-to-r from-amber-400 to-amber-500 rounded-full transition-all duration-500"
                      style={{ width: `${pct}%` }}
                    />
                  </div>
                  <span className="w-10 text-right font-medium text-ink-muted group-hover:text-ink">
                    {pct}%
                  </span>
                  <span className="w-12 text-right text-[11px] text-ink-subtle">
                    ({count})
                  </span>
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* 2. Rating Filter Pills & Sort Options */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-line pb-4">
        <div className="flex items-center gap-2 flex-wrap">
          <span className="text-xs font-bold text-ink mr-1">Lọc theo:</span>
          <button
            type="button"
            onClick={() => {
              setRatingFilter(null);
              setPage(0);
            }}
            className={`px-3 py-1.5 rounded-full text-xs font-semibold transition-all cursor-pointer ${
              ratingFilter === null
                ? 'bg-amber-500 text-white shadow-xs'
                : 'bg-gray-100 text-ink-muted hover:bg-gray-200 hover:text-ink'
            }`}
          >
            Tất cả ({summary.totalReviews})
          </button>
          {[5, 4, 3, 2, 1].map((star) => (
            <button
              key={star}
              type="button"
              onClick={() => {
                setRatingFilter((prev) => (prev === star ? null : star));
                setPage(0);
              }}
              className={`px-3 py-1.5 rounded-full text-xs font-semibold flex items-center gap-1 transition-all cursor-pointer ${
                ratingFilter === star
                  ? 'bg-amber-500 text-white shadow-xs'
                  : 'bg-gray-100 text-ink-muted hover:bg-gray-200 hover:text-ink'
              }`}
            >
              <span>{star} sao</span>
              <span className="text-[11px] opacity-80">
                ({summary.ratingCounts?.[star] || 0})
              </span>
            </button>
          ))}
        </div>

        {/* Sort selector */}
        <div className="flex items-center gap-2 text-xs">
          <span className="text-ink-muted">Sắp xếp:</span>
          <select
            value={sortBy}
            onChange={(e) => {
              setSortBy(e.target.value);
              setPage(0);
            }}
            className="py-1 px-2.5 rounded-lg border border-line bg-white text-ink text-xs font-medium outline-hidden cursor-pointer"
          >
            <option value="createdAt">Mới nhất</option>
            <option value="helpfulCount">Hữu ích nhất 👍</option>
          </select>
        </div>
      </div>

      {/* 3. Review Submission Form or User Review Status */}
      {!isAuthenticated ? (
        <div className="p-5 rounded-2xl bg-amber-50/40 border border-amber-200/70 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-3 text-center sm:text-left">
            <div className="size-10 rounded-full bg-amber-100 text-amber-700 flex items-center justify-center shrink-0">
              <MessageSquare className="size-5" />
            </div>
            <div>
              <h4 className="text-sm font-bold text-ink">Bạn đã trải nghiệm sản phẩm này?</h4>
              <p className="text-xs text-ink-muted">
                Đăng nhập để chia sẻ cảm nhận, đính kèm hình ảnh thực tế cho cộng đồng FunnyShop nhé!
              </p>
            </div>
          </div>
          <Link to={`/login?redirect=${encodeURIComponent(window.location.pathname)}`}>
            <Button size="sm" variant="primary">
              Đăng nhập ngay
            </Button>
          </Link>
        </div>
      ) : myReview && !isEditing ? (
        // Already reviewed: Show My Review Banner
        <div className="p-5 rounded-2xl bg-emerald-50/60 border border-emerald-200 space-y-3">
          <div className="flex items-start justify-between gap-4">
            <div>
              <div className="flex items-center gap-2">
                <span className="inline-flex items-center gap-1 text-xs font-bold text-emerald-800 bg-emerald-100/80 px-2.5 py-0.5 rounded-full">
                  <CheckCircle2 className="size-3.5" />
                  Đánh giá của bạn
                </span>
                {myReview.isVerifiedPurchase && (
                  <span className="text-[11px] font-semibold text-emerald-700 bg-white/80 px-2 py-0.5 rounded-full border border-emerald-300">
                    ✓ Đã mua hàng
                  </span>
                )}
              </div>
              <div className="flex items-center gap-1 text-amber-500 my-1.5">
                {Array.from({ length: 5 }).map((_, i) => (
                  <Star
                    key={i}
                    className={`size-4 ${
                      i < myReview.rating
                        ? 'fill-amber-400 text-amber-400'
                        : 'fill-gray-200 text-gray-200'
                    }`}
                  />
                ))}
                <span className="text-xs font-bold text-ink ml-1.5">
                  {RATING_LABELS[myReview.rating]}
                </span>
              </div>
              <p className="text-xs sm:text-sm text-ink leading-relaxed">
                {myReview.comment}
              </p>

              {/* Photos if any */}
              {myReview.images && myReview.images.length > 0 && (
                <div className="flex items-center gap-2 mt-3">
                  {myReview.images.map((img, idx) => (
                    <button
                      key={idx}
                      type="button"
                      onClick={() => setPreviewImage(img)}
                      className="size-16 rounded-xl border border-line overflow-hidden hover:opacity-90 transition-opacity cursor-pointer shadow-2xs"
                    >
                      <img src={img} alt="Ảnh đánh giá" className="w-full h-full object-cover" />
                    </button>
                  ))}
                </div>
              )}
            </div>
            <div className="flex items-center gap-2 shrink-0">
              <Button
                size="xs"
                variant="outline"
                onClick={() => {
                  setRatingInput(myReview.rating);
                  setCommentInput(myReview.comment);
                  setImageUrls(myReview.images || []);
                  setIsEditing(true);
                }}
              >
                <Edit3 className="size-3.5 mr-1" />
                Sửa
              </Button>
              <Button
                size="xs"
                variant="outline"
                className="text-vermilion hover:bg-red-50 border-red-200"
                onClick={() => setDeleteTargetId(myReview.id)}
              >
                <Trash2 className="size-3.5" />
              </Button>
            </div>
          </div>
          {myReview.adminReply && (
            <div className="mt-3 p-3 rounded-xl bg-white/90 border border-emerald-200 text-xs space-y-1">
              <div className="flex items-center gap-1.5 text-emerald-800 font-bold">
                <Store className="size-3.5" />
                Phản hồi từ FunnyShop
              </div>
              <p className="text-ink-muted leading-relaxed">{myReview.adminReply}</p>
            </div>
          )}
        </div>
      ) : (
        // Review Form (Create or Edit)
        <form
          onSubmit={handleSubmitReview}
          className="p-5 sm:p-6 rounded-2xl bg-white border border-line shadow-xs space-y-4"
        >
          <div className="flex items-center justify-between border-b border-line pb-3">
            <div>
              <h4 className="text-sm font-bold text-ink">
                {isEditing ? 'Chỉnh sửa đánh giá của bạn' : 'Viết đánh giá sản phẩm'}
              </h4>
              <p className="text-xs text-ink-muted">
                Chia sẻ cảm nhận chân thật và ảnh chụp sản phẩm giúp cộng đồng mua sắm tự tin hơn
              </p>
            </div>
            {isEditing && (
              <button
                type="button"
                onClick={() => setIsEditing(false)}
                className="text-xs text-ink-muted hover:text-ink cursor-pointer underline"
              >
                Hủy bỏ
              </button>
            )}
          </div>

          {/* Interactive Star Picker */}
          <div className="space-y-1.5">
            <label className="block text-xs font-bold text-ink">
              Mức độ hài lòng của bạn <span className="text-vermilion">*</span>
            </label>
            <div className="flex items-center gap-3">
              <div
                className="flex items-center gap-1"
                onMouseLeave={() => setHoverRating(0)}
              >
                {[1, 2, 3, 4, 5].map((star) => {
                  const active = star <= currentHoverOrRating;
                  return (
                    <button
                      key={star}
                      type="button"
                      onClick={() => setRatingInput(star)}
                      onMouseEnter={() => setHoverRating(star)}
                      className="p-1 rounded-md transition-transform hover:scale-125 focus:outline-hidden cursor-pointer"
                      title={`${star} sao`}
                    >
                      <Star
                        className={`size-7 transition-colors ${
                          active
                            ? 'fill-amber-400 text-amber-400 drop-shadow-xs'
                            : 'fill-gray-100 text-gray-300'
                        }`}
                      />
                    </button>
                  );
                })}
              </div>
              <span className="text-xs font-bold text-amber-700 bg-amber-50 px-2.5 py-1 rounded-lg border border-amber-200/60">
                {RATING_LABELS[currentHoverOrRating] || 'Chọn mức sao'}
              </span>
            </div>
          </div>

          {/* Comment Textarea */}
          <div className="space-y-1.5">
            <label className="block text-xs font-bold text-ink">
              Nội dung bình phẩm <span className="text-vermilion">*</span>
            </label>
            <textarea
              rows={4}
              value={commentInput}
              onChange={(e) => setCommentInput(e.target.value)}
              placeholder="Sản phẩm có đúng mô tả không? Chất liệu, độ hoàn thiện, thời gian đóng gói và giao hàng ra sao?..."
              maxLength={2000}
              className="w-full text-xs sm:text-sm p-3 rounded-xl border border-line focus:border-primary-500 focus:ring-2 focus:ring-primary-100 outline-hidden transition-all placeholder:text-ink-subtle resize-none"
            />
            <div className="flex items-center justify-between text-[11px] text-ink-subtle">
              <span>Tối thiểu 5 ký tự</span>
              <span>{commentInput.length} / 2000 ký tự</span>
            </div>
          </div>

          {/* Attach Real Photos Section */}
          <div className="space-y-2 pt-1">
            <label className="block text-xs font-bold text-ink flex items-center justify-between">
              <span className="flex items-center gap-1.5">
                <Camera className="size-3.5 text-primary-600" />
                Hình ảnh sản phẩm thực tế ({imageUrls.length}/3)
              </span>
              <span className="text-[11px] font-normal text-ink-subtle">Tối đa 3 ảnh (JPG, PNG, WEBP)</span>
            </label>

            <div className="flex items-center gap-3 flex-wrap">
              {/* Existing Uploaded Images */}
              {imageUrls.map((url, idx) => (
                <div key={idx} className="relative size-20 rounded-xl border border-line overflow-hidden group shadow-2xs">
                  <img src={url} alt={`Ảnh ${idx + 1}`} className="w-full h-full object-cover" />
                  <button
                    type="button"
                    onClick={() => handleRemoveImage(idx)}
                    className="absolute top-1 right-1 size-5 bg-black/70 hover:bg-red-600 text-white rounded-full flex items-center justify-center transition-colors cursor-pointer"
                    title="Xóa ảnh này"
                  >
                    <X className="size-3" />
                  </button>
                </div>
              ))}

              {/* Upload Trigger Button */}
              {imageUrls.length < 3 && (
                <label className="size-20 rounded-xl border-2 border-dashed border-line hover:border-primary-500 bg-gray-50/60 hover:bg-primary-50/30 flex flex-col items-center justify-center gap-1 text-ink-muted hover:text-primary-700 transition-colors cursor-pointer">
                  <input
                    type="file"
                    multiple
                    accept="image/*"
                    onChange={handleUploadImages}
                    disabled={uploadingImages}
                    className="hidden"
                  />
                  {uploadingImages ? (
                    <Loader2 className="size-5 text-primary-600 animate-spin" />
                  ) : (
                    <>
                      <Upload className="size-4" />
                      <span className="text-[10px] font-semibold">Tải ảnh</span>
                    </>
                  )}
                </label>
              )}
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center justify-end gap-3 pt-2">
            {isEditing && (
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setIsEditing(false)}
              >
                Hủy
              </Button>
            )}
            <Button
              type="submit"
              variant="primary"
              size="sm"
              disabled={submitting || uploadingImages}
              className="px-6"
            >
              {submitting ? (
                <>
                  <Loader2 className="size-4 animate-spin mr-1.5" />
                  Đang gửi...
                </>
              ) : (
                <>
                  <Send className="size-3.5 mr-1.5" />
                  {isEditing ? 'Lưu thay đổi' : 'Gửi đánh giá'}
                </>
              )}
            </Button>
          </div>
        </form>
      )}

      {/* 4. List of Customer Reviews */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-bold text-ink flex items-center gap-2">
            <span>Bình phẩm của khách hàng</span>
            <span className="text-xs font-normal text-ink-muted">
              ({reviews.length} hiển thị)
            </span>
          </h3>
        </div>

        {loading ? (
          <div className="py-12 flex flex-col items-center justify-center gap-3">
            <Loader2 className="size-6 text-amber-500 animate-spin" />
            <p className="text-xs text-ink-muted">Đang tải đánh giá...</p>
          </div>
        ) : reviews.length === 0 ? (
          <div className="py-12 text-center rounded-2xl bg-gray-50/60 border border-line/80 space-y-2">
            <div className="size-12 rounded-full bg-amber-100 text-amber-600 flex items-center justify-center mx-auto">
              <Star className="size-6 fill-amber-400 text-amber-400" />
            </div>
            <h4 className="text-sm font-bold text-ink">
              {ratingFilter
                ? `Chưa có đánh giá ${ratingFilter} sao nào`
                : 'Chưa có đánh giá nào cho sản phẩm này'}
            </h4>
            <p className="text-xs text-ink-muted max-w-sm mx-auto">
              {ratingFilter
                ? 'Hãy thử chọn mức sao khác để xem đánh giá của người mua'
                : 'Hãy là người đầu tiên trải nghiệm và chia sẻ cảm nhận chân thật nhé!'}
            </p>
            {ratingFilter && (
              <Button
                size="xs"
                variant="outline"
                onClick={() => setRatingFilter(null)}
                className="mt-2"
              >
                Xem tất cả đánh giá
              </Button>
            )}
          </div>
        ) : (
          <div className="space-y-4">
            {reviews.map((rev) => {
              const isOwner = user && user.id === rev.userId;
              const isAdmin = user && user.role === 'ADMIN';
              const initial = rev.userName ? rev.userName.charAt(0).toUpperCase() : 'U';

              return (
                <div
                  key={rev.id}
                  className="p-5 rounded-2xl border border-line bg-white shadow-2xs space-y-3 transition-all hover:border-amber-200"
                >
                  {/* Review Header: User Info & Star */}
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-center gap-3">
                      <div className="size-9 rounded-full bg-gradient-to-tr from-amber-400 to-orange-400 text-white font-black text-sm flex items-center justify-center shadow-xs">
                        {initial}
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <h4 className="text-xs sm:text-sm font-bold text-ink">
                            {rev.userName}
                          </h4>
                          {rev.isVerifiedPurchase && (
                            <span className="inline-flex items-center gap-0.5 text-[10px] font-semibold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                              <CheckCircle2 className="size-3" />
                              Đã mua hàng
                            </span>
                          )}
                        </div>
                        <div className="flex items-center gap-2 mt-0.5">
                          <div className="flex text-amber-400">
                            {Array.from({ length: 5 }).map((_, i) => (
                              <Star
                                key={i}
                                className={`size-3.5 ${
                                  i < rev.rating
                                    ? 'fill-amber-400 text-amber-400'
                                    : 'fill-gray-200 text-gray-200'
                                }`}
                              />
                            ))}
                          </div>
                          <span className="text-[11px] text-ink-subtle">
                            {rev.createdAt
                              ? new Date(rev.createdAt).toLocaleDateString('vi-VN', {
                                  day: '2-digit',
                                  month: '2-digit',
                                  year: 'numeric',
                                })
                              : ''}
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Owner or Admin action buttons */}
                    {(isOwner || isAdmin) && (
                      <div className="flex items-center gap-1.5">
                        {isOwner && (
                          <button
                            type="button"
                            onClick={() => {
                              setRatingInput(rev.rating);
                              setCommentInput(rev.comment);
                              setImageUrls(rev.images || []);
                              setIsEditing(true);
                              window.scrollTo({ top: 400, behavior: 'smooth' });
                            }}
                            className="p-1.5 text-ink-muted hover:text-ink hover:bg-gray-100 rounded-lg transition-colors cursor-pointer"
                            title="Sửa đánh giá"
                          >
                            <Edit3 className="size-3.5" />
                          </button>
                        )}
                        <button
                          type="button"
                          onClick={() => setDeleteTargetId(rev.id)}
                          className="p-1.5 text-ink-muted hover:text-vermilion hover:bg-red-50 rounded-lg transition-colors cursor-pointer"
                          title="Xóa đánh giá"
                        >
                          <Trash2 className="size-3.5" />
                        </button>
                      </div>
                    )}
                  </div>

                  {/* Comment Body */}
                  <p className="text-xs sm:text-sm text-ink-muted leading-relaxed whitespace-pre-line pl-12">
                    {rev.comment}
                  </p>

                  {/* Attached Real Photos */}
                  {rev.images && rev.images.length > 0 && (
                    <div className="flex items-center gap-2 pl-12 pt-1">
                      {rev.images.map((imgUrl, imgIdx) => (
                        <div
                          key={imgIdx}
                          onClick={() => setPreviewImage(imgUrl)}
                          className="relative size-16 sm:size-20 rounded-xl border border-line overflow-hidden hover:opacity-90 hover:ring-2 hover:ring-amber-400 transition-all cursor-pointer group shadow-2xs"
                        >
                          <img src={imgUrl} alt={`Ảnh review ${imgIdx + 1}`} className="w-full h-full object-cover" />
                          <div className="absolute inset-0 bg-black/20 opacity-0 group-hover:opacity-100 flex items-center justify-center text-white transition-opacity">
                            <Maximize2 className="size-4" />
                          </div>
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Helpful Vote Button & Shop Reply */}
                  <div className="pl-12 pt-1 flex items-center gap-4">
                    <button
                      type="button"
                      onClick={() => handleToggleHelpful(rev.id)}
                      className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium transition-all cursor-pointer border ${
                        rev.isHelpfulByCurrentUser
                          ? 'bg-amber-50 text-amber-800 border-amber-300 font-bold'
                          : 'bg-gray-50 text-ink-muted hover:text-ink hover:bg-gray-100 border-line'
                      }`}
                      title="Bấm nếu bạn thấy đánh giá này hữu ích"
                    >
                      <ThumbsUp className={`size-3.5 ${rev.isHelpfulByCurrentUser ? 'fill-amber-500 text-amber-600' : ''}`} />
                      <span>Hữu ích ({rev.helpfulCount || 0})</span>
                    </button>
                  </div>

                  {/* Shop Admin Reply */}
                  {rev.adminReply && (
                    <div className="ml-12 p-3.5 rounded-xl bg-secondary-50/70 border border-secondary-200/80 space-y-1.5">
                      <div className="flex items-center gap-1.5 text-xs font-bold text-secondary-900">
                        <Store className="size-3.5 text-secondary-700" />
                        <span>Phản hồi từ FunnyShop</span>
                        {rev.adminReplyAt && (
                          <span className="text-[10px] font-normal text-ink-subtle ml-auto">
                            {new Date(rev.adminReplyAt).toLocaleDateString('vi-VN')}
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-ink-muted leading-relaxed">
                        {rev.adminReply}
                      </p>
                    </div>
                  )}
                </div>
              );
            })}

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="flex items-center justify-center gap-2 pt-4">
                <Button
                  size="xs"
                  variant="outline"
                  disabled={page === 0}
                  onClick={() => setPage((p) => Math.max(0, p - 1))}
                >
                  ← Trang trước
                </Button>
                <span className="text-xs text-ink-muted font-medium px-2">
                  Trang {page + 1} / {totalPages}
                </span>
                <Button
                  size="xs"
                  variant="outline"
                  disabled={page >= totalPages - 1}
                  onClick={() => setPage((p) => p + 1)}
                >
                  Trang sau →
                </Button>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Lightbox Preview Modal */}
      <Modal
        isOpen={Boolean(previewImage)}
        onClose={() => setPreviewImage(null)}
        title="Hình ảnh thực tế từ khách hàng"
      >
        {previewImage && (
          <div className="flex flex-col items-center justify-center p-2">
            <img
              src={previewImage}
              alt="Hình ảnh thực tế"
              className="max-h-[75vh] w-auto max-w-full rounded-2xl object-contain shadow-soft"
            />
          </div>
        )}
      </Modal>

      {/* Confirm Delete Dialog */}
      <ConfirmDialog
        isOpen={Boolean(deleteTargetId)}
        title="Xác nhận xóa đánh giá"
        message="Bạn có chắc chắn muốn xóa đánh giá này không? Thao tác này không thể hoàn tác."
        confirmText="Xóa đánh giá"
        cancelText="Hủy"
        variant="danger"
        isLoading={deleting}
        onConfirm={handleConfirmDelete}
        onCancel={() => setDeleteTargetId(null)}
      />
    </div>
  );
}
