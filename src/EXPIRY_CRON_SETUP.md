# Auto-Archive Expired Listings Setup

## ✅ What Was Implemented

We've fixed the issue where listings older than 7 days were still showing up. The solution includes:

1. **Automatic Cron Job** - Archives expired listings every hour
2. **Safety Filter** - Queries exclude expired listings even before they're archived
3. **No Performance Impact** - Uses existing database index on `expires_at`

---

## 🚀 How to Apply the Fix

### Step 1: Run the SQL Migration

1. Open your **Supabase Dashboard**
2. Navigate to **SQL Editor** (left sidebar)
3. Click **"New Query"**
4. Copy and paste the contents of `/supabase/migrations/setup_expiry_cron.sql`
5. Click **"Run"**

### Step 2: Verify the Cron Job

After running the migration, verify it was created successfully:

```sql
-- Run this query in Supabase SQL Editor
SELECT * FROM cron.job WHERE jobname = 'archive-expired-listings-hourly';
```

You should see one row with:
- `jobname`: `archive-expired-listings-hourly`
- `schedule`: `0 * * * *` (runs every hour at minute 0)
- `command`: `SELECT archive_expired_listings();`

---

## 📋 How It Works

### Before (Problem):
- Listings created with `expires_at = NOW() + 7 days`
- After 7 days, `status` stayed as `'active'`
- Queries only checked `status='active'`, not expiry date
- **Result**: Expired listings kept showing up

### After (Solution):

**Part 1: Cron Job (Automatic Archiving)**
- Every hour, `archive_expired_listings()` function runs
- Updates all listings where `status='active' AND expires_at < NOW()`
- Sets `status='archived'` and `archived_at=NOW()`
- Expired listings move to Archive tab

**Part 2: Query Safety Filter**
- Added `.gt('expires_at', NOW())` to all listing queries
- Even if cron hasn't run yet, expired listings won't show
- Prevents 1-hour gap between expiry and archiving

---

## ⏰ Timeline

- **Listing created**: `expires_at` set to 7 days from now
- **After 7 days pass**: Listing expires
- **Within 1 hour**: Cron job archives it (moves to Archive tab)
- **Immediately**: Query filter hides it from active listings

Maximum delay: **1 hour** between expiry and archiving

---

## 🧪 Testing

### Test 1: Verify Cron Job Exists
```sql
SELECT * FROM cron.job WHERE jobname = 'archive-expired-listings-hourly';
```

### Test 2: Check for Expired Active Listings
```sql
SELECT id, title, created_at, expires_at, status
FROM listings
WHERE status = 'active' AND expires_at < NOW()
ORDER BY expires_at DESC;
```
*Should return listings that need archiving (if any exist before next cron run)*

### Test 3: Manually Run Archive Function
```sql
SELECT archive_expired_listings();
```
*This immediately archives all expired listings - useful for testing*

### Test 4: Verify Archived Listings
```sql
SELECT id, title, created_at, expires_at, archived_at, status
FROM listings
WHERE status = 'archived'
ORDER BY archived_at DESC
LIMIT 10;
```

---

## 🔄 Manual Operations

### Archive All Expired Listings Now
```sql
SELECT archive_expired_listings();
```

### View Cron Job History/Logs
```sql
SELECT * FROM cron.job_run_details 
WHERE jobid = (SELECT jobid FROM cron.job WHERE jobname = 'archive-expired-listings-hourly')
ORDER BY start_time DESC
LIMIT 10;
```

### Disable Cron Job (if needed)
```sql
SELECT cron.unschedule('archive-expired-listings-hourly');
```

### Re-enable Cron Job
```sql
SELECT cron.schedule(
  'archive-expired-listings-hourly',
  '0 * * * *',
  $$ SELECT archive_expired_listings(); $$
);
```

---

## ✅ Code Changes Made

### 1. `/supabase/migrations/setup_expiry_cron.sql`
- Enables `pg_cron` extension
- Schedules hourly archive job

### 2. `/supabase/functions/server/listings_optimized.tsx`
- Added `.gt('expires_at', NOW())` filter for zipcode queries (line ~101)
- Added `.gt('expires_at', NOW())` filter for regular queries (line ~257)
- Only applies to `status='active'` queries

---

## 🎯 Expected Results

✅ Listings expire after exactly 7 days
✅ Expired listings automatically move to Archive within 1 hour
✅ Expired listings never appear in active search results
✅ Users can view their archived listings in "My Listings > Archived" tab
✅ No performance degradation

---

## ⚠️ Important Notes

1. **Requires Supabase Pro Plan** - pg_cron is a Pro feature
2. **Existing expired listings** - Will be archived on next cron run (within 1 hour)
3. **Archive tab** - Users can still see their archived listings
4. **Can't reactivate** - Once archived via expiry, listings stay archived (by design)

---

## 🐛 Troubleshooting

**Issue**: Cron job not running
- Check if pg_cron extension is enabled: `SELECT * FROM pg_extension WHERE extname = 'pg_cron';`
- Verify you're on Supabase Pro plan
- Check cron.job_run_details for errors

**Issue**: Listings still showing after 7 days
- Check if cron job exists: `SELECT * FROM cron.job WHERE jobname = 'archive-expired-listings-hourly';`
- Manually run: `SELECT archive_expired_listings();`
- Check server logs for query errors

**Issue**: Need to change expiry duration
- Current default is 7 days (set in database schema)
- To change, modify `expires_at TIMESTAMP DEFAULT (NOW() + INTERVAL '7 days')` in schema
- Or set custom expiry when creating listings

---

**Setup complete!** Expired listings will now automatically archive every hour. 🎉
