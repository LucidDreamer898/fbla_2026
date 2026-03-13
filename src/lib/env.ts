/**
 * Environment Variable Validation
 * 
 * This module validates required environment variables at runtime
 * and provides type-safe access to them. It ensures that:
 * - All required variables are present
 * - Server-only variables are never exposed to the client
 * - Clear error messages are shown if variables are missing
 */

/**
 * Client-side environment variables (safe to expose)
 * These are prefixed with NEXT_PUBLIC_ and will be bundled with the client code
 */
export const env = {
  /**
   * Supabase project URL
   * Example: https://xxxxx.supabase.co
   */
  get NEXT_PUBLIC_SUPABASE_URL(): string {
    const value = process.env.NEXT_PUBLIC_SUPABASE_URL;
    if (!value) {
      throw new Error(
        'Missing required environment variable: NEXT_PUBLIC_SUPABASE_URL\n' +
        'Please add it to your .env.local file or Vercel environment variables.\n' +
        'Get it from: Supabase Dashboard → Settings → API → Project URL'
      );
    }
    return value;
  },

  /**
   * Supabase anonymous/public key
   * This key is safe to expose to the client
   */
  get NEXT_PUBLIC_SUPABASE_ANON_KEY(): string {
    const value = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
    if (!value) {
      throw new Error(
        'Missing required environment variable: NEXT_PUBLIC_SUPABASE_ANON_KEY\n' +
        'Please add it to your .env.local file or Vercel environment variables.\n' +
        'Get it from: Supabase Dashboard → Settings → API → anon/public key'
      );
    }
    return value;
  },
} as const;

/**
 * Server-side environment variables (never exposed to client)
 * These should only be accessed in:
 * - API routes (app/api/**)
 * - Server Components
 * - Server Actions
 * - Middleware
 */
export const serverEnv = {
  /**
   * Supabase service role key
   * ⚠️ WARNING: This key has admin privileges. Never expose it to the client!
   * Only use in server-side code (API routes, server components, etc.)
   */
  get SUPABASE_SERVICE_ROLE_KEY(): string {
    // Prevent access on the client side
    if (typeof window !== 'undefined') {
      throw new Error(
        'SUPABASE_SERVICE_ROLE_KEY cannot be accessed on the client side.\n' +
        'This is a server-only environment variable for security reasons.'
      );
    }

    const value = process.env.SUPABASE_SERVICE_ROLE_KEY;
    if (!value) {
      throw new Error(
        'Missing required server environment variable: SUPABASE_SERVICE_ROLE_KEY\n' +
        'Please add it to your .env.local file or Vercel environment variables.\n' +
        'Get it from: Supabase Dashboard → Settings → API → service_role key\n' +
        '⚠️ This key has admin privileges - keep it secret!'
      );
    }
    return value;
  },
} as const;

/**
 * Validate all required environment variables on module load
 * This will throw an error immediately if any are missing
 */
export function validateEnv(): void {
  try {
    // Validate client-side variables
    env.NEXT_PUBLIC_SUPABASE_URL;
    env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

    // Validate server-side variables (only if running on server)
    if (typeof window === 'undefined') {
      serverEnv.SUPABASE_SERVICE_ROLE_KEY;
    }
  } catch (error) {
    if (error instanceof Error) {
      console.error('❌ Environment variable validation failed:');
      console.error(error.message);
      console.error('\n📖 See docs/SETUP_SUPABASE.md for setup instructions.');
    }
    throw error;
  }
}

// Auto-validate on module import (server-side only)
// This ensures we catch missing variables early
if (typeof window === 'undefined') {
  try {
    validateEnv();
  } catch (error) {
    // Error already logged by validateEnv()
    // Don't throw here to allow graceful handling in development
    if (process.env.NODE_ENV === 'production') {
      throw error;
    }
  }
}
