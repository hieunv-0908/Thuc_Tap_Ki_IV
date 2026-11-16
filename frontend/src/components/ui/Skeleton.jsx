import { Loader2 } from 'lucide-react';

export function Skeleton({ className = '', ...props }) {
  return (
    <div
      className={`animate-pulse bg-sand/60 motion-reduce:animate-none ${className}`}
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
      className={`animate-spin text-ink ${sizeClasses[size] || sizeClasses.md} ${className}`}
      aria-label="Đang tải..."
    />
  );
}

export function ProductCardSkeleton() {
  return (
    <div className="flex flex-col bg-paper">
      {/* 3:4 Vertical Fashion image skeleton */}
      <div className="relative aspect-[3/4] w-full bg-sand/60 animate-pulse border border-line mb-3" />
      {/* Category line */}
      <Skeleton className="h-3 w-20 mb-2" />
      {/* Name skeleton lines */}
      <Skeleton className="h-4 w-5/6 mb-1.5" />
      <Skeleton className="h-4 w-3/5 mb-3" />
      {/* Meta size & price */}
      <div className="flex items-center justify-between pt-1 border-t border-line/60">
        <Skeleton className="h-3.5 w-16" />
        <Skeleton className="h-4 w-20" />
      </div>
    </div>
  );
}

export default Skeleton;
