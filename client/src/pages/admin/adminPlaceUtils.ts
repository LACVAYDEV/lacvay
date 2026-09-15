import type { TouristCategory, TouristSpot } from '@/types';

export const placeCategories: TouristCategory[] = [
  'Nature',
  'Historical',
  'Beach',
  'Food',
  'Adventure',
  'Family',
  'Cultural',
];

export const emptySpot = (): Omit<TouristSpot, 'id'> => ({
  name: '',
  description: '',
  shortDescription: '',
  category: 'Nature',
  imageUrl: '/images/spot-taal.jpg',
  location: 'Batangas City',
  coordinates: { lat: 13.7565, lng: 121.0583 },
  rating: 4.5,
  openingHours: '8:00 AM – 5:00 PM',
  estimatedTravelTime: '30 min from city center',
});
