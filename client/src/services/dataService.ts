import { externalProviders } from '@/data/mockData';
import { commuteGuidesService } from '@/services/commuteGuidesService';
import type { TouristSpot, Restaurant, ExternalProvider, Promotion, SearchResult, TouristCategory, GlobalCommuteGuide } from '@/types';
import { supabase } from '@/lib/supabase';
import { contentRepository } from '@/services/contentRepository';

export const dataService = {

  getTouristSpots(category?: TouristCategory): Promise<TouristSpot[]> {
    return contentRepository.getTouristSpots(category);
  },

  getTouristSpot(id: string): Promise<TouristSpot | undefined> {
    return contentRepository.getTouristSpot(id);
  },

  getRestaurants(): Promise<Restaurant[]> {
    return contentRepository.getRestaurants();
  },

  getRestaurant(id: string): Promise<Restaurant | undefined> {
    return contentRepository.getRestaurant(id);
  },

  getCommuteGuides(): Promise<GlobalCommuteGuide[]> {
    return commuteGuidesService.listGlobalGuides();
  },

  async getCommuteGuide(id: string): Promise<GlobalCommuteGuide | undefined> {
    const guides = await commuteGuidesService.listGlobalGuides();
    return guides.find((g) => g.id === id);
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
