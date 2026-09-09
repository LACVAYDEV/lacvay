import { supabase } from '@/lib/supabase';
import type { UserFavorite, Place } from '@/types';

export interface UserFavoriteWithPlace extends UserFavorite {
  place: Place;
}

export const favoritesService = {
  /**
   * Toggles a user's favorite status for a given place.
   * If already favorited, deletes the record and returns false.
   * If not favorited, inserts the record and returns true.
   */
  async toggleFavorite(userId: string, placeId: string): Promise<boolean> {
    if (!userId || !placeId) {
      throw new Error('userId and placeId are required');
    }

    // Check if favorite already exists
    const { data: existing, error: checkError } = await supabase
      .from('user_favorites')
      .select('id')
      .eq('user_id', userId)
      .eq('place_id', placeId)
      .maybeSingle();

    if (checkError) {
      console.error('Error checking favorite status:', checkError);
      throw checkError;
    }

    if (existing) {
      // Remove favorite
      const { error: deleteError } = await supabase
        .from('user_favorites')
        .delete()
        .eq('id', existing.id);

      if (deleteError) {
        console.error('Error removing favorite:', deleteError);
        throw deleteError;
      }
      return false;
    } else {
      // Add favorite
      const { error: insertError } = await supabase
        .from('user_favorites')
        .insert({
          user_id: userId,
          place_id: placeId,
        });

      if (insertError) {
        console.error('Error adding favorite:', insertError);
        throw insertError;
      }
      return true;
    }
  },

  /**
   * Fetches all favorites for a user joined with place details.
   */
  async getUserFavorites(userId: string): Promise<UserFavorite[]> {
    if (!userId) return [];

    const { data, error } = await supabase
      .from('user_favorites')
      .select(`
        id,
        user_id,
        place_id,
        created_at,
        places (*)
      `)
      .eq('user_id', userId)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching user favorites:', error);
      throw error;
    }

    return (data || []).map((item: any) => {
      const place = (item.places || item.place || null) as Place | null;
      return {
        id: item.id,
        user_id: item.user_id,
        place_id: item.place_id,
        created_at: item.created_at ?? undefined,
        places: place ?? undefined,
        place: place ?? undefined,
      };
    });
  },

  /**
   * Fetches an array of place IDs that the user has favorited.
   * Useful for quick O(1) membership lookups in lists.
   */
  async getUserFavoritePlaceIds(userId: string): Promise<string[]> {
    if (!userId) return [];

    const { data, error } = await supabase
      .from('user_favorites')
      .select('place_id')
      .eq('user_id', userId);

    if (error) {
      console.error('Error fetching favorite place IDs:', error);
      return [];
    }

    return (data || []).map((row) => row.place_id);
  },

  /**
   * Checks whether a single place is favorited by the user.
   */
  async checkIsFavorite(userId: string, placeId: string): Promise<boolean> {
    if (!userId || !placeId) return false;

    const { data, error } = await supabase
      .from('user_favorites')
      .select('id')
      .eq('user_id', userId)
      .eq('place_id', placeId)
      .maybeSingle();

    if (error) {
      console.error('Error checking single favorite:', error);
      return false;
    }

    return !!data;
  },
};
