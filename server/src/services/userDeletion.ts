import { supabaseAdmin } from './supabaseAdmin.js';

export async function purgeUserData(userId: string): Promise<string | null> {
  if (!supabaseAdmin) return 'Supabase admin client is not configured.';

  const { data: sessions, error: sessionsError } = await supabaseAdmin
    .from('chat_sessions')
    .select('id')
    .eq('user_id', userId);
  if (sessionsError) return sessionsError.message;

  const sessionIds = (sessions ?? []).map((session) => session.id);
  if (sessionIds.length > 0) {
    const { error: messagesError } = await supabaseAdmin
      .from('chat_messages')
      .delete()
      .in('session_id', sessionIds);
    if (messagesError) return messagesError.message;
  }

  const { error: sessionsDeleteError } = await supabaseAdmin
    .from('chat_sessions')
    .delete()
    .eq('user_id', userId);
  if (sessionsDeleteError) return sessionsDeleteError.message;

  const { error: favoritesError } = await supabaseAdmin
    .from('user_favorites')
    .delete()
    .eq('user_id', userId);
  if (favoritesError) return favoritesError.message;

  return null;
}
