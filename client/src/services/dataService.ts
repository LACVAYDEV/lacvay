import { commuteGuides, rides, externalProviders, mockUser } from '@/data/mockData';
import type { TouristSpot, Restaurant, CommuteGuide, Ride, ExternalProvider, Promotion, SearchResult, TouristCategory, RestaurantCuisine, User } from '@/types';
import { supabase } from '@/lib/supabase';
import { contentRepository } from '@/services/contentRepository';

export const dataService = {
  getUser(): Promise<User> {
    return Promise.resolve(mockUser);
  },

  getTouristSpots(category?: TouristCategory): Promise<TouristSpot[]> {
    return contentRepository.getTouristSpots(category);
  },

  getTouristSpot(id: string): Promise<TouristSpot | undefined> {
    return contentRepository.getTouristSpot(id);
  },

  getRestaurants(cuisine?: RestaurantCuisine): Promise<Restaurant[]> {
    return contentRepository.getRestaurants(cuisine);
  },

  getRestaurant(id: string): Promise<Restaurant | undefined> {
    return contentRepository.getRestaurant(id);
  },

  getCommuteGuides(): Promise<CommuteGuide[]> {
    return Promise.resolve(commuteGuides);
  },

  getCommuteGuide(id: string): Promise<CommuteGuide | undefined> {
    return Promise.resolve(commuteGuides.find((g) => g.id === id));
  },

  async getExternalProviders(): Promise<ExternalProvider[]> {
    try {
      const { data, error } = await supabase
        .from('external_providers')
        .select('*')
        .eq('is_active', true);
      if (!error && data && data.length > 0) {
        return data.map((item) => {
          const matched = externalProviders.find(
            (p) => p.provider_name.toLowerCase() === item.provider_name.toLowerCase()
          );
          return {
            ...item,
            logo_url: item.logo_url || matched?.logo_url,
            tag: matched?.tag,
            features: matched?.features,
            coverageArea: matched?.coverageArea,
            highlight: matched?.highlight,
            ctaText: matched?.ctaText,
          };
        });
      }
    } catch {
      // Fall back to mock external providers
    }
    return externalProviders;
  },

  getRides(): Promise<Ride[]> {
    return Promise.resolve(rides);
  },

  getPromotions(): Promise<Promotion[]> {
    return contentRepository.getPromotions();
  },

  search(query: string): Promise<SearchResult[]> {
    const q = query.toLowerCase().trim();
    if (!q) return Promise.resolve([]);
    return contentRepository.getSearchIndex().then((index) =>
      index.filter(
        (item) => item.title.toLowerCase().includes(q) || item.subtitle.toLowerCase().includes(q),
      ),
    );
  },
};
