import { supabase } from '@/lib/supabase';
import type { GlobalCommuteGuide } from '@/types';

export const commuteGuidesService = {
  /**
   * Fetch all globally-published commute guides (admin-created).
   * These appear in the user-facing Commute Guide tab.
   */
  async listGlobalGuides(): Promise<GlobalCommuteGuide[]> {
    try {
      const { data, error } = await supabase
        .from('commute_guides')
        .select('*')
        .eq('is_global', true)
        .order('created_at', { ascending: false });

      if (error) {
        console.warn('[commuteGuidesService] Error fetching global guides:', error.message);
        return [];
      }

      return (data ?? []) as unknown as GlobalCommuteGuide[];
    } catch (err) {
      console.warn('[commuteGuidesService] Failed to fetch global guides:', err);
      return [];
    }
  },

  /**
   * Fetch all commute guides (admin view — includes non-global if any).
   */
  async listAllGuides(): Promise<GlobalCommuteGuide[]> {
    try {
      const { data, error } = await supabase
        .from('commute_guides')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) {
        console.warn('[commuteGuidesService] Error fetching all guides:', error.message);
        return [];
      }

      return (data ?? []) as unknown as GlobalCommuteGuide[];
    } catch (err) {
      console.warn('[commuteGuidesService] Failed to fetch all guides:', err);
      return [];
    }
  },

  /**
   * Create a new commute guide (admin action).
   */
  async createGuide(
    guide: Omit<GlobalCommuteGuide, 'id' | 'created_at'>,
  ): Promise<GlobalCommuteGuide> {
    const { data, error } = await supabase
      .from('commute_guides')
      .insert({
        title: guide.title,
        summary: guide.summary ?? null,
        destination: guide.destination ?? null,
        steps: guide.steps as any,
        transport_segments: guide.transport_segments as any,
        difficulty: guide.difficulty ?? 'Easy',
        estimated_travel_time_min: guide.estimated_travel_time_min ?? null,
        estimated_fare_min: guide.estimated_fare_min ?? null,
        estimated_fare_max: guide.estimated_fare_max ?? null,
        created_by: guide.created_by ?? null,
        is_global: guide.is_global ?? true,
      })
      .select('*')
      .single();

    if (error || !data) {
      console.error('[commuteGuidesService] Error creating guide:', error);
      throw new Error(error?.message || 'Failed to create commute guide');
    }
    return data as unknown as GlobalCommuteGuide;
  },

  /**
   * Update an existing commute guide (admin action).
   */
  async updateGuide(
    id: string,
    updates: Partial<Omit<GlobalCommuteGuide, 'id' | 'created_at'>>,
  ): Promise<GlobalCommuteGuide> {
    const payload: Record<string, any> = {};
    if (updates.title !== undefined) payload.title = updates.title;
    if (updates.summary !== undefined) payload.summary = updates.summary;
    if (updates.destination !== undefined) payload.destination = updates.destination;
    if (updates.steps !== undefined) payload.steps = updates.steps as any;
    if (updates.transport_segments !== undefined) payload.transport_segments = updates.transport_segments as any;
    if (updates.difficulty !== undefined) payload.difficulty = updates.difficulty;
    if (updates.estimated_travel_time_min !== undefined) payload.estimated_travel_time_min = updates.estimated_travel_time_min;
    if (updates.estimated_fare_min !== undefined) payload.estimated_fare_min = updates.estimated_fare_min;
    if (updates.estimated_fare_max !== undefined) payload.estimated_fare_max = updates.estimated_fare_max;
    if (updates.is_global !== undefined) payload.is_global = updates.is_global;

    const { data, error } = await supabase
      .from('commute_guides')
      .update(payload as any)
      .eq('id', id)
      .select('*')
      .single();

    if (error || !data) {
      console.error('[commuteGuidesService] Error updating guide:', error);
      throw new Error(error?.message || 'Failed to update commute guide');
    }
    return data as unknown as GlobalCommuteGuide;
  },

  /**
   * Delete a commute guide (admin action).
   */
  async deleteGuide(id: string): Promise<void> {
    const { error } = await supabase
      .from('commute_guides')
      .delete()
      .eq('id', id);

    if (error) {
      console.error('[commuteGuidesService] Error deleting guide:', error);
      throw new Error(error?.message || 'Failed to delete commute guide');
    }
  },
};
