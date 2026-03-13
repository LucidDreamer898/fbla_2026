import Link from 'next/link';
import { Button } from '@/components/ui/Button';
import BackgroundAnimation from '@/components/BackgroundAnimation';
import ImageCarousel from '@/components/ImageCarousel';

export default function HomePage() {
  return (
    <>
      <BackgroundAnimation />
      <div className="flex h-[calc(100vh-4rem)] flex-col overflow-hidden">
        {/* Main Content - Centered */}
        <div className="flex flex-1 flex-col items-center justify-center px-4 sm:px-6 lg:px-8 relative z-10" style={{ paddingTop: '2rem' }}>
          <div className="mx-auto max-w-4xl flex flex-col items-center text-center animate-fade-in-up">
          {/* Hero Heading */}
          <h1 className="text-4xl sm:text-5xl md:text-[5.25rem] lg:text-[6.5rem] xl:text-[7.5rem] leading-tight font-bold whitespace-nowrap" style={{ marginBottom: '32px', marginTop: '-2rem' }}>
            <span className="text-foreground">Lost. </span>
            <span style={{ background: 'linear-gradient(135deg, #8e4ec6, #ff0080)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text', display: 'inline-block', paddingRight: '2px' }}>Found.</span>
            <span className="text-foreground"> Returned.</span>
          </h1>

          {/* Subheading */}
          <p className="text-muted text-base sm:text-lg md:text-xl leading-relaxed px-4" style={{ marginBottom: '40px', textAlign: 'center', maxWidth: '32rem', marginLeft: 'auto', marginRight: 'auto' }}>
            A faster way to reconnect students with their belongings.
          </p>

          {/* CTA Buttons */}
          <div className="flex flex-col items-center justify-center gap-4 sm:gap-6 sm:flex-row px-4" style={{ marginBottom: '32px' }}>
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
          <p className="text-muted/80 text-xs sm:text-sm px-4">
            Built for Students. Backed by Staff.
          </p>
          </div>
        </div>

                    {/* Image Carousel - At Bottom */}
                    {/* <div className="relative z-10 w-full flex-shrink-0">
                      <ImageCarousel />
                    </div> */}
      </div>
    </>
  );
}
