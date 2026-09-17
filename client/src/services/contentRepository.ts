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
import { contentStore } from '@/services/contentStore';
import type { Promotion, Restaurant, SearchResult, TouristCategory, TouristSpot } from '@/types';

let useSupabase = true;

function isMissingSchemaError(error: { message?: string; code?: string } | null): boolean {
  if (!error) return false;
  const msg = error.message?.toLowerCase() ?? '';
  return (
    error.code === 'PGRST205' ||
    error.code === '42P01' ||
    msg.includes('does not exist') ||
    msg.includes('could not find') ||
    msg.includes('column') ||
    msg.includes('permission denied')
  );
}

function disableSupabase(reason: unknown): void {
  useSupabase = false;
  console.warn('[contentRepository] Falling back to local storage:', reason);
}

async function fetchTouristSpotsFromDb(category?: TouristCategory): Promise<TouristSpot[] | null> {
  const { data, error } = await supabase
    .from('places')
    .select('*')
    .contains('metadata', { place_type: PLACE_TYPE_TOURIST });
  if (error) {
    if (isMissingSchemaError(error)) disableSupabase(error);
    return null;
  }
  let spots = (data ?? []).map(placeToTouristSpot);
  if (category) spots = spots.filter((s) => s.category === category);
  return spots;
}

async function fetchRestaurantsFromDb(): Promise<Restaurant[] | null> {
  const { data, error } = await supabase
    .from('places')
    .select('*')
    .contains('metadata', { place_type: PLACE_TYPE_RESTAURANT });
  if (error) {
    if (isMissingSchemaError(error)) disableSupabase(error);
    return null;
  }
  return (data ?? []).map(placeToRestaurant);
}

async function fetchPromotionsFromDb(activeOnly = true): Promise<Promotion[] | null> {
  let query = supabase.from('promotions').select('*').order('created_at', { ascending: false });
  if (activeOnly) query = query.eq('is_active', true);

  const { data, error } = await query;
  if (error) {
    if (isMissingSchemaError(error)) disableSupabase(error);
    return null;
  }
  return (data ?? []).map(promotionRowToPromotion);
}

