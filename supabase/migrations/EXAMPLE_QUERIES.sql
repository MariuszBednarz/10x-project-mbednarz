-- =====================================================
-- Example Queries for HosLU Database
-- =====================================================
-- This file contains common queries for development and debugging
-- DO NOT RUN AS MIGRATION - for reference only

-- =====================================================
-- HOSPITAL WARDS QUERIES
-- =====================================================

-- Get all wards with fresh data (last 12 hours)
SELECT 
    "wardName",
    COUNT(*) as hospital_count,
    SUM(CASE 
        WHEN "availablePlaces" ~ '^-?[0-9]+$' 
        THEN "availablePlaces"::INTEGER 
        ELSE 0 
    END) as total_places,
    MAX("scrapedAt") as last_scraped
FROM hospital_wards
WHERE "scrapedAt" > NOW() - INTERVAL '12 hours'
GROUP BY "wardName"
ORDER BY "wardName";

-- Get hospitals by specific ward (e.g., Kardiologia)
SELECT 
    "hospitalName",
    district,
    "availablePlaces",
    "scrapedAt",
    "lastUpdated"
FROM hospital_wards
WHERE "wardName" = 'Kardiologia'
ORDER BY 
    CASE 
        WHEN "availablePlaces" ~ '^-?[0-9]+$' 
        THEN "availablePlaces"::INTEGER 
        ELSE 0 
    END DESC;

-- Search wards by name (fuzzy match)
SELECT DISTINCT "wardName"
FROM hospital_wards
WHERE "wardName" ILIKE '%kardio%'
ORDER BY "wardName";

-- Get wards with low availability (<=5 places total)
SELECT 
    "wardName",
    COUNT(*) as hospitals,
    SUM(CASE 
        WHEN "availablePlaces" ~ '^-?[0-9]+$' 
        THEN "availablePlaces"::INTEGER 
        ELSE 0 
    END) as total_places
FROM hospital_wards
GROUP BY "wardName"
HAVING SUM(CASE 
    WHEN "availablePlaces" ~ '^-?[0-9]+$' 
    THEN "availablePlaces"::INTEGER 
    ELSE 0 
END) <= 5
ORDER BY total_places ASC;

-- Get hospitals with overflow (negative places)
SELECT 
    "wardName",
    "hospitalName",
    district,
    "availablePlaces",
    "scrapedAt"
FROM hospital_wards
WHERE "availablePlaces" ~ '^-[0-9]+$'  -- Regex for negative numbers
ORDER BY "availablePlaces"::INTEGER ASC;

-- Check data freshness
SELECT 
    MAX("scrapedAt") as latest_scrape,
    MIN("scrapedAt") as oldest_record,
    CASE 
        WHEN MAX("scrapedAt") < NOW() - INTERVAL '12 hours' 
        THEN 'STALE' 
        ELSE 'FRESH' 
    END as data_status
FROM hospital_wards;

-- =====================================================
-- USER FAVORITES QUERIES
-- =====================================================

-- Get user's favorite wards with current availability
SELECT 
    f.ward_name,
    f.created_at as favorited_at,
    COUNT(DISTINCT h."hospitalName") as hospital_count,
    SUM(CASE 
        WHEN h."availablePlaces" ~ '^-?[0-9]+$' 
        THEN h."availablePlaces"::INTEGER 
        ELSE 0 
    END) as total_places,
    MAX(h."scrapedAt") as last_updated
FROM user_favorites f
LEFT JOIN hospital_wards h ON h."wardName" = f.ward_name
WHERE f.user_id = 'USER_UUID_HERE'
GROUP BY f.ward_name, f.created_at
ORDER BY f.created_at DESC;

-- Count favorites per user
SELECT 
    user_id,
    COUNT(*) as favorite_count
FROM user_favorites
GROUP BY user_id
ORDER BY favorite_count DESC;

