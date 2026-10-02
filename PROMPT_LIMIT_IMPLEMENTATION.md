# Prompt Limit Implementation Summary

## Overview
Implemented a weekly prompt limit system for free accounts with a soft upgrade modal notification. Users can still use features after the limit is reached, but see an upgrade prompt.

## Changes Made

### 1. Database Schema (Migration)
**File**: `supabase/migrations/20261002000000_subscription_and_usage.sql`
- Added `subscription_tier` field to `profiles` table (values: 'free' | 'premium')
- Created `usage_stats` table to track weekly prompt usage per user
- Added helper functions:
  - `get_week_start()`: Returns Monday of current week
  - `get_or_create_weekly_usage()`: Gets or creates usage stat for current week
  - `increment_prompt_count()`: Increments prompt count and checks if limit exceeded
- Added Row-Level Security policies for privacy

### 2. Database Types Updated
**Files**: 
- `client/src/types/database.types.ts`
- `server/src/types/database.types.ts`
- Added `subscription_tier: string` to profiles Row type
- Added complete `usage_stats` table type definition

### 3. Backend Changes

#### Usage Service
**File**: `server/src/services/usageService.ts` (NEW)
- `getUserPromptUsage()`: Get current week's prompt usage for a user
- `incrementPromptCount()`: Increment prompt count and return updated usage info
- Returns `PromptUsageInfo` object with:
  - `remaining_prompts`: Number of prompts left
  - `total_prompts`: Total allowed prompts
  - `limit_reached`: Whether limit exceeded
  - `subscription_tier`: User's subscription tier

#### AI Route
**File**: `server/src/routes/ai.ts`
- Added authentication requirement (`requireUser` middleware)
- Integrated `incrementPromptCount()` to track each prompt
- Returns usage info in response alongside AI reply

### 4. Frontend Components

#### Prompt Limit Hook
**File**: `client/src/hooks/usePromptLimit.ts` (NEW)
- `usePromptLimit()` hook that provides:
  - `usage`: Full usage info object
  - `isPremium`: Whether user has premium subscription
  - `remainingPrompts`: Number of prompts left
  - `totalPrompts`: Total allowed (3 for free, 999 for premium)
  - `limitReached`: Whether limit exceeded
  - `refreshUsage()`: Manual function to refresh after sending prompt
- Auto-fetches usage on mount
- Premium users always show 999 remaining
- Handles weekly reset automatically

#### Upgrade Modal Component
**File**: `client/src/components/ui/UpgradeModal.tsx` (NEW)
- Modal shown when free user reaches 3 prompts
- Displays:
  - Current usage (3/3)
  - Progress bar
  - Weekly reset information
  - Premium benefits list
  - "Upgrade to Premium" button
  - "Continue without upgrading" button
- Key feature: Doesn't block usage, just shows as reminder

#### Prompt Counter Component
**File**: `client/src/components/ui/PromptCounter.tsx` (NEW)
- Displays remaining prompts (e.g., "2 left")
- Shows progress bar with usage visualization
- Premium accounts show "✨ Premium" badge
- Free accounts show warning when ≤1 prompt remaining
- Used in AI interface footer

### 5. AI Assistant Page Updates
**File**: `client/src/pages/AIAssistantPage.tsx`
- Added imports for `usePromptLimit`, `UpgradeModal`, `PromptCounter`
- Integrated `usePromptLimit()` hook
- Added state for `showUpgradeModal`
- Updated `handleSend()` to:
  - Refresh usage after sending prompt
  - Show upgrade modal if limit reached
- Added `<PromptCounter>` display in footer (only for free users)
- Added `<UpgradeModal>` component at end of JSX

### 6. Settings Page Updates
**File**: `client/src/pages/SettingsPage.tsx`
- Added imports for `usePromptLimit` and `Zap` icon
- Integrated `usePromptLimit()` hook
- Added "Subscription & Limits" card showing:
  - Account type (Free 🆓 or Premium ✨)
  - Weekly AI prompts remaining (for free accounts)
  - Progress bar of usage
  - Reset schedule (Monday 12:00 AM)
  - "Upgrade to Premium" button

## Key Features

✅ **Weekly Reset**: Automatically resets every Monday at 12:00 AM
✅ **Soft Blocking**: Users can still use features despite limit
✅ **Multiple Displays**: Counter in AI page + upgrade modal + profile section
✅ **Premium Bypass**: Premium users show unlimited (999)
✅ **Real-time Tracking**: Updates after each prompt via API response
✅ **User-Friendly**: Clear progress visualization and messaging
✅ **Type-Safe**: Full TypeScript support throughout
✅ **Database-Backed**: Persistent tracking via Supabase

## Testing Checklist

- [ ] Run migration: `supabase db push`
- [ ] Create test users with 'free' and 'premium' subscription tiers
- [ ] Test AI prompts:
  - Free user: Should allow 3 prompts, show modal on 4th
  - Premium user: Should allow unlimited, no modal
- [ ] Test weekly reset: Verify count resets on Monday
- [ ] Test UI elements:
  - PromptCounter visibility and accuracy
  - Modal appearance and functionality
  - Settings page subscription display
- [ ] Test after sending prompts: Usage should refresh automatically

## Notes

- All changes are backward compatible
- Existing users default to 'free' tier (from migration default)
- Premium upgrade logic can be added to "Upgrade to Premium" button later
- Modal shows even after limit reached (soft warning, not hard block)
- Weekly reset is automatic via database functions
