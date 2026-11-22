import { useState } from 'react';
import { Truck, Phone, Copy, Check, ShieldCheck, Clock } from 'lucide-react';
import { toast } from '../../store/toastStore';
import { ORDER_STATUS } from '../../utils/constants';

export default function DeliveryTrackingCard({ order }) {
  const [copied, setCopied] = useState(false);

  if (!order) return null;

  // Ẩn khi đơn hàng đã bị hủy
  if (order.status === ORDER_STATUS.CANCELLED) return null;

  // Sinh mã vận đơn mô phỏng duy nhất theo order.id
  const trackingNumber = `VN-SPX${String(order.id * 19482 + 100000).padStart(9, '0')}`;
  const shipperName = order.id % 2 === 0 ? 'Nguyễn Văn Hùng' : 'Trần Quốc Bảo';
  const shipperPhone = order.id % 2 === 0 ? '0987 654 321' : '0912 888 999';
  const vehicle = order.id % 2 === 0 ? 'Honda Wave RSX - 29A1-888.88' : 'Yamaha Sirius - 30F2-666.99';

  const handleCopyTracking = () => {
    if (navigator.clipboard) {
      navigator.clipboard.writeText(trackingNumber);
      setCopied(true);
      toast.success('Đã sao chép mã vận đơn!');
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const isPending = order.status === ORDER_STATUS.PENDING;
  const isShipping = order.status === ORDER_STATUS.SHIPPING;
  const isCompleted = order.status === ORDER_STATUS.COMPLETED;
  const isProcessing = order.status === ORDER_STATUS.PROCESSING;

  return (
    <div className="bg-white rounded-2xl border border-line p-5 sm:p-6 shadow-soft space-y-5 animate-in fade-in duration-200">
      {/* Header vận chuyển */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-line pb-4">
        <div className="flex items-center gap-3">
          <div className="size-10 rounded-xl bg-orange-100 text-orange-600 flex items-center justify-center shrink-0">
            <Truck className="size-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-extrabold text-orange-600 tracking-wide text-sm sm:text-base">
                SPX Express
              </span>
              <span className="text-xs bg-orange-50 text-orange-700 px-2 py-0.5 rounded-full font-semibold border border-orange-200">
                Giao Hàng Tiêu Chuẩn
              </span>
            </div>
            <p className="text-xs text-ink-muted mt-0.5">
              Đơn vị vận chuyển đối tác chính thức của FunnyShop
            </p>
          </div>
        </div>

        {/* Mã vận đơn */}
        <div className="flex items-center gap-2 bg-gray-50 border border-line px-3 py-1.5 rounded-xl self-start sm:self-auto">
          <span className="text-xs text-ink-muted">Mã vận đơn:</span>
          <span className="text-xs font-mono font-bold text-ink">{trackingNumber}</span>
          <button
            type="button"
            onClick={handleCopyTracking}
            className="p-1 text-ink-subtle hover:text-primary-700 transition-colors cursor-pointer"
            title="Sao chép mã vận đơn"
          >
            {copied ? (
              <Check className="size-3.5 text-emerald-600 stroke-[3]" />
            ) : (
              <Copy className="size-3.5" />
            )}
          </button>
        </div>
      </div>

      {/* Thông tin Shipper (Hiện khi Đang giao hàng hoặc Đã giao thành công) */}
      {(isShipping || isCompleted) && (
        <div className="p-4 rounded-xl bg-primary-50/40 border border-primary-100 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="size-11 rounded-full bg-primary-600 text-white font-bold flex items-center justify-center text-sm shadow-sm shrink-0">
              {shipperName.charAt(0)}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-bold text-ink text-sm sm:text-base">{shipperName}</span>
                <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full">
                  <ShieldCheck className="size-3" />
                  Đã xác minh
                </span>
              </div>
              <p className="text-xs text-ink-muted mt-0.5">
                Phương tiện: <strong className="text-ink">{vehicle}</strong>
              </p>
            </div>
          </div>

          <a
            href={`tel:${shipperPhone.replace(/\s+/g, '')}`}
            className="inline-flex items-center justify-center gap-2 px-4 py-2 rounded-xl bg-white border border-primary-300 text-primary-700 hover:bg-primary-50 text-xs font-bold transition-all shadow-xs shrink-0"
          >
            <Phone className="size-3.5 text-primary-600" />
            <span>Gọi tài xế ({shipperPhone})</span>
          </a>
        </div>
      )}

      {/* Nhật ký hành trình vận chuyển chi tiết (Timeline Mini) */}
      <div className="space-y-3">
        <h4 className="text-xs font-bold uppercase tracking-wider text-ink-muted flex items-center gap-1.5">
          <Clock className="size-3.5" />
          <span>Hành trình bưu kiện</span>
        </h4>

        <div className="relative pl-6 space-y-4 border-l-2 border-line ml-3">
          {/* Trạng thái hiện tại */}
          {isCompleted && (
            <div className="relative">
              <div className="absolute -left-[31px] top-0.5 size-4 rounded-full bg-green-500 ring-4 ring-green-100" />
              <p className="text-xs sm:text-sm font-bold text-green-700">
                Giao hàng thành công!
              </p>
              <p className="text-xs text-ink-muted mt-0.5 leading-relaxed">
                Người nhận đã ký nhận kiện hàng nguyên vẹn. Cảm ơn bạn đã mua hàng tại FunnyShop!
              </p>
            </div>
          )}

          {isShipping && (
            <div className="relative">
              <div className="absolute -left-[31px] top-0.5 size-4 rounded-full bg-orange-500 ring-4 ring-orange-100 animate-pulse" />
              <p className="text-xs sm:text-sm font-bold text-orange-600">
                Đang trên đường giao hàng đến bạn
              </p>
              <p className="text-xs text-ink-muted mt-0.5 leading-relaxed">
                Tài xế <strong className="text-ink">{shipperName}</strong> đang vận chuyển kiện hàng đến: <strong className="text-ink">{order.address}</strong>. Vui lòng để ý chuông điện thoại.
              </p>
            </div>
          )}

          {isProcessing && (
            <div className="relative">
              <div className="absolute -left-[31px] top-0.5 size-4 rounded-full bg-primary-600 ring-4 ring-primary-100" />
              <p className="text-xs sm:text-sm font-bold text-primary-700">
                Đang chuẩn bị kiện hàng tại kho
              </p>
              <p className="text-xs text-ink-muted mt-0.5 leading-relaxed">
                Nhân viên kho FunnyShop đang kiểm đếm, bọc chống sốc và bàn giao cho đơn vị SPX Express.
              </p>
            </div>
          )}

          {isPending && (
            <div className="relative">
              <div className="absolute -left-[31px] top-0.5 size-4 rounded-full bg-amber-500 ring-4 ring-amber-100 animate-pulse" />
              <p className="text-xs sm:text-sm font-bold text-amber-700">
                Đang chờ xác nhận & chuẩn bị đóng gói
              </p>
              <p className="text-xs text-ink-muted mt-0.5 leading-relaxed">
                Hệ thống FunnyShop đã tiếp nhận đơn hàng #{order.id} và gửi yêu cầu lấy hàng tới SPX Express.
              </p>
            </div>
          )}

          {/* Các mốc theo tiến trình */}
          {!isPending && (
            <div className="relative">
              <div className="absolute -left-[31px] top-0.5 size-4 rounded-full bg-gray-300" />
              <p className="text-xs font-semibold text-ink">
                Kiện hàng rời Kho tổng FunnyShop (Hà Nội)
              </p>
              <p className="text-[11px] text-ink-subtle mt-0.5">
                Đã phân loại và điều phối qua bưu cục trung chuyển
              </p>
            </div>
          )}

          <div className="relative">
            <div className="absolute -left-[31px] top-0.5 size-4 rounded-full bg-gray-300" />
            <p className="text-xs font-semibold text-ink">
              Đơn hàng được xác nhận thành công
            </p>
            <p className="text-[11px] text-ink-subtle mt-0.5">
              Hệ thống FunnyShop đã tạo mã vận đơn điện tử SPX Express
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

