import Link from 'next/link';
import { Button } from '@/components/ui/Button';

export default function PublicLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="bg-background min-h-screen">
      {/* Skip to content link for accessibility */}
      <a href="#main-content" className="skip-to-content">
        Skip to main content
      </a>

      {/* Navigation */}
      <nav className="bg-background/95 supports-[backdrop-filter]:bg-background/60 backdrop-blur">
        <div className="container mx-auto" style={{ paddingLeft: '2rem', paddingRight: '2rem' }}>
          <div className="flex h-16 items-center justify-between relative">
            {/* Logo */}
            <div className="flex items-center" style={{ position: 'fixed', left: '2rem', top: '1rem', zIndex: 10 }}>
              <Link
                href="/"
                className="text-foreground hover:text-primary focus-visible:ring-primary rounded-lg text-xl font-bold transition-colors focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:outline-none"
              >
                Lost&Found
              </Link>
            </div>

            {/* Navigation Links */}
            <div className="hidden items-center md:flex" style={{ gap: '2rem', marginLeft: '4rem', marginRight: 'auto', zIndex: 20 }}>
              <Link
                href="/"
                className="text-foreground hover:text-primary focus-visible:ring-primary rounded-lg px-2 py-1 transition-colors focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:outline-none"
              >
                Home
              </Link>
                  <Link
                    href="/items"
                    className="text-foreground hover:text-primary focus-visible:ring-primary rounded-lg px-2 py-1 transition-colors focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:outline-none"
                  >
                    Browse
                  </Link>
              <Link
                href="/report"
                className="text-foreground hover:text-primary focus-visible:ring-primary rounded-lg px-2 py-1 transition-colors focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:outline-none"
              >
                Report
              </Link>
              <Link
                href="/admin"
                className="text-foreground hover:text-primary focus-visible:ring-primary rounded-lg px-2 py-1 transition-colors focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:outline-none"
              >
                Admin
              </Link>
            </div>

            {/* Auth Buttons */}
            <div className="flex items-center" style={{ gap: '1.5rem', position: 'fixed', right: '2rem', top: '1rem', zIndex: 10 }}>
              <Button variant="ghost" size="sm">
                Log In
              </Button>
              <Button variant="solid" size="sm">
                Sign Up
              </Button>
            </div>

            {/* Mobile menu button */}
            <div className="md:hidden">
              <Button variant="ghost" size="sm" aria-label="Open menu">
                <svg
                  className="h-6 w-6"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M4 6h16M4 12h16M4 18h16"
                  />
                </svg>
              </Button>
            </div>
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
