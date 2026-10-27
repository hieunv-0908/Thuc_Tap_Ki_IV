import { useState, useId } from 'react';
import { AlertCircle, Eye, EyeOff } from 'lucide-react';

/**
 * Standard Input component complying with Design.md section 6.2
 */
export default function Input({
  label,
  type = 'text',
  id,
  name,
  value,
  onChange,
  onBlur,
  placeholder,
  error,
  helperText,
  disabled = false,
  required = false,
  leftIcon: LeftIcon,
  className = '',
  inputClassName = '',
  ...props
}) {
  const generatedId = useId();
  const inputId = id || generatedId;
  const errorId = `${inputId}-error`;
  const helperId = `${inputId}-helper`;

  const [showPassword, setShowPassword] = useState(false);
  const isPasswordType = type === 'password';
  const computedType = isPasswordType ? (showPassword ? 'text' : 'password') : type;

  return (
    <div className={`flex flex-col gap-1.5 w-full ${className}`}>
      {label && (
        <label
          htmlFor={inputId}
          className="text-sm font-medium text-ink flex items-center justify-between"
        >
          <span>
            {label}
            {required && <span className="text-primary-700 ml-1" aria-hidden="true">*</span>}
          </span>
        </label>
      )}

      <div className="relative flex items-center w-full">
        {LeftIcon && (
          <div className="absolute left-3.5 text-ink-subtle pointer-events-none flex items-center">
            <LeftIcon className="size-5" aria-hidden="true" />
          </div>
        )}

        <input
          id={inputId}
          name={name}
          type={computedType}
          value={value}
          onChange={onChange}
          onBlur={onBlur}
          placeholder={placeholder}
          disabled={disabled}
          required={required}
          aria-invalid={Boolean(error)}
          aria-describedby={error ? errorId : helperText ? helperId : undefined}
          className={`h-11 w-full rounded-lg border bg-white px-3 text-base text-ink placeholder:text-ink-subtle transition-colors focus:outline-none focus:border-secondary-500 focus:ring-2 focus:ring-secondary-200 disabled:bg-gray-100 disabled:text-ink-subtle disabled:cursor-not-allowed ${
            LeftIcon ? 'pl-10' : ''
          } ${isPasswordType ? 'pr-11' : ''} ${
            error
              ? 'border-red-500 focus:border-red-500 focus:ring-red-100'
              : 'border-line hover:border-gray-300'
          } ${inputClassName}`}
          {...props}
        />

        {isPasswordType && (
          <button
            type="button"
            onClick={() => setShowPassword((prev) => !prev)}
            tabIndex={-1}
            className="absolute right-3 p-1 text-ink-subtle hover:text-ink transition-colors cursor-pointer"
            aria-label={showPassword ? 'Ẩn mật khẩu' : 'Hiện mật khẩu'}
          >
            {showPassword ? <EyeOff className="size-5" /> : <Eye className="size-5" />}
          </button>
        )}
      </div>

      {error ? (
        <div id={errorId} className="flex items-center gap-1.5 text-sm text-red-700 mt-0.5">
          <AlertCircle className="size-4 shrink-0" aria-hidden="true" />
          <span>{error}</span>
        </div>
      ) : helperText ? (
        <p id={helperId} className="text-xs text-ink-subtle mt-0.5">
          {helperText}
        </p>
      ) : null}
    </div>
  );
}