export const contentRepository = {
  async getTouristSpots(category?: TouristCategory): Promise<TouristSpot[]> {
    if (useSupabase) {
      try {
        const rows = await fetchTouristSpotsFromDb(category);
        if (rows !== null) return rows;
      } catch (err) {
        disableSupabase(err);
      }
    }
    return contentStore.getTouristSpots(category);
  },

  async getTouristSpot(id: string): Promise<TouristSpot | undefined> {
    if (useSupabase) {
      try {
        const { data, error } = await supabase.from('places').select('*').eq('id', id).maybeSingle();
        if (!error && data && (data.metadata as Record<string, unknown>)?.place_type === PLACE_TYPE_TOURIST) {
          return placeToTouristSpot(data);
        }
        if (error && isMissingSchemaError(error)) disableSupabase(error);
      } catch (err) {
        disableSupabase(err);
      }
    }
    return contentStore.getTouristSpot(id);
  },

  async saveTouristSpot(spot: TouristSpot): Promise<TouristSpot> {
    if (useSupabase) {
      try {
        const row = touristSpotToPlaceRow(spot);
        const { data, error } = await supabase.from('places').upsert(row).select('*').single();
        if (!error && data) return placeToTouristSpot(data);
        if (error) throw error;
      } catch (err) {
        if (!isMissingSchemaError(err as { message?: string })) throw err;
        disableSupabase(err);
      }
    }
    return contentStore.saveTouristSpot(spot);
  },

  async createTouristSpot(partial: Omit<TouristSpot, 'id'>): Promise<TouristSpot> {
    if (useSupabase) {
      try {
        const { data, error } = await supabase.from('places').insert(touristSpotToPlaceRow(partial)).select('*').single();
        if (!error && data) return placeToTouristSpot(data);
        if (error) throw error;
      } catch (err) {
        if (!isMissingSchemaError(err as { message?: string })) throw err;
        disableSupabase(err);
      }
    }
    return contentStore.createTouristSpot(partial);
  },

  async deleteTouristSpot(id: string): Promise<void> {
    if (useSupabase) {
      try {
        const { error } = await supabase.from('places').delete().eq('id', id);
        if (!error) return;
        if (error) throw error;
      } catch (err) {
        if (!isMissingSchemaError(err as { message?: string })) throw err;
        disableSupabase(err);
      }
    }
    contentStore.deleteTouristSpot(id);
  },

  async getRestaurants(): Promise<Restaurant[]> {
    if (useSupabase) {
      try {
        const rows = await fetchRestaurantsFromDb();
        if (rows !== null) return rows;
      } catch (err) {
        disableSupabase(err);
      }
    }
    return contentStore.getRestaurants();
  },

  async getRestaurant(id: string): Promise<Restaurant | undefined> {
    if (useSupabase) {
      try {
        const { data, error } = await supabase.from('places').select('*').eq('id', id).maybeSingle();
        if (!error && data && (data.metadata as Record<string, unknown>)?.place_type === PLACE_TYPE_RESTAURANT) {
          return placeToRestaurant(data);
        }
      } catch (err) {
        disableSupabase(err);
      }
    }
    return contentStore.getRestaurant(id);
  },

  async saveRestaurant(restaurant: Restaurant): Promise<Restaurant> {
    if (useSupabase) {
      try {
        const { data, error } = await supabase.from('places').upsert(restaurantToPlaceRow(restaurant)).select('*').single();
        if (!error && data) return placeToRestaurant(data);
        if (error) throw error;
      } catch (err) {
        if (!isMissingSchemaError(err as { message?: string })) throw err;
        disableSupabase(err);
      }
    }
    return contentStore.saveRestaurant(restaurant);
  },

  async createRestaurant(partial: Omit<Restaurant, 'id'>): Promise<Restaurant> {
    if (useSupabase) {
      try {
        const { data, error } = await supabase.from('places').insert(restaurantToPlaceRow(partial)).select('*').single();
        if (!error && data) return placeToRestaurant(data);
        if (error) throw error;
      } catch (err) {
        if (!isMissingSchemaError(err as { message?: string })) throw err;
        disableSupabase(err);
      }
    }
    return contentStore.createRestaurant(partial);
  },

  async deleteRestaurant(id: string): Promise<void> {
    if (useSupabase) {
      try {
        const { error } = await supabase.from('places').delete().eq('id', id);
        if (!error) return;
        if (error) throw error;
      } catch (err) {
        if (!isMissingSchemaError(err as { message?: string })) throw err;
        disableSupabase(err);
      }
    }
    contentStore.deleteRestaurant(id);
  },

  async getPromotions(): Promise<Promotion[]> {
    if (useSupabase) {
      try {
        const rows = await fetchPromotionsFromDb(true);
        if (rows !== null) return rows;
      } catch (err) {
        disableSupabase(err);
      }
    }
    return contentStore.getPromotions().filter((p) => p.isActive !== false);
  },

  async getPromotionsForAdmin(): Promise<Promotion[]> {
    if (useSupabase) {
      try {
        const rows = await fetchPromotionsFromDb(false);
        if (rows !== null) return rows;
      } catch (err) {
        disableSupabase(err);
      }
    }
    return contentStore.getPromotions();
  },

  async getPromotion(id: string): Promise<Promotion | undefined> {
    if (useSupabase) {
      try {
        const { data, error } = await supabase.from('promotions').select('*').eq('id', id).maybeSingle();
        if (!error && data) return promotionRowToPromotion(data);
        if (error && isMissingSchemaError(error)) disableSupabase(error);
      } catch (err) {
        disableSupabase(err);
      }
    }
    return contentStore.getPromotions().find((p) => p.id === id);
  },

  async savePromotion(promotion: Promotion): Promise<Promotion> {
    if (useSupabase) {
      try {
        const { data, error } = await supabase.from('promotions').upsert(promotionToRow(promotion)).select('*').single();
        if (!error && data) return promotionRowToPromotion(data);
        if (error) throw error;
      } catch (err) {
        if (!isMissingSchemaError(err as { message?: string })) throw err;
        disableSupabase(err);
      }
    }
    return contentStore.savePromotion(promotion);
  },

  async createPromotion(partial: Omit<Promotion, 'id'>): Promise<Promotion> {
    if (useSupabase) {
      try {
        const { data, error } = await supabase.from('promotions').insert(promotionToRow(partial)).select('*').single();
        if (!error && data) return promotionRowToPromotion(data);
        if (error) throw error;
      } catch (err) {
        if (!isMissingSchemaError(err as { message?: string })) throw err;
        disableSupabase(err);
      }
    }
    return contentStore.createPromotion(partial);
  },

  async deletePromotion(id: string): Promise<void> {
    if (useSupabase) {
      try {
        const { error } = await supabase.from('promotions').delete().eq('id', id);
        if (!error) return;
        if (error) throw error;
      } catch (err) {
        if (!isMissingSchemaError(err as { message?: string })) throw err;
        disableSupabase(err);
      }
    }
    contentStore.deletePromotion(id);
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
    if (useSupabase) {
      try {
        const { data: all } = await supabase.from('places').select('id');
        if (all && all.length > 0) {
          const ids = all.map((p) => p.id);
          const { error } = await supabase.from('places').delete().in('id', ids);
          if (error) throw error;
        }
      } catch (err) {
        if (!isMissingSchemaError(err as { message?: string })) throw err;
        disableSupabase(err);
      }
    }
    contentStore.resetToDefaults();
  },

  async clearAllPromotions(): Promise<void> {
    if (useSupabase) {
      try {
        const { data: all } = await supabase.from('promotions').select('id');
        if (all && all.length > 0) {
          const ids = all.map((p) => p.id);
          const { error } = await supabase.from('promotions').delete().in('id', ids);
          if (error) throw error;
        }
      } catch (err) {
        if (!isMissingSchemaError(err as { message?: string })) throw err;
        disableSupabase(err);
      }
    }
  },

  async getStats(): Promise<{ places: number; restaurants: number; promotions: number; lastUpdated: string; source: 'supabase' | 'local' }> {
    const [spots, restaurants, promotions] = await Promise.all([
      this.getTouristSpots(),
      this.getRestaurants(),
      this.getPromotions(),
    ]);
    return {
      places: spots.length,
      restaurants: restaurants.length,
      promotions: promotions.length,
      lastUpdated: new Date().toISOString(),
      source: useSupabase ? 'supabase' : 'local',
    };
  },

  isUsingSupabase(): boolean {
    return useSupabase;
  },
};
