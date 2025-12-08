-- =====================================================
-- ADD SUBCATEGORIES TABLE TO EXISTING DATABASE
-- Run this FIRST before adding Services category
-- =====================================================

-- Create subcategories table
CREATE TABLE IF NOT EXISTS subcategories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  category_id UUID REFERENCES categories(id) ON DELETE CASCADE NOT NULL,
  name TEXT NOT NULL,
  slug TEXT NOT NULL,
  description TEXT,
  sort_order INTEGER DEFAULT 999,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(category_id, slug)
);

-- Add indexes for performance
CREATE INDEX IF NOT EXISTS idx_subcategories_category_id ON subcategories(category_id);
CREATE INDEX IF NOT EXISTS idx_subcategories_slug ON subcategories(slug);
CREATE INDEX IF NOT EXISTS idx_subcategories_sort_order ON subcategories(sort_order);

-- Enable RLS
ALTER TABLE subcategories ENABLE ROW LEVEL SECURITY;

-- Subcategories policies (read-only for users)
CREATE POLICY "Subcategories are viewable by everyone"
  ON subcategories FOR SELECT
  USING (true);

-- Add subcategory_id field to listings table (optional - for filtering by subcategory)
ALTER TABLE listings ADD COLUMN IF NOT EXISTS subcategory_id UUID REFERENCES subcategories(id) ON DELETE SET NULL;
CREATE INDEX IF NOT EXISTS idx_listings_subcategory_id ON listings(subcategory_id);

-- Verify the table was created
SELECT 'Subcategories table created successfully!' as status;