-- =====================================================
-- Migration: Add helper functions for maintenance and monitoring
-- Description: Utility functions for data freshness checks and statistics
-- =====================================================

-- ===========================================
-- FUNCTION 1: Check if hospital data is stale
-- ===========================================

CREATE OR REPLACE FUNCTION is_data_stale()
RETURNS BOOLEAN AS $$
BEGIN
    RETURN (
        SELECT COALESCE(MAX("scrapedAt"), '1970-01-01'::TIMESTAMP WITH TIME ZONE) 
               < NOW() - INTERVAL '12 hours'
        FROM hospital_wards
    );
END;
$$ LANGUAGE plpgsql STABLE;

COMMENT ON FUNCTION is_data_stale IS 
    'Returns true if the latest scraped data is older than 12 hours. Used for displaying warning banner in frontend.';

-- ===========================================
-- FUNCTION 2: Get last scraping timestamp
-- ===========================================

CREATE OR REPLACE FUNCTION get_last_scrape_time()
RETURNS TIMESTAMP WITH TIME ZONE AS $$
BEGIN
    RETURN (
        SELECT MAX("scrapedAt")
        FROM hospital_wards
    );
END;
$$ LANGUAGE plpgsql STABLE;

COMMENT ON FUNCTION get_last_scrape_time IS 
    'Returns the timestamp of the most recent scraping operation. Returns NULL if no data exists.';

-- ===========================================
-- FUNCTION 3: Count unique wards
-- ===========================================

CREATE OR REPLACE FUNCTION count_unique_wards()
RETURNS INTEGER AS $$
BEGIN
    RETURN (
        SELECT COUNT(DISTINCT "wardName") 
        FROM hospital_wards
    );
END;
$$ LANGUAGE plpgsql STABLE;

COMMENT ON FUNCTION count_unique_wards IS 
    'Returns the count of unique ward names in the system. Useful for monitoring and statistics.';

-- ===========================================
-- FUNCTION 4: Count unique hospitals
-- ===========================================

CREATE OR REPLACE FUNCTION count_unique_hospitals()
RETURNS INTEGER AS $$
BEGIN
    RETURN (
        SELECT COUNT(DISTINCT "hospitalName") 
        FROM hospital_wards
    );
END;
$$ LANGUAGE plpgsql STABLE;

COMMENT ON FUNCTION count_unique_hospitals IS 
    'Returns the count of unique hospital names in the system. Useful for monitoring and statistics.';

-- ===========================================
-- FUNCTION 5: Calculate scraping success rate
-- ===========================================

CREATE OR REPLACE FUNCTION calculate_scraping_success_rate(days INTEGER DEFAULT 30)
RETURNS NUMERIC AS $$
DECLARE
    success_rate NUMERIC;
BEGIN
    SELECT 
        CASE 
            WHEN COUNT(*) = 0 THEN 0
            ELSE ROUND(
                (COUNT(*) FILTER (WHERE status = 'success') * 100.0) / COUNT(*), 
                2
            )
        END INTO success_rate
    FROM scraping_logs 
    WHERE created_at > NOW() - (days || ' days')::INTERVAL;
    
    RETURN success_rate;
END;
$$ LANGUAGE plpgsql STABLE;

COMMENT ON FUNCTION calculate_scraping_success_rate IS 
    'Calculates scraping success rate percentage for the last N days (default 30). Target KPI: >95%. Returns 0 if no logs exist.';

-- ===========================================
-- FUNCTION 6: Get total available places by ward
-- ===========================================

CREATE OR REPLACE FUNCTION get_total_places_by_ward(p_ward_name VARCHAR)
RETURNS INTEGER AS $$
DECLARE
    total_places INTEGER;
BEGIN
    SELECT 
        SUM(
            CASE 
                WHEN "availablePlaces" ~ '^-?[0-9]+$' 
                THEN "availablePlaces"::INTEGER 
                ELSE 0 
            END
        ) INTO total_places
    FROM hospital_wards
    WHERE "wardName" = p_ward_name;
    
    RETURN COALESCE(total_places, 0);
END;
$$ LANGUAGE plpgsql STABLE;

COMMENT ON FUNCTION get_total_places_by_ward IS 
    'Calculates total available places across all hospitals for a specific ward. Handles VARCHAR to INTEGER conversion safely.';

-- ===========================================
-- Example usage queries:
-- ===========================================

-- Check if data is stale:
-- SELECT is_data_stale();

-- Get last scrape time:
-- SELECT get_last_scrape_time();

-- Get statistics:
-- SELECT count_unique_wards(), count_unique_hospitals();

-- Calculate success rate:
-- SELECT calculate_scraping_success_rate(30) as success_rate_30_days;

-- Get total places for Kardiologia:
-- SELECT get_total_places_by_ward('Kardiologia');

