# Real Estate Features Documentation

## Overview
The marketplace now includes comprehensive real estate functionality, allowing users to list and browse properties across multiple categories including residential, commercial, land, and rentals.

## Features

### Property Types
1. **Residential - For Sale**
   - Single-family homes
   - Condos and townhouses
   - Multi-family properties

2. **Commercial - For Sale**
   - Office buildings
   - Retail spaces
   - Warehouses and industrial properties

3. **Land - For Sale**
   - Vacant land
   - Development lots
   - Agricultural land

4. **For Rent**
   - Residential rentals
   - Commercial rentals
   - Short-term and long-term leases

### Property Details
Real estate listings include the following detailed information:

- **Property Type**: Residential, Commercial, Land, or Rent
- **Bedrooms**: Number of bedrooms (if applicable)
- **Bathrooms**: Number of bathrooms (if applicable)
- **Square Feet**: Total living/usable space
- **Lot Size**: Size of the lot in square feet
- **Year Built**: Construction year
- **Parking Spaces**: Number of parking spots available
- **Address**: Full street address
- **City, State, ZIP**: Complete location information
- **Amenities**: List of property amenities (e.g., Pool, Gym, Central AC, etc.)

## Database Schema

### Tables

#### real_estate_details
Stores additional property information for real estate listings.

```sql
CREATE TABLE public.real_estate_details (
  id UUID PRIMARY KEY,
  listing_id UUID REFERENCES listings(id) ON DELETE CASCADE,
  property_type TEXT CHECK (property_type IN ('residential', 'commercial', 'land', 'rent')),
  bedrooms INTEGER,
  bathrooms DECIMAL(2,1),
  square_feet INTEGER,
  lot_size INTEGER,
  year_built INTEGER,
  parking_spaces INTEGER,
  address TEXT NOT NULL,
  city TEXT NOT NULL,
  state TEXT NOT NULL,
  zip_code TEXT NOT NULL,
  amenities TEXT[],
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(listing_id)
);
```

### Indexes
- `idx_real_estate_listing_id`: For fast listing lookups
- `idx_real_estate_property_type`: For filtering by property type
- `idx_real_estate_city`: For location-based searches

## API Endpoints

### Create Real Estate Listing
**POST** `/make-server-5dec7914/listings`

Include real estate details in the request body when the category is "Real Estate":

```json
{
  "title": "Beautiful 3BR Home in Downtown",
  "description": "Spacious family home with modern amenities...",
  "price": 450000,
  "category_id": "real-estate-category-uuid",
  "images": ["url1", "url2"],
  "property_type": "residential",
  "bedrooms": 3,
  "bathrooms": 2.5,
  "square_feet": 2400,
  "lot_size": 7200,
  "year_built": 2015,
  "parking_spaces": 2,
  "address": "123 Main Street",
  "city": "San Francisco",
  "state": "CA",
  "zip_code": "94102",
  "amenities": ["Central AC", "Hardwood Floors", "Garden", "Garage"]
}
```

### Get Listing with Real Estate Details
**GET** `/make-server-5dec7914/listings/:id`

Returns listing with `real_estate_details` object if the listing is a real estate property.

## User Interface

### Create Listing Form
When the "Real Estate" category is selected, additional form fields appear:
- Property Type dropdown
- Bedrooms input
- Bathrooms input
- Square Feet input
- Lot Size input
- Year Built input
- Parking Spaces input
- Address input
- City input
- State input
- ZIP Code input
- Amenities multi-select

### Listing Detail Page
Real estate listings display a dedicated "Property Details" section showing:
- All property specifications in a grid layout
- Full address information
- Amenity tags
- Responsive design for mobile and desktop viewing

## Mobile Responsiveness

The marketplace is fully responsive with:
- **Mobile (default)**: 2-column grid layout
- **Tablet (md)**: 3-column grid layout
- **Desktop (lg)**: 4-column grid layout
- **Large Desktop (xl)**: 5-column grid layout

All real estate forms and detail pages are optimized for mobile viewing with appropriate input types and layouts.

## Setup Instructions

1. **Run the main schema**:
   ```bash
   # Execute the main schema file
   psql -U postgres -d your_database -f supabase/migrations/schema.sql
   ```

2. **Verify tables**:
   ```sql
   -- Check that real_estate_details table exists
   SELECT * FROM public.real_estate_details LIMIT 1;
   
   -- Verify Real Estate category was added
   SELECT * FROM public.categories WHERE slug = 'real-estate';
   ```

3. **Test the feature**:
   - Navigate to "Create Listing"
   - Select "Real Estate" category
   - Fill in property details
   - Create and view the listing

## Example Queries

### Get all active real estate listings
```sql
SELECT 
  l.*,
  red.*,
  c.name as category_name
FROM listings l
JOIN categories c ON l.category_id = c.id
LEFT JOIN real_estate_details red ON l.id = red.listing_id
WHERE c.slug = 'real-estate'
AND l.status = 'active'
ORDER BY l.created_at DESC;
```

### Search by city
```sql
SELECT 
  l.*,
  red.*
FROM listings l
JOIN categories c ON l.category_id = c.id
JOIN real_estate_details red ON l.id = red.listing_id
WHERE c.slug = 'real-estate'
AND red.city ILIKE '%San Francisco%'
AND l.status = 'active';
```

### Filter by property type
```sql
SELECT 
  l.*,
  red.*
FROM listings l
JOIN categories c ON l.category_id = c.id
JOIN real_estate_details red ON l.id = red.listing_id
WHERE c.slug = 'real-estate'
AND red.property_type = 'residential'
AND l.status = 'active';
```

## Future Enhancements

Potential additions to consider:
- Map integration for property locations
- Advanced search filters (price range, bedrooms, bathrooms)
- Virtual tour/video support
- Mortgage calculator
- Neighborhood information
- School district data
- Property comparison feature
- Saved searches with notifications
