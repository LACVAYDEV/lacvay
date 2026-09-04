import type { OnDemandVehicle } from '@/types';
import { transportIcons } from '@/components/ui/TransportIcons';
import { onDemandRideOptions } from '@/lib/transport';
import { typicalFareRanges } from '@/lib/rideBooking';
import { formatCurrency } from '@/lib/utils';
import { cn } from '@/lib/utils';

interface VehicleTypePickerProps {
  value: OnDemandVehicle;
  onChange: (type: OnDemandVehicle) => void;
  layout?: 'vertical' | 'horizontal';
}

export function VehicleTypePicker({ value, onChange, layout = 'vertical' }: VehicleTypePickerProps) {
  return (
    <div className={cn('flex gap-2', layout === 'vertical' ? 'flex-col' : 'flex-row')}>
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
              'rounded-2xl border-2 text-left transition',
              layout === 'vertical' ? 'p-3.5' : 'flex-1 p-3',
              active
                ? 'border-lacvay-green bg-lacvay-green/[0.06] shadow-soft'
                : 'border-gray-100 bg-white hover:border-lacvay-green/30 hover:bg-gray-50',
            )}
          >
            <span
              className={cn(
                'flex items-center justify-center rounded-xl',
                layout === 'vertical' ? 'h-9 w-9' : 'h-8 w-8',
                active ? 'bg-lacvay-green text-white' : 'bg-lacvay-green/10 text-lacvay-green',
              )}
            >
              <Icon className="h-4 w-4" />
            </span>
            <p className={cn('font-bold text-gray-900', layout === 'vertical' ? 'mt-2.5 text-[13px]' : 'mt-2 text-[12px]')}>
              {label}
            </p>
            {layout === 'vertical' && (
              <>
                <p className="mt-1 text-[10.5px] leading-snug text-gray-500">{description}</p>
                <p className="mt-2 text-[10px] font-semibold text-lacvay-green-dark">
                  {formatCurrency(fare.min)} – {formatCurrency(fare.max)}
                </p>
              </>
            )}
          </button>
        );
      })}
    </div>
  );
}
