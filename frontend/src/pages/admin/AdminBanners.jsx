import { useState, useEffect, useRef, useCallback } from 'react';
import {
  Image,
  Plus,
  Pencil,
  Trash2,
  Eye,
  EyeOff,
  X,
  Upload,
  CheckCircle2,
  AlertTriangle,
  ToggleLeft,
  ToggleRight,
  ExternalLink,
  RefreshCw,
} from 'lucide-react';
import Button from '../../components/ui/Button';
import StatCard from '../../components/admin/StatCard';
import ConfirmDialog from '../../components/ui/ConfirmDialog';
import { bannerApi } from '../../api/banner';
import { toast } from '../../store/toastStore';

// ── Banner Form Modal ──────────────────────────────────────────────────────────
function BannerModal({ banner, onClose, onSaved }) {
  const [title, setTitle] = useState(banner?.title || '');
  const [subtitle, setSubtitle] = useState(banner?.subtitle || '');
  const [description, setDescription] = useState(banner?.description || '');
  const [ctaText, setCtaText] = useState(banner?.ctaText || 'Khám phá ngay');
  const [ctaLink, setCtaLink] = useState(banner?.ctaLink || '#products-catalog');
  const [isActive, setIsActive] = useState(banner?.isActive !== false);
  const [displayOrder, setDisplayOrder] = useState(banner?.displayOrder ?? 0);

  const [imageFile, setImageFile] = useState(null);
  const [imagePreview, setImagePreview] = useState(banner?.imageUrl || null);
  const [isDragging, setIsDragging] = useState(false);
  const [saving, setSaving] = useState(false);
  const [errors, setErrors] = useState({});

  const fileInputRef = useRef(null);
  const isEditing = !!banner;

  const handleFileSelect = (file) => {
    if (!file) return;
    const validTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
    if (!validTypes.includes(file.type)) {
      toast.error('Chỉ chấp nhận định dạng JPG, PNG, WEBP.');
      return;
    }
    if (file.size > 10 * 1024 * 1024) {
      toast.error('Dung lượng ảnh không được vượt quá 10MB.');
      return;
    }
    setImageFile(file);
    const reader = new FileReader();
    reader.onloadend = () => setImagePreview(reader.result);
    reader.readAsDataURL(file);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files?.[0];
    if (file) handleFileSelect(file);
  };

  const validate = () => {
    const errs = {};
    if (!title.trim()) errs.title = 'Tiêu đề không được để trống.';
    if (!isEditing && !imageFile) errs.image = 'Vui lòng chọn ảnh cho banner.';
    return errs;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const errs = validate();
    if (Object.keys(errs).length > 0) {
      setErrors(errs);
      return;
    }

    setSaving(true);
    try {
      const fd = new FormData();
      fd.append('title', title.trim());
      fd.append('subtitle', subtitle.trim());
      fd.append('description', description.trim());
      fd.append('ctaText', ctaText.trim() || 'Khám phá ngay');
      fd.append('ctaLink', ctaLink.trim() || '#products-catalog');
      fd.append('isActive', String(isActive));
      fd.append('displayOrder', String(displayOrder));
      if (imageFile) fd.append('image', imageFile);

      let saved;
      if (isEditing) {
        saved = await bannerApi.updateBanner(banner.id, fd);
        toast.success('Cập nhật banner thành công!');
      } else {
        saved = await bannerApi.createBanner(fd);
        toast.success('Tạo banner mới thành công!');
      }
      onSaved(saved);
      onClose();
    } catch (err) {
      toast.error(err?.response?.data?.message || err?.message || 'Lỗi khi lưu banner.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-3xl max-h-[92vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-line">
          <div className="flex items-center gap-2.5">
            <Image className="size-5 text-primary-600" />
            <h2 className="text-lg font-bold text-ink">
              {isEditing ? 'Chỉnh sửa Banner Hero' : 'Tạo Banner Hero mới'}
            </h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-lg text-ink-muted hover:bg-gray-100 transition-colors cursor-pointer"
          >
            <X className="size-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="p-6 grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Left: Image Upload */}
            <div>
              <label className="block text-sm font-semibold text-ink mb-2">
                Ảnh Hero <span className="text-red-500">*</span>
                <span className="text-xs font-normal text-ink-muted ml-1">(JPG, PNG, WEBP · tối đa 10MB)</span>
              </label>

              {/* Drop Zone */}
              <div
                className={`relative border-2 border-dashed rounded-xl transition-all cursor-pointer overflow-hidden aspect-[4/5] flex items-center justify-center ${
                  isDragging
                    ? 'border-primary-500 bg-primary-50'
                    : errors.image
                    ? 'border-red-400 bg-red-50'
                    : 'border-line bg-gray-50 hover:border-primary-400 hover:bg-primary-50/40'
                }`}
                onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
                onDragLeave={() => setIsDragging(false)}
                onDrop={handleDrop}
                onClick={() => fileInputRef.current?.click()}
              >
                {imagePreview ? (
                  <>
                    <img
                      src={imagePreview}
                      alt="Preview"
                      className="w-full h-full object-cover"
                    />
                    <div className="absolute inset-0 bg-black/40 opacity-0 hover:opacity-100 transition-opacity flex flex-col items-center justify-center gap-2">
                      <Upload className="size-8 text-white" />
                      <span className="text-white text-sm font-medium">Thay ảnh khác</span>
                    </div>
                  </>
                ) : (
                  <div className="flex flex-col items-center gap-3 p-6 text-center">
                    <div className="size-14 rounded-full bg-primary-100 flex items-center justify-center">
                      <Upload className="size-7 text-primary-600" />
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-ink">Kéo thả hoặc bấm để chọn ảnh</p>
                      <p className="text-xs text-ink-muted mt-1">Tỷ lệ 4:5 phù hợp nhất với Hero trang chủ</p>
                    </div>
                  </div>
                )}
              </div>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/jpeg,image/jpg,image/png,image/webp"
                className="hidden"
                onChange={(e) => handleFileSelect(e.target.files?.[0])}
              />
              {errors.image && (
                <p className="text-xs text-red-500 mt-1.5 flex items-center gap-1">
                  <AlertTriangle className="size-3.5" /> {errors.image}
                </p>
              )}

              {/* Live Preview label */}
              {imagePreview && (
                <div className="mt-2 p-3 bg-gray-50 rounded-xl border border-line">
                  <p className="text-xs font-semibold text-ink-muted uppercase tracking-wide mb-1.5">Xem trước Hero</p>
                  <div className="relative aspect-[4/5] rounded-lg overflow-hidden border border-line">
                    <img src={imagePreview} alt="Preview" className="w-full h-full object-cover" />
                    <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/60 to-transparent p-3">
                      <p className="text-white text-[10px] font-medium uppercase tracking-wider opacity-80">
                        {subtitle || 'BỘ SƯU TẬP 2026'}
                      </p>
                      <p className="text-white text-sm font-semibold leading-tight mt-0.5">
                        {title || 'Tiêu đề banner'}
                      </p>
                      <span className="inline-block mt-2 text-[10px] border border-white/70 text-white px-2 py-0.5">
                        {ctaText || 'Khám phá ngay'}
                      </span>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Right: Fields */}
            <div className="space-y-4">
              {/* Title */}
              <div>
                <label className="block text-sm font-semibold text-ink mb-1.5">
                  Tiêu đề chính <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={title}
                  onChange={(e) => { setTitle(e.target.value); setErrors(p => ({ ...p, title: '' })); }}
                  placeholder="Ví dụ: Giản dị, mà có chiều sâu."
                  className={`w-full px-3 py-2.5 rounded-xl border text-sm bg-white focus:outline-none focus:ring-2 focus:ring-primary-400 transition-all ${
                    errors.title ? 'border-red-400' : 'border-line'
                  }`}
                />
                {errors.title && <p className="text-xs text-red-500 mt-1">{errors.title}</p>}
              </div>

              {/* Subtitle */}
              <div>
                <label className="block text-sm font-semibold text-ink mb-1.5">Tiêu đề phụ</label>
                <input
                  type="text"
                  value={subtitle}
                  onChange={(e) => setSubtitle(e.target.value)}
                  placeholder="Ví dụ: BỘ SƯU TẬP 2026"
                  className="w-full px-3 py-2.5 rounded-xl border border-line text-sm bg-white focus:outline-none focus:ring-2 focus:ring-primary-400 transition-all"
                />
              </div>

              {/* Description */}
              <div>
                <label className="block text-sm font-semibold text-ink mb-1.5">Mô tả ngắn</label>
                <textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  rows={3}
                  placeholder="Mô tả phong cách, chất liệu, cảm hứng bộ sưu tập..."
                  className="w-full px-3 py-2.5 rounded-xl border border-line text-sm bg-white focus:outline-none focus:ring-2 focus:ring-primary-400 transition-all resize-none"
                />
              </div>

              {/* CTA */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-semibold text-ink mb-1.5">Chữ nút bấm</label>
                  <input
                    type="text"
                    value={ctaText}
                    onChange={(e) => setCtaText(e.target.value)}
                    placeholder="Khám phá ngay"
                    className="w-full px-3 py-2.5 rounded-xl border border-line text-sm bg-white focus:outline-none focus:ring-2 focus:ring-primary-400 transition-all"
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-ink mb-1.5">Link nút bấm</label>
                  <input
                    type="text"
                    value={ctaLink}
                    onChange={(e) => setCtaLink(e.target.value)}
                    placeholder="#products-catalog"
                    className="w-full px-3 py-2.5 rounded-xl border border-line text-sm bg-white focus:outline-none focus:ring-2 focus:ring-primary-400 transition-all"
                  />
                </div>
              </div>

              {/* Display Order */}
              <div>
                <label className="block text-sm font-semibold text-ink mb-1.5">Thứ tự hiển thị</label>
                <input
                  type="number"
                  value={displayOrder}
                  onChange={(e) => setDisplayOrder(Number(e.target.value))}
                  min={0}
                  className="w-full px-3 py-2.5 rounded-xl border border-line text-sm bg-white focus:outline-none focus:ring-2 focus:ring-primary-400 transition-all"
                />
                <p className="text-xs text-ink-muted mt-1">Số nhỏ hơn hiển thị trước (mặc định: 0)</p>
              </div>

              {/* Status Toggle */}
              <div className="flex items-center justify-between p-3 bg-gray-50 rounded-xl border border-line">
                <div>
                  <p className="text-sm font-semibold text-ink">Trạng thái</p>
                  <p className="text-xs text-ink-muted">
                    {isActive ? 'Đang hiển thị trên trang chủ' : 'Đang ẩn (nháp)'}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setIsActive(!isActive)}
                  className="cursor-pointer"
                >
                  {isActive
                    ? <ToggleRight className="size-9 text-primary-600" />
                    : <ToggleLeft className="size-9 text-gray-400" />
                  }
                </button>
              </div>
            </div>
          </div>

          {/* Footer */}
          <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-line bg-gray-50 rounded-b-2xl">
            <Button type="button" variant="outline" onClick={onClose} disabled={saving}>
              Hủy
            </Button>
            <Button type="submit" variant="primary" loading={saving} leftIcon={saving ? undefined : CheckCircle2}>
              {saving ? 'Đang lưu...' : isEditing ? 'Lưu thay đổi' : 'Tạo Banner'}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}

// ── Main Page ─────────────────────────────────────────────────────────────────
export default function AdminBanners() {
  const [banners, setBanners] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editTarget, setEditTarget] = useState(null);

  const [deleteTarget, setDeleteTarget] = useState(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const fetchBanners = useCallback(async () => {
    try {
      const list = await bannerApi.getAllBanners();
      setBanners(list);
    } catch (err) {
      toast.error(err?.response?.data?.message || 'Không thể tải danh sách banner.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    let ignore = false;
    async function load() {
      try {
        const list = await bannerApi.getAllBanners();
        if (!ignore) {
          setBanners(list);
        }
      } catch (err) {
        if (!ignore) {
          toast.error(err?.response?.data?.message || 'Không thể tải danh sách banner.');
        }
      } finally {
        if (!ignore) {
          setLoading(false);
        }
      }
    }
    load();
    return () => {
      ignore = true;
    };
  }, []);

  const handleRefresh = async () => {
    setRefreshing(true);
    await fetchBanners();
    toast.success('Đã cập nhật danh sách banner!');
  };

  const handleOpenCreate = () => {
    setEditTarget(null);
    setIsModalOpen(true);
  };

  const handleOpenEdit = (banner) => {
    setEditTarget(banner);
    setIsModalOpen(true);
  };

  const handleSaved = (savedBanner) => {
    setBanners((prev) => {
      const idx = prev.findIndex((b) => b.id === savedBanner.id);
      if (idx >= 0) {
        const copy = [...prev];
        copy[idx] = savedBanner;
        return copy;
      }
      return [...prev, savedBanner];
    });
  };

  const handleToggleStatus = async (banner) => {
    try {
      const updated = await bannerApi.toggleStatus(banner.id);
      setBanners((prev) => prev.map((b) => (b.id === banner.id ? updated : b)));
      toast.success(updated.isActive ? 'Banner đã được bật!' : 'Banner đã được tắt!');
    } catch (err) {
      toast.error(err?.response?.data?.message || 'Không thể thay đổi trạng thái banner.');
    }
  };

  const handleDeleteConfirm = async () => {
    if (!deleteTarget) return;
    setIsDeleting(true);
    try {
      await bannerApi.deleteBanner(deleteTarget.id);
      setBanners((prev) => prev.filter((b) => b.id !== deleteTarget.id));
      toast.success('Đã xóa banner và ảnh trên Cloudinary thành công!');
      setDeleteTarget(null);
    } catch (err) {
      toast.error(err?.response?.data?.message || 'Không thể xóa banner.');
    } finally {
      setIsDeleting(false);
    }
  };

  // Stats
  const totalBanners = banners.length;
  const activeBanners = banners.filter((b) => b.isActive).length;
  const draftBanners = banners.filter((b) => !b.isActive).length;

  if (loading) {
    return (
      <div className="space-y-6 animate-pulse">
        <div className="h-10 bg-gray-200 rounded-xl w-64" />
        <div className="grid grid-cols-3 gap-4">
          {[1, 2, 3].map((i) => <div key={i} className="h-24 bg-gray-200 rounded-2xl" />)}
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[1, 2].map((i) => <div key={i} className="h-72 bg-gray-200 rounded-2xl" />)}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8 animate-in fade-in duration-200">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-line">
        <div>
          <div className="flex items-center gap-2.5">
            <h1 className="text-2xl md:text-3xl font-extrabold text-ink tracking-tight">
              Quản lý Banner Hero
            </h1>
            <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-primary-100 text-primary-700 border border-primary-200">
              <Image className="size-3.5" />
              Cloudinary
            </span>
          </div>
          <p className="text-sm text-ink-muted mt-1">
            Quản lý ảnh và nội dung Hero section hiển thị trên trang chủ
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <Button
            variant="outline"
            size="sm"
            onClick={handleRefresh}
            disabled={refreshing}
            leftIcon={RefreshCw}
            className={refreshing ? 'animate-spin' : ''}
          >
            {refreshing ? 'Đang tải...' : 'Làm mới'}
          </Button>
          <Button
            variant="primary"
            size="sm"
            onClick={handleOpenCreate}
            leftIcon={Plus}
          >
            Tạo Banner mới
          </Button>
        </div>
      </div>

      {/* Stats Row */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <StatCard
          icon={Image}
          label="Tổng Banner"
          value={totalBanners}
          subtext="Tổng số banner đã tạo"
          variant="primary"
        />
        <StatCard
          icon={Eye}
          label="Đang hiển thị"
          value={activeBanners}
          subtext="Banner đang phát hành trên trang chủ"
          variant="success"
        />
        <StatCard
          icon={EyeOff}
          label="Bản nháp"
          value={draftBanners}
          subtext="Banner đang ẩn / chưa phát hành"
          variant="warning"
        />
      </div>

      {/* Banner Grid */}
      {banners.length === 0 ? (
        <div className="py-20 flex flex-col items-center justify-center border-2 border-dashed border-line rounded-2xl text-center">
          <div className="size-16 rounded-full bg-primary-100 flex items-center justify-center mb-4">
            <Image className="size-8 text-primary-600" />
          </div>
          <h3 className="text-lg font-bold text-ink mb-1">Chưa có Banner nào</h3>
          <p className="text-sm text-ink-muted mb-6 max-w-xs">
            Tạo Banner Hero đầu tiên để hiển thị ảnh lookbook và nội dung trên trang chủ của bạn.
          </p>
          <Button variant="primary" onClick={handleOpenCreate} leftIcon={Plus}>
            Tạo Banner đầu tiên
          </Button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {banners
            .slice()
            .sort((a, b) => (a.displayOrder ?? 0) - (b.displayOrder ?? 0))
            .map((banner) => (
              <div
                key={banner.id}
                className="bg-white rounded-2xl border border-line shadow-soft overflow-hidden flex flex-col"
              >
                {/* Image Preview */}
                <div className="relative aspect-[4/5] bg-gray-100 overflow-hidden">
                  {banner.imageUrl ? (
                    <img
                      src={banner.imageUrl}
                      alt={banner.title}
                      className="w-full h-full object-cover transition-transform duration-300 hover:scale-105"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center">
                      <Image className="size-12 text-gray-300" />
                    </div>
                  )}

                  {/* Status Badge */}
                  <div className="absolute top-3 left-3">
                    <span
                      className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold shadow-sm ${
                        banner.isActive
                          ? 'bg-emerald-500 text-white'
                          : 'bg-gray-700/80 text-gray-200'
                      }`}
                    >
                      {banner.isActive ? (
                        <><Eye className="size-3" /> Đang phát hành</>
                      ) : (
                        <><EyeOff className="size-3" /> Nháp</>
                      )}
                    </span>
                  </div>

                  {/* Order Badge */}
                  <div className="absolute top-3 right-3">
                    <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-bold bg-black/60 text-white">
                      #{banner.displayOrder ?? 0}
                    </span>
                  </div>

                  {/* Overlay Gradient */}
                  <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/70 to-transparent p-4">
                    <p className="text-white/70 text-[10px] font-medium uppercase tracking-wider mb-0.5">
                      {banner.subtitle || '—'}
                    </p>
                    <p className="text-white text-sm font-bold leading-snug line-clamp-2">
                      {banner.title}
                    </p>
                  </div>
                </div>

                {/* Info & Actions */}
                <div className="p-4 flex flex-col gap-3 flex-1">
                  {/* Description */}
                  {banner.description && (
                    <p className="text-xs text-ink-muted line-clamp-2">{banner.description}</p>
                  )}

                  {/* CTA Preview */}
                  <div className="flex items-center gap-2 text-xs text-ink-muted">
                    <ExternalLink className="size-3.5 shrink-0" />
                    <span className="font-medium truncate">{banner.ctaText || 'Khám phá ngay'}</span>
                    <span className="text-line">→</span>
                    <span className="truncate opacity-70">{banner.ctaLink}</span>
                  </div>

                  {/* Action Buttons */}
                  <div className="flex items-center gap-2 mt-auto pt-2 border-t border-line">
                    {/* Toggle Status */}
                    <button
                      type="button"
                      title={banner.isActive ? 'Tắt banner' : 'Bật banner'}
                      onClick={() => handleToggleStatus(banner)}
                      className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors cursor-pointer ${
                        banner.isActive
                          ? 'bg-amber-100 text-amber-700 hover:bg-amber-200'
                          : 'bg-emerald-100 text-emerald-700 hover:bg-emerald-200'
                      }`}
                    >
                      {banner.isActive
                        ? <><EyeOff className="size-3.5" /> Tắt</>
                        : <><Eye className="size-3.5" /> Bật</>
                      }
                    </button>

                    {/* Edit */}
                    <button
                      type="button"
                      onClick={() => handleOpenEdit(banner)}
                      className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-primary-50 text-primary-700 hover:bg-primary-100 transition-colors cursor-pointer"
                    >
                      <Pencil className="size-3.5" /> Sửa
                    </button>

                    {/* View on Cloudinary */}
                    {banner.imageUrl && (
                      <a
                        href={banner.imageUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-gray-100 text-ink-muted hover:bg-gray-200 transition-colors"
                        title="Xem ảnh Cloudinary"
                      >
                        <ExternalLink className="size-3.5" />
                      </a>
                    )}

                    {/* Delete */}
                    <button
                      type="button"
                      onClick={() => setDeleteTarget(banner)}
                      className="ml-auto flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-red-50 text-red-600 hover:bg-red-100 transition-colors cursor-pointer"
                    >
                      <Trash2 className="size-3.5" /> Xóa
                    </button>
                  </div>
                </div>
              </div>
            ))}

          {/* Add New Card */}
          <button
            type="button"
            onClick={handleOpenCreate}
            className="border-2 border-dashed border-line rounded-2xl flex flex-col items-center justify-center gap-3 aspect-[4/5] min-h-[300px] text-ink-muted hover:border-primary-400 hover:text-primary-600 hover:bg-primary-50/40 transition-all cursor-pointer"
          >
            <div className="size-14 rounded-full bg-gray-100 flex items-center justify-center">
              <Plus className="size-7" />
            </div>
            <div className="text-center">
              <p className="text-sm font-semibold">Thêm Banner mới</p>
              <p className="text-xs opacity-70 mt-0.5">Upload ảnh lên Cloudinary</p>
            </div>
          </button>
        </div>
      )}

      {/* Cloudinary Note */}
      <div className="flex items-start gap-3 p-4 bg-blue-50 border border-blue-200 rounded-xl text-sm">
        <CheckCircle2 className="size-4 text-blue-600 shrink-0 mt-0.5" />
        <div>
          <p className="font-semibold text-blue-800">Tích hợp Cloudinary</p>
          <p className="text-blue-700 mt-0.5 text-xs">
            Ảnh được tải lên và tối ưu hóa tự động (WebP, Auto Quality) trong thư mục{' '}
            <code className="bg-blue-100 px-1 rounded">funnyshop/banners/</code>. Khi xóa banner,
            ảnh cũng được xóa khỏi Cloudinary tự động.
          </p>
        </div>
      </div>

      {/* Modal */}
      {isModalOpen && (
        <BannerModal
          banner={editTarget}
          onClose={() => setIsModalOpen(false)}
          onSaved={handleSaved}
        />
      )}

      {/* Confirm Delete Dialog */}
      <ConfirmDialog
        open={!!deleteTarget}
        title="Xóa Banner Hero"
        message={
          <div>
            <p className="mb-2">
              Bạn có chắc muốn xóa banner <strong>{deleteTarget?.title}</strong>?
            </p>
            <p className="text-sm text-red-600 font-medium">
              ⚠️ Hành động này sẽ xóa vĩnh viễn ảnh khỏi Cloudinary và không thể hoàn tác.
            </p>
          </div>
        }
        confirmLabel="Xóa vĩnh viễn"
        confirmVariant="danger"
        onConfirm={handleDeleteConfirm}
        onCancel={() => setDeleteTarget(null)}
        loading={isDeleting}
      />
    </div>
  );
}

