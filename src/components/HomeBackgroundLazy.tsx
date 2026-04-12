'use client';

import dynamic from 'next/dynamic';

const BackgroundAnimation = dynamic(() => import('@/components/BackgroundAnimation'), {
  ssr: false,
  loading: () => null,
});

export function HomeBackgroundLazy() {
  return <BackgroundAnimation />;
}
