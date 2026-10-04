import { supabase } from '@/lib/supabase';
import type { SavedGuide } from '@/types';

export const savedGuidesService = {
  async getUserSavedGuides(userId: string): Promise<SavedGuide[]> {
    if (!userId) return [];

    const { data, error } = await supabase
      .from('saved_guides')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });

    if (error) throw error;
    return (data ?? []) as SavedGuide[];
  },

  async saveGuide(
    userId: string,
    guide: Omit<SavedGuide, 'id' | 'user_id' | 'created_at'>,
  ): Promise<SavedGuide> {
    const newId = crypto.randomUUID();
    const now = new Date().toISOString();

    const { data, error } = await supabase
      .from('saved_guides')
      .insert({
        id: newId,
        user_id: userId,
        title: guide.title || 'Batangas City Trip Guide',
        summary: guide.summary || null,
        steps: guide.steps || [],
        created_at: now,
      })
      .select()
      .single();

    if (error) throw error;
    return data as SavedGuide;
  },

  async deleteSavedGuide(guideId: string, _userId?: string): Promise<void> {
    const { error } = await supabase
      .from('saved_guides')
      .delete()
      .eq('id', guideId);

    if (error) throw error;
  },
};
