-- ==============================================================================
-- Migration: Add per-route fare columns to transit_routes & link jeepney_fare_matrix
-- Date: 2026-09-19
-- Purpose: Store fixed cumulative fares per jeepney transit route rather than globally
-- ==============================================================================

-- 1. Add dedicated fixed fare columns directly to transit_routes table
ALTER TABLE public.transit_routes 
ADD COLUMN IF NOT EXISTS regular_fare NUMERIC(10, 2) DEFAULT 13.00,
ADD COLUMN IF NOT EXISTS discounted_fare NUMERIC(10, 2) DEFAULT 11.00,
ADD COLUMN IF NOT EXISTS extended_fare NUMERIC(10, 2) DEFAULT 15.00,
ADD COLUMN IF NOT EXISTS extended_discounted_fare NUMERIC(10, 2) DEFAULT 12.00;

-- Comment on columns for schema documentation
COMMENT ON COLUMN public.transit_routes.regular_fare IS 'Standard in-city flat regular fare for this route (e.g. 13.00)';
COMMENT ON COLUMN public.transit_routes.discounted_fare IS 'Standard in-city discounted fare for students/seniors/PWDs (e.g. 11.00)';
COMMENT ON COLUMN public.transit_routes.extended_fare IS 'Extended trip cumulative total regular fare for this route (e.g. 15.00 or 23.00)';
COMMENT ON COLUMN public.transit_routes.extended_discounted_fare IS 'Extended trip cumulative total discounted fare for this route (e.g. 12.00 or 19.00)';

-- 2. Add route_id foreign key to jeepney_fare_matrix table for landmark-to-landmark pricing
ALTER TABLE public.jeepney_fare_matrix
ADD COLUMN IF NOT EXISTS route_id UUID REFERENCES public.transit_routes(id) ON DELETE CASCADE;

-- Index for fast relational lookup by route_id
CREATE INDEX IF NOT EXISTS idx_jeepney_fare_matrix_route_id 
ON public.jeepney_fare_matrix(route_id);

-- 3. Set standard defaults for any existing routes that currently have NULL fares
UPDATE public.transit_routes 
SET 
  regular_fare = COALESCE(regular_fare, 13.00),
  discounted_fare = COALESCE(discounted_fare, 11.00),
  extended_fare = COALESCE(extended_fare, 15.00),
  extended_discounted_fare = COALESCE(extended_discounted_fare, 12.00)
WHERE regular_fare IS NULL;

-- 4. Apply custom extended fare for Tabangao route (23.00 regular, 19.00 discounted)
UPDATE public.transit_routes
SET 
  regular_fare = 13.00,
  discounted_fare = 11.00,
  extended_fare = 23.00,
  extended_discounted_fare = 19.00
WHERE route_name ILIKE '%Tabangao%';
