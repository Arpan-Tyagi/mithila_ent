"use client";
import React from 'react';

export default function Mandala({ className = '' }: { className?: string }) {
  // Procedurally generate the highly intricate Madhubani mandala
  // We use immense repetition to achieve the density of traditional hand-painted art
  
  const outerTriangles = Array.from({ length: 144 }).map((_, i) => (
    <polygon
      key={`otri-${i}`}
      points="500,10 504,25 496,25"
      fill="var(--turmeric)"
      stroke="var(--charcoal-ink)"
      strokeWidth="0.5"
      transform={`rotate(${(i * 360) / 144} 500 500)`}
    />
  ));

  const outerPetals = Array.from({ length: 48 }).map((_, i) => (
    <g key={`outer-${i}`} transform={`rotate(${(i * 360) / 48} 500 500)`}>
      <path
        d="M500,25 C515,40 525,70 500,100 C475,70 485,40 500,25 Z"
        fill="url(#kachni-pattern)"
        stroke="var(--madder-red)"
        strokeWidth="2"
      />
      <circle cx="500" cy="40" r="2.5" fill="var(--indigo-dye)" />
      <path d="M500,50 L500,90" stroke="var(--madder-red)" strokeWidth="1" />
      {/* Intricate edge dots */}
      <circle cx="480" cy="80" r="1.5" fill="var(--charcoal-ink)" />
      <circle cx="520" cy="80" r="1.5" fill="var(--charcoal-ink)" />
    </g>
  ));

  const denseHatching = Array.from({ length: 180 }).map((_, i) => (
    <line
      key={`hatch-${i}`}
      x1="500" y1="110" x2="500" y2="135"
      stroke="var(--charcoal-ink)"
      strokeWidth="1"
      transform={`rotate(${(i * 360) / 180} 500 500)`}
    />
  ));

  const middleScallops = Array.from({ length: 72 }).map((_, i) => (
    <g key={`scallop-${i}`} transform={`rotate(${(i * 360) / 72} 500 500)`}>
      <path
        d="M500,140 Q515,120 530,140 Q515,160 500,140"
        fill="var(--indigo-dye)"
        stroke="var(--unbleached-cotton)"
        strokeWidth="1"
      />
      <circle cx="515" cy="140" r="1.5" fill="var(--turmeric)" />
    </g>
  ));

  const innerLeaves = Array.from({ length: 36 }).map((_, i) => (
    <g key={`inner-${i}`} transform={`rotate(${(i * 360) / 36} 500 500)`}>
      <path
        d="M500,165 C520,190 520,240 500,270 C480,240 480,190 500,165 Z"
        fill="var(--madder-red)"
        stroke="var(--charcoal-ink)"
        strokeWidth="2"
      />
      <line x1="500" y1="165" x2="500" y2="270" stroke="var(--unbleached-cotton)" strokeWidth="1" strokeDasharray="3 3" />
      <circle cx="500" cy="240" r="6" fill="var(--turmeric)" stroke="var(--charcoal-ink)" strokeWidth="1" />
      {/* Tiny internal veins */}
      <line x1="500" y1="190" x2="510" y2="180" stroke="var(--unbleached-cotton)" strokeWidth="0.5" />
      <line x1="500" y1="200" x2="490" y2="190" stroke="var(--unbleached-cotton)" strokeWidth="0.5" />
      <line x1="500" y1="210" x2="512" y2="200" stroke="var(--unbleached-cotton)" strokeWidth="0.5" />
    </g>
  ));

  const coreGeometry = Array.from({ length: 24 }).map((_, i) => (
    <g key={`core-${i}`} transform={`rotate(${(i * 360) / 24} 500 500)`}>
      <polygon
        points="500,290 520,340 480,340"
        fill="var(--lotus-pink)"
        stroke="var(--charcoal-ink)"
        strokeWidth="1.5"
      />
      <line x1="500" y1="290" x2="500" y2="340" stroke="var(--charcoal-ink)" strokeWidth="1" />
      <circle cx="500" cy="355" r="5" fill="var(--indigo-dye)" />
      <circle cx="500" cy="355" r="1.5" fill="var(--unbleached-cotton)" />
    </g>
  ));

  const sunbeams = Array.from({ length: 60 }).map((_, i) => (
    <path
      key={`sun-${i}`}
      d="M500,370 Q505,385 500,400"
      fill="none"
      stroke="var(--turmeric)"
      strokeWidth="2"
      transform={`rotate(${(i * 360) / 60} 500 500)`}
    />
  ));

  return (
    <svg 
      className={`w-full h-full ${className}`} 
      viewBox="0 0 1000 1000" 
      xmlns="http://www.w3.org/2000/svg"
      style={{ filter: 'url(#paperNoise)' }}
    >
      <defs>
        {/* Subtle noise filter to give the vector a hand-painted/fabric texture */}
        <filter id="paperNoise">
          <feTurbulence type="fractalNoise" baseFrequency="0.9" numOctaves="4" result="noise" />
          <feColorMatrix type="matrix" values="1 0 0 0 0  0 1 0 0 0  0 0 1 0 0  0 0 0 0.2 0" in="noise" result="coloredNoise" />
          <feComposite operator="in" in="SourceGraphic" in2="coloredNoise" result="composite" />
          <feBlend mode="multiply" in="composite" in2="SourceGraphic" />
        </filter>
        {/* Kachni Hatching Pattern */}
        <pattern id="kachni-pattern" width="8" height="8" patternUnits="userSpaceOnUse" patternTransform="rotate(45)">
          <rect width="8" height="8" fill="var(--unbleached-cotton)" />
          <line x1="0" y1="0" x2="0" y2="8" stroke="var(--charcoal-ink)" strokeWidth="1" />
        </pattern>
      </defs>

      <g filter="drop-shadow(0px 10px 20px rgba(0,0,0,0.15))">
        {/* Base filled circle to block background */}
        <circle cx="500" cy="500" r="495" fill="var(--unbleached-cotton)" />

        {/* Outer details */}
        {outerTriangles}
        <circle cx="500" cy="500" r="475" fill="none" stroke="var(--charcoal-ink)" strokeWidth="2" />
        <circle cx="500" cy="500" r="470" fill="none" stroke="var(--charcoal-ink)" strokeWidth="5" strokeDasharray="12 6" />
        
        {outerPetals}
        
        <circle cx="500" cy="500" r="390" fill="none" stroke="var(--charcoal-ink)" strokeWidth="2" />
        {denseHatching}
        <circle cx="500" cy="500" r="365" fill="none" stroke="var(--madder-red)" strokeWidth="10" />
        
        {middleScallops}
        
        <circle cx="500" cy="500" r="335" fill="none" stroke="var(--charcoal-ink)" strokeWidth="3" />
        
        {innerLeaves}
        
        <circle cx="500" cy="500" r="230" fill="none" stroke="var(--indigo-dye)" strokeWidth="6" />
        <circle cx="500" cy="500" r="222" fill="none" stroke="var(--charcoal-ink)" strokeWidth="1" />
        
        {coreGeometry}
        
        <circle cx="500" cy="500" r="140" fill="none" stroke="var(--turmeric)" strokeWidth="8" strokeDasharray="15 10" />
        <circle cx="500" cy="500" r="130" fill="none" stroke="var(--charcoal-ink)" strokeWidth="3" />
        
        {sunbeams}

        {/* Very inner core where the portrait sits */}
        <circle cx="500" cy="500" r="100" fill="var(--madder-red)" opacity="0.1" />
      </g>
    </svg>
  );
}
