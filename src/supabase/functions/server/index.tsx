import { Hono } from 'npm:hono@4';
import { cors } from 'npm:hono/cors';
import { logger } from 'npm:hono/logger';
import { createClient } from 'npm:@supabase/supabase-js@2';
import { verifyRecaptcha } from './recaptcha.ts';
import { getOptimizedListings, geocodeAndSave } from './listings_optimized.tsx';

const app = new Hono();

// Middleware
app.use('*', cors({
  origin: '*',
  allowMethods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowHeaders: ['Content-Type', 'Authorization'],
}));

// app.use('*', logger(console.log)); // Disabled to prevent JSON corruption

const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
const supabase = createClient(supabaseUrl, supabaseServiceKey);

// Initialize storage bucket on startup
const BUCKET_NAME = 'make-5dec7914-listings';

async function initStorage() {
  try {
    const { data: buckets } = await supabase.storage.listBuckets();
    const bucketExists = buckets?.some(bucket => bucket.name === BUCKET_NAME);
    
    if (!bucketExists) {
      await supabase.storage.createBucket(BUCKET_NAME, {
        public: true,
        fileSizeLimit: 5242880 // 5MB per file
      });
      console.log('Storage bucket created:', BUCKET_NAME);
    } else {
      // Update existing bucket to ensure it's public
      await supabase.storage.updateBucket(BUCKET_NAME, {
        public: true,
        fileSizeLimit: 5242880
      });
      console.log('Storage bucket updated to public:', BUCKET_NAME);
    }
  } catch (error) {
    console.error('Storage initialization error:', error);
  }
}

// Initialize storage
initStorage();

// Endpoint to get reCAPTCHA site key (public key, safe to expose)
app.get('/make-server-5dec7914/recaptcha-site-key', async (c) => {
  const siteKey = Deno.env.get('RECAPTCHA_SITE_KEY_NEW');
  
  if (!siteKey) {
    return c.json({ error: 'reCAPTCHA site key not configured' }, 500);
  }
  
  return c.json({ siteKey });
});

// Helper to get authenticated user
async function getAuthUser(request: Request) {
  const accessToken = request.headers.get('Authorization')?.split(' ')[1];
  if (!accessToken) {
    console.log('No access token provided');
    return null;
  }
  
  const { data: { user }, error } = await supabase.auth.getUser(accessToken);
  if (error) {
    console.log('Auth error:', error.message, 'Code:', error.status);
    return null;
  }
  if (!user) {
    console.log('No user found for token');
    return null;
  }
  
  return user;
}

// Helper to calculate distance between two zipcodes using Haversine formula
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

