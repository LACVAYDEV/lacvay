import { createClient } from '@supabase/supabase-js';
import type { Database } from '../types/database.types.js';
import '../config/env.js';

const supabaseUrl = process.env.SUPABASE_URL;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !serviceRoleKey) {
  console.warn(
    'SUPABASE_SERVICE_ROLE_KEY is not set — admin actions and account deletion will be unavailable.',
  );
}

export const supabaseAdmin = supabaseUrl && serviceRoleKey
  ? createClient<Database>(supabaseUrl, serviceRoleKey, {
      auth: { autoRefreshToken: false, persistSession: false },
    })
  : null;

export const DEFAULT_USER_PASSWORD = process.env.DEFAULT_USER_PASSWORD || 'Lacvay@123456';
