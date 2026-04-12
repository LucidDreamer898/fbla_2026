'use client';

import { useEffect, useState } from 'react';

const BRAND = 'Reclaim';
const TAGLINE = 'Lost. Found. Returned.';
const TYPEWRITER_START = 2000;
const TYPEWRITER_SPEED = 45;

export default function LaunchAnimation() {
  const [phase, setPhase] = useState<'animate' | 'exit' | 'done'>('animate');
  const [charCount, setCharCount] = useState(0);

  useEffect(() => {
    const exitTimer = setTimeout(() => setPhase('exit'), 3200);
    const doneTimer = setTimeout(() => setPhase('done'), 4100);

    const typeStart = setTimeout(() => {
      let current = 0;
      const interval = setInterval(() => {
        current += 1;
        setCharCount(current);
        if (current >= TAGLINE.length) clearInterval(interval);
      }, TYPEWRITER_SPEED);

      exitTimer;
      doneTimer;

      return () => clearInterval(interval);
    }, TYPEWRITER_START);

    return () => {
      clearTimeout(exitTimer);
      clearTimeout(doneTimer);
      clearTimeout(typeStart);
    };
  }, []);

  if (phase === 'done') return null;

  const visibleText = TAGLINE.slice(0, charCount);
  const showCursor = charCount > 0;

  return (
    <div
      className={`launch-overlay ${phase === 'exit' ? 'launch-overlay--exit' : ''}`}
      aria-hidden="true"
    >
      {/* Animated mesh gradient */}
      <div className="launch-mesh" />

      {/* Subtle grid */}
      <div className="launch-grid" />

      {/* Expanding ring pulse */}
      <div className="launch-ring" />
      <div className="launch-ring launch-ring--delayed" />

      {/* Horizontal scan line */}
      <div className="launch-scanline" />

      {/* Glitch bars */}
      <div className="launch-glitch-bar" style={{ top: '18%' }} />
      <div className="launch-glitch-bar launch-glitch-bar--2" style={{ top: '52%' }} />
      <div className="launch-glitch-bar launch-glitch-bar--3" style={{ top: '79%' }} />

      {/* Center content */}
      <div className="launch-content">
        {/* Brand with chromatic aberration */}
        <div className="launch-brand-wrap">
          <span className="launch-brand-aberr launch-brand-aberr--r" aria-hidden="true">{BRAND}</span>
          <span className="launch-brand-aberr launch-brand-aberr--b" aria-hidden="true">{BRAND}</span>
          <h1 className="launch-brand">{BRAND}</h1>
        </div>

        {/* Tagline — JS-driven typewriter */}
        <p className="launch-tagline">
          <span className="launch-tagline-text">{visibleText}</span>
          {showCursor && <span className="launch-cursor" />}
        </p>

        {/* Decorative line accents flanking the text */}
        <div className="launch-line-left" />
        <div className="launch-line-right" />
      </div>

      {/* Full-screen flash before exit */}
      <div className="launch-flash" />

      {/* Vignette */}
      <div className="launch-vignette" />
    </div>
  );
}
