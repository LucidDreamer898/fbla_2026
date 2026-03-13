import Link from 'next/link';
import { Button } from '@/components/ui/Button';
import { AuthButtons } from '@/components/auth/AuthButtons';
import { NavigationLinks } from '@/components/navigation/NavigationLinks';

export default function MainLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <div className="bg-background min-h-screen">
      {/* Skip to content link for accessibility */}
      <a href="#main-content" className="skip-to-content">
        Skip to main content
      </a>

      {/* Navigation */}
      <nav className="bg-background/95 supports-[backdrop-filter]:bg-background/60 backdrop-blur">
        <div className="container mx-auto px-4 sm:px-6 md:px-8">
          <div className="flex h-16 items-center justify-between relative">
            {/* Logo */}
            <div className="flex items-center fixed left-4 top-4 z-10 md:left-8 md:top-4">
              <Link
                href="/"
                className="text-foreground hover:text-primary focus-visible:ring-primary rounded-lg text-xl sm:text-2xl font-bold transition-colors focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:outline-none"
              >
                Reclaim
              </Link>
            </div>

            {/* Navigation Links */}
            <NavigationLinks />

            {/* Auth Buttons */}
            <AuthButtons />
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <main id="main-content" className="flex-1">
        {children}
      </main>
    </div>
  );
}
