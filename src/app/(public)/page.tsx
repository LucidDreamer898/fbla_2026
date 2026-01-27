import Link from 'next/link';
import { Button } from '@/components/ui/Button';
import BackgroundAnimation from '@/components/BackgroundAnimation';

export default function HomePage() {
  return (
    <>
      <BackgroundAnimation />
      <div className="flex min-h-[calc(100vh-4rem)] flex-col items-center justify-center px-4 sm:px-6 lg:px-8 relative z-10">
        <div className="mx-auto max-w-4xl flex flex-col items-center text-center animate-fade-in-up">
        {/* Hero Heading */}
        <h1 className="text-[5.25rem] leading-tight font-bold sm:text-[6.5rem] lg:text-[7.5rem] whitespace-nowrap" style={{ marginBottom: '48px' }}>
          <span className="text-foreground">Lost. </span>
          <span style={{ background: 'linear-gradient(135deg, #8e4ec6, #ff0080)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text', display: 'inline-block', paddingRight: '2px' }}>Found.</span>
          <span className="text-foreground"> Returned.</span>
        </h1>

        {/* Subheading */}
        <p className="text-muted text-lg leading-relaxed sm:text-xl" style={{ marginBottom: '64px', textAlign: 'center', maxWidth: '32rem', marginLeft: 'auto', marginRight: 'auto', transform: 'translateX(2rem)' }}>
          A faster way to reconnect students with their belongings.
        </p>

        {/* CTA Buttons */}
        <div className="flex flex-col items-center justify-center gap-6 sm:flex-row" style={{ marginBottom: '48px', transform: 'translateX(2rem)' }}>
          <Button
            variant="solid"
            size="lg"
            className="w-full sm:w-auto"
            asChild
          >
            <Link href="/report">Report an Item</Link>
          </Button>

              <Button
                variant="outline"
                size="lg"
                className="w-full sm:w-auto"
                asChild
              >
                <Link href="/items">Browse Lost Items</Link>
              </Button>
        </div>

        {/* Helper Text */}
        <p className="text-muted/80 text-sm" style={{ transform: 'translateX(2rem)' }}>
          Built for Students. Backed by Staff.
        </p>
        </div>
      </div>
    </>
  );
}
