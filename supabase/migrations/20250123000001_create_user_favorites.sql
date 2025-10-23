-- =====================================================
-- Migration: Create user_favorites table
-- Description: Stores user's favorite hospital wards
-- Dependencies: auth.users (Supabase Auth)
-- =====================================================

-- Create user_favorites table
CREATE TABLE IF NOT EXISTS user_favorites (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    ward_name VARCHAR(255) NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    -- Ensure user can't favorite the same ward twice
    UNIQUE(user_id, ward_name)
);

-- Create index for faster user queries
CREATE INDEX IF NOT EXISTS idx_user_favorites_user_id 
    ON user_favorites(user_id);

-- Create index for ward_name lookups (used by cleanup trigger)
CREATE INDEX IF NOT EXISTS idx_user_favorites_ward_name 
    ON user_favorites(ward_name);

-- Enable Row Level Security
ALTER TABLE user_favorites ENABLE ROW LEVEL SECURITY;

-- RLS Policy: Users can only read their own favorites
CREATE POLICY "Users can view own favorites"
    ON user_favorites FOR SELECT
    USING (auth.uid() = user_id);

-- RLS Policy: Users can only insert their own favorites
CREATE POLICY "Users can insert own favorites"
    ON user_favorites FOR INSERT
    WITH CHECK (auth.uid() = user_id);

-- RLS Policy: Users can only delete their own favorites
CREATE POLICY "Users can delete own favorites"
    ON user_favorites FOR DELETE
    USING (auth.uid() = user_id);

-- Add table and column comments
COMMENT ON TABLE user_favorites IS 'Stores user favorite hospital wards for quick access';
COMMENT ON COLUMN user_favorites.user_id IS 'Reference to auth.users, CASCADE DELETE on user deletion (GDPR)';
COMMENT ON COLUMN user_favorites.ward_name IS 'Name of the favorite ward (e.g., "Kardiologia"). Soft reference to hospital_wards.wardName';

