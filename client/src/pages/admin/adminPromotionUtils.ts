import type { Promotion } from '@/types';

export const emptyPromotion = (): Omit<Promotion, 'id'> => ({
  title: '',
  description: '',
  promoCode: '',
  discount: '',
  imageUrl: '',
  validUntil: '',
  isActive: true,
});

export function isPromotionExpired(validUntil?: string): boolean {
  if (!validUntil) return false;
  return validUntil < new Date().toISOString().slice(0, 10);
}
