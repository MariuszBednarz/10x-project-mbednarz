-- =====================================================
-- Migration: Add missing helper functions for API endpoints
-- Description: Functions required by api-plan.md but missing from previous migrations
-- Dependencies: 20250123000007_add_helper_functions.sql
-- =====================================================

-- ===========================================
-- FUNCTION 1: get_system_status
-- Endpoint: GET /api/status
-- Purpose: Aggregates all system health metrics
-- ===========================================

CREATE OR REPLACE FUNCTION get_system_status()
RETURNS JSON AS $$
DECLARE
    result JSON;
    last_scrape TIMESTAMP WITH TIME ZONE;
BEGIN
    last_scrape := get_last_scrape_time();

    SELECT json_build_object(
        'isStale', is_data_stale(),
        'lastScrapeTime', last_scrape,
        'hoursSinceLastScrape', EXTRACT(EPOCH FROM (NOW() - last_scrape)) / 3600,
        'totalWards', count_unique_wards(),
        'totalHospitals', count_unique_hospitals(),
        'scrapingSuccessRate30d', calculate_scraping_success_rate(30)
    ) INTO result;

    RETURN result;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

COMMENT ON FUNCTION get_system_status IS 
    '[MVP] Returns comprehensive system status including data freshness, counts, and success rate. Used by GET /api/status endpoint.';

-- ===========================================
-- FUNCTION 2: get_unique_districts
-- Endpoint: GET /api/wards (filter dropdown)
-- Purpose: Returns list of unique districts for filtering
-- ===========================================

CREATE OR REPLACE FUNCTION get_unique_districts()
RETURNS TABLE (district VARCHAR) AS $$
BEGIN
    RETURN QUERY
    SELECT DISTINCT hw.district
    FROM hospital_wards hw
    WHERE hw.district IS NOT NULL
    ORDER BY hw.district ASC;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

COMMENT ON FUNCTION get_unique_districts IS 
    '[MVP] Returns unique districts for filter dropdown. Used by GET /api/wards endpoint.';

-- ===========================================
-- FUNCTION 3: delete_user_account (for GDPR compliance)
-- Note: This function requires Supabase Admin SDK in API route
-- Kept as placeholder for documentation purposes
-- ===========================================

-- This function is NOT implemented in PostgreSQL because:
-- 1. Deleting from auth.users requires admin privileges
-- 2. Supabase recommends using Admin SDK: supabaseAdmin.auth.admin.deleteUser()
-- 3. CASCADE DELETE on user_favorites is handled automatically via FK constraint

-- See api-implementation-plan.md Section 4.8 for implementation pattern

COMMENT ON SCHEMA public IS 
    'DELETE /api/users/me implementation uses Supabase Admin SDK, not SQL function. CASCADE DELETE on user_favorites via FK constraint.';

-- ===========================================
-- Migration complete - 2 additional helper functions
-- ===========================================

