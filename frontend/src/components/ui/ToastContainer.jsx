import { useToastStore } from '../../store/toastStore';
import { CheckCircle2, AlertCircle, AlertTriangle, Info, X } from 'lucide-react';

/**
 * Toast notification container complying with Design.md section 6.5
 */
export default function ToastContainer() {
  const { toasts, removeToast } = useToastStore();

  if (!toasts || toasts.length === 0) return null;

  return (
    <div
      className="fixed z-[70] top-3 inset-x-3 md:inset-x-auto md:top-4 md:right-4 flex flex-col gap-2.5 max-w-sm pointer-events-none w-full"
      aria-live="polite"
    >
      {toasts.map((item) => {
        const isError = item.type === 'error';
        const role = isError ? 'alert' : 'status';

        const configs = {
          success: {
            border: 'border-l-green-600',
            icon: CheckCircle2,
            iconClass: 'text-green-600',
            bg: 'bg-white',
          },
          error: {
            border: 'border-l-red-600',
            icon: AlertCircle,
            iconClass: 'text-red-600',
            bg: 'bg-white',
          },
          warning: {
            border: 'border-l-amber-500',
            icon: AlertTriangle,
            iconClass: 'text-amber-500',
            bg: 'bg-white',
          },
          info: {
            border: 'border-l-secondary-500',
            icon: Info,
            iconClass: 'text-secondary-500',
            bg: 'bg-white',
          },
        };

        const config = configs[item.type] || configs.info;
        const IconComponent = config.icon;

        return (
          <div
            key={item.id}
            role={role}
            className={`pointer-events-auto flex items-start gap-3 p-3.5 rounded-lg border border-line ${config.border} border-l-4 ${config.bg} shadow-lg transition-all transform animate-in slide-in-from-top-2 md:slide-in-from-right-4 duration-200`}
          >
            <IconComponent className={`size-5 shrink-0 mt-0.5 ${config.iconClass}`} aria-hidden="true" />
            <div className="flex-1 text-sm font-medium text-ink leading-snug">
              {item.message}
            </div>
            <button
              type="button"
              onClick={() => removeToast(item.id)}
              className="text-ink-subtle hover:text-ink p-0.5 rounded transition-colors cursor-pointer shrink-0"
              aria-label="Đóng thông báo"
            >
              <X className="size-4" />
            </button>
          </div>
        );
      })}
    </div>
  );
}
