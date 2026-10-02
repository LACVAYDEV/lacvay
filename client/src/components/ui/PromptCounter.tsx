import { Info } from 'lucide-react';
import { cn } from '@/lib/utils';

interface PromptCounterProps {
  remaining: number;
  total: number;
  isPremium?: boolean;
  className?: string;
}

export function PromptCounter({ remaining, total, isPremium = false, className }: PromptCounterProps) {
  if (isPremium) {
    return (
      <div className={cn('flex items-center gap-2', className)}>
        <div className="flex items-center gap-1.5 rounded-full bg-lacvay-green/10 px-3 py-1">
          <span className="text-xs font-semibold text-lacvay-green">✨ Premium</span>
        </div>
      </div>
    );
  }

  const percentage = (remaining / total) * 100;
  const isWarning = remaining <= 1;

  return (
    <div className={cn('space-y-2', className)}>
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Info className="h-4 w-4 text-gray-500" />
          <span className="text-xs font-medium text-gray-600">
            Prompts Used: {total - remaining}/{total} this week
          </span>
        </div>
        {isWarning && (
          <span className="text-xs font-semibold text-red-600">⚠️ Limit approaching</span>
        )}
      </div>

      <div className="flex items-center gap-2">
        <div className="flex-1 overflow-hidden rounded-full bg-gray-200 h-2">
          <div
            className={cn('h-full transition-all', {
              'bg-lacvay-green': !isWarning,
              'bg-red-500': isWarning,
            })}
            style={{ width: `${100 - percentage}%` }}
          />
        </div>
        <span className={cn('text-xs font-semibold', {
          'text-gray-600': !isWarning,
          'text-red-600': isWarning,
        })}>
          {remaining} left
        </span>
      </div>
    </div>
  );
}