// Helper to get zipcode coordinates using zipcodebase.com API
async function getZipcodeCoords(zipcode: string): Promise<{ lat: number, lon: number } | null> {
  try {
    // Using a free zipcode API service
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

// Auth routes
app.post('/make-server-5dec7914/auth/signup', async (c) => {
  try {
    const { email, password, name, recaptchaToken } = await c.req.json();
    
    // Verify reCAPTCHA
    const recaptchaResult = await verifyRecaptcha(recaptchaToken);
    if (!recaptchaResult) {
      return c.json({ error: 'reCAPTCHA verification failed' }, 400);
    }
    
    // Prevent non-admins from using "Admin" or related names
    const nameLower = name.toLowerCase().trim();
    const restrictedNames = ['admin', 'administrator', 'moderator', 'support', 'system'];
    const containsRestricted = restrictedNames.some(restricted => nameLower.includes(restricted));
    
    if (containsRestricted) {
      return c.json({ error: 'This name is reserved and cannot be used. Please choose a different name.' }, 400);
    }
    
    // Create user without email confirmation
    const { data, error } = await supabase.auth.admin.createUser({
      email,
      password,
      email_confirm: false, // Require email verification
      user_metadata: { name }
    });
    
    if (error) {
      console.log('Signup error:', error);
      return c.json({ error: error.message }, 400);
    }
    
    // Create profile
    await supabase.from('profiles').insert({
      id: data.user.id,
      email,
      name
    });
    
    // Generate email verification token
    const { data: verificationData, error: verificationError } = await supabase.auth.admin.generateLink({
      type: 'signup',
      email: email,
    });
    
    if (verificationError) {
      console.log('Verification link generation error:', verificationError);
      return c.json({ error: 'Failed to generate verification link' }, 500);
    }
    
    // Send verification email via Resend
    try {
      const resendApiKey = Deno.env.get('RESEND_API_KEY');
      if (!resendApiKey) {
        console.log('RESEND_API_KEY not configured');
        return c.json({ error: 'Email service not configured' }, 500);
      }
      
      const resendResponse = await fetch('https://api.resend.com/emails', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${resendApiKey}`
        },
        body: JSON.stringify({
          from: 'OnPlasy <onboarding@resend.dev>',
          to: [email],
          subject: 'Verify your OnPlasy account',
          html: `
            <!DOCTYPE html>
            <html>
              <head>
                <meta charset="utf-8">
                <meta name="viewport" content="width=device-width, initial-scale=1.0">
                <title>Verify your email</title>
              </head>
              <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
                <div style="background-color: #f8f9fa; border-radius: 10px; padding: 30px; margin-bottom: 20px;">
                  <h1 style="color: #2563eb; margin-top: 0;">Welcome to OnPlasy!</h1>
                  <p style="font-size: 16px;">Hi ${name},</p>
                  <p style="font-size: 16px;">Thank you for signing up! Please verify your email address to complete your registration and start buying and selling on OnPlasy.</p>
                  <div style="text-align: center; margin: 30px 0;">
                    <a href="${verificationData.properties.action_link}" 
                       style="background-color: #2563eb; color: white; padding: 14px 28px; text-decoration: none; border-radius: 6px; font-size: 16px; display: inline-block;">
                      Verify Email Address
                    </a>
                  </div>
                  <p style="font-size: 14px; color: #666;">If the button above doesn't work, copy and paste this link into your browser:</p>
                  <p style="font-size: 14px; color: #2563eb; word-break: break-all;">${verificationData.properties.action_link}</p>
                  <p style="font-size: 14px; color: #666; margin-top: 30px;">This verification link will expire in 24 hours.</p>
                </div>
                <div style="text-align: center; font-size: 12px; color: #999;">
                  <p>If you didn't create an account with OnPlasy, you can safely ignore this email.</p>
                  <p>&copy; ${new Date().getFullYear()} OnPlasy. All rights reserved.</p>
                </div>
              </body>
            </html>
          `
        })
      });
      
      const resendData = await resendResponse.json();
      
      if (!resendResponse.ok) {
        console.log('Resend API error:', resendData);
        return c.json({ error: 'Failed to send verification email' }, 500);
      }
      
      console.log('Verification email sent successfully:', resendData);
    } catch (emailError) {
      console.log('Email sending exception:', emailError);
      return c.json({ error: 'Failed to send verification email' }, 500);
    }
    
    return c.json({ 
      user: data.user,
      message: 'Account created! Please check your email to verify your account.'
    });
  } catch (error) {
    console.log('Signup exception:', error);
    return c.json({ error: 'Signup failed' }, 500);
  }
});

// Listings routes (OPTIMIZED with database-level pagination)
app.get('/make-server-5dec7914/listings', async (c) => {
  try {
    const category = c.req.query('category');
    const subcategory = c.req.query('subcategory');
    const search = c.req.query('search');
    const status = c.req.query('status') || 'active';
    const userId = c.req.query('userId');
    const sort = c.req.query('sort') || 'random';
    const type = c.req.query('type'); // Buy/Rent filter for real estate
    const location = c.req.query('location'); // Location filter for services
    const zipcode = c.req.query('zipcode'); // Zipcode filter
    const distance = parseInt(c.req.query('distance') || '50'); // Distance in miles
    const limit = parseInt(c.req.query('limit') || '30'); // Pagination limit
    const offset = parseInt(c.req.query('offset') || '0'); // Pagination offset
    
    // Use optimized listing fetcher
    const result = await getOptimizedListings({
      category,
      subcategory,
      search,
      status,
      userId,
      sort,
      type,
      location,
      zipcode,
      distance,
      limit,
      offset
    });
    
    return c.json(result);
  } catch (error) {
    console.log('Fetch listings exception:', error);
    return c.json({ error: 'Failed to fetch listings' }, 500);
  }
});

app.get('/make-server-5dec7914/listings/:id', async (c) => {
  try {
    const id = c.req.param('id');
    
    const { data, error } = await supabase
      .from('listings')
      .select(`
        *,
        profiles!listings_user_id_fkey(id, name, avatar_url, rating_count, rating_average, created_at),
        categories(id, name, slug),
        subcategories(id, name, slug)
      `)
      .eq('id', id)
      .single();
    
    if (error) {
      console.log('Fetch listing error:', error);
      return c.json({ error: error.message }, 400);
    }
    
    // Check if it's a real estate listing and fetch additional details
    if (data.categories?.slug === 'real-estate') {
      const { data: reDetails } = await supabase
        .from('real_estate_details')
        .select('*')
        .eq('listing_id', id)
        .single();
      
      if (reDetails) {
        data.real_estate_details = reDetails;
      }
    }
    
    // Increment views
    await supabase
      .from('listings')
      .update({ views: (data.views || 0) + 1 })
      .eq('id', id);
    
    return c.json({ listing: data });
  } catch (error) {
    console.log('Fetch listing exception:', error);
    return c.json({ error: 'Failed to fetch listing' }, 500);
  }
});

app.post('/make-server-5dec7914/listings', async (c) => {
  try {
    const user = await getAuthUser(c.req.raw);
    if (!user) return c.json({ error: 'Unauthorized' }, 401);
    
    const body = await c.req.json();
    const { title, description, price, category_id, subcategory_id, images, zip_code, property_type, listing_type, bedrooms, bathrooms, square_feet, lot_size, year_built, parking_spaces, address, city, state, amenities } = body;
    
    const { data, error } = await supabase
      .from('listings')
      .insert({
        user_id: user.id,
        title,
        description,
        price,
        category_id,
        subcategory_id: subcategory_id || null,
        images: images || [],
        zip_code: zip_code || null
      })
      .select()
      .single();
    
    if (error) {
      console.log('Create listing error:', error);
      return c.json({ error: error.message }, 400);
    }
    
    // If real estate listing, insert additional details
    if (property_type) {
      const { error: reError } = await supabase
        .from('real_estate_details')
        .insert({
          listing_id: data.id,
          property_type,
          listing_type: listing_type || 'sale',
          bedrooms,
          bathrooms,
          square_feet,
          lot_size,
          year_built,
          parking_spaces,
          address,
          city,
          state,
          zip_code,
          amenities: amenities || []
        });
      
      if (reError) {
        console.log('Create real estate details error:', reError);
        // Delete the listing if real estate details fail
        await supabase.from('listings').delete().eq('id', data.id);
        return c.json({ error: 'Failed to create real estate details' }, 400);
      }
    }
    
    // OPTIMIZATION: Geocode and save lat/lon for zipcode searches
    if (zip_code) {
      geocodeAndSave(data.id, zip_code).catch(err => 
        console.log('Geocoding error (non-fatal):', err)
      );
    }
    
    return c.json({ listing: data });
  } catch (error) {
    console.log('Create listing exception:', error);
    return c.json({ error: 'Failed to create listing' }, 500);
  }
});

app.put('/make-server-5dec7914/listings/:id', async (c) => {
  try {
    const user = await getAuthUser(c.req.raw);
    if (!user) return c.json({ error: 'Unauthorized' }, 401);
    
    const id = c.req.param('id');
    const body = await c.req.json();
    
    // Extract listing fields and real estate fields
    const { 
      title, description, price, category_id, subcategory_id, images,
      property_type, listing_type, bedrooms, bathrooms, square_feet, 
      lot_size, year_built, parking_spaces, address, city, state, 
      zip_code, amenities 
    } = body;
    
    // Update main listing
    const { data, error } = await supabase
      .from('listings')
      .update({
        title,
        description,
        price,
        category_id,
        subcategory_id: subcategory_id || null,
        images: images || [],
        zip_code: zip_code || null
      })
      .eq('id', id)
      .eq('user_id', user.id)
      .select()
      .single();
    
    if (error) {
      console.log('Update listing error:', error);
      return c.json({ error: error.message }, 400);
    }
    
    // If real estate fields are provided, update or insert real estate details
    if (property_type) {
      // Check if real estate details exist
      const { data: existingRE } = await supabase
        .from('real_estate_details')
        .select('*')
        .eq('listing_id', id)
        .single();
      
      const reData = {
        property_type,
        listing_type: listing_type || 'sale',
        bedrooms,
        bathrooms,
        square_feet,
        lot_size,
        year_built,
        parking_spaces,
        address,
        city,
        state,
        zip_code,
        amenities: amenities || []
      };
      
      if (existingRE) {
        // Update existing
        await supabase
          .from('real_estate_details')
          .update(reData)
          .eq('listing_id', id);
      } else {
        // Insert new
        await supabase
          .from('real_estate_details')
          .insert({
            listing_id: id,
            ...reData
          });
      }
    }
    
    // OPTIMIZATION: Geocode and save lat/lon if zipcode changed
    if (zip_code) {
      geocodeAndSave(id, zip_code).catch(err => 
        console.log('Geocoding error (non-fatal):', err)
      );
    }
    
    return c.json({ listing: data });
  } catch (error) {
    console.log('Update listing exception:', error);
    return c.json({ error: 'Failed to update listing' }, 500);
  }
});

app.post('/make-server-5dec7914/listings/:id/renew', async (c) => {
  try {
    const user = await getAuthUser(c.req.raw);
    if (!user) return c.json({ error: 'Unauthorized' }, 401);
    
    const id = c.req.param('id');
    
    const { data, error } = await supabase
      .from('listings')
      .update({
        status: 'active',
        expires_at: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
        archived_at: null
      })
      .eq('id', id)
      .eq('user_id', user.id)
      .select()
      .single();
    
    if (error) {
      console.log('Renew listing error:', error);
      return c.json({ error: error.message }, 400);
    }
    
    return c.json({ listing: data });
  } catch (error) {
    console.log('Renew listing exception:', error);
    return c.json({ error: 'Failed to renew listing' }, 500);
  }
});

app.delete('/make-server-5dec7914/listings/:id', async (c) => {
  try {
    const user = await getAuthUser(c.req.raw);
    if (!user) return c.json({ error: 'Unauthorized' }, 401);
    
    const id = c.req.param('id');
    
    const { error } = await supabase
      .from('listings')
      .delete()
      .eq('id', id)
      .eq('user_id', user.id);
    
    if (error) {
      console.log('Delete listing error:', error);
      return c.json({ error: error.message }, 400);
    }
    
    return c.json({ success: true });
  } catch (error) {
    console.log('Delete listing exception:', error);
    return c.json({ error: 'Failed to delete listing' }, 500);
  }
});

// Archive listing (user can manually archive their listing)
app.post('/make-server-5dec7914/listings/:id/archive', async (c) => {
  try {
    const user = await getAuthUser(c.req.raw);
    if (!user) return c.json({ error: 'Unauthorized' }, 401);
    
    const id = c.req.param('id');
    
    // Update listing status to archived
    const { error } = await supabase
      .from('listings')
      .update({
        status: 'archived',
        archived_at: new Date().toISOString()
      })
      .eq('id', id)
      .eq('user_id', user.id);
    
    if (error) {
      console.log('Archive listing error:', error);
      return c.json({ error: error.message }, 400);
    }
    
    return c.json({ success: true });
  } catch (error) {
    console.log('Archive listing exception:', error);
    return c.json({ error: 'Failed to archive listing' }, 500);
  }
});

// Saved listings routes
app.get('/make-server-5dec7914/saved-listings', async (c) => {
  try {
    const user = await getAuthUser(c.req.raw);
    if (!user) return c.json({ error: 'Unauthorized' }, 401);
    
    const limit = parseInt(c.req.query('limit') || '30');
    const offset = parseInt(c.req.query('offset') || '0');
    
    const { data, error } = await supabase
      .from('saved_listings')
      .select(`
        *,
        listings(
          *,
          profiles!listings_user_id_fkey(id, name, avatar_url, rating_average),
          categories(id, name, slug),
          subcategories(id, name, slug)
        )
      `)
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1);
    
    if (error) {
      console.log('Fetch saved listings error:', error);
      return c.json({ error: error.message }, 400);
    }
    
    // Count total for hasMore flag
    const { count } = await supabase
      .from('saved_listings')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', user.id);
    
    const hasMore = offset + limit < (count || 0);
    
    return c.json({ savedListings: data, total: count, hasMore });
  } catch (error) {
    console.log('Fetch saved listings exception:', error);
    return c.json({ error: 'Failed to fetch saved listings' }, 500);
  }
});

app.post('/make-server-5dec7914/saved-listings', async (c) => {
  try {
    const user = await getAuthUser(c.req.raw);
    if (!user) return c.json({ error: 'Unauthorized' }, 401);
    
    const { listing_id } = await c.req.json();
    
    const { data, error } = await supabase
      .from('saved_listings')
      .insert({ user_id: user.id, listing_id })
      .select()
      .single();
    
    if (error) {
      console.log('Save listing error:', error);
      return c.json({ error: error.message }, 400);
    }
    
    return c.json({ savedListing: data });
  } catch (error) {
    console.log('Save listing exception:', error);
    return c.json({ error: 'Failed to save listing' }, 500);
  }
});

app.delete('/make-server-5dec7914/saved-listings/:listingId', async (c) => {
  try {
    const user = await getAuthUser(c.req.raw);
    if (!user) return c.json({ error: 'Unauthorized' }, 401);
    
    const listingId = c.req.param('listingId');
    
    const { error } = await supabase
      .from('saved_listings')
      .delete()
      .eq('user_id', user.id)
      .eq('listing_id', listingId);
    
    if (error) {
      console.log('Unsave listing error:', error);
      return c.json({ error: error.message }, 400);
    }
    
    return c.json({ success: true });
  } catch (error) {
    console.log('Unsave listing exception:', error);
    return c.json({ error: 'Failed to unsave listing' }, 500);
  }
});

// Categories routes
app.get('/make-server-5dec7914/categories', async (c) => {
  try {
    // First get all categories
    const { data: categories, error: catError } = await supabase
      .from('categories')
      .select('*')
      .order('sort_order', { ascending: true });
    
    if (catError) {
      console.error('Fetch categories error:', catError);
      return c.json({ error: catError.message }, 400);
    }
    
    // Then get all subcategories separately to avoid the default 10 limit
    const { data: subcategories, error: subError } = await supabase
      .from('subcategories')
      .select('*')
      .order('sort_order', { ascending: true });
    
    if (subError) {
      console.error('Fetch subcategories error:', subError);
      return c.json({ error: subError.message }, 400);
    }
    
    // Manually group subcategories by category
    const categoriesWithSubs = categories?.map(cat => {
      const catSubcategories = subcategories?.filter(sub => sub.category_id === cat.id) || [];
      return {
        ...cat,
        subcategories: catSubcategories
      };
    });
    
    return c.json({ categories: categoriesWithSubs });
  } catch (error) {
    console.error('Fetch categories exception:', error);
    return c.json({ error: 'Failed to fetch categories' }, 500);
  }
});

// Messages routes
app.get('/make-server-5dec7914/conversations', async (c) => {
  try {
    const user = await getAuthUser(c.req.raw);
    if (!user) return c.json({ error: 'Unauthorized' }, 401);

    // Get distinct conversations from messages
    const { data, error } = await supabase
      .from('messages')
      .select(`
        conversation_id,
        listing_id,
        sender_id,
        recipient_id,
        content,
        created_at,
        is_read,
        sender:profiles!messages_sender_id_fkey(id, name, avatar_url),
        recipient:profiles!messages_recipient_id_fkey(id, name, avatar_url)
      `)
      .or(`sender_id.eq.${user.id},recipient_id.eq.${user.id}`)
      .order('created_at', { ascending: false });
    
    if (error) {
      console.log('Fetch conversations error:', error);
      return c.json({ error: error.message }, 400);
    }

    // Group by conversation_id and get the latest message for each
    const conversationMap = new Map();
    
    for (const message of data) {
      if (!conversationMap.has(message.conversation_id)) {
        const otherUser = message.sender_id === user.id ? message.recipient : message.sender;
        
        // Count unread messages in this conversation
        const unreadCount = data.filter(msg => 
          msg.conversation_id === message.conversation_id &&
          msg.recipient_id === user.id &&
          !msg.is_read
        ).length;
        
        conversationMap.set(message.conversation_id, {
          conversation_id: message.conversation_id,
          listing_id: message.listing_id,
          other_user: otherUser,
          last_message: message,
          unread_count: unreadCount
        });
      }
    }
    
    const conversations = Array.from(conversationMap.values());

    return c.json({ conversations });
  } catch (error) {
    console.log('Get conversations exception:', error);
    return c.json({ error: 'Failed to fetch conversations' }, 500);
  }
});

app.get('/make-server-5dec7914/unread-count', async (c) => {
  try {
    const user = await getAuthUser(c.req.raw);
    if (!user) return c.json({ error: 'Unauthorized' }, 401);

    const { count, error } = await supabase
      .from('messages')
      .select('*', { count: 'exact', head: true })
      .eq('recipient_id', user.id)
      .eq('is_read', false);
    
    if (error) {
      console.log('Get unread count error:', error);
      return c.json({ error: error.message }, 400);
    }

    return c.json({ unread_count: count || 0 });
  } catch (error) {
    console.log('Get unread count exception:', error);
    return c.json({ error: 'Failed to fetch unread count' }, 500);
  }
});

app.get('/make-server-5dec7914/messages/:conversationId', async (c) => {
  try {
    const user = await getAuthUser(c.req.raw);
    if (!user) return c.json({ error: 'Unauthorized' }, 401);
    
    const conversationId = c.req.param('conversationId');
    
    const { data, error } = await supabase
      .from('messages')
      .select(`
        *,
        sender:profiles!messages_sender_id_fkey(id, name, avatar_url),
        recipient:profiles!messages_recipient_id_fkey(id, name, avatar_url)
      `)
      .eq('conversation_id', conversationId)
      .order('created_at', { ascending: true });
    
    if (error) {
      console.log('Fetch messages error:', error);
      return c.json({ error: error.message }, 400);
    }
    
    // Mark as read
    await supabase
      .from('messages')
      .update({ is_read: true })
      .eq('conversation_id', conversationId)
      .eq('recipient_id', user.id);
    
    return c.json({ messages: data });
  } catch (error) {
    console.log('Fetch messages exception:', error);
    return c.json({ error: 'Failed to fetch messages' }, 500);
  }
});

app.post('/make-server-5dec7914/messages', async (c) => {
  try {
    const user = await getAuthUser(c.req.raw);
    if (!user) return c.json({ error: 'Unauthorized' }, 401);
    
    const { conversation_id, recipient_id, listing_id, content } = await c.req.json();
    
    const { data, error } = await supabase
      .from('messages')
      .insert({
        conversation_id,
        sender_id: user.id,
        recipient_id,
        listing_id,
        content
      })
      .select()
      .single();
    
    if (error) {
      console.log('Send message error:', error);
      return c.json({ error: error.message }, 400);
    }
    
    return c.json({ message: data });
  } catch (error) {
    console.log('Send message exception:', error);
    return c.json({ error: 'Failed to send message' }, 500);
  }
});

app.get('/make-server-5dec7914/messages/:conversationId/count', async (c) => {
  try {
    const user = await getAuthUser(c.req.raw);
    if (!user) return c.json({ error: 'Unauthorized' }, 401);
    
    const conversationId = c.req.param('conversationId');
    
    const { count, error } = await supabase
      .from('messages')
      .select('*', { count: 'exact', head: true })
      .eq('conversation_id', conversationId);
    
    if (error) {
      console.log('Count messages error:', error);
      return c.json({ error: error.message }, 400);
    }
    
    return c.json({ count });
  } catch (error) {
    console.log('Count messages exception:', error);
    return c.json({ error: 'Failed to count messages' }, 500);
  }
});

// Reviews routes
app.post('/make-server-5dec7914/reviews', async (c) => {
  try {
    const user = await getAuthUser(c.req.raw);
    if (!user) return c.json({ error: 'Unauthorized' }, 401);
    
    const { reviewee_id, conversation_id, rating, comment } = await c.req.json();
    
    const { data, error } = await supabase
      .from('reviews')
      .insert({
        reviewer_id: user.id,
        reviewee_id,
        conversation_id,
        rating,
        comment
      })
      .select()
      .single();
    
    if (error) {
      console.log('Create review error:', error);
      return c.json({ error: error.message }, 400);
    }
    
    return c.json({ review: data });
  } catch (error) {
    console.log('Create review exception:', error);
    return c.json({ error: 'Failed to create review' }, 500);
  }
});

app.get('/make-server-5dec7914/reviews/check', async (c) => {
  try {
    const user = await getAuthUser(c.req.raw);
    if (!user) return c.json({ error: 'Unauthorized' }, 401);
    
    const revieweeId = c.req.query('reviewee_id');
    const conversationId = c.req.query('conversation_id');
    
    const { data, error } = await supabase
      .from('reviews')
      .select('id')
      .eq('reviewer_id', user.id)
      .eq('reviewee_id', revieweeId)
      .eq('conversation_id', conversationId)
      .single();
    
    return c.json({ hasReviewed: !!data });
  } catch (error) {
    return c.json({ hasReviewed: false });
  }
});

app.get('/make-server-5dec7914/reviews/:userId', async (c) => {
  try {
    const userId = c.req.param('userId');
    
    const { data, error } = await supabase
      .from('reviews')
      .select(`
        *,
        reviewer:profiles!reviews_reviewer_id_fkey(id, name, avatar_url)
      `)
      .eq('reviewee_id', userId)
      .order('created_at', { ascending: false });
    
    if (error) {
      console.log('Fetch reviews error:', error);
      return c.json({ error: error.message }, 400);
    }
    
    return c.json({ reviews: data });
  } catch (error) {
    console.log('Fetch reviews exception:', error);
    return c.json({ error: 'Failed to fetch reviews' }, 500);
  }
});

// Reports routes
app.post('/make-server-5dec7914/reports', async (c) => {
  try {
    const user = await getAuthUser(c.req.raw);
    if (!user) return c.json({ error: 'Unauthorized' }, 401);
    
    const { listing_id, user_id, reason } = await c.req.json();
    
    const { data, error } = await supabase
      .from('reports')
      .insert({
        reporter_id: user.id,
        listing_id,
        user_id,
        reason
      })
      .select()
      .single();
    
    if (error) {
      console.log('Create report error:', error);
      return c.json({ error: error.message }, 400);
    }
    
    return c.json({ report: data });
  } catch (error) {
    console.log('Create report exception:', error);
    return c.json({ error: 'Failed to create report' }, 500);
  }
});

app.get('/make-server-5dec7914/reports', async (c) => {
  try {
    const user = await getAuthUser(c.req.raw);
    if (!user) return c.json({ error: 'Unauthorized' }, 401);
    
    // Check if user is admin
    const { data: profile } = await supabase
      .from('profiles')
      .select('is_admin')
      .eq('id', user.id)
      .single();
    
    if (!profile?.is_admin) {
      return c.json({ error: 'Forbidden' }, 403);
    }
    
    const status = c.req.query('status') || 'pending';
    const limit = parseInt(c.req.query('limit') || '1000');
    const offset = parseInt(c.req.query('offset') || '0');
    
    // Get total count
    const { count } = await supabase
      .from('reports')
      .select('*', { count: 'exact', head: true })
      .eq('status', status);
    
    const { data, error } = await supabase
      .from('reports')
      .select(`
        *,
        reporter:profiles!reports_reporter_id_fkey(id, name),
        listing:listings(id, title, user_id),
        reported_user:profiles!reports_user_id_fkey(id, name)
      `)
      .eq('status', status)
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1);
    
    if (error) {
      console.log('Fetch reports error:', error);
      return c.json({ error: error.message }, 400);
    }
    
    return c.json({ reports: data, total: count || 0 });
  } catch (error) {
    console.log('Fetch reports exception:', error);
    return c.json({ error: 'Failed to fetch reports' }, 500);
  }
});

app.put('/make-server-5dec7914/reports/:id', async (c) => {
  try {
    const user = await getAuthUser(c.req.raw);
    if (!user) return c.json({ error: 'Unauthorized' }, 401);
    
    // Check if user is admin
    const { data: profile } = await supabase
      .from('profiles')
      .select('is_admin')
      .eq('id', user.id)
      .single();
    
    if (!profile?.is_admin) {
      return c.json({ error: 'Forbidden' }, 403);
    }
    
    const id = c.req.param('id');
    const { status, admin_notes, restore_listing } = await c.req.json();
    
    const { data, error } = await supabase
      .from('reports')
      .update({
        status,
        admin_notes,
        resolved_at: new Date().toISOString(),
        resolved_by: user.id
      })
      .eq('id', id)
      .select()
      .single();
    
    if (error) {
      console.log('Update report error:', error);
      return c.json({ error: error.message }, 400);
    }
    
    // If restoring listing, update its status
    if (restore_listing && data.listing_id) {
      await supabase
        .from('listings')
        .update({ status: 'active' })
        .eq('id', data.listing_id);
    }
    
    return c.json({ report: data });
  } catch (error) {
    console.log('Update report exception:', error);
    return c.json({ error: 'Failed to update report' }, 500);
  }
});

// Admin analytics
app.get('/make-server-5dec7914/admin/analytics', async (c) => {
  try {
    const user = await getAuthUser(c.req.raw);
    if (!user) return c.json({ error: 'Unauthorized' }, 401);
    
    // Check if user is admin
    const { data: profile } = await supabase
      .from('profiles')
      .select('is_admin')
      .eq('id', user.id)
      .single();
    
    if (!profile?.is_admin) {
      return c.json({ error: 'Forbidden' }, 403);
    }
    
    // Get total users
    const { count: totalUsers } = await supabase
      .from('profiles')
      .select('*', { count: 'exact', head: true });
    
    // Get total listings
    const { count: totalListings } = await supabase
      .from('listings')
      .select('*', { count: 'exact', head: true });
    
    // Get active listings
    const { count: activeListings } = await supabase
      .from('listings')
      .select('*', { count: 'exact', head: true })
      .eq('status', 'active');
    
    // Get pending reports
    const { count: pendingReports } = await supabase
      .from('reports')
      .select('*', { count: 'exact', head: true })
      .eq('status', 'pending');
    
    // Get total messages
    const { count: totalMessages } = await supabase
      .from('messages')
      .select('*', { count: 'exact', head: true });
    
    // Get total reviews
    const { count: totalReviews } = await supabase
      .from('reviews')
      .select('*', { count: 'exact', head: true });
    
    // Get listings by category
    const { data: listingsByCategory } = await supabase
      .from('listings')
      .select('category_id, categories(name)')
      .eq('status', 'active');
    
    const categoryStats = listingsByCategory?.reduce((acc: any, item: any) => {
      const categoryName = item.categories?.name || 'Unknown';
      acc[categoryName] = (acc[categoryName] || 0) + 1;
      return acc;
    }, {});
    
    // Get category and subcategory counts
    const { data: categories } = await supabase
      .from('categories')
      .select('id, name')
      .order('sort_order', { ascending: true });
    
    const { data: subcategories } = await supabase
      .from('subcategories')
      .select('id, category_id');
    
    const categorySubcategoryCounts = categories?.map(cat => ({
      name: cat.name,
      subcategoryCount: subcategories?.filter(sub => sub.category_id === cat.id).length || 0
    }));
    
    return c.json({
      analytics: {
        totalUsers,
        totalListings,
        activeListings,
        pendingReports,
        totalMessages,
        totalReviews,
        categoryStats,
        categorySubcategoryCounts
      }
    });
  } catch (error) {
    console.log('Fetch analytics exception:', error);
    return c.json({ error: 'Failed to fetch analytics' }, 500);
  }
});

// Admin: Delete listing
app.delete('/make-server-5dec7914/admin/listings/:id', async (c) => {
  try {
    const user = await getAuthUser(c.req.raw);
    if (!user) return c.json({ error: 'Unauthorized' }, 401);
    
    // Check if user is admin
    const { data: profile } = await supabase
      .from('profiles')
      .select('is_admin')
      .eq('id', user.id)
      .single();
    
    if (!profile?.is_admin) {
      return c.json({ error: 'Forbidden - Admin access required' }, 403);
    }
    
    const listingId = c.req.param('id');
    
    // Delete the listing
    const { error } = await supabase
      .from('listings')
      .delete()
      .eq('id', listingId);
    
    if (error) {
      console.log('Delete listing error:', error);
      return c.json({ error: error.message }, 400);
    }
    
    return c.json({ message: 'Listing deleted successfully' });
  } catch (error) {
    console.log('Delete listing exception:', error);
    return c.json({ error: 'Failed to delete listing' }, 500);
  }
});

// Admin: Get all listings
app.get('/make-server-5dec7914/admin/listings', async (c) => {
  try {
    const user = await getAuthUser(c.req.raw);
    if (!user) return c.json({ error: 'Unauthorized' }, 401);
    
    // Check if user is admin
    const { data: profile } = await supabase
      .from('profiles')
      .select('is_admin')
      .eq('id', user.id)
      .single();
    
    if (!profile?.is_admin) {
      return c.json({ error: 'Forbidden - Admin access required' }, 403);
    }
    
    const filter = c.req.query('filter') || 'all';
    const sort = c.req.query('sort') || 'newest';
    const search = c.req.query('search') || '';
    const limit = parseInt(c.req.query('limit') || '1000');
    const offset = parseInt(c.req.query('offset') || '0');
    
    let query = supabase
      .from('listings')
      .select(`
        *,
        profiles!listings_user_id_fkey(id, name, avatar_url, email),
        categories(id, name, slug),
        subcategories(id, name, slug)
      `);
    
    // Apply filters
    if (filter === 'active') {
      query = query.eq('status', 'active');
    } else if (filter === 'archived') {
      query = query.eq('status', 'archived');
    } else if (filter === 'disabled') {
      query = query.eq('status', 'disabled');
    }
    
    // If search is provided, we need to fetch all data and filter manually
    // because we need to search across joined tables
    if (search) {
      // Apply sorting before fetching all
      if (sort === 'newest') {
        query = query.order('created_at', { ascending: false });
      } else if (sort === 'oldest') {
        query = query.order('created_at', { ascending: true });
      } else if (sort === 'price_high') {
        query = query.order('price', { ascending: false });
      } else if (sort === 'price_low') {
        query = query.order('price', { ascending: true });
      }
      
      // Fetch all data without pagination first
      const { data: allData, error: fetchError } = await query;
      
      if (fetchError) {
        console.log('Fetch admin listings error:', fetchError);
        return c.json({ error: fetchError.message }, 400);
      }
      
      // Filter by search term across all fields
      const searchLower = search.toLowerCase();
      const filteredData = allData?.filter((listing: any) => {
        return (
          listing.title?.toLowerCase().includes(searchLower) ||
          listing.description?.toLowerCase().includes(searchLower) ||
          listing.profiles?.name?.toLowerCase().includes(searchLower) ||
          listing.profiles?.email?.toLowerCase().includes(searchLower) ||
          listing.categories?.name?.toLowerCase().includes(searchLower) ||
          listing.subcategories?.name?.toLowerCase().includes(searchLower)
        );
      }) || [];
      
      const total = filteredData.length;
      const paginatedData = filteredData.slice(offset, offset + limit);
      
      return c.json({ listings: paginatedData, total });
    }
    
    // Apply sorting
    if (sort === 'newest') {
      query = query.order('created_at', { ascending: false });
    } else if (sort === 'oldest') {
      query = query.order('created_at', { ascending: true });
    } else if (sort === 'price_high') {
      query = query.order('price', { ascending: false });
    } else if (sort === 'price_low') {
      query = query.order('price', { ascending: true });
    }
    
    // Get total count
    let countQuery = supabase
      .from('listings')
      .select('*', { count: 'exact', head: true });
      
    if (filter === 'active') {
      countQuery = countQuery.eq('status', 'active');
    } else if (filter === 'archived') {
      countQuery = countQuery.eq('status', 'archived');
    } else if (filter === 'disabled') {
      countQuery = countQuery.eq('status', 'disabled');
    }
    
    const { count } = await countQuery;
    
    // Apply pagination
    query = query.range(offset, offset + limit - 1);
    
    const { data, error } = await query;
    
    if (error) {
      console.log('Fetch admin listings error:', error);
      return c.json({ error: error.message }, 400);
    }
    
    return c.json({ listings: data, total: count || 0 });
  } catch (error) {
    console.log('Fetch admin listings exception:', error);
    return c.json({ error: 'Failed to fetch listings' }, 500);
  }
});

// Admin: Disable/Ban listing
app.post('/make-server-5dec7914/admin/listings/:id/disable', async (c) => {
  try {
    const user = await getAuthUser(c.req.raw);
    if (!user) return c.json({ error: 'Unauthorized' }, 401);
    
    // Check if user is admin
    const { data: profile } = await supabase
      .from('profiles')
      .select('is_admin')
      .eq('id', user.id)
      .single();
    
    if (!profile?.is_admin) {
      return c.json({ error: 'Forbidden - Admin access required' }, 403);
    }
    
    const listingId = c.req.param('id');
    
    let reason = 'Disabled by admin';
    try {
      const body = await c.req.json();
      if (body.reason) reason = body.reason;
    } catch (e) {
      // Body parsing failed, use default reason
    }
    
    // Update listing status to disabled
    const { error } = await supabase
      .from('listings')
      .update({ 
        status: 'disabled'
      })
      .eq('id', listingId);
    
    if (error) {
      console.log('Disable listing error:', error);
      return c.json({ error: error.message }, 400);
    }
    
    return c.json({ message: 'Listing disabled successfully' });
  } catch (error) {
    console.log('Disable listing exception:', error);
    console.log('Error details:', JSON.stringify(error));
    return c.json({ error: 'Failed to disable listing', details: error instanceof Error ? error.message : String(error) }, 500);
  }
});

// Admin: Enable listing
app.post('/make-server-5dec7914/admin/listings/:id/enable', async (c) => {
  try {
    const user = await getAuthUser(c.req.raw);
    if (!user) return c.json({ error: 'Unauthorized' }, 401);
    
    // Check if user is admin
    const { data: profile } = await supabase
      .from('profiles')
      .select('is_admin')
      .eq('id', user.id)
      .single();
    
    if (!profile?.is_admin) {
      return c.json({ error: 'Forbidden - Admin access required' }, 403);
    }
    
    const listingId = c.req.param('id');
    
    // Update listing status to active
    const { error } = await supabase
      .from('listings')
      .update({ 
        status: 'active'
      })
      .eq('id', listingId);
    
    if (error) {
      console.log('Enable listing error:', error);
      return c.json({ error: error.message }, 400);
    }
    
    return c.json({ message: 'Listing enabled successfully' });
  } catch (error) {
    console.log('Enable listing exception:', error);
    console.log('Error details:', JSON.stringify(error));
    return c.json({ error: 'Failed to enable listing', details: error instanceof Error ? error.message : String(error) }, 500);
  }
});

// Admin: Update listing category
app.put('/make-server-5dec7914/admin/listings/:id/category', async (c) => {
  try {
    const user = await getAuthUser(c.req.raw);
    if (!user) return c.json({ error: 'Unauthorized' }, 401);
    
    // Check if user is admin
    const { data: profile } = await supabase
      .from('profiles')
      .select('is_admin')
      .eq('id', user.id)
      .single();
    
    if (!profile?.is_admin) {
      return c.json({ error: 'Forbidden - Admin access required' }, 403);
    }
    
    const listingId = c.req.param('id');
    const { category_id, subcategory_id } = await c.req.json();
    
    // Update listing category
    const { data, error } = await supabase
      .from('listings')
      .update({ 
        category_id,
        subcategory_id: subcategory_id || null
      })
      .eq('id', listingId)
      .select()
      .single();
    
    if (error) {
      console.log('Update listing category error:', error);
      return c.json({ error: error.message }, 400);
    }
    
    return c.json({ listing: data });
  } catch (error) {
    console.log('Update listing category exception:', error);
    return c.json({ error: 'Failed to update listing category' }, 500);
  }
});

// Admin: Ban user
app.post('/make-server-5dec7914/admin/users/:id/ban', async (c) => {
  try {
    const user = await getAuthUser(c.req.raw);
    if (!user) return c.json({ error: 'Unauthorized' }, 401);
    
    // Check if user is admin
    const { data: profile } = await supabase
      .from('profiles')
      .select('is_admin')
      .eq('id', user.id)
      .single();
    
    if (!profile?.is_admin) {
      return c.json({ error: 'Forbidden - Admin access required' }, 403);
    }
    
    const userId = c.req.param('id');
    const { reason } = await c.req.json();
    
    // Ban user by setting is_banned flag
    const { error } = await supabase
      .from('profiles')
      .update({ 
        is_banned: true,
        ban_reason: reason || 'Banned by admin',
        banned_at: new Date().toISOString()
      })
      .eq('id', userId);
    
    if (error) {
      console.log('Ban user error:', error);
      return c.json({ error: error.message }, 400);
    }
    
    // Also disable all user's active listings
    await supabase
      .from('listings')
      .update({ status: 'disabled' })
      .eq('user_id', userId)
      .eq('status', 'active');
    
    return c.json({ message: 'User banned successfully' });
  } catch (error) {
    console.log('Ban user exception:', error);
    return c.json({ error: 'Failed to ban user' }, 500);
  }
});

// Admin: Unban user
app.post('/make-server-5dec7914/admin/users/:id/unban', async (c) => {
  try {
    const user = await getAuthUser(c.req.raw);
    if (!user) return c.json({ error: 'Unauthorized' }, 401);
    
    // Check if user is admin
    const { data: profile } = await supabase
      .from('profiles')
      .select('is_admin')
      .eq('id', user.id)
      .single();
    
    if (!profile?.is_admin) {
      return c.json({ error: 'Forbidden - Admin access required' }, 403);
    }
    
    const userId = c.req.param('id');
    
    // Unban user
    const { error } = await supabase
      .from('profiles')
      .update({ 
        is_banned: false,
        ban_reason: null,
        banned_at: null
      })
      .eq('id', userId);
    
    if (error) {
      console.log('Unban user error:', error);
      return c.json({ error: error.message }, 400);
    }
    
    return c.json({ message: 'User unbanned successfully' });
  } catch (error) {
    console.log('Unban user exception:', error);
    return c.json({ error: 'Failed to unban user' }, 500);
  }
});

// Admin: Get all users
app.get('/make-server-5dec7914/admin/users', async (c) => {
  try {
    const user = await getAuthUser(c.req.raw);
    if (!user) return c.json({ error: 'Unauthorized' }, 401);
    
    // Check if user is admin
    const { data: profile } = await supabase
      .from('profiles')
      .select('is_admin')
      .eq('id', user.id)
      .single();
    
    if (!profile?.is_admin) {
      return c.json({ error: 'Forbidden - Admin access required' }, 403);
    }
    
    const filter = c.req.query('filter') || 'all';
    const search = c.req.query('search') || '';
    const limit = parseInt(c.req.query('limit') || '1000');
    const offset = parseInt(c.req.query('offset') || '0');
    
    let query = supabase
      .from('profiles')
      .select('*')
      .order('created_at', { ascending: false });
    
    if (filter === 'active') {
      query = query.or('is_banned.is.null,is_banned.eq.false');
    } else if (filter === 'banned') {
      query = query.eq('is_banned', true);
    }
    
    // Apply search filter
    if (search) {
      query = query.or(`name.ilike.%${search}%,email.ilike.%${search}%`);
    }
    
    // Get total count
    let countQuery = supabase
      .from('profiles')
      .select('*', { count: 'exact', head: true });
    
    if (filter === 'active') {
      countQuery = countQuery.or('is_banned.is.null,is_banned.eq.false');
    } else if (filter === 'banned') {
      countQuery = countQuery.eq('is_banned', true);
    }
    
    // Apply search to count query
    if (search) {
      countQuery = countQuery.or(`name.ilike.%${search}%,email.ilike.%${search}%`);
    }
    
    const { count } = await countQuery;
    
    // Apply pagination
    query = query.range(offset, offset + limit - 1);
    
    const { data, error } = await query;
    
    if (error) {
      console.log('Fetch users error:', error);
      return c.json({ error: error.message }, 400);
    }
    
    // For each user, get their listing count and report count
    const usersWithStats = await Promise.all(
      data.map(async (userData) => {
        const { count: listingCount } = await supabase
          .from('listings')
          .select('*', { count: 'exact', head: true })
          .eq('user_id', userData.id);
        
        const { count: reportCount } = await supabase
          .from('reports')
          .select('*', { count: 'exact', head: true })
          .eq('user_id', userData.id);
        
        return {
          ...userData,
          listing_count: listingCount || 0,
          report_count: reportCount || 0
        };
      })
    );
    
    return c.json({ users: usersWithStats, total: count || 0 });
  } catch (error) {
    console.log('Fetch users exception:', error);
    return c.json({ error: 'Failed to fetch users' }, 500);
  }
});

// Profile routes
app.get('/make-server-5dec7914/profile/:id', async (c) => {
  try {
    const id = c.req.param('id');
    
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', id)
      .single();
    
    if (error) {
      console.log('Fetch profile error:', error);
      return c.json({ error: error.message }, 400);
    }
    
    return c.json({ profile: data });
  } catch (error) {
    console.log('Fetch profile exception:', error);
    return c.json({ error: 'Failed to fetch profile' }, 500);
  }
});

app.get('/make-server-5dec7914/profile', async (c) => {
  try {
    const user = await getAuthUser(c.req.raw);
    if (!user) return c.json({ error: 'Unauthorized' }, 401);
    
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', user.id)
      .single();
    
    if (error) {
      console.log('Fetch own profile error:', error);
      
      // If profile doesn't exist, create it
      if (error.code === 'PGRST116') {
        console.log('Profile not found, creating new profile for user:', user.id);
        const { data: newProfile, error: insertError } = await supabase
          .from('profiles')
          .insert({
            id: user.id,
            email: user.email,
            name: user.user_metadata?.name || user.email?.split('@')[0] || 'User',
            is_admin: user.user_metadata?.is_admin === true
          })
          .select()
          .single();
        
        if (insertError) {
          console.log('Failed to create profile:', insertError);
          return c.json({ error: 'Failed to create profile' }, 500);
        }
        
        return c.json({ profile: newProfile });
      }
      
      return c.json({ error: error.message }, 400);
    }
    
    return c.json({ profile: data });
  } catch (error) {
    console.log('Fetch own profile exception:', error);
    return c.json({ error: 'Failed to fetch profile' }, 500);
  }
});

app.put('/make-server-5dec7914/profile', async (c) => {
  try {
    const user = await getAuthUser(c.req.raw);
    if (!user) return c.json({ error: 'Unauthorized' }, 401);
    
    const { name, city, zipcode, avatar_url } = await c.req.json();
    
    if (!name || !name.trim()) {
      return c.json({ error: 'Name is required' }, 400);
    }
    
    // Get user's current profile to check if they are admin
    const { data: userProfile } = await supabase
      .from('profiles')
      .select('is_admin')
      .eq('id', user.id)
      .single();
    
    // Prevent non-admins from using "Admin" or related names
    if (!userProfile?.is_admin) {
      const nameLower = name.toLowerCase().trim();
      const restrictedNames = ['admin', 'administrator', 'moderator', 'support', 'system'];
      const containsRestricted = restrictedNames.some(restricted => nameLower.includes(restricted));
      
      if (containsRestricted) {
        return c.json({ error: 'This name is reserved and cannot be used. Please choose a different name.' }, 400);
      }
    }
    
    const { data, error } = await supabase
      .from('profiles')
      .update({
        name: name.trim(),
        city: city || null,
        zipcode: zipcode || null,
        avatar_url: avatar_url || null
      })
      .eq('id', user.id)
      .select()
      .single();
    
    if (error) {
      console.log('Update profile error:', error);
      return c.json({ error: error.message }, 400);
    }
    
    return c.json({ profile: data });
  } catch (error) {
    console.log('Update profile exception:', error);
    return c.json({ error: 'Failed to update profile' }, 500);
  }
});

// Upload image endpoint
app.post('/make-server-5dec7914/upload-image', async (c) => {
  try {
    const user = await getAuthUser(c.req.raw);
    if (!user) return c.json({ error: 'Unauthorized' }, 401);

    const formData = await c.req.formData();
    const file = formData.get('file') as File;
    
    if (!file) {
      return c.json({ error: 'No file provided' }, 400);
    }

    // Validate file type
    const validTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp'];
    if (!validTypes.includes(file.type)) {
      return c.json({ error: 'Invalid file type. Only images are allowed.' }, 400);
    }

    // Validate file size (5MB max)
    if (file.size > 5 * 1024 * 1024) {
      return c.json({ error: 'File size must be less than 5MB' }, 400);
    }

    // Convert File to ArrayBuffer for upload
    const arrayBuffer = await file.arrayBuffer();
    
    console.log(`Uploading image: ${file.name}, size: ${file.size} bytes, type: ${file.type}`);

    // Generate unique filename preserving the original extension
    const extension = file.name.split('.').pop() || 'jpg';
    const fileName = `${user.id}/${Date.now()}-${Math.random().toString(36).substring(7)}.${extension}`;

    // Upload to Supabase Storage
    const { data, error } = await supabase.storage
      .from(BUCKET_NAME)
      .upload(fileName, arrayBuffer, {
        contentType: file.type,
        upsert: false
      });

    if (error) {
      console.log('Storage upload error:', error);
      return c.json({ error: 'Failed to upload image' }, 500);
    }

    // Get public URL (bucket is public, so no signed URL needed)
    const { data: publicUrlData } = supabase.storage
      .from(BUCKET_NAME)
      .getPublicUrl(fileName);

    if (!publicUrlData?.publicUrl) {
      return c.json({ error: 'Failed to get image URL' }, 500);
    }

    console.log(`Image uploaded successfully: ${fileName}`);
    return c.json({ url: publicUrlData.publicUrl });
  } catch (error) {
    console.log('Upload image exception:', error);
    return c.json({ error: 'Failed to upload image' }, 500);
  }
});

Deno.serve(app.fetch);