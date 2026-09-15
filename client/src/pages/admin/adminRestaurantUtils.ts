import type { Restaurant, RestaurantCuisine } from '@/types';

export const cuisineOptions: RestaurantCuisine[] = [
  'Filipino',
  'Fast Food',
  'Cafe',
  'Seafood',
  'Budget',
  'Family',
  'Fine Dining',
];

export const emptyRestaurant = (): Omit<Restaurant, 'id'> => ({
  name: '',
  description: '',
  cuisine: ['Filipino'],
  imageUrl: '/images/food-lomi.jpg',
  location: 'Batangas City',
  coordinates: { lat: 13.7565, lng: 121.0583 },
  rating: 4.5,
  distanceKm: 2,
  priceRange: '₱₱',
  isOpen: true,
  openingHours: '8:00 AM – 9:00 PM',
});

export function parseCuisineInput(input: string): RestaurantCuisine[] {
  const parsed = input
    .split(',')
    .map((c) => c.trim())
    .filter(Boolean) as RestaurantCuisine[];
  return parsed.length ? parsed : ['Filipino'];
}
