import { touristSpots, restaurants, commuteGuides, rides, externalProviders, promotions, searchIndex, mockUser } from '@/data/mockData';
import type { TouristSpot, Restaurant, CommuteGuide, Ride, ExternalProvider, Promotion, SearchResult, TouristCategory, RestaurantCuisine, User } from '@/types';
import { supabase } from '@/lib/supabase';

export const dataService = {
  getUser(): Promise<User> {
    return Promise.resolve(mockUser);
  },

  getTouristSpots(category?: TouristCategory): Promise<TouristSpot[]> {
    const spots = category ? touristSpots.filter((s) => s.category === category) : touristSpots;
    return Promise.resolve(spots);
  },

  getTouristSpot(id: string): Promise<TouristSpot | undefined> {
    return Promise.resolve(touristSpots.find((s) => s.id === id));
  },

  getRestaurants(cuisine?: RestaurantCuisine): Promise<Restaurant[]> {
    const list = cuisine ? restaurants.filter((r) => r.cuisine.includes(cuisine)) : restaurants;
    return Promise.resolve(list);
  },

  getRestaurant(id: string): Promise<Restaurant | undefined> {
    return Promise.resolve(restaurants.find((r) => r.id === id));
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
    return Promise.resolve(promotions);
  },

  search(query: string): Promise<SearchResult[]> {
    const q = query.toLowerCase().trim();
    if (!q) return Promise.resolve([]);
    return Promise.resolve(
      searchIndex.filter(
        (item) => item.title.toLowerCase().includes(q) || item.subtitle.toLowerCase().includes(q),
      ),
    );
  },
};
