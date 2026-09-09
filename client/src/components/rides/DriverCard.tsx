import { Clock, MapPin, Star } from 'lucide-react';
import type { Ride } from '@/types';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { transportIcons } from '@/components/ui/TransportIcons';
import { getTransportLabel } from '@/lib/transport';
import { formatRateSummary } from '@/lib/partnerRates';
import { driverInitials } from '@/lib/rideBooking';
import { formatCurrency } from '@/lib/utils';
import { cn } from '@/lib/utils';

interface DriverCardProps {
  ride: Ride;
  selected?: boolean;
  onSelect: () => void;
  onBook: () => void;
  booking?: boolean;
  tripDistanceKm?: number;
}

export function DriverCard({ ride, selected, onSelect, onBook, booking, tripDistanceKm }: DriverCardProps) {
  const VehicleIcon = transportIcons[ride.vehicleType];

  return (
    <article
      className={cn(
        'rounded-2xl border bg-white p-4 transition',
        selected ? 'border-lacvay-green ring-2 ring-lacvay-green/20' : 'border-gray-100 hover:border-lacvay-green/30 hover:shadow-soft',
      )}
    >
      <button type="button" onClick={onSelect} className="w-full text-left">
        <div className="flex items-start gap-3">
          <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-lacvay-green to-lacvay-green-dark text-sm font-bold text-white">
            {driverInitials(ride.driverName)}
          </span>

          <div className="min-w-0 flex-1">
            <div className="flex items-start justify-between gap-2">
              <div>
                <h3 className="font-bold text-gray-900">{ride.driverName}</h3>
                <p className="mt-0.5 flex items-center gap-1.5 text-[12px] text-gray-500">
                  <VehicleIcon className="h-3.5 w-3.5" />
                  {getTransportLabel(ride.vehicleType)}
                  {ride.vehicleLabel && ` · ${ride.vehicleLabel}`}
                </p>
              </div>
              <span className="flex shrink-0 items-center gap-1 text-sm font-semibold text-amber-600">
                <Star className="h-4 w-4 fill-current" />
                {ride.rating}
              </span>
            </div>

            <div className="mt-3 flex flex-wrap gap-2">
              <Badge variant="gray">
                <MapPin className="mr-1 inline h-3 w-3" />
                {ride.distanceKm} km away
              </Badge>
              <Badge variant="gray">
                <Clock className="mr-1 inline h-3 w-3" />
                {ride.etaMin} min ETA
              </Badge>
              {ride.plateNumber && <Badge>{ride.plateNumber}</Badge>}
              {ride.tripsCompleted && (
                <Badge variant="gray">{ride.tripsCompleted}+ trips</Badge>
              )}
            </div>
          </div>
        </div>
      </button>

      <div className="mt-4 flex items-center justify-between gap-3 border-t border-gray-100 pt-4">
        <div>
          <p className="text-[11px] text-gray-500">{formatRateSummary(ride.baseFare, ride.perKmFee)}</p>
          {tripDistanceKm != null && (
            <p className="text-[10.5px] text-gray-400">Est. for your trip</p>
          )}
          <p className="text-lg font-extrabold text-lacvay-green">{formatCurrency(ride.estimatedFare)}</p>
        </div>
        <Button size="sm" onClick={onBook} disabled={booking}>
          {booking ? 'Booking…' : 'Book'}
        </Button>
      </div>
    </article>
  );
}
