-- Complete Marketplace Database Schema
-- Drop existing tables if they exist
DROP TABLE IF EXISTS reviews CASCADE;
DROP TABLE IF EXISTS reports CASCADE;
DROP TABLE IF EXISTS messages CASCADE;
DROP TABLE IF EXISTS saved_listings CASCADE;
DROP TABLE IF EXISTS real_estate_details CASCADE;
DROP TABLE IF EXISTS listings CASCADE;
DROP TABLE IF EXISTS subcategories CASCADE;
DROP TABLE IF EXISTS categories CASCADE;
DROP TABLE IF EXISTS profiles CASCADE;

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Profiles table
CREATE TABLE profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT UNIQUE NOT NULL,
  name TEXT NOT NULL,
  avatar_url TEXT,
  bio TEXT,
  phone TEXT,
  location TEXT,
  rating_average DECIMAL(3,2) DEFAULT 0,
  rating_count INTEGER DEFAULT 0,
  is_admin BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Categories table
CREATE TABLE categories (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  slug TEXT UNIQUE NOT NULL,
  icon TEXT,
  sort_order INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Subcategories table
CREATE TABLE subcategories (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  category_id UUID NOT NULL REFERENCES categories(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  slug TEXT NOT NULL,
  sort_order INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(category_id, slug)
);

-- Listings table
CREATE TABLE listings (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  category_id UUID NOT NULL REFERENCES categories(id) ON DELETE CASCADE,
  subcategory_id UUID REFERENCES subcategories(id) ON DELETE SET NULL,
  title TEXT NOT NULL,
  description TEXT NOT NULL CHECK (char_length(description) <= 500),
  price DECIMAL(12,2) NOT NULL,
  images TEXT[] DEFAULT '{}',
  status TEXT DEFAULT 'active' CHECK (status IN ('active', 'archived', 'disabled')),
  views INTEGER DEFAULT 0,
  expires_at TIMESTAMPTZ DEFAULT (NOW() + INTERVAL '7 days'),
  archived_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Real Estate Details table
CREATE TABLE real_estate_details (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  listing_id UUID NOT NULL REFERENCES listings(id) ON DELETE CASCADE,
  property_type TEXT NOT NULL CHECK (property_type IN ('residential', 'commercial')),
  listing_type TEXT NOT NULL CHECK (listing_type IN ('sale', 'rent')),
  bedrooms INTEGER,
  bathrooms INTEGER,
  square_feet INTEGER,
  lot_size INTEGER,
  year_built INTEGER,
  parking_spaces INTEGER,
  address TEXT NOT NULL,
  city TEXT NOT NULL,
  state TEXT NOT NULL,
  zip_code TEXT NOT NULL,
  amenities TEXT[] DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Saved Listings table
CREATE TABLE saved_listings (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  listing_id UUID NOT NULL REFERENCES listings(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, listing_id)
);

-- Messages table
CREATE TABLE messages (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  conversation_id TEXT NOT NULL,
  sender_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  recipient_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  listing_id UUID REFERENCES listings(id) ON DELETE SET NULL,
  content TEXT NOT NULL,
  is_read BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Reviews table
CREATE TABLE reviews (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  reviewer_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  reviewee_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  conversation_id TEXT NOT NULL,
  rating INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 5),
  comment TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(reviewer_id, conversation_id)
);

-- Reports table
CREATE TABLE reports (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  reporter_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  listing_id UUID REFERENCES listings(id) ON DELETE SET NULL,
  user_id UUID REFERENCES profiles(id) ON DELETE SET NULL,
  reason TEXT NOT NULL,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'reviewed', 'dismissed')),
  admin_notes TEXT,
  resolved_at TIMESTAMPTZ,
  resolved_by UUID REFERENCES profiles(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Insert Categories
INSERT INTO categories (name, slug, sort_order) VALUES
  ('Apparel', 'apparel', 1),
  ('Cars', 'cars', 2),
  ('Real Estate', 'real-estate', 3),
  ('Services', 'services', 4),
  ('Electronics', 'electronics', 5),
  ('Home & Garden', 'home-garden', 6),
  ('Sports & Outdoors', 'sports-outdoors', 7),
  ('Books & Media', 'books-media', 8),
  ('Toys & Games', 'toys-games', 9),
  ('Health & Beauty', 'health-beauty', 10);

-- Insert Subcategories for Apparel
INSERT INTO subcategories (category_id, name, slug, sort_order)
SELECT id, 'Men''s Clothing', 'mens-clothing', 1 FROM categories WHERE slug = 'apparel'
UNION ALL
SELECT id, 'Women''s Clothing', 'womens-clothing', 2 FROM categories WHERE slug = 'apparel'
UNION ALL
SELECT id, 'Kids Clothing', 'kids-clothing', 3 FROM categories WHERE slug = 'apparel'
UNION ALL
SELECT id, 'Shoes', 'shoes', 4 FROM categories WHERE slug = 'apparel'
UNION ALL
SELECT id, 'Accessories', 'accessories', 5 FROM categories WHERE slug = 'apparel'
UNION ALL
SELECT id, 'Jewelry', 'jewelry', 6 FROM categories WHERE slug = 'apparel'
UNION ALL
SELECT id, 'Watches', 'watches', 7 FROM categories WHERE slug = 'apparel'
UNION ALL
SELECT id, 'Bags & Luggage', 'bags-luggage', 8 FROM categories WHERE slug = 'apparel';

-- Insert Subcategories for Cars
INSERT INTO subcategories (category_id, name, slug, sort_order)
SELECT id, 'Sedans', 'sedans', 1 FROM categories WHERE slug = 'cars'
UNION ALL
SELECT id, 'SUVs', 'suvs', 2 FROM categories WHERE slug = 'cars'
UNION ALL
SELECT id, 'Trucks', 'trucks', 3 FROM categories WHERE slug = 'cars'
UNION ALL
SELECT id, 'Vans', 'vans', 4 FROM categories WHERE slug = 'cars'
UNION ALL
SELECT id, 'Sports Cars', 'sports-cars', 5 FROM categories WHERE slug = 'cars'
UNION ALL
SELECT id, 'Electric Vehicles', 'electric-vehicles', 6 FROM categories WHERE slug = 'cars'
UNION ALL
SELECT id, 'Motorcycles', 'motorcycles', 7 FROM categories WHERE slug = 'cars'
UNION ALL
SELECT id, 'Parts & Accessories', 'parts-accessories', 8 FROM categories WHERE slug = 'cars';

-- Insert Subcategories for Real Estate
INSERT INTO subcategories (category_id, name, slug, sort_order)
SELECT id, 'Residential', 'residential', 1 FROM categories WHERE slug = 'real-estate'
UNION ALL
SELECT id, 'Commercial', 'commercial', 2 FROM categories WHERE slug = 'real-estate';

-- Insert Subcategories for Services
INSERT INTO subcategories (category_id, name, slug, sort_order)
SELECT id, 'Home Repair', 'home-repair', 1 FROM categories WHERE slug = 'services'
UNION ALL
SELECT id, 'Cleaning Services', 'cleaning-services', 2 FROM categories WHERE slug = 'services'
UNION ALL
SELECT id, 'Plumbing', 'plumbing', 3 FROM categories WHERE slug = 'services'
UNION ALL
SELECT id, 'Electrical', 'electrical', 4 FROM categories WHERE slug = 'services'
UNION ALL
SELECT id, 'Landscaping', 'landscaping', 5 FROM categories WHERE slug = 'services'
UNION ALL
SELECT id, 'Painting', 'painting', 6 FROM categories WHERE slug = 'services'
UNION ALL
SELECT id, 'Moving Services', 'moving-services', 7 FROM categories WHERE slug = 'services'
UNION ALL
SELECT id, 'Pet Services', 'pet-services', 8 FROM categories WHERE slug = 'services'
UNION ALL
SELECT id, 'Tutoring', 'tutoring', 9 FROM categories WHERE slug = 'services'
UNION ALL
SELECT id, 'Photography', 'photography', 10 FROM categories WHERE slug = 'services'
UNION ALL
SELECT id, 'Legal Services', 'legal-services', 11 FROM categories WHERE slug = 'services'
UNION ALL
SELECT id, 'Accounting', 'accounting', 12 FROM categories WHERE slug = 'services'
UNION ALL
SELECT id, 'IT Support', 'it-support', 13 FROM categories WHERE slug = 'services'
UNION ALL
SELECT id, 'Event Planning', 'event-planning', 14 FROM categories WHERE slug = 'services'
UNION ALL
SELECT id, 'Catering', 'catering', 15 FROM categories WHERE slug = 'services';

-- Insert Subcategories for Electronics
INSERT INTO subcategories (category_id, name, slug, sort_order)
SELECT id, 'Phones & Tablets', 'phones-tablets', 1 FROM categories WHERE slug = 'electronics'
UNION ALL
SELECT id, 'Computers & Laptops', 'computers-laptops', 2 FROM categories WHERE slug = 'electronics'
UNION ALL
SELECT id, 'Cameras', 'cameras', 3 FROM categories WHERE slug = 'electronics'
UNION ALL
SELECT id, 'TVs & Audio', 'tvs-audio', 4 FROM categories WHERE slug = 'electronics'
UNION ALL
SELECT id, 'Gaming Consoles', 'gaming-consoles', 5 FROM categories WHERE slug = 'electronics'
UNION ALL
SELECT id, 'Wearables', 'wearables', 6 FROM categories WHERE slug = 'electronics'
UNION ALL
SELECT id, 'Smart Home', 'smart-home', 7 FROM categories WHERE slug = 'electronics'
UNION ALL
SELECT id, 'Accessories', 'electronics-accessories', 8 FROM categories WHERE slug = 'electronics';

-- Insert Subcategories for Home & Garden
INSERT INTO subcategories (category_id, name, slug, sort_order)
SELECT id, 'Furniture', 'furniture', 1 FROM categories WHERE slug = 'home-garden'
UNION ALL
SELECT id, 'Appliances', 'appliances', 2 FROM categories WHERE slug = 'home-garden'
UNION ALL
SELECT id, 'Decor', 'decor', 3 FROM categories WHERE slug = 'home-garden'
UNION ALL
SELECT id, 'Lighting', 'lighting', 4 FROM categories WHERE slug = 'home-garden'
UNION ALL
SELECT id, 'Garden Tools', 'garden-tools', 5 FROM categories WHERE slug = 'home-garden'
UNION ALL
SELECT id, 'Outdoor Furniture', 'outdoor-furniture', 6 FROM categories WHERE slug = 'home-garden'
UNION ALL
SELECT id, 'Kitchen & Dining', 'kitchen-dining', 7 FROM categories WHERE slug = 'home-garden'
UNION ALL
SELECT id, 'Bedding & Bath', 'bedding-bath', 8 FROM categories WHERE slug = 'home-garden';

-- Insert Subcategories for Sports & Outdoors
INSERT INTO subcategories (category_id, name, slug, sort_order)
SELECT id, 'Fitness Equipment', 'fitness-equipment', 1 FROM categories WHERE slug = 'sports-outdoors'
UNION ALL
SELECT id, 'Bicycles', 'bicycles', 2 FROM categories WHERE slug = 'sports-outdoors'
UNION ALL
SELECT id, 'Camping & Hiking', 'camping-hiking', 3 FROM categories WHERE slug = 'sports-outdoors'
UNION ALL
SELECT id, 'Water Sports', 'water-sports', 4 FROM categories WHERE slug = 'sports-outdoors'
UNION ALL
SELECT id, 'Team Sports', 'team-sports', 5 FROM categories WHERE slug = 'sports-outdoors'
UNION ALL
SELECT id, 'Golf', 'golf', 6 FROM categories WHERE slug = 'sports-outdoors'
UNION ALL
SELECT id, 'Fishing', 'fishing', 7 FROM categories WHERE slug = 'sports-outdoors'
UNION ALL
SELECT id, 'Hunting', 'hunting', 8 FROM categories WHERE slug = 'sports-outdoors';

-- Insert Subcategories for Books & Media
INSERT INTO subcategories (category_id, name, slug, sort_order)
SELECT id, 'Books', 'books', 1 FROM categories WHERE slug = 'books-media'
UNION ALL
SELECT id, 'Movies & DVDs', 'movies-dvds', 2 FROM categories WHERE slug = 'books-media'
UNION ALL
SELECT id, 'Music & CDs', 'music-cds', 3 FROM categories WHERE slug = 'books-media'
UNION ALL
SELECT id, 'Vinyl Records', 'vinyl-records', 4 FROM categories WHERE slug = 'books-media'
UNION ALL
SELECT id, 'Magazines', 'magazines', 5 FROM categories WHERE slug = 'books-media'
UNION ALL
SELECT id, 'Comics', 'comics', 6 FROM categories WHERE slug = 'books-media'
UNION ALL
SELECT id, 'Textbooks', 'textbooks', 7 FROM categories WHERE slug = 'books-media'
UNION ALL
SELECT id, 'E-Readers', 'e-readers', 8 FROM categories WHERE slug = 'books-media';

-- Insert Subcategories for Toys & Games
INSERT INTO subcategories (category_id, name, slug, sort_order)
SELECT id, 'Action Figures', 'action-figures', 1 FROM categories WHERE slug = 'toys-games'
UNION ALL
SELECT id, 'Dolls & Playsets', 'dolls-playsets', 2 FROM categories WHERE slug = 'toys-games'
UNION ALL
SELECT id, 'Board Games', 'board-games', 3 FROM categories WHERE slug = 'toys-games'
UNION ALL
SELECT id, 'Puzzles', 'puzzles', 4 FROM categories WHERE slug = 'toys-games'
UNION ALL
SELECT id, 'Educational Toys', 'educational-toys', 5 FROM categories WHERE slug = 'toys-games'
UNION ALL
SELECT id, 'Building Blocks', 'building-blocks', 6 FROM categories WHERE slug = 'toys-games'
UNION ALL
SELECT id, 'RC Vehicles', 'rc-vehicles', 7 FROM categories WHERE slug = 'toys-games'
UNION ALL
SELECT id, 'Video Games', 'video-games', 8 FROM categories WHERE slug = 'toys-games';

-- Insert Subcategories for Health & Beauty
INSERT INTO subcategories (category_id, name, slug, sort_order)
SELECT id, 'Skincare', 'skincare', 1 FROM categories WHERE slug = 'health-beauty'
UNION ALL
SELECT id, 'Makeup', 'makeup', 2 FROM categories WHERE slug = 'health-beauty'
UNION ALL
SELECT id, 'Hair Care', 'hair-care', 3 FROM categories WHERE slug = 'health-beauty'
UNION ALL
SELECT id, 'Fragrances', 'fragrances', 4 FROM categories WHERE slug = 'health-beauty'
UNION ALL
SELECT id, 'Vitamins & Supplements', 'vitamins-supplements', 5 FROM categories WHERE slug = 'health-beauty'
UNION ALL
SELECT id, 'Fitness Nutrition', 'fitness-nutrition', 6 FROM categories WHERE slug = 'health-beauty'
UNION ALL
SELECT id, 'Personal Care', 'personal-care', 7 FROM categories WHERE slug = 'health-beauty'
UNION ALL
SELECT id, 'Medical Equipment', 'medical-equipment', 8 FROM categories WHERE slug = 'health-beauty';

-- Create indexes for better performance
CREATE INDEX idx_listings_category ON listings(category_id);
CREATE INDEX idx_listings_subcategory ON listings(subcategory_id);
CREATE INDEX idx_listings_user ON listings(user_id);
CREATE INDEX idx_listings_status ON listings(status);
CREATE INDEX idx_listings_created ON listings(created_at);
CREATE INDEX idx_messages_conversation ON messages(conversation_id);
CREATE INDEX idx_messages_sender ON messages(sender_id);
CREATE INDEX idx_messages_recipient ON messages(recipient_id);
CREATE INDEX idx_reviews_reviewee ON reviews(reviewee_id);
CREATE INDEX idx_reports_status ON reports(status);
CREATE INDEX idx_subcategories_category ON subcategories(category_id);

-- Create function to update rating
CREATE OR REPLACE FUNCTION update_user_rating()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE profiles
  SET 
    rating_average = (
      SELECT AVG(rating)::DECIMAL(3,2)
      FROM reviews
      WHERE reviewee_id = NEW.reviewee_id
    ),
    rating_count = (
      SELECT COUNT(*)
      FROM reviews
      WHERE reviewee_id = NEW.reviewee_id
    )
  WHERE id = NEW.reviewee_id;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for rating updates
DROP TRIGGER IF EXISTS trigger_update_rating ON reviews;
CREATE TRIGGER trigger_update_rating
AFTER INSERT ON reviews
FOR EACH ROW
EXECUTE FUNCTION update_user_rating();

-- Create function to auto-archive expired listings
CREATE OR REPLACE FUNCTION archive_expired_listings()
RETURNS void AS $$
BEGIN
  UPDATE listings
  SET status = 'archived', archived_at = NOW()
  WHERE status = 'active' AND expires_at < NOW();
END;
$$ LANGUAGE plpgsql;

-- Create function to auto-disable listings with 3+ reports
CREATE OR REPLACE FUNCTION check_listing_reports()
RETURNS TRIGGER AS $$
DECLARE
  report_count INTEGER;
BEGIN
  IF NEW.listing_id IS NOT NULL THEN
    SELECT COUNT(*) INTO report_count
    FROM reports
    WHERE listing_id = NEW.listing_id AND status = 'pending';
    
    IF report_count >= 3 THEN
      UPDATE listings
      SET status = 'disabled'
      WHERE id = NEW.listing_id;
    END IF;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for auto-disable
DROP TRIGGER IF EXISTS trigger_check_reports ON reports;
CREATE TRIGGER trigger_check_reports
AFTER INSERT ON reports
FOR EACH ROW
EXECUTE FUNCTION check_listing_reports();

-- Enable Row Level Security
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE subcategories ENABLE ROW LEVEL SECURITY;
ALTER TABLE listings ENABLE ROW LEVEL SECURITY;
ALTER TABLE real_estate_details ENABLE ROW LEVEL SECURITY;
ALTER TABLE saved_listings ENABLE ROW LEVEL SECURITY;
ALTER TABLE messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE reviews ENABLE ROW LEVEL SECURITY;
ALTER TABLE reports ENABLE ROW LEVEL SECURITY;

-- Create RLS Policies
CREATE POLICY "Public profiles are viewable by everyone"
  ON profiles FOR SELECT USING (true);

CREATE POLICY "Users can update own profile"
  ON profiles FOR UPDATE USING (auth.uid() = id);

CREATE POLICY "Categories are viewable by everyone"
  ON categories FOR SELECT USING (true);

CREATE POLICY "Subcategories are viewable by everyone"
  ON subcategories FOR SELECT USING (true);

CREATE POLICY "Listings are viewable by everyone"
  ON listings FOR SELECT USING (true);

CREATE POLICY "Users can insert own listings"
  ON listings FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own listings"
  ON listings FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own listings"
  ON listings FOR DELETE USING (auth.uid() = user_id);

CREATE POLICY "Real estate details are viewable by everyone"
  ON real_estate_details FOR SELECT USING (true);

CREATE POLICY "Saved listings are viewable by owner"
  ON saved_listings FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own saved listings"
  ON saved_listings FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own saved listings"
  ON saved_listings FOR DELETE USING (auth.uid() = user_id);

CREATE POLICY "Messages are viewable by sender or recipient"
  ON messages FOR SELECT USING (auth.uid() = sender_id OR auth.uid() = recipient_id);

CREATE POLICY "Users can insert own messages"
  ON messages FOR INSERT WITH CHECK (auth.uid() = sender_id);

CREATE POLICY "Reviews are viewable by everyone"
  ON reviews FOR SELECT USING (true);

CREATE POLICY "Users can insert own reviews"
  ON reviews FOR INSERT WITH CHECK (auth.uid() = reviewer_id);

CREATE POLICY "Reports are viewable by reporter or admins"
  ON reports FOR SELECT USING (
    auth.uid() = reporter_id OR 
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND is_admin = true)
  );

CREATE POLICY "Users can insert own reports"
  ON reports FOR INSERT WITH CHECK (auth.uid() = reporter_id);
