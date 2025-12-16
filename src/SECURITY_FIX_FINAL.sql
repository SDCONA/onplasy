-- ============================================
-- ONPLASY SECURITY FIX - FINAL VERSION
-- Date: 2024-12-16
-- Issue: Profiles table exposes ALL columns to public
-- Solution: Block public access, server uses service role
-- ============================================

BEGIN;

-- ============================================
-- FIX: PROFILES TABLE
-- Current Problem: "Public can view safe profile fields" allows
-- public to SELECT all columns from all rows
-- ============================================

-- Drop the unsafe public policy
DROP POLICY IF EXISTS "Public can view safe profile fields" ON profiles;

-- Block ALL anonymous/public access to profiles table
-- Frontend will use server endpoints which use service role
CREATE POLICY "Profiles require authentication"
ON profiles FOR SELECT
TO public
USING (auth.uid() IS NOT NULL AND auth.uid() = id);

-- This replaces both "Public can view safe profile fields" AND "Users can view own full profile"
-- Now ONLY authenticated users can see ONLY their own profile

-- Drop the duplicate policy
DROP POLICY IF EXISTS "Users can view own full profile" ON profiles;

-- ============================================
-- IMPORTANT: Frontend Impact
-- ============================================
-- After this change:
-- ✅ Authenticated users can see their OWN full profile
-- ❌ Anonymous users CANNOT query profiles table directly
-- ✅ All profile viewing (including public profiles) MUST go through server endpoints
-- ✅ Server uses SERVICE ROLE key, so it can access any profile
-- ✅ Server endpoints already filter to safe fields only

-- ============================================
-- VERIFICATION QUERIES
-- ============================================

-- Test 1: Check policies
SELECT tablename, policyname, cmd, qual
FROM pg_policies 
WHERE schemaname = 'public' AND tablename = 'profiles'
ORDER BY policyname;

-- Expected:
-- 1. "Profiles require authentication" - SELECT - (auth.uid() IS NOT NULL AND auth.uid() = id)
-- 2. "Users can update own profile" - UPDATE - (auth.uid() = id)

-- Test 2: Verify RLS is enabled
SELECT tablename, rowsecurity FROM pg_tables 
WHERE schemaname = 'public' AND tablename = 'profiles';

-- Expected: rowsecurity = true

COMMIT;

SELECT '✅ Security fix applied successfully!' as status;
SELECT 'Anonymous users can NO LONGER query profiles directly' as note;
SELECT 'All profile queries must go through secure server endpoints' as requirement;