-- Find orphaned favorites (wards that don't exist anymore)
SELECT 
    f.ward_name,
    f.user_id,
    COUNT(h.id) as matching_records
FROM user_favorites f
LEFT JOIN hospital_wards h ON h."wardName" = f.ward_name
GROUP BY f.ward_name, f.user_id
HAVING COUNT(h.id) = 0;

-- =====================================================
-- AI INSIGHTS QUERIES
-- =====================================================

-- Get active (non-expired) insights
SELECT 
    insight_text,
    generated_at,
    expires_at,
    EXTRACT(EPOCH FROM (expires_at - NOW())) / 3600 as hours_until_expiry
FROM ai_insights
WHERE expires_at > NOW()
ORDER BY generated_at DESC
LIMIT 1;

-- Get all insights history (for analytics)
SELECT 
    insight_text,
    generated_at,
    expires_at,
    CASE 
        WHEN expires_at > NOW() THEN 'ACTIVE'
        ELSE 'EXPIRED'
    END as status
FROM ai_insights
ORDER BY generated_at DESC
LIMIT 10;

-- Check if new insight is needed
SELECT 
    CASE 
        WHEN MAX(expires_at) < NOW() OR MAX(expires_at) IS NULL 
        THEN 'GENERATE_NEW'
        ELSE 'USE_CACHED'
    END as action,
    MAX(generated_at) as last_generation,
    MAX(expires_at) as current_expiry
FROM ai_insights;

-- =====================================================
-- SCRAPING LOGS QUERIES
-- =====================================================

-- Calculate success rate (last 30 days)
SELECT 
    COUNT(*) as total_runs,
    COUNT(*) FILTER (WHERE status = 'success') as successes,
    COUNT(*) FILTER (WHERE status = 'failure') as failures,
    ROUND(
        COUNT(*) FILTER (WHERE status = 'success') * 100.0 / COUNT(*), 
        2
    ) as success_rate_percent
FROM scraping_logs
WHERE created_at > NOW() - INTERVAL '30 days';

-- Recent scraping activity
SELECT 
    started_at,
    completed_at,
    status,
    records_inserted,
    records_updated,
    EXTRACT(EPOCH FROM (completed_at - started_at)) as duration_seconds,
    error_message
FROM scraping_logs
ORDER BY started_at DESC
LIMIT 10;

-- Failed scraping runs
SELECT 
    started_at,
    error_message,
    records_inserted,
    records_updated
FROM scraping_logs
WHERE status = 'failure'
ORDER BY started_at DESC
LIMIT 5;

-- Average scraping duration and record counts
SELECT 
    AVG(EXTRACT(EPOCH FROM (completed_at - started_at))) as avg_duration_seconds,
    AVG(records_inserted) as avg_inserted,
    AVG(records_updated) as avg_updated,
    MAX(records_inserted + records_updated) as max_records_processed
FROM scraping_logs
WHERE status = 'success' 
  AND completed_at IS NOT NULL
  AND created_at > NOW() - INTERVAL '30 days';

-- =====================================================
-- HELPER FUNCTIONS USAGE
-- =====================================================

-- Check if data is stale
SELECT is_data_stale() as is_stale;

-- Get last scrape timestamp
SELECT 
    get_last_scrape_time() as last_scrape,
    NOW() - get_last_scrape_time() as time_since_scrape;

-- Get statistics
SELECT 
    count_unique_wards() as unique_wards,
    count_unique_hospitals() as unique_hospitals,
    (SELECT COUNT(*) FROM hospital_wards) as total_records;

-- Calculate success rate for different periods
SELECT 
    calculate_scraping_success_rate(7) as last_7_days,
    calculate_scraping_success_rate(30) as last_30_days,
    calculate_scraping_success_rate(90) as last_90_days;

-- Get total places for specific ward
SELECT 
    'Kardiologia' as ward,
    get_total_places_by_ward('Kardiologia') as total_places;

-- =====================================================
-- MONITORING & DEBUGGING QUERIES
-- =====================================================

-- Overall system health check
SELECT 
    'Data Freshness' as metric,
    CASE 
        WHEN is_data_stale() THEN '⚠️ STALE' 
        ELSE '✅ FRESH' 
    END as status,
    get_last_scrape_time() as last_update
UNION ALL
SELECT 
    'Scraping Success Rate (30d)',
    CASE 
        WHEN calculate_scraping_success_rate(30) >= 95 THEN '✅ GOOD'
        WHEN calculate_scraping_success_rate(30) >= 80 THEN '⚠️ WARNING'
        ELSE '❌ CRITICAL'
    END,
    calculate_scraping_success_rate(30)::TEXT || '%'
UNION ALL
SELECT 
    'Total Wards',
    '📊 INFO',
    count_unique_wards()::TEXT
UNION ALL
SELECT 
    'Total Hospitals',
    '📊 INFO',
    count_unique_hospitals()::TEXT;

-- Check RLS policies status
SELECT 
    tablename,
    policyname,
    cmd,
    qual
FROM pg_policies
WHERE schemaname = 'public'
ORDER BY tablename, policyname;

-- Check trigger status
SELECT 
    tgname as trigger_name,
    tgrelid::regclass as table_name,
    tgenabled as enabled,
    CASE tgenabled
        WHEN 'O' THEN '✅ Enabled'
        WHEN 'D' THEN '❌ Disabled'
        ELSE '⚠️ Other'
    END as status
FROM pg_trigger
WHERE tgname IN (
    'trigger_cleanup_orphaned_favorites',
    'trigger_ai_insights_updated_at',
    'update_hospital_wards_updated_at'
)
ORDER BY tgname;

-- Check index usage statistics
SELECT 
    schemaname,
    tablename,
    indexname,
    idx_scan as times_used,
    idx_tup_read as tuples_read,
    idx_tup_fetch as tuples_fetched
FROM pg_stat_user_indexes
WHERE schemaname = 'public'
ORDER BY idx_scan DESC;

-- Find duplicate hospital_wards records (should be none due to unique constraint)
SELECT 
    "wardName",
    "hospitalName",
    COUNT(*) as duplicate_count
FROM hospital_wards
GROUP BY "wardName", "hospitalName"
HAVING COUNT(*) > 1;

-- =====================================================
-- ANALYTICS & REPORTING QUERIES
-- =====================================================

-- Top 10 wards by total capacity
SELECT 
    "wardName",
    COUNT(DISTINCT "hospitalName") as hospital_count,
    SUM(CASE 
        WHEN "availablePlaces" ~ '^-?[0-9]+$' 
        THEN "availablePlaces"::INTEGER 
        ELSE 0 
    END) as total_capacity
FROM hospital_wards
GROUP BY "wardName"
ORDER BY total_capacity DESC
LIMIT 10;

-- Districts with most hospitals
SELECT 
    district,
    COUNT(DISTINCT "hospitalName") as hospital_count,
    COUNT(DISTINCT "wardName") as ward_count
FROM hospital_wards
WHERE district IS NOT NULL
GROUP BY district
ORDER BY hospital_count DESC;

-- Most favorited wards
SELECT 
    ward_name,
    COUNT(DISTINCT user_id) as users_favorited,
    get_total_places_by_ward(ward_name) as current_availability
FROM user_favorites
GROUP BY ward_name
ORDER BY users_favorited DESC
LIMIT 10;

-- =====================================================
-- CLEANUP & MAINTENANCE QUERIES
-- =====================================================

-- Delete old scraping logs (keep last 90 days)
-- CAUTION: Only run if you want to clean up old logs
-- DELETE FROM scraping_logs 
-- WHERE created_at < NOW() - INTERVAL '90 days';

-- Delete expired AI insights (older than 7 days)
-- CAUTION: Only run if you want to clean up old insights
-- DELETE FROM ai_insights 
-- WHERE expires_at < NOW() - INTERVAL '7 days';

-- Manually trigger orphaned favorites cleanup
-- SELECT cleanup_orphaned_favorites();

-- Vacuum and analyze tables (optimize performance)
-- VACUUM ANALYZE hospital_wards;
-- VACUUM ANALYZE user_favorites;
-- VACUUM ANALYZE ai_insights;
-- VACUUM ANALYZE scraping_logs;

-- =====================================================
-- TESTING QUERIES (Development Only)
-- =====================================================

-- Insert test scraping log
-- INSERT INTO scraping_logs (started_at, completed_at, status, records_inserted, records_updated)
-- VALUES (NOW() - INTERVAL '1 minute', NOW(), 'success', 150, 200);

-- Insert test AI insight
-- INSERT INTO ai_insights (insight_text, generated_at, expires_at)
-- VALUES (
--     'Test insight: High availability in Ortopedia (25 beds)',
--     NOW(),
--     NOW() + INTERVAL '24 hours'
-- );

-- =====================================================
-- END OF EXAMPLE QUERIES
-- =====================================================

