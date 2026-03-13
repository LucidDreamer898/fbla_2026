'use client';

import { UserButton, useUser } from '@clerk/nextjs';
import { Button } from '@/components/ui/Button';
import Link from 'next/link';

export function AuthButtons() {
  const { isSignedIn } = useUser();

  return (
    <div className="flex items-center fixed right-4 top-4 z-10 md:right-8 md:top-4 gap-3 md:gap-6">
      {isSignedIn ? (
        <UserButton 
          appearance={{
            elements: {
              avatarBox: 'w-8 h-8 md:w-10 md:h-10',
            },
          }}
        />
      ) : (
        <Button
          variant="solid"
          size="sm"
          asChild
          className="text-sm md:text-base"
        >
          <Link href="/sign-in">Sign In</Link>
        </Button>
      )}
    </div>
  );
}
