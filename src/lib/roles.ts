/**
 * Role Management Utilities
 * 
 * Helper functions for checking user roles and permissions
 */

import { auth } from '@clerk/nextjs/server';

/**
 * Check if the current user has admin role
 * 
 * @returns true if user is an admin, false otherwise
 */
export async function isAdmin(): Promise<boolean> {
  try {
    const { orgRole } = await auth();
    return orgRole === 'org:admin';
  } catch {
    return false;
  }
}

/**
 * Check if the current user has student/member role
 * 
 * @returns true if user is a student/member, false otherwise
 */
export async function isStudent(): Promise<boolean> {
  try {
    const { orgRole } = await auth();
    return orgRole === 'org:member';
  } catch {
    return false;
  }
}

/**
 * Get the current user's role in their active organization
 * 
 * @returns 'org:admin' | 'org:member' | null
 */
export async function getUserRole(): Promise<'org:admin' | 'org:member' | null> {
  try {
    const { orgRole } = await auth();
    if (orgRole === 'org:admin' || orgRole === 'org:member') {
      return orgRole;
    }
    return null;
  } catch {
    return null;
  }
}
