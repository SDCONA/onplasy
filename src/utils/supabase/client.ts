import { createClient } from '@supabase/supabase-js';
import { projectId, publicAnonKey } from './info';

// Create a singleton Supabase client instance
// This prevents multiple instances which can cause auth state conflicts
let supabaseInstance: ReturnType<typeof createClient> | null = null;

export const getSupabaseClient = () => {
  if (!supabaseInstance) {
    supabaseInstance = createClient(
      `https://${projectId}.supabase.co`,
      publicAnonKey,
      {
        auth: {
          persistSession: true,
          autoRefreshToken: true,
          detectSessionInUrl: true,
          // Suppress refresh token errors to console
          debug: false,
          // Set the redirect URL for email confirmations
          flowType: 'pkce',
        }
      }
    );
    
    // Suppress error logs for invalid refresh tokens
    supabaseInstance.auth.onAuthStateChange((event, session) => {
      // Don't log errors - let the app handle them gracefully
    });
  }
  return supabaseInstance;
};

// Export as default for convenience
export const supabase = getSupabaseClient();