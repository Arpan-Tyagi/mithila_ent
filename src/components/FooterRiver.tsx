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

  // Generate repeating detailed waves with dual-line parallel rendering
  const generateWaves = (yOffset: number, amplitude: number, frequency: number, isDashed: boolean) => {
    let d = `M 0,${yOffset}`;
    for (let i = 0; i <= 2000; i += frequency) {
      d += ` Q ${i + frequency/2},${yOffset - amplitude} ${i + frequency},${yOffset}`;
    }
    return (
      <g>
        <path d={d} stroke="var(--dye-indigo)" strokeWidth={isDashed ? "2" : "3"} fill="none" strokeDasharray={isDashed ? "5 5" : "none"} />
        <path d={d} transform="translate(0, 5)" stroke="var(--ink-black)" strokeWidth="1" fill="none" strokeDasharray={isDashed ? "5 5" : "none"} />
        <path d={d} transform="translate(0, 10)" stroke="var(--dye-indigo)" strokeWidth={isDashed ? "1" : "2"} fill="none" strokeDasharray={isDashed ? "5 5" : "none"} />
      </g>
    );
  };

  const DetailedLotus = ({ cx, cy, scale = 1 }: { cx: number, cy: number, scale?: number }) => (
    <g transform={`translate(${cx}, ${cy}) scale(${scale})`} stroke="var(--ink-black)" strokeWidth="1.5">
      {/* Back Petals with pointed tips */}
      <path d="M 0 0 C -30 -20, -30 -50, 0 -40 C 30 -50, 30 -20, 0 0" fill="var(--dye-yellow)" />
      {/* Hatching for back petals */}
      <path d="M 0 -10 L 0 -35 M -5 -5 L -15 -30 M 5 -5 L 15 -30" strokeWidth="0.5" />

      {/* Side Petals */}
      <path d="M 0 0 C -50 0, -40 -40, 0 -15" fill="var(--dye-red)" />
      <path d="M 0 -2 L -30 -15 M 0 -5 L -20 -25 M -5 -10 L -15 -30" strokeWidth="0.5" />

      <path d="M 0 0 C 50 0, 40 -40, 0 -15" fill="var(--dye-red)" />
      <path d="M 0 -2 L 30 -15 M 0 -5 L 20 -25 M 5 -10 L 15 -30" strokeWidth="0.5" />

      {/* Front Petals */}
      <path d="M 0 0 C -20 15, -15 35, 0 25 C 15 35, 20 15, 0 0" fill="var(--dye-yellow)" />
      <path d="M 0 5 L 0 20 M -5 5 L -10 15 M 5 5 L 10 15" strokeWidth="0.5" />

      <path d="M 0 0 C -30 -10, -20 -45, 0 -30 C 20 -45, 30 -10, 0 0" fill="var(--dye-red)" />
      <path d="M 0 -5 L 0 -25 M -5 -5 L -10 -20 M 5 -5 L 10 -20" strokeWidth="0.5" />

      {/* Center Pod */}
      <path d="M 0 0 C -15 -5, -10 -20, 0 -20 C 10 -20, 15 -5, 0 0" fill="var(--dye-green)" />
      <circle cx="-3" cy="-10" r="1.5" fill="var(--ink-black)" />
      <circle cx="3" cy="-10" r="1.5" fill="var(--ink-black)" />
      <circle cx="0" cy="-15" r="1.5" fill="var(--ink-black)" />
    </g>
  );

  const DetailedFish = ({ cx, cy, isFlipped = false }: { cx: number, cy: number, isFlipped?: boolean }) => (
    <g transform={`translate(${cx}, ${cy}) ${isFlipped ? 'scale(-1, 1)' : ''}`} stroke="var(--ink-black)" strokeWidth="1.5">
      {/* Tail with dense parallel hatching */}
      <path d="M -5 0 L -30 -25 C -25 0, -35 15, -25 25 Z" fill="var(--dye-yellow)" />
      <path d="M -5 0 L -25 -20 M -5 0 L -20 -10 M -5 0 L -25 0 M -5 0 L -20 10 M -5 0 L -20 20" strokeWidth="1" />

      {/* Upper and Lower Fins */}
      <path d="M 15 -18 C 25 -35, 35 -30, 45 -10 Z" fill="var(--dye-green)" />
      <path d="M 20 -18 L 25 -30 M 25 -15 L 30 -28 M 30 -12 L 35 -25" strokeWidth="1" />

      <path d="M 20 15 C 30 35, 40 30, 45 10 Z" fill="var(--dye-green)" />
      <path d="M 25 15 L 30 30 M 30 15 L 35 28 M 35 12 L 40 25" strokeWidth="1" />

      {/* Main Body */}
      <path d="M 0 0 Q 30 -40, 65 0 Q 30 40, 0 0 Z" fill="var(--dye-red)" />

      {/* Semi-circular overlapping scales (Kachni detail) */}
      <path d="M 15 -15 A 5 5 0 0 1 15 15" strokeWidth="1" fill="none" />
      <path d="M 20 -18 A 5 5 0 0 1 20 18" strokeWidth="1" fill="none" />
      <path d="M 25 -20 A 5 5 0 0 1 25 20" strokeWidth="1" fill="none" />
      <path d="M 30 -21 A 5 5 0 0 1 30 21" strokeWidth="1" fill="none" />
      <path d="M 35 -20 A 5 5 0 0 1 35 20" strokeWidth="1" fill="none" />
      <path d="M 40 -18 A 5 5 0 0 1 40 18" strokeWidth="1" fill="none" />

      {/* Face divider */}
      <path d="M 45 -15 Q 40 0, 45 15" strokeWidth="2" />

      {/* Large stylized almond Eye */}
      <path d="M 50 -5 Q 55 -10, 60 -5 Q 55 0, 50 -5 Z" fill="var(--cotton)" strokeWidth="1.5" />
      <circle cx="55" cy="-5" r="2" fill="var(--ink-black)" />
    </g>
  );

  return (
    <footer ref={containerRef} className="w-full relative mt-24 pt-12 border-t-8 border-double border-ink-black overflow-hidden bg-cotton text-ink-black">
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

      <div className="absolute bottom-0 left-0 w-full h-[250px] z-0 overflow-hidden pointer-events-none">
        <svg viewBox="0 0 1000 250" preserveAspectRatio="none" className="w-[150%] h-full opacity-90">
          <rect x="0" y="50" width="2000" height="200" fill="var(--dye-indigo)" opacity="0.05" />

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

          <DetailedLotus cx={200} cy={120} scale={1.2} />
          <DetailedLotus cx={600} cy={180} scale={0.9} />
          <DetailedLotus cx={850} cy={100} scale={1.1} />
          <DetailedLotus cx={1200} cy={160} scale={1.3} />

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
