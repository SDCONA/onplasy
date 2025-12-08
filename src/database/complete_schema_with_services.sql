-- =====================================================
-- COMPLETE MARKETPLACE DATABASE SCHEMA
-- With Services Category and 100 Subcategories
-- =====================================================

-- Drop existing tables if any (clean slate)
DROP TABLE IF EXISTS subcategories CASCADE;
DROP TABLE IF EXISTS messages CASCADE;
DROP TABLE IF EXISTS reviews CASCADE;
DROP TABLE IF EXISTS reports CASCADE;
DROP TABLE IF EXISTS saved_listings CASCADE;
DROP TABLE IF EXISTS listings CASCADE;
DROP TABLE IF EXISTS categories CASCADE;
DROP TABLE IF EXISTS profiles CASCADE;

-- Drop existing functions if any
DROP FUNCTION IF EXISTS check_reports_count CASCADE;
DROP FUNCTION IF EXISTS update_seller_rating CASCADE;
DROP FUNCTION IF EXISTS check_listing_expiry CASCADE;

-- =====================================================
-- PROFILES TABLE
-- Stores user information and ratings
-- =====================================================
CREATE TABLE profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT UNIQUE NOT NULL,
  name TEXT NOT NULL,
  avatar_url TEXT,
  bio TEXT,
  phone TEXT,
  location TEXT,
  is_admin BOOLEAN DEFAULT FALSE,
  rating_average DECIMAL(3,2) DEFAULT 0,
  rating_count INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- =====================================================
-- CATEGORIES TABLE
-- Product categories with custom sort order
-- =====================================================
CREATE TABLE categories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT UNIQUE NOT NULL,
  slug TEXT UNIQUE NOT NULL,
  description TEXT,
  icon TEXT,
  sort_order INTEGER DEFAULT 999,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- =====================================================
-- SUBCATEGORIES TABLE
-- Subcategories within each category
-- =====================================================
CREATE TABLE subcategories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  category_id UUID REFERENCES categories(id) ON DELETE CASCADE NOT NULL,
  name TEXT NOT NULL,
  slug TEXT NOT NULL,
  description TEXT,
  sort_order INTEGER DEFAULT 999,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(category_id, slug)
);

-- =====================================================
-- LISTINGS TABLE
-- Main listings table with support for all product types
-- including real estate properties
-- =====================================================
CREATE TABLE listings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  category_id UUID REFERENCES categories(id) ON DELETE SET NULL,
  subcategory_id UUID REFERENCES subcategories(id) ON DELETE SET NULL,
  
  -- Basic listing info
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  price DECIMAL(12,2) NOT NULL,
  images TEXT[] DEFAULT '{}',
  
  -- Listing status and lifecycle
  status TEXT DEFAULT 'active' CHECK (status IN ('active', 'archived', 'sold')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  expires_at TIMESTAMPTZ DEFAULT (NOW() + INTERVAL '7 days'),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  
  -- General product fields
  condition TEXT CHECK (condition IN ('new', 'like-new', 'good', 'fair', 'poor')),
  brand TEXT,
  location TEXT,
  
  -- Apparel-specific fields
  size TEXT,
  color TEXT,
  material TEXT,
  
  -- Car-specific fields
  make TEXT,
  model TEXT,
  year INTEGER,
  mileage INTEGER,
  fuel_type TEXT,
  transmission TEXT,
  vin TEXT,
  
  -- Real Estate-specific fields
  property_type TEXT CHECK (property_type IN ('residential', 'commercial', 'land', 'rental')),
  listing_type TEXT CHECK (listing_type IN ('sale', 'rent', 'lease')),
  
  -- Property details
  bedrooms INTEGER,
  bathrooms DECIMAL(3,1),
  square_feet INTEGER,
  lot_size INTEGER,
  year_built INTEGER,
  
  -- Address
  street_address TEXT,
  city TEXT,
  state TEXT,
  zip_code TEXT,
  country TEXT DEFAULT 'USA',
  
  -- Property features
  parking_spaces INTEGER,
  garage_type TEXT,
  amenities TEXT[] DEFAULT '{}',
  appliances TEXT[] DEFAULT '{}',
  
  -- Additional property info
  hoa_fees DECIMAL(10,2),
  property_tax DECIMAL(10,2),
  zoning TEXT,
  
  -- Moderation
  report_count INTEGER DEFAULT 0,
  
  -- Indexes
  CONSTRAINT valid_expiry CHECK (expires_at > created_at)
);

