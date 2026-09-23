import { supabase } from '@/lib/supabase';

const API_URL = import.meta.env.VITE_API_URL || '/api';

export const accountService = {
  async deleteCurrentAccount(confirmation: string): Promise<void> {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) throw new Error('Your session has expired. Sign in again before deleting your account.');

    const response = await fetch(`${API_URL}/account`, {
      method: 'DELETE',
      headers: {
        Authorization: `Bearer ${session.access_token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ confirmation }),
    });

    const body = (await response.json()) as { error?: string };
    if (!response.ok) throw new Error(body.error ?? 'Could not delete your account.');
  },
};
