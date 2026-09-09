import { CheckCircle2, Clock, MapPin, Phone, X } from 'lucide-react';
import type { RideBooking } from '@/types';
import { Button } from '@/components/ui/Button';
import { transportIcons } from '@/components/ui/TransportIcons';
import { getTransportLabel } from '@/lib/transport';
import { formatCurrency } from '@/lib/utils';

interface BookingStatusCardProps {
  booking: RideBooking;
  onCancel: () => void;
}

const statusLabels: Record<RideBooking['status'], string> = {
  searching: 'Finding your driver…',
  confirmed: 'Driver confirmed',
  arriving: 'Driver is on the way',
  completed: 'Ride completed',
};

export function BookingStatusCard({ booking, onCancel }: BookingStatusCardProps) {
  const VehicleIcon = transportIcons[booking.vehicleType];

  return (
    <div className="rounded-2xl border border-lacvay-green/30 bg-gradient-to-br from-lacvay-green/[0.06] to-lacvay-lime/10 p-5 shadow-card">
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-2">
          <CheckCircle2 className="h-5 w-5 text-lacvay-green" />
          <div>
            <p className="text-[13px] font-bold text-lacvay-green-dark">{statusLabels[booking.status]}</p>
            <p className="text-[12px] text-gray-600">{booking.driverName}</p>
          </div>
        </div>
        <button
          type="button"
          onClick={onCancel}
          aria-label="Cancel booking"
          className="rounded-lg p-1 text-gray-400 transition hover:bg-white/80 hover:text-gray-600"
        >
          <X className="h-4 w-4" />
        </button>
      </div>

      <div className="mt-4 space-y-2 text-[12.5px] text-gray-600">
        <p className="flex items-center gap-2">
          <VehicleIcon className="h-4 w-4 text-lacvay-green" />
          {getTransportLabel(booking.vehicleType)}
          {booking.plateNumber && ` · ${booking.plateNumber}`}
        </p>
        <p className="flex items-start gap-2">
          <MapPin className="mt-0.5 h-4 w-4 shrink-0 text-lacvay-green" />
          <span>
            {booking.pickup} → {booking.destination}
          </span>
        </p>
        <p className="flex items-center gap-2">
          <Clock className="h-4 w-4 text-lacvay-green" />
          Arriving in about {booking.etaMin} min · {formatCurrency(booking.estimatedFare)} estimated
        </p>
      </div>

      <div className="mt-4 flex gap-2">
        <Button variant="outline" size="sm" className="flex-1 gap-1.5">
          <Phone className="h-4 w-4" />
          Call driver
        </Button>
        <Button size="sm" className="flex-1" onClick={onCancel}>
          Cancel ride
        </Button>
      </div>
    </div>
  );
}
