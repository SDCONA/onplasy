-- ============================================
-- ONPLASY SECURITY FIX V2 - COLUMN-LEVEL SECURITY
-- Date: 2024-12-16
-- CRITICAL: Fixes profiles table column exposure
-- ============================================

BEGIN;

-- ============================================
-- PROBLEM: RLS policies don't restrict columns
-- SOLUTION: Use a public view with only safe columns
-- ============================================

-- Step 1: Drop the current public SELECT policy
DROP POLICY IF EXISTS "Public can view safe profile fields" ON profiles;

-- Step 2: Create a restrictive policy - NO public access to base table
CREATE POLICY "Profiles are private by default"
ON profiles FOR SELECT
TO public
USING (false);  -- Block ALL public access

-- Step 3: Users can ONLY see their own full profile
-- (This policy already exists but let's ensure it's correct)
DROP POLICY IF EXISTS "Users can view own full profile" ON profiles;

CREATE POLICY "Users can view own full profile"
ON profiles FOR SELECT
TO authenticated
USING (auth.uid() = id);

-- Step 4: Create a PUBLIC VIEW with only safe columns
CREATE OR REPLACE VIEW public_profiles AS
SELECT 
  id,
  name,
  avatar_url,
  bio,
  rating_average,
  rating_count,
  created_at
FROM profiles;

-- Step 5: Grant SELECT on the view to public
GRANT SELECT ON public_profiles TO public, anon, authenticated;

-- ============================================
-- VERIFICATION
-- ============================================

-- Test 1: This should FAIL (no access to base table)
-- SELECT email FROM profiles LIMIT 1;

-- Test 2: This should SUCCEED (view has safe fields only)
-- SELECT * FROM public_profiles LIMIT 1;

-- Test 3: Authenticated users can see own profile
-- SELECT * FROM profiles WHERE id = auth.uid();

COMMIT;

-- ============================================
-- SUCCESS MESSAGE
-- ============================================
SELECT 'Column-level security applied successfully!' as status;
SELECT 'Anonymous users can now only access public_profiles view' as note;
