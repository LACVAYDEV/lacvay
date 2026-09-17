import type { TouristCategory, TouristSpot } from '@/types';

export const placeCategories: TouristCategory[] = [
  'Nature',
  'Historical',
  'Beach',
  'Food',
  'Adventure',
  'Family',
  'Cultural',
  'Establishment',
  'Others',
];

export const emptySpot = (): Omit<TouristSpot, 'id'> => ({
  name: '',
  description: '',
  shortDescription: '',
  category: 'Nature',
  imageUrl: '',
  location: 'Batangas City',
  coordinates: { lat: 13.7565, lng: 121.0583 },
  openTime: '08:00',
  closeTime: '17:00',
  isFeatured: false,
});
