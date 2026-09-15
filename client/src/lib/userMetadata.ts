import type { UserMetadata } from '@supabase/supabase-js';
import { supabase } from '@/lib/supabase';

let updateQueue: Promise<void> = Promise.resolve();

export function updateUserMetadata(patch: UserMetadata): Promise<void> {
  const update = updateQueue.then(async () => {
    const { data, error: userError } = await supabase.auth.getUser();
    if (userError) throw userError;
    if (!data.user) throw new Error('You must be signed in to update account data.');

    const { error: updateError } = await supabase.auth.updateUser({
      data: { ...data.user.user_metadata, ...patch },
    });
    if (updateError) throw updateError;
  });

  updateQueue = update.catch(() => undefined);
  return update;
}
