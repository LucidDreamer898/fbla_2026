'use client';

import Link from 'next/link';
import { useOrganization } from '@clerk/nextjs';

/**
 * Navigation Links Component
 * 
 * This component conditionally renders navigation links based on user authentication
 * and organization role. The Admin link only appears for users with admin role.
 */
export function NavigationLinks() {
  const { organization, membership, isLoaded } = useOrganization();
  
  // Check if user has admin role
  // The role is on the membership, not the organization
  const isAdmin = membership?.role === 'org:admin';

  return (
    <div className="hidden items-center md:flex z-20 md:ml-12 lg:ml-16 md:gap-6 lg:gap-8 md:mr-auto">
      <Link
        href="/"
        className="text-foreground hover:text-primary focus-visible:ring-primary rounded-lg px-2 py-1 text-base md:text-lg transition-colors focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:outline-none"
      >
        Home
      </Link>
      <Link
        href="/items"
        className="text-foreground hover:text-primary focus-visible:ring-primary rounded-lg px-2 py-1 text-base md:text-lg transition-colors focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:outline-none"
      >
        Browse
      </Link>
      <Link
        href="/report"
        className="text-foreground hover:text-primary focus-visible:ring-primary rounded-lg px-2 py-1 text-base md:text-lg transition-colors focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:outline-none"
      >
        Report
      </Link>
      {/* Only show Admin link if user has admin role */}
      {isLoaded && isAdmin && (
        <Link
          href="/admin"
          className="text-foreground hover:text-primary focus-visible:ring-primary rounded-lg px-2 py-1 text-base md:text-lg transition-colors focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:outline-none"
        >
          Admin
        </Link>
      )}
    </div>
  );
}
