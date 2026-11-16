import { useState } from 'react';
import { X, Ticket } from 'lucide-react';
import Button from '../ui/Button';

const toLocalISO = (d) => {
  const offset = d.getTimezoneOffset() * 60000;
  return new Date(d.getTime() - offset).toISOString().substring(0, 16);
};

const getInitialFormData = (voucher) => {
  if (voucher) {
    return {
      code: voucher.code || '',
      name: voucher.name || '',
      description: voucher.description || '',
      discountType: voucher.discountType || 'PERCENTAGE',
      discountValue: voucher.discountValue ?? '',
      maxDiscountAmount: voucher.maxDiscountAmount ?? '',
      minOrderValue: voucher.minOrderValue ?? '0',
      usageLimit: voucher.usageLimit ?? '',
      perUserLimit: voucher.perUserLimit ?? '1',
      startDate: voucher.startDate ? voucher.startDate.substring(0, 16) : '',
      endDate: voucher.endDate ? voucher.endDate.substring(0, 16) : '',
      isActive: voucher.isActive ?? true,
    };
  }
  const now = new Date();
  const nextMonth = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);
  return {
    code: '',
    name: '',
    description: '',
    discountType: 'PERCENTAGE',
    discountValue: '10',
    maxDiscountAmount: '50000',
    minOrderValue: '200000',
    usageLimit: '100',
    perUserLimit: '1',
    startDate: toLocalISO(now),
    endDate: toLocalISO(nextMonth),
    isActive: true,
  };
};

