import { Loader2, LocateFixed } from 'lucide-react';
import { useApp } from '@/context/AppContext';
import { cn } from '@/lib/utils';

export function AiOriginField({ className }: { className?: string }) {
  const { aiOrigin, setAiOrigin, locatingAiOrigin, locateAiOriginFromGps, aiLoading } = useApp();

  return (
    <label
      className={cn(
        'flex min-w-0 items-center gap-1.5 rounded-full border border-gray-200 bg-white py-1 pl-2.5 pr-1 shadow-xs',
        className,
      )}
    >
      <span className="shrink-0 text-[9px] font-bold uppercase tracking-wide text-gray-400">From</span>
      <input
        type="text"
        value={aiOrigin}
        onChange={(e) => setAiOrigin(e.target.value)}
        placeholder="Starting point"
        className="min-w-[7rem] flex-1 bg-transparent text-[11px] font-medium text-gray-800 outline-none placeholder:text-gray-400 sm:min-w-[9rem] sm:text-xs md:min-w-[11rem]"
      />
      <button
        type="button"
        onClick={() => void locateAiOriginFromGps()}
        disabled={locatingAiOrigin || aiLoading}
        title="Use my current location"
        aria-label="Use my current location"
        className={cn(
          'flex h-7 w-7 shrink-0 items-center justify-center rounded-full transition',
          locatingAiOrigin
            ? 'bg-lacvay-blush text-lacvay-green/50'
            : 'bg-lacvay-blush text-lacvay-green hover:bg-lacvay-green/15',
          'disabled:opacity-50',
        )}
      >
        {locatingAiOrigin ? (
          <Loader2 className="h-3.5 w-3.5 animate-spin" />
        ) : (
          <LocateFixed className="h-3.5 w-3.5" />
        )}
      </button>
    </label>
  );
}
