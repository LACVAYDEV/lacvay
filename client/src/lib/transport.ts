import type { TransportType } from '@/types';

export interface TransportOption {
  type: TransportType;
  label: string;
  /** Longer description used in guides and listings. */
  description: string;
  /** Public modes a commuter can estimate a fare for. */
  hasFareEstimate: boolean;
  /** Legacy flag — in-app booking removed; see Ride Guide for Angkas/taxi apps. */
  isBookable: boolean;
}

export const transportOptions: TransportOption[] = [
  {
    type: 'jeepney',
    label: 'Jeepney',
    description: 'Fixed-route public transport along main roads and terminals.',
    hasFareEstimate: true,
    isBookable: false,
  },
  {
    type: 'tricycle',
    label: 'Tricycle',
    description: 'Operates within registered TODA territories — view coverage areas on the map.',
    hasFareEstimate: true,
    isBookable: false,
  },
  {
    type: 'motorcycle',
    label: 'Motorcycle',
    description: 'Motorcycle taxi (habal-habal) — book via Angkas; see Ride Guide.',
    hasFareEstimate: true,
    isBookable: false,
  },
  {
    type: 'taxi',
    label: 'Taxi',
    description: 'Metered air-conditioned rides — book via Grab or local taxi; see Ride Guide.',
    hasFareEstimate: true,
    isBookable: false,
  },
  {
    type: 'private',
    label: 'Private',
    description: 'Private car hire or your own vehicle.',
    hasFareEstimate: false,
    isBookable: false,
  },
  {
    type: 'walking',
    label: 'Walk',
    description: 'Short distances on foot.',
    hasFareEstimate: false,
    isBookable: false,
  },
];

const optionsByType = new Map(transportOptions.map((o) => [o.type, o]));

export function getTransportOption(type: TransportType): TransportOption | undefined {
  return optionsByType.get(type);
}

export function getTransportLabel(type: TransportType | 'walk'): string {
  if (type === 'walk') return 'Walk';
  return optionsByType.get(type)?.label ?? type;
}

/** Options offered in the Plan Your Trip card. */
export const tripPlannerOptions = transportOptions.filter((o) => o.type !== 'walking');

/** Options offered in the Fare Checker. */
export const fareCheckerOptions = transportOptions.filter((o) => o.hasFareEstimate);

/** @deprecated In-app booking removed — use Ride Guide for Angkas and taxi apps. */
export const bookableOptions = transportOptions.filter((o) => o.isBookable);

/** Taxi and habal-habal — bookable through the dedicated booking page. */
export const onDemandRideOptions = transportOptions.filter(
  (o): o is TransportOption & { type: 'motorcycle' | 'taxi' } =>
    o.type === 'motorcycle' || o.type === 'taxi',
);

export function isOnDemandVehicle(type: string): type is 'motorcycle' | 'taxi' {
  return type === 'motorcycle' || type === 'taxi';
}

export function isTricycleMode(type: string): type is 'tricycle' {
  return type === 'tricycle';
}
