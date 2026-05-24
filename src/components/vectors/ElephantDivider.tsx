"use client";
import React from 'react';

export default function ElephantDivider({ className = '' }: { className?: string }) {
  // A single highly detailed Madhubani elephant silhouette path with internal Kachni patterns
  const elephantSvg = (
    <g transform="scale(0.5)">
      {/* Main body contour */}
      <path 
        d="M 120 40 C 180 30, 220 50, 240 80 C 260 110, 260 180, 240 220 C 230 240, 220 280, 210 280 C 200 280, 190 260, 190 240 C 190 200, 170 190, 150 190 C 130 190, 110 200, 110 240 C 110 260, 100 280, 90 280 C 80 280, 70 240, 60 220 C 40 180, 40 110, 60 80 C 70 60, 90 45, 120 40 Z" 
        fill="url(#elephant-kachni)" 
        stroke="var(--charcoal-ink)"
        strokeWidth="3"
      />
      {/* Trunk and head details */}
      <path d="M 235 150 C 280 140, 300 180, 290 220 C 285 240, 270 250, 260 240 C 255 235, 260 220, 265 210 C 270 190, 250 170, 235 170" fill="var(--unbleached-cotton)" stroke="var(--charcoal-ink)" strokeWidth="6" strokeLinecap="round" />
      {/* Trunk stripes */}
      <path d="M 245 160 L 265 170 M 250 180 L 270 190 M 260 200 L 280 210" stroke="var(--charcoal-ink)" strokeWidth="2" />
      
      {/* Tusk */}
      <path d="M 245 150 L 275 135 L 255 160 Z" fill="var(--unbleached-cotton)" stroke="var(--charcoal-ink)" strokeWidth="2" />
      <path d="M 255 145 L 260 142" stroke="var(--charcoal-ink)" strokeWidth="1" />
      
      {/* Eye & Head decoration */}
      <circle cx="210" cy="110" r="10" fill="var(--unbleached-cotton)" stroke="var(--charcoal-ink)" strokeWidth="2" />
      <circle cx="212" cy="110" r="4" fill="var(--charcoal-ink)" />
      <circle cx="215" cy="108" r="1" fill="var(--unbleached-cotton)" />
      
      {/* Head piece (Bharni style) */}
      <path d="M 190 50 C 210 60, 230 80, 235 100 L 210 80 Z" fill="var(--madder-red)" stroke="var(--charcoal-ink)" strokeWidth="2" />
      
      {/* Howdah (Carriage/Blanket on back) */}
      <path d="M 120 40 C 160 35, 180 50, 200 80 L 170 150 C 130 160, 90 150, 70 120 Z" fill="var(--indigo-dye)" stroke="var(--charcoal-ink)" strokeWidth="3" />
      <path d="M 80 110 L 190 70 M 90 130 L 180 100" stroke="var(--turmeric)" strokeWidth="4" strokeDasharray="5 5" />
      
      {/* Hanging Bells / Tassels */}
      <circle cx="90" cy="160" r="5" fill="var(--turmeric)" stroke="var(--charcoal-ink)" strokeWidth="1" />
      <circle cx="110" cy="170" r="5" fill="var(--turmeric)" stroke="var(--charcoal-ink)" strokeWidth="1" />
      <circle cx="130" cy="175" r="5" fill="var(--turmeric)" stroke="var(--charcoal-ink)" strokeWidth="1" />
      <circle cx="150" cy="175" r="5" fill="var(--turmeric)" stroke="var(--charcoal-ink)" strokeWidth="1" />
      <circle cx="170" cy="165" r="5" fill="var(--turmeric)" stroke="var(--charcoal-ink)" strokeWidth="1" />
      
      {/* Leg details (toes) */}
      <path d="M 80 280 C 85 270, 95 270, 100 280" fill="var(--unbleached-cotton)" stroke="var(--charcoal-ink)" strokeWidth="2" />
      <path d="M 190 280 C 195 270, 205 270, 210 280" fill="var(--unbleached-cotton)" stroke="var(--charcoal-ink)" strokeWidth="2" />
    </g>
  );

  return (
    <div className={`w-full overflow-hidden whitespace-nowrap opacity-90 ${className}`}>
      <svg width="2000" height="150" xmlns="http://www.w3.org/2000/svg">
        <defs>
          <pattern id="elephant-kachni" width="10" height="10" patternUnits="userSpaceOnUse" patternTransform="rotate(45)">
            <rect width="10" height="10" fill="var(--unbleached-cotton)" />
            <line x1="0" y1="0" x2="0" y2="10" stroke="var(--charcoal-ink)" strokeWidth="1.5" />
          </pattern>
          <pattern id="elephant-pattern" x="0" y="0" width="180" height="150" patternUnits="userSpaceOnUse">
            {elephantSvg}
          </pattern>
        </defs>
        <rect width="100%" height="150" fill="url(#elephant-pattern)" />
      </svg>
    </div>
  );
}
