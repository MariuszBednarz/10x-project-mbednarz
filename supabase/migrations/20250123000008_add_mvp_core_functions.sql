-- =====================================================
-- Migration: Add MVP core functions
-- Description: 2 essential functions for main application UI
-- Phase: MVP Core Functionality
-- =====================================================

-- ===========================================
-- FUNCTION 1: get_wards_aggregated
-- Endpoint: GET /api/wards
-- Purpose: Main screen - aggregated ward list
-- ===========================================

CREATE OR REPLACE FUNCTION get_wards_aggregated(
  p_search TEXT DEFAULT NULL,
  p_user_id UUID DEFAULT NULL,
  p_favorites_only BOOLEAN DEFAULT FALSE
)
RETURNS TABLE (
  "wardName" VARCHAR,
  "hospitalCount" BIGINT,
  "totalPlaces" INTEGER,
  "isFavorite" BOOLEAN,
  "lastScrapedAt" TIMESTAMP WITH TIME ZONE
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    hw."wardName",
    COUNT(DISTINCT hw."hospitalName")::BIGINT as hospital_count,
    SUM(
      CASE
        WHEN hw."availablePlaces" ~ '^-?[0-9]+$'
        THEN hw."availablePlaces"::INTEGER
        ELSE 0
      END
    )::INTEGER as total_places,
    EXISTS(
      SELECT 1 FROM user_favorites uf
      WHERE uf.user_id = p_user_id
      AND uf.ward_name = hw."wardName"
    ) as is_favorite,
    MAX(hw."scrapedAt") as last_scraped_at
  FROM hospital_wards hw
  WHERE
    (p_search IS NULL OR hw."wardName" ILIKE '%' || p_search || '%')
    AND (
      NOT p_favorites_only
      OR EXISTS(
        SELECT 1 FROM user_favorites uf
        WHERE uf.user_id = p_user_id
        AND uf.ward_name = hw."wardName"
      )
    )
  GROUP BY hw."wardName"
  ORDER BY total_places DESC;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

COMMENT ON FUNCTION get_wards_aggregated IS 
    '[MVP] Aggregates ward data with statistics. Core function for GET /api/wards endpoint.';

-- ===========================================
-- FUNCTION 2: get_user_favorites_with_stats
-- Endpoint: GET /api/users/me/favorites
-- Purpose: User favorites with live availability
-- ===========================================

CREATE OR REPLACE FUNCTION get_user_favorites_with_stats()
RETURNS TABLE (
  id UUID,
  "wardName" VARCHAR,
  "hospitalCount" BIGINT,
  "totalPlaces" INTEGER,
  "createdAt" TIMESTAMP WITH TIME ZONE
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    f.id,
    f.ward_name as "wardName",
    COUNT(DISTINCT h."hospitalName")::BIGINT as hospital_count,
    SUM(
      CASE
        WHEN h."availablePlaces" ~ '^-?[0-9]+$'
        THEN h."availablePlaces"::INTEGER
        ELSE 0
      END
    )::INTEGER as total_places,
    f.created_at as "createdAt"
  FROM user_favorites f
  LEFT JOIN hospital_wards h ON h."wardName" = f.ward_name
  WHERE f.user_id = auth.uid()
  GROUP BY f.id, f.ward_name, f.created_at
  ORDER BY f.created_at DESC;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

COMMENT ON FUNCTION get_user_favorites_with_stats IS 
    '[MVP] Returns user favorites with live statistics. Core function for GET /api/users/me/favorites endpoint.';

-- ===========================================
-- Migration complete - 2 MVP core functions
-- ===========================================

