import React from 'react';

export default function WaxSeal({ className = '' }: { className?: string }) {
  // Scalloped outer edge
  const numScallops = 36;
  const radius = 90;
  const centerX = 100;
  const centerY = 100;
  
  let scallopPath = `M ${centerX + radius} ${centerY}`;
  for (let i = 1; i <= numScallops; i++) {
    const angle1 = ((i - 0.5) * 360) / numScallops;
    const angle2 = (i * 360) / numScallops;
    
    const r1 = radius + 8; // The "bump"
    const r2 = radius; // The dip
    
    const rad1 = (angle1 * Math.PI) / 180;
    const rad2 = (angle2 * Math.PI) / 180;
    
    const x1 = centerX + r1 * Math.cos(rad1);
    const y1 = centerY + r1 * Math.sin(rad1);
    
    const x2 = centerX + r2 * Math.cos(rad2);
    const y2 = centerY + r2 * Math.sin(rad2);
    
    scallopPath += ` Q ${x1} ${y1} ${x2} ${y2}`;
  }

  return (
    <svg className={`w-full h-full drop-shadow-xl hover:scale-105 transition-transform cursor-pointer ${className}`} viewBox="0 0 200 200" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <radialGradient id="waxGrad" cx="30%" cy="30%" r="70%">
          <stop offset="0%" stopColor="#c43f3f" />
          <stop offset="60%" stopColor="#8B2E2E" />
          <stop offset="100%" stopColor="#5a1616" />
        </radialGradient>
        <filter id="waxTexture">
          <feTurbulence type="fractalNoise" baseFrequency="0.4" numOctaves="4" result="noise" />
          <feColorMatrix type="matrix" values="1 0 0 0 0  0 1 0 0 0  0 0 1 0 0  0 0 0 0.3 0" in="noise" result="coloredNoise" />
          <feComposite operator="in" in="SourceGraphic" in2="coloredNoise" result="composite" />
          <feBlend mode="multiply" in="composite" in2="SourceGraphic" />
          <feDropShadow dx="2" dy="4" stdDeviation="3" floodOpacity="0.4" />
        </filter>
        <path id="textCircle" d="M 50,100 A 50,50 0 1,1 150,100 A 50,50 0 1,1 50,100" />
      </defs>
      
      {/* Base wax stamp */}
      <path d={scallopPath} fill="url(#waxGrad)" filter="url(#waxTexture)" />
      
      {/* Inner embossed ring */}
      <circle cx="100" cy="100" r="75" fill="none" stroke="#5a1616" strokeWidth="2" opacity="0.6" />
      <circle cx="100" cy="100" r="70" fill="none" stroke="#c43f3f" strokeWidth="1" opacity="0.8" />
      
      {/* Circular text */}
      <text fill="#F0E8D0" fontWeight="bold" fontFamily="serif" fontSize="16" letterSpacing="2">
        <textPath href="#textCircle" startOffset="50%" textAnchor="middle">
          SHOP THE COLLECTION
        </textPath>
      </text>
      
      {/* Central insignia */}
      <path d="M 90,80 L 110,80 L 100,120 Z" fill="#F0E8D0" opacity="0.8" />
      <circle cx="100" cy="110" r="15" fill="none" stroke="#F0E8D0" strokeWidth="2" opacity="0.8" />
    </svg>
  );
}
