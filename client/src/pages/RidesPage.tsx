import { useEffect, useState } from 'react';
import { Star, MapPin } from 'lucide-react';
import { dataService } from '@/services/dataService';
import type { BookableVehicle, Ride } from '@/types';
import { useApp } from '@/context/AppContext';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { LoadingState, EmptyState } from '@/components/ui/States';
import { transportIcons } from '@/components/ui/TransportIcons';
import { bookableOptions, getTransportLabel } from '@/lib/transport';
import { formatCurrency } from '@/lib/utils';

type RideFilter = 'all' | BookableVehicle;

const rideFilters: { value: RideFilter; label: string }[] = [
  { value: 'all', label: 'All' },
  ...bookableOptions.map((o) => ({ value: o.type as RideFilter, label: o.label })),
];

export default function RidesPage() {
  const [rides, setRides] = useState<Ride[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<RideFilter>('all');
  const { addHistory, showToast } = useApp();

  useEffect(() => {
    dataService.getRides().then((r) => {
      setRides(r);
      setLoading(false);
    });
  }, []);

  const filtered = filter === 'all' ? rides : rides.filter((r) => r.vehicleType === filter);

  const bookRide = (ride: Ride) => {
    addHistory({ query: ride.driverName, type: 'ride', meta: formatCurrency(ride.estimatedFare) });
    showToast(`Booking request sent to ${ride.driverName}`);
  };

  if (loading) return <LoadingState />;

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-gray-900">Book a Ride</h2>
        <p className="text-sm text-gray-500">
          Find available tricycles, motorcycle riders, taxis, and private rides nearby
        </p>
      </div>

      <div className="flex flex-wrap gap-2">
        {rideFilters.map(({ value, label }) => (
          <button
            key={value}
            type="button"
            onClick={() => setFilter(value)}
            className={`rounded-full px-4 py-2 text-sm font-semibold ${
              filter === value ? 'bg-lacvay-green text-white' : 'bg-white text-gray-600 shadow-soft'
            }`}
          >
            {label}
          </button>
        ))}
      </div>

      {filtered.length === 0 ? (
        <EmptyState title="No rides available" description="Try a different transportation type." />
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {filtered.map((ride) => {
            const VehicleIcon = transportIcons[ride.vehicleType];
            return (
            <Card key={ride.id}>
              <div className="flex items-start justify-between">
                <div>
                  <h3 className="font-bold text-gray-900">{ride.driverName}</h3>
                  <p className="flex items-center gap-1.5 text-sm text-gray-500">
                    <VehicleIcon className="h-4 w-4" />
                    {getTransportLabel(ride.vehicleType)}
                  </p>
                </div>
                <span className="flex items-center gap-1 text-sm font-semibold text-amber-600">
                  <Star className="h-4 w-4 fill-current" />
                  {ride.rating}
                </span>
              </div>
              <div className="mt-4 space-y-1 text-sm text-gray-600">
                <p className="flex items-center gap-1"><MapPin className="h-4 w-4" /> {ride.distanceKm} km away</p>
                <p>ETA: {ride.etaMin} min</p>
                <p className="text-lg font-bold text-lacvay-green">{formatCurrency(ride.estimatedFare)} estimated</p>
              </div>
              <Button className="mt-4 w-full" onClick={() => bookRide(ride)}>Book Ride</Button>
            </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
