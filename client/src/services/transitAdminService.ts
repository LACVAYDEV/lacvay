import { supabase } from '@/lib/supabase';
import type { Database } from '@/types/database.types';

export type TransitRouteRow = Database['public']['Tables']['transit_routes']['Row'];
export type TransitRouteInsert = Database['public']['Tables']['transit_routes']['Insert'];
export type TransitRouteUpdate = Database['public']['Tables']['transit_routes']['Update'];

export type RouteLandmarkRow = Database['public']['Tables']['route_landmarks']['Row'];
export type RouteLandmarkInsert = Database['public']['Tables']['route_landmarks']['Insert'];
export type RouteLandmarkUpdate = Database['public']['Tables']['route_landmarks']['Update'];

export type JeepneyFareRow = Database['public']['Tables']['jeepney_fare_matrix']['Row'];
export type JeepneyFareInsert = Database['public']['Tables']['jeepney_fare_matrix']['Insert'];
export type JeepneyFareUpdate = Database['public']['Tables']['jeepney_fare_matrix']['Update'];

export interface FixedFarePricing {
  regular?: number | null;
  discounted?: number | null;
  extraDistance?: number | null;
  extraDistanceDiscounted?: number | null;
}

export const transitAdminService = {
  // --- Transit Routes ---
  async listRoutes(): Promise<TransitRouteRow[]> {
    const { data, error } = await supabase
      .from('transit_routes')
      .select('*')
      .order('route_code', { ascending: true });

    if (error) {
      console.error('[transitAdminService] Error listing routes:', error);
      throw error;
    }
    return data ?? [];
  },

  async getRoute(id: string): Promise<TransitRouteRow | null> {
    const { data, error } = await supabase
      .from('transit_routes')
      .select('*')
      .eq('id', id)
      .maybeSingle();

    if (error) {
      console.error('[transitAdminService] Error getting route:', error);
      throw error;
    }
    return data ?? null;
  },

  async createRoute(route: TransitRouteInsert): Promise<TransitRouteRow> {
    const { data, error } = await supabase
      .from('transit_routes')
      .insert(route)
      .select('*')
      .single();

    if (error) {
      console.error('[transitAdminService] Error creating route:', error);
      throw error;
    }
    return data;
  },

  async updateRoute(id: string, updates: TransitRouteUpdate): Promise<TransitRouteRow> {
    const { data, error } = await supabase
      .from('transit_routes')
      .update(updates)
      .eq('id', id)
      .select('*')
      .single();

    if (error) {
      console.error('[transitAdminService] Error updating route:', error);
      throw error;
    }
    return data;
  },

  async deleteRoute(id: string): Promise<void> {
    const { error } = await supabase.from('transit_routes').delete().eq('id', id);
    if (error) {
      console.error('[transitAdminService] Error deleting route:', error);
      throw error;
    }
  },

  // --- Jeepney Fare Matrix ---
  async listFares(): Promise<JeepneyFareRow[]> {
    const { data, error } = await supabase
      .from('jeepney_fare_matrix')
      .select('*')
      .order('origin_landmark', { ascending: true });

    if (error) {
      console.error('[transitAdminService] Error listing fares:', error);
      throw error;
    }
    return data ?? [];
  },

  async createFare(fare: JeepneyFareInsert): Promise<JeepneyFareRow> {
    const { data, error } = await supabase
      .from('jeepney_fare_matrix')
      .insert(fare)
      .select('*')
      .single();

    if (error) {
      console.error('[transitAdminService] Error creating fare:', error);
      throw error;
    }
    return data;
  },

  async updateFare(id: string, updates: JeepneyFareUpdate): Promise<JeepneyFareRow> {
    const { data, error } = await supabase
      .from('jeepney_fare_matrix')
      .update(updates)
      .eq('id', id)
      .select('*')
      .single();

    if (error) {
      console.error('[transitAdminService] Error updating fare:', error);
      throw error;
    }
    return data;
  },

  async deleteFare(id: string): Promise<void> {
    const { error } = await supabase.from('jeepney_fare_matrix').delete().eq('id', id);
    if (error) {
      console.error('[transitAdminService] Error deleting fare:', error);
      throw error;
    }
  },

  // --- Fixed Fare Pricing Matrix ---
  async getFixedFarePricing(): Promise<FixedFarePricing | null> {
    const fares = await this.listFares();
    const standard = fares.find(
      (f) => f.origin_landmark === 'Standard Trip' || f.origin_landmark === 'Base Fare',
    );
    const extended = fares.find(
      (f) => f.origin_landmark === 'Extended Trip' || f.origin_landmark === 'Extra Distance',
    );

    if (!standard && !extended) return null;

    return {
      regular: standard ? standard.regular_fare : null,
      discounted: standard ? standard.discounted_fare : null,
      extraDistance: extended ? extended.regular_fare : null,
      extraDistanceDiscounted: extended ? extended.discounted_fare : null,
    };
  },

  async saveFixedFarePricing(pricing: FixedFarePricing): Promise<void> {
    const fares = await this.listFares();
    const standard = fares.find(
      (f) => f.origin_landmark === 'Standard Trip' || f.origin_landmark === 'Base Fare',
    );
    const extended = fares.find(
      (f) => f.origin_landmark === 'Extended Trip' || f.origin_landmark === 'Extra Distance',
    );

    const reg = pricing.regular ?? 0;
    const disc = pricing.discounted ?? 0;
    const ext = pricing.extraDistance ?? 0;
    const extDisc = pricing.extraDistanceDiscounted ?? 0;

    if (standard) {
      await this.updateFare(standard.id, {
        origin_landmark: 'Standard Trip',
        destination_landmark: 'Standard Trip',
        regular_fare: reg,
        discounted_fare: disc,
      });
    } else if (pricing.regular != null || pricing.discounted != null) {
      await this.createFare({
        origin_landmark: 'Standard Trip',
        destination_landmark: 'Standard Trip',
        regular_fare: reg,
        discounted_fare: disc,
      });
    }

    if (extended) {
      await this.updateFare(extended.id, {
        origin_landmark: 'Extended Trip',
        destination_landmark: 'Extended Trip',
        regular_fare: ext,
        discounted_fare: extDisc,
      });
    } else if (pricing.extraDistance != null || pricing.extraDistanceDiscounted != null) {
      await this.createFare({
        origin_landmark: 'Extended Trip',
        destination_landmark: 'Extended Trip',
        regular_fare: ext,
        discounted_fare: extDisc,
      });
    }
  },
};
