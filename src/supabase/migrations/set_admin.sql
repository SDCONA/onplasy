-- Helper SQL to Set a User as Admin
-- 
-- INSTRUCTIONS:
-- 1. First, create your account in the application
-- 2. Copy your user email or ID
-- 3. Replace 'your.email@example.com' below with your actual email
-- 4. Run this query in Supabase SQL Editor
-- 5. Refresh the application and navigate to /admin

-- Option 1: Set admin by email
UPDATE public.profiles
SET is_admin = true
WHERE email = 'your.email@example.com';

-- Option 2: Set admin by user ID (if you know your user ID)
-- Uncomment the line below and replace 'your-user-id' with actual ID
-- UPDATE public.profiles
-- SET is_admin = true
-- WHERE id = 'your-user-id';

-- Verify the change worked
SELECT id, email, name, is_admin
FROM public.profiles
WHERE is_admin = true;
