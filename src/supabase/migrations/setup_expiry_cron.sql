-- =====================================================
-- SETUP AUTOMATIC EXPIRY ARCHIVING WITH PG_CRON
-- =====================================================
-- This migration sets up automatic archiving of expired listings
-- Requires: Supabase Pro plan (pg_cron extension)
-- =====================================================

-- Enable pg_cron extension (only available on Pro plan)
CREATE EXTENSION IF NOT EXISTS pg_cron;

-- Schedule the archive_expired_listings function to run every hour
-- Cron format: minute hour day month weekday
-- '0 * * * *' = At minute 0 of every hour
SELECT cron.schedule(
  'archive-expired-listings-hourly',  -- Job name
  '0 * * * *',                         -- Every hour at minute 0
  $$ SELECT archive_expired_listings(); $$
);

-- Optional: Verify the cron job was created
-- Run this query in Supabase SQL Editor to check:
-- SELECT * FROM cron.job WHERE jobname = 'archive-expired-listings-hourly';

-- Note: The archive_expired_listings() function already exists in schema.sql
-- It updates listings SET status='archived', archived_at=NOW() WHERE status='active' AND expires_at < NOW()
