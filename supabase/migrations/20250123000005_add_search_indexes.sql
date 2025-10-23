-- =====================================================
-- Migration: Add search indexes for live search functionality
-- Description: Trigram indexes for fuzzy search on wardName
-- =====================================================

-- Enable pg_trgm extension for fuzzy/similarity search
CREATE EXTENSION IF NOT EXISTS pg_trgm;

-- Drop existing basic index (will be replaced with trigram)
DROP INDEX IF EXISTS idx_hospital_wards_ward_name;

-- Create trigram index for case-insensitive fuzzy search on wardName
CREATE INDEX IF NOT EXISTS idx_hospital_wards_ward_name_trgm 
    ON hospital_wards USING gin("wardName" gin_trgm_ops);

-- Keep existing indexes (already created in initial migration)
-- idx_hospital_wards_scraped_at - for sorting by freshness
-- idx_hospital_wards_district - for district filtering

-- Query pattern for frontend live search:
-- SELECT DISTINCT "wardName" 
-- FROM hospital_wards 
-- WHERE "wardName" ILIKE '%search_term%' 
-- ORDER BY "wardName";

COMMENT ON INDEX idx_hospital_wards_ward_name_trgm IS 
    'GIN trigram index for fast case-insensitive fuzzy search on ward names. Supports live search with 300ms debounce.';

