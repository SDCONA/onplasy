-- =====================================================
-- ADD SERVICES CATEGORY WITH 100 SUBCATEGORIES
-- Run this AFTER running add_subcategories_table.sql
-- =====================================================

-- Insert the Services category
INSERT INTO categories (name, slug, icon, sort_order, created_at)
VALUES ('Services', 'services', '🔧', 8, NOW())
ON CONFLICT (slug) DO UPDATE SET
  name = EXCLUDED.name,
  icon = EXCLUDED.icon,
  sort_order = EXCLUDED.sort_order;

-- Get the category ID for Services and insert all subcategories
DO $$
DECLARE
  services_category_id UUID;
BEGIN
  SELECT id INTO services_category_id FROM categories WHERE slug = 'services';
  
  -- Insert all 100 subcategories
  INSERT INTO subcategories (category_id, name, slug, sort_order, created_at) VALUES
  (services_category_id, 'Locksmith', 'locksmith', 1, NOW()),
  (services_category_id, 'Handyman', 'handyman', 2, NOW()),
  (services_category_id, 'Driving instructor/school', 'driving-instructor-school', 3, NOW()),
  (services_category_id, 'Taxi/Transfer', 'taxi-transfer', 4, NOW()),
  (services_category_id, 'Car Rental / Car Sharing', 'car-rental-car-sharing', 5, NOW()),
  (services_category_id, 'Heavy lifting/Furniture Removal', 'heavy-lifting-furniture-removal', 6, NOW()),
  (services_category_id, 'HVAC', 'hvac', 7, NOW()),
  (services_category_id, 'Auto Mechanic', 'auto-mechanic', 8, NOW()),
  (services_category_id, 'Builder/Contractor', 'builder-contractor', 9, NOW()),
  (services_category_id, 'Appliance Repair and Installation', 'appliance-repair-and-installation', 10, NOW()),
  (services_category_id, 'Moving', 'moving', 11, NOW()),
  (services_category_id, 'Delivery/Shopping/Pickup', 'delivery-shopping-pickup', 12, NOW()),
  (services_category_id, 'Accounting/Bookkeeping/Tax Prepare', 'accounting-bookkeeping-tax-prepare', 13, NOW()),
  (services_category_id, 'Fitness Coach/Nutritionist', 'fitness-coach-nutritionist', 14, NOW()),
  (services_category_id, 'Car Washing/Detailing/Wrapping', 'car-washing-detailing-wrapping', 15, NOW()),
  (services_category_id, 'Photographer/Videographer', 'photographer-videographer', 16, NOW()),
  (services_category_id, 'Junk Removal', 'junk-removal', 17, NOW()),
  (services_category_id, 'Tours/Guides', 'tours-guides', 18, NOW()),
  (services_category_id, 'Lawyer/Attorney', 'lawyer-attorney', 19, NOW()),
  (services_category_id, 'Marketing / Content Creation', 'marketing-content-creation', 20, NOW()),
  (services_category_id, 'Teacher/Tutor', 'teacher-tutor', 21, NOW()),
  (services_category_id, 'Sewing/Seamstress/Tailoring', 'sewing-seamstress-tailoring', 22, NOW()),
  (services_category_id, 'Auto Body / Collision Shop', 'auto-body-collision-shop', 23, NOW()),
  (services_category_id, 'Hair /Nails /Brows /Lips', 'hair-nails-brows-lips', 24, NOW()),
  (services_category_id, 'Windshield Replacement', 'windshield-replacement', 25, NOW()),
  (services_category_id, 'House Remodeling/Renovation', 'house-remodeling-renovation', 26, NOW()),
  (services_category_id, 'Pool Services', 'pool-services', 27, NOW()),
  (services_category_id, 'Electronic / Computer Repair', 'electronic-computer-repair', 28, NOW()),
  (services_category_id, 'Wedding Planner /DJ /Event', 'wedding-planner-dj-event', 29, NOW()),
  (services_category_id, 'Babysitter / Nanny', 'babysitter-nanny', 30, NOW()),
  (services_category_id, 'Lawn Care / Tree / Landscaping', 'lawn-care-tree-landscaping', 31, NOW()),
  (services_category_id, 'Fence Installation & Services', 'fence-installation-services', 32, NOW()),
  (services_category_id, 'Software/Apps/Website/Design', 'software-apps-website-design', 33, NOW()),
  (services_category_id, 'Uncategorized Section', 'uncategorized-section', 34, NOW()),
  (services_category_id, 'Pet Care / Dog Walking / Grooming', 'pet-care-dog-walking-grooming', 35, NOW()),
  (services_category_id, 'Pest Control', 'pest-control', 36, NOW()),
  (services_category_id, 'Electrical Services', 'electrical-services', 37, NOW()),
  (services_category_id, 'Plumbing', 'plumbing', 38, NOW()),
  (services_category_id, 'Painting', 'painting', 39, NOW()),
  (services_category_id, 'Roofing', 'roofing', 40, NOW()),
  (services_category_id, 'Flooring', 'flooring', 41, NOW()),
  (services_category_id, 'Cleaning Services', 'cleaning-services', 42, NOW()),
  (services_category_id, 'Window Cleaning', 'window-cleaning', 43, NOW()),
  (services_category_id, 'Carpet Cleaning', 'carpet-cleaning', 44, NOW()),
  (services_category_id, 'Interior Design', 'interior-design', 45, NOW()),
  (services_category_id, 'Real Estate', 'real-estate-services', 46, NOW()),
  (services_category_id, 'Insurance', 'insurance', 47, NOW()),
  (services_category_id, 'Financial Planning', 'financial-planning', 48, NOW()),
  (services_category_id, 'Consulting', 'consulting', 49, NOW()),
  (services_category_id, 'Graphic Design', 'graphic-design', 50, NOW()),
  (services_category_id, 'Video Production', 'video-production', 51, NOW()),
  (services_category_id, 'Music Lessons', 'music-lessons', 52, NOW()),
  (services_category_id, 'Dance Lessons', 'dance-lessons', 53, NOW()),
  (services_category_id, 'Martial Arts', 'martial-arts', 54, NOW()),
  (services_category_id, 'Yoga/Pilates', 'yoga-pilates', 55, NOW()),
  (services_category_id, 'Massage Therapy', 'massage-therapy', 56, NOW()),
  (services_category_id, 'Spa Services', 'spa-services', 57, NOW()),
  (services_category_id, 'Veterinary', 'veterinary', 58, NOW()),
  (services_category_id, 'Pet Training', 'pet-training', 59, NOW()),
  (services_category_id, 'Pet Grooming', 'pet-grooming', 60, NOW()),
  (services_category_id, 'Catering', 'catering', 61, NOW()),
  (services_category_id, 'Restaurant', 'restaurant', 62, NOW()),
  (services_category_id, 'Food Truck', 'food-truck', 63, NOW()),
  (services_category_id, 'Bakery', 'bakery', 64, NOW()),
  (services_category_id, 'Coffee Shop', 'coffee-shop', 65, NOW()),
  (services_category_id, 'Bar/Pub', 'bar-pub', 66, NOW()),
  (services_category_id, 'Event Venue', 'event-venue', 67, NOW()),
  (services_category_id, 'Hotel/Lodging', 'hotel-lodging', 68, NOW()),
  (services_category_id, 'Travel Agency', 'travel-agency', 69, NOW()),
  (services_category_id, 'Transportation', 'transportation', 70, NOW()),
  (services_category_id, 'Storage', 'storage', 71, NOW()),
  (services_category_id, 'Security Services', 'security-services', 72, NOW()),
  (services_category_id, 'Home Automation', 'home-automation', 73, NOW()),
  (services_category_id, 'Solar Installation', 'solar-installation', 74, NOW()),
  (services_category_id, 'Landscaping Design', 'landscaping-design', 75, NOW()),
  (services_category_id, 'Snow Removal', 'snow-removal', 76, NOW()),
  (services_category_id, 'Gutter Cleaning', 'gutter-cleaning', 77, NOW()),
  (services_category_id, 'Pressure Washing', 'pressure-washing', 78, NOW()),
  (services_category_id, 'Septic Services', 'septic-services', 79, NOW()),
  (services_category_id, 'Well Services', 'well-services', 80, NOW()),
  (services_category_id, 'Appliance Sales', 'appliance-sales', 81, NOW()),
  (services_category_id, 'Furniture Sales', 'furniture-sales', 82, NOW()),
  (services_category_id, 'Home Decor', 'home-decor', 83, NOW()),
  (services_category_id, 'Clothing/Retail', 'clothing-retail', 84, NOW()),
  (services_category_id, 'Jewelry', 'jewelry', 85, NOW()),
  (services_category_id, 'Salon', 'salon', 86, NOW()),
  (services_category_id, 'Barber Shop', 'barber-shop', 87, NOW()),
  (services_category_id, 'Tattoo/Piercing', 'tattoo-piercing', 88, NOW()),
  (services_category_id, 'Gym/Fitness Center', 'gym-fitness-center', 89, NOW()),
  (services_category_id, 'Medical Services', 'medical-services', 90, NOW()),
  (services_category_id, 'Dental Services', 'dental-services', 91, NOW()),
  (services_category_id, 'Optometry', 'optometry', 92, NOW()),
  (services_category_id, 'Pharmacy', 'pharmacy', 93, NOW()),
  (services_category_id, 'Chiropractor', 'chiropractor', 94, NOW()),
  (services_category_id, 'Physical Therapy', 'physical-therapy', 95, NOW()),
  (services_category_id, 'Mental Health Services', 'mental-health-services', 96, NOW()),
  (services_category_id, 'Daycare', 'daycare', 97, NOW()),
  (services_category_id, 'Senior Care', 'senior-care', 98, NOW()),
  (services_category_id, 'Home Healthcare', 'home-healthcare', 99, NOW()),
  (services_category_id, 'Other', 'other-services', 100, NOW())
  ON CONFLICT (category_id, slug) DO UPDATE SET
    name = EXCLUDED.name,
    sort_order = EXCLUDED.sort_order;
END $$;

-- Verify the results
SELECT 
  c.name as category,
  c.slug as category_slug,
  COUNT(s.id) as subcategory_count
FROM categories c
LEFT JOIN subcategories s ON c.id = s.category_id
WHERE c.slug = 'services'
GROUP BY c.name, c.slug;

-- Show all subcategories
SELECT 
  s.name,
  s.slug,
  s.sort_order
FROM subcategories s
JOIN categories c ON s.category_id = c.id
WHERE c.slug = 'services'
ORDER BY s.sort_order;