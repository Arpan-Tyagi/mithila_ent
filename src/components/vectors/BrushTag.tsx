import React from 'react';

export default function BrushTag({ text, subtext, className = '' }: { text: string, subtext?: string, className?: string }) {
  return (
    <div className={`relative inline-flex flex-col items-center justify-center ${className}`}>
      {/* Background brush stroke path */}
      <svg className="absolute inset-0 w-full h-full drop-shadow-sm" preserveAspectRatio="none" viewBox="0 0 100 40" xmlns="http://www.w3.org/2000/svg">
        <path d="M 5 20 Q 20 5, 50 10 T 95 15 Q 90 35, 60 30 T 5 20 Z" fill="#8B5A2B" opacity="0.9" />
        <path d="M 10 18 Q 30 10, 60 15 T 90 20 Q 80 30, 50 25 T 10 18 Z" fill="#A0522D" />
      </svg>
      {/* Text Content */}
      <div className="relative z-10 px-6 py-2 text-center text-[var(--unbleached-cotton)]">
        <span className="block font-sans font-bold tracking-widest text-xs uppercase">{text}</span>
        {subtext && <span className="block font-serif text-[10px] italic opacity-90">{subtext}</span>}
      </div>
    </div>
  );
}
