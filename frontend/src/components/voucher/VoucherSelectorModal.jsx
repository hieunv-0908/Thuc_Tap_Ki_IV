import { useState, useEffect } from 'react';
import { Ticket, X, Check, Clock } from 'lucide-react';
import Button from '../ui/Button';
import { voucherApi } from '../../api/voucher';
import { formatCurrency } from '../../utils/formatCurrency';
import { formatDate } from '../../utils/formatDate';

export default function VoucherSelectorModal({ isOpen, onClose, currentSubtotal, appliedCode, onSelectVoucher }) {
  const [vouchers, setVouchers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!isOpen) return;

    let isMounted = true;

    voucherApi
      .getAvailableVouchers()
      .then((data) => {
        if (!isMounted) return;
        setVouchers(Array.isArray(data) ? data : []);
      })
      .catch((err) => {
        if (!isMounted) return;
        console.error('Lỗi nạp voucher:', err);
        setError('Không thể tải danh sách mã giảm giá.');
      })
      .finally(() => {
        if (isMounted) setLoading(false);
      });

    return () => {
      isMounted = false;
    };
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in overflow-y-auto">
      <div className="relative w-full max-w-lg bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-800 my-8 overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200 dark:border-slate-800">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-primary-50 dark:bg-primary-950/60 text-primary-600 dark:text-primary-400">
              <Ticket className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-900 dark:text-white">Chọn Mã Giảm Giá</h2>
              <p className="text-xs text-slate-500">Các mã khuyến mãi đang áp dụng cho đơn hàng</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* List of Vouchers */}
        <div className="p-6 max-h-[65vh] overflow-y-auto space-y-3.5">
          {loading ? (
            <div className="py-12 text-center text-slate-400 space-y-2">
              <div className="w-6 h-6 border-2 border-primary-600 border-t-transparent rounded-full animate-spin mx-auto"></div>
              <p className="text-xs">Đang tìm mã giảm giá tốt nhất...</p>
            </div>
          ) : error ? (
            <div className="py-8 text-center text-slate-500 text-sm">{error}</div>
          ) : vouchers.length === 0 ? (
            <div className="py-12 text-center text-slate-400 space-y-2">
              <Ticket className="w-10 h-10 mx-auto text-slate-300 dark:text-slate-600 stroke-[1.5]" />
              <p className="text-sm font-medium">Hiện không có mã giảm giá nào khả dụng</p>
              <p className="text-xs text-slate-400">Vui lòng quay lại sau bạn nhé!</p>
            </div>
          ) : (
            vouchers.map((v) => {
              const qualifies = !v.minOrderValue || currentSubtotal >= v.minOrderValue;
              const missingAmount = v.minOrderValue ? v.minOrderValue - currentSubtotal : 0;
              const isCurrentApplied = appliedCode && appliedCode.toUpperCase() === v.code.toUpperCase();

              return (
                <div
                  key={v.id}
                  className={`p-4 rounded-xl border transition-all relative ${
                    isCurrentApplied
                      ? 'border-primary-500 bg-primary-50/40 dark:bg-primary-950/20 ring-1 ring-primary-500'
                      : qualifies
                      ? 'border-slate-200 dark:border-slate-700/80 bg-white dark:bg-slate-850 hover:border-primary-400 hover:shadow-sm'
                      : 'border-slate-200/60 dark:border-slate-800 bg-slate-50/60 dark:bg-slate-900/40 opacity-75'
                  }`}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="font-mono font-bold text-sm tracking-wide text-primary-600 dark:text-primary-400 uppercase">
                          {v.code}
                        </span>
                        {isCurrentApplied && (
                          <span className="px-2 py-0.5 text-[10px] font-semibold bg-primary-100 text-primary-700 dark:bg-primary-900/60 dark:text-primary-300 rounded-full">
                            Đang dùng
                          </span>
                        )}
                      </div>

                      <p className="text-sm font-semibold text-slate-900 dark:text-white">{v.name}</p>

                      {v.description && (
                        <p className="text-xs text-slate-500 dark:text-slate-400">{v.description}</p>
                      )}

                      <div className="flex flex-wrap items-center gap-y-1 gap-x-3 text-xs text-slate-500 pt-1">
                        <span className="text-slate-700 dark:text-slate-300 font-medium">
                          {v.discountType === 'PERCENTAGE'
                            ? `Giảm ${v.discountValue}% (tối đa ${v.maxDiscountAmount ? formatCurrency(v.maxDiscountAmount) : 'không trần'})`
                            : `Giảm ${formatCurrency(v.discountValue)}`}
                        </span>
                        <span>•</span>
                        <span>Đơn từ {formatCurrency(v.minOrderValue || 0)}</span>
                      </div>
                    </div>

                    <div className="shrink-0 pt-0.5">
                      {isCurrentApplied ? (
                        <div className="flex items-center gap-1 text-xs font-semibold text-primary-600 dark:text-primary-400 px-3 py-1.5 rounded-lg bg-primary-100/70 dark:bg-primary-900/50">
                          <Check className="w-3.5 h-3.5" /> Đã chọn
                        </div>
                      ) : qualifies ? (
                        <Button
                          variant="primary"
                          size="sm"
                          onClick={() => {
                            onSelectVoucher(v.code);
                            onClose();
                          }}
                        >
                          Áp dụng
                        </Button>
                      ) : (
                        <span className="text-[11px] font-medium text-amber-600 dark:text-amber-400 px-2 py-1 rounded bg-amber-50 dark:bg-amber-950/40">
                          Mua thêm {formatCurrency(missingAmount)}
                        </span>
                      )}
                    </div>
                  </div>

                  {v.endDate && (
                    <div className="mt-2.5 pt-2 border-t border-slate-100 dark:border-slate-800 text-[11px] text-slate-400 flex items-center gap-1">
                      <Clock className="w-3 h-3" /> Hạn dùng đến: {formatDate(v.endDate)}
                    </div>
                  )}
                </div>
              );
            })
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-3.5 bg-slate-50 dark:bg-slate-800/40 border-t border-slate-200 dark:border-slate-800 flex justify-end">
          <Button variant="outline" size="sm" onClick={onClose}>
            Đóng
          </Button>
        </div>
      </div>
    </div>
  );
}
