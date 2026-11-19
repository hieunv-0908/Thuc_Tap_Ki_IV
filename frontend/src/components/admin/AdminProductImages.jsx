import { useState, useRef } from 'react';
import {
  Image as ImageIcon,
  Plus,
  Star,
  Trash2,
  Tag,
  Check,
  Upload,
  X,
} from 'lucide-react';
import Button from '../ui/Button';
import Input from '../ui/Input';
import Select from '../ui/Select';
import ConfirmDialog from '../ui/ConfirmDialog';
import { adminApi } from '../../api/admin';
import { toast } from '../../store/toastStore';
import { uploadImageToCloudinary } from '../../utils/cloudinary';

export default function AdminProductImages({ productId, images = [], variants = [], onRefresh }) {
  // Form thêm ảnh mới
  const [imageUrl, setImageUrl] = useState('');
  const [isPrimary, setIsPrimary] = useState(images.length === 0);
  const [selectedVariantId, setSelectedVariantId] = useState('');
  const [imageError, setImageError] = useState(null);
  const [addingImage, setAddingImage] = useState(false);
  const [previewLoadError, setPreviewLoadError] = useState(false);

  // Cloudinary Upload State
  const [uploadingImage, setUploadingImage] = useState(false);
  const [imageUploadMode, setImageUploadMode] = useState('upload'); // 'upload' | 'url'
  const fileInputRef = useRef(null);

  const handleFileSelect = async (file) => {
    if (!file) return;
    try {
      setUploadingImage(true);
      setPreviewLoadError(false);
      setImageError(null);
      const result = await uploadImageToCloudinary(file, 'funnyshop/products');
      setImageUrl(result.url);
      toast.success('Đã tải ảnh lên Cloudinary thành công!');
    } catch (err) {
      toast.error(err.message || 'Lỗi tải ảnh lên Cloudinary.');
    } finally {
      setUploadingImage(false);
    }
  };

  // Xóa ảnh
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [isDeleting, setIsDeleting] = useState(false);

  // Đổi ảnh chính
  const [settingPrimaryId, setSettingPrimaryId] = useState(null);

  // Variant lookup map
  const variantMap = new Map(variants.map((v) => [v.id, v]));

  // Submit thêm ảnh
  const handleAddImage = async (e) => {
    e.preventDefault();
    if (!imageUrl.trim()) {
      setImageError('Vui lòng nhập đường dẫn ảnh');
      return;
    }

    try {
      new URL(imageUrl.trim());
    } catch {
      setImageError('Đường dẫn ảnh (URL) không hợp lệ');
      return;
    }

    try {
      setAddingImage(true);
      setImageError(null);

      const payload = {
        imageUrl: imageUrl.trim(),
        isPrimary: Boolean(isPrimary),
        variantId: selectedVariantId ? Number(selectedVariantId) : null,
      };

      await adminApi.addImage(productId, payload);
      toast.success('Đã thêm ảnh vào thư viện thành công!');
      setImageUrl('');
      setIsPrimary(false);
      setSelectedVariantId('');
      setPreviewLoadError(false);
      if (onRefresh) await onRefresh();
    } catch (err) {
      console.error('Lỗi thêm ảnh:', err);
      toast.error(err.message || 'Không thể thêm ảnh. Vui lòng thử lại.');
    } finally {
      setAddingImage(false);
    }
  };

  // Đặt ảnh chính
  const handleSetPrimary = async (img) => {
    try {
      setSettingPrimaryId(img.id);
      await adminApi.setPrimaryImage(img.id);
      toast.success('Đã đặt làm ảnh đại diện chính của sản phẩm!');
      if (onRefresh) await onRefresh();
    } catch (err) {
      console.error('Lỗi đặt ảnh chính:', err);
      toast.error(err.message || 'Không thể cập nhật ảnh chính.');
    } finally {
      setSettingPrimaryId(null);
    }
  };

  // Xóa ảnh
  const handleDeleteImage = async () => {
    if (!deleteTarget) return;
    try {
      setIsDeleting(true);
      await adminApi.deleteImage(deleteTarget.id);
      toast.success('Đã xóa ảnh khỏi thư viện thành công!');
      setDeleteTarget(null);
      if (onRefresh) await onRefresh();
    } catch (err) {
      console.error('Lỗi xóa ảnh:', err);
      toast.error(err.message || 'Không thể xóa ảnh.');
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="p-5 rounded-xl border border-line bg-white shadow-soft">
        <h2 className="text-lg font-bold text-ink flex items-center gap-2">
          <ImageIcon className="size-5 text-secondary-600" />
          Thư viện hình ảnh sản phẩm
        </h2>
        <p className="text-xs text-ink-muted mt-0.5">
          Quản lý ảnh đại diện và ảnh liên kết cho từng phân loại màu sắc của sản phẩm
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Form Thêm Ảnh Mới (4 cols on lg) */}
        <div className="lg:col-span-5 rounded-xl border border-line bg-white p-5 shadow-soft space-y-4">
          <div className="flex items-center justify-between border-b border-line pb-3">
            <h3 className="text-base font-semibold text-ink flex items-center gap-2">
              <Plus className="size-4 text-primary-700" />
              Thêm ảnh mới vào thư viện
            </h3>
            <div className="inline-flex p-0.5 bg-gray-100 rounded-lg text-xs font-medium">
              <button
                type="button"
                onClick={() => setImageUploadMode('upload')}
                className={`px-2.5 py-1 rounded-md transition-colors cursor-pointer ${
                  imageUploadMode === 'upload' ? 'bg-white text-ink shadow-2xs font-bold' : 'text-ink-muted'
                }`}
              >
                Tải từ máy
              </button>
              <button
                type="button"
                onClick={() => setImageUploadMode('url')}
                className={`px-2.5 py-1 rounded-md transition-colors cursor-pointer ${
                  imageUploadMode === 'url' ? 'bg-white text-ink shadow-2xs font-bold' : 'text-ink-muted'
                }`}
              >
                Dán URL
              </button>
            </div>
          </div>

          <form onSubmit={handleAddImage} className="space-y-4">
            {imageUploadMode === 'upload' ? (
              <div className="space-y-3">
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/jpeg,image/jpg,image/png,image/webp"
                  className="hidden"
                  onChange={(e) => handleFileSelect(e.target.files?.[0])}
                />

                {imageUrl && !previewLoadError ? (
                  <div className="space-y-2">
                    <div className="relative aspect-video w-full rounded-lg border border-line bg-gray-50 overflow-hidden group shadow-2xs">
                      <img
                        src={imageUrl}
                        alt="Xem trước ảnh thêm mới"
                        className="w-full h-full object-contain"
                        onError={() => setPreviewLoadError(true)}
                      />
                      <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                        <button
                          type="button"
                          onClick={() => fileInputRef.current?.click()}
                          disabled={uploadingImage}
                          className="px-3 py-1.5 rounded-lg bg-white/90 text-ink text-xs font-bold hover:bg-white transition-all cursor-pointer shadow-sm"
                        >
                          Đổi ảnh khác
                        </button>
                        <button
                          type="button"
                          onClick={() => setImageUrl('')}
                          className="p-1.5 rounded-lg bg-red-600 text-white hover:bg-red-700 transition-all cursor-pointer shadow-sm"
                          title="Xóa ảnh"
                        >
                          <X className="size-4" />
                        </button>
                      </div>
                    </div>

                    <div className="flex items-center justify-center gap-1.5 text-xs text-emerald-700 bg-emerald-50 py-1 px-2.5 rounded-md border border-emerald-200">
                      <Check className="size-3" />
                      <span>Đã tải lên Cloudinary</span>
                    </div>
                  </div>
                ) : (
                  <div
                    onClick={() => !uploadingImage && fileInputRef.current?.click()}
                    className={`aspect-video w-full rounded-lg border-2 border-dashed transition-all cursor-pointer flex flex-col items-center justify-center p-4 text-center ${
                      uploadingImage
                        ? 'border-primary-400 bg-primary-50/50 cursor-wait'
                        : imageError
                        ? 'border-red-400 bg-red-50'
                        : 'border-line bg-gray-50 hover:border-primary-400 hover:bg-primary-50/30'
                    }`}
                  >
                    {uploadingImage ? (
                      <div className="flex flex-col items-center gap-2">
                        <div className="size-7 border-3 border-primary-200 border-t-primary-600 rounded-full animate-spin" />
                        <p className="text-xs font-semibold text-primary-700">Đang tải lên Cloudinary...</p>
                      </div>
                    ) : (
                      <>
                        <div className="size-10 rounded-full bg-primary-100 flex items-center justify-center mb-1.5">
                          <Upload className="size-5 text-primary-600" />
                        </div>
                        <p className="text-xs font-bold text-ink">Bấm để tải ảnh từ máy</p>
                        <p className="text-[11px] text-ink-muted mt-0.5">JPG, PNG, WEBP (tối đa 10MB)</p>
                      </>
                    )}
                  </div>
                )}
                {imageError && <p className="text-xs text-red-500 text-center">{imageError}</p>}
              </div>
            ) : (
              <>
                <Input
                  label="Đường dẫn ảnh (URL)"
                  name="imageUrl"
                  value={imageUrl}
                  onChange={(e) => {
                    setImageUrl(e.target.value);
                    setPreviewLoadError(false);
                    if (imageError) setImageError(null);
                  }}
                  placeholder="https://images.unsplash.com/..."
                  required
                  error={imageError}
                  helperText="Dán link ảnh từ CDN, Unsplash hoặc cloud storage"
                />

                {/* Preview Box */}
                <div className="space-y-1.5">
                  <span className="text-xs font-medium text-ink-muted">Xem trước ảnh:</span>
                  <div className="aspect-video w-full rounded-lg border-2 border-dashed border-line bg-gray-50 overflow-hidden flex items-center justify-center p-2 relative">
                    {imageUrl && !previewLoadError ? (
                      <img
                        src={imageUrl}
                        alt="Xem trước ảnh thêm mới"
                        className="w-full h-full object-contain rounded"
                        onError={() => setPreviewLoadError(true)}
                      />
                    ) : (
                      <div className="text-center p-3 text-ink-subtle">
                        <ImageIcon className="size-8 mx-auto mb-1 opacity-50" />
                        <p className="text-xs">
                          {previewLoadError ? 'Không thể nạp ảnh từ URL này' : 'Dán đường dẫn ảnh để xem trước'}
                        </p>
                      </div>
                    )}
                  </div>
                </div>
              </>
            )}

            {/* Gắn với biến thể */}
            <Select
              label="Gắn với biến thể màu (Tùy chọn)"
              name="variantId"
              value={selectedVariantId}
              onChange={(e) => setSelectedVariantId(e.target.value)}
              options={variants.map((v) => ({
                value: String(v.id),
                label: `${v.color} - Size ${v.size} (${v.sku})`,
              }))}
              placeholder="-- Ảnh chung (Không gắn riêng biến thể) --"
              helperText="Khi khách bấm chọn màu này, shop sẽ tự nhảy sang ảnh tương ứng"
            />

            {/* Checkbox Đặt làm ảnh đại diện */}
            <div className="pt-1">
              <label className="flex items-center gap-2.5 cursor-pointer text-sm text-ink select-none">
                <input
                  type="checkbox"
                  checked={isPrimary}
                  onChange={(e) => setIsPrimary(e.target.checked)}
                  className="size-4 rounded border-line text-primary-700 focus:ring-primary-500 cursor-pointer"
                />
                <span className="font-medium">Đặt làm ảnh đại diện chính của sản phẩm</span>
              </label>
            </div>

            <Button
              type="submit"
              variant="primary"
              className="w-full"
              leftIcon={Plus}
              loading={addingImage}
            >
              {addingImage ? 'Đang thêm ảnh…' : 'Thêm vào thư viện'}
            </Button>
          </form>
        </div>

        {/* Danh sách ảnh Gallery (7 cols on lg) */}
        <div className="lg:col-span-7 rounded-xl border border-line bg-white p-5 shadow-soft space-y-4">
          <div className="flex items-center justify-between border-b border-line pb-3">
            <h3 className="text-base font-semibold text-ink">
              Tất cả hình ảnh ({images.length})
            </h3>
            <span className="text-xs text-ink-muted">
              {images.filter((img) => img.isPrimary).length > 0 ? 'Đã có ảnh chính' : 'Chưa chọn ảnh chính'}
            </span>
          </div>

          {images.length === 0 ? (
            <div className="py-12 text-center text-ink-muted">
              <ImageIcon className="size-10 mx-auto mb-2 text-ink-subtle opacity-50" />
              <p className="text-sm font-semibold text-ink">Chưa có ảnh nào trong thư viện</p>
              <p className="text-xs mt-0.5">Dán đường dẫn ảnh ở khung bên trái để bổ sung hình ảnh cho sản phẩm.</p>
            </div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3.5">
              {images.map((img) => {
                const isCurrentPrimary = Boolean(img.isPrimary);
                const linkedVariant = img.variantId ? variantMap.get(img.variantId) : null;

                return (
                  <div
                    key={img.id}
                    className={`group relative rounded-xl border overflow-hidden bg-gray-50 flex flex-col transition-all ${
                      isCurrentPrimary
                        ? 'border-primary-500 ring-2 ring-primary-200 shadow-sm'
                        : 'border-line hover:border-gray-400'
                    }`}
                  >
                    {/* Image Thumbnail */}
                    <div className="aspect-square w-full overflow-hidden bg-white relative">
                      <img
                        src={img.imageUrl}
                        alt="Hình ảnh sản phẩm"
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-200"
                        onError={(e) => {
                          e.target.src = 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=200';
                        }}
                      />

                      {/* Primary Badge */}
                      {isCurrentPrimary && (
                        <div className="absolute top-2 left-2 z-10 inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-bold bg-amber-500 text-white shadow-xs">
                          <Star className="size-3 fill-current" />
                          <span>Ảnh chính</span>
                        </div>
                      )}

                      {/* Actions hover overlay */}
                      <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2 p-2">
                        {!isCurrentPrimary && (
                          <button
                            type="button"
                            onClick={() => handleSetPrimary(img)}
                            disabled={settingPrimaryId === img.id}
                            className="p-2 rounded-lg bg-white/90 text-amber-600 hover:bg-white hover:scale-110 transition-all cursor-pointer shadow-md"
                            title="Đặt làm ảnh chính"
                            aria-label="Đặt làm ảnh chính"
                          >
                            <Star className="size-4" />
                          </button>
                        )}
                        <button
                          type="button"
                          onClick={() => setDeleteTarget(img)}
                          className="p-2 rounded-lg bg-white/90 text-red-600 hover:bg-white hover:scale-110 transition-all cursor-pointer shadow-md"
                          title="Xóa ảnh"
                          aria-label="Xóa ảnh"
                        >
                          <Trash2 className="size-4" />
                        </button>
                      </div>
                    </div>

                    {/* Card Meta Footer */}
                    <div className="p-2.5 bg-white border-t border-line text-xs flex flex-col gap-1">
                      {linkedVariant ? (
                        <div className="inline-flex items-center gap-1 text-primary-700 font-semibold truncate">
                          <Tag className="size-3 shrink-0" />
                          <span className="truncate">{linkedVariant.color} ({linkedVariant.size})</span>
                        </div>
                      ) : (
                        <span className="text-ink-subtle">Ảnh chung</span>
                      )}

                      {!isCurrentPrimary ? (
                        <button
                          type="button"
                          onClick={() => handleSetPrimary(img)}
                          disabled={settingPrimaryId === img.id}
                          className="text-[11px] text-ink-muted hover:text-amber-600 font-medium text-left cursor-pointer flex items-center gap-1"
                        >
                          <Star className="size-3" />
                          <span>Đặt làm ảnh chính</span>
                        </button>
                      ) : (
                        <span className="text-[11px] text-amber-600 font-semibold flex items-center gap-1">
                          <Check className="size-3" />
                          Đang là ảnh đại diện
                        </span>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* Confirm Delete Image Dialog */}
      <ConfirmDialog
        isOpen={Boolean(deleteTarget)}
        onClose={() => !isDeleting && setDeleteTarget(null)}
        onConfirm={handleDeleteImage}
        title="Xóa ảnh này?"
        description="Bạn có chắc chắn muốn xóa hình ảnh này khỏi thư viện sản phẩm?"
        confirmText="Xóa ảnh"
        cancelText="Hủy"
        variant="danger"
        loading={isDeleting}
      />
    </div>
  );
}

