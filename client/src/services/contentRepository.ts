import { supabase } from '@/lib/supabase';
import {
  PLACE_TYPE_RESTAURANT,
  PLACE_TYPE_TOURIST,
  placeToRestaurant,
  placeToTouristSpot,
  promotionRowToPromotion,
  promotionToRow,
  restaurantToPlaceRow,
  touristSpotToPlaceRow,
} from '@/lib/placeMappers';
import type { Promotion, Restaurant, SearchResult, TouristCategory, TouristSpot } from '@/types';

export const contentRepository = {
  async getTouristSpots(category?: TouristCategory): Promise<TouristSpot[]> {
    const { data, error } = await supabase
      .from('places')
      .select('*')
      .contains('metadata', { place_type: PLACE_TYPE_TOURIST });
    if (error) throw error;
    let spots = (data ?? []).map(placeToTouristSpot);
    if (category) spots = spots.filter((s) => s.category === category);
    return spots;
  },

  async getTouristSpot(id: string): Promise<TouristSpot | undefined> {
    const { data, error } = await supabase.from('places').select('*').eq('id', id).maybeSingle();
    if (error) throw error;
    if (data && (data.metadata as Record<string, unknown>)?.place_type === PLACE_TYPE_TOURIST) {
      return placeToTouristSpot(data);
    }
    return undefined;
  },

  async saveTouristSpot(spot: TouristSpot): Promise<TouristSpot> {
    const row = touristSpotToPlaceRow(spot);
    const { data, error } = await supabase.from('places').upsert(row).select('*').single();
    if (error) throw error;
    return placeToTouristSpot(data);
  },

  async createTouristSpot(partial: Omit<TouristSpot, 'id'>): Promise<TouristSpot> {
    const { data, error } = await supabase.from('places').insert(touristSpotToPlaceRow(partial)).select('*').single();
    if (error) throw error;
    return placeToTouristSpot(data);
  },

  async deleteTouristSpot(id: string): Promise<void> {
    const { error } = await supabase.from('places').delete().eq('id', id);
    if (error) throw error;
  },

  async getRestaurants(): Promise<Restaurant[]> {
    const { data, error } = await supabase
      .from('places')
      .select('*')
      .contains('metadata', { place_type: PLACE_TYPE_RESTAURANT });
    if (error) throw error;
    return (data ?? []).map(placeToRestaurant);
  },

  async getRestaurant(id: string): Promise<Restaurant | undefined> {
    const { data, error } = await supabase.from('places').select('*').eq('id', id).maybeSingle();
    if (error) throw error;
    if (data && (data.metadata as Record<string, unknown>)?.place_type === PLACE_TYPE_RESTAURANT) {
      return placeToRestaurant(data);
    }
    return undefined;
  },

  async saveRestaurant(restaurant: Restaurant): Promise<Restaurant> {
    const { data, error } = await supabase.from('places').upsert(restaurantToPlaceRow(restaurant)).select('*').single();
    if (error) throw error;
    return placeToRestaurant(data);
  },

  async createRestaurant(partial: Omit<Restaurant, 'id'>): Promise<Restaurant> {
    const { data, error } = await supabase.from('places').insert(restaurantToPlaceRow(partial)).select('*').single();
    if (error) throw error;
    return placeToRestaurant(data);
  },

  async deleteRestaurant(id: string): Promise<void> {
    const { error } = await supabase.from('places').delete().eq('id', id);
    if (error) throw error;
  },

  async getPromotions(): Promise<Promotion[]> {
    const { data, error } = await supabase
      .from('promotions')
      .select('*')
      .eq('is_active', true)
      .order('created_at', { ascending: false });
    if (error) throw error;
    return (data ?? []).map(promotionRowToPromotion);
  },

  async getPromotionsForAdmin(): Promise<Promotion[]> {
    const { data, error } = await supabase
      .from('promotions')
      .select('*')
      .order('created_at', { ascending: false });
    if (error) throw error;
    return (data ?? []).map(promotionRowToPromotion);
  },

  async getPromotion(id: string): Promise<Promotion | undefined> {
    const { data, error } = await supabase.from('promotions').select('*').eq('id', id).maybeSingle();
    if (error) throw error;
    return data ? promotionRowToPromotion(data) : undefined;
  },

  async savePromotion(promotion: Promotion): Promise<Promotion> {
    const { data, error } = await supabase.from('promotions').upsert(promotionToRow(promotion)).select('*').single();
    if (error) throw error;
    return promotionRowToPromotion(data);
  },

  async createPromotion(partial: Omit<Promotion, 'id'>): Promise<Promotion> {
    const { data, error } = await supabase.from('promotions').insert(promotionToRow(partial)).select('*').single();
    if (error) throw error;
    return promotionRowToPromotion(data);
  },

  async deletePromotion(id: string): Promise<void> {
    const { error } = await supabase.from('promotions').delete().eq('id', id);
    if (error) throw error;
  },

  async getSearchIndex(): Promise<SearchResult[]> {
    const [spots, restaurants] = await Promise.all([this.getTouristSpots(), this.getRestaurants()]);
    return [
      ...spots.map((s) => ({
        id: s.id,
        type: 'tourist-spot' as const,
        title: s.name,
        subtitle: s.location || 'Batangas City',
        path: `/tourist-spots/${s.id}`,
      })),
      ...restaurants.map((r) => ({
        id: r.id,
        type: 'restaurant' as const,
        title: r.name,
        subtitle: r.location || 'Batangas City',
        path: '/restaurants',
      })),
    ];
  },

  async resetToDefaults(): Promise<void> {
    await this.clearAllPlaces();
    await this.clearAllPromotions();
  },

  async clearAllPlaces(): Promise<void> {
    const { data: all, error: selectError } = await supabase.from('places').select('id');
    if (selectError) throw selectError;
    if (all && all.length > 0) {
      const ids = all.map((p) => p.id);
      const { error } = await supabase.from('places').delete().in('id', ids);
      if (error) throw error;
    }
  },

  async clearAllPromotions(): Promise<void> {
    const { data: all, error: selectError } = await supabase.from('promotions').select('id');
    if (selectError) throw selectError;
    if (all && all.length > 0) {
      const ids = all.map((p) => p.id);
      const { error } = await supabase.from('promotions').delete().in('id', ids);
      if (error) throw error;
    }
  },

  async getStats(): Promise<{ places: number; restaurants: number; promotions: number; lastUpdated: string; source: 'supabase' }> {
    const [spots, restaurants, promotions] = await Promise.all([
      this.getTouristSpots(),
      this.getRestaurants(),
      this.getPromotionsForAdmin(),
    ]);
    return {
      places: spots.length,
      restaurants: restaurants.length,
      promotions: promotions.length,
      lastUpdated: new Date().toISOString(),
      source: 'supabase',
    };
  },
};
