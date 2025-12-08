# OnPlasy - User Guide

## Getting Started

### 1. Database Setup (IMPORTANT - Do This First!)

Before using the application, you MUST set up the database:

1. Open your Supabase Dashboard
2. Go to **SQL Editor**
3. Open the file `/supabase/migrations/schema.sql` from this project
4. Copy ALL the SQL code
5. Paste it into the Supabase SQL Editor
6. Click "Run" to execute the schema
7. Wait for confirmation that all tables, functions, and triggers are created

### 2. Create Your First Account

1. Open the application
2. Click "Login / Sign Up" in the top right
3. Click "Don't have an account? Sign up"
4. Enter your name, email, and password
5. Click "Sign Up"
6. You'll be automatically logged in

### 3. Set Up Admin Access (Optional)

To access the admin dashboard:

1. Go to Supabase Dashboard → **Table Editor**
2. Select the **profiles** table
3. Find your user row (by email)
4. Click to edit the row
5. Change `is_admin` from `false` to `true`
6. Save changes
7. Now you can access `/admin` route in the app

## Using the Marketplace

### Browsing Listings

- **Home Page**: View all active listings
- **Search**: Use the search bar to find specific items
- **Filter by Category**: Click category buttons to filter listings
- **View Details**: Click any listing to see full details

### Creating a Listing

1. Click "Sell" in the navigation (requires login)
2. Fill in the form:
   - **Title**: Name of your item
   - **Category**: Select appropriate category
   - **Price**: Set your price in USD
   - **Description**: Detailed description
   - **Images**: Add up to 5 image URLs
3. Click "Create Listing"
4. Your listing will be active for **7 days**

### Managing Your Listings

1. Go to "My Listings" in navigation
2. **Active Tab**: View all active listings
   - See views count and time remaining
   - Click "View Details" to see the listing
3. **Archived Tab**: View expired listings
   - Click "Renew for 7 Days" to reactivate

### Messaging Sellers

1. On any listing detail page, click "Contact Seller"
2. Type your message and click send
3. **After 10 messages**, a review modal will appear
4. You can choose to rate the other user or skip
5. Continue messaging normally after the review prompt

### Saving Listings

- Click the heart icon on any listing to save it
- View all saved listings from "Saved" in navigation
- Click the heart again to unsave

### Leaving Reviews

- Reviews appear automatically after 10 messages in a conversation
- Rate from 1-5 stars
- Optionally add a comment
- Reviews update the user's overall rating
- You can skip the review and continue messaging

### Reporting Issues

- Click the flag icon on listings or user profiles
- Describe the issue in detail
- Submit the report
- Listings with **3 or more reports** are automatically disabled
- Admins will review and resolve reports

## Admin Dashboard

### Accessing Admin Features

- Navigate to `/admin` (requires admin role in database)
- Two main sections: **Analytics** and **Reports**

### Analytics Tab

View key metrics:
- **Total Users**: Number of registered users
- **Total Listings**: All listings ever created
- **Active Listings**: Currently active listings
- **Pending Reports**: Reports awaiting review
- **Total Messages**: Messages sent in the system
- **Total Reviews**: Reviews submitted
- **Category Breakdown**: Listings per category

### Reports Tab

Manage user reports:

1. **Filter by Status**:
   - Pending: New reports to review
   - Resolved: Accepted reports
   - Dismissed: Rejected reports

2. **Review a Report**:
   - Click "Review" on any pending report
   - Read the report details
   - Add admin notes (optional)
   - For listing reports, optionally restore the listing
   - Choose action:
     - **Resolve**: Accept the report
     - **Dismiss**: Reject the report

3. **Auto-Disable Feature**:
   - Listings automatically disabled at 3 reports
   - Admins can restore when resolving reports

## Tips & Best Practices

### For Buyers
- Check seller ratings before purchasing
- Use the messaging system to ask questions
- Save listings you're interested in
- Report suspicious or inappropriate listings

### For Sellers
- Add clear, detailed descriptions
- Include multiple images when possible
- Respond promptly to messages
- Keep track of your listing expiration dates
- Renew listings before they expire

### For Admins
- Regularly check pending reports
- Add detailed notes when resolving reports
- Monitor analytics for unusual patterns
- Use the restore feature carefully

## Important Features

### Listing Lifecycle
- **Active**: 7 days from creation
- **Archived**: Automatically after 7 days
- **Renewable**: Can be renewed for another 7 days
- **Disabled**: After 3 reports (admin can restore)

### Message Count System
- Messages are counted per conversation
- At message #11, review modal appears
- Only shown once per conversation
- Can be skipped without affecting messaging

### Report System
- Anyone can report listings or users
- Reports require a reason
- 3 pending reports = auto-disable listing
- Admins have final say on resolution

### Responsive Design
- **Mobile**: 2 columns for listings
- **Tablet**: 3-4 columns
- **Desktop**: 5 columns
- Navigation adapts to screen size

## Troubleshooting

### Can't Log In
- Make sure you signed up first
- Check your email and password
- Database must be set up (see Setup section)

### Listing Not Appearing
- Check if it expired (7 days)
- Verify it wasn't reported 3+ times
- Make sure category filter is correct

### Can't Access Admin Dashboard
- Verify `is_admin = true` in database
- Log out and log back in
- Check you're accessing `/admin` route

### Messages Not Updating
- Messages refresh every 5 seconds
- Try refreshing the page manually
- Check your internet connection

### Images Not Showing
- Verify image URLs are valid
- Make sure URLs are publicly accessible
- Use direct image links (not webpage links)

## Database Tables Reference

- **profiles**: User accounts and ratings
- **categories**: Product categories
- **listings**: Product listings
- **saved_listings**: User favorites
- **messages**: User conversations
- **reviews**: User ratings and feedback
- **reports**: Reported items/users

All tables have Row Level Security (RLS) enabled for data protection.