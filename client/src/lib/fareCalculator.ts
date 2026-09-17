import type { TransportType, FareEstimate, RouteStep } from '@/types';
import { getTransportLabel } from '@/lib/transport';

const FARE_RATES: Record<TransportType, { base: number; perKm: number }> = {
  jeepney: { base: 14, perKm: 2 },
  tricycle: { base: 20, perKm: 8 },
  motorcycle: { base: 25, perKm: 9 },
  taxi: { base: 40, perKm: 15 },
  private: { base: 0, perKm: 12 },
  walking: { base: 0, perKm: 0 },
};

interface DocumentedJeepneyFare {
  origins: string[];
  destinations: string[];
  regularFare: number;
}

// Regular fares transcribed from FARE PRICES .docx. Documented ₱13
// minimum-fare legs are updated to the current ₱14 minimum.
const DOCUMENTED_JEEPNEY_FARES: DocumentedJeepneyFare[] = [
  {
    origins: ['grand terminal', 'batangas city grand terminal'],
    destinations: ['minor basilica', 'basilica of the immaculate conception'],
    regularFare: 18,
  },
  {
    origins: ['pier', 'batangas pier', 'batangas port', 'port of batangas'],
    destinations: ['minor basilica', 'basilica of the immaculate conception'],
    regularFare: 14,
  },
  {
    origins: ['grand terminal', 'batangas city grand terminal'],
    destinations: ['sm batangas', 'sm city batangas'],
    regularFare: 32,
  },
  {
    origins: ['pier', 'batangas pier', 'batangas port', 'port of batangas'],
    destinations: ['sm batangas', 'sm city batangas'],
    regularFare: 14,
  },
  {
    origins: ['sm batangas', 'sm city batangas'],
    destinations: ['monte maria'],
    regularFare: 60,
  },
  {
    origins: ['sm batangas', 'sm city batangas'],
    destinations: ['playa montana', 'playa monatana'],
    regularFare: 60,
  },
  {
    origins: ['sm batangas', 'sm city batangas'],
    destinations: ['kay butas'],
    regularFare: 60,
  },
  {
    origins: ['grand terminal', 'batangas city grand terminal'],
    destinations: ["lolo's place", 'lolos place'],
    regularFare: 32,
  },
  {
    origins: ['grand terminal', 'batangas city grand terminal'],
    destinations: ['museo puntong batangan'],
    regularFare: 18,
  },
  {
    origins: ['pier', 'batangas pier', 'batangas port', 'port of batangas'],
    destinations: ['museo puntong batangan'],
    regularFare: 14,
  },
  {
    origins: ['grand terminal', 'batangas city grand terminal'],
    destinations: ['pontefino'],
    regularFare: 67,
  },
  {
    origins: ['pier', 'batangas pier', 'batangas port', 'port of batangas'],
    destinations: ['pontefino'],
    regularFare: 58,
  },
  {
    origins: ['grand terminal', 'batangas city grand terminal', 'pier', 'batangas pier', 'batangas port'],
    destinations: ['mangrove ecopark', 'malitam mangrove'],
    regularFare: 44,
  },
];

const AVERAGE_SPEED_KMH: Record<TransportType, number> = {
  jeepney: 18,
  tricycle: 22,
  motorcycle: 30,
  taxi: 25,
  private: 25,
  walking: 5,
};

