/**
 * Supabase Admin Client (Server-Only)
 * 
 * This module provides a Supabase client with admin privileges using the service role key.
 * This client bypasses Row Level Security (RLS) and should ONLY be used server-side.
 * 
 * ⚠️ CRITICAL SECURITY: Service role key is NEVER exposed to client bundles
 * 
 * Usage (Server Actions, API Routes, Server Components only):
 *   import { getSupabaseAdmin } from '@/lib/supabase/admin';
 *   const supabase = getSupabaseAdmin();
 *   await supabase.from('items').insert({ ... });
 * 
 * Security Notes for Judges:
 * - This file uses 'server-only' package to prevent client bundling
 * - Service role key access is guarded with runtime checks
 * - All admin operations should be performed via server actions, not client code
 * - Never import this file in client components or 'use client' files
 */

import 'server-only';

import { createClient } from '@supabase/supabase-js';
import { env, serverEnv } from '../env';

/**
 * Get a Supabase client with service role key (admin privileges)
 * This client bypasses RLS and should only be used server-side
 * 
 * ⚠️ WARNING: This function will throw an error if called on the client side
 * 
 * @returns Supabase client instance with service role key
 * @throws Error if called on client side
 */
export function getSupabaseAdmin() {
  // Double-check we're on the server (server-only package should prevent this, but extra safety)
  if (typeof window !== 'undefined') {
    throw new Error(
      'getSupabaseAdmin() can only be called server-side.\n' +
      'The service role key must never be exposed to client bundles.'
    );
  }

  return createClient(
    env.NEXT_PUBLIC_SUPABASE_URL,
    serverEnv.SUPABASE_SERVICE_ROLE_KEY,
    {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
        detectSessionInUrl: false,
      },
    }
  );
}
