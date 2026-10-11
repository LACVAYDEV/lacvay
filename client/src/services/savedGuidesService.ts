import { supabase } from '@/lib/supabase';
import type { SavedGuide, SavedGuideStep, CommuteGuidePlan } from '@/types';

const LOCAL_STORAGE_KEY = 'lacvay_saved_guides_cache';

function getLocalGuides(): SavedGuide[] {
  try {
    const raw = localStorage.getItem(LOCAL_STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function saveLocalGuides(guides: SavedGuide[]): void {
  try {
    localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(guides));
  } catch (err) {
    console.warn('Failed to write saved guides to localStorage:', err);
  }
}

export const savedGuidesService = {
  /**
   * Retrieves saved guides for a user (or local guest items).
   * Blends local storage cache with Supabase remote items.
   */
  async getUserSavedGuides(userId?: string): Promise<SavedGuide[]> {
    const local = getLocalGuides();
    const userFilteredLocal = userId
      ? local.filter((g) => !g.user_id || g.user_id === 'guest' || g.user_id === userId)
      : local;

    if (!userId) {
      return userFilteredLocal;
    }

    try {
      const { data, error } = await supabase
        .from('saved_guides')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false });

      if (!error && Array.isArray(data)) {
        const remoteGuides: SavedGuide[] = data.map((row: any) => {
          let stepsList: SavedGuideStep[] = [];
          let plan: CommuteGuidePlan | null = null;

          if (Array.isArray(row.steps)) {
            stepsList = row.steps;
          } else if (row.steps && typeof row.steps === 'object') {
            stepsList = Array.isArray(row.steps.list)
              ? row.steps.list
              : (Array.isArray(row.steps.steps) ? row.steps.steps : []);
            plan = row.steps.plan || null;
          }

          return {
            id: row.id,
            user_id: row.user_id,
            title: row.title,
            summary: row.summary,
            steps: stepsList,
            plan,
            created_at: row.created_at,
          };
        });

        // Merge: remote guides take precedence, merge with local unsynced guides
        const map = new Map<string, SavedGuide>();
        for (const g of userFilteredLocal) {
          map.set(g.id, g);
        }
        for (const g of remoteGuides) {
          map.set(g.id, g);
        }
        const merged = Array.from(map.values()).sort(
          (a, b) => new Date(b.created_at || 0).getTime() - new Date(a.created_at || 0).getTime(),
        );

        saveLocalGuides(merged);
        return merged;
      }
    } catch (err) {
      console.warn('Could not fetch guides from Supabase, returning local guides:', err);
    }

    return userFilteredLocal;
  },

  /**
   * Saves a guide. Persists to localStorage immediately so it never fails,
   * then attempts to sync to Supabase if authenticated.
   */
  async saveGuide(
    userId: string | undefined,
    guide: Omit<SavedGuide, 'id' | 'user_id' | 'created_at'>,
  ): Promise<SavedGuide> {
    const newId = crypto.randomUUID();
    const now = new Date().toISOString();

    const savedItem: SavedGuide = {
      id: newId,
      user_id: userId || 'guest',
      title: guide.title || 'Batangas City Commute Guide',
      summary: guide.summary || null,
      steps: guide.steps || [],
      plan: guide.plan || null,
      created_at: now,
    };

    // 1. Immediately store in local cache so save NEVER fails
    const current = getLocalGuides();
    const updated = [savedItem, ...current.filter((g) => g.id !== newId)];
    saveLocalGuides(updated);

    // 2. If authenticated, attempt to sync to Supabase saved_guides table
    if (userId && userId !== 'guest') {
      try {
        const payload = {
          id: newId,
          user_id: userId,
          title: savedItem.title,
          summary: savedItem.summary,
          // Store both step list and complete plan inside json steps column
          steps: {
            list: savedItem.steps,
            plan: savedItem.plan,
          },
          created_at: now,
        };

        const { error } = await supabase.from('saved_guides').insert(payload as any);
        if (error) {
          console.warn('Supabase saved_guides sync error (persisted locally):', error);
        }
      } catch (err) {
        console.warn('Network error syncing saved guide to Supabase (persisted locally):', err);
      }
    }

    return savedItem;
  },

  /**
   * Deletes a saved guide from local cache and Supabase
   */
  async deleteSavedGuide(guideId: string, userId?: string): Promise<void> {
    // 1. Delete from local cache
    const current = getLocalGuides();
    saveLocalGuides(current.filter((g) => g.id !== guideId));

    // 2. Attempt delete from Supabase if user logged in
    if (userId && userId !== 'guest') {
      try {
        await supabase.from('saved_guides').delete().eq('id', guideId);
      } catch (err) {
        console.warn('Error deleting guide from Supabase:', err);
      }
    }
  },
};
