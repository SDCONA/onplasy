// Check if user has already reviewed another user (regardless of conversation)
export async function checkIfUserHasReviewed(supabase: any, reviewerId: string, revieweeId: string): Promise<boolean> {
  try {
    const { data } = await supabase
      .from('reviews')
      .select('id')
      .eq('reviewer_id', reviewerId)
      .eq('reviewee_id', revieweeId)
      .limit(1);
    
    return data && data.length > 0;
  } catch (error) {
    console.log('Check review error:', error);
    return false;
  }
}
