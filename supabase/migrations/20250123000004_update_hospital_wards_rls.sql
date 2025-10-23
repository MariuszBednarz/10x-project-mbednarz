-- =====================================================
-- Migration: Update hospital_wards RLS policies
-- Description: Replace permissive "allow all" policy with authenticated-only access
-- =====================================================

-- Drop existing permissive policy
DROP POLICY IF EXISTS "Allow all operations on hospital_wards" ON hospital_wards;

-- Create new restrictive policy: only authenticated users can read
CREATE POLICY "Authenticated users read hospital_wards"
    ON hospital_wards FOR SELECT
    USING (auth.role() = 'authenticated');

-- Note: No INSERT/UPDATE/DELETE policies needed
-- Scraper uses Service Role Key which bypasses RLS

-- Add NOT NULL constraints for data integrity
ALTER TABLE hospital_wards 
    ALTER COLUMN "wardName" SET NOT NULL,
    ALTER COLUMN "hospitalName" SET NOT NULL,
    ALTER COLUMN "availablePlaces" SET NOT NULL,
    ALTER COLUMN "scrapedAt" SET NOT NULL;

-- Add default value for availablePlaces (fallback if scraper fails to parse)
ALTER TABLE hospital_wards 
    ALTER COLUMN "availablePlaces" SET DEFAULT '0';

COMMENT ON POLICY "Authenticated users read hospital_wards" ON hospital_wards IS 
    'Only authenticated users can read hospital data. No anonymous access for MVP. Scraper bypasses RLS with Service Role Key.';

