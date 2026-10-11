import { createClient } from '@supabase/supabase-js';
import type { Database } from '../types/database.types.js';
import '../config/env.js';

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  throw new Error('Supabase configuration is missing');
}

const supabase = createClient<Database>(supabaseUrl, supabaseServiceKey);

async function resolveSubscriptionTier(userId: string): Promise<'free' | 'premium' | null> {
  const { data: profile, error: profileError } = await supabase
    .from('profiles')
    .select('subscription_tier')
    .eq('id', userId)
    .single();

  if (!profileError && profile) {
    return profile.subscription_tier === 'premium' ? 'premium' : 'free';
  }

  // Column missing or profile row missing — do not block AI
  if (profileError?.code === '42703' || profileError?.message?.includes('subscription_tier')) {
    console.warn('[usageService] subscription_tier missing; treating user as free tier');
    return 'free';
  }

  if (profileError?.code === 'PGRST116') {
    console.warn('[usageService] no profile row for user', userId);
    return 'free';
  }

  if (profileError) {
    console.error('Error fetching profile:', profileError);
    return null;
  }

  return 'free';
}

export interface PromptUsageInfo {
  remaining_prompts: number;
  total_prompts: number;
  limit_reached: boolean;
  subscription_tier: string;
}

const DEFAULT_FREE_USAGE: PromptUsageInfo = {
  remaining_prompts: 3,
  total_prompts: 3,
  limit_reached: false,
  subscription_tier: 'free',
};

/**
 * Get the current week's prompt usage for a user
 */
export async function getUserPromptUsage(userId: string): Promise<PromptUsageInfo | null> {
  try {
    const tier = await resolveSubscriptionTier(userId);
    if (tier === null) return null;

    if (tier === 'premium') {
      return {
        remaining_prompts: 999,
        total_prompts: 999,
        limit_reached: false,
        subscription_tier: 'premium',
      };
    }

    const { data: usage, error: usageError } = await (supabase.rpc as any)(
      'get_or_create_weekly_usage',
      { user_id: userId },
    );

    if (usageError) {
      if (usageError.code === 'PGRST202' || usageError.message?.includes('usage_stats')) {
        console.warn('[usageService] usage RPC unavailable; returning default quota');
        return { ...DEFAULT_FREE_USAGE };
      }
      console.error('Error fetching usage stats:', usageError);
      return null;
    }

    const promptCount = usage?.[0]?.prompt_count ?? 0;
    const remaining = Math.max(0, 3 - promptCount);

    return {
      remaining_prompts: remaining,
      total_prompts: 3,
      limit_reached: promptCount >= 3,
      subscription_tier: 'free',
    };
  } catch (error) {
    console.error('Unexpected error in getUserPromptUsage:', error);
    return null;
  }
}

/**
 * Increment prompt count for a user and return updated usage info
 */
export async function incrementPromptCount(userId: string): Promise<PromptUsageInfo | null> {
  try {
    const tier = await resolveSubscriptionTier(userId);
    if (tier === null) return { ...DEFAULT_FREE_USAGE };

    if (tier === 'premium') {
      return {
        remaining_prompts: 999,
        total_prompts: 999,
        limit_reached: false,
        subscription_tier: 'premium',
      };
    }

    const { data: result, error: incrementError } = await (supabase.rpc as any)(
      'increment_prompt_count',
      { user_id: userId },
    );

    if (incrementError) {
      if (
        incrementError.code === 'PGRST202' ||
        incrementError.message?.includes('increment_prompt_count') ||
        incrementError.message?.includes('usage_stats')
      ) {
        console.warn('[usageService] increment RPC unavailable; allowing prompt');
        return { ...DEFAULT_FREE_USAGE };
      }
      console.error('Error incrementing prompt count:', incrementError);
      return { ...DEFAULT_FREE_USAGE };
    }

    const newCount = result?.[0]?.new_count ?? 0;
    const limitReached = result?.[0]?.limit_reached ?? false;
    const remaining = Math.max(0, 3 - newCount);

    return {
      remaining_prompts: remaining,
      total_prompts: 3,
      limit_reached: limitReached,
      subscription_tier: 'free',
    };
  } catch (error) {
    console.error('Unexpected error in incrementPromptCount:', error);
    return null;
  }
}
