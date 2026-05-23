"use client";

import { motion, useScroll, useTransform } from "framer-motion";
import { useRef } from "react";

export default function FooterRiver() {
  const containerRef = useRef<HTMLDivElement>(null);

  const { scrollYProgress } = useScroll({
    target: containerRef,
    offset: ["start end", "end end"]
  });

  // Map scroll progress to horizontal movement for waves and fish
  const wave1X = useTransform(scrollYProgress, [0, 1], ["0%", "-10%"]);
  const wave2X = useTransform(scrollYProgress, [0, 1], ["-10%", "0%"]);

  const fishTranslateX = useTransform(scrollYProgress, [0, 1], [0, 200]);
  const fishTranslateXReverse = useTransform(scrollYProgress, [0, 1], [200, 0]);

  return (
    <footer ref={containerRef} className="w-full relative mt-24 pt-12 border-t-8 border-double border-ink-black overflow-hidden bg-cotton text-ink-black">

      {/* 3 Column Layout */}
      <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-3 gap-12 px-6 mb-32 z-10 relative font-lora">
        <div>
          <h3 className="font-yatra text-2xl text-dye-red mb-4">Information</h3>
          <ul className="space-y-2">
            <li><a href="#" className="hover:text-dye-indigo bharni-hover inline-block px-1">Our Heritage</a></li>
            <li><a href="#" className="hover:text-dye-indigo bharni-hover inline-block px-1">The Dyes</a></li>
            <li><a href="#" className="hover:text-dye-indigo bharni-hover inline-block px-1">Sustainability</a></li>
          </ul>
        </div>
        <div>
          <h3 className="font-yatra text-2xl text-dye-indigo mb-4">Customer Support</h3>
          <ul className="space-y-2">
            <li><a href="#" className="hover:text-dye-red bharni-hover inline-block px-1">Shipping & Returns</a></li>
            <li><a href="#" className="hover:text-dye-red bharni-hover inline-block px-1">Fabric Care</a></li>
            <li><a href="#" className="hover:text-dye-red bharni-hover inline-block px-1">Contact Artisans</a></li>
          </ul>
        </div>
        <div>
          <h3 className="font-yatra text-2xl text-dye-green mb-4">Socials</h3>
          <ul className="space-y-2">
            <li><a href="#" className="hover:text-dye-yellow bharni-hover inline-block px-1">Instagram</a></li>
            <li><a href="#" className="hover:text-dye-yellow bharni-hover inline-block px-1">Pinterest</a></li>
            <li><a href="#" className="hover:text-dye-yellow bharni-hover inline-block px-1">Newsletter</a></li>
          </ul>
        </div>
      </div>

      {/* The River SVG Container */}
      <div className="absolute bottom-0 left-0 w-full h-[200px] z-0 overflow-hidden pointer-events-none">
        <svg viewBox="0 0 1000 200" preserveAspectRatio="none" className="w-[150%] h-full opacity-80" stroke="var(--ink-black)" strokeWidth="2" fill="none">

          {/* Wave 1 */}
          <motion.path
            style={{ x: wave1X }}
            d="M0,100 Q100,50 200,100 T400,100 T600,100 T800,100 T1000,100 T1200,100 T1400,100 T1600,100"
            stroke="var(--dye-indigo)"
            strokeWidth="4"
          />
          {/* Wave 2 */}
          <motion.path
            style={{ x: wave2X }}
            d="M0,130 Q100,180 200,130 T400,130 T600,130 T800,130 T1000,130 T1200,130 T1400,130 T1600,130"
            stroke="var(--dye-indigo)"
            strokeWidth="2"
            strokeDasharray="10 5"
          />

          {/* Lotus */}
          <path d="M250,110 C230,80 270,80 250,110 Z M250,110 C220,100 220,120 250,110 Z M250,110 C280,100 280,120 250,110 Z" fill="var(--dye-red)" stroke="var(--ink-black)" strokeWidth="2"/>
          <path d="M750,140 C730,110 770,110 750,140 Z M750,140 C720,130 720,150 750,140 Z M750,140 C780,130 780,150 750,140 Z" fill="var(--dye-red)" stroke="var(--ink-black)" strokeWidth="2"/>

          {/* Fish 1 (swimming right) */}
          <motion.g style={{ x: fishTranslateX }}>
            <path d="M100,150 Q130,120 160,150 Q130,180 100,150 Z" fill="var(--dye-yellow)" stroke="var(--ink-black)"/>
            <path d="M100,150 L80,130 L80,170 Z" fill="var(--dye-yellow)" stroke="var(--ink-black)"/>
            <circle cx="140" cy="145" r="2" fill="var(--ink-black)"/>
          </motion.g>

          {/* Fish 2 (swimming left) */}
          <motion.g style={{ x: fishTranslateXReverse }}>
            <path d="M800,80 Q770,50 740,80 Q770,110 800,80 Z" fill="var(--dye-green)" stroke="var(--ink-black)"/>
            <path d="M800,80 L820,60 L820,100 Z" fill="var(--dye-green)" stroke="var(--ink-black)"/>
            <circle cx="760" cy="75" r="2" fill="var(--ink-black)"/>
          </motion.g>

        </svg>
      </div>
    </footer>
  );
}
