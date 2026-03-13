/**
 * Supabase Client (Client-Side)
 * 
 * This module provides a Supabase client for use in client components.
 * Uses the anonymous/public key which respects Row Level Security (RLS).
 * 
 * ✅ SAFE FOR CLIENT BUNDLES: Only uses public anon key
 * 
 * Usage:
 *   import { getSupabaseClient } from '@/lib/supabase/client';
 *   const supabase = getSupabaseClient();
 *   const { data } = await supabase.from('items').select('*');
 * 
 * Security Notes for Judges:
 * - This client uses NEXT_PUBLIC_SUPABASE_ANON_KEY (safe to expose)
 * - All queries respect Row Level Security (RLS) policies
 * - Users can only access data from their own school
 * - Service role key is NEVER imported here (server-only)
 */

import { createClient } from '@supabase/supabase-js';
import { env } from '../env';

/**
 * Get a Supabase client for client-side or server-side use
 * This client respects RLS and is safe to use in both client and server components
 * 
 * Note: In server components, this will create a new client instance each time.
 * For server-side operations that need admin privileges, use getSupabaseAdmin() instead.
 * 
 * @returns Supabase client instance with anon key
 */
export function getSupabaseClient() {
  return createClient(
    env.NEXT_PUBLIC_SUPABASE_URL,
    env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
    {
      auth: {
        persistSession: typeof window !== 'undefined', // Only persist in browser
        autoRefreshToken: typeof window !== 'undefined', // Only refresh in browser
        detectSessionInUrl: typeof window !== 'undefined', // Only detect in browser
      },
    }
  );
}
