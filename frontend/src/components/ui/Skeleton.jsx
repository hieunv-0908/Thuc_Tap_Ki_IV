import { Loader2 } from 'lucide-react';

export function Skeleton({ className = '', ...props }) {
  return (
    <div
      className={`animate-pulse bg-gray-200 rounded-md motion-reduce:animate-none ${className}`}
      {...props}
    />
  );
}

export function Spinner({ size = 'md', className = '' }) {
  const sizeClasses = {
    sm: 'size-4',
    md: 'size-5',
    lg: 'size-8',
    xl: 'size-12',
  };

  return (
    <Loader2
      className={`animate-spin text-secondary-500 ${sizeClasses[size] || sizeClasses.md} ${className}`}
      aria-label="Đang tải..."
    />
  );
}

export function ProductCardSkeleton() {
  return (
    <div className="flex flex-col overflow-hidden rounded-xl border border-line bg-white shadow-sm p-3">
      <Skeleton className="w-full aspect-square rounded-lg mb-3" />
      <Skeleton className="h-4 w-3/4 mb-2" />
      <Skeleton className="h-3 w-1/2 mb-3" />
      <div className="flex items-center justify-between mb-3">
        <Skeleton className="h-5 w-20" />
        <Skeleton className="h-3 w-12" />
      </div>
      <Skeleton className="h-10 w-full rounded-lg mt-auto" />
    </div>
  );
}
