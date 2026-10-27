import { useId } from 'react';
import { AlertCircle, ChevronDown } from 'lucide-react';

/**
 * Standard Select component complying with Design.md section 6.2
 */
export default function Select({
  label,
  id,
  name,
  value,
  onChange,
  options = [],
  placeholder = 'Chọn một mục...',
  error,
  helperText,
  disabled = false,
  required = false,
  className = '',
  selectClassName = '',
  ...props
}) {
  const generatedId = useId();
  const selectId = id || generatedId;
  const errorId = `${selectId}-error`;
  const helperId = `${selectId}-helper`;

  return (
    <div className={`flex flex-col gap-1.5 w-full ${className}`}>
      {label && (
        <label htmlFor={selectId} className="text-sm font-medium text-ink">
          {label}
          {required && <span className="text-primary-700 ml-1" aria-hidden="true">*</span>}
        </label>
      )}

      <div className="relative flex items-center w-full">
        <select
          id={selectId}
          name={name}
          value={value}
          onChange={onChange}
          disabled={disabled}
          required={required}
          aria-invalid={Boolean(error)}
          aria-describedby={error ? errorId : helperText ? helperId : undefined}
          className={`h-11 w-full appearance-none rounded-lg border bg-white px-3 pr-10 text-base text-ink transition-colors focus:outline-none focus:border-secondary-500 focus:ring-2 focus:ring-secondary-200 disabled:bg-gray-100 disabled:text-ink-subtle disabled:cursor-not-allowed cursor-pointer ${
            error
              ? 'border-red-500 focus:border-red-500 focus:ring-red-100'
              : 'border-line hover:border-gray-300'
          } ${selectClassName}`}
          {...props}
        >
          {placeholder && (
            <option value="" disabled>
              {placeholder}
            </option>
          )}
          {options.map((opt) => (
            <option key={opt.value} value={opt.value}>
              {opt.label}
            </option>
          ))}
        </select>

        <div className="absolute right-3 pointer-events-none text-ink-subtle flex items-center">
          <ChevronDown className="size-4" aria-hidden="true" />
        </div>
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
