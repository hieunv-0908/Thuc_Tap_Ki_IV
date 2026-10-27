import { Loader2 } from 'lucide-react';

/**
 * Standard Button component complying with Design.md section 6.1
 */
export default function Button({
  children,
  variant = 'primary',
  size = 'md',
  loading = false,
  disabled = false,
  leftIcon: LeftIcon,
  rightIcon: RightIcon,
  fullWidth = false,
  type = 'button',
  className = '',
  onClick,
  ...props
}) {
  const baseClasses =
    'inline-flex items-center justify-center gap-2 rounded-lg font-semibold transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-secondary-500 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer select-none';

  const variants = {
    primary: 'bg-primary-700 text-white hover:bg-primary-800 active:bg-primary-900',
    secondary: 'bg-secondary-500 text-white hover:bg-secondary-600 active:bg-secondary-700',
    outline: 'border border-line bg-white text-ink hover:bg-gray-50 active:bg-gray-100',
    ghost: 'text-ink hover:bg-gray-100 active:bg-gray-200',
    danger: 'bg-red-700 text-white hover:bg-red-800 active:bg-red-900',
  };

  const sizes = {
    sm: 'h-9 px-3 text-sm',
    md: 'h-11 px-4 text-sm md:text-base',
    lg: 'h-12 px-6 text-base',
  };

  const variantClass = variants[variant] || variants.primary;
  const sizeClass = sizes[size] || sizes.md;
  const widthClass = fullWidth ? 'w-full' : '';

  return (
    <button
      type={type}
      disabled={disabled || loading}
      onClick={onClick}
      className={`${baseClasses} ${variantClass} ${sizeClass} ${widthClass} ${className}`}
      {...props}
    >
      {loading ? (
        <>
          <Loader2 className="size-4 animate-spin shrink-0" aria-hidden="true" />
          <span>{children}</span>
        </>
      ) : (
        <>
          {LeftIcon && <LeftIcon className="size-4 shrink-0" aria-hidden="true" />}
          <span>{children}</span>
          {RightIcon && <RightIcon className="size-4 shrink-0" aria-hidden="true" />}
        </>
      )}
    </button>
  );
}
