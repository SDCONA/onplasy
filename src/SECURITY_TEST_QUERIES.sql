-- ============================================
-- ONPLASY SECURITY TEST QUERIES
-- Run these in Supabase SQL Editor to verify security
-- ============================================

-- ============================================
-- TEST 1: Verify RLS is enabled on all tables
-- ============================================
SELECT 
  tablename,
  rowsecurity as rls_enabled
FROM pg_tables 
WHERE schemaname = 'public'
  AND tablename IN ('profiles', 'messages', 'offers', 'user_interactions', 'user_interests')
ORDER BY tablename;

-- Expected: All tables should show rls_enabled = true

-- ============================================
-- TEST 2: Verify profiles policies
-- ============================================
SELECT 
  policyname,
  cmd,
  qual,
  with_check
FROM pg_policies 
WHERE schemaname = 'public'
  AND tablename = 'profiles'
ORDER BY policyname;

-- Expected policies:
-- 1. "Public can view safe profile fields" - SELECT - true
-- 2. "Users can update own profile" - UPDATE - (auth.uid() = id)
-- 3. "Users can view own full profile" - SELECT - (auth.uid() = id)

-- ============================================
-- TEST 3: Verify user_interests policies
-- ============================================
SELECT 
  policyname,
  cmd,
  roles,
  qual
FROM pg_policies 
WHERE schemaname = 'public'
  AND tablename = 'user_interests'
ORDER BY policyname;

-- Expected policies:
-- 1. "Service role can manage all interests" - ALL - {service_role} - true
-- 2. "Users can view own interests" - SELECT - {public} - (auth.uid() = user_id)

-- ============================================
-- TEST 4: Verify user_interactions policies
-- ============================================
SELECT 
  policyname,
  cmd,
  roles,
  qual
FROM pg_policies 
WHERE schemaname = 'public'
  AND tablename = 'user_interactions'
ORDER BY policyname;

-- Expected policies:
-- 1. "Service role can manage all interactions" - ALL - {service_role} - true
-- 2. "Users can view own interactions" - SELECT - {public} - (auth.uid() = user_id)

-- ============================================
-- TEST 5: Verify messages policies
-- ============================================
SELECT 
  policyname,
  cmd,
  qual
FROM pg_policies 
WHERE schemaname = 'public'
  AND tablename = 'messages'
ORDER BY policyname;

-- Expected policies:
-- 1. "Messages are viewable by sender or recipient" - SELECT
-- 2. "Users can insert own messages" - INSERT
-- 3. "Recipients can update messages" - UPDATE - (auth.uid() = recipient_id)

-- ============================================
-- TEST 6: Count sensitive data exposure (should fail with RLS)
-- ============================================
-- This query should FAIL or return 0 for non-admin users
SELECT COUNT(*) as exposed_emails
FROM profiles
WHERE email IS NOT NULL;

-- If this returns a number > 0 when run as anonymous user, SECURITY ISSUE!

-- ============================================
-- TEST 7: Verify offers policies
-- ============================================
SELECT 
  policyname,
  cmd,
  qual
FROM pg_policies 
WHERE schemaname = 'public'
  AND tablename = 'offers'
ORDER BY policyname;

-- Expected policies:
-- 1. "Users can view their own offers as buyer" - SELECT - (auth.uid() = buyer_id)
-- 2. "Users can view offers on their listings" - SELECT - (auth.uid() = seller_id)
-- 3. "Users can create offers" - INSERT - (auth.uid() = buyer_id)
-- 4. "Sellers can update offers on their listings" - UPDATE - (auth.uid() = seller_id)
-- 5. "Buyers can respond to countered offers" - UPDATE

-- ============================================
-- TEST 8: Security Audit Summary
-- ============================================
SELECT 
  'Security Audit Complete' as status,
  (SELECT COUNT(*) FROM pg_tables WHERE schemaname = 'public' AND rowsecurity = true) as tables_with_rls,
  (SELECT COUNT(*) FROM pg_policies WHERE schemaname = 'public') as total_policies,
  CURRENT_TIMESTAMP as audit_time;

-- ============================================
-- TEST 9: Check for tables WITHOUT RLS (security risk)
-- ============================================
SELECT 
  tablename,
  'WARNING: RLS NOT ENABLED' as security_risk
FROM pg_tables 
WHERE schemaname = 'public'
  AND rowsecurity = false
ORDER BY tablename;

-- Expected: Should return empty or only system/utility tables

-- ============================================
-- PASS CRITERIA
-- ============================================
-- ✅ All sensitive tables have RLS enabled
-- ✅ No anonymous access to email, phone, city, zipcode, is_admin
-- ✅ Users can only modify their own data
-- ✅ Service role can manage tracking tables
-- ✅ Messages can be marked as read by recipients
-- ✅ Offers are only visible to buyer/seller
