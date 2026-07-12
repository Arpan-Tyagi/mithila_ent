"use client";

import React, { useState, useEffect } from 'react';
import { motion, useScroll, useTransform, useSpring } from 'framer-motion';
import Image from 'next/image';
import { usePathname } from 'next/navigation';

export default function GlobalParallaxBackground() {
  const [mounted, setMounted] = useState(false);
  const pathname = usePathname();
  
  // The global scroll tracking. This reads the window scroll automatically.
  const { scrollY } = useScroll();

  useEffect(() => {
    setMounted(true);
  }, []);

  // Use a smooth spring to make the motion feel luxurious and haptic
  const smoothScrollY = useSpring(scrollY, {
    stiffness: 40,
    damping: 20,
    mass: 1.2,
  });

  // Transform scroll position into parallax Y offsets and subtle rotations
  const y1 = useTransform(smoothScrollY, [0, 5000], [0, -300]);
  const y2 = useTransform(smoothScrollY, [0, 5000], [0, 400]);
  const y3 = useTransform(smoothScrollY, [0, 5000], [0, -600]);

  // Don't render on server to avoid hydration mismatches, and hide on admin
  if (!mounted || pathname?.startsWith('/admin')) return null;

  return (
    <div className="fixed inset-0 z-40 pointer-events-none overflow-hidden mix-blend-multiply opacity-25 md:opacity-30">
      
      {/* Top Right Premium Sketch */}
      <motion.div 
        style={{ y: y1 }}
        className="absolute -top-[10%] -right-[10%] w-[800px] h-[800px] grayscale contrast-125 opacity-40 will-change-transform"
      >
        <Image 
          src="/images/madhubani_premium.png" 
          alt="Premium Madhubani Sketch" 
          fill 
          className="object-contain" 
          priority
        />
      </motion.div>

      {/* Bottom Left Premium Sketch (Rotated for variety) */}
      <motion.div 
        style={{ y: y2 }}
        className="absolute top-[50%] -left-[15%] w-[900px] h-[900px] grayscale contrast-125 opacity-30 rotate-180 will-change-transform"
      >
        <Image 
          src="/images/madhubani_premium.png" 
          alt="Premium Madhubani Sketch" 
          fill 
          className="object-contain" 
        />
      </motion.div>

    </div>
  );
}