-- =====================================================
-- SAVED LISTINGS TABLE
-- Users can save/favorite listings
-- =====================================================
CREATE TABLE saved_listings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  listing_id UUID REFERENCES listings(id) ON DELETE CASCADE NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, listing_id)
);

-- =====================================================
-- MESSAGES TABLE
-- Direct messaging between users
-- =====================================================
CREATE TABLE messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  conversation_id TEXT NOT NULL,
  sender_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  receiver_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  listing_id UUID REFERENCES listings(id) ON DELETE CASCADE,
  content TEXT NOT NULL,
  is_read BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  
  -- Ensure conversation_id is consistent
  CONSTRAINT conversation_format CHECK (
    conversation_id = LEAST(sender_id::TEXT, receiver_id::TEXT) || '_' || GREATEST(sender_id::TEXT, receiver_id::TEXT)
  )
);

-- =====================================================
-- REVIEWS TABLE
-- User reviews and ratings
-- =====================================================
CREATE TABLE reviews (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  listing_id UUID REFERENCES listings(id) ON DELETE CASCADE NOT NULL,
  reviewer_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  seller_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  rating INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 5),
  comment TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(listing_id, reviewer_id)
);

-- =====================================================
-- REPORTS TABLE
-- User reports for listings
-- =====================================================
CREATE TABLE reports (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  listing_id UUID REFERENCES listings(id) ON DELETE CASCADE NOT NULL,
  reporter_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  reason TEXT NOT NULL,
  description TEXT,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'reviewed', 'resolved', 'dismissed')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  reviewed_at TIMESTAMPTZ,
  reviewed_by UUID REFERENCES profiles(id) ON DELETE SET NULL,
  UNIQUE(listing_id, reporter_id)
);

-- =====================================================
-- INDEXES FOR PERFORMANCE
-- =====================================================

-- Profiles
CREATE INDEX idx_profiles_email ON profiles(email);
CREATE INDEX idx_profiles_is_admin ON profiles(is_admin);

-- Categories
CREATE INDEX idx_categories_sort_order ON categories(sort_order);

-- Subcategories
CREATE INDEX idx_subcategories_category_id ON subcategories(category_id);
CREATE INDEX idx_subcategories_slug ON subcategories(slug);
CREATE INDEX idx_subcategories_sort_order ON subcategories(sort_order);

-- Listings
CREATE INDEX idx_listings_user_id ON listings(user_id);
CREATE INDEX idx_listings_category_id ON listings(category_id);
CREATE INDEX idx_listings_subcategory_id ON listings(subcategory_id);
CREATE INDEX idx_listings_status ON listings(status);
CREATE INDEX idx_listings_created_at ON listings(created_at DESC);
CREATE INDEX idx_listings_price ON listings(price);
CREATE INDEX idx_listings_expires_at ON listings(expires_at);
CREATE INDEX idx_listings_property_type ON listings(property_type);
CREATE INDEX idx_listings_listing_type ON listings(listing_type);
CREATE INDEX idx_listings_location ON listings(location);
CREATE INDEX idx_listings_city_state ON listings(city, state);

-- Full-text search on listings
CREATE INDEX idx_listings_title_search ON listings USING GIN(to_tsvector('english', title));
CREATE INDEX idx_listings_description_search ON listings USING GIN(to_tsvector('english', description));

-- Saved Listings
CREATE INDEX idx_saved_listings_user_id ON saved_listings(user_id);
CREATE INDEX idx_saved_listings_listing_id ON saved_listings(listing_id);