export default function VoucherModal({ isOpen, onClose, onSave, voucher, saving }) {
  const [formData, setFormData] = useState(() => getInitialFormData(voucher));
  const [errors, setErrors] = useState({});

  if (!isOpen) return null;

  const validate = () => {
    const errs = {};
    if (!voucher && !formData.code.trim()) {
      errs.code = 'Mã code không được để trống';
    } else if (!voucher && !/^[A-Za-z0-9_-]+$/.test(formData.code.trim())) {
      errs.code = 'Mã code chỉ được chứa chữ, số, gạch ngang/dưới';
    }

    if (!formData.name.trim()) {
      errs.name = 'Tên voucher không được để trống';
    }

    const val = parseFloat(formData.discountValue);
    if (isNaN(val) || val <= 0) {
      errs.discountValue = 'Giá trị giảm phải lớn hơn 0';
    } else if (formData.discountType === 'PERCENTAGE' && val > 100) {
      errs.discountValue = 'Tỷ lệ % không được vượt quá 100%';
    }

    if (!formData.startDate) {
      errs.startDate = 'Ngày bắt đầu không được để trống';
    }
    if (!formData.endDate) {
      errs.endDate = 'Ngày kết thúc không được để trống';
    }
    if (formData.startDate && formData.endDate && new Date(formData.endDate) <= new Date(formData.startDate)) {
      errs.endDate = 'Ngày kết thúc phải diễn ra sau ngày bắt đầu';
    }

    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!validate()) return;

    const payload = {
      name: formData.name.trim(),
      description: formData.description.trim(),
      discountType: formData.discountType,
      discountValue: parseFloat(formData.discountValue),
      maxDiscountAmount: formData.maxDiscountAmount ? parseFloat(formData.maxDiscountAmount) : null,
      minOrderValue: formData.minOrderValue ? parseFloat(formData.minOrderValue) : 0,
      usageLimit: formData.usageLimit ? parseInt(formData.usageLimit, 10) : null,
      perUserLimit: formData.perUserLimit ? parseInt(formData.perUserLimit, 10) : 1,
      startDate: formData.startDate.length === 16 ? formData.startDate + ':00' : formData.startDate,
      endDate: formData.endDate.length === 16 ? formData.endDate + ':00' : formData.endDate,
      isActive: formData.isActive,
    };

    if (!voucher) {
      payload.code = formData.code.trim().toUpperCase();
    }

    onSave(payload);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in overflow-y-auto">
      <div className="relative w-full max-w-2xl bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-800 my-8">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-5 border-b border-slate-200 dark:border-slate-800">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-primary-50 dark:bg-primary-950/60 text-primary-600 dark:text-primary-400">
              <Ticket className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-slate-900 dark:text-white">
                {voucher ? 'Chỉnh sửa Voucher' : 'Tạo Mã Giảm Giá Mới'}
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                {voucher ? `Mã code: ${voucher.code}` : 'Thiết lập điều kiện áp dụng mã khuyến mãi'}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4 max-h-[75vh] overflow-y-auto">
          {/* Row 1: Code & Name */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Mã Voucher <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                disabled={!!voucher}
                value={formData.code}
                onChange={(e) => setFormData({ ...formData, code: e.target.value.toUpperCase() })}
                placeholder="VD: SUMMER50, SALE10"
                className={`w-full px-3.5 py-2 text-sm rounded-xl font-mono uppercase font-bold border transition focus:outline-none focus:ring-2 ${
                  errors.code
                    ? 'border-rose-500 ring-rose-200'
                    : 'border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:ring-primary-500/20 focus:border-primary-500'
                } ${voucher ? 'opacity-60 cursor-not-allowed bg-slate-100 dark:bg-slate-800/50' : ''}`}
              />
              {errors.code && <p className="mt-1 text-xs text-rose-500">{errors.code}</p>}
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Tên chương trình <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="VD: Giảm giá mùa hè cho đơn 200k"
                className={`w-full px-3.5 py-2 text-sm rounded-xl border transition focus:outline-none focus:ring-2 ${
                  errors.name
                    ? 'border-rose-500 ring-rose-200'
                    : 'border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:ring-primary-500/20 focus:border-primary-500'
                }`}
              />
              {errors.name && <p className="mt-1 text-xs text-rose-500">{errors.name}</p>}
            </div>
          </div>

          {/* Description */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
              Mô tả chi tiết
            </label>
            <textarea
              rows={2}
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              placeholder="Ghi chú điều kiện hoặc thông tin hiển thị cho khách..."
              className="w-full px-3.5 py-2 text-sm rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:ring-primary-500/20 focus:border-primary-500"
            />
          </div>

          {/* Row 2: Discount Type & Discount Value */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 p-4 rounded-xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200/60 dark:border-slate-700/60">
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Loại giảm giá <span className="text-rose-500">*</span>
              </label>
              <select
                value={formData.discountType}
                onChange={(e) => setFormData({ ...formData, discountType: e.target.value })}
                className="w-full px-3.5 py-2 text-sm rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:ring-primary-500/20 focus:border-primary-500 font-medium"
              >
                <option value="PERCENTAGE">Theo Phần trăm (%)</option>
                <option value="FIXED_AMOUNT">Số tiền cố định (VNĐ)</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Mức giảm {formData.discountType === 'PERCENTAGE' ? '(%)' : '(VNĐ)'} <span className="text-rose-500">*</span>
              </label>
              <input
                type="number"
                min="0"
                step="any"
                value={formData.discountValue}
                onChange={(e) => setFormData({ ...formData, discountValue: e.target.value })}
                placeholder={formData.discountType === 'PERCENTAGE' ? '10' : '50000'}
                className={`w-full px-3.5 py-2 text-sm rounded-xl border transition focus:outline-none focus:ring-2 ${
                  errors.discountValue
                    ? 'border-rose-500 ring-rose-200'
                    : 'border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:ring-primary-500/20 focus:border-primary-500'
                }`}
              />
              {errors.discountValue && <p className="mt-1 text-xs text-rose-500">{errors.discountValue}</p>}
            </div>

            {formData.discountType === 'PERCENTAGE' && (
              <div className="sm:col-span-2">
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Mức giảm tối đa (VNĐ) <span className="text-slate-400 font-normal">(bỏ trống nếu không giới hạn)</span>
                </label>
                <input
                  type="number"
                  min="0"
                  step="1000"
                  value={formData.maxDiscountAmount}
                  onChange={(e) => setFormData({ ...formData, maxDiscountAmount: e.target.value })}
                  placeholder="VD: 50000 (Chặn trần 50k)"
                  className="w-full px-3.5 py-2 text-sm rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:ring-primary-500/20 focus:border-primary-500"
                />
              </div>
            )}
          </div>

          {/* Row 3: Min Order Value & Limits */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Đơn tối thiểu (VNĐ)
              </label>
              <input
                type="number"
                min="0"
                step="1000"
                value={formData.minOrderValue}
                onChange={(e) => setFormData({ ...formData, minOrderValue: e.target.value })}
                placeholder="0"
                className="w-full px-3.5 py-2 text-sm rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:ring-primary-500/20 focus:border-primary-500"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Tổng lượt dùng <span className="text-slate-400 font-normal">(trống = vô hạn)</span>
              </label>
              <input
                type="number"
                min="1"
                value={formData.usageLimit}
                onChange={(e) => setFormData({ ...formData, usageLimit: e.target.value })}
                placeholder="VD: 100"
                className="w-full px-3.5 py-2 text-sm rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:ring-primary-500/20 focus:border-primary-500"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Lượt dùng/khách
              </label>
              <input
                type="number"
                min="1"
                value={formData.perUserLimit}
                onChange={(e) => setFormData({ ...formData, perUserLimit: e.target.value })}
                placeholder="1"
                className="w-full px-3.5 py-2 text-sm rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:ring-primary-500/20 focus:border-primary-500"
              />
            </div>
          </div>

          {/* Row 4: Dates */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Thời gian bắt đầu <span className="text-rose-500">*</span>
              </label>
              <input
                type="datetime-local"
                value={formData.startDate}
                onChange={(e) => setFormData({ ...formData, startDate: e.target.value })}
                className={`w-full px-3.5 py-2 text-sm rounded-xl border transition focus:outline-none focus:ring-2 ${
                  errors.startDate
                    ? 'border-rose-500 ring-rose-200'
                    : 'border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:ring-primary-500/20 focus:border-primary-500'
                }`}
              />
              {errors.startDate && <p className="mt-1 text-xs text-rose-500">{errors.startDate}</p>}
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Thời gian kết thúc <span className="text-rose-500">*</span>
              </label>
              <input
                type="datetime-local"
                value={formData.endDate}
                onChange={(e) => setFormData({ ...formData, endDate: e.target.value })}
                className={`w-full px-3.5 py-2 text-sm rounded-xl border transition focus:outline-none focus:ring-2 ${
                  errors.endDate
                    ? 'border-rose-500 ring-rose-200'
                    : 'border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:ring-primary-500/20 focus:border-primary-500'
                }`}
              />
              {errors.endDate && <p className="mt-1 text-xs text-rose-500">{errors.endDate}</p>}
            </div>
          </div>

          {/* Toggle Active */}
          <div className="flex items-center justify-between p-3.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/30">
            <div>
              <p className="text-sm font-semibold text-slate-900 dark:text-white">Kích hoạt voucher</p>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Khi tắt, khách hàng không thể tìm kiếm hoặc áp dụng mã này
              </p>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={formData.isActive}
                onChange={(e) => setFormData({ ...formData, isActive: e.target.checked })}
                className="sr-only peer"
              />
              <div className="w-11 h-6 bg-slate-300 peer-focus:outline-none rounded-full peer dark:bg-slate-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:start-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary-600"></div>
            </label>
          </div>

          {/* Footer Actions */}
          <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-200 dark:border-slate-800">
            <Button type="button" variant="outline" onClick={onClose} disabled={saving}>
              Hủy bỏ
            </Button>
            <Button type="submit" variant="primary" loading={saving} disabled={saving}>
              {voucher ? 'Lưu thay đổi' : 'Tạo voucher'}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
