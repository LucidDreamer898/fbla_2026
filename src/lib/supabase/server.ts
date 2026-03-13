/**
 * Supabase Server Client
 * 
 * This module provides a server-side Supabase client with admin privileges.
 * Uses the service role key for operations that bypass RLS.
 * 
 * ⚠️ WARNING: Never import this in client-side code!
 */

import { createClient } from '@supabase/supabase-js';
import { env, serverEnv } from '../env';

/**
 * Get a Supabase client with service role key (admin privileges)
 * This client bypasses RLS and should only be used server-side
 */
export function getSupabaseAdmin() {
  if (typeof window !== 'undefined') {
    throw new Error('getSupabaseAdmin() can only be called server-side');
  }

  return createClient(env.NEXT_PUBLIC_SUPABASE_URL, serverEnv.SUPABASE_SERVICE_ROLE_KEY, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });
}

/**
 * Get a Supabase client with anon key (respects RLS)
 * Use this for operations that should respect Row Level Security
 */
export function getSupabaseAnon() {
  if (typeof window !== 'undefined') {
    throw new Error('getSupabaseAnon() can only be called server-side');
  }

  return createClient(env.NEXT_PUBLIC_SUPABASE_URL, env.NEXT_PUBLIC_SUPABASE_ANON_KEY, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });
}
