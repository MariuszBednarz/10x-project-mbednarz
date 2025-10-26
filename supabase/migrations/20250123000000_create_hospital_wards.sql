-- =====================================================
-- Migration: Create hospital_wards table
-- Description: Stores scraped hospital ward data with availability information
-- Note: This table is shared with other microservices
-- =====================================================

-- Create table for hospital ward data
CREATE TABLE IF NOT EXISTS hospital_wards (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    "wardName" VARCHAR(255) NOT NULL,
    "wardLink" TEXT,
    district VARCHAR(255),
    "hospitalName" VARCHAR(500) NOT NULL,
    "availablePlaces" VARCHAR(50),
    "lastUpdated" VARCHAR(100),
    "scrapedAt" TIMESTAMP WITH TIME ZONE NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),

    -- Composite unique constraint for upsert operations
    UNIQUE("wardName", "hospitalName")
);

-- Create indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_hospital_wards_scraped_at ON hospital_wards("scrapedAt" DESC);
CREATE INDEX IF NOT EXISTS idx_hospital_wards_ward_name ON hospital_wards("wardName");
CREATE INDEX IF NOT EXISTS idx_hospital_wards_district ON hospital_wards(district);

-- Create updated_at trigger
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_hospital_wards_updated_at
    BEFORE UPDATE ON hospital_wards
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Enable Row Level Security (optional, recommended for Supabase)
ALTER TABLE hospital_wards ENABLE ROW LEVEL SECURITY;

-- Create policy to allow all operations (adjust based on your security needs)
CREATE POLICY "Allow all operations on hospital_wards"
    ON hospital_wards
    FOR ALL
    USING (true)
    WITH CHECK (true);

-- Optional: Add comments to document the schema
COMMENT ON TABLE hospital_wards IS 'Stores scraped hospital ward data with availability information';
COMMENT ON COLUMN hospital_wards."wardName" IS 'Name of the hospital ward/department';
COMMENT ON COLUMN hospital_wards."wardLink" IS 'URL link to the ward details page';
COMMENT ON COLUMN hospital_wards.district IS 'District/region where the hospital is located';
COMMENT ON COLUMN hospital_wards."hospitalName" IS 'Name of the hospital';
COMMENT ON COLUMN hospital_wards."availablePlaces" IS 'Number of available places/beds';

-- ⚠️ CRITICAL: Date field distinctions (see DATES_DOCUMENTATION.md)
COMMENT ON COLUMN hospital_wards."lastUpdated" IS '⚠️ UNRELIABLE: String from hospital website HTML. Usually "-". DO NOT use for filtering/sorting. For display only.';
COMMENT ON COLUMN hospital_wards."scrapedAt" IS '✅ RELIABLE: Timestamp when WE scraped the data. Use this for filtering, sorting, and determining data freshness.';
COMMENT ON COLUMN hospital_wards.created_at IS '✅ RELIABLE: When record was first inserted. Never changes. Use for audit/tracking when ward appeared in system.';
COMMENT ON COLUMN hospital_wards.updated_at IS '✅ RELIABLE: When record was last updated (trigger). Changes on every UPDATE. Use for tracking data changes.';



