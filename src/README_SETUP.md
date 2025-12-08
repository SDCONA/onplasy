# OnPlasy - Setup Instructions

This is a complete marketplace web application where users can buy and sell products across multiple categories (apparel, cars, electronics, etc.). The application includes user authentication, messaging, reviews, admin dashboard, and a comprehensive report system.

## Features

### User Features
- **User Authentication**: Sign up and login functionality
- **Product Listings**: Create, view, and manage listings across multiple categories
- **Category Filtering**: Filter listings by category (Apparel, Cars, Electronics, Furniture, Books, Sports, Other)
- **Search**: Search for products by title or description
- **Saved Listings**: Save favorite listings for later viewing
- **Messaging System**: Send messages to sellers with real-time updates
- **Review System**: After 10 messages in a conversation, users are prompted to review each other
- **Report System**: Report inappropriate listings or users
- **Listing Lifecycle**: Listings are active for 7 days, then automatically archived (can be renewed)
- **Responsive Design**: 2 columns on mobile, 5 columns on desktop

### Admin Features
- **Admin Dashboard**: Comprehensive analytics and statistics
- **Analytics**: View total users, listings, messages, reviews, and category breakdown
- **Report Management**: Review and resolve user reports
- **Auto-disable**: Listings automatically disabled after receiving 3 reports
- **Report Resolution**: Approve or dismiss reports, with ability to restore listings

## Database Setup

### Step 1: Execute the SQL Schema

1. Go to your Supabase project dashboard
2. Navigate to the SQL Editor
3. Copy the entire contents of `/supabase/migrations/schema.sql`
4. Paste it into the SQL Editor and run it
5. This will create all necessary tables, indexes, triggers, and RLS policies

### Step 2: Set Up Admin User

To access the admin dashboard, you need to set a user as an admin:

1. Go to Supabase Dashboard → Table Editor → `profiles` table
2. Find your user account
3. Edit the row and set `is_admin` to `true`
4. Save the changes

Alternatively, run this SQL query (replace `your-user-id` with your actual user ID):

```sql
UPDATE public.profiles
SET is_admin = true
WHERE id = 'your-user-id';
```

## Database Schema

The application uses the following tables:

### profiles
Stores user profile information (extends Supabase auth.users)
- User details, ratings, sales/purchase counts
- Admin status flag

### categories
Predefined product categories
- Default categories: Apparel, Cars, Electronics, Furniture, Books, Sports, Other

### listings
Product listings with auto-expiration
- Active for 7 days by default
- Auto-archives after expiration
- Auto-disables after 3 reports

### saved_listings
User-saved favorite listings

### messages
Messaging system between users
- Grouped by conversation_id
- Linked to specific listings

### reviews
User reviews and ratings
- Triggered after 10 messages in a conversation
- Updates user rating average automatically

### reports
Report system for listings and users
- Auto-disables listings after 3 pending reports
- Admin resolution workflow

## Application Routes

- `/` - Home page with listings and category filtering
- `/auth` - Login and signup page
- `/listing/:id` - Individual listing details
- `/create-listing` - Create a new listing (requires auth)
- `/messages` - View all conversations (requires auth)
- `/messages/:conversationId` - Individual conversation (requires auth)
- `/profile/:userId` - User profile with listings and reviews
- `/saved` - Saved listings (requires auth)
- `/my-listings` - User's own listings with renewal option (requires auth)
- `/admin` - Admin dashboard and report management (requires admin role)

## Key Features Implementation

### Listing Lifecycle (7-day expiration)
- Listings have an `expires_at` field set to 7 days from creation
- A database function `archive_expired_listings()` can be called to archive expired listings
- Users can renew archived listings from the "My Listings" page

### Messaging with Review Modal
- Messages are grouped by `conversation_id`
- After the 11th message, a review modal appears
- Users can rate each other (1-5 stars) with optional comments
- Reviews automatically update user ratings via database trigger

### Report System
- Users can report listings or other users
- After 3 pending reports, listings are automatically disabled via trigger
- Admins can review reports and:
  - Resolve (accept the report)
  - Dismiss (reject the report)
  - Optionally restore disabled listings

### Responsive Layout
- Mobile: 2 column grid for listings
- Desktop: 5 column grid for listings
- Fully responsive navigation and UI components

## Important Notes

1. **Row Level Security (RLS)**: All tables have RLS enabled with appropriate policies
2. **Authentication**: Uses Supabase Auth with email/password
3. **Real-time**: Messages poll every 5 seconds for updates
4. **Image Storage**: Currently uses URL-based images (can be extended to use Supabase Storage)
5. **Admin Access**: Must be set via database manually (see Step 2 above)

## Development

The application is structured as:
- `/App.tsx` - Main application with routing
- `/pages/` - Individual page components
- `/components/` - Reusable components
- `/supabase/functions/server/` - Backend API endpoints
- `/supabase/migrations/` - Database schema

## Security Considerations

This application is designed for prototyping and development. For production use:
- Implement proper email verification
- Add rate limiting on API endpoints
- Enhance image upload security
- Add CAPTCHA for signup/login
- Implement proper session management
- Add comprehensive input validation
- Set up monitoring and logging