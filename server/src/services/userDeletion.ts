import { supabaseAdmin } from './supabaseAdmin.js';

type PostgrestErrorLike = { code?: string; message?: string } | null;

function isMissingTableError(error: PostgrestErrorLike): boolean {
  if (!error) return false;
  if (error.code === 'PGRST205') return true;
  const message = error.message ?? '';
  return (
    /could not find the table/i.test(message) ||
    /schema cache/i.test(message) ||
    /relation .* does not exist/i.test(message)
  );
}

async function deleteByUserId(table: string, userId: string): Promise<string | null> {
  if (!supabaseAdmin) return 'Supabase admin client is not configured.';

  const { error } = await supabaseAdmin.from(table).delete().eq('user_id', userId);
  if (error && !isMissingTableError(error)) return error.message;
  return null;
}

async function purgeOptionalChatData(userId: string): Promise<string | null> {
  if (!supabaseAdmin) return 'Supabase admin client is not configured.';

  const { data: sessions, error: sessionsError } = await supabaseAdmin
    .from('chat_sessions')
    .select('id')
    .eq('user_id', userId);

  if (sessionsError) {
    return isMissingTableError(sessionsError) ? null : sessionsError.message;
  }

  const sessionIds = (sessions ?? []).map((session) => session.id);
  if (sessionIds.length > 0) {
    const { error: messagesError } = await supabaseAdmin
      .from('chat_messages')
      .delete()
      .in('session_id', sessionIds);
    if (messagesError && !isMissingTableError(messagesError)) return messagesError.message;
  }

  const { error: sessionsDeleteError } = await supabaseAdmin
    .from('chat_sessions')
    .delete()
    .eq('user_id', userId);
  if (sessionsDeleteError && !isMissingTableError(sessionsDeleteError)) {
    return sessionsDeleteError.message;
  }

  return null;
}

export async function purgeUserData(userId: string): Promise<string | null> {
  if (!supabaseAdmin) return 'Supabase admin client is not configured.';

  const steps: Array<() => Promise<string | null>> = [
    () => deleteByUserId('saved_guides', userId),
    () => deleteByUserId('user_favorites', userId),
    () => purgeOptionalChatData(userId),
  ];

  for (const step of steps) {
    const errorMessage = await step();
    if (errorMessage) return errorMessage;
  }

  return null;
}
