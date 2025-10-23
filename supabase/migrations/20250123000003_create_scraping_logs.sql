-- =====================================================
-- Migration: Create scraping_logs table
-- Description: Audit log for scraping operations (KPI: success rate >95%)
-- =====================================================

-- Create scraping_logs table
CREATE TABLE IF NOT EXISTS scraping_logs (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    started_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    completed_at TIMESTAMP WITH TIME ZONE,
    status VARCHAR(20) NOT NULL CHECK (status IN ('success', 'failure')),
    records_inserted INT DEFAULT 0,
    records_updated INT DEFAULT 0,
    error_message TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create index for time-based queries (success rate calculation)
CREATE INDEX IF NOT EXISTS idx_scraping_logs_created_at 
    ON scraping_logs(created_at DESC);

-- Create index for status-based queries
CREATE INDEX IF NOT EXISTS idx_scraping_logs_status 
    ON scraping_logs(status);

-- Enable Row Level Security
ALTER TABLE scraping_logs ENABLE ROW LEVEL SECURITY;

-- RLS Policy: Authenticated users can read logs (for monitoring/debugging)
CREATE POLICY "Authenticated users can read scraping_logs"
    ON scraping_logs FOR SELECT
    USING (auth.role() = 'authenticated');

-- Add constraint: completed_at must be after started_at (if exists)
ALTER TABLE scraping_logs 
    ADD CONSTRAINT chk_scraping_logs_completed_after_started 
    CHECK (completed_at IS NULL OR completed_at >= started_at);

-- Add table and column comments
COMMENT ON TABLE scraping_logs IS 'Audit log for scraping operations. Used for calculating success rate KPI (target: >95%)';
COMMENT ON COLUMN scraping_logs.started_at IS 'When the scraping job started';
COMMENT ON COLUMN scraping_logs.completed_at IS 'When the scraping job completed (NULL if still running or crashed)';
COMMENT ON COLUMN scraping_logs.status IS 'Success or failure. Partial failure counts as failure';
COMMENT ON COLUMN scraping_logs.records_inserted IS 'Number of new records inserted into hospital_wards';
COMMENT ON COLUMN scraping_logs.records_updated IS 'Number of existing records updated in hospital_wards';
COMMENT ON COLUMN scraping_logs.error_message IS 'Error details if status = failure';

