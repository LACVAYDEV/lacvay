import { Loader2, LocateFixed, MapPin } from 'lucide-react';
import { useApp } from '@/context/AppContext';
import { cn } from '@/lib/utils';

export function AiOriginField({ className }: { className?: string }) {
  const {
    aiOrigin,
    setAiOrigin,
    locatingAiOrigin,
    locateAiOriginFromGps,
    aiLoading,
    pinnedOrigin,
    setIsPinModalOpen,
  } = useApp();

  const isPinned = Boolean(pinnedOrigin && aiOrigin.trim() === pinnedOrigin.label.trim());

  return (
    <label
      className={cn(
        'flex min-w-0 items-center gap-1.5 rounded-full border border-gray-200 bg-white py-1 pl-2.5 pr-1 shadow-xs',
        isPinned && 'border-lacvay-green/40 ring-1 ring-lacvay-green/20',
        className,
      )}
    >
      <span className="shrink-0 text-[9px] font-bold uppercase tracking-wide text-gray-400">
        From
      </span>
      <input
        type="text"
        value={aiOrigin}
        onChange={(e) => setAiOrigin(e.target.value)}
        placeholder="Starting point"
        className="min-w-[6.5rem] flex-1 bg-transparent text-[11px] font-medium text-gray-800 outline-none placeholder:text-gray-400 sm:min-w-[8.5rem] sm:text-xs md:min-w-[10rem]"
      />

      {/* Pin on map button */}
      <button
        type="button"
        onClick={(e) => {
          e.preventDefault();
          setIsPinModalOpen(true);
        }}
        disabled={aiLoading}
        title={
          isPinned
            ? `Pinned: ${pinnedOrigin?.label} (${pinnedOrigin?.lat.toFixed(4)}, ${pinnedOrigin?.lng.toFixed(4)}) - Click to change`
            : 'Pin starting point anywhere on map'
        }
        aria-label="Pin starting point on map"
        className={cn(
          'flex h-7 w-7 shrink-0 items-center justify-center rounded-full transition active:scale-95',
          isPinned
            ? 'bg-lacvay-green text-white shadow-xs hover:bg-lacvay-green-dark'
            : 'bg-lacvay-blush text-lacvay-green hover:bg-lacvay-green/15',
          'disabled:opacity-50',
        )}
      >
        <MapPin className="h-3.5 w-3.5" />
      </button>

      {/* GPS locate button */}
      <button
        type="button"
        onClick={(e) => {
          e.preventDefault();
          void locateAiOriginFromGps();
        }}
        disabled={locatingAiOrigin || aiLoading}
        title="Use my current GPS location"
        aria-label="Use my current GPS location"
        className={cn(
          'flex h-7 w-7 shrink-0 items-center justify-center rounded-full transition active:scale-95',
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
