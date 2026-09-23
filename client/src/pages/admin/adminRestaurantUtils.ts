import type { Restaurant } from '@/types';

export const emptyRestaurant = (): Omit<Restaurant, 'id'> => ({
  name: '',
  description: '',
  imageUrl: '',
  location: '',
  coordinates: { lat: 0, lng: 0 },
  priceRange: '',
  openTime: '',
  closeTime: '',
  isFeatured: false,
});
