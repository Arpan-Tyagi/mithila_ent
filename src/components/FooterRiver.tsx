"use client";

import { motion, useScroll, useTransform } from "framer-motion";
import { useRef } from "react";

export default function FooterRiver() {
  const containerRef = useRef<HTMLDivElement>(null);

  const { scrollYProgress } = useScroll({
    target: containerRef,
    offset: ["start end", "end end"]
  });

  const wave1X = useTransform(scrollYProgress, [0, 1], ["0%", "-5%"]);
  const wave2X = useTransform(scrollYProgress, [0, 1], ["-5%", "0%"]);

  const fishTranslateX = useTransform(scrollYProgress, [0, 1], [0, 150]);
  const fishTranslateXReverse = useTransform(scrollYProgress, [0, 1], [150, 0]);

  // Generate repeating detailed waves
  const generateWaves = (yOffset: number, amplitude: number, frequency: number, isDashed: boolean) => {
    let d = `M 0,${yOffset}`;
    for (let i = 0; i <= 2000; i += frequency) {
      d += ` Q ${i + frequency/2},${yOffset - amplitude} ${i + frequency},${yOffset}`;
    }
    return (
      <g>
        <path d={d} stroke="var(--dye-indigo)" strokeWidth={isDashed ? "1" : "3"} fill="none" strokeDasharray={isDashed ? "4 4" : "none"} />
        {!isDashed && <path d={d} transform="translate(0, 5)" stroke="var(--ink-black)" strokeWidth="1" fill="none" />}
      </g>
    );
  };

  const DetailedLotus = ({ cx, cy, scale = 1 }: { cx: number, cy: number, scale?: number }) => (
    <g transform={`translate(${cx}, ${cy}) scale(${scale})`} stroke="var(--ink-black)" strokeWidth="1.5">
      {/* Outer Glow / Padding */}
      <circle cx="0" cy="0" r="35" fill="var(--cotton)" opacity="0.8" stroke="none" />
      {/* Back Petals */}
      <path d="M 0 0 C -30 -20, -20 -40, 0 -30 C 20 -40, 30 -20, 0 0" fill="var(--dye-yellow)" />
      {/* Side Petals */}
      <path d="M 0 0 C -40 0, -30 -30, 0 -15" fill="var(--dye-red)" />
      <path d="M 0 0 C 40 0, 30 -30, 0 -15" fill="var(--dye-red)" />
      {/* Front Petals */}
      <path d="M 0 0 C -20 10, -10 30, 0 20 C 10 30, 20 10, 0 0" fill="var(--dye-yellow)" />
      <path d="M 0 0 C -25 -10, -15 -35, 0 -25 C 15 -35, 25 -10, 0 0" fill="var(--dye-red)" />
      {/* Center Pod */}
      <path d="M 0 0 C -10 -5, -5 -15, 0 -15 C 5 -15, 10 -5, 0 0" fill="var(--dye-green)" />
      <circle cx="0" cy="-7" r="1.5" fill="var(--ink-black)" />
    </g>
  );

  const DetailedFish = ({ cx, cy, isFlipped = false }: { cx: number, cy: number, isFlipped?: boolean }) => (
    <g transform={`translate(${cx}, ${cy}) ${isFlipped ? 'scale(-1, 1)' : ''}`} stroke="var(--ink-black)" strokeWidth="1.5">
      {/* Body Glow */}
      <path d="M 0 0 Q 30 -30, 60 0 Q 30 30, 0 0 Z" fill="var(--cotton)" opacity="0.8" stroke="none" />
      {/* Tail */}
      <path d="M -5 0 L -25 -20 C -20 0, -30 10, -25 20 Z" fill="var(--dye-yellow)" />
      <path d="M -5 0 L -15 -10 M -5 0 L -20 0 M -5 0 L -15 10" strokeWidth="1" />
      {/* Fins */}
      <path d="M 20 -15 C 30 -30, 40 -20, 40 -10 Z" fill="var(--dye-green)" />
      <path d="M 20 15 C 30 30, 40 20, 40 10 Z" fill="var(--dye-green)" />
      {/* Body */}
      <path d="M 0 0 Q 30 -30, 60 0 Q 30 30, 0 0 Z" fill="var(--dye-red)" opacity="0.2" />
      <path d="M 0 0 Q 30 -30, 60 0 Q 30 30, 0 0 Z" fill="none" />
      {/* Gills and Scales */}
      <path d="M 45 -15 Q 40 0, 45 15" />
      <path d="M 35 -20 Q 30 0, 35 20" strokeWidth="1" />
      <path d="M 25 -20 Q 20 0, 25 20" strokeWidth="1" />
      <path d="M 15 -15 Q 10 0, 15 15" strokeWidth="1" />
      {/* Eye */}
      <circle cx="50" cy="-5" r="3" fill="var(--cotton)" />
      <circle cx="51" cy="-5" r="1.5" fill="var(--ink-black)" />
    </g>
  );

  return (
    <footer ref={containerRef} className="w-full relative mt-24 pt-12 border-t-8 border-double border-ink-black overflow-hidden bg-cotton text-ink-black">

      {/* 3 Column Layout */}
      <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-3 gap-12 px-6 mb-48 z-10 relative font-lora">
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

      {/* The Detailed River SVG Container */}
      <div className="absolute bottom-0 left-0 w-full h-[250px] z-0 overflow-hidden pointer-events-none">
        <svg viewBox="0 0 1000 250" preserveAspectRatio="none" className="w-[150%] h-full opacity-90">

          {/* Background water tint */}
          <rect x="0" y="50" width="2000" height="200" fill="var(--dye-indigo)" opacity="0.05" />

          {/* Animated Waves */}
          <motion.g style={{ x: wave1X }}>
            {generateWaves(80, 15, 100, false)}
            {generateWaves(130, 20, 120, false)}
            {generateWaves(180, 15, 90, false)}
          </motion.g>

          <motion.g style={{ x: wave2X }}>
            {generateWaves(105, 10, 80, true)}
            {generateWaves(155, 12, 110, true)}
            {generateWaves(205, 10, 95, true)}
          </motion.g>

          {/* Static Detailed Lotuses */}
          <DetailedLotus cx={200} cy={120} scale={1.2} />
          <DetailedLotus cx={600} cy={180} scale={0.9} />
          <DetailedLotus cx={850} cy={100} scale={1.1} />
          <DetailedLotus cx={1200} cy={160} scale={1.3} />

          {/* Animated Fish */}
          <motion.g style={{ x: fishTranslateX }}>
            <DetailedFish cx={100} cy={160} />
            <DetailedFish cx={400} cy={110} />
            <DetailedFish cx={1100} cy={140} />
          </motion.g>

          <motion.g style={{ x: fishTranslateXReverse }}>
            <DetailedFish cx={750} cy={140} isFlipped={true} />
            <DetailedFish cx={300} cy={200} isFlipped={true} />
            <DetailedFish cx={950} cy={190} isFlipped={true} />
          </motion.g>

        </svg>
      </div>
    </footer>
  );
}
