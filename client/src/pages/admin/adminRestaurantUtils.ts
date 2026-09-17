import type { Restaurant } from '@/types';

export const emptyRestaurant = (): Omit<Restaurant, 'id'> => ({
  name: '',
  description: '',
  imageUrl: '',
  location: 'Batangas City',
  coordinates: { lat: 13.7565, lng: 121.0583 },
  priceRange: '₱₱',
  openTime: '08:00',
  closeTime: '21:00',
});
