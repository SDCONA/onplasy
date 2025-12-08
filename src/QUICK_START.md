# OnPlasy - Quick Start Guide

## 🚀 Get Started in 5 Minutes

### Step 1: Set Up Database (2 minutes)

1. Open your **Supabase Dashboard**
2. Go to **SQL Editor**
3. Copy the contents of `/supabase/migrations/schema.sql`
4. Paste and click **Run**
5. Wait for "Success" message

✅ Your database is now ready!

### Step 2: Create Account (1 minute)

1. Open the application
2. Click **"Login / Sign Up"**
3. Click **"Don't have an account? Sign up"**
4. Enter your details:
   - Name
   - Email  
   - Password
5. Click **"Sign Up"**

✅ You're now logged in!

### Step 3: Create Your First Listing (2 minutes)

1. Click **"Sell"** in the navigation
2. Fill in the form:
   - **Title**: "Example Item"
   - **Category**: Choose one
   - **Price**: Enter a price
   - **Description**: Describe your item
   - **Images** (optional): Add image URLs
3. Click **"Create Listing"**

✅ Your first listing is live for 7 days!

## 🎯 Try These Features

### Browse & Filter
- Click category buttons to filter
- Use search bar to find items
- Click any listing to view details

### Save Listings
- Click the ❤️ icon on any listing
- View saved items: **"Saved"** in navigation

### Message a Seller
- Open any listing
- Click **"Contact Seller"**
- Send a message

### Admin Dashboard (Optional)

1. Go to **Supabase Dashboard** → **Table Editor**
2. Open **profiles** table
3. Find your user (by email)
4. Set **is_admin** to `true`
5. Go to `/admin` in the app

## 📱 Mobile View

- Automatically switches to 2 columns on mobile
- Touch-friendly interface
- Responsive navigation menu

## 🔥 Cool Features to Try

1. **Create 10 messages** in a conversation to see the review modal
2. **Report a listing** to see auto-disable at 3 reports
3. **Wait 7 days** (or manually archive) to test renewal feature
4. **Leave a review** to see rating updates

## 📚 Need More Help?

- **Full Setup**: See `README_SETUP.md`
- **User Guide**: See `MARKETPLACE_GUIDE.md`
- **All Features**: See `FEATURES_SUMMARY.md`

## ⚡ Troubleshooting

**Can't see listings?**
- Make sure database is set up (Step 1)
- Check you're on the home page

**Can't create listing?**
- Make sure you're logged in
- All fields are required

**Admin page shows "Access Denied"?**
- Set `is_admin = true` in database
- Log out and log back in

## 🎉 You're Ready!

Start exploring your new marketplace application!