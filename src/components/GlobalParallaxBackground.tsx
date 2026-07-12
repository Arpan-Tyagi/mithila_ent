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

  // Use a smooth spring to make the motion feel luxurious and haptic (emil-design-eng)
  const smoothScrollY = useSpring(scrollY, {
    stiffness: 40,
    damping: 20,
    mass: 1.2,
  });

  // Transform scroll position into parallax Y offsets and subtle rotations
  const y1 = useTransform(smoothScrollY, [0, 5000], [0, -400]);
  const y2 = useTransform(smoothScrollY, [0, 5000], [0, 600]);
  const y3 = useTransform(smoothScrollY, [0, 5000], [0, -800]);

  const r1 = useTransform(smoothScrollY, [0, 5000], [0, 15]);
  const r2 = useTransform(smoothScrollY, [0, 5000], [180, 160]);
  const r3 = useTransform(smoothScrollY, [0, 5000], [-15, -45]);

  // Don't render on server to avoid hydration mismatches with scroll measurements,
  // and completely disable the background on the admin dashboard for clarity.
  if (!mounted || pathname?.startsWith('/admin')) return null;

  return (
    <div className="fixed inset-0 z-0 pointer-events-none overflow-hidden mix-blend-multiply opacity-[0.15] md:opacity-[0.25]">
      
      {/* Massive Mandala: Center/Right */}
      <motion.div 
        style={{ y: y1, rotate: r2 }}
        className="absolute -top-[10%] -right-[15%] w-[1200px] h-[1200px] will-change-transform"
      >
        <Image 
          src="/images/madhubani_mandala.png" 
          alt="Madhubani Mandala Art" 
          fill 
          className="object-contain" 
          priority
        />
      </motion.div>

      {/* Peacock Artwork: Bottom Left */}
      <motion.div 
        style={{ y: y2 }}
        className="absolute top-[40%] -left-[10%] w-[800px] h-[800px] will-change-transform"
      >
        <Image 
          src="/images/madhubani_peacock.png" 
          alt="Madhubani Peacock Art" 
          fill 
          className="object-contain" 
        />
      </motion.div>

      {/* Second Mandala: Top Left */}
      <motion.div 
        style={{ y: y3, rotate: r1 }}
        className="absolute -top-[30%] -left-[20%] w-[1000px] h-[1000px] will-change-transform"
      >
        <Image 
          src="/images/madhubani_mandala.png" 
          alt="Madhubani Mandala Art" 
          fill 
          className="object-contain" 
        />
      </motion.div>
    </div>
  );
}
