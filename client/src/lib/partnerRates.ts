/** Calculate fare from a transport partner's published rates. */
export function calculatePartnerFare(
  baseFare: number,
  perKmFee: number,
  distanceKm: number,
): number {
  return Math.round(baseFare + perKmFee * Math.max(0, distanceKm));
}

export function formatRateSummary(baseFare: number, perKmFee: number): string {
  return `₱${baseFare} base + ₱${perKmFee}/km`;
}

/** Mock trip distance from pickup/destination labels (demo until geocoding exists). */
export function estimateTripDistanceKm(pickup: string, destination: string): number {
  const key = `${pickup.trim().toLowerCase()}|${destination.trim().toLowerCase()}`;
  let hash = 0;
  for (let i = 0; i < key.length; i += 1) {
    hash = (hash * 31 + key.charCodeAt(i)) % 1000;
  }
  return 1.5 + (hash % 80) / 10;
}

export function validatePartnerBaseFare(value: number): string | null {
  if (!Number.isFinite(value) || value <= 0) return 'Enter a base fare greater than ₱0';
  if (value > 500) return 'Base fare seems too high — check your amount';
  return null;
}

export function validatePartnerPerKmFee(value: number): string | null {
  if (!Number.isFinite(value) || value <= 0) return 'Enter a per-km fee greater than ₱0';
  if (value > 100) return 'Per-km fee seems too high — check your amount';
  return null;
}

/** Default suggested rates when a partner signs up. */
export const defaultPartnerRates: Record<'motorcycle' | 'taxi', { baseFare: number; perKmFee: number }> = {
  motorcycle: { baseFare: 25, perKmFee: 8 },
  taxi: { baseFare: 40, perKmFee: 15 },
};
