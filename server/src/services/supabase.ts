import { createClient } from '@supabase/supabase-js';
import type { Database } from '../types/database.types.ts';

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseAnonKey = process.env.SUPABASE_ANON_KEY;

// Fail loudly if the server is missing its keys
if (!supabaseUrl || !supabaseAnonKey) {
    throw new Error('Missing Supabase environment variables on the server');
}

// Export the typed Supabase client
export const supabase = createClient<Database>(supabaseUrl, supabaseAnonKey);