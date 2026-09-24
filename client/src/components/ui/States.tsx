import type { ReactNode } from 'react';
import { Loader2 } from 'lucide-react';

export function LoadingState({ message = 'Loading...' }: { message?: string }) {
  return (
    <div role="status" className="flex flex-col items-center justify-center gap-3 py-16 text-gray-500">
      <Loader2 className="h-8 w-8 animate-spin text-lacvay-green" />
      <p className="text-sm">{message}</p>
    </div>
  );
}

/** Placeholder grid shown while place/restaurant cards load. */
export function CardGridSkeleton({ count = 6 }: { count?: number }) {
  return (
    <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3 lg:gap-6" aria-hidden="true">
      {Array.from({ length: count }).map((_, index) => (
        <div key={index} className="overflow-hidden rounded-3xl bg-white shadow-card">
          <div className="aspect-[16/10] w-full animate-pulse bg-lacvay-cream" />
          <div className="space-y-2.5 p-4">
            <div className="h-4 w-2/3 animate-pulse rounded-full bg-lacvay-cream" />
            <div className="h-3 w-1/3 animate-pulse rounded-full bg-lacvay-cream" />
            <div className="h-3 w-full animate-pulse rounded-full bg-lacvay-cream" />
            <div className="flex gap-2 pt-2">
              <div className="h-9 flex-1 animate-pulse rounded-xl bg-lacvay-cream" />
              <div className="h-9 flex-1 animate-pulse rounded-xl bg-lacvay-cream" />
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

export function EmptyState({
  title,
  description,
  icon,
  action,
}: {
  title: string;
  description?: string;
  icon?: ReactNode;
  action?: ReactNode;
}) {
  return (
    <div className="flex flex-col items-center justify-center gap-2 rounded-3xl border border-dashed border-lacvay-green/15 bg-white/70 px-6 py-14 text-center">
      {icon && (
        <div className="mb-2 flex h-14 w-14 items-center justify-center rounded-2xl bg-lacvay-blush text-lacvay-green">
          {icon}
        </div>
      )}
      <p className="text-lg font-semibold text-gray-800">{title}</p>
      {description && <p className="max-w-sm text-sm text-gray-500">{description}</p>}
      {action && <div className="mt-3">{action}</div>}
    </div>
  );
}

export function ErrorState({ message, onRetry }: { message: string; onRetry?: () => void }) {
  return (
    <div className="flex flex-col items-center justify-center gap-3 py-16 text-center">
      <p className="text-sm text-red-600">{message}</p>
      {onRetry && (
        <button onClick={onRetry} className="text-sm font-semibold text-lacvay-green hover:underline">
          Try again
        </button>
      )}
    </div>
  );
}
