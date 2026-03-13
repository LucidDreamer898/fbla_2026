import { clerkMiddleware, createRouteMatcher } from '@clerk/nextjs/server';
import { NextResponse } from 'next/server';

/**
 * Middleware for Authentication and Onboarding Enforcement
 * 
 * This middleware:
 * 1. Allows public routes (homepage, sign-in, sign-up, API routes)
 * 2. Redirects unauthenticated users to sign-in
 * 3. Redirects authenticated users without an organization to onboarding
 * 4. Protects /admin route - requires admin role in organization
 * 5. Allows users with organizations to access all other protected routes
 */

// Define public routes that don't require authentication
const isPublicRoute = createRouteMatcher([
  '/',
  '/sign-in(.*)',
  '/sign-up(.*)',
  '/api(.*)',
]);

// Define onboarding route (accessible to authenticated users without org)
const isOnboardingRoute = createRouteMatcher([
  '/onboarding(.*)',
]);

// Define admin routes that require admin role
const isAdminRoute = createRouteMatcher([
  '/admin(.*)',
]);

// Define unauthorized route (accessible without admin role)
const isUnauthorizedRoute = createRouteMatcher([
  '/admin/unauthorized(.*)',
]);

export default clerkMiddleware(async (auth, request) => {
  // Check authentication status first
  const { userId, orgId, orgRole } = await auth();
  
  // If not authenticated, allow public routes to pass through
  if (!userId) {
    if (isPublicRoute(request)) {
      return NextResponse.next();
    }
    // Otherwise redirect to sign-in
    const signInUrl = new URL('/sign-in', request.url);
    return NextResponse.redirect(signInUrl);
  }

  // If authenticated but no organization, redirect to onboarding
  // (unless already on onboarding page, sign-in, sign-up, or API routes)
  if (!orgId) {
    // Allow access to onboarding, sign-in, sign-up, and API routes
    if (isOnboardingRoute(request) || 
        request.nextUrl.pathname.startsWith('/sign-in') || 
        request.nextUrl.pathname.startsWith('/sign-up') ||
        request.nextUrl.pathname.startsWith('/api')) {
      return NextResponse.next();
    }
    // Redirect to onboarding for all other routes (including homepage)
    const onboardingUrl = new URL('/onboarding', request.url);
    return NextResponse.redirect(onboardingUrl);
  }

  // Check admin route protection (exclude unauthorized page)
  if (isAdminRoute(request) && !isUnauthorizedRoute(request)) {
    // Require admin role
    if (orgRole !== 'org:admin') {
      const unauthorizedUrl = new URL('/admin/unauthorized', request.url);
      return NextResponse.redirect(unauthorizedUrl);
    }
  }

  // User is authenticated and has an organization - allow access
  return NextResponse.next();
});

export const config = {
  matcher: [
    // Skip Next.js internals and all static files, unless found in search params
    '/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)',
    // Always run for API routes
    '/(api|trpc)(.*)',
  ],
};
