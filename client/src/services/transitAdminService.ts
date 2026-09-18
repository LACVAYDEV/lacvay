import { supabase } from '@/lib/supabase';
import type { Database } from '@/types/database.types';

export type TransitRouteRow = Database['public']['Tables']['transit_routes']['Row'];
export type TransitRouteInsert = Database['public']['Tables']['transit_routes']['Insert'];
export type TransitRouteUpdate = Database['public']['Tables']['transit_routes']['Update'];

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
      .order('route_name', { ascending: true });

    if (error) {
      console.error('[transitAdminService] Error listing routes:', error);
      throw new Error(error.message || 'Failed to list transit routes');
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
      throw new Error(error.message || 'Failed to get route');
    }
    return data ?? null;
  },

  async createRoute(route: TransitRouteInsert): Promise<TransitRouteRow> {
    // Only send valid DB columns (route_code does not exist in transit_routes table)
    const payload: TransitRouteInsert = {
      route_name: route.route_name,
      vehicle_type: route.vehicle_type || 'Jeepney',
      color_code: route.color_code,
      geojson_path: route.geojson_path ?? null,
    };
    if (route.id) payload.id = route.id;

    const { data, error } = await supabase
      .from('transit_routes')
      .insert(payload)
      .select('*')
      .single();

    if (error) {
      console.error('[transitAdminService] Error creating route:', error);
      throw new Error(error.message || 'Failed to create route in database');
    }
    return data;
  },

  async updateRoute(id: string, updates: TransitRouteUpdate): Promise<TransitRouteRow> {
    const payload: TransitRouteUpdate = {};
    if (updates.route_name !== undefined) payload.route_name = updates.route_name;
    if (updates.vehicle_type !== undefined) payload.vehicle_type = updates.vehicle_type;
    if (updates.color_code !== undefined) payload.color_code = updates.color_code;
    if (updates.geojson_path !== undefined) payload.geojson_path = updates.geojson_path;

    const { data, error } = await supabase
      .from('transit_routes')
      .update(payload)
      .eq('id', id)
      .select('*')
      .single();

    if (error) {
      console.error('[transitAdminService] Error updating route:', error);
      throw new Error(error.message || 'Failed to update route in database');
    }
    return data;
  },

  async deleteRoute(id: string): Promise<void> {
    const { error } = await supabase.from('transit_routes').delete().eq('id', id);
    if (error) {
      console.error('[transitAdminService] Error deleting route:', error);
      throw new Error(error.message || 'Failed to delete route from database');
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
      throw new Error(error.message || 'Failed to list fares');
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
      throw new Error(error.message || 'Failed to create fare in database');
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
      throw new Error(error.message || 'Failed to update fare in database');
    }
    return data;
  },

  async deleteFare(id: string): Promise<void> {
    const { error } = await supabase.from('jeepney_fare_matrix').delete().eq('id', id);
    if (error) {
      console.error('[transitAdminService] Error deleting fare:', error);
      throw new Error(error.message || 'Failed to delete fare from database');
    }
  },

  // --- Fixed Fare Pricing Matrix ---
  async getFixedFarePricing(): Promise<FixedFarePricing | null> {
    try {
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
    } catch (err) {
      console.warn('[transitAdminService] Could not load fare matrix:', err);
      return null;
    }
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
