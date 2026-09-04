import { Clock, MapPin, Star } from 'lucide-react';
import type { Ride } from '@/types';
import { Button } from '@/components/ui/Button';
import { getTransportLabel } from '@/lib/transport';
import { formatRateSummary } from '@/lib/partnerRates';
import { driverInitials } from '@/lib/rideBooking';
import { formatCurrency } from '@/lib/utils';
import { cn } from '@/lib/utils';

interface PartnerListItemProps {
  ride: Ride;
  selected?: boolean;
  tripDistanceKm?: number;
  booking?: boolean;
  onSelect: () => void;
  onBook: () => void;
}

export function PartnerListItem({
  ride,
  selected,
  tripDistanceKm,
  booking,
  onSelect,
  onBook,
}: PartnerListItemProps) {
  return (
    <article
      className={cn(
        'rounded-2xl border bg-white p-3 transition',
        selected
          ? 'border-lacvay-green bg-lacvay-green/[0.03] ring-2 ring-lacvay-green/20'
          : 'border-gray-100 hover:border-lacvay-green/25 hover:shadow-soft',
      )}
    >
      <button type="button" onClick={onSelect} className="w-full text-left">
        <div className="flex items-start gap-2.5">
          <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-lacvay-green to-lacvay-green-dark text-xs font-bold text-white">
            {driverInitials(ride.driverName)}
          </span>
          <div className="min-w-0 flex-1">
            <div className="flex items-start justify-between gap-2">
              <div className="min-w-0">
                <h3 className="truncate text-[13px] font-bold text-gray-900">{ride.driverName}</h3>
                <p className="truncate text-[11px] text-gray-500">{getTransportLabel(ride.vehicleType)}</p>
              </div>
              <span className="flex shrink-0 items-center gap-0.5 text-[12px] font-semibold text-amber-600">
                <Star className="h-3.5 w-3.5 fill-current" />
                {ride.rating}
              </span>
            </div>
            <p className="mt-1.5 text-[10.5px] font-medium text-lacvay-green-dark">
              {formatRateSummary(ride.baseFare, ride.perKmFee)}
            </p>
            <div className="mt-1.5 flex flex-wrap gap-x-3 gap-y-0.5 text-[10.5px] text-gray-500">
              <span className="inline-flex items-center gap-1">
                <MapPin className="h-3 w-3" />
                {ride.distanceKm} km
              </span>
              <span className="inline-flex items-center gap-1">
                <Clock className="h-3 w-3" />
                {ride.etaMin} min
              </span>
            </div>
          </div>
        </div>
      </button>

      <div className="mt-2.5 flex items-center justify-between gap-2 border-t border-gray-100 pt-2.5">
        <div>
          {tripDistanceKm != null && (
            <p className="text-[10px] text-gray-400">Est. trip</p>
          )}
          <p className="text-[15px] font-extrabold leading-tight text-lacvay-green">
            {formatCurrency(ride.estimatedFare)}
          </p>
        </div>
        <Button size="sm" className="shrink-0 px-3" onClick={onBook} disabled={booking}>
          {booking ? '…' : 'Book'}
        </Button>
      </div>
    </article>
  );
}
