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
    const payload: Record<string, any> = {
      route_name: route.route_name,
      vehicle_type: route.vehicle_type || 'Jeepney',
      color_code: route.color_code,
      geojson_path: route.geojson_path ?? null,
    };
    if (route.id) payload.id = route.id;
    if (route.regular_fare !== undefined) payload.regular_fare = route.regular_fare;
    if (route.discounted_fare !== undefined) payload.discounted_fare = route.discounted_fare;
    if (route.extended_fare !== undefined) payload.extended_fare = route.extended_fare;
    if (route.extended_discounted_fare !== undefined) payload.extended_discounted_fare = route.extended_discounted_fare;

    let { data, error } = await supabase
      .from('transit_routes')
      .insert(payload as TransitRouteInsert)
      .select('*')
      .single();

    // Fallback if the database migration hasn't been executed yet in Supabase
    if (error && (error.code === '42703' || error.message?.includes('does not exist'))) {
      delete payload.regular_fare;
      delete payload.discounted_fare;
      delete payload.extended_fare;
      delete payload.extended_discounted_fare;
      const retry = await supabase
        .from('transit_routes')
        .insert(payload as TransitRouteInsert)
        .select('*')
        .single();
      data = retry.data;
      error = retry.error;
    }

    if (error || !data) {
      console.error('[transitAdminService] Error creating route:', error);
      throw new Error(error?.message || 'Failed to create route in database');
    }
    return data;
  },

  async updateRoute(id: string, updates: TransitRouteUpdate): Promise<TransitRouteRow> {
    const payload: Record<string, any> = {};
    if (updates.route_name !== undefined) payload.route_name = updates.route_name;
    if (updates.vehicle_type !== undefined) payload.vehicle_type = updates.vehicle_type;
    if (updates.color_code !== undefined) payload.color_code = updates.color_code;
    if (updates.geojson_path !== undefined) payload.geojson_path = updates.geojson_path;
    if (updates.regular_fare !== undefined) payload.regular_fare = updates.regular_fare;
    if (updates.discounted_fare !== undefined) payload.discounted_fare = updates.discounted_fare;
    if (updates.extended_fare !== undefined) payload.extended_fare = updates.extended_fare;
    if (updates.extended_discounted_fare !== undefined) payload.extended_discounted_fare = updates.extended_discounted_fare;

    let { data, error } = await supabase
      .from('transit_routes')
      .update(payload as TransitRouteUpdate)
      .eq('id', id)
      .select('*')
      .single();

    // Fallback if the database migration hasn't been executed yet in Supabase
    if (error && (error.code === '42703' || error.message?.includes('does not exist'))) {
      delete payload.regular_fare;
      delete payload.discounted_fare;
      delete payload.extended_fare;
      delete payload.extended_discounted_fare;
      const retry = await supabase
        .from('transit_routes')
        .update(payload as TransitRouteUpdate)
        .eq('id', id)
        .select('*')
        .single();
      data = retry.data;
      error = retry.error;
    }

    if (error || !data) {
      console.error('[transitAdminService] Error updating route:', error);
      throw new Error(error?.message || 'Failed to update route in database');
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

  // --- Fixed Fare Pricing Matrix (Per Route / Per Jeep) ---
  extractRouteFares(route?: TransitRouteRow | null): FixedFarePricing | null {
    if (!route) return null;

    // 1. First Priority: Native database table columns on transit_routes
    if (
      route.regular_fare != null ||
      route.discounted_fare != null ||
      route.extended_fare != null ||
      route.extended_discounted_fare != null
    ) {
      return {
        regular: route.regular_fare,
        discounted: route.discounted_fare,
        extraDistance: route.extended_fare,
        extraDistanceDiscounted: route.extended_discounted_fare,
      };
    }

    // 2. Second Priority: Embedded in route.geojson_path
    if (route.geojson_path) {
      const path = route.geojson_path as Record<string, any>;
      if (path.fares && typeof path.fares === 'object') {
        return path.fares as FixedFarePricing;
      }
      if (path.properties && path.properties.fares && typeof path.properties.fares === 'object') {
        return path.properties.fares as FixedFarePricing;
      }
    }
    return null;
  },

  async getRouteFares(
    route: TransitRouteRow,
    cachedFares?: JeepneyFareRow[],
  ): Promise<FixedFarePricing> {
    // Check extracted fares from native columns or embedded path
    const embedded = this.extractRouteFares(route);
    if (
      embedded &&
      (embedded.regular != null ||
        embedded.discounted != null ||
        embedded.extraDistance != null ||
        embedded.extraDistanceDiscounted != null)
    ) {
      return {
        regular: embedded.regular ?? 13,
        discounted: embedded.discounted ?? 11,
        extraDistance: embedded.extraDistance ?? 15,
        extraDistanceDiscounted: embedded.extraDistanceDiscounted ?? 12,
      };
    }

    // Check in jeepney_fare_matrix for this specific route (by route_id, route ID landmark, or route name)
    try {
      const fares = cachedFares || (await this.listFares());
      const routeSpecificFares = fares.filter(
        (f) =>
          f.route_id === route.id ||
          f.origin_landmark === route.id ||
          f.origin_landmark === route.route_name ||
          f.origin_landmark?.toLowerCase() === route.route_name?.toLowerCase(),
      );

      if (routeSpecificFares.length > 0) {
        const standard = routeSpecificFares.find(
          (f) => f.destination_landmark === 'Standard Trip' || f.destination_landmark === 'Base Fare',
        );
        const extended = routeSpecificFares.find(
          (f) => f.destination_landmark === 'Extended Trip' || f.destination_landmark === 'Extra Distance',
        );

        if (standard || extended) {
          return {
            regular: standard ? standard.regular_fare : 13,
            discounted: standard ? standard.discounted_fare : 11,
            extraDistance: extended ? extended.regular_fare : 15,
            extraDistanceDiscounted: extended ? extended.discounted_fare : 12,
          };
        }
      }
    } catch (err) {
      console.warn('[transitAdminService] Could not load route fare matrix:', err);
    }

    // Fallback to global defaults if route has no specific fare configured yet
    const globalPricing = await this.getFixedFarePricing();
    return {
      regular: globalPricing?.regular ?? 13,
      discounted: globalPricing?.discounted ?? 11,
      extraDistance: globalPricing?.extraDistance ?? 15,
      extraDistanceDiscounted: globalPricing?.extraDistanceDiscounted ?? 12,
    };
  },

  async saveRouteFares(
    routeId: string,
    routeName: string,
    pricing: FixedFarePricing,
  ): Promise<void> {
    const fares = await this.listFares();

    // Find any existing row for this route in jeepney_fare_matrix
    const standard = fares.find(
      (f) =>
        (f.route_id === routeId || f.origin_landmark === routeId || f.origin_landmark === routeName) &&
        (f.destination_landmark === 'Standard Trip' || f.destination_landmark === 'Base Fare'),
    );
    const extended = fares.find(
      (f) =>
        (f.route_id === routeId || f.origin_landmark === routeId || f.origin_landmark === routeName) &&
        (f.destination_landmark === 'Extended Trip' || f.destination_landmark === 'Extra Distance'),
    );

    const reg = pricing.regular ?? 0;
    const disc = pricing.discounted ?? 0;
    const ext = pricing.extraDistance ?? 0;
    const extDisc = pricing.extraDistanceDiscounted ?? 0;

    // Save standard trip row with route_id if supported
    if (standard) {
      const updateData: Record<string, any> = {
        origin_landmark: routeId,
        destination_landmark: 'Standard Trip',
        regular_fare: reg,
        discounted_fare: disc,
        route_id: routeId,
      };
      try {
        await this.updateFare(standard.id, updateData as JeepneyFareUpdate);
      } catch {
        delete updateData.route_id;
        await this.updateFare(standard.id, updateData as JeepneyFareUpdate);
      }
    } else if (pricing.regular != null || pricing.discounted != null) {
      const insertData: Record<string, any> = {
        origin_landmark: routeId,
        destination_landmark: 'Standard Trip',
        regular_fare: reg,
        discounted_fare: disc,
        route_id: routeId,
      };
      try {
        await this.createFare(insertData as JeepneyFareInsert);
      } catch {
        delete insertData.route_id;
        await this.createFare(insertData as JeepneyFareInsert);
      }
    }

    // Save extended trip row with route_id if supported
    if (extended) {
      const updateData: Record<string, any> = {
        origin_landmark: routeId,
        destination_landmark: 'Extended Trip',
        regular_fare: ext,
        discounted_fare: extDisc,
        route_id: routeId,
      };
      try {
        await this.updateFare(extended.id, updateData as JeepneyFareUpdate);
      } catch {
        delete updateData.route_id;
        await this.updateFare(extended.id, updateData as JeepneyFareUpdate);
      }
    } else if (pricing.extraDistance != null || pricing.extraDistanceDiscounted != null) {
      const insertData: Record<string, any> = {
        origin_landmark: routeId,
        destination_landmark: 'Extended Trip',
        regular_fare: ext,
        discounted_fare: extDisc,
        route_id: routeId,
      };
      try {
        await this.createFare(insertData as JeepneyFareInsert);
      } catch {
        delete insertData.route_id;
        await this.createFare(insertData as JeepneyFareInsert);
      }
    }
  },

  // --- Fallback Global Fixed Fare Pricing Matrix ---
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
