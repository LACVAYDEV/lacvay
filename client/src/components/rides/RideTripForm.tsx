import { ArrowUpDown, MapPin, Navigation } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { cn } from '@/lib/utils';

interface RideTripFormProps {
  pickup: string;
  destination: string;
  onPickupChange: (value: string) => void;
  onDestinationChange: (value: string) => void;
  onSwap: () => void;
  onSearch: () => void;
  searching?: boolean;
  compact?: boolean;
}

export function RideTripForm({
  pickup,
  destination,
  onPickupChange,
  onDestinationChange,
  onSwap,
  onSearch,
  searching,
  compact,
}: RideTripFormProps) {
  return (
    <div className={cn('space-y-3', compact && 'space-y-2.5')}>
      {!compact && (
        <div className="flex items-center gap-2">
          <Navigation className="h-4 w-4 text-lacvay-green" />
          <h3 className="text-[15px] font-bold text-gray-900">Where are you going?</h3>
        </div>
      )}

      <div className="relative space-y-3">
        <div className="relative">
          <MapPin className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-lacvay-green" />
          <input
            value={pickup}
            onChange={(e) => onPickupChange(e.target.value)}
            placeholder="Pickup location"
            className="w-full rounded-2xl border border-gray-200 bg-gray-50 py-3 pl-11 pr-4 text-[13px] outline-none transition focus:border-lacvay-green focus:bg-white focus:ring-2 focus:ring-lacvay-green/15"
          />
        </div>

        <button
          type="button"
          onClick={onSwap}
          aria-label="Swap pickup and destination"
          className="absolute right-3 top-1/2 z-10 flex h-8 w-8 -translate-y-1/2 items-center justify-center rounded-full border border-gray-200 bg-white text-gray-500 shadow-sm transition hover:border-lacvay-green/40 hover:text-lacvay-green"
        >
          <ArrowUpDown className="h-4 w-4" />
        </button>

        <div className="relative">
          <MapPin className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-lacvay-yellow" />
          <input
            value={destination}
            onChange={(e) => onDestinationChange(e.target.value)}
            placeholder="Destination"
            className="w-full rounded-2xl border border-gray-200 bg-gray-50 py-3 pl-11 pr-4 text-[13px] outline-none transition focus:border-lacvay-green focus:bg-white focus:ring-2 focus:ring-lacvay-green/15"
          />
        </div>
      </div>

      {!compact && (
        <input
          placeholder="Notes for driver (optional)"
          className="w-full rounded-2xl border border-gray-200 bg-gray-50 px-4 py-2.5 text-[13px] outline-none transition focus:border-lacvay-green focus:bg-white"
        />
      )}

      <Button className="w-full" size={compact ? 'sm' : 'md'} onClick={onSearch} disabled={searching || !destination.trim()}>
        {searching ? 'Finding…' : compact ? 'Find drivers' : 'Find available drivers'}
      </Button>
    </div>
  );
}
