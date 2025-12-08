# reCAPTCHA Keys Updated for New Domain

## ✅ What Was Done

Your reCAPTCHA integration has been updated to use your new domain's keys through Supabase environment variables.

### Frontend Changes:
- **File**: `/utils/recaptcha.ts`
- The site key is now fetched dynamically from the server endpoint
- Uses the `RECAPTCHA_SITE_KEY_NEW` environment variable you just set

### Backend Changes:
- **File**: `/supabase/functions/server/recaptcha.ts`
- Updated to use `RECAPTCHA_SECRET_KEY_NEW` environment variable you just set
- Falls back to old key if new one not found (for safety)

### New Server Endpoint:
- **Endpoint**: `GET /make-server-5dec7914/recaptcha-site-key`
- Returns the reCAPTCHA site key from environment variable
- The frontend fetches this automatically

## 📋 Environment Variables Set

You've already provided these through the popup dialogs:

1. ✅ **RECAPTCHA_SITE_KEY_NEW** - Your new reCAPTCHA v3 site key (public)
2. ✅ **RECAPTCHA_SECRET_KEY_NEW** - Your new reCAPTCHA v3 secret key (private)

## 🎯 How It Works Now

1. When a user signs up, the frontend calls `executeRecaptcha('signup')`
2. The function automatically fetches your new site key from the server
3. reCAPTCHA generates a token using your new site key
4. The token is sent to your server with the signup request
5. The server verifies the token using your new secret key
6. If verification passes, the user is created

## 🔒 Security

- The site key is public (safe to expose in frontend)
- The secret key stays private on the server (never exposed to frontend)
- Both keys are stored as Supabase environment variables
- The system automatically uses your new domain's keys

## ✨ No Manual Steps Required

Everything is already configured and ready to use! Your new reCAPTCHA keys are now active.
