import { touristSpots as defaultSpots, restaurants as defaultRestaurants, promotions as defaultPromotions } from '@/data/mockData';
import type { Promotion, Restaurant, SearchResult, TouristCategory, TouristSpot } from '@/types';
import { generateId } from '@/lib/utils';

const STORAGE_KEY = 'lacvay-managed-content';

interface ManagedContent {
  touristSpots: TouristSpot[];
  restaurants: Restaurant[];
  promotions: Promotion[];
  updatedAt: string;
}

function seedContent(): ManagedContent {
  return {
    touristSpots: structuredClone(defaultSpots),
    restaurants: structuredClone(defaultRestaurants),
    promotions: structuredClone(defaultPromotions),
    updatedAt: new Date().toISOString(),
  };
}

function readStore(): ManagedContent {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return seedContent();
    const parsed = JSON.parse(raw) as ManagedContent;
    return {
      touristSpots: parsed.touristSpots?.length ? parsed.touristSpots : seedContent().touristSpots,
      restaurants: parsed.restaurants?.length ? parsed.restaurants : seedContent().restaurants,
      promotions: parsed.promotions?.length ? parsed.promotions : seedContent().promotions,
      updatedAt: parsed.updatedAt ?? new Date().toISOString(),
    };
  } catch {
    return seedContent();
  }
}

function writeStore(content: ManagedContent): void {
  localStorage.setItem(STORAGE_KEY, JSON.stringify({ ...content, updatedAt: new Date().toISOString() }));
}

function buildSearchIndex(spots: TouristSpot[], restaurants: Restaurant[]): SearchResult[] {
  return [
    ...spots.map((s) => ({
      id: s.id,
      type: 'tourist-spot' as const,
      title: s.name,
      subtitle: s.location,
      path: `/tourist-spots/${s.id}`,
    })),
    ...restaurants.map((r) => ({
      id: r.id,
      type: 'restaurant' as const,
      title: r.name,
      subtitle: r.location,
      path: '/restaurants',
    })),
  ];
}

export const contentStore = {
  getSnapshot(): ManagedContent {
    return readStore();
  },

  resetToDefaults(): ManagedContent {
    const content = seedContent();
    writeStore(content);
    return content;
  },

  getTouristSpots(category?: TouristCategory): TouristSpot[] {
    const { touristSpots } = readStore();
    return category ? touristSpots.filter((s) => s.category === category) : touristSpots;
  },

  getTouristSpot(id: string): TouristSpot | undefined {
    return readStore().touristSpots.find((s) => s.id === id);
  },

  saveTouristSpot(spot: TouristSpot): TouristSpot {
    const store = readStore();
    const index = store.touristSpots.findIndex((s) => s.id === spot.id);
    if (index >= 0) store.touristSpots[index] = spot;
    else store.touristSpots.unshift(spot);
    writeStore(store);
    return spot;
  },

  deleteTouristSpot(id: string): void {
    const store = readStore();
    store.touristSpots = store.touristSpots.filter((s) => s.id !== id);
    writeStore(store);
  },

  createTouristSpot(partial: Omit<TouristSpot, 'id'>): TouristSpot {
    return this.saveTouristSpot({ ...partial, id: generateId() });
  },

  getRestaurants(): Restaurant[] {
    return readStore().restaurants;
  },

  getRestaurant(id: string): Restaurant | undefined {
    return readStore().restaurants.find((r) => r.id === id);
  },

  saveRestaurant(restaurant: Restaurant): Restaurant {
    const store = readStore();
    const index = store.restaurants.findIndex((r) => r.id === restaurant.id);
    if (index >= 0) store.restaurants[index] = restaurant;
    else store.restaurants.unshift(restaurant);
    writeStore(store);
    return restaurant;
  },

  deleteRestaurant(id: string): void {
    const store = readStore();
    store.restaurants = store.restaurants.filter((r) => r.id !== id);
    writeStore(store);
  },

  createRestaurant(partial: Omit<Restaurant, 'id'>): Restaurant {
    return this.saveRestaurant({ ...partial, id: generateId() });
  },

  getPromotions(): Promotion[] {
    return readStore().promotions;
  },

  savePromotion(promotion: Promotion): Promotion {
    const store = readStore();
    const index = store.promotions.findIndex((p) => p.id === promotion.id);
    if (index >= 0) store.promotions[index] = promotion;
    else store.promotions.unshift(promotion);
    writeStore(store);
    return promotion;
  },

  deletePromotion(id: string): void {
    const store = readStore();
    store.promotions = store.promotions.filter((p) => p.id !== id);
    writeStore(store);
  },

  createPromotion(partial: Omit<Promotion, 'id'>): Promotion {
    return this.savePromotion({ ...partial, id: generateId() });
  },

  getSearchIndex(): SearchResult[] {
    const store = readStore();
    return buildSearchIndex(store.touristSpots, store.restaurants);
  },
};
