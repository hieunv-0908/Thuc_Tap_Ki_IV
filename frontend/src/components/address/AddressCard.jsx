import { MapPin, Phone, User, Home, Building, Check, Edit2, Trash2 } from 'lucide-react';
import Badge from '../ui/Badge';
import Button from '../ui/Button';

export default function AddressCard({
  address,
  onEdit,
  onDelete,
  onSetDefault,
  isSelectable = false,
  isSelected = false,
  onSelect = null,
}) {
  const isHome = address.addressType === 'HOME';

  return (
    <div
      onClick={() => isSelectable && onSelect && onSelect(address)}
      className={`relative rounded-2xl border transition-all p-4 sm:p-5 ${
        isSelected
          ? 'border-primary-500 bg-primary-50/40 ring-2 ring-primary-200 shadow-soft'
          : isSelectable
          ? 'border-line bg-white hover:border-primary-300 hover:shadow-xs cursor-pointer'
          : 'border-line bg-white shadow-soft'
      }`}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-start gap-3 min-w-0 flex-1">
          <div
            className={`size-10 rounded-xl flex items-center justify-center shrink-0 ${
              isHome
                ? 'bg-primary-100 text-primary-700'
                : 'bg-secondary-100 text-secondary-700'
            }`}
          >
            {isHome ? <Home className="size-5" /> : <Building className="size-5" />}
          </div>

          <div className="space-y-1.5 min-w-0 flex-1">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="font-bold text-ink text-base flex items-center gap-1.5">
                <User className="size-3.5 text-ink-muted shrink-0" />
                {address.recipientName}
              </span>
              <span className="text-xs text-ink-muted">|</span>
              <span className="text-sm font-semibold text-ink-muted flex items-center gap-1">
                <Phone className="size-3.5 text-ink-muted shrink-0" />
                {address.phone}
              </span>

              {address.isDefault && (
                <Badge variant="success" className="text-[11px] font-bold py-0.5">
                  Mặc định
                </Badge>
              )}
              <span
                className={`text-[11px] font-medium px-2 py-0.5 rounded-full ${
                  isHome
                    ? 'bg-primary-50 text-primary-700 border border-primary-200'
                    : 'bg-secondary-50 text-secondary-700 border border-secondary-200'
                }`}
              >
                {isHome ? 'Nhà riêng' : 'Văn phòng'}
              </span>
            </div>

            <p className="text-sm text-ink-muted flex items-start gap-1.5 leading-relaxed pt-0.5">
              <MapPin className="size-4 text-primary-700 shrink-0 mt-0.5" />
              <span>{address.fullAddress}</span>
            </p>
          </div>
        </div>

        {/* Radio Check mark if selectable */}
        {isSelectable && (
          <div className="shrink-0 mt-1">
            <div
              className={`size-5 rounded-full border flex items-center justify-center transition-all ${
                isSelected
                  ? 'border-primary-600 bg-primary-600 text-white'
                  : 'border-line bg-white'
              }`}
            >
              {isSelected && <Check className="size-3.5 text-white stroke-[3]" />}
            </div>
          </div>
        )}
      </div>

      {/* Action Buttons (nếu không phải chỉ để chọn trong modal) */}
      {!isSelectable && (
        <div className="flex items-center justify-between border-t border-line/70 mt-4 pt-3 text-xs">
          <div>
            {!address.isDefault && (
              <button
                type="button"
                onClick={() => onSetDefault(address.id)}
                className="text-xs font-semibold text-primary-700 hover:text-primary-800 hover:underline cursor-pointer"
              >
                Thiết lập mặc định
              </button>
            )}
          </div>

          <div className="flex items-center gap-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              leftIcon={Edit2}
              onClick={() => onEdit(address)}
              className="text-xs font-semibold py-1 px-2.5 h-8"
            >
              Sửa
            </Button>
            <Button
              type="button"
              variant="outline"
              size="sm"
              leftIcon={Trash2}
              onClick={() => onDelete(address.id)}
              className="text-xs font-semibold py-1 px-2.5 h-8 text-red-600 hover:bg-red-50 hover:border-red-300"
            >
              Xóa
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}

