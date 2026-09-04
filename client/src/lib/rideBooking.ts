import type { OnDemandVehicle, Ride } from '@/types';
import { onDemandRideOptions } from '@/lib/transport';
import { calculatePartnerFare } from '@/lib/partnerRates';

export const typicalFareRanges: Record<OnDemandVehicle, { min: number; max: number; note: string }> = {
  motorcycle: { min: 25, max: 90, note: 'Fastest for solo passengers — habal-habal' },
  taxi: { min: 40, max: 250, note: 'Metered, good for groups & luggage' },
};

export function filterOnDemandRides(rides: Ride[], vehicleType: OnDemandVehicle): Ride[] {
  return rides
    .filter((r) => r.vehicleType === vehicleType && r.isOnline)
    .sort((a, b) => a.distanceKm - b.distanceKm || a.etaMin - b.etaMin);
}

export function withTripFare(rides: Ride[], tripDistanceKm: number): Ride[] {
  return rides.map((ride) => ({
    ...ride,
    estimatedFare: calculatePartnerFare(ride.baseFare, ride.perKmFee, tripDistanceKm),
  }));
}

export function getOnDemandOption(type: OnDemandVehicle) {
  return onDemandRideOptions.find((o) => o.type === type)!;
}

export function driverInitials(name: string): string {
  const parts = name.replace(/['"]/g, '').split(/\s+/).filter(Boolean);
  if (parts.length === 0) return '?';
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return `${parts[0][0]}${parts[parts.length - 1][0]}`.toUpperCase();
}