function normalizeLocation(value: string): string {
  return value
    .toLowerCase()
    .normalize('NFKD')
    .replace(/['’]/g, '')
    .replace(/[^a-z0-9]+/g, ' ')
    .trim();
}

function matchesLocation(value: string, aliases: string[]): boolean {
  const normalized = normalizeLocation(value);
  return aliases.some((alias) => normalized.includes(normalizeLocation(alias)));
}

function getDocumentedJeepneyFare(origin: string, destination: string): number | null {
  const route = DOCUMENTED_JEEPNEY_FARES.find(
    (fare) =>
      (matchesLocation(origin, fare.origins) && matchesLocation(destination, fare.destinations))
      || (matchesLocation(destination, fare.origins) && matchesLocation(origin, fare.destinations)),
  );
  return route?.regularFare ?? null;
}

function calculateTraditionalJeepneyFare(distanceKm: number): number {
  const succeedingKilometres = Math.max(0, Math.ceil(distanceKm - 4));
  return 14 + succeedingKilometres * 2;
}

export function estimateDistanceKm(origin: string, destination: string): number {
  const seed = (origin + destination).split('').reduce((a, c) => a + c.charCodeAt(0), 0);
  return Math.round(((seed % 80) / 10 + 1.5) * 10) / 10;
}

export function calculateFare(
  origin: string,
  destination: string,
  transportType: TransportType,
  distanceKm?: number,
): FareEstimate {
  const distance = distanceKm ?? estimateDistanceKm(origin, destination);
  const rate = FARE_RATES[transportType];
  const documentedFare = transportType === 'jeepney'
    ? getDocumentedJeepneyFare(origin, destination)
    : null;
  const raw = transportType === 'jeepney'
    ? calculateTraditionalJeepneyFare(distance)
    : rate.base + rate.perKm * distance;
  const min = documentedFare ?? (
    transportType === 'jeepney'
      ? raw
      : Math.max(rate.base, Math.round(raw * 0.85))
  );
  const max = documentedFare ?? (
    transportType === 'jeepney'
      ? raw
      : Math.round(raw * 1.15)
  );
  const speedKmh = AVERAGE_SPEED_KMH[transportType];
  const estimatedTravelTimeMin = Math.max(5, Math.round((distance / speedKmh) * 60));

  return {
    origin,
    destination,
    transportType,
    distanceKm: distance,
    estimatedFareMin: min,
    estimatedFareMax: max,
    estimatedTravelTimeMin,
    isExactFare: documentedFare !== null,
  };
}

export function buildMockRoute(
  origin: string,
  destination: string,
  transportType: TransportType,
): {
  steps: RouteStep[];
  totalDurationMin: number;
  totalDistanceKm: number;
  estimatedFareMin: number;
  estimatedFareMax: number;
  transfers: number;
} {
  const fare = calculateFare(origin, destination, transportType);

  if (transportType === 'walking') {
    return {
      steps: [
        { type: 'walk', instruction: `Walk to ${destination}`, durationMin: fare.estimatedTravelTimeMin, distanceKm: fare.distanceKm },
      ],
      totalDurationMin: fare.estimatedTravelTimeMin,
      totalDistanceKm: fare.distanceKm,
      estimatedFareMin: 0,
      estimatedFareMax: 0,
      transfers: 0,
    };
  }

  const steps: RouteStep[] = [
    { type: 'walk', instruction: `Walk from ${origin}`, durationMin: 3, distanceKm: 0.2 },
  ];

  if (transportType === 'jeepney') {
    steps.push(
      { type: 'jeepney', instruction: 'Ride jeepney via Batangas City Grand Terminal route', durationMin: Math.max(10, fare.estimatedTravelTimeMin - 8), fare: fare.estimatedFareMin },
      { type: 'walk', instruction: 'Alight near destination', durationMin: 5, distanceKm: 0.4 },
    );
  } else if (transportType === 'motorcycle') {
    steps.push({ type: 'motorcycle', instruction: `Motorcycle taxi (habal-habal) straight to ${destination}`, durationMin: Math.max(4, fare.estimatedTravelTimeMin - 3), fare: fare.estimatedFareMin });
  } else {
    steps.push({
      type: transportType,
      instruction: `Direct ${getTransportLabel(transportType).toLowerCase()} ride to ${destination}`,
      durationMin: Math.max(4, fare.estimatedTravelTimeMin - 3),
      fare: fare.estimatedFareMin,
    });
  }

  steps.push({ type: 'walk', instruction: `Arrive at ${destination}`, durationMin: 2, distanceKm: 0.1 });

  const totalDurationMin = steps.reduce((sum, s) => sum + s.durationMin, 0);

  return {
    steps,
    totalDurationMin,
    totalDistanceKm: fare.distanceKm,
    estimatedFareMin: fare.estimatedFareMin,
    estimatedFareMax: fare.estimatedFareMax,
    transfers: transportType === 'jeepney' ? 1 : 0,
  };
}
