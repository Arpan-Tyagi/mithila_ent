"use client";
import React from 'react';

export default function TopMandala({ className = '' }: { className?: string }) {
  // A half-mandala designed to hang from the top of the page
  const outerPetals = Array.from({ length: 24 }).map((_, i) => (
    <path
      key={`op-${i}`}
      d="M500,0 C530,30 540,70 500,120 C460,70 470,30 500,0 Z"
      fill="url(#top-kachni)"
      stroke="var(--madder-red)"
      strokeWidth="2"
      transform={`rotate(${(i * 180) / 24 - 90} 500 0)`}
    />
  ));

  const middleScallops = Array.from({ length: 36 }).map((_, i) => (
    <g key={`sc-${i}`} transform={`rotate(${(i * 180) / 36 - 90} 500 0)`}>
      <path
        d="M500,160 Q520,130 540,160 Q520,190 500,160"
        fill="var(--indigo-dye)"
        stroke="var(--unbleached-cotton)"
        strokeWidth="1.5"
      />
      <circle cx="520" cy="160" r="3" fill="var(--turmeric)" />
    </g>
  ));

  const innerLeaves = Array.from({ length: 18 }).map((_, i) => (
    <g key={`il-${i}`} transform={`rotate(${(i * 180) / 18 - 90} 500 0)`}>
      <path
        d="M500,190 C530,220 530,280 500,320 C470,280 470,220 500,190 Z"
        fill="var(--madder-red)"
        stroke="var(--charcoal-ink)"
        strokeWidth="2"
      />
      <circle cx="500" cy="280" r="8" fill="var(--turmeric)" stroke="var(--charcoal-ink)" strokeWidth="1" />
    </g>
  ));

  return (
    <svg 
      className={`w-full h-full ${className}`} 
      viewBox="0 0 1000 500" 
      preserveAspectRatio="xMidYMin slice"
      xmlns="http://www.w3.org/2000/svg"
      style={{ filter: 'url(#topNoise)' }}
    >
      <defs>
        <filter id="topNoise">
          <feTurbulence type="fractalNoise" baseFrequency="0.8" numOctaves="4" result="noise" />
          <feColorMatrix type="matrix" values="1 0 0 0 0  0 1 0 0 0  0 0 1 0 0  0 0 0 0.15 0" in="noise" result="coloredNoise" />
          <feComposite operator="in" in="SourceGraphic" in2="coloredNoise" result="composite" />
          <feBlend mode="multiply" in="composite" in2="SourceGraphic" />
        </filter>
        <pattern id="top-kachni" width="8" height="8" patternUnits="userSpaceOnUse" patternTransform="rotate(45)">
          <rect width="8" height="8" fill="var(--unbleached-cotton)" />
          <line x1="0" y1="0" x2="0" y2="8" stroke="var(--charcoal-ink)" strokeWidth="1.5" />
        </pattern>
      </defs>

      <g filter="drop-shadow(0px 15px 25px rgba(0,0,0,0.2))">
        {/* Base filled half-circle */}
        <path d="M0,0 L1000,0 A500,500 0 0,1 0,0 Z" fill="var(--unbleached-cotton)" />

        {/* Outer layers */}
        <path d="M0,0 L1000,0 A500,500 0 0,1 0,0 Z" fill="none" stroke="var(--charcoal-ink)" strokeWidth="4" />
        <path d="M20,0 L980,0 A480,480 0 0,1 20,0 Z" fill="none" stroke="var(--madder-red)" strokeWidth="15" strokeDasharray="20 10" />
        
        {outerPetals}

        <path d="M90,0 L910,0 A410,410 0 0,1 90,0 Z" fill="none" stroke="var(--charcoal-ink)" strokeWidth="3" />
        
        {middleScallops}
        
        <path d="M140,0 L860,0 A360,360 0 0,1 140,0 Z" fill="none" stroke="var(--indigo-dye)" strokeWidth="10" />
        
        {innerLeaves}
        
        <path d="M240,0 L760,0 A260,260 0 0,1 240,0 Z" fill="none" stroke="var(--turmeric)" strokeWidth="20" strokeDasharray="30 15" />
        <path d="M260,0 L740,0 A240,240 0 0,1 260,0 Z" fill="none" stroke="var(--charcoal-ink)" strokeWidth="4" />
        
        {/* Inner dense core */}
        <path d="M300,0 L700,0 A200,200 0 0,1 300,0 Z" fill="url(#top-kachni)" stroke="var(--charcoal-ink)" strokeWidth="2" />
        <path d="M350,0 L650,0 A150,150 0 0,1 350,0 Z" fill="var(--madder-red)" />
        <path d="M400,0 L600,0 A100,100 0 0,1 400,0 Z" fill="var(--indigo-dye)" />
      </g>
    </svg>
  );
}
