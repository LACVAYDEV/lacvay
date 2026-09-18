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
  category: '' as TouristCategory,
  imageUrl: '',
  location: '',
  coordinates: { lat: 0, lng: 0 },
  openTime: '',
  closeTime: '',
  isFeatured: false,
});
