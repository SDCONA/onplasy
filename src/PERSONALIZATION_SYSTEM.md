# OnPlasy Personalization System Documentation

## Overview

The OnPlasy marketplace features an intelligent personalization system that learns from user behavior to deliver a customized browsing experience. After a user performs 5 or more interactions, the homepage automatically shows 90% listings from their most interested category and 10% discovery listings to encourage exploration.

## How It Works (User Perspective)

### Initial Browsing (0-4 interactions)
- Users see listings in **random order** on the homepage
- Every interaction is tracked silently in the background
- No personalization is applied yet

### Personalized Experience (5+ interactions)
- Homepage automatically switches to personalized mode
- Shows **90% listings** from the user's top interest category
- Shows **10% discovery listings** from other categories
- Personalization only applies when browsing without active filters
- When filters are applied, users see normal filtered results

### User Controls
- Users can view their personalization status in **Account Settings → Notifications tab**
- Dashboard shows:
  - Active/Inactive status
  - Total interaction count
  - Top 5 categories with scores
  - Progress towards activation
- Users can **reset** all personalization data with one click

---

## Technical Architecture

### Interaction Weights

Different user actions have different weights based on engagement level:

| Action | Weight | Description |
|--------|--------|-------------|
| **View** | 1 | User visits a listing detail page |
| **Search** | 3 | User searches for listings in a category |
| **Message** | 5 | User messages a seller about a listing |
| **Favorite** | 7 | User saves a listing to favorites |
| **Offer** | 10 | User makes an offer on a listing |
| **Create** | 15 | User creates a listing in a category |

### Personalization Logic

1. System tracks each interaction with its weight and timestamp
2. After 5+ total interactions, personalization activates
3. System calculates aggregate score per category (sum of all weights)
4. Top category becomes the user's primary interest
5. Homepage queries:
   - 90% listings from top category (ordered randomly)
   - 10% listings from other categories (ordered randomly)
6. Results are shuffled together for natural browsing

---

## Database Schema

### Table: `user_interactions_5dec7914`

Tracks individual user interactions with listings.

```sql
CREATE TABLE user_interactions_5dec7914 (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  listing_id UUID REFERENCES listings_5dec7914(id) ON DELETE SET NULL,
  category TEXT NOT NULL,
  interaction_type TEXT NOT NULL,
  weight INTEGER NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes for performance
CREATE INDEX idx_user_interactions_user_id ON user_interactions_5dec7914(user_id);
CREATE INDEX idx_user_interactions_category ON user_interactions_5dec7914(category);
CREATE INDEX idx_user_interactions_created_at ON user_interactions_5dec7914(created_at);
```

### Table: `user_interests_5dec7914`

Aggregated scores per user per category (materialized view for performance).

```sql
CREATE TABLE user_interests_5dec7914 (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  category TEXT NOT NULL,
  score INTEGER NOT NULL DEFAULT 0,
  interaction_count INTEGER NOT NULL DEFAULT 0,
  last_updated TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, category)
);

-- Indexes for performance
CREATE INDEX idx_user_interests_user_id ON user_interests_5dec7914(user_id);
CREATE INDEX idx_user_interests_score ON user_interests_5dec7914(score DESC);
```

### Row Level Security (RLS)

Both tables have RLS policies that ensure:
- Users can only read their own data
- Only the server (using service role key) can write data

---

## File Structure & Code Locations

### Backend Files

#### `/supabase/functions/server/personalization.tsx`
**Core personalization logic**

Key functions:
- `trackInteraction(userId, category, interactionType, listingId)` - Records user actions
- `getUserInterests(userId)` - Gets user's category preferences ordered by score
- `getTotalInteractionCount(userId)` - Counts total interactions for activation check
- `getPersonalizedListings(userId, limit, offset, filters)` - Fetches 90/10 personalized results
- `resetUserPersonalization(userId)` - Clears all tracking data

Location: Lines 1-400+
Import: Used by server endpoints in `index.tsx`

#### `/supabase/functions/server/index.tsx`
**API endpoints for personalization**

Endpoints:
- `POST /make-server-5dec7914/track-interaction` (Line ~2743)
  - Tracks user interactions
  - Called by frontend after each action
  
- `GET /make-server-5dec7914/user-interests` (Line ~2768)
  - Returns user's category interests and interaction count
  
