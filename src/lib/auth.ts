/**
 * Authentication and Organization Helpers
 * 
 * This module provides server-side utilities for working with Clerk authentication
 * and organization management. All functions are designed to work in Next.js App Router
 * server components, API routes, and middleware.
 */

import { auth, currentUser } from '@clerk/nextjs/server';

/**
 * Get the current authenticated Clerk user
 * 
 * @returns The current user object, or null if not authenticated
 * @throws Error if there's an issue fetching the user
 */
export async function getClerkUser() {
  try {
    const user = await currentUser();
    return user;
  } catch (error) {
    console.error('Error fetching Clerk user:', error);
    return null;
  }
}

/**
 * Get the user's active organization ID
 * 
 * @returns The active organization ID, or null if user has no org
 */
export async function getActiveOrg() {
  try {
    const { orgId } = await auth();
    return orgId;
  } catch (error) {
    console.error('Error fetching active organization:', error);
    return null;
  }
}

/**
 * Require authentication - throws error if user is not authenticated
 * 
 * @returns The authenticated user's ID
 * @throws Error if user is not authenticated
 */
export async function requireAuth() {
  const { userId } = await auth();
  
  if (!userId) {
    throw new Error('Authentication required');
  }
  
  return userId;
}

/**
 * Require organization membership - throws error if user is not in an org
 * 
 * @returns The user's active organization ID
 * @throws Error if user is not in an organization
 */
export async function requireOrg() {
  const { orgId } = await auth();
  
  if (!orgId) {
    throw new Error('Organization membership required');
  }
  
  return orgId;
}

/**
 * Check if user has completed onboarding (is in an organization)
 * 
 * @returns true if user is in an organization, false otherwise
 */
export async function hasCompletedOnboarding() {
  const orgId = await getActiveOrg();
  return orgId !== null;
}

/**
 * Require admin role in organization - throws error if user is not an admin
 * 
 * This function checks if the user has the "admin" role in their active organization.
 * It requires both authentication and organization membership.
 * 
 * @returns Object containing userId and orgId if user is an admin
 * @throws Error if user is not authenticated, not in an org, or not an admin
 */
export async function requireAdmin() {
  const { userId, orgId, orgRole } = await auth();
  
  // Check authentication
  if (!userId) {
    throw new Error('Authentication required');
  }
  
  // Check organization membership
  if (!orgId) {
    throw new Error('Organization membership required');
  }
  
  // Check admin role
  if (orgRole !== 'org:admin') {
    throw new Error('Admin role required');
  }
  
  return { userId, orgId, orgRole };
}
