import { useRef } from 'react';
import { Printer, ShieldCheck } from 'lucide-react';
import Modal from '../ui/Modal';
import Button from '../ui/Button';
import { formatCurrency } from '../../utils/formatCurrency';
import { formatDate } from '../../utils/formatDate';

/**
 * Modal hiển thị Hóa đơn bán lẻ & Phiếu giao hàng
 * Hỗ trợ in trực tiếp hoặc lưu dưới dạng PDF qua lệnh Print của trình duyệt
 */
export default function OrderInvoiceModal({ isOpen, onClose, order }) {
  const printRef = useRef(null);

  if (!isOpen || !order) return null;

  const handlePrint = () => {
    window.print();
  };

  const items = order.items || [];
  const pointsDiscount = Number(order.pointsDiscount || 0);
  const voucherDiscount = Number(order.discountAmount || 0);

  // Tính tạm tính ban đầu
  const subTotal = items.reduce((sum, item) => {
    const price = Number(item.price || item.unitPrice || 0);
    return sum + price * (item.quantity || 1);
  }, 0);

  const finalAmount = Number(order.totalAmount || 0);

  // Mã vận đơn mô phỏng
  const trackingNumber = `SPX${String(order.id).padStart(8, '0')}VN`;

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      maxWidth="max-w-3xl"
      title="Hóa đơn & Phiếu giao hàng"
    >
      <div className="space-y-4">
        {/* Thanh công cụ hành động in (cố định trên đỉnh, ẩn khi in ra giấy) */}
        <div className="sticky top-0 z-20 bg-white/95 backdrop-blur-xs py-2 flex items-center justify-between pb-3 border-b border-line print:hidden">
          <p className="text-xs text-ink-muted">
            Nhấn <span className="font-semibold text-ink">In / Xuất PDF</span> để lưu file PDF hoặc in trực tiếp ra máy in hóa đơn.
          </p>
          <div className="flex items-center gap-2">
            <Button
              variant="primary"
              size="sm"
              leftIcon={Printer}
              onClick={handlePrint}
              className="font-semibold shadow-brand"
            >
              In / Xuất PDF
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={onClose}
            >
              Đóng
            </Button>
          </div>
        </div>

        {/* Nội dung Hóa đơn chuẩn A4 / A5 in ấn */}
        <div
          ref={printRef}
          id="printable-invoice"
          className="bg-white text-gray-900 p-6 sm:p-8 rounded-xl border border-gray-200 shadow-xs print:p-0 print:border-none print:shadow-none print:m-0"
        >
          {/* Header */}
          <div className="flex items-start justify-between border-b-2 border-primary-600 pb-5">
            <div>
              <div className="flex items-center gap-1.5">
                <span className="text-2xl font-black text-primary-600 tracking-tight">Funny</span>
                <span className="text-2xl font-black text-secondary-500 tracking-tight">Shop</span>
              </div>
              <p className="text-xs text-gray-500 mt-1 font-medium">Hệ thống đồ chơi & đồ dùng sáng tạo hàng đầu</p>
              <p className="text-xs text-gray-500">Website: https://funnyshop.com • Hotline: 1900 6868</p>
              <p className="text-xs text-gray-500">Kho hàng: 123 Đường Cầu Giấy, P. Dịch Vọng, TP. Hà Nội</p>
            </div>

            <div className="text-right">
              <span className="inline-block px-3 py-1 rounded bg-primary-50 text-primary-700 text-xs font-bold uppercase tracking-wider mb-1">
                Phiếu Giao Hàng & Hóa Đơn
              </span>
              <h2 className="text-lg font-bold text-gray-800">
                MÃ ĐƠN: #{order.id}
              </h2>
              <p className="text-xs text-gray-500">
                Ngày đặt: {formatDate(order.createdAt)}
              </p>
              <p className="text-xs text-primary-700 font-mono font-bold mt-0.5">
                Vận đơn: {trackingNumber}
              </p>
            </div>
          </div>

          {/* 2 Cột thông tin: Người gửi & Người nhận */}
          <div className="grid grid-cols-2 gap-4 py-4 border-b border-gray-200 text-xs">
            <div className="space-y-1">
              <span className="font-bold text-gray-700 uppercase tracking-wide text-[11px]">Người gửi:</span>
              <p className="font-bold text-gray-900">Trung Tâm Kho Vận FunnyShop</p>
              <p className="text-gray-600">Hotline vận hành: 0988 888 999</p>
              <p className="text-gray-600">Kho tổng Cầu Giấy, Hà Nội</p>
              <p className="text-gray-600 font-medium">Đơn vị vận chuyển: SPX Express (Hỏa tốc)</p>
            </div>

            <div className="space-y-1 border-l pl-4 border-gray-200">
              <span className="font-bold text-gray-700 uppercase tracking-wide text-[11px]">Người nhận hàng:</span>
              <p className="font-bold text-gray-900 text-sm">{order.fullName || 'Khách hàng'}</p>
              <p className="text-gray-600 font-semibold">SĐT: {order.phone || 'Chưa cung cấp'}</p>
              <p className="text-gray-600 leading-relaxed">Địa chỉ: {order.address || 'Tại shop'}</p>
              {order.note && (
                <p className="text-gray-500 italic mt-0.5">Ghi chú: {order.note}</p>
              )}
            </div>
          </div>

          {/* Bảng danh sách sản phẩm */}
          <div className="py-4">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="border-b border-gray-300 bg-gray-50 text-gray-700 font-bold uppercase text-[11px]">
                  <th className="py-2 px-2 text-center w-10">STT</th>
                  <th className="py-2 px-3">Tên sản phẩm & Phân loại</th>
                  <th className="py-2 px-3 text-center w-16">SL</th>
                  <th className="py-2 px-3 text-right w-24">Đơn giá</th>
                  <th className="py-2 px-3 text-right w-28">Thành tiền</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {items.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="py-4 text-center text-gray-500">
                      Không có sản phẩm trong đơn hàng.
                    </td>
                  </tr>
                ) : (
                  items.map((item, index) => {
                    const price = Number(item.price || item.unitPrice || 0);
                    const lineTotal = price * (item.quantity || 1);
                    return (
                      <tr key={item.id || index} className="text-gray-800">
                        <td className="py-2.5 px-2 text-center text-gray-500">{index + 1}</td>
                        <td className="py-2.5 px-3">
                          <p className="font-semibold text-gray-900 line-clamp-2">
                            {item.productName || item.name || 'Sản phẩm FunnyShop'}
                          </p>
                          {(item.color || item.size || item.variantAttributes) && (
                            <span className="text-[11px] text-gray-500 block">
                              Phân loại: {[item.color, item.size].filter(Boolean).join(' - ')}
                            </span>
                          )}
                        </td>
                        <td className="py-2.5 px-3 text-center font-bold">{item.quantity}</td>
                        <td className="py-2.5 px-3 text-right text-gray-600">{formatCurrency(price)}</td>
                        <td className="py-2.5 px-3 text-right font-bold text-gray-900">{formatCurrency(lineTotal)}</td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>

          {/* Tóm tắt thanh toán & Chiết khấu */}
          <div className="border-t border-gray-200 pt-3 flex justify-between items-start text-xs">
            <div className="w-1/2 pr-4 space-y-2">
              <div className="p-2.5 rounded-lg bg-gray-50 border border-gray-200 space-y-1">
                <p className="font-bold text-gray-700">Phương thức thanh toán:</p>
                <p className="text-gray-900 font-medium">
                  {order.paymentMethod === 'PAYOS' ? '💳 Thanh toán Online qua PayOS (VietQR)' : '💵 Thanh toán khi nhận hàng (COD)'}
                </p>
                <p className="text-[11px] text-gray-500">
                  Trạng thái: <span className="font-bold text-primary-700">{order.paymentStatus === 'PAID' ? 'Đã thanh toán đủ' : 'Thu tiền khi giao hàng (COD)'}</span>
                </p>
              </div>

              {/* Cam kết shop */}
              <div className="flex items-center gap-1.5 text-gray-500 text-[11px]">
                <ShieldCheck className="size-4 text-emerald-600 shrink-0" />
                <span>Được kiểm tra hàng trước khi nhận. Đổi trả miễn phí 7 ngày.</span>
              </div>
            </div>

            <div className="w-1/2 pl-4 space-y-1.5">
              <div className="flex justify-between text-gray-600">
                <span>Tạm tính tiền hàng:</span>
                <span className="font-semibold text-gray-900">{formatCurrency(subTotal || finalAmount)}</span>
              </div>

              {voucherDiscount > 0 && (
                <div className="flex justify-between text-emerald-600 font-medium">
                  <span>Giảm giá Voucher ({order.voucherCode || 'Ưu đãi'}):</span>
                  <span>-{formatCurrency(voucherDiscount)}</span>
                </div>
              )}

              {pointsDiscount > 0 && (
                <div className="flex justify-between text-amber-600 font-medium">
                  <span>Điểm thưởng FunnyShop ({order.pointsUsed || Math.round(pointsDiscount / 1000)} điểm):</span>
                  <span>-{formatCurrency(pointsDiscount)}</span>
                </div>
              )}

              <div className="flex justify-between text-gray-600">
                <span>Phí vận chuyển:</span>
                <span className="text-emerald-700 font-semibold">Miễn phí</span>
              </div>

              <div className="flex justify-between items-baseline pt-2 border-t-2 border-gray-300 text-sm">
                <span className="font-bold text-gray-900 uppercase">TỔNG THANH TOÁN:</span>
                <span className="text-base font-extrabold text-primary-700">
                  {formatCurrency(finalAmount)}
                </span>
              </div>

              {order.paymentMethod === 'COD' && order.paymentStatus !== 'PAID' && (
                <div className="text-right text-[11px] font-bold text-rose-600">
                  (Tiền mặt cần thu bưu tá: {formatCurrency(finalAmount)})
                </div>
              )}
            </div>
          </div>

          {/* Chữ ký xác nhận */}
          <div className="grid grid-cols-3 gap-2 pt-8 pb-4 text-center text-xs text-gray-700">
            <div>
              <p className="font-bold">Người nhận hàng</p>
              <p className="text-[10px] text-gray-400 italic">(Ký, ghi rõ họ tên)</p>
              <div className="h-16" />
            </div>
            <div>
              <p className="font-bold">Nhân viên giao nhận</p>
              <p className="text-[10px] text-gray-400 italic">(Ký, ghi rõ họ tên)</p>
              <div className="h-16" />
            </div>
            <div>
              <p className="font-bold">Đại diện FunnyShop</p>
              <p className="text-[10px] text-gray-400 italic">(Ký và đóng dấu)</p>
              <div className="h-16 flex items-center justify-center">
                <span className="text-emerald-600 font-mono font-bold text-xs uppercase px-2 py-1 border border-dashed border-emerald-400 rounded rotate-[-6deg]">
                  FunnyShop Confirmed
                </span>
              </div>
            </div>
          </div>

          <div className="border-t border-gray-200 pt-3 text-center text-[11px] text-gray-400">
            Cảm ơn quý khách đã mua sắm tại FunnyShop! Mọi thắc mắc vui lòng liên hệ hotline 1900 6868.
          </div>
        </div>
      </div>
    </Modal>
  );
}

