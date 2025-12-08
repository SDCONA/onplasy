# Sorting and Filtering Features

## Overview
The marketplace includes comprehensive sorting and filtering capabilities with intelligent defaults that enhance the browsing experience.

## Default Behavior

### Random Sorting by Default
- All listings load in **random order** by default
- Each page refresh produces a **new random order**
- Ensures fair visibility for all listings
- Prevents newer listings from always appearing first

### Filter Reset on Refresh
- All filters and sorting preferences reset when the page is refreshed
- Returns to default random sorting
- Clears search queries and category selections
- Ensures a fresh browsing experience on each visit

### URL Preservation
- Page stays on the same link when refreshed
- No URL parameters are used for filters
- Clean URLs throughout the site
- Better user experience and sharability

## Sorting Options

Users can manually choose from the following sorting options:

1. **Random** (Default)
   - Shuffles listings in random order
   - Changes on every page load/refresh
   - Uses Fisher-Yates shuffle algorithm for true randomness

2. **Newest First**
   - Displays most recently created listings first
   - Sorted by `created_at` descending
   - Best for finding fresh content

3. **Oldest First**
   - Displays oldest listings first
   - Sorted by `created_at` ascending
   - Useful for browsing historical listings

4. **Price: Low to High**
   - Sorts by price in ascending order
   - Best for budget-conscious shoppers
   - Shows cheapest items first

5. **Price: High to Low**
   - Sorts by price in descending order
   - Best for premium/luxury items
   - Shows most expensive items first

## Implementation Details

### Frontend (HomePage.tsx)

```typescript
const [sortBy, setSortBy] = useState('random'); // Default to random

useEffect(() => {
  fetchListings();
}, [selectedCategory, searchQuery, sortBy]); // Re-fetch when sort changes
```

The sort dropdown:
```jsx
<select value={sortBy} onChange={(e) => setSortBy(e.target.value)}>
  <option value="random">Random</option>
  <option value="newest">Newest First</option>
  <option value="oldest">Oldest First</option>
  <option value="price_low">Price: Low to High</option>
  <option value="price_high">Price: High to Low</option>
</select>
```

### Backend (index.tsx)

The server handles sorting via the `sort` query parameter:

```typescript
const sort = c.req.query('sort') || 'random';

if (sort === 'random') {
  // Fetch all data and shuffle in memory using Fisher-Yates algorithm
  const shuffled = data ? [...data] : [];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return c.json({ listings: shuffled });
} else {
  // Use database-level sorting for other options
  switch (sort) {
    case 'newest':
      query = query.order('created_at', { ascending: false });
      break;
    case 'price_low':
      query = query.order('price', { ascending: true });
      break;
    // ... etc
  }
}
```

### Fisher-Yates Shuffle Algorithm

The random sorting uses the Fisher-Yates (Knuth) shuffle algorithm:
- **O(n) time complexity** - very efficient
- **Unbiased** - every permutation has equal probability
- **In-place** - minimal memory overhead
- Ensures true randomness on every request

## User Experience

### Listing Counter
Shows the number of results:
```
"X listings found"
```
Updates dynamically based on filters and search

### Mobile Responsive
- **Mobile**: Vertical layout for sort controls
- **Desktop**: Horizontal layout with aligned controls
- Sort dropdown expands to full width on mobile
- Maintains usability across all screen sizes

### Filter Combinations
Users can combine:
- **Category selection** + Sorting
- **Search query** + Sorting
- **Category** + **Search** + Sorting

All filters work together seamlessly.

## Benefits

### For Buyers
- Fresh content on every visit
- Fair discovery of all listings
- Flexible sorting for different shopping needs
- Clean, predictable URLs

### For Sellers
- Equal visibility opportunity
- Not disadvantaged by listing date
- Fair marketplace environment
- Better chances of being discovered

### For Platform
- Increased engagement through varied content
- Better conversion rates
- Fair marketplace dynamics
- Simple, maintainable architecture

## Technical Considerations

### Performance
- Random sorting is done server-side to ensure consistency
- Database queries are optimized with proper indexes
- Minimal overhead from shuffle algorithm
- Efficient re-rendering on sort changes

### State Management
- Filters stored in component state only
- No localStorage or URL persistence
- Clean state on refresh
- No stale filter issues

### Future Enhancements
Potential additions:
- Save sorting preference (opt-in)
- Advanced filters (price range, location, condition)
- Sort by relevance for search queries
- Recently viewed items
- Personalized recommendations