- `GET /make-server-5dec7914/personalization-data` (Line ~2782)
  - Returns full personalization status (interests, count, active status)
  - Used by Account Settings dashboard
  
- `POST /make-server-5dec7914/reset-personalization` (Line ~2784)
  - Clears all user personalization data
  - Called from Account Settings reset button

- `GET /make-server-5dec7914/listings` (Modified)
  - Enhanced to use personalized listing fetching
  - Checks if user has 5+ interactions
  - Returns personalized results when no filters applied

---

### Frontend Files

#### `/pages/HomePage.tsx`
**Personalized listing display**

Location: Lines ~350-400
- Fetches listings from `/listings` endpoint
- Automatically receives personalized results for logged-in users
- No special code needed - server handles personalization
- Tracks search interactions when users search by category

Key tracking code:
```typescript
// Track search interaction
const trackSearch = async (category: string) => {
  // ... sends POST to /track-interaction
}
```

#### `/pages/ListingDetailPage.tsx`
**View tracking**

Location: Lines ~150-180
- Tracks when users view a listing detail page
- Only tracks if user is logged in and listing has a category

Key tracking code:
```typescript
// Track view interaction
const trackView = async (listingId: string, category: string) => {
  // ... sends POST to /track-interaction
}
```

#### `/pages/ConversationPage.tsx`
**Message tracking**

Location: Lines ~200-230
- Tracks when users send messages to sellers
- Extracts category from listing data

Key tracking code:
```typescript
// Track message interaction
const trackMessage = async (listingId: string, category: string) => {
  // ... sends POST to /track-interaction
}
```

#### `/components/MakeOfferModal.tsx`
**Offer tracking**

Location: Lines ~120-150
- Tracks when users make offers on listings
- Triggered after successful offer submission

Key tracking code:
```typescript
// Track offer interaction
const trackOffer = async (listingId: string, category: string) => {
  // ... sends POST to /track-interaction
}
```

#### `/components/ListingCard.tsx`
**Favorite tracking**

Location: Lines ~80-120
- Tracks when users save/favorite listings
- Only tracks the save action (not unsave)

Key tracking code:
```typescript
// Track favorite interaction
const trackFavorite = async (listingId: string, category: string) => {
  // ... sends POST to /track-interaction
}
```

#### `/pages/CreateListingPage.tsx`
**Creation tracking (highest weight)**

Location: Lines ~254-290
- Tracks when users create new listings
- Highest weight (15 points) because it shows strong category interest

Key tracking code:
```typescript
// Track create interaction
const trackCreate = async (listingId: string, category: string) => {
  // ... sends POST to /track-interaction
}
```

#### `/pages/AccountPage.tsx`
**Personalization dashboard and reset**

Location: Lines ~35-45 (state), ~200-250 (handlers), ~840-920 (UI)

Features:
- Fetches personalization data on page load
- Displays active/inactive status
- Shows total interaction count
- Shows progress to activation (5 interactions needed)
- Lists top 5 categories with scores
- Provides reset button with confirmation
- Located in **Account Settings → Notifications tab**

Key functions:
```typescript
const fetchPersonalizationData = async () => {
  // Fetches from /personalization-data endpoint
}

const handleResetPersonalization = async () => {
  // Confirms with user, then calls /reset-personalization
}
```

---

## API Integration Pattern

All frontend tracking follows the same pattern:

