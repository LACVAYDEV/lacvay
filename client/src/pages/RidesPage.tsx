import { useEffect, useMemo, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { dataService } from '@/services/dataService';
import type { OnDemandVehicle, Ride, RideBooking } from '@/types';
import { useApp } from '@/context/AppContext';
import { Card } from '@/components/ui/Card';
import { EmptyState, LoadingState } from '@/components/ui/States';
import { VehicleTypePicker } from '@/components/rides/VehicleTypePicker';
import { RideTripForm } from '@/components/rides/RideTripForm';
import { PartnerListItem } from '@/components/rides/PartnerListItem';
import { BookingStatusCard } from '@/components/rides/BookingStatusCard';
import { PartnersMap } from '@/components/rides/PartnersMap';
import { filterOnDemandRides, getOnDemandOption, typicalFareRanges, withTripFare } from '@/lib/rideBooking';
import { estimateTripDistanceKm } from '@/lib/partnerRates';
import { isOnDemandVehicle } from '@/lib/transport';
import { formatCurrency, generateId } from '@/lib/utils';

export default function RidesPage() {
  const navigate = useNavigate();
  const [params, setParams] = useSearchParams();
  const { addHistory, showToast } = useApp();

  const initialType = params.get('type');
  const [vehicleType, setVehicleType] = useState<OnDemandVehicle>(() =>
    isOnDemandVehicle(initialType ?? '') ? (initialType as OnDemandVehicle) : 'motorcycle',
  );
  const [pickup, setPickup] = useState(params.get('from') || 'Current Location');
  const [destination, setDestination] = useState(params.get('to') || '');
  const [allRides, setAllRides] = useState<Ride[]>([]);
  const [loading, setLoading] = useState(true);
  const [searching, setSearching] = useState(false);
  const [selectedRideId, setSelectedRideId] = useState<string | null>(null);
  const [bookingRideId, setBookingRideId] = useState<string | null>(null);
  const [activeBooking, setActiveBooking] = useState<RideBooking | null>(null);

  useEffect(() => {
    if (initialType === 'tricycle') {
      const next = new URLSearchParams(params);
      next.delete('type');
      navigate(`/toda?${next.toString()}`, { replace: true });
    }
  }, [initialType, navigate, params]);

  useEffect(() => {
    dataService.getRides().then((rides) => {
      setAllRides(rides);
      setLoading(false);
    });
  }, []);

  useEffect(() => {
    const next = new URLSearchParams();
    next.set('type', vehicleType);
    if (pickup) next.set('from', pickup);
    if (destination) next.set('to', destination);
    setParams(next, { replace: true });
  }, [vehicleType, pickup, destination, setParams]);

  const tripDistanceKm = useMemo(
    () => (destination.trim() ? estimateTripDistanceKm(pickup, destination) : undefined),
    [pickup, destination],
  );

  const partners = useMemo(() => {
    const online = filterOnDemandRides(allRides, vehicleType);
    return tripDistanceKm ? withTripFare(online, tripDistanceKm) : online;
  }, [allRides, vehicleType, tripDistanceKm]);

  const fareHint = typicalFareRanges[vehicleType];
  const vehicleInfo = getOnDemandOption(vehicleType);

  const handleVehicleChange = (type: OnDemandVehicle) => {
    setVehicleType(type);
    setSelectedRideId(null);
  };

  const swapLocations = () => {
    setPickup(destination || 'Current Location');
    setDestination(pickup === 'Current Location' ? '' : pickup);
  };

  const findDrivers = () => {
    if (!destination.trim()) return;
    setSearching(true);
    setSelectedRideId(null);
    window.setTimeout(() => setSearching(false), 600);
  };

  const bookRide = async (ride: Ride) => {
    if (!destination.trim()) {
      showToast('Enter a destination first');
      return;
    }

    setBookingRideId(ride.id);
    await new Promise((r) => setTimeout(r, 800));

    const booking: RideBooking = {
      id: generateId(),
      rideId: ride.id,
      driverName: ride.driverName,
      vehicleType,
      pickup,
      destination,
      estimatedFare: ride.estimatedFare,
      etaMin: ride.etaMin,
      plateNumber: ride.plateNumber,
      status: 'confirmed',
      bookedAt: new Date().toISOString(),
    };

    setActiveBooking(booking);
    setBookingRideId(null);
    addHistory({
      query: `${pickup} → ${destination}`,
      type: 'ride',
      meta: `${ride.driverName} · ${formatCurrency(ride.estimatedFare)}`,
    });
    showToast(`Booking confirmed with ${ride.driverName}`);
  };

  const cancelBooking = () => {
    setActiveBooking(null);
    showToast('Ride cancelled');
  };

  if (loading) return <LoadingState />;

  return (
    <div className="space-y-4">
      <div>
        <h2 className="text-2xl font-bold text-gray-900">Book a Ride</h2>
        <p className="text-sm text-gray-500">
          Pick a vehicle, find partners on the map, and book a taxi or habal-habal near you
        </p>
      </div>

      <Card className="lg:hidden">
        <RideTripForm
          pickup={pickup}
          destination={destination}
          onPickupChange={setPickup}
          onDestinationChange={setDestination}
          onSwap={swapLocations}
          onSearch={findDrivers}
          searching={searching}
        />
      </Card>

      <div className="grid gap-4 lg:grid-cols-[220px_minmax(0,1fr)_300px] xl:grid-cols-[240px_minmax(0,1fr)_320px]">
        {/* Left — vehicle choices + trip form (desktop) */}
        <div className="space-y-4">
          <Card className="space-y-3">
            <p className="text-[11px] font-semibold uppercase tracking-wide text-gray-400">Ride type</p>
            <VehicleTypePicker value={vehicleType} onChange={handleVehicleChange} layout="vertical" />
          </Card>

          <Card className="hidden space-y-3 lg:block">
            <p className="text-[11px] font-semibold uppercase tracking-wide text-gray-400">Your trip</p>
            <RideTripForm
              pickup={pickup}
              destination={destination}
              onPickupChange={setPickup}
              onDestinationChange={setDestination}
              onSwap={swapLocations}
              onSearch={findDrivers}
              searching={searching}
              compact
            />
          </Card>

          <Card className="hidden bg-gradient-to-br from-lacvay-green/[0.04] to-lacvay-lime/10 lg:block">
            <p className="text-[11px] font-semibold uppercase tracking-wide text-lacvay-green-dark">
              {vehicleInfo.label} tips
            </p>
            <p className="mt-2 text-[12px] leading-relaxed text-gray-600">{fareHint.note}</p>
            <p className="mt-2 text-[12px] font-semibold text-lacvay-green-dark">
              {formatCurrency(fareHint.min)} – {formatCurrency(fareHint.max)} typical
            </p>
          </Card>
        </div>

        {/* Center — map */}
        <Card padding="sm" className="overflow-hidden p-0 lg:min-h-[520px]">
          <div className="border-b border-gray-100 px-4 py-2.5">
            <h3 className="text-[13px] font-bold text-gray-900">Live map</h3>
            <p className="text-[11px] text-gray-500">
              {partners.length} online
              {tripDistanceKm != null && ` · trip ~${tripDistanceKm.toFixed(1)} km`}
            </p>
          </div>
          <PartnersMap
            partners={partners}
            tripDistanceKm={tripDistanceKm}
            selectedId={selectedRideId}
            onSelect={setSelectedRideId}
            className="h-[280px] w-full sm:h-[360px] lg:h-[calc(100%-44px)] lg:min-h-[460px]"
          />
        </Card>

        {/* Right — partner list */}
        <div className="flex min-h-0 flex-col">
          <div className="mb-2 flex items-center justify-between px-0.5">
            <div>
              <h3 className="text-[13px] font-bold text-gray-900">Nearby partners</h3>
              <p className="text-[11px] text-gray-500">
                {partners.length} online · tap to highlight on map
              </p>
            </div>
          </div>

          <div className="flex max-h-[520px] flex-col gap-2 overflow-y-auto pr-0.5 lg:max-h-none lg:flex-1">
            {partners.length === 0 ? (
              <Card>
                <EmptyState
                  title={`No ${vehicleInfo.label.toLowerCase()}s online`}
                  description="Try another vehicle type or check back soon."
                />
              </Card>
            ) : (
              partners.map((ride) => (
                <PartnerListItem
                  key={ride.id}
                  ride={ride}
                  tripDistanceKm={tripDistanceKm}
                  selected={selectedRideId === ride.id}
                  onSelect={() => setSelectedRideId(ride.id)}
                  onBook={() => bookRide(ride)}
                  booking={bookingRideId === ride.id}
                />
              ))
            )}
          </div>
        </div>
      </div>

      {/* Mobile vehicle picker */}
      <Card className="lg:hidden">
        <p className="mb-2 text-[11px] font-semibold uppercase tracking-wide text-gray-400">Ride type</p>
        <VehicleTypePicker value={vehicleType} onChange={handleVehicleChange} layout="horizontal" />
      </Card>

      {activeBooking && (
        <BookingStatusCard booking={activeBooking} onCancel={cancelBooking} />
      )}
    </div>
  );
}
