import React from 'react';

export default function DyePots({ className = '' }: { className?: string }) {
  return (
    <svg className={`w-full h-full drop-shadow-md ${className}`} viewBox="0 0 400 200" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <filter id="splatterNoise">
          <feTurbulence type="fractalNoise" baseFrequency="1.5" numOctaves="3" result="noise" />
          <feDisplacementMap in="SourceGraphic" in2="noise" scale="5" xChannelSelector="R" yChannelSelector="G" />
        </filter>
      </defs>

      {/* Splatters on the floor */}
      <ellipse cx="150" cy="160" rx="80" ry="20" fill="var(--indigo-dye)" opacity="0.3" filter="url(#splatterNoise)" />
      <ellipse cx="280" cy="150" rx="60" ry="15" fill="var(--madder-red)" opacity="0.3" filter="url(#splatterNoise)" />

      {/* Left Pot (Indigo) */}
      <g transform="translate(80, 50)">
        {/* Overflowing dye */}
        <path d="M 30 20 Q 50 -10 70 20 C 80 40, 90 60, 70 90 Q 50 100 20 80 Q 10 50 30 20 Z" fill="var(--indigo-dye)" filter="url(#splatterNoise)" />
        {/* Pot Base */}
        <path d="M 20 30 C -10 60, -10 110, 50 110 C 110 110, 110 60, 80 30 L 20 30 Z" fill="#b87333" stroke="var(--charcoal-ink)" strokeWidth="2" />
        <ellipse cx="50" cy="30" rx="35" ry="10" fill="#a0522d" stroke="var(--charcoal-ink)" strokeWidth="2" />
        <ellipse cx="50" cy="30" rx="25" ry="5" fill="#703212" />
        {/* Pattern on pot */}
        <path d="M 10 60 Q 50 80 90 60" fill="none" stroke="var(--charcoal-ink)" strokeWidth="2" strokeDasharray="4 4" />
      </g>

      {/* Right Pot (Madder Red) */}
      <g transform="translate(220, 70)">
        {/* Overflowing dye */}
        <path d="M 25 15 Q 40 -5 55 15 C 65 30, 80 50, 55 70 Q 40 80 15 60 Q 5 40 25 15 Z" fill="var(--madder-red)" filter="url(#splatterNoise)" />
        {/* Pot Base */}
        <path d="M 15 25 C -10 50, -10 90, 40 90 C 90 90, 90 50, 65 25 L 15 25 Z" fill="#b87333" stroke="var(--charcoal-ink)" strokeWidth="2" />
        <ellipse cx="40" cy="25" rx="28" ry="8" fill="#a0522d" stroke="var(--charcoal-ink)" strokeWidth="2" />
        <ellipse cx="40" cy="25" rx="20" ry="4" fill="#703212" />
        {/* Pattern on pot */}
        <path d="M 8 50 Q 40 65 72 50" fill="none" stroke="var(--charcoal-ink)" strokeWidth="2" strokeDasharray="4 4" />
      </g>
    </svg>
  );
}
