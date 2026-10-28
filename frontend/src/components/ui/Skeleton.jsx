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
    <div className="flex flex-col overflow-hidden rounded-xl border border-line bg-white shadow-soft p-3 sm:p-4">
      {/* Square image skeleton with chip placeholder */}
      <div className="relative aspect-square w-full rounded-lg bg-gray-200 animate-pulse mb-3 overflow-hidden">
        <Skeleton className="absolute bottom-2 left-2 h-5 w-20 rounded-full" />
      </div>
      {/* Name skeleton lines */}
      <Skeleton className="h-4 w-5/6 mb-1.5" />
      <Skeleton className="h-4 w-3/5 mb-3" />
      {/* Meta rating & price */}
      <div className="flex items-center justify-between mb-3">
        <Skeleton className="h-5 w-24" />
        <Skeleton className="h-4 w-12" />
      </div>
      {/* Button skeleton */}
      <Skeleton className="h-11 w-full rounded-lg mt-auto" />
    </div>
  );
}

export default Skeleton;