-- Messages
CREATE INDEX idx_messages_conversation_id ON messages(conversation_id);
CREATE INDEX idx_messages_sender_id ON messages(sender_id);
CREATE INDEX idx_messages_receiver_id ON messages(receiver_id);
CREATE INDEX idx_messages_listing_id ON messages(listing_id);
CREATE INDEX idx_messages_created_at ON messages(created_at DESC);
CREATE INDEX idx_messages_is_read ON messages(is_read);

-- Reviews
CREATE INDEX idx_reviews_listing_id ON reviews(listing_id);
CREATE INDEX idx_reviews_seller_id ON reviews(seller_id);
CREATE INDEX idx_reviews_reviewer_id ON reviews(reviewer_id);

-- Reports
CREATE INDEX idx_reports_listing_id ON reports(listing_id);
CREATE INDEX idx_reports_status ON reports(status);
CREATE INDEX idx_reports_reporter_id ON reports(reporter_id);

-- =====================================================
-- ROW LEVEL SECURITY (RLS) POLICIES
-- =====================================================

-- Enable RLS on all tables
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE subcategories ENABLE ROW LEVEL SECURITY;
ALTER TABLE listings ENABLE ROW LEVEL SECURITY;
ALTER TABLE saved_listings ENABLE ROW LEVEL SECURITY;
ALTER TABLE messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE reviews ENABLE ROW LEVEL SECURITY;
ALTER TABLE reports ENABLE ROW LEVEL SECURITY;

-- Profiles policies
CREATE POLICY "Public profiles are viewable by everyone"
  ON profiles FOR SELECT
  USING (true);

CREATE POLICY "Users can update own profile"
  ON profiles FOR UPDATE
  USING (auth.uid() = id);

CREATE POLICY "Users can insert own profile"
  ON profiles FOR INSERT
  WITH CHECK (auth.uid() = id);

-- Categories policies (read-only for users)
CREATE POLICY "Categories are viewable by everyone"
  ON categories FOR SELECT
  USING (true);

-- Subcategories policies (read-only for users)
CREATE POLICY "Subcategories are viewable by everyone"
  ON subcategories FOR SELECT
  USING (true);

-- Listings policies
CREATE POLICY "Listings are viewable by everyone"
  ON listings FOR SELECT
  USING (true);

CREATE POLICY "Users can create own listings"
  ON listings FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own listings"
  ON listings FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own listings"
  ON listings FOR DELETE
  USING (auth.uid() = user_id);

-- Saved Listings policies
CREATE POLICY "Users can view own saved listings"
  ON saved_listings FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can save listings"
  ON saved_listings FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can unsave listings"
  ON saved_listings FOR DELETE
  USING (auth.uid() = user_id);

-- Messages policies
CREATE POLICY "Users can view own messages"
  ON messages FOR SELECT
  USING (auth.uid() = sender_id OR auth.uid() = receiver_id);

CREATE POLICY "Users can send messages"
  ON messages FOR INSERT
  WITH CHECK (auth.uid() = sender_id);

CREATE POLICY "Users can update own messages"
  ON messages FOR UPDATE
  USING (auth.uid() = sender_id OR auth.uid() = receiver_id);

-- Reviews policies
CREATE POLICY "Reviews are viewable by everyone"
  ON reviews FOR SELECT
  USING (true);

CREATE POLICY "Users can create reviews"
  ON reviews FOR INSERT
  WITH CHECK (auth.uid() = reviewer_id);

CREATE POLICY "Users can update own reviews"
  ON reviews FOR UPDATE
  USING (auth.uid() = reviewer_id);

CREATE POLICY "Users can delete own reviews"
  ON reviews FOR DELETE
  USING (auth.uid() = reviewer_id);

-- Reports policies
CREATE POLICY "Admins can view all reports"
  ON reports FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.is_admin = true
    )
  );

CREATE POLICY "Users can view own reports"
  ON reports FOR SELECT
  USING (auth.uid() = reporter_id);

CREATE POLICY "Users can create reports"
  ON reports FOR INSERT
  WITH CHECK (auth.uid() = reporter_id);

CREATE POLICY "Admins can update reports"
  ON reports FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.is_admin = true
    )
  );

