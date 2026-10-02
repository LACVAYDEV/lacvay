import { createClient } from '@supabase/supabase-js';
import type { Database } from '../types/database.types.js';
import '../config/env.js';

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  throw new Error('Supabase configuration is missing');
}

const supabase = createClient<Database>(supabaseUrl, supabaseServiceKey);

export interface PromptUsageInfo {
  remaining_prompts: number;
  total_prompts: number;
  limit_reached: boolean;
  subscription_tier: string;
}

/**
 * Get the current week's prompt usage for a user
 */
export async function getUserPromptUsage(userId: string): Promise<PromptUsageInfo | null> {
  try {
    // Get user's profile to check subscription tier
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('subscription_tier')
      .eq('id', userId)
      .single();

    if (profileError || !profile) {
      console.error('Error fetching profile:', profileError);
      return null;
    }

    // Premium users have unlimited prompts
    if (profile.subscription_tier === 'premium') {
      return {
        remaining_prompts: 999,
        total_prompts: 999,
        limit_reached: false,
        subscription_tier: 'premium',
      };
    }

    // Get current week's usage
    const { data: usage, error: usageError } = await supabase.rpc(
      'get_or_create_weekly_usage',
      { user_id: userId },
    );

    if (usageError) {
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
    // Get user's profile to check subscription tier
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('subscription_tier')
      .eq('id', userId)
      .single();

    if (profileError || !profile) {
      console.error('Error fetching profile:', profileError);
      return null;
    }

    // Premium users have unlimited prompts - just return usage info
    if (profile.subscription_tier === 'premium') {
      return {
        remaining_prompts: 999,
        total_prompts: 999,
        limit_reached: false,
        subscription_tier: 'premium',
      };
    }

    // Increment count using RPC function
    const { data: result, error: incrementError } = await supabase.rpc(
      'increment_prompt_count',
      { user_id: userId },
    );

    if (incrementError) {
      console.error('Error incrementing prompt count:', incrementError);
      return null;
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
