import { useState } from 'react';
import { Sparkles, Bot, CheckCircle2 } from 'lucide-react';
import Modal from '../ui/Modal';
import Button from '../ui/Button';
import { aiApi } from '../../api/ai';
import { toast } from '../../store/toastStore';

export default function AiMockModal({ isOpen, onClose, onSuccess }) {
  const [selectedCount, setSelectedCount] = useState(5);
  const [loading, setLoading] = useState(false);

  const handleGenerate = async () => {
    try {
      setLoading(true);
      await aiApi.generateMockProducts(selectedCount);
      toast.success(`Đã tạo thành công ${selectedCount} sản phẩm mẫu bằng AI ✨`);
      if (onSuccess) {
        await onSuccess();
      }
      onClose();
    } catch (err) {
      console.error('Lỗi tạo sản phẩm mẫu:', err);
      toast.error(err.message || 'Không thể tạo sản phẩm mẫu. Vui lòng thử lại.');
    } finally {
      setLoading(false);
    }
  };

  const options = [
    { count: 5, label: '5 sản phẩm', desc: 'Tạo nhanh 5 mặt hàng mẫu đa dạng' },
    { count: 10, label: '10 sản phẩm', desc: 'Bộ sưu tập sản phẩm đủ các danh mục' },
    { count: 20, label: '20 sản phẩm', desc: 'Dữ liệu phong phú để test phân trang & lọc' },
  ];

  return (
    <Modal
      isOpen={isOpen}
      onClose={() => !loading && onClose()}
      title="✨ Tạo dữ liệu sản phẩm mẫu bằng AI"
      maxWidth="max-w-md"
    >
      <div className="space-y-4">
        {/* Banner */}
        <div className="p-3.5 rounded-xl bg-gradient-to-r from-secondary-50 to-secondary-100 border border-secondary-200 flex items-start gap-3">
          <div className="size-9 rounded-lg bg-secondary-500 text-white flex items-center justify-center shrink-0">
            <Bot className="size-5" />
          </div>
          <div className="text-sm">
            <p className="font-semibold text-secondary-900">Funny AI Generator</p>
            <p className="text-secondary-700 text-xs mt-0.5">
              Trợ lý AI sẽ tự động sinh tên, mô tả độc đáo, hình ảnh và danh mục phù hợp cho sản phẩm.
            </p>
          </div>
        </div>

        {/* Count Selector */}
        <div>
          <label className="text-sm font-medium text-ink block mb-2">
            Chọn số lượng sản phẩm cần tạo:
          </label>
          <div className="space-y-2">
            {options.map((opt) => {
              const isSelected = selectedCount === opt.count;
              return (
                <button
                  key={opt.count}
                  type="button"
                  disabled={loading}
                  onClick={() => setSelectedCount(opt.count)}
                  className={`w-full p-3 rounded-xl border text-left flex items-center justify-between transition-all cursor-pointer ${
                    isSelected
                      ? 'border-secondary-500 bg-secondary-50/60 ring-2 ring-secondary-200 shadow-xs'
                      : 'border-line bg-white hover:bg-gray-50'
                  }`}
                >
                  <div>
                    <p className={`text-sm font-semibold ${isSelected ? 'text-secondary-900' : 'text-ink'}`}>
                      {opt.label}
                    </p>
                    <p className="text-xs text-ink-muted mt-0.5">{opt.desc}</p>
                  </div>
                  {isSelected && (
                    <CheckCircle2 className="size-5 text-secondary-600 shrink-0" />
                  )}
                </button>
              );
            })}
          </div>
        </div>

        {/* Action Buttons */}
        <div className="pt-2 flex items-center justify-end gap-3 border-t border-line">
          <Button
            variant="outline"
            onClick={onClose}
            disabled={loading}
          >
            Hủy
          </Button>
          <Button
            variant="secondary"
            leftIcon={Sparkles}
            onClick={handleGenerate}
            loading={loading}
          >
            {loading ? 'Đang tạo bằng AI...' : `Tạo ${selectedCount} sản phẩm`}
          </Button>
        </div>
      </div>
    </Modal>
  );
}

