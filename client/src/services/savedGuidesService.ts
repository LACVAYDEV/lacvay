import { supabase } from '@/lib/supabase';
import type { SavedGuide } from '@/types';

const LOCAL_STORAGE_KEY_PREFIX = 'lacvay-saved-guides-';

function getLocalGuides(userId: string): SavedGuide[] {
  try {
    const raw = localStorage.getItem(LOCAL_STORAGE_KEY_PREFIX + userId);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

function setLocalGuides(userId: string, guides: SavedGuide[]): void {
  try {
    localStorage.setItem(LOCAL_STORAGE_KEY_PREFIX + userId, JSON.stringify(guides));
  } catch (e) {
    console.error('Failed to save guide to localStorage:', e);
  }
}

export const savedGuidesService = {
  async getUserSavedGuides(userId: string): Promise<SavedGuide[]> {
    if (!userId) return [];

    try {
      const { data, error } = await supabase
        .from('saved_guides')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false });

      if (error) {
        console.warn('Supabase saved_guides fetch warning, falling back to local storage:', error.message);
        return getLocalGuides(userId);
      }

      if (data && data.length > 0) {
        return data as SavedGuide[];
      }

      // If empty in Supabase, also check local storage in case saved locally before migration
      const local = getLocalGuides(userId);
      return local.length > 0 ? local : [];
    } catch (err) {
      console.warn('Unexpected error in getUserSavedGuides, falling back to local:', err);
      return getLocalGuides(userId);
    }
  },

  async saveGuide(
    userId: string,
    guide: Omit<SavedGuide, 'id' | 'user_id' | 'created_at'>,
  ): Promise<SavedGuide> {
    const newId = crypto.randomUUID();
    const now = new Date().toISOString();

    const newGuide: SavedGuide = {
      id: newId,
      user_id: userId,
      title: guide.title || 'Batangas City Trip Guide',
      summary: guide.summary || null,
      steps: guide.steps || [],
      created_at: now,
    };

    // Always update local cache for instant offline access
    const existing = getLocalGuides(userId);
    setLocalGuides(userId, [newGuide, ...existing.filter((g) => g.id !== newId)]);

    try {
      const { data, error } = await supabase
        .from('saved_guides')
        .insert({
          id: newId,
          user_id: userId,
          title: newGuide.title,
          summary: newGuide.summary,
          steps: newGuide.steps,
          created_at: now,
        })
        .select()
        .single();

      if (error) {
        console.warn('Supabase saved_guides insert error, stored locally:', error.message);
        return newGuide;
      }

      return (data as SavedGuide) || newGuide;
    } catch (err) {
      console.warn('Supabase insert failed, guide saved locally:', err);
      return newGuide;
    }
  },

  async deleteSavedGuide(guideId: string, userId?: string): Promise<void> {
    if (userId) {
      const local = getLocalGuides(userId);
      setLocalGuides(userId, local.filter((g) => g.id !== guideId));
    }

    try {
      const { error } = await supabase
        .from('saved_guides')
        .delete()
        .eq('id', guideId);

      if (error) {
        console.warn('Supabase delete error:', error.message);
      }
    } catch (err) {
      console.warn('Failed to delete guide in Supabase:', err);
    }
  },
};
