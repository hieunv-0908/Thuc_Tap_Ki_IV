import { useState } from 'react';
import { X, MapPin, Building, Home, Check } from 'lucide-react';
import Button from '../ui/Button';
import Input from '../ui/Input';
import { isValidPhone } from '../../utils/validators';

// Khởi tạo formData từ address prop — dùng hàm khởi tạo để tránh lint set-state-in-effect
const makeFormData = (address) =>
  address
    ? {
        recipientName: address.recipientName || '',
        phone: address.phone || '',
        province: address.province || '',
        district: address.district || '',
        ward: address.ward || '',
        detailAddress: address.detailAddress || '',
        addressType: address.addressType || 'HOME',
        isDefault: Boolean(address.isDefault),
      }
    : {
        recipientName: '',
        phone: '',
        province: '',
        district: '',
        ward: '',
        detailAddress: '',
        addressType: 'HOME',
        isDefault: false,
      };

export default function AddressModal({
  isOpen,
  onClose,
  onSubmit,
  address = null,
  isSubmitting = false,
}) {
  // key trick: đặt key={address?.id ?? 'new'} ở phía gọi để unmount/mount lại khi address thay đổi
  // Nhưng vì không control key ở đây, dùng useMemo để khởi tạo lại mỗi khi address/isOpen thay đổi
  const [formData, setFormData] = useState(() => makeFormData(address));
  const [errors, setErrors] = useState({});

  if (!isOpen) return null;

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value,
    }));
    if (errors[name]) {
      setErrors((prev) => ({ ...prev, [name]: '' }));
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    const newErrors = {};

    if (!formData.recipientName.trim()) {
      newErrors.recipientName = 'Vui lòng nhập họ và tên người nhận';
    }
    if (!formData.phone.trim()) {
      newErrors.phone = 'Vui lòng nhập số điện thoại';
    } else if (!isValidPhone(formData.phone.trim())) {
      newErrors.phone = 'Số điện thoại không hợp lệ (10 chữ số)';
    }
    if (!formData.province.trim()) {
      newErrors.province = 'Vui lòng nhập Tỉnh/Thành phố';
    }
    if (!formData.district.trim()) {
      newErrors.district = 'Vui lòng nhập Quận/Huyện';
    }
    if (!formData.ward.trim()) {
      newErrors.ward = 'Vui lòng nhập Phường/Xã';
    }
    if (!formData.detailAddress.trim()) {
      newErrors.detailAddress = 'Vui lòng nhập địa chỉ cụ thể (số nhà, ngõ, tên đường)';
    }

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    onSubmit({
      recipientName: formData.recipientName.trim(),
      phone: formData.phone.trim(),
      province: formData.province.trim(),
      district: formData.district.trim(),
      ward: formData.ward.trim(),
      detailAddress: formData.detailAddress.trim(),
      addressType: formData.addressType,
      isDefault: formData.isDefault,
    });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-ink/50 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="relative w-full max-w-lg bg-white rounded-3xl border border-line shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-line bg-gray-50/50">
          <div className="flex items-center gap-2.5">
            <div className="size-9 rounded-xl bg-primary-100 text-primary-700 flex items-center justify-center font-bold">
              <MapPin className="size-5" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-ink">
                {address ? 'Chỉnh sửa địa chỉ nhận hàng' : 'Thêm địa chỉ mới'}
              </h3>
              <p className="text-xs text-ink-muted">
                Địa chỉ này sẽ dùng để giao hàng nhanh chóng cho bạn
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            disabled={isSubmitting}
            className="p-1.5 text-ink-subtle hover:text-ink hover:bg-gray-100 rounded-lg transition-colors cursor-pointer"
          >
            <X className="size-5" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4 max-h-[calc(85vh-8rem)] overflow-y-auto">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Input
              label="Họ và tên người nhận"
              name="recipientName"
              value={formData.recipientName}
              onChange={handleChange}
              placeholder="Ví dụ: Nguyễn Văn An"
              error={errors.recipientName}
              required
              disabled={isSubmitting}
            />

            <Input
              label="Số điện thoại"
              name="phone"
              type="tel"
              value={formData.phone}
              onChange={handleChange}
              placeholder="Ví dụ: 0912345678"
              error={errors.phone}
              required
              disabled={isSubmitting}
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <Input
              label="Tỉnh / Thành phố"
              name="province"
              value={formData.province}
              onChange={handleChange}
              placeholder="Hà Nội"
              error={errors.province}
              required
              disabled={isSubmitting}
            />

            <Input
              label="Quận / Huyện"
              name="district"
              value={formData.district}
              onChange={handleChange}
              placeholder="Cầu Giấy"
              error={errors.district}
              required
              disabled={isSubmitting}
            />

            <Input
              label="Phường / Xã"
              name="ward"
              value={formData.ward}
              onChange={handleChange}
              placeholder="Dịch Vọng"
              error={errors.ward}
              required
              disabled={isSubmitting}
            />
          </div>

          <Input
            label="Địa chỉ cụ thể"
            name="detailAddress"
            value={formData.detailAddress}
            onChange={handleChange}
            placeholder="Số nhà, tên ngõ, tên đường, tòa nhà..."
            error={errors.detailAddress}
            required
            disabled={isSubmitting}
          />

          {/* Loại địa chỉ: Nhà riêng / Văn phòng */}
          <div className="space-y-1.5">
            <label className="block text-xs font-semibold text-ink-muted uppercase tracking-wider">
              Loại địa chỉ
            </label>
            <div className="grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => setFormData((p) => ({ ...p, addressType: 'HOME' }))}
                className={`flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl border text-sm font-semibold transition-all cursor-pointer ${
                  formData.addressType === 'HOME'
                    ? 'border-primary-500 bg-primary-50 text-primary-700 ring-2 ring-primary-200'
                    : 'border-line bg-white text-ink hover:bg-gray-50'
                }`}
              >
                <Home className="size-4" />
                <span>Nhà riêng</span>
              </button>

              <button
                type="button"
                onClick={() => setFormData((p) => ({ ...p, addressType: 'OFFICE' }))}
                className={`flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl border text-sm font-semibold transition-all cursor-pointer ${
                  formData.addressType === 'OFFICE'
                    ? 'border-secondary-500 bg-secondary-50 text-secondary-700 ring-2 ring-secondary-200'
                    : 'border-line bg-white text-ink hover:bg-gray-50'
                }`}
              >
                <Building className="size-4" />
                <span>Văn phòng / Công ty</span>
              </button>
            </div>
          </div>

          {/* Checkbox Đặt làm mặc định */}
          <div className="pt-2">
            <label className="flex items-center gap-2.5 cursor-pointer select-none">
              <input
                type="checkbox"
                name="isDefault"
                checked={formData.isDefault}
                onChange={handleChange}
                disabled={isSubmitting}
                className="size-4 rounded border-line text-primary-600 focus:ring-primary-500"
              />
              <span className="text-sm font-medium text-ink">
                Đặt làm địa chỉ giao hàng mặc định
              </span>
            </label>
          </div>

          {/* Footer Actions */}
          <div className="pt-4 flex items-center justify-end gap-3 border-t border-line">
            <Button
              type="button"
              variant="outline"
              size="md"
              onClick={onClose}
              disabled={isSubmitting}
            >
              Hủy
            </Button>
            <Button
              type="submit"
              variant="primary"
              size="md"
              loading={isSubmitting}
              leftIcon={Check}
              className="font-bold shadow-brand"
            >
              {address ? 'Lưu thay đổi' : 'Thêm địa chỉ'}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}

