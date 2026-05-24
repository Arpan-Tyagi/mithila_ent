"use client";
import React from 'react';
import Fish from './Fish';

export default function WaveFooter({ className = '' }: { className?: string }) {
  // A highly detailed pattern of Madhubani stylized water waves and lotus flowers
  const wavePattern = (
    <g>
      {/* Base water color */}
      <rect width="400" height="300" fill="var(--indigo-dye)" opacity="0.9" />
      
      {/* Dense background water hatching */}
      <rect width="400" height="300" fill="url(#kachni-water)" />

      {/* Overlapping stylized wave arcs (Extremely dense) */}
      {Array.from({ length: 12 }).map((_, row) => (
        <g key={`row-${row}`} transform={`translate(0, ${row * 25})`}>
          {Array.from({ length: 10 }).map((_, col) => (
            <g key={`wave-group-${row}-${col}`} transform={`translate(${col * 80 - (row % 2) * 40}, 0)`}>
              {/* Thick outer wave */}
              <path
                d="M 0 50 C 20 10, 60 10, 80 50"
                fill="none"
                stroke="var(--peacock-blue)"
                strokeWidth="4"
              />
              {/* Inner concentric waves */}
              <path d="M 10 50 C 25 25, 55 25, 70 50" fill="none" stroke="var(--unbleached-cotton)" strokeWidth="1.5" strokeDasharray="3 3" />
              <path d="M 20 50 C 35 35, 45 35, 60 50" fill="none" stroke="var(--turmeric)" strokeWidth="1" />
              <path d="M 30 50 C 35 45, 45 45, 50 50" fill="var(--unbleached-cotton)" />
            </g>
          ))}
        </g>
      ))}

      {/* Highly Detailed Lotus Flowers floating */}
      {[
        { x: 100, y: 80, scale: 0.8, rot: 10 },
        { x: 250, y: 180, scale: 1.2, rot: -15 },
        { x: 350, y: 50, scale: 0.6, rot: 5 }
      ].map((lotus, i) => (
        <g key={`lotus-${i}`} transform={`translate(${lotus.x}, ${lotus.y}) scale(${lotus.scale}) rotate(${lotus.rot})`}>
          {/* Back Petals */}
          <path d="M 50 50 C 20 10, 80 10, 50 50 Z" fill="var(--madder-red)" stroke="var(--charcoal-ink)" strokeWidth="1.5" />
          <path d="M 50 50 C 0 30, 20 70, 50 50 Z" fill="var(--madder-red)" stroke="var(--charcoal-ink)" strokeWidth="1.5" />
          <path d="M 50 50 C 100 30, 80 70, 50 50 Z" fill="var(--madder-red)" stroke="var(--charcoal-ink)" strokeWidth="1.5" />
          {/* Front Petals */}
          <path d="M 50 50 C 35 20, 65 20, 50 50 Z" fill="var(--lotus-pink)" stroke="var(--unbleached-cotton)" strokeWidth="1" />
          <path d="M 50 50 C 20 35, 30 60, 50 50 Z" fill="var(--lotus-pink)" stroke="var(--unbleached-cotton)" strokeWidth="1" />
          <path d="M 50 50 C 80 35, 70 60, 50 50 Z" fill="var(--lotus-pink)" stroke="var(--unbleached-cotton)" strokeWidth="1" />
          {/* Veins */}
          <path d="M 50 50 L 50 25 M 50 50 L 35 40 M 50 50 L 65 40" stroke="var(--unbleached-cotton)" strokeWidth="0.5" strokeDasharray="2 2" />
          {/* Center */}
          <circle cx="50" cy="50" r="5" fill="var(--turmeric)" stroke="var(--charcoal-ink)" strokeWidth="1" />
        </g>
      ))}

      {/* Swimming Fish */}
      <g transform="translate(50, 200) scale(0.6)">
        <Fish />
      </g>
      <g transform="translate(300, 100) scale(0.5) scale(-1, 1)">
        <Fish />
      </g>
    </g>
  );

  return (
    <div className={`w-full h-full overflow-hidden absolute inset-0 z-0 ${className}`}>
      <svg width="100%" height="100%" xmlns="http://www.w3.org/2000/svg">
        <defs>
          <pattern id="kachni-water" width="12" height="12" patternUnits="userSpaceOnUse" patternTransform="rotate(-45)">
            <line x1="0" y1="0" x2="0" y2="12" stroke="var(--peacock-blue)" strokeWidth="0.5" opacity="0.4" />
          </pattern>
          <pattern id="wave-pattern" x="0" y="0" width="400" height="300" patternUnits="userSpaceOnUse">
            {wavePattern}
          </pattern>
        </defs>
        <rect width="100%" height="100%" fill="url(#wave-pattern)" />
        {/* Top gradient fade so text is readable */}
        <rect width="100%" height="150" fill="url(#fade-down)" />
        <defs>
          <linearGradient id="fade-down" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="var(--unbleached-cotton)" stopOpacity="1" />
            <stop offset="100%" stopColor="var(--unbleached-cotton)" stopOpacity="0" />
          </linearGradient>
        </defs>
      </svg>
    </div>
  );
}
