-- =====================================================
-- CRITICAL SECURITY FIX: Row Level Security Policies
-- =====================================================
-- This migration adds RLS policies for tables that were missing them
-- WITHOUT RLS, ALL DATA IS PUBLICLY ACCESSIBLE!

-- =====================================================
-- OFFERS TABLE - RLS POLICIES
-- =====================================================

-- Enable RLS on offers table
ALTER TABLE IF EXISTS public.offers ENABLE ROW LEVEL SECURITY;

-- Buyers can view their own sent offers
CREATE POLICY "Users can view own sent offers"
  ON public.offers FOR SELECT
  USING (auth.uid() = buyer_id);

-- Sellers can view offers on their listings
CREATE POLICY "Sellers can view offers on own listings"
  ON public.offers FOR SELECT
  USING (
    auth.uid() = seller_id
  );

-- Only buyers can create offers
CREATE POLICY "Users can create own offers"
  ON public.offers FOR INSERT
  WITH CHECK (auth.uid() = buyer_id);

-- Sellers can update offers (accept/reject)
CREATE POLICY "Sellers can update offers on own listings"
  ON public.offers FOR UPDATE
  USING (auth.uid() = seller_id);

-- Buyers can cancel their own offers
CREATE POLICY "Buyers can update own offers"
  ON public.offers FOR UPDATE
  USING (auth.uid() = buyer_id);

-- Only buyers can delete their own offers
CREATE POLICY "Users can delete own offers"
  ON public.offers FOR DELETE
  USING (auth.uid() = buyer_id);

-- =====================================================
-- USER_INTERACTIONS TABLE - RLS POLICIES
-- =====================================================

-- Enable RLS on user_interactions table
ALTER TABLE IF EXISTS public.user_interactions ENABLE ROW LEVEL SECURITY;

-- Users can only view their own interactions
CREATE POLICY "Users can view own interactions"
  ON public.user_interactions FOR SELECT
  USING (auth.uid() = user_id);

-- Users can only create their own interactions
CREATE POLICY "Users can create own interactions"
  ON public.user_interactions FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Users can update their own interactions
CREATE POLICY "Users can update own interactions"
  ON public.user_interactions FOR UPDATE
  USING (auth.uid() = user_id);

-- Users can delete their own interactions
CREATE POLICY "Users can delete own interactions"
  ON public.user_interactions FOR DELETE
  USING (auth.uid() = user_id);

-- =====================================================
-- USER_INTERESTS TABLE - RLS POLICIES
-- =====================================================

-- Enable RLS on user_interests table
ALTER TABLE IF EXISTS public.user_interests ENABLE ROW LEVEL SECURITY;

-- Users can only view their own interests
CREATE POLICY "Users can view own interests"
  ON public.user_interests FOR SELECT
  USING (auth.uid() = user_id);

-- Users can only create their own interests (via trigger)
CREATE POLICY "Users can create own interests"
  ON public.user_interests FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Users can update their own interests
CREATE POLICY "Users can update own interests"
  ON public.user_interests FOR UPDATE
  USING (auth.uid() = user_id);

-- Users can delete their own interests
CREATE POLICY "Users can delete own interests"
  ON public.user_interests FOR DELETE
  USING (auth.uid() = user_id);

-- =====================================================
-- CATEGORIES TABLE - FIX MISSING POLICIES
-- =====================================================

-- Categories should be read-only for regular users
-- Only admins should be able to modify (handled by server using service role key)
ALTER TABLE IF EXISTS public.categories ENABLE ROW LEVEL SECURITY;

CREATE POLICY IF NOT EXISTS "Categories are viewable by everyone"
  ON public.categories FOR SELECT
  USING (true);

-- =====================================================
-- VERIFICATION
-- =====================================================
-- After running this migration, verify RLS is enabled:
-- SELECT tablename, rowsecurity FROM pg_tables WHERE schemaname = 'public';
-- 
-- Check policies:
-- SELECT * FROM pg_policies WHERE schemaname = 'public';
