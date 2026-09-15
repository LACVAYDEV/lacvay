import { type ClassValue, clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatCurrency(amount: number): string {
  return `₱${amount.toLocaleString('en-PH')}`;
}

export function formatFareRange(min: number, max: number): string {
  if (min === max) return formatCurrency(min);
  return `${formatCurrency(min)} – ${formatCurrency(max)}`;
}

export function generateId(): string {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
}