-- =====================================================
-- FUNCTIONS FOR BUSINESS LOGIC
-- =====================================================

-- Function to update seller rating when review is added
CREATE OR REPLACE FUNCTION update_seller_rating()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE profiles
  SET 
    rating_average = (
      SELECT AVG(rating)::DECIMAL(3,2)
      FROM reviews
      WHERE seller_id = NEW.seller_id
    ),
    rating_count = (
      SELECT COUNT(*)
      FROM reviews
      WHERE seller_id = NEW.seller_id
    ),
    updated_at = NOW()
  WHERE id = NEW.seller_id;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Function to auto-disable listing after 3 reports
CREATE OR REPLACE FUNCTION check_reports_count()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE listings
  SET 
    report_count = (
      SELECT COUNT(*)
      FROM reports
      WHERE listing_id = NEW.listing_id
    )
  WHERE id = NEW.listing_id;
  
  -- Auto-archive if 3 or more reports
  UPDATE listings
  SET status = 'archived'
  WHERE id = NEW.listing_id
  AND report_count >= 3
  AND status = 'active';
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- =====================================================
-- TRIGGERS
-- =====================================================

-- Trigger to update rating when review is created or updated
CREATE TRIGGER update_rating_trigger
  AFTER INSERT OR UPDATE ON reviews
  FOR EACH ROW
  EXECUTE FUNCTION update_seller_rating();

-- Trigger to check reports count
CREATE TRIGGER check_reports_trigger
  AFTER INSERT ON reports
  FOR EACH ROW
  EXECUTE FUNCTION check_reports_count();

-- =====================================================
-- SEED DATA - DEFAULT CATEGORIES
-- Order: Cars, Real Estate, Services, Electronics, 
-- Home & Garden, Clothing, Sports & Outdoors, Other
-- =====================================================

INSERT INTO categories (name, slug, description, icon, sort_order) VALUES
  ('Cars', 'cars', 'Vehicles and automotive', '🚗', 1),
  ('Real Estate', 'real-estate', 'Properties for sale or rent', '🏠', 2),
  ('Services', 'services', 'Professional and personal services', '🔧', 3),
  ('Electronics', 'electronics', 'Phones, computers, and gadgets', '📱', 4),
  ('Home & Garden', 'home-garden', 'Furniture and home decor', '🏡', 5),
  ('Clothing', 'clothing', 'Apparel, shoes, and accessories', '👕', 6),
  ('Sports & Outdoors', 'sports-outdoors', 'Sports equipment and outdoor gear', '⚽', 7),
  ('Other', 'other', 'Miscellaneous items and products', '📦', 8)
ON CONFLICT (slug) DO NOTHING;

-- =====================================================
-- SEED DATA - SERVICES SUBCATEGORIES (100 items)
-- =====================================================

DO $$
DECLARE
  services_category_id UUID;
