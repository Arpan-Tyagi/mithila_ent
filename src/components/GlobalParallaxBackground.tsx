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
    <div className="fixed inset-0 z-40 pointer-events-none overflow-hidden mix-blend-multiply opacity-25">
      
      {/* Subtle Sketch: Peacock anchored to bottom-right */}
      <motion.div 
        style={{ y: y1 }}
        className="absolute -bottom-24 -right-12 w-[600px] h-[600px] grayscale contrast-125 opacity-40 will-change-transform"
      >
        <Image 
          src="/images/madhubani_peacock.png" 
          alt="Authentic Madhubani Peacock Sketch" 
          fill 
          className="object-contain" 
        />
      </motion.div>

      {/* Subtle Sketch: Border running down the left */}
      <motion.div 
        style={{ y: y3 }}
        className="absolute top-1/4 -left-16 w-[200px] h-[800px] grayscale contrast-125 opacity-30 will-change-transform"
      >
        <Image 
          src="/images/madhubani_border.png" 
          alt="Authentic Madhubani Border Sketch" 
          fill 
          className="object-contain" 
        />
      </motion.div>

      {/* Ethereal Mandala top-center */}
      <motion.div 
        style={{ y: y2, rotate: r1 }}
        className="absolute -top-[20%] left-1/2 -translate-x-1/2 w-[800px] h-[800px] grayscale contrast-125 opacity-20 will-change-transform"
      >
        <Image 
          src="/images/madhubani_mandala.png" 
          alt="Authentic Madhubani Mandala Sketch" 
          fill 
          className="object-contain" 
        />
      </motion.div>
    </div>
  );
}
