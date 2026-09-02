import type { ComponentType } from 'react';
import { Bus, Bike, CarTaxiFront, Car, Footprints } from 'lucide-react';
import type { TransportType } from '@/types';

export type TransportIcon = ComponentType<{ className?: string }>;

interface IconProps {
  className?: string;
  strokeWidth?: number;
}

/**
 * Lucide has no motorcycle glyph, so this follows its drawing conventions:
 * 24x24 viewBox, no fill, 2px round-capped strokes in currentColor.
 */
export function MotorcycleIcon({ className, strokeWidth = 2 }: IconProps) {
  return (
    <svg
      viewBox="0 0 24 24"
      className={className}
      fill="none"
      stroke="currentColor"
      strokeWidth={strokeWidth}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <circle cx="5" cy="17" r="3" />
      <circle cx="19" cy="17" r="3" />
      <path d="M5 14 L7 10.5 L11.5 10.5 L13 14 L16.5 14.5" />
      <path d="M13.5 7h3.5" />
      <path d="M15.3 7 16.5 14.5" />
    </svg>
  );
}

export const transportIcons: Record<TransportType, TransportIcon> = {
  jeepney: Bus,
  tricycle: Bike,
  motorcycle: MotorcycleIcon,
  taxi: CarTaxiFront,
  private: Car,
  walking: Footprints,
};

/** Route steps use 'walk' rather than the 'walking' transport type. */
export function getStepIcon(type: TransportType | 'walk'): TransportIcon {
  return type === 'walk' ? Footprints : transportIcons[type];
}
