"use client";

import React, { useState, useEffect } from 'react';
import { motion, useScroll, useTransform, useSpring } from 'framer-motion';
import Image from 'next/image';
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

  // Create varied movement speeds for a rich, layered parallax effect
  const yFast = useTransform(smoothScrollY, [0, 5000], [0, -500]);
  const ySlow = useTransform(smoothScrollY, [0, 5000], [0, -200]);
  const yReverse = useTransform(smoothScrollY, [0, 5000], [0, 300]);

  if (!mounted || pathname?.startsWith('/admin')) return null;

  return (
    <div className="fixed inset-0 z-40 pointer-events-none overflow-hidden mix-blend-multiply opacity-25">
      
      {/* 
        We create a uniform grid that spans much larger than the viewport 
        so it seamlessly covers the screen and scrolls infinitely. 
      */}
      <div className="absolute inset-[-50%] w-[200%] h-[200%] grid grid-cols-3 md:grid-cols-4 gap-8 opacity-40">
        
        {Array.from({ length: 24 }).map((_, i) => {
          // Assign alternating scroll speeds to create a dynamic tapestry
          const yTransform = i % 3 === 0 ? yFast : i % 3 === 1 ? ySlow : yReverse;
          // Rotate some tiles for a seamless, interlocking look
          const rotateClass = i % 2 === 0 ? "" : "rotate-90";

          return (
            <motion.div 
              key={i}
              style={{ y: yTransform }}
              className={`relative w-full aspect-square grayscale contrast-125 will-change-transform ${rotateClass}`}
            >
              <Image 
                src="/images/madhubani_premium.svg" 
                alt="Premium Madhubani SVG Pattern" 
                fill 
                className="object-cover md:object-contain opacity-50" 
                priority={i < 4}
              />
            </motion.div>
          );
        })}

      </div>
    </div>
  );
}
