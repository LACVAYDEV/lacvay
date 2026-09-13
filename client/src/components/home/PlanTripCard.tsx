import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowUpDown, MapPin } from 'lucide-react';
import type { TransportType } from '@/types';
import { Card } from '@/components/ui/Card';
import { transportIcons } from '@/components/ui/TransportIcons';
import { tripPlannerOptions } from '@/lib/transport';
import { cn } from '@/lib/utils';

interface PlanTripCardProps {
  initialFrom?: string;
  initialTo?: string;
  initialTransport?: TransportType;
}

export function PlanTripCard({
  initialFrom = 'Current Location',
  initialTo = '',
  initialTransport = 'jeepney',
}: PlanTripCardProps) {
  const [from, setFrom] = useState(initialFrom);
  const [to, setTo] = useState(initialTo);
  const [transport, setTransport] = useState<TransportType>(initialTransport);
  const navigate = useNavigate();

  const swap = () => {
    setFrom(to || 'Current Location');
    setTo(from === 'Current Location' ? '' : from);
  };

  const findRoutes = () => {
    const params = new URLSearchParams({ from, to: to || 'SM City Batangas', transport });
    navigate(`/map?${params.toString()}`);
  };

  return (
    <Card>
      <div className="flex items-center gap-2">
        <MapPin className="h-4 w-4 text-lacvay-green" />
        <h3 className="text-[15px] font-bold text-gray-900">Plan Your Trip</h3>
      </div>

      <div className="relative mt-4">
        <div>
          <label htmlFor="trip-from" className="text-[10.5px] font-medium text-gray-500">
            From
          </label>
          <div className="relative mt-1">
            <span className="absolute left-3.5 top-1/2 h-2 w-2 -translate-y-1/2 rounded-full bg-lacvay-green" />
            <input
              id="trip-from"
              value={from}
              onChange={(e) => setFrom(e.target.value)}
              className="w-full rounded-xl border border-gray-200 bg-gray-50 py-2.5 pl-7 pr-10 text-[12.5px] outline-none transition focus:border-lacvay-green focus:bg-white"
            />
          </div>
        </div>

        <div className="mt-3">
          <label htmlFor="trip-to" className="text-[10.5px] font-medium text-gray-500">
            To
          </label>
          <div className="relative mt-1">
            <MapPin className="absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-gray-400" />
            <input
              id="trip-to"
              value={to}
              onChange={(e) => setTo(e.target.value)}
              placeholder="Where to?"
              className="w-full rounded-xl border border-gray-200 bg-gray-50 py-2.5 pl-8 pr-10 text-[12.5px] outline-none transition placeholder:text-gray-400 focus:border-lacvay-green focus:bg-white"
            />
          </div>
        </div>

        <button
          type="button"
          onClick={swap}
          className="absolute right-2 top-1/2 z-10 -translate-y-1/2 rounded-full border border-gray-200 bg-white p-1.5 shadow-sm transition hover:bg-gray-50"
          aria-label="Swap origin and destination"
        >
          <ArrowUpDown className="h-3.5 w-3.5 text-lacvay-green" />
        </button>
      </div>

      <p className="mt-4 text-[10.5px] font-medium text-gray-500">Travel Option</p>
      <div className="mt-2 grid grid-cols-5 gap-1.5">
        {tripPlannerOptions.map(({ type, label }) => {
          const Icon = transportIcons[type];
          return (
            <button
              key={type}
              type="button"
              onClick={() => setTransport(type)}
              aria-pressed={transport === type}
              title={label}
              className={cn(
                'flex flex-col items-center gap-1 rounded-xl border-2 px-0.5 py-2.5 text-[9px] font-semibold transition',
                transport === type
                  ? 'border-lacvay-green bg-lacvay-green/5 text-lacvay-green-dark'
                  : 'border-gray-100 bg-gray-50 text-gray-500 hover:border-gray-200',
              )}
            >
              <Icon className="h-4 w-4" />
              {label}
            </button>
          );
        })}
      </div>

      <button
        type="button"
        onClick={findRoutes}
        className="mt-4 w-full rounded-xl bg-lacvay-green py-2.5 text-[13px] font-bold text-white shadow-soft transition hover:bg-lacvay-green-dark"
      >
        Find Routes
      </button>
    </Card>
  );
}
