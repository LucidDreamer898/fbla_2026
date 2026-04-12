'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth, useOrganization } from '@clerk/nextjs';

/**
 * Warms the Next.js client cache for main app routes after auth is known,
 * so navigations feel instant (RSC payloads + JS chunks already fetched).
 */
export function RoutePrefetcher() {
  const router = useRouter();
  const { isLoaded, userId, orgId } = useAuth();
  const { membership, isLoaded: orgLoaded } = useOrganization();

  useEffect(() => {
    if (!isLoaded) return;

    const prefetchAll = () => {
      if (!userId) {
        router.prefetch('/sign-in');
        router.prefetch('/sign-up');
        return;
      }

      if (!orgId) {
        router.prefetch('/onboarding');
        return;
      }

      const routes = ['/', '/items', '/report', '/sources'] as const;
      for (const href of routes) {
        router.prefetch(href);
      }

      if (orgLoaded && membership?.role === 'org:admin') {
        router.prefetch('/admin');
        router.prefetch('/admin/unauthorized');
      }
    };

    const run = () => {
      prefetchAll();
    };

    let cancelScheduled: (() => void) | undefined;
    if (typeof window.requestIdleCallback === 'function') {
      const id = window.requestIdleCallback(run, { timeout: 2500 });
      cancelScheduled = () => window.cancelIdleCallback(id);
    } else {
      const id = window.setTimeout(run, 0);
      cancelScheduled = () => clearTimeout(id);
    }

    return () => {
      cancelScheduled?.();
    };
  }, [isLoaded, userId, orgId, orgLoaded, membership?.role, router]);

  return null;
}
