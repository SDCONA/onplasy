-- Real Estate Category and Details Update
-- This file adds real estate functionality to the marketplace

-- Add Real Estate category (if not exists)
INSERT INTO public.categories (name, slug) VALUES
  ('Real Estate', 'real-estate')
ON CONFLICT (slug) DO NOTHING;

-- Real Estate details table
CREATE TABLE IF NOT EXISTS public.real_estate_details (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  listing_id UUID NOT NULL REFERENCES public.listings(id) ON DELETE CASCADE,
  property_type TEXT NOT NULL CHECK (property_type IN ('residential', 'commercial', 'land', 'rent')),
  bedrooms INTEGER,
  bathrooms DECIMAL(2,1),
  square_feet INTEGER,
  lot_size INTEGER,
  year_built INTEGER,
  parking_spaces INTEGER,
  address TEXT NOT NULL,
  city TEXT NOT NULL,
  state TEXT NOT NULL,
  zip_code TEXT NOT NULL,
  amenities TEXT[],
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(listing_id)
);

-- Indexes for better performance
CREATE INDEX IF NOT EXISTS idx_real_estate_listing_id ON public.real_estate_details(listing_id);
CREATE INDEX IF NOT EXISTS idx_real_estate_property_type ON public.real_estate_details(property_type);
CREATE INDEX IF NOT EXISTS idx_real_estate_city ON public.real_estate_details(city);

-- Enable RLS
ALTER TABLE public.real_estate_details ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Users can view real estate details"
  ON public.real_estate_details FOR SELECT
  USING (true);

-- Grant permissions (if needed)
GRANT SELECT ON public.real_estate_details TO anon;
GRANT SELECT ON public.real_estate_details TO authenticated;

-- Property Types:
-- - residential: Single-family homes, condos, townhouses for sale
-- - commercial: Office buildings, retail spaces, warehouses for sale
-- - land: Vacant land, lots for sale
-- - rent: Properties available for rent (residential or commercial)

-- Example query to get real estate listings with details:
-- SELECT 
--   l.*,
--   red.*
-- FROM listings l
-- JOIN categories c ON l.category_id = c.id
-- LEFT JOIN real_estate_details red ON l.id = red.listing_id
-- WHERE c.slug = 'real-estate'
-- AND l.status = 'active';
