# Email Notification Setup Guide for OnPlasy

## Overview
This system sends email notifications to users every 30 minutes when they have new unread messages.

## Database Setup

### Step 1: Run SQL in Supabase Dashboard

Go to **Supabase Dashboard → SQL Editor** and execute the following SQL:

```sql
-- Table to track which messages have triggered email notifications
CREATE TABLE IF NOT EXISTS email_notifications_sent (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  message_id TEXT NOT NULL,
  user_id TEXT NOT NULL,
  notified_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(message_id, user_id)
);

-- Index for faster queries
CREATE INDEX idx_email_notifications_user ON email_notifications_sent(user_id);
CREATE INDEX idx_email_notifications_message ON email_notifications_sent(message_id);

-- Table for user notification preferences
CREATE TABLE IF NOT EXISTS user_notification_preferences (
  user_id TEXT PRIMARY KEY,
  email_notifications_enabled BOOLEAN DEFAULT true,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS (Row Level Security)
ALTER TABLE email_notifications_sent ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_notification_preferences ENABLE ROW LEVEL SECURITY;

-- RLS Policies (server can access everything with service role key)
CREATE POLICY "Service role can do everything on email_notifications_sent" 
  ON email_notifications_sent 
  FOR ALL 
  USING (true) 
  WITH CHECK (true);

CREATE POLICY "Users can view their own notification preferences" 
  ON user_notification_preferences 
  FOR SELECT 
  USING (auth.uid()::text = user_id);

CREATE POLICY "Users can update their own notification preferences" 
  ON user_notification_preferences 
  FOR UPDATE 
  USING (auth.uid()::text = user_id);

CREATE POLICY "Service role can do everything on user_notification_preferences" 
  ON user_notification_preferences 
  FOR ALL 
  USING (true) 
  WITH CHECK (true);
```

### Step 2: Set Up Cron Job

Go to **Supabase Dashboard → Edge Functions → Cron Jobs** and create a new cron job:

1. **Function name**: `email-notifications`
2. **Schedule**: `*/30 * * * *` (every 30 minutes)
3. **Function**: Select the `email-notifications` function

Alternatively, you can use the Supabase CLI to deploy:

```bash
# Deploy the edge function
supabase functions deploy email-notifications

# Create the cron job (requires Supabase CLI 1.34.0+)
supabase functions schedule email-notifications --schedule "*/30 * * * *"
```

## How It Works

### Email Notification Flow

1. **Cron Trigger**: Every 30 minutes, the `email-notifications` edge function runs automatically
2. **Find Unread Messages**: Queries the `messages` table for `is_read: false`
3. **Filter Already Notified**: Checks `email_notifications_sent` table to skip messages that already triggered emails
4. **Check User Preferences**: Queries `user_notification_preferences` to respect user opt-out settings
5. **Send Emails**: Sends simple "You have new messages on OnPlasy" email via Resend API
6. **Track Notifications**: Inserts records into `email_notifications_sent` to prevent duplicate notifications

### Email Content

The email sent to users is simple and non-intrusive:
- **Subject**: "You have new messages on OnPlasy"
- **Content**: Simple notification without message text or sender information
- **CTA**: "View Messages" button linking to `/messages`
- **Unsubscribe**: Small link at bottom directing to `/account` settings

### User Opt-Out

Users can disable email notifications:
1. Navigate to **Account → Notifications** tab
2. Toggle off "Email Notifications"
3. Preference is saved in `user_notification_preferences` table
4. Cron job will skip these users

## Features

✅ **Privacy-Focused**: Email doesn't include message content or sender names
✅ **No Spam**: Each message triggers only one email, even if it remains unread
✅ **User Control**: Easy opt-out via Account settings
✅ **Efficient**: Runs every 30 minutes, queries only new unread messages
✅ **Scalable**: Uses database indexes for fast queries

## Testing

### Manual Test (via Supabase Dashboard)

1. Go to **Supabase Dashboard → Edge Functions**
2. Find `email-notifications` function
3. Click **Invoke** to manually trigger the cron job
4. Check logs for execution details

### Test with CLI

```bash
# Invoke the function manually
supabase functions invoke email-notifications --no-verify-jwt
```

## Monitoring

Check the cron job execution logs:
1. Go to **Supabase Dashboard → Edge Functions → email-notifications**
2. View **Logs** tab to see execution history and any errors

## Troubleshooting

### No emails being sent

1. Verify RESEND_API_KEY is set in Supabase environment variables
2. Check that tables `email_notifications_sent` and `user_notification_preferences` exist
3. Review cron job logs for errors
4. Ensure cron schedule is active

### Users not receiving emails

1. Check user's notification preferences in `user_notification_preferences` table
2. Verify user's email address in `profiles` table
3. Check if messages are marked as `is_read: false`
4. Review Resend API dashboard for delivery status

### Duplicate emails

1. Verify `email_notifications_sent` table has UNIQUE constraint on `(message_id, user_id)`
2. Check that cron job is not running multiple times simultaneously
3. Review logs to ensure notification records are being inserted correctly

## Future Enhancements

Possible improvements:
- Add frequency preferences (immediate, hourly, daily digest)
- Include unread message count in email
- Add in-app notification system
- Support for other notification channels (SMS, push)
