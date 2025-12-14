import { createClient } from 'npm:@supabase/supabase-js@2';

const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
const supabase = createClient(supabaseUrl, supabaseServiceKey);

// Interaction weights
export const INTERACTION_WEIGHTS = {
  view: 1,
  search: 3,
  message: 5,
  favorite: 7,
  offer: 10,
  create: 15,
};

// Track a user interaction
export async function trackInteraction(
  userId: string,
  category: string,
  interactionType: keyof typeof INTERACTION_WEIGHTS,
  listingId?: string
) {
  try {
    const weight = INTERACTION_WEIGHTS[interactionType];

    // Insert interaction record
    const { error: insertError } = await supabase
      .from('user_interactions')
      .insert({
        user_id: userId,
        listing_id: listingId || null,
        category,
        interaction_type: interactionType,
        weight,
      });

    if (insertError) {
      console.error('Error tracking interaction:', insertError);
      return { success: false, error: insertError };
    }

    // Update aggregated interests
    await updateUserInterests(userId, category, weight);

    return { success: true };
  } catch (error) {
    console.error('Error in trackInteraction:', error);
    return { success: false, error };
  }
}

// Update aggregated user interests
async function updateUserInterests(userId: string, category: string, weight: number) {
  try {
    // Check if interest exists
    const { data: existing } = await supabase
      .from('user_interests')
      .select('*')
      .eq('user_id', userId)
      .eq('category', category)
      .single();

    if (existing) {
      // Update existing
      await supabase
        .from('user_interests')
        .update({
          score: existing.score + weight,
          last_updated: new Date().toISOString(),
        })
        .eq('id', existing.id);
    } else {
      // Create new
      await supabase
        .from('user_interests')
        .insert({
          user_id: userId,
          category,
          score: weight,
        });
    }
  } catch (error) {
    console.error('Error updating user interests:', error);
  }
}

// Get user's top interests
export async function getUserInterests(userId: string) {
  try {
    const { data, error } = await supabase
      .from('user_interests')
      .select('*')
      .eq('user_id', userId)
      .order('score', { ascending: false });

    if (error) {
      console.error('Error getting user interests:', error);
      return [];
    }

    return data || [];
  } catch (error) {
    console.error('Error in getUserInterests:', error);
    return [];
  }
}

// Get total interaction count for user
export async function getTotalInteractionCount(userId: string) {
  try {
    const { count, error } = await supabase
      .from('user_interactions')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', userId);

    if (error) {
      console.error('Error getting interaction count:', error);
      return 0;
    }

    return count || 0;
  } catch (error) {
    console.error('Error in getTotalInteractionCount:', error);
    return 0;
  }
}

// Reset user personalization data
export async function resetUserPersonalization(userId: string) {
  try {
    // Delete all interactions
    const { error: interactionsError } = await supabase
      .from('user_interactions')
      .delete()
      .eq('user_id', userId);

    if (interactionsError) {
      console.error('Error deleting interactions:', interactionsError);
      return { success: false, error: interactionsError };
    }

    // Delete all interests
    const { error: interestsError } = await supabase
      .from('user_interests')
      .delete()
      .eq('user_id', userId);

    if (interestsError) {
      console.error('Error deleting interests:', interestsError);
      return { success: false, error: interestsError };
    }

    return { success: true };
  } catch (error) {
    console.error('Error in resetUserPersonalization:', error);
    return { success: false, error };
  }
}

// Get personalized listing IDs (90% top interest, 10% discovery)
export async function getPersonalizedListingOrder(
  userId: string,
  allListingIds: string[]
): Promise<string[]> {
  try {
    // Check if user has at least 5 interactions
    const interactionCount = await getTotalInteractionCount(userId);
    if (interactionCount < 5) {
      // Not enough data, return random order
      return shuffleArray(allListingIds);
    }

    // Get user's top interest
    const interests = await getUserInterests(userId);
    if (interests.length === 0) {
      return shuffleArray(allListingIds);
    }

    const topCategory = interests[0].category;

    // Get all listings data to filter by category
    const { data: listings, error } = await supabase
      .from('listings')
      .select('id, category')
      .in('id', allListingIds);

    if (error || !listings) {
      return shuffleArray(allListingIds);
    }

    // Separate into top category and others
    const topCategoryListings = listings.filter(l => l.category === topCategory);
    const otherListings = listings.filter(l => l.category !== topCategory);

    // Calculate 90/10 split
    const totalCount = Math.min(allListingIds.length, 20); // Show up to 20 listings
    const topCategoryCount = Math.floor(totalCount * 0.9);
    const discoveryCount = totalCount - topCategoryCount;

    // Get random selections
    const selectedTopCategory = shuffleArray(topCategoryListings.map(l => l.id)).slice(0, topCategoryCount);
    const selectedDiscovery = shuffleArray(otherListings.map(l => l.id)).slice(0, discoveryCount);

    // Combine and shuffle to randomize positions
    const personalizedOrder = shuffleArray([...selectedTopCategory, ...selectedDiscovery]);

    return personalizedOrder;
  } catch (error) {
    console.error('Error in getPersonalizedListingOrder:', error);
    return shuffleArray(allListingIds);
  }
}

// Shuffle array helper
function shuffleArray<T>(array: T[]): T[] {
  const shuffled = [...array];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled;
}
