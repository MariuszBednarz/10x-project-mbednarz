-- =====================================================
-- Migration: Add database triggers
-- Description: 
--   1. Cleanup orphaned favorites when wards are removed
--   2. Updated_at trigger for ai_insights
-- =====================================================

-- ===========================================
-- TRIGGER 1: Cleanup orphaned favorites
-- ===========================================

-- Function: Remove favorites for wards that no longer exist in hospital_wards
CREATE OR REPLACE FUNCTION cleanup_orphaned_favorites()
RETURNS TRIGGER AS $$
BEGIN
    -- Delete favorites for wards that don't exist in hospital_wards anymore
    DELETE FROM user_favorites 
    WHERE ward_name NOT IN (
        SELECT DISTINCT "wardName" FROM hospital_wards
    );
    
    -- Log cleanup operation (optional, for debugging)
    RAISE NOTICE 'Cleaned up orphaned favorites after hospital_wards change';
    
    RETURN NULL; -- AFTER trigger doesn't need to return anything
END;
$$ LANGUAGE plpgsql;

-- Trigger: Run cleanup after any change to hospital_wards
-- This ensures favorites stay in sync when scraper updates data
CREATE TRIGGER trigger_cleanup_orphaned_favorites
    AFTER INSERT OR UPDATE OR DELETE ON hospital_wards
    FOR EACH STATEMENT
    EXECUTE FUNCTION cleanup_orphaned_favorites();

COMMENT ON FUNCTION cleanup_orphaned_favorites IS 
    'Automatically removes user favorites for wards that no longer exist in hospital_wards. Triggered after scraping updates.';

-- ===========================================
-- TRIGGER 2: Auto-update updated_at for ai_insights
-- ===========================================

-- Function: Update updated_at timestamp on record modification
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Note: ai_insights doesn't have updated_at column in current schema
-- Adding it for consistency with hospital_wards pattern
ALTER TABLE ai_insights 
    ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW();

-- Create trigger for ai_insights
CREATE TRIGGER trigger_ai_insights_updated_at
    BEFORE UPDATE ON ai_insights
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

COMMENT ON TRIGGER trigger_ai_insights_updated_at ON ai_insights IS 
    'Automatically updates updated_at timestamp when ai_insights record is modified';

