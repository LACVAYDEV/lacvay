-- ==============================================================================
-- Migration: Create commute_guides table for official/admin-published global guides
-- Date: 2026-09-19
-- Purpose: Store global commute guides created by administrators with step-by-step
--          directions and transport segments for Batangas City routes.
-- Note: Tracked migration script — execute when ready.
-- ==============================================================================

-- 1. Create commute_guides table
CREATE TABLE IF NOT EXISTS public.commute_guides (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  summary TEXT,
  destination TEXT,
  steps JSONB NOT NULL DEFAULT '[]'::jsonb,
  transport_segments JSONB NOT NULL DEFAULT '[]'::jsonb,
  difficulty TEXT DEFAULT 'Easy',
  estimated_travel_time_min INT,
  estimated_fare_min NUMERIC(10, 2),
  estimated_fare_max NUMERIC(10, 2),
  created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  is_global BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Comments for schema documentation
COMMENT ON TABLE public.commute_guides IS 'Official and admin-curated commute guides with step-by-step instructions and transport segments';
COMMENT ON COLUMN public.commute_guides.title IS 'Display title of the commute guide (e.g. Grand Terminal to SM City Batangas)';
COMMENT ON COLUMN public.commute_guides.summary IS 'Brief narrative summary of this commute journey';
COMMENT ON COLUMN public.commute_guides.destination IS 'Target destination name or landmark';
COMMENT ON COLUMN public.commute_guides.steps IS 'JSON array of step-by-step directions: [{ order, title, description, tip }]';
COMMENT ON COLUMN public.commute_guides.transport_segments IS 'JSON array of transit legs: [{ type, routeId, routeName, fare, fareType, color }]';
COMMENT ON COLUMN public.commute_guides.difficulty IS 'Commute difficulty rating (Easy, Moderate, Hard)';
COMMENT ON COLUMN public.commute_guides.estimated_travel_time_min IS 'Total estimated travel time in minutes';
COMMENT ON COLUMN public.commute_guides.estimated_fare_min IS 'Minimum estimated cumulative fare in PHP';
COMMENT ON COLUMN public.commute_guides.estimated_fare_max IS 'Maximum estimated cumulative fare in PHP';
COMMENT ON COLUMN public.commute_guides.is_global IS 'If true, guide is published publicly to the Commute Guide tab for all users';

-- 2. Performance indexes
CREATE INDEX IF NOT EXISTS idx_commute_guides_is_global 
ON public.commute_guides (is_global);

CREATE INDEX IF NOT EXISTS idx_commute_guides_created_at 
ON public.commute_guides (created_at DESC);

-- 3. Enable Row Level Security (RLS)
ALTER TABLE public.commute_guides ENABLE ROW LEVEL SECURITY;

-- 4. RLS Policies
-- Allow anyone (including anonymous visitors) to read global commute guides
CREATE POLICY "Allow public read access to global commute guides"
ON public.commute_guides
FOR SELECT
USING (is_global = true);

-- Allow authenticated users to view all commute guides (including drafts if any)
CREATE POLICY "Allow authenticated read on commute guides"
ON public.commute_guides
FOR SELECT
TO authenticated
USING (true);

-- Allow authenticated users (admins) to insert new commute guides
CREATE POLICY "Allow authenticated users to insert commute guides"
ON public.commute_guides
FOR INSERT
TO authenticated
WITH CHECK (auth.uid() IS NOT NULL);

-- Allow authenticated users (admins) to update commute guides
CREATE POLICY "Allow authenticated users to update commute guides"
ON public.commute_guides
FOR UPDATE
TO authenticated
USING (auth.uid() IS NOT NULL)
WITH CHECK (auth.uid() IS NOT NULL);

-- Allow authenticated users (admins) to delete commute guides
CREATE POLICY "Allow authenticated users to delete commute guides"
ON public.commute_guides
FOR DELETE
TO authenticated
USING (auth.uid() IS NOT NULL);
