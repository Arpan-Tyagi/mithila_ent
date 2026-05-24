import React from 'react';

export default function Fish({ className = '' }: { className?: string }) {
  return (
    <svg className={className} width="100" height="60" viewBox="0 0 100 60" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <pattern id="fish-kachni" width="4" height="4" patternUnits="userSpaceOnUse" patternTransform="rotate(30)">
          <rect width="4" height="4" fill="var(--turmeric)" />
          <line x1="0" y1="0" x2="0" y2="4" stroke="var(--madder-red)" strokeWidth="0.5" />
        </pattern>
      </defs>

      {/* Body */}
      <path d="M 20 30 C 40 5, 60 5, 80 30 C 60 55, 40 55, 20 30 Z" fill="url(#fish-kachni)" stroke="var(--charcoal-ink)" strokeWidth="2" />
      
      {/* Intricate Tail */}
      <path d="M 22 30 L 0 10 L 10 30 L 0 50 Z" fill="var(--madder-red)" stroke="var(--charcoal-ink)" strokeWidth="2" />
      <path d="M 18 30 L 5 15 M 15 30 L 5 45" stroke="var(--unbleached-cotton)" strokeWidth="1" />
      
      {/* Fins */}
      <path d="M 40 12 L 30 -5 L 55 5 Z" fill="var(--indigo-dye)" stroke="var(--charcoal-ink)" strokeWidth="1.5" />
      <path d="M 40 48 L 30 65 L 55 55 Z" fill="var(--indigo-dye)" stroke="var(--charcoal-ink)" strokeWidth="1.5" />
      {/* Fin spines */}
      <path d="M 40 12 L 35 0 M 45 8 L 40 -2" stroke="var(--unbleached-cotton)" strokeWidth="0.5" />
      <path d="M 40 48 L 35 60 M 45 52 L 40 62" stroke="var(--unbleached-cotton)" strokeWidth="0.5" />

      {/* Face & Gills */}
      <path d="M 65 15 C 60 25, 60 35, 65 45" fill="none" stroke="var(--charcoal-ink)" strokeWidth="1.5" />
      <path d="M 60 18 C 55 25, 55 35, 60 42" fill="none" stroke="var(--charcoal-ink)" strokeWidth="1" strokeDasharray="2 2" />

      {/* Eye */}
      <circle cx="72" cy="25" r="5" fill="var(--unbleached-cotton)" stroke="var(--charcoal-ink)" strokeWidth="1" />
      <circle cx="74" cy="25" r="2" fill="var(--charcoal-ink)" />

      {/* Dense Scales */}
      {[25, 35, 45, 55].map(x => (
        <g key={`scales-${x}`}>
          <path d={`M ${x} 20 Q ${x+5} 25 ${x} 30`} fill="none" stroke="var(--charcoal-ink)" strokeWidth="1" />
          <path d={`M ${x} 30 Q ${x+5} 35 ${x} 40`} fill="none" stroke="var(--charcoal-ink)" strokeWidth="1" />
        </g>
      ))}
      {[30, 40, 50].map(x => (
        <g key={`scales2-${x}`}>
          <path d={`M ${x} 15 Q ${x+5} 20 ${x} 25`} fill="none" stroke="var(--charcoal-ink)" strokeWidth="1" />
          <path d={`M ${x} 25 Q ${x+5} 30 ${x} 35`} fill="none" stroke="var(--charcoal-ink)" strokeWidth="1" />
          <path d={`M ${x} 35 Q ${x+5} 40 ${x} 45`} fill="none" stroke="var(--charcoal-ink)" strokeWidth="1" />
        </g>
      ))}
    </svg>
  );
}
