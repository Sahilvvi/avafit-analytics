import clsx from "clsx";

/** Shimmering placeholder block — see the `shimmer` keyframes in globals.css. */
export function Skeleton({ className, style }: { className?: string; style?: React.CSSProperties }) {
  return <div className={clsx("skeleton rounded-lg", className)} style={style} />;
}

export function StatCardSkeleton() {
  return (
    <div className="card p-4 sm:p-5">
      <div className="flex items-start justify-between gap-3">
        <Skeleton className="h-3 w-24" />
        <Skeleton className="h-8 w-8 rounded-lg" />
      </div>
      <Skeleton className="mt-4 h-8 w-16" />
      <Skeleton className="mt-3 h-3 w-28" />
    </div>
  );
}

export function ChartCardSkeleton({ height = 220 }: { height?: number }) {
  return (
    <div className="card p-5">
      <Skeleton className="h-4 w-40" />
      <Skeleton className="mt-2 h-3 w-56" />
      <Skeleton className="mt-4 w-full" style={{ height }} />
    </div>
  );
}

export function TableSkeleton({ rows = 6 }: { rows?: number }) {
  return (
    <div className="card overflow-hidden">
      <div className="border-b border-border bg-surface-2/60 px-5 py-3">
        <Skeleton className="h-3 w-full max-w-md" />
      </div>
      <div className="divide-y divide-[var(--border)]">
        {Array.from({ length: rows }).map((_, i) => (
          <div key={i} className="flex items-center gap-6 px-5 py-4">
            <Skeleton className="h-4 w-32" />
            <Skeleton className="h-4 w-24" />
            <Skeleton className="hidden h-4 w-20 sm:block" />
            <Skeleton className="ml-auto h-4 w-12" />
          </div>
        ))}
      </div>
    </div>
  );
}

export function PageHeaderSkeleton() {
  return (
    <div className="mb-8 flex items-end justify-between">
      <div>
        <Skeleton className="h-3 w-16" />
        <Skeleton className="mt-3 h-8 w-48" />
        <Skeleton className="mt-2 h-3 w-72" />
      </div>
      <Skeleton className="h-9 w-32 rounded-xl" />
    </div>
  );
}
