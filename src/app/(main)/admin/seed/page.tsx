/**
 * Admin Seed Page
 * 
 * This page automatically seeds filler items for all schools that don't have items yet.
 * It's idempotent and can be visited multiple times safely.
 * 
 * This page is automatically called once to ensure all schools have filler items.
 */

'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';

export default function SeedPage() {
  const router = useRouter();
  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading');
  const [message, setMessage] = useState('Seeding filler items...');

  useEffect(() => {
    const seedItems = async () => {
      try {
        const response = await fetch('/api/seed-filler-items');
        const data = await response.json();

        if (data.success) {
          setStatus('success');
          setMessage(`Successfully seeded ${data.totalSeeded} items across ${data.results.length} schools.`);
          
          // Redirect to admin panel after 2 seconds
          setTimeout(() => {
            router.push('/admin');
          }, 2000);
        } else {
          setStatus('error');
          setMessage(data.error || 'Failed to seed items');
        }
      } catch (error: any) {
        setStatus('error');
        setMessage(error.message || 'Failed to seed items');
      }
    };

    seedItems();
  }, [router]);

  return (
    <div className="min-h-screen bg-black text-white flex items-center justify-center">
      <div className="text-center max-w-md">
        {status === 'loading' && (
          <>
            <div className="w-16 h-16 border-2 border-purple-500 border-t-transparent rounded-full animate-spin mx-auto mb-6"></div>
            <p className="text-lg text-gray-300">{message}</p>
          </>
        )}
        {status === 'success' && (
          <>
            <div className="w-16 h-16 bg-green-500 rounded-full flex items-center justify-center mx-auto mb-6">
              <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <p className="text-lg text-green-300 mb-4">{message}</p>
            <p className="text-sm text-gray-400">Redirecting to admin panel...</p>
          </>
        )}
        {status === 'error' && (
          <>
            <div className="w-16 h-16 bg-red-500 rounded-full flex items-center justify-center mx-auto mb-6">
              <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </div>
            <p className="text-lg text-red-300 mb-4">{message}</p>
            <button
              onClick={() => router.push('/admin')}
              className="px-6 py-3 bg-purple-500 hover:bg-purple-600 text-white rounded-lg transition-all"
            >
              Go to Admin Panel
            </button>
          </>
        )}
      </div>
    </div>
  );
}
