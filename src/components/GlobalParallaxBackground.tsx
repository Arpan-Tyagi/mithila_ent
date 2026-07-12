"use client";

import React, { useState, useEffect } from 'react';
import { motion, useScroll, useTransform, useSpring } from 'framer-motion';
import { usePathname } from 'next/navigation';

export default function GlobalParallaxBackground() {
  const [mounted, setMounted] = useState(false);
  const pathname = usePathname();
  
  const { scrollY } = useScroll();

  useEffect(() => {
    setMounted(true);
  }, []);

  // Smooth scroll
  const smoothScrollY = useSpring(scrollY, {
    stiffness: 40,
    damping: 20,
    mass: 1.2,
  });

  // Opposing parallax transforms
  const yUp = useTransform(smoothScrollY, [0, 5000], [0, -500]);   // Moves UP when scrolling down
  const yDown = useTransform(smoothScrollY, [0, 5000], [0, 500]); // Moves DOWN when scrolling down

  if (!mounted || pathname?.startsWith('/admin')) return null;

  return (
    <div className="fixed inset-0 z-40 pointer-events-none overflow-hidden mix-blend-multiply opacity-25">
      
      {/* LEFT SIDE: Moves DOWN when scrolling down */}
      <motion.div 
        style={{ 
          y: yDown,
          position: 'absolute',
          width: '60vw', // Covers the left half plus some overlap buffer
          height: '250vh', // Massive height to allow scrolling without clipping
          left: '-5vw',
          top: '-75vh', // Start way up so it has room to move down
          backgroundImage: 'url(/images/madhubani_premium.svg)',
          backgroundSize: '800px',
          backgroundRepeat: 'repeat',
          backgroundPosition: 'left top'
        }}
        className="grayscale contrast-125 opacity-50 will-change-transform"
      />

      {/* RIGHT SIDE: Moves UP when scrolling down */}
      <motion.div 
        style={{ 
          y: yUp,
          position: 'absolute',
          width: '60vw', // Covers the right half plus buffer
          height: '250vh', // Massive height
          right: '-5vw',
          top: '-25vh', // Start near the top so it has room to move up
          backgroundImage: 'url(/images/madhubani_premium.svg)',
          backgroundSize: '800px',
          backgroundRepeat: 'repeat',
          backgroundPosition: 'right top'
        }}
        className="grayscale contrast-125 opacity-50 will-change-transform"
      />

    </div>
  );
}
