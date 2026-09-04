import type { OnDemandVehicle } from '@/types';
import { transportIcons } from '@/components/ui/TransportIcons';
import { onDemandRideOptions } from '@/lib/transport';
import { typicalFareRanges } from '@/lib/rideBooking';
import { formatCurrency } from '@/lib/utils';
import { cn } from '@/lib/utils';

interface VehicleTypeTabsProps {
  value: OnDemandVehicle;
  onChange: (type: OnDemandVehicle) => void;
}

export function VehicleTypeTabs({ value, onChange }: VehicleTypeTabsProps) {
  return (
    <div className="grid gap-3 sm:grid-cols-2">
      {onDemandRideOptions.map(({ type, label, description }) => {
        const Icon = transportIcons[type];
        const fare = typicalFareRanges[type];
        const active = value === type;

        return (
          <button
            key={type}
            type="button"
            onClick={() => onChange(type)}
            aria-pressed={active}
            className={cn(
              'rounded-2xl border-2 p-4 text-left transition',
              active
                ? 'border-lacvay-green bg-lacvay-green/[0.06] shadow-soft'
                : 'border-gray-100 bg-white hover:border-lacvay-green/30 hover:bg-gray-50',
            )}
          >
            <span
              className={cn(
                'flex h-10 w-10 items-center justify-center rounded-xl',
                active ? 'bg-lacvay-green text-white' : 'bg-lacvay-green/10 text-lacvay-green',
              )}
            >
              <Icon className="h-5 w-5" />
            </span>
            <p className="mt-3 text-[14px] font-bold text-gray-900">{label}</p>
            <p className="mt-1 text-[11.5px] leading-snug text-gray-500">{description}</p>
            <p className="mt-2 text-[11px] font-semibold text-lacvay-green-dark">
              {formatCurrency(fare.min)} – {formatCurrency(fare.max)} typical
            </p>
          </button>
        );
      })}
    </div>
  );
}
