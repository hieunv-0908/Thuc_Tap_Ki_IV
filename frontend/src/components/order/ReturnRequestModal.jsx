import { useState } from 'react';
import { X, RotateCcw, AlertCircle, Building2, CreditCard, User, Image, FileText } from 'lucide-react';
import Button from '../ui/Button';
import { formatCurrency } from '../../utils/formatCurrency';

const REASON_OPTIONS = [
  'Sản phẩm bị lỗi kỹ thuật / bung chỉ / rách',
  'Giao sai mẫu mã, màu sắc hoặc kích thước',
  'Sản phẩm không giống mô tả / hình ảnh',
  'Kích thước không vừa (rộng / chật)',
  'Hàng bị hư hỏng trong quá trình vận chuyển',
  'Khác (ghi rõ trong phần mô tả)',
];

export default function ReturnRequestModal({
  isOpen,
  onClose,
  onSubmit,
  order,
  loading = false,
}) {
  const [reason, setReason] = useState(REASON_OPTIONS[0]);
  const [description, setDescription] = useState('');
  const [bankName, setBankName] = useState('');
  const [bankAccountNumber, setBankAccountNumber] = useState('');
  const [bankAccountName, setBankAccountName] = useState('');
  const [evidenceUrl, setEvidenceUrl] = useState('');
  const [evidenceList, setEvidenceList] = useState([]);
  const [error, setError] = useState(null);

  if (!isOpen || !order) return null;

  const handleAddImage = () => {
    const url = evidenceUrl.trim();
    if (!url) return;
    if (evidenceList.length >= 4) {
      setError('Tối đa 4 liên kết hình ảnh bằng chứng.');
      return;
    }
    setEvidenceList([...evidenceList, url]);
    setEvidenceUrl('');
    setError(null);
  };

  const handleRemoveImage = (index) => {
    setEvidenceList(evidenceList.filter((_, i) => i !== index));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    setError(null);

    if (!reason) {
      setError('Vui lòng chọn lý do trả hàng.');
      return;
    }

    if (!description.trim()) {
      setError('Vui lòng nhập mô tả chi tiết tình trạng hàng cần trả.');
      return;
    }

    if (!bankName.trim() || !bankAccountNumber.trim() || !bankAccountName.trim()) {
      setError('Vui lòng cung cấp đầy đủ thông tin tài khoản ngân hàng để nhận tiền hoàn.');
      return;
    }

    const payload = {
      reason,
      description: description.trim(),
      bankName: bankName.trim(),
      bankAccountNumber: bankAccountNumber.trim(),
      bankAccountName: bankAccountName.trim().toUpperCase(),
      evidenceImages: evidenceList,
    };

    onSubmit(payload);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="relative w-full max-w-lg bg-white rounded-2xl shadow-2xl border border-line overflow-hidden max-h-[90vh] flex flex-col animate-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="px-6 py-4.5 border-b border-line flex items-center justify-between bg-page/50">
          <div className="flex items-center gap-3">
            <div className="size-10 rounded-xl bg-orange-100 text-orange-700 flex items-center justify-center">
              <RotateCcw className="size-5" />
            </div>
            <div>
              <h3 className="font-bold text-lg text-ink">Yêu cầu trả hàng & hoàn tiền</h3>
              <p className="text-xs text-ink-muted">Đơn hàng #{order.id} • Hoàn dự kiến: {formatCurrency(order.totalAmount)}</p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            disabled={loading}
            className="p-1.5 rounded-lg text-ink-subtle hover:text-ink hover:bg-gray-100 transition"
          >
            <X className="size-5" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-6 space-y-4 text-sm text-ink">
          {error && (
            <div className="p-3 rounded-xl bg-red-50 border border-red-200 text-red-700 text-xs flex items-start gap-2">
              <AlertCircle className="size-4 shrink-0 mt-0.5" />
              <span>{error}</span>
            </div>
          )}

          {/* Policy Notice */}
          <div className="p-3.5 rounded-xl bg-orange-50/80 border border-orange-200 text-xs text-orange-900 space-y-1">
            <p className="font-semibold flex items-center gap-1.5">
              <AlertCircle className="size-3.5 text-orange-600" />
              Chính sách đổi trả FunnyShop:
            </p>
            <p className="text-orange-800 leading-relaxed">
              Áp dụng trong vòng 7 ngày kể từ khi nhận hàng. Hàng trả cần còn nguyên tem mác, chưa qua giặt ủi và kèm hình ảnh bằng chứng rõ ràng.
            </p>
          </div>

          {/* Reason */}
          <div>
            <label className="block text-xs font-semibold text-ink mb-1.5">
              Lý do trả hàng <span className="text-red-500">*</span>
            </label>
            <select
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-xl border border-line bg-white text-ink focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-600 text-sm"
            >
              {REASON_OPTIONS.map((opt) => (
                <option key={opt} value={opt}>
                  {opt}
                </option>
              ))}
            </select>
          </div>

          {/* Description */}
          <div>
            <label className="block text-xs font-semibold text-ink mb-1.5 flex items-center gap-1">
              <FileText className="size-3.5 text-ink-muted" />
              Mô tả chi tiết vấn đề <span className="text-red-500">*</span>
            </label>
            <textarea
              rows={3}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="VD: Áo size L nhưng bị chật nách, sản phẩm bị sứt chỉ ở tay trái..."
              className="w-full px-3.5 py-2.5 rounded-xl border border-line bg-white text-ink placeholder:text-ink-subtle focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-600 text-sm"
            />
          </div>

          {/* Bank Info */}
          <div className="p-4 rounded-xl bg-gray-50 border border-line space-y-3">
            <h4 className="font-semibold text-xs text-ink uppercase tracking-wider flex items-center gap-1.5">
              <CreditCard className="size-4 text-primary-700" />
              Tài khoản nhận tiền hoàn <span className="text-red-500">*</span>
            </h4>

            <div>
              <label className="block text-xs text-ink-muted mb-1 flex items-center gap-1">
                <Building2 className="size-3 text-ink-subtle" />
                Ngân hàng (VD: Vietcombank, Techcombank, MB Bank, VPBank...)
              </label>
              <input
                type="text"
                value={bankName}
                onChange={(e) => setBankName(e.target.value)}
                placeholder="VD: MB Bank"
                className="w-full px-3 py-2 rounded-lg border border-line bg-white text-ink text-sm focus:outline-none focus:border-primary-600"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs text-ink-muted mb-1 flex items-center gap-1">
                  <CreditCard className="size-3 text-ink-subtle" />
                  Số tài khoản
                </label>
                <input
                  type="text"
                  value={bankAccountNumber}
                  onChange={(e) => setBankAccountNumber(e.target.value)}
                  placeholder="VD: 0345678901"
                  className="w-full px-3 py-2 rounded-lg border border-line bg-white text-ink text-sm font-mono focus:outline-none focus:border-primary-600"
                />
              </div>

              <div>
                <label className="block text-xs text-ink-muted mb-1 flex items-center gap-1">
                  <User className="size-3 text-ink-subtle" />
                  Tên chủ tài khoản
                </label>
                <input
                  type="text"
                  value={bankAccountName}
                  onChange={(e) => setBankAccountName(e.target.value.toUpperCase())}
                  placeholder="VD: NGUYEN VAN A"
                  className="w-full px-3 py-2 rounded-lg border border-line bg-white text-ink text-sm uppercase focus:outline-none focus:border-primary-600"
                />
              </div>
            </div>
          </div>

          {/* Evidence Image Links */}
          <div>
            <label className="block text-xs font-semibold text-ink mb-1.5 flex items-center gap-1">
              <Image className="size-3.5 text-ink-muted" />
              Hình ảnh bằng chứng sản phẩm lỗi (tối đa 4 ảnh)
            </label>
            <div className="flex gap-2">
              <input
                type="url"
                value={evidenceUrl}
                onChange={(e) => setEvidenceUrl(e.target.value)}
                placeholder="Dán link ảnh (https://...)"
                className="flex-1 px-3 py-2 rounded-xl border border-line bg-white text-sm focus:outline-none focus:border-primary-600"
              />
              <Button type="button" variant="outline" size="sm" onClick={handleAddImage}>
                Thêm ảnh
              </Button>
            </div>

            {evidenceList.length > 0 && (
              <div className="flex flex-wrap gap-2 mt-2.5">
                {evidenceList.map((url, idx) => (
                  <div key={idx} className="relative group size-16 rounded-lg border border-line overflow-hidden bg-gray-50">
                    <img src={url} alt={`Bằng chứng ${idx + 1}`} className="size-full object-cover" />
                    <button
                      type="button"
                      onClick={() => handleRemoveImage(idx)}
                      className="absolute inset-0 bg-black/50 text-white flex items-center justify-center opacity-0 group-hover:opacity-100 transition cursor-pointer"
                    >
                      <X className="size-4" />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Footer Actions */}
          <div className="pt-3 border-t border-line flex items-center justify-end gap-3">
            <Button type="button" variant="ghost" onClick={onClose} disabled={loading}>
              Hủy bỏ
            </Button>
            <Button type="submit" variant="primary" loading={loading} className="bg-orange-600 hover:bg-orange-700">
              Gửi yêu cầu trả hàng
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}

