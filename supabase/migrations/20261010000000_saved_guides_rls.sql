-- ==============================================================================
-- Migration: Enable Row Level Security (RLS) policies on saved_guides
-- Date: 2026-10-10
-- Purpose: Allow authenticated users to view, save, and delete their own saved guides.
-- Run in Supabase SQL Editor: Dashboard -> SQL Editor -> New query -> Run
-- ==============================================================================

-- 1. Ensure table has RLS enabled
ALTER TABLE public.saved_guides ENABLE ROW LEVEL SECURITY;

-- 2. Drop existing policies if any to avoid duplication
DROP POLICY IF EXISTS "Users can view their own saved guides" ON public.saved_guides;
DROP POLICY IF EXISTS "Users can insert their own saved guides" ON public.saved_guides;
DROP POLICY IF EXISTS "Users can update their own saved guides" ON public.saved_guides;
DROP POLICY IF EXISTS "Users can delete their own saved guides" ON public.saved_guides;

-- 3. Policy: View own saved guides
CREATE POLICY "Users can view their own saved guides"
ON public.saved_guides
FOR SELECT
TO authenticated
USING (auth.uid() = user_id);

-- 4. Policy: Save new guide
CREATE POLICY "Users can insert their own saved guides"
ON public.saved_guides
FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = user_id);

-- 5. Policy: Update own saved guide
CREATE POLICY "Users can update their own saved guides"
ON public.saved_guides
FOR UPDATE
TO authenticated
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

-- 6. Policy: Delete own saved guide
CREATE POLICY "Users can delete their own saved guides"
ON public.saved_guides
FOR DELETE
TO authenticated
USING (auth.uid() = user_id);
