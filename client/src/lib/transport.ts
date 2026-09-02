import type { TransportType } from '@/types';

export interface TransportOption {
  type: TransportType;
  label: string;
  /** Longer description used in guides and listings. */
  description: string;
  /** Public modes a commuter can estimate a fare for. */
  hasFareEstimate: boolean;
  /** Modes that can be booked through Book a Ride. */
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
    description: 'Short trips within barangays and to nearby destinations.',
    hasFareEstimate: true,
    isBookable: true,
  },
  {
    type: 'motorcycle',
    label: 'Motorcycle',
    description: 'Motorcycle taxi (habal-habal) riders for quick solo trips.',
    hasFareEstimate: true,
    isBookable: true,
  },
  {
    type: 'taxi',
    label: 'Taxi',
    description: 'Metered air-conditioned rides across the city.',
    hasFareEstimate: true,
    isBookable: true,
  },
  {
    type: 'private',
    label: 'Private',
    description: 'Private car hire or your own vehicle.',
    hasFareEstimate: false,
    isBookable: true,
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

/** Options offered in Book a Ride. */
export const bookableOptions = transportOptions.filter((o) => o.isBookable);
