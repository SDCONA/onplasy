// OPTIMIZED LISTINGS QUERY HANDLER
// This replaces the old fetch-all-then-filter approach with database-level pagination

import { createClient } from 'npm:@supabase/supabase-js@2';

const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
const supabase = createClient(supabaseUrl, supabaseServiceKey);

// Helper to calculate distance between two points using Haversine formula
function calculateDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 3959; // Earth's radius in miles
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a = 
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
    Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

// Helper to get zipcode coordinates
async function getZipcodeCoords(zipcode: string): Promise<{ lat: number, lon: number } | null> {
  try {
    const response = await fetch(`https://api.zippopotam.us/us/${zipcode}`);
    if (!response.ok) return null;
    
    const data = await response.json();
    if (data.places && data.places.length > 0) {
      return {
        lat: parseFloat(data.places[0].latitude),
        lon: parseFloat(data.places[0].longitude)
      };
    }
    return null;
  } catch (error) {
    console.log('Zipcode API error:', error);
    return null;
  }
}

export async function getOptimizedListings(params: {
  category?: string;
  subcategory?: string;
  search?: string;
  status?: string;
  userId?: string;
  sort?: string;
  type?: string;
  location?: string;
  zipcode?: string;
  distance?: number;
  limit?: number;
  offset?: number;
}) {
  const {
    category,
    subcategory,
    search,
    status = 'active',
    userId,
    sort = 'random',
    type,
    location,
    zipcode,
    distance = 50,
    limit = 30,
    offset = 0
  } = params;

  // OPTIMIZED: Handle zipcode search separately (uses lat/lon from database)
  if (zipcode && zipcode.length === 5) {
    console.log(`[ZIP FILTER] Starting optimized filter for zipcode: ${zipcode}, distance: ${distance} miles`);
    const searchCoords = await getZipcodeCoords(zipcode);
    
    if (!searchCoords) {
      return { listings: [], total: 0, hasMore: false };
    }
    
    console.log(`[ZIP FILTER] Search coordinates for ${zipcode}: lat=${searchCoords.lat}, lon=${searchCoords.lon}`);
    
    // Build query with filters
    let query = supabase
      .from('listings')
      .select(`
        *,
        profiles!listings_user_id_fkey(id, name, avatar_url, rating_count, rating_average, created_at),
        categories(id, name, slug),
        subcategories(id, name, slug)
      `, { count: 'exact' })
      .eq('status', status)
      .not('latitude', 'is', null)
      .not('longitude', 'is', null);
    
    if (category && category !== 'all') {
      const { data: categoryData } = await supabase
        .from('categories')
        .select('id')
        .eq('slug', category)
        .single();
      
      if (categoryData) {
        query = query.eq('category_id', categoryData.id);
      }
    }
    
    if (subcategory && subcategory !== 'all') {
      const { data: subcategoryData } = await supabase
        .from('subcategories')
        .select('id')
        .eq('slug', subcategory)
        .single();
      
      if (subcategoryData) {
        query = query.eq('subcategory_id', subcategoryData.id);
      }
    }
    
    if (search) {
      query = query.or(`title.ilike.%${search}%,description.ilike.%${search}%`);
    }
    
    if (userId) {
      query = query.eq('user_id', userId);
    }
    
    if (type && type !== 'all') {
      query = query.eq('listing_type', type);
    }
    
    if (location) {
      query = query.or(`title.ilike.%${location}%,description.ilike.%${location}%`);
    }
    
    // Fetch ALL listings with coordinates (we need to filter by distance)
    const { data, error } = await query;
    
    if (error) {
      throw error;
    }
    
    // Filter by distance using stored lat/lon (NO more API calls!)
    const listingsWithDistance = (data || [])
      .map(listing => {
        const dist = calculateDistance(
          searchCoords.lat,
          searchCoords.lon,
          listing.latitude,
          listing.longitude
        );
        return { ...listing, distance: dist };
      })
      .filter(item => item.distance <= distance);
    
    console.log(`[ZIP FILTER] Found ${listingsWithDistance.length} listings within ${distance} miles`);
    
    // Apply sorting
    let sorted = [...listingsWithDistance];
    if (sort === 'random') {
      for (let i = sorted.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [sorted[i], sorted[j]] = [sorted[j], sorted[i]];
      }
    } else {
      switch (sort) {
        case 'nearest':
          sorted.sort((a, b) => a.distance - b.distance);
          break;
        case 'newest':
          sorted.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
          break;
        case 'oldest':
          sorted.sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime());
          break;
        case 'price_low':
          sorted.sort((a, b) => (a.price || 0) - (b.price || 0));
          break;
        case 'price_high':
          sorted.sort((a, b) => (b.price || 0) - (a.price || 0));
          break;
        default:
          sorted.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
      }
    }
    
    // Paginate
    const paginatedData = sorted.slice(offset, offset + limit);
    const hasMore = offset + limit < sorted.length;
    
    return { listings: paginatedData, total: sorted.length, hasMore };
  }
  
  // OPTIMIZED: Regular queries without zipcode (use database-level sorting and pagination)
  let query = supabase
    .from('listings')
    .select(`
      *,
      profiles!listings_user_id_fkey(id, name, avatar_url, rating_count, rating_average, created_at),
      categories(id, name, slug),
      subcategories(id, name, slug)
    `, { count: 'exact' });
  
  if (status) {
    query = query.eq('status', status);
  }
  
  if (category && category !== 'all') {
    const { data: categoryData } = await supabase
      .from('categories')
      .select('id')
      .eq('slug', category)
      .single();
    
    if (categoryData) {
      query = query.eq('category_id', categoryData.id);
    }
  }
  
  if (subcategory && subcategory !== 'all') {
    const { data: subcategoryData } = await supabase
      .from('subcategories')
      .select('id')
      .eq('slug', subcategory)
      .single();
    
    if (subcategoryData) {
      query = query.eq('subcategory_id', subcategoryData.id);
    }
  }
  
  if (search) {
    query = query.or(`title.ilike.%${search}%,description.ilike.%${search}%`);
  }
  
  if (userId) {
    query = query.eq('user_id', userId);
  }
  
  if (type && type !== 'all') {
    query = query.eq('listing_type', type);
  }
  
  if (location) {
    query = query.or(`title.ilike.%${location}%,description.ilike.%${location}%`);
  }
  
  // OPTIMIZED: Apply sorting at database level
  if (sort === 'random') {
    // For random sort, fetch a larger batch and shuffle client-side
    const batchSize = Math.max(limit * 3, 100);
    query = query.order('created_at', { ascending: false }).range(0, batchSize - 1);
    
    const { data, error, count } = await query;
    
    if (error) {
      throw error;
    }
    
    // Shuffle the batch
    let shuffled = data ? [...data] : [];
    for (let i = shuffled.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
    }
    
    // Return requested page
    const paginatedData = shuffled.slice(0, limit);
    const hasMore = (count || 0) > batchSize;
    
    return { listings: paginatedData, total: count || 0, hasMore };
  } else {
    // OPTIMIZED: Use database-level sorting and pagination
    switch (sort) {
      case 'newest':
        query = query.order('created_at', { ascending: false });
        break;
      case 'oldest':
        query = query.order('created_at', { ascending: true });
        break;
      case 'price_low':
        query = query.order('price', { ascending: true, nullsFirst: false });
        break;
      case 'price_high':
        query = query.order('price', { ascending: false, nullsFirst: false });
        break;
      default:
        query = query.order('created_at', { ascending: false });
    }
    
    // OPTIMIZED: Database-level pagination - ONLY fetch what's needed!
    query = query.range(offset, offset + limit - 1);
    
    const { data, error, count } = await query;
    
    if (error) {
      throw error;
    }
    
    const hasMore = (count || 0) > offset + limit;
    
    return { listings: data || [], total: count || 0, hasMore };
  }
}

// Helper to geocode and save lat/lon when creating listing
export async function geocodeAndSave(listingId: string, zipcode: string | null) {
  if (!zipcode || zipcode.length !== 5) {
    console.log(`[GEOCODE] Skipping geocoding for listing ${listingId} - invalid zipcode: ${zipcode}`);
    return;
  }
  
  console.log(`[GEOCODE] Geocoding listing ${listingId} with zipcode: ${zipcode}`);
  const coords = await getZipcodeCoords(zipcode);
  
  if (coords) {
    console.log(`[GEOCODE] Got coordinates for ${zipcode}: lat=${coords.lat}, lon=${coords.lon}`);
    const { error } = await supabase
      .from('listings')
      .update({ 
        latitude: coords.lat,
        longitude: coords.lon
      })
      .eq('id', listingId);
    
    if (error) {
      console.log(`[GEOCODE] Error saving coordinates for listing ${listingId}:`, error);
    } else {
      console.log(`[GEOCODE] Successfully saved coordinates for listing ${listingId}`);
    }
  } else {
    console.log(`[GEOCODE] Could not get coordinates for zipcode: ${zipcode}`);
  }
}