```typescript
const trackInteraction = async (listingId: string, category: string, interactionType: string) => {
  if (!user) return; // Must be logged in
  
  try {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session?.access_token) return;

    await fetch(
      `https://${projectId}.supabase.co/functions/v1/make-server-5dec7914/track-interaction`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.access_token}`
        },
        body: JSON.stringify({
          category,           // e.g., "electronics", "vehicles", "apparel"
          interactionType,    // e.g., "view", "favorite", "offer"
          listingId          // UUID of the listing (optional for search)
        })
      }
    );
  } catch (error) {
    console.error('Failed to track interaction:', error);
    // Silent fail - don't disrupt user experience
  }
};
```

---

## Configuration

### Activation Threshold
**Location:** `/supabase/functions/server/personalization.tsx` and `/supabase/functions/server/index.tsx`

Current value: **5 interactions**

To change:
```typescript
// In getPersonalizedListings function
const interactionCount = await getTotalInteractionCount(userId);
if (interactionCount < 5) { // Change this number
  return await getRandomListings(limit, offset, filters);
}
```

### Personalization Ratio
**Location:** `/supabase/functions/server/personalization.tsx` - `getPersonalizedListings()` function

Current ratio: **90% personalized / 10% discovery**

To change:
```typescript
const personalizedCount = Math.floor(limit * 0.9); // Change 0.9 to desired ratio
const discoveryCount = limit - personalizedCount;
```

### Interaction Weights
**Location:** `/supabase/functions/server/personalization.tsx` - `INTERACTION_WEIGHTS` constant

```typescript
const INTERACTION_WEIGHTS = {
  view: 1,
  search: 3,
  message: 5,
  favorite: 7,
  offer: 10,
  create: 15
};
```

---

## Testing Instructions

### 1. Test Basic Tracking

```bash
# Create a test user account
# Perform 5+ different interactions:
1. View 2 listings in "electronics" category (2 points)
2. Favorite 1 listing in "electronics" (7 points)
3. Create 1 listing in "electronics" (15 points)
# Total: 24 points in electronics

# Check Account Settings → Notifications tab
# Should show:
# - Active status
# - 4 total interactions
# - Electronics as top interest (24 pts)
```

### 2. Test Personalized Homepage

```bash
# After 5+ interactions in a category:
1. Go to homepage (no filters applied)
2. Verify most listings are from your top category
3. Verify some listings are from other categories (discovery)
4. Apply a filter (e.g., price range)
5. Verify results are filtered normally (personalization off)
```

### 3. Test Reset Functionality

```bash
1. Go to Account Settings → Notifications tab
2. Scroll to "Personalization" section
3. Click "Reset Personalization" button
4. Confirm the action
5. Verify:
   - Status changes to "Inactive"
   - Interaction count resets to 0
   - Top interests disappear
6. Go to homepage
7. Verify listings are now random order
```

### 4. Test Multi-Category Interests

```bash
# Build interests across multiple categories:
1. View 3 listings in "electronics" (3 points)
2. Create 1 listing in "vehicles" (15 points)
3. Favorite 2 listings in "apparel" (14 points)
4. Make offer on 1 "vehicles" listing (10 points)

# Expected top category: vehicles (25 points)
# Check Account Settings to verify
```

---

## Troubleshooting

### Personalization Not Activating

**Check:**
1. User is logged in (`localStorage.getItem('access_token')`)
2. Interaction count >= 5 (check Account Settings)
3. No filters applied on homepage
4. Check browser console for API errors
5. Verify SQL tables exist in Supabase

**Debug queries:**
```sql
-- Check if tables exist
SELECT * FROM user_interactions_5dec7914 LIMIT 1;
SELECT * FROM user_interests_5dec7914 LIMIT 1;

-- Check user's interactions
SELECT * FROM user_interactions_5dec7914 
WHERE user_id = 'YOUR_USER_ID' 
ORDER BY created_at DESC;

-- Check user's interests
SELECT * FROM user_interests_5dec7914 
WHERE user_id = 'YOUR_USER_ID' 
ORDER BY score DESC;
```

### Tracking Not Working

**Check:**
1. `trackInteraction()` function is called after action completes
2. Category slug is passed correctly (lowercase, matches categories table)
3. User session token is valid
4. Server endpoint returns 200 status
5. Check server logs in Supabase Edge Functions dashboard

**Common issues:**
- Category mismatch: Use `categories.slug` not `categories.name`
- Timing: Track after successful action, not before
- Auth: User must be logged in with valid session

### Reset Not Working

**Check:**
1. Server endpoint `/reset-personalization` is accessible
2. User confirms the action in browser dialog
3. Check server response for errors
4. Verify RLS policies allow delete on both tables

**Manual reset query:**
```sql
-- Run in Supabase SQL Editor (as service role)
DELETE FROM user_interactions_5dec7914 WHERE user_id = 'YOUR_USER_ID';
DELETE FROM user_interests_5dec7914 WHERE user_id = 'YOUR_USER_ID';
```

### Homepage Shows Wrong Category

**Check:**
1. Verify top category in Account Settings
2. Check if filters are applied (removes personalization)
3. Confirm category has active listings
4. Check if listings have correct `category_id`

**Debug:**
```sql
-- Check user's top category
SELECT category, score, interaction_count 
FROM user_interests_5dec7914 
WHERE user_id = 'YOUR_USER_ID' 
ORDER BY score DESC 
LIMIT 1;

