"use client";
import React from 'react';

export default function PeacockDivider({ className = '' }: { className?: string }) {
  // Generate 20 extremely detailed overlapping tail feathers
  const tailFeathers = Array.from({ length: 20 }).map((_, i) => {
    // Math to fan out the feathers
    const angle = -40 + (i * 7);
    return (
      <g key={`feather-${i}`} transform={`rotate(${angle} 150 150) translate(-60, 40)`}>
        <path d="M 150 150 C 130 180, 130 230, 150 250 C 170 230, 170 180, 150 150 Z" fill={i % 2 === 0 ? "var(--parrot-green)" : "var(--indigo-dye)"} stroke="var(--charcoal-ink)" strokeWidth="1.5" />
        <path d="M 150 180 C 145 200, 145 220, 150 230 C 155 220, 155 200, 150 180 Z" fill="var(--turmeric)" stroke="var(--charcoal-ink)" strokeWidth="1" />
        <circle cx="150" cy="215" r="4" fill="var(--madder-red)" />
        {/* Fine feather wisps */}
        <line x1="150" y1="160" x2="140" y2="150" stroke="var(--charcoal-ink)" strokeWidth="0.5" />
        <line x1="150" y1="170" x2="160" y2="160" stroke="var(--charcoal-ink)" strokeWidth="0.5" />
        <line x1="150" y1="180" x2="135" y2="175" stroke="var(--charcoal-ink)" strokeWidth="0.5" />
      </g>
    );
  });

  const peacockSvg = (
    <g transform="scale(0.6)">
      {/* Background massive tail block */}
      <path d="M 150 150 C 0 100, -20 300, 150 350 C 300 300, 300 100, 150 150 Z" fill="url(#kachni-peacock)" stroke="var(--charcoal-ink)" strokeWidth="3" />
      
      {/* Individual detailed feathers */}
      {tailFeathers}

      {/* Body */}
      <path 
        d="M 150 150 C 120 150, 100 120, 100 90 C 100 60, 120 30, 150 30 C 160 30, 170 35, 180 45 L 200 30 C 205 25, 210 30, 205 35 L 185 55 C 195 70, 200 90, 190 120 C 180 150, 160 150, 150 150 Z" 
        fill="var(--peacock-blue)" 
        stroke="var(--charcoal-ink)"
        strokeWidth="3"
      />
      {/* Body scales/texture */}
      <path d="M 130 90 C 140 100, 150 100, 160 90" fill="none" stroke="var(--unbleached-cotton)" strokeWidth="2" />
      <path d="M 120 110 C 140 120, 160 120, 180 110" fill="none" stroke="var(--unbleached-cotton)" strokeWidth="2" />
      <path d="M 130 130 C 140 140, 160 140, 170 130" fill="none" stroke="var(--unbleached-cotton)" strokeWidth="2" />

      {/* Face details */}
      <circle cx="140" cy="60" r="6" fill="var(--unbleached-cotton)" stroke="var(--charcoal-ink)" strokeWidth="2" />
      <circle cx="142" cy="60" r="2" fill="var(--charcoal-ink)" />
      
      {/* Beak */}
      <path d="M 130 65 L 110 70 L 125 75 Z" fill="var(--turmeric)" stroke="var(--charcoal-ink)" strokeWidth="1.5" />
      
      {/* Crown Crest */}
      {[10, 20, 30].map(angle => (
        <g key={`crest-${angle}`} transform={`rotate(${angle} 150 30)`}>
          <line x1="150" y1="30" x2="150" y2="10" stroke="var(--charcoal-ink)" strokeWidth="2" />
          <circle cx="150" cy="10" r="4" fill="var(--turmeric)" stroke="var(--charcoal-ink)" strokeWidth="1" />
        </g>
      ))}
      
      {/* Legs */}
      <path d="M 140 150 L 130 190 L 115 200 M 130 190 L 145 200" fill="none" stroke="var(--charcoal-ink)" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M 160 150 L 170 190 L 185 200 M 170 190 L 155 200" fill="none" stroke="var(--charcoal-ink)" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
    </g>
  );

  return (
    <div className={`w-full overflow-hidden whitespace-nowrap opacity-95 ${className}`}>
      <svg width="2000" height="230" xmlns="http://www.w3.org/2000/svg">
        <defs>
          <pattern id="kachni-peacock" width="6" height="6" patternUnits="userSpaceOnUse" patternTransform="rotate(15)">
            <rect width="6" height="6" fill="var(--unbleached-cotton)" />
            <line x1="0" y1="0" x2="0" y2="6" stroke="var(--charcoal-ink)" strokeWidth="1" />
          </pattern>
          <pattern id="peacock-pattern" x="0" y="0" width="180" height="230" patternUnits="userSpaceOnUse">
            {peacockSvg}
          </pattern>
        </defs>
        <rect width="100%" height="230" fill="url(#peacock-pattern)" />
      </svg>
    </div>
  );
}
