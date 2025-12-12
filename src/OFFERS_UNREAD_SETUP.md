# Offers Unread Indicator - Database Setup

## Overview
This feature adds green edge indicators to listings and offers that have unread offers, and automatically marks them as read when the user opens the collapsible card.

## Database Schema Update Required

You need to add an `is_read` column to the `offers` table in your Supabase database.

### Steps to Add the Column:

1. Go to your Supabase Dashboard
2. Navigate to **Table Editor** → **offers** table
3. Click **"Add Column"** or run this SQL in the **SQL Editor**:

```sql
-- Add is_read column to offers table
ALTER TABLE offers 
ADD COLUMN is_read BOOLEAN DEFAULT FALSE;

-- Update existing offers to be unread
UPDATE offers 
SET is_read = FALSE 
WHERE is_read IS NULL;
```

### Column Details:
- **Column Name:** `is_read`
- **Type:** `boolean`
- **Default Value:** `false`
- **Nullable:** No (NOT NULL)

## Features Implemented

### 1. **Visual Indicators**
- **Green left border (4px)** on listing cards that have unread offers
- **Green left border (4px)** on individual offer rows that are unread
- **Unread count badge** showing number of unread offers (e.g., "3 unread")

### 2. **Auto Mark as Read**
- When user expands a listing card (clicks to view offers)
- All offers for that listing are marked as read
- Green edges disappear
- Unread count badge disappears

### 3. **Smart Sorting**
- **Listings with unread offers appear at the top** of the list
- **Within each listing, unread offers appear first** in the expanded view
- After sorting by unread status, secondary sort by newest first

### 4. **Backend API**
- **Endpoint:** `PUT /make-server-5dec7914/offers/mark-read/:listingId`
  - Marks all offers for a specific listing as read
  - Only marks offers where the current user is the seller
- **Endpoint:** `GET /make-server-5dec7914/offers/count`
  - Returns count of unread offers for the current user
  - Used for header badge and tab badges

### 5. **When Offers Become Unread**
- ✅ New offer created → `is_read = false`
- ✅ Counter offer sent → `is_read = false` (resets to unread for recipient)
- ✅ User expands listing card → All offers marked `is_read = true`

## Visual Examples

### Sorting Order:
**Page-level sorting (Listings):**
1. **Unread listings first** (listings with at least one unread offer)
2. Then read listings
3. Secondary sort by latest offer time

**Example:**
```
✅ [GREEN EDGE] Car Listing (2 unread)      ← Appears first
✅ [GREEN EDGE] House Listing (1 unread)    ← Appears second
   [NORMAL] Laptop Listing (0 unread)       ← Appears third
```

**Offer-level sorting (Within expanded listing):**
1. **Unread offers first**
2. Then read offers
3. Secondary sort by newest first

**Example:**
```
When you expand "Car Listing":
┃ John • $17,200 (unread)        ← Green edge, appears first
┃ Mike • $17,000 (unread)        ← Green edge, appears second
  Sarah • $16,500 (read)          ← Normal, appears third
  Tom • $16,000 (read)            ← Normal, appears fourth
```

### Before Opening (Unread):
```
┌── LISTING CARD ──────────────────┐ ← Green left edge (4px)
│ [img] Toyota Camry - $18,000    │
│       3 offers | 2 unread       │ ← Unread badge
└──────────────────────────────────┘
```

### After Opening (Read):
```
┌─ LISTING CARD ───────────────────┐ ← Normal gray border
│ [img] Toyota Camry - $18,000    │
│       3 offers                  │ ← No unread badge
│                            [^]   │
├──────────────────────────────────┤
│ ┃ John • $17,200               │ ← Green edge on unread offer
│ ┃ [Accept] [Counter] [Decline] │
├──────────────────────────────────┤
│ Sarah • $17,000                 │ ← Normal (was already read)
│ [Accept] [Counter] [Decline]    │
└──────────────────────────────────┘
```

## Files Modified

1. **/supabase/functions/server/index.tsx**
   - Added `is_read: false` when creating new offers
   - Added `is_read: false` when sending counter offers
   - Added `PUT /offers/mark-read/:listingId` endpoint
   - Updated `GET /offers/count` to count unread offers instead of active status

2. **/pages/OffersPage.tsx**
   - Updated `groupOffersByListing()` to sort listings by unread status
   - Listings with unread offers appear at the top
   - Secondary sort by latest offer timestamp
   - Updated "Received" tab badge to show unread count instead of active offers

3. **/components/ListingOfferGroup.tsx**
   - Added green left border when `hasUnread = true`
   - Added unread count badge
   - Added `handleExpand()` function to mark as read
   - Calls API when expanding card with unread offers
   - Sorts offers within listing: unread first, then by newest

4. **/components/OfferRow.tsx**
   - Added green left border for individual unread offers
   - Uses `offer.is_read === false` to determine styling

5. **/components/OfferRow.tsx** (New Component)
   - Lightweight offer row component for expanded view
   - Shows only essential info and action buttons
   - No heavy card styling or redundant listing details

## Testing Checklist

After adding the `is_read` column:

- [ ] Create a new offer → Should show green edge on received listing
- [ ] Open the listing card → Green edge should disappear
- [ ] Individual unread offers should have green edge inside
- [ ] Counter an offer → Should become unread again for recipient
- [ ] Unread count badge should show correct number
- [ ] Unread count should disappear after opening card

## Troubleshooting

**If green edges don't show:**
1. Check that `is_read` column exists in database
2. Check browser console for errors
3. Verify new offers have `is_read = false` in database
4. Refresh the offers page to fetch latest data

**If offers don't mark as read:**
1. Check Network tab for API call to `/mark-read/:listingId`
2. Verify user is authenticated (access token present)
3. Check server logs for errors
4. Ensure user owns the listing (seller_id matches)