-- Check available listings in that category
SELECT COUNT(*) 
FROM listings_5dec7914 
WHERE category_id = (
  SELECT id FROM categories_5dec7914 WHERE slug = 'top_category_slug'
) 
AND status = 'active';
```

---

## Future Enhancements

### Potential Improvements

1. **Time-based decay**: Older interactions count less than recent ones
2. **Multiple categories**: Show listings from top 3 categories instead of just 1
3. **Collaborative filtering**: "Users who liked X also liked Y"
4. **A/B testing**: Different personalization ratios for different users
5. **Machine learning**: More sophisticated interest prediction
6. **Personalized search**: Apply personalization to search results too
7. **Category diversity bonus**: Reward exploring new categories
8. **Seller preferences**: Learn which sellers user prefers

### Implementation Notes

To add time decay:
```typescript
// In updateUserInterests function
const decayFactor = calculateDecay(interactionDate); // e.g., 0.5 after 30 days
const weightedScore = weight * decayFactor;
```

To support multiple categories:
```typescript
// In getPersonalizedListings function
const topCategories = interests.slice(0, 3); // Top 3 instead of 1
const categoryWeights = [0.5, 0.3, 0.1]; // 50% + 30% + 10% + 10% discovery
```

---

## Support & Maintenance

### Key Metrics to Monitor

1. **Activation rate**: % of users reaching 5+ interactions
2. **Average interactions per user**: Engagement level
3. **Category distribution**: Are some categories over-represented?
4. **Reset frequency**: How often users reset personalization
5. **Homepage engagement**: Do personalized users interact more?

### Monitoring Queries

```sql
-- Users with personalization active
SELECT COUNT(DISTINCT user_id) 
FROM user_interactions_5dec7914 
GROUP BY user_id 
HAVING COUNT(*) >= 5;

-- Average interactions per user
SELECT AVG(interaction_count) 
FROM (
  SELECT user_id, COUNT(*) as interaction_count 
  FROM user_interactions_5dec7914 
  GROUP BY user_id
) subquery;

-- Most popular categories
SELECT category, COUNT(*) as interactions 
FROM user_interactions_5dec7914 
GROUP BY category 
ORDER BY interactions DESC 
LIMIT 10;

-- Recent resets (check user_interactions table for sudden drops)
SELECT user_id, COUNT(*) as interactions, MAX(created_at) as last_interaction
FROM user_interactions_5dec7914 
GROUP BY user_id 
HAVING COUNT(*) < 5 AND MAX(created_at) > NOW() - INTERVAL '7 days';
```

---

## Security Considerations

### Row Level Security (RLS)

All personalization tables have RLS enabled:

```sql
-- Users can only read their own data
CREATE POLICY "Users can view own interactions" 
ON user_interactions_5dec7914 
FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Users can view own interests" 
ON user_interests_5dec7914 
FOR SELECT 
USING (auth.uid() = user_id);

-- Only server can write (using service role key)
CREATE POLICY "Service role can insert interactions" 
ON user_interactions_5dec7914 
FOR INSERT 
WITH CHECK (auth.jwt() ->> 'role' = 'service_role');
```

### Privacy

- Users can view their own personalization data
- Users can reset their data at any time
- Tracking is transparent (visible in Account Settings)
- No cross-user data sharing or comparison
- Data is deleted when user account is deleted (CASCADE)

---

## Summary

The personalization system is a sophisticated yet simple-to-use feature that enhances the OnPlasy marketplace experience. It:

✅ Tracks user behavior silently and transparently  
✅ Activates automatically after 5 interactions  
✅ Delivers 90% personalized + 10% discovery content  
✅ Respects user filters and preferences  
✅ Provides full transparency and control  
✅ Is secure, performant, and maintainable  

For questions or issues, refer to the Troubleshooting section or check the file locations listed above.

---

**Last Updated:** December 14, 2024  
**Version:** 1.0  
**Maintainer:** OnPlasy Development Team
