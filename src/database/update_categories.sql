-- =====================================================
-- UPDATE CATEGORIES
-- Add "Other", Rename "Apparel", and Set Sort Order
-- =====================================================

-- Step 1: Add sort_order column to categories table
ALTER TABLE categories ADD COLUMN IF NOT EXISTS sort_order INTEGER DEFAULT 999;

-- Step 2: Rename "Apparel" to "Clothing"
UPDATE categories SET name = 'Clothing', slug = 'clothing' WHERE slug = 'apparel';

-- Step 3: Add "Other" category
INSERT INTO categories (name, slug, description, sort_order) 
VALUES ('Other', 'other', 'Miscellaneous items and products', 7)
ON CONFLICT (slug) DO UPDATE SET sort_order = 7;

-- Step 4: Set sort order for all categories
UPDATE categories SET sort_order = 1 WHERE slug = 'cars';
UPDATE categories SET sort_order = 2 WHERE slug = 'real-estate';
UPDATE categories SET sort_order = 3 WHERE slug = 'electronics';
UPDATE categories SET sort_order = 4 WHERE slug = 'home-garden';
UPDATE categories SET sort_order = 5 WHERE slug = 'clothing';
UPDATE categories SET sort_order = 6 WHERE slug = 'sports-outdoors';
UPDATE categories SET sort_order = 7 WHERE slug = 'other';

-- Step 5: Create index on sort_order for performance
CREATE INDEX IF NOT EXISTS idx_categories_sort_order ON categories(sort_order);

-- Step 6: Verify the changes
SELECT name, slug, sort_order FROM categories ORDER BY sort_order;

-- =====================================================
-- DONE! Categories are now sorted as requested:
-- 1. Cars
-- 2. Real Estate
-- 3. Electronics
-- 4. Home & Garden
-- 5. Clothing (formerly Apparel)
-- 6. Sports & Outdoors
-- 7. Other (NEW)
-- =====================================================