BEGIN
  SELECT id INTO services_category_id FROM categories WHERE slug = 'services';
  
  INSERT INTO subcategories (category_id, name, slug, sort_order) VALUES
  (services_category_id, 'Locksmith', 'locksmith', 1),
  (services_category_id, 'Handyman', 'handyman', 2),
  (services_category_id, 'Driving instructor/school', 'driving-instructor-school', 3),
  (services_category_id, 'Taxi/Transfer', 'taxi-transfer', 4),
  (services_category_id, 'Car Rental / Car Sharing', 'car-rental-car-sharing', 5),
  (services_category_id, 'Heavy lifting/Furniture Removal', 'heavy-lifting-furniture-removal', 6),
  (services_category_id, 'HVAC', 'hvac', 7),
  (services_category_id, 'Auto Mechanic', 'auto-mechanic', 8),
  (services_category_id, 'Builder/Contractor', 'builder-contractor', 9),
  (services_category_id, 'Appliance Repair and Installation', 'appliance-repair-and-installation', 10),
  (services_category_id, 'Moving', 'moving', 11),
  (services_category_id, 'Delivery/Shopping/Pickup', 'delivery-shopping-pickup', 12),
  (services_category_id, 'Accounting/Bookkeeping/Tax Prepare', 'accounting-bookkeeping-tax-prepare', 13),
  (services_category_id, 'Fitness Coach/Nutritionist', 'fitness-coach-nutritionist', 14),
  (services_category_id, 'Car Washing/Detailing/Wrapping', 'car-washing-detailing-wrapping', 15),
  (services_category_id, 'Photographer/Videographer', 'photographer-videographer', 16),
  (services_category_id, 'Junk Removal', 'junk-removal', 17),
  (services_category_id, 'Tours/Guides', 'tours-guides', 18),
  (services_category_id, 'Lawyer/Attorney', 'lawyer-attorney', 19),
  (services_category_id, 'Marketing / Content Creation', 'marketing-content-creation', 20),
  (services_category_id, 'Teacher/Tutor', 'teacher-tutor', 21),
  (services_category_id, 'Sewing/Seamstress/Tailoring', 'sewing-seamstress-tailoring', 22),
  (services_category_id, 'Auto Body / Collision Shop', 'auto-body-collision-shop', 23),
  (services_category_id, 'Hair /Nails /Brows /Lips', 'hair-nails-brows-lips', 24),
  (services_category_id, 'Windshield Replacement', 'windshield-replacement', 25),
  (services_category_id, 'House Remodeling/Renovation', 'house-remodeling-renovation', 26),
  (services_category_id, 'Pool Services', 'pool-services', 27),
  (services_category_id, 'Electronic / Computer Repair', 'electronic-computer-repair', 28),
  (services_category_id, 'Wedding Planner /DJ /Event', 'wedding-planner-dj-event', 29),
  (services_category_id, 'Babysitter / Nanny', 'babysitter-nanny', 30),
  (services_category_id, 'Lawn Care / Tree / Landscaping', 'lawn-care-tree-landscaping', 31),
  (services_category_id, 'Fence Installation & Services', 'fence-installation-services', 32),
  (services_category_id, 'Software/Apps/Website/Design', 'software-apps-website-design', 33),
  (services_category_id, 'Uncategorized Section', 'uncategorized-section', 34),
  (services_category_id, 'Pet Care / Dog Walking / Grooming', 'pet-care-dog-walking-grooming', 35),
  (services_category_id, 'Pest Control', 'pest-control', 36),
  (services_category_id, 'Electrical Services', 'electrical-services', 37),
  (services_category_id, 'Plumbing', 'plumbing', 38),
  (services_category_id, 'Painting', 'painting', 39),
  (services_category_id, 'Roofing', 'roofing', 40),
  (services_category_id, 'Flooring', 'flooring', 41),
  (services_category_id, 'Cleaning Services', 'cleaning-services', 42),
  (services_category_id, 'Window Cleaning', 'window-cleaning', 43),
  (services_category_id, 'Carpet Cleaning', 'carpet-cleaning', 44),
  (services_category_id, 'Interior Design', 'interior-design', 45),
  (services_category_id, 'Real Estate Services', 'real-estate-services', 46),
  (services_category_id, 'Insurance', 'insurance', 47),
  (services_category_id, 'Financial Planning', 'financial-planning', 48),
  (services_category_id, 'Consulting', 'consulting', 49),
  (services_category_id, 'Graphic Design', 'graphic-design', 50),
  (services_category_id, 'Video Production', 'video-production', 51),
  (services_category_id, 'Music Lessons', 'music-lessons', 52),
  (services_category_id, 'Dance Lessons', 'dance-lessons', 53),
  (services_category_id, 'Martial Arts', 'martial-arts', 54),
  (services_category_id, 'Yoga/Pilates', 'yoga-pilates', 55),
  (services_category_id, 'Massage Therapy', 'massage-therapy', 56),
  (services_category_id, 'Spa Services', 'spa-services', 57),
  (services_category_id, 'Veterinary', 'veterinary', 58),
  (services_category_id, 'Pet Training', 'pet-training', 59),
  (services_category_id, 'Pet Grooming', 'pet-grooming', 60),
  (services_category_id, 'Catering', 'catering', 61),
  (services_category_id, 'Restaurant', 'restaurant', 62),
  (services_category_id, 'Food Truck', 'food-truck', 63),
  (services_category_id, 'Bakery', 'bakery', 64),
  (services_category_id, 'Coffee Shop', 'coffee-shop', 65),
  (services_category_id, 'Bar/Pub', 'bar-pub', 66),
  (services_category_id, 'Event Venue', 'event-venue', 67),
  (services_category_id, 'Hotel/Lodging', 'hotel-lodging', 68),
  (services_category_id, 'Travel Agency', 'travel-agency', 69),
  (services_category_id, 'Transportation', 'transportation', 70),
  (services_category_id, 'Storage', 'storage', 71),
  (services_category_id, 'Security Services', 'security-services', 72),
  (services_category_id, 'Home Automation', 'home-automation', 73),
  (services_category_id, 'Solar Installation', 'solar-installation', 74),
  (services_category_id, 'Landscaping Design', 'landscaping-design', 75),
  (services_category_id, 'Snow Removal', 'snow-removal', 76),
  (services_category_id, 'Gutter Cleaning', 'gutter-cleaning', 77),
  (services_category_id, 'Pressure Washing', 'pressure-washing', 78),
  (services_category_id, 'Septic Services', 'septic-services', 79),
  (services_category_id, 'Well Services', 'well-services', 80),
  (services_category_id, 'Appliance Sales', 'appliance-sales', 81),
  (services_category_id, 'Furniture Sales', 'furniture-sales', 82),
  (services_category_id, 'Home Decor', 'home-decor', 83),
  (services_category_id, 'Clothing/Retail', 'clothing-retail', 84),
  (services_category_id, 'Jewelry', 'jewelry', 85),
  (services_category_id, 'Salon', 'salon', 86),
  (services_category_id, 'Barber Shop', 'barber-shop', 87),
  (services_category_id, 'Tattoo/Piercing', 'tattoo-piercing', 88),
  (services_category_id, 'Gym/Fitness Center', 'gym-fitness-center', 89),
  (services_category_id, 'Medical Services', 'medical-services', 90),
  (services_category_id, 'Dental Services', 'dental-services', 91),
  (services_category_id, 'Optometry', 'optometry', 92),
  (services_category_id, 'Pharmacy', 'pharmacy', 93),
  (services_category_id, 'Chiropractor', 'chiropractor', 94),
  (services_category_id, 'Physical Therapy', 'physical-therapy', 95),
  (services_category_id, 'Mental Health Services', 'mental-health-services', 96),
  (services_category_id, 'Daycare', 'daycare', 97),
  (services_category_id, 'Senior Care', 'senior-care', 98),
  (services_category_id, 'Home Healthcare', 'home-healthcare', 99),
  (services_category_id, 'Other', 'other-services', 100)
  ON CONFLICT (category_id, slug) DO NOTHING;
END $$;

-- =====================================================
-- VERIFICATION QUERIES
-- =====================================================

-- Show all categories
SELECT name, slug, sort_order, icon FROM categories ORDER BY sort_order;

-- Show Services subcategory count
SELECT 
  c.name as category,
  COUNT(s.id) as subcategory_count
FROM categories c
LEFT JOIN subcategories s ON c.id = s.category_id
WHERE c.slug = 'services'
GROUP BY c.name;

-- =====================================================
-- COMPLETED!
-- =====================================================
-- Your database is now ready with:
-- - 8 categories (Cars, Real Estate, Services, Electronics, Home & Garden, Clothing, Sports & Outdoors, Other)
-- - 100 subcategories under Services
-- - All tables, indexes, RLS policies, functions, and triggers
-- 
-- Next steps:
-- 1. Create storage buckets in Supabase Dashboard > Storage:
--    - make-5dec7914-listings (private, 5MB limit, image/*)
--    - make-5dec7914-avatars (private, 2MB limit, image/*)
-- 2. Sign up your first user
-- 3. Make first user admin: UPDATE profiles SET is_admin = true WHERE email = 'your@email.com';
-- =====================================================
