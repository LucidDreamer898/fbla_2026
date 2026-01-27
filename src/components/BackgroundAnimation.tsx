'use client';

import React, { useEffect, useState } from 'react';

export default function BackgroundAnimation() {
  const [particles, setParticles] = useState<Array<{
    left: number;
    top: number;
    delay: number;
    duration: number;
  }>>([]);
  const [isClient, setIsClient] = useState(false);

  useEffect(() => {
    // Generate particles on client side only
    const generatedParticles = Array.from({ length: 20 }, () => ({
      left: Math.random() * 100,
      top: Math.random() * 100,
      delay: Math.random() * 10,
      duration: 10 + Math.random() * 20,
    }));
    setParticles(generatedParticles);
    setIsClient(true);
  }, []);

  return (
    <div className="fixed inset-0 overflow-hidden" style={{ zIndex: 0, pointerEvents: 'none' }}>
      {/* Animated gradient background */}
      <div className="absolute inset-0 bg-gradient-to-br from-purple-900/20 via-pink-900/20 to-blue-900/20 animate-pulse" />
      
      {/* Floating orbs */}
      <div className="absolute top-1/4 left-1/4 w-64 h-64 bg-gradient-to-r from-purple-500/30 to-pink-500/30 rounded-full blur-3xl animate-float-1" />
      <div className="absolute top-3/4 right-1/4 w-48 h-48 bg-gradient-to-r from-blue-500/30 to-purple-500/30 rounded-full blur-3xl animate-float-2" />
      <div className="absolute top-1/2 right-1/3 w-32 h-32 bg-gradient-to-r from-pink-500/30 to-red-500/30 rounded-full blur-3xl animate-float-3" />
      
      {/* Animated grid pattern */}
      <div className="absolute inset-0 bg-grid-pattern opacity-10 animate-grid-move" />
      
      {/* Subtle particles - small dots scattered across the screen */}
      {isClient && (
        <div className="absolute inset-0">
          {particles.map((particle, i) => (
            <div
              key={i}
              className="absolute w-1 h-1 bg-white/30 rounded-full animate-particle"
              style={{
                left: `${particle.left}%`,
                top: `${particle.top}%`,
                animationDelay: `${particle.delay}s`,
                animationDuration: `${particle.duration}s`,
              }}
            />
          ))}
        </div>
      )}
      
      {/* Animated lines */}
      <div className="absolute top-0 left-0 w-full h-full">
        <div className="absolute top-1/4 left-0 w-full h-px bg-gradient-to-r from-transparent via-purple-500/30 to-transparent animate-line-1" />
        <div className="absolute top-3/4 left-0 w-full h-px bg-gradient-to-r from-transparent via-pink-500/30 to-transparent animate-line-2" />
        <div className="absolute top-1/2 left-0 w-full h-px bg-gradient-to-r from-transparent via-blue-500/30 to-transparent animate-line-3" />
      </div>
    </div>
  );
}
