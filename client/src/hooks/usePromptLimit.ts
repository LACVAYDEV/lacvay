import { useCallback, useEffect, useState } from 'react';
import { useAuth } from '@/context/AuthContext';
import { supabase } from '@/lib/supabase';

export interface PromptUsageInfo {
  remaining_prompts: number;
  total_prompts: number;
  limit_reached: boolean;
  subscription_tier: string;
}

/** PostgREST: table/view missing (migration not applied on this Supabase project). */
function isUsageSchemaMissing(error: { code?: string } | null): boolean {
  return error?.code === 'PGRST205';
}

function defaultFreeUsage(): PromptUsageInfo {
  return {
    remaining_prompts: 3,
    total_prompts: 3,
    limit_reached: false,
    subscription_tier: 'free',
  };
}

/**
 * Hook to track user's prompt usage and subscription status
 */
export function usePromptLimit() {
  const { user, profile } = useAuth();
  const [usage, setUsage] = useState<PromptUsageInfo | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Check if user is premium
  const isPremium = profile?.subscription_tier === 'premium';

  // Fetch initial usage
  useEffect(() => {
    if (!user) {
      setUsage(null);
      setLoading(false);
      return;
    }

    async function fetchUsage() {
      try {
        setLoading(true);
        setError(null);

        if (isPremium) {
          setUsage({
            remaining_prompts: 999,
            total_prompts: 999,
            limit_reached: false,
            subscription_tier: 'premium',
          });
          return;
        }

        // Get current week's usage from database
        const weekStartDate = getWeekStart().toISOString().split('T')[0];
        const { data: usage, error: usageError } = await supabase
          .from('usage_stats')
          .select('prompt_count, week_start')
          .eq('user_id', user!.id)
          .gte('week_start', weekStartDate)
          .single();

        if (usageError) {
          if (isUsageSchemaMissing(usageError)) {
            setUsage(defaultFreeUsage());
            return;
          }
          if (usageError.code !== 'PGRST116') {
            console.error('Error fetching usage:', usageError);
            setError('Failed to fetch usage info');
            return;
          }
        }

        const promptCount = usage?.prompt_count ?? 0;
        const remaining = Math.max(0, 3 - promptCount);

        setUsage({
          remaining_prompts: remaining,
          total_prompts: 3,
          limit_reached: promptCount >= 3,
          subscription_tier: 'free',
        });
      } catch (err) {
        console.error('Unexpected error fetching usage:', err);
        setError('Failed to fetch usage info');
      } finally {
        setLoading(false);
      }
    }

    fetchUsage();
  }, [user, isPremium]);

  // Function to manually refresh usage after sending a prompt
  const refreshUsage = useCallback(async () => {
    if (!user || isPremium) return;

    try {
      const { data: usage, error: usageError } = await supabase
        .from('usage_stats')
        .select('prompt_count, week_start')
        .eq('user_id', user.id)
        .gte('week_start', getWeekStart().toISOString().split('T')[0])
        .single();

      if (usageError) {
        if (isUsageSchemaMissing(usageError)) {
          setUsage(defaultFreeUsage());
          return;
        }
        if (usageError.code !== 'PGRST116') {
          console.error('Error refreshing usage:', usageError);
          return;
        }
      }

      const promptCount = usage?.prompt_count ?? 0;
      const remaining = Math.max(0, 3 - promptCount);

      setUsage({
        remaining_prompts: remaining,
        total_prompts: 3,
        limit_reached: promptCount >= 3,
        subscription_tier: 'free',
      });
    } catch (err) {
      console.error('Error refreshing usage:', err);
    }
  }, [user, isPremium]);

  return {
    usage,
    loading,
    error,
    isPremium,
    refreshUsage,
    remainingPrompts: usage?.remaining_prompts ?? 0,
    totalPrompts: usage?.total_prompts ?? 3,
    limitReached: usage?.limit_reached ?? false,
  };
}

/**
 * Helper function to get the start of the current week (Monday)
 */
function getWeekStart(date = new Date()): Date {
  const d = new Date(date);
  const day = d.getDay();
  const diff = d.getDate() - day + (day === 0 ? -6 : 1);
  return new Date(d.setDate(diff));
}
