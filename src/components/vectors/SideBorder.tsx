"use client";
import React from 'react';

export default function SideBorder({ className = '', side = 'left' }: { className?: string, side?: 'left' | 'right' }) {
  // A vertical repeating floral border
  const repeats = Array.from({ length: 15 });

  return (
    <svg 
      className={`h-full w-[80px] ${className}`} 
      viewBox="0 0 80 1500" 
      preserveAspectRatio="none"
      xmlns="http://www.w3.org/2000/svg"
      style={{ filter: 'url(#borderNoise)' }}
    >
      <defs>
        <filter id="borderNoise">
          <feTurbulence type="fractalNoise" baseFrequency="0.8" numOctaves="3" result="noise" />
          <feColorMatrix type="matrix" values="1 0 0 0 0  0 1 0 0 0  0 0 1 0 0  0 0 0 0.2 0" in="noise" result="coloredNoise" />
          <feComposite operator="in" in="SourceGraphic" in2="coloredNoise" result="composite" />
          <feBlend mode="multiply" in="composite" in2="SourceGraphic" />
        </filter>
        <pattern id="vine-kachni" width="6" height="6" patternUnits="userSpaceOnUse" patternTransform="rotate(45)">
          <rect width="6" height="6" fill="var(--unbleached-cotton)" />
          <line x1="0" y1="0" x2="0" y2="6" stroke="var(--charcoal-ink)" strokeWidth="1" />
        </pattern>
      </defs>

      <g transform={side === 'right' ? 'scale(-1, 1) translate(-80, 0)' : ''} filter="drop-shadow(2px 0px 5px rgba(0,0,0,0.1))">
        {/* Main continuous vine stalk */}
        <path d="M20,0 Q10,50 30,100 T20,200 T30,300 T20,400 T30,500 T20,600 T30,700 T20,800 T30,900 T20,1000 T30,1100 T20,1200 T30,1300 T20,1400 T30,1500" fill="none" stroke="var(--charcoal-ink)" strokeWidth="3" />
        <path d="M15,0 Q5,50 25,100 T15,200 T25,300 T15,400 T25,500 T15,600 T25,700 T15,800 T25,900 T15,1000 T25,1100 T15,1200 T25,1300 T15,1400 T25,1500" fill="none" stroke="var(--indigo-dye)" strokeWidth="2" />
        
        {/* Repeating floral nodes */}
        {repeats.map((_, i) => (
          <g key={`node-${i}`} transform={`translate(25, ${i * 100 + 50})`}>
            {/* Flower */}
            <circle cx="20" cy="0" r="15" fill="url(#vine-kachni)" stroke="var(--charcoal-ink)" strokeWidth="2" />
            <circle cx="20" cy="0" r="8" fill="var(--madder-red)" stroke="var(--turmeric)" strokeWidth="2" />
            <circle cx="20" cy="0" r="3" fill="var(--charcoal-ink)" />
            {/* Leaves */}
            <path d="M0,-10 Q-15,-20 -5,-30 Q10,-20 0,-10 Z" fill="var(--indigo-dye)" stroke="var(--charcoal-ink)" strokeWidth="1" />
            <path d="M0,10 Q-15,20 -5,30 Q10,20 0,10 Z" fill="var(--indigo-dye)" stroke="var(--charcoal-ink)" strokeWidth="1" />
            <path d="M5,0 Q15,-10 25,0 Q15,10 5,0 Z" fill="none" stroke="var(--charcoal-ink)" strokeWidth="1" />
          </g>
        ))}
        
        {/* Double border line on the very edge */}
        <line x1="2" y1="0" x2="2" y2="1500" stroke="var(--charcoal-ink)" strokeWidth="4" />
        <line x1="8" y1="0" x2="8" y2="1500" stroke="var(--madder-red)" strokeWidth="2" />
      </g>
    </svg>
  );
}
