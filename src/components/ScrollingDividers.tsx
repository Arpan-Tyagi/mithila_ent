"use client";

import { motion } from "framer-motion";

interface DividerProps {
  type: "elephant" | "peacock";
}

export default function ScrollingDividers({ type }: DividerProps) {
  // Ultra-detailed Madhubani Elephant
  const Elephant = () => (
    <svg viewBox="0 0 200 120" className="h-28 w-auto mx-8 inline-block overflow-visible" stroke="var(--ink-black)" strokeWidth="1" fill="none">
      {/* Background fill to block lines behind it */}
      <path d="M 30 90 L 30 50 C 30 10, 100 10, 140 20 C 170 25, 180 50, 180 70 Q 180 100, 160 110 Q 140 80, 130 50 L 100 90 Z" fill="var(--cotton)" stroke="none" />

      {/* Scalloped Back Blanket (Jhool) */}
      <path d="M 40 20 C 60 15, 90 15, 110 25 L 110 70 C 90 75, 60 75, 40 70 Z" fill="var(--dye-yellow)" />
      {/* Inner Dense Grid (Kachni) for Blanket */}
      <path d="M 45 25 L 45 65 M 55 23 L 55 67 M 65 21 L 65 69 M 75 20 L 75 71 M 85 20 L 85 71 M 95 21 L 95 69 M 105 23 L 105 67" strokeWidth="0.5" />
      <path d="M 42 30 L 108 30 M 40 40 L 110 40 M 40 50 L 110 50 M 42 60 L 108 60" strokeWidth="0.5" />
      {/* Blanket Tassels (Scallops) */}
      <path d="M 40 70 A 5 5 0 0 0 50 70 A 5 5 0 0 0 60 70 A 5 5 0 0 0 70 70 A 5 5 0 0 0 80 70 A 5 5 0 0 0 90 70 A 5 5 0 0 0 100 70 A 5 5 0 0 0 110 70" fill="var(--dye-red)" strokeWidth="1" />

      {/* Main Body Outline (Double stroke) */}
      <path d="M 30 90 L 30 50 C 30 10, 100 10, 140 20 C 170 25, 180 50, 180 70 Q 180 100, 160 110 Q 140 80, 130 50" strokeWidth="2.5" />
      <path d="M 34 90 L 34 52 C 34 16, 98 16, 137 24 C 165 29, 175 52, 175 69 Q 175 95, 158 103 Q 143 78, 134 50" strokeWidth="0.5" />

      {/* Trunk Details (Bands/Rings) */}
      <path d="M 178 60 L 165 55 M 175 75 L 160 68 M 170 90 L 155 82 M 165 102 L 150 92" strokeWidth="1.5" />
      <path d="M 179 63 L 166 58 M 176 78 L 161 71 M 171 93 L 156 85" strokeWidth="0.5" />

      {/* Eye and Head styling */}
      <path d="M 140 30 Q 155 25, 165 35 Q 150 40, 140 30 Z" fill="var(--cotton)" strokeWidth="1.5" />
      <circle cx="150" cy="32" r="3" fill="var(--ink-black)" />
      {/* Forehead ornament (Bindu/Tika array) */}
      <circle cx="130" cy="22" r="2" fill="var(--dye-red)" />
      <circle cx="120" cy="20" r="2" fill="var(--dye-yellow)" />
      <circle cx="110" cy="18" r="2" fill="var(--dye-red)" />

      {/* Tusk */}
      <path d="M 150 60 Q 170 60, 185 50 Q 170 55, 150 65 Z" fill="var(--cotton)" strokeWidth="1.5" />

      {/* Ear with scalloped edges and inner floral pattern */}
      <path d="M 110 30 C 135 30, 135 70, 110 75 C 90 70, 90 30, 110 30 Z" fill="var(--cotton)" strokeWidth="1.5" />
      <path d="M 110 35 C 128 35, 128 65, 110 68 C 95 65, 95 35, 110 35 Z" fill="var(--dye-indigo)" opacity="0.2" />
      {/* Ear hatching */}
      <path d="M 100 40 L 120 40 M 98 50 L 122 50 M 100 60 L 120 60" strokeWidth="1" strokeDasharray="2 2" />

      {/* Legs with detailed toes and anklets */}
      <path d="M 40 90 L 40 110 L 60 110 L 60 90" strokeWidth="2" fill="var(--cotton)" />
      <path d="M 90 90 L 90 110 L 110 110 L 110 90" strokeWidth="2" fill="var(--cotton)" />
      {/* Anklets */}
      <path d="M 38 100 L 62 100 M 38 103 L 62 103" strokeWidth="1" stroke="var(--dye-red)" />
      <path d="M 88 100 L 112 100 M 88 103 L 112 103" strokeWidth="1" stroke="var(--dye-red)" />
      {/* Toes */}
      <path d="M 40 110 C 45 105, 50 105, 55 110" fill="var(--dye-yellow)" strokeWidth="1" />
      <path d="M 90 110 C 95 105, 100 105, 105 110" fill="var(--dye-yellow)" strokeWidth="1" />

      {/* Tail */}
      <path d="M 30 50 Q 10 60, 15 90" strokeWidth="2" />
      <path d="M 15 90 L 5 105 M 15 90 L 15 108 M 15 90 L 25 105" strokeWidth="1.5" />
    </svg>
  );

  // Ultra-detailed Madhubani Peacock
  const Peacock = () => (
    <motion.svg
      viewBox="0 0 150 120"
      className="h-28 w-auto mx-8 inline-block overflow-visible"
      stroke="var(--ink-black)"
      strokeWidth="1"
      fill="none"
    >
      <path d="M 30 80 L 30 50 C 30 20, 70 20, 80 40 C 100 60, 120 50, 130 40 Z" fill="var(--cotton)" stroke="none" />

      {/* Main Body (Double stroke) */}
      <path d="M 30 80 L 30 50 C 30 20, 70 20, 80 40 C 100 60, 120 50, 130 40" strokeWidth="2" />
      <path d="M 34 78 L 34 52 C 34 26, 68 26, 78 44 C 95 62, 115 54, 125 44" strokeWidth="0.5" />

      {/* Eye and Beak */}
      <path d="M 115 45 Q 120 40, 125 45 Q 120 50, 115 45 Z" fill="var(--cotton)" strokeWidth="1.5" />
      <circle cx="120" cy="45" r="1.5" fill="var(--ink-black)" />
      <path d="M 130 40 L 145 35 L 132 45 Z" fill="var(--dye-yellow)" strokeWidth="1.5" />
      <path d="M 130 40 L 145 35 L 132 45 Z" strokeWidth="0.5" />

      {/* Head Crest (Kalgi) with decorative dots */}
      <path d="M 115 35 L 110 20 M 120 33 L 120 15 M 125 35 L 130 20" strokeWidth="1.5" />
      <circle cx="110" cy="20" r="3" fill="var(--dye-red)" />
      <circle cx="120" cy="15" r="3" fill="var(--dye-yellow)" />
      <circle cx="130" cy="20" r="3" fill="var(--dye-red)" />

      {/* Wing with highly intricate scale hatching */}
      <path d="M 40 50 C 65 40, 90 65, 80 85 C 55 95, 35 70, 40 50 Z" fill="var(--dye-green)" />
      <path d="M 40 50 C 65 40, 90 65, 80 85 C 55 95, 35 70, 40 50 Z" strokeWidth="2" />
      {/* Hatching scales inside wing */}
      <path d="M 45 55 Q 60 50, 65 65" strokeWidth="1" />
      <path d="M 50 65 Q 70 60, 75 75" strokeWidth="1" />
      <path d="M 55 75 Q 75 70, 70 85" strokeWidth="1" />

      {/* Legs */}
      <path d="M 45 85 L 45 110 L 35 115 M 45 110 L 45 118 M 45 110 L 55 115" strokeWidth="2" />
      <path d="M 65 80 L 65 105 L 55 110 M 65 105 L 65 113 M 65 105 L 75 110" strokeWidth="2" />

      {/* Animating Tail Feathers (Ocelli) */}
      <motion.g
        animate={{ y: [0, -6, 0], rotate: [0, 4, 0], transformOrigin: "30px 80px" }}
        transition={{ duration: 2.5, repeat: Infinity, ease: "easeInOut" }}
      >
        {/* Layer 1 (Back) */}
        <path d="M 30 50 Q -20 10, -30 50 Q 0 100, 30 80" fill="var(--dye-indigo)" />
        <path d="M 30 50 Q -20 10, -30 50 Q 0 100, 30 80" strokeWidth="2" />
        {/* Layer 2 (Middle) */}
        <path d="M 30 50 Q 0 -20, -20 -10 Q -20 60, 30 80" fill="var(--dye-red)" />
        <path d="M 30 50 Q 0 -20, -20 -10 Q -20 60, 30 80" strokeWidth="2" />
        {/* Layer 3 (Front) */}
        <path d="M 30 50 Q 30 -30, 10 -20 Q -10 40, 30 80" fill="var(--dye-yellow)" />
        <path d="M 30 50 Q 30 -30, 10 -20 Q -10 40, 30 80" strokeWidth="2" />

        {/* Detailed Eyes (Ocelli) */}
        <g strokeWidth="1.5">
          {/* Eye 1 */}
          <path d="M -20 50 Q -10 40, 0 50 Q -10 60, -20 50 Z" fill="var(--cotton)" />
          <circle cx="-10" cy="50" r="3" fill="var(--ink-black)" />
          {/* Eye 2 */}
          <path d="M -15 15 Q -5 5, 5 15 Q -5 25, -15 15 Z" fill="var(--cotton)" />
          <circle cx="-5" cy="15" r="3" fill="var(--ink-black)" />
          {/* Eye 3 */}
          <path d="M 10 -5 Q 20 -15, 30 -5 Q 20 5, 10 -5 Z" fill="var(--cotton)" />
          <circle cx="20" cy="-5" r="3" fill="var(--ink-black)" />
        </g>
      </motion.g>
    </motion.svg>
  );

  const items = Array.from({ length: 10 });

  return (
    <div className="w-full overflow-hidden border-y-4 border-ink-black py-4 bg-cotton flex items-center relative h-36">
      {/* Detailed Background wobbly track line (Double line) */}
      <div className="absolute top-1/2 left-0 w-full h-[10px] border-y-2 border-ink-black border-dashed -translate-y-1/2 opacity-30"></div>

      <motion.div
        className="flex whitespace-nowrap items-end"
        animate={{ x: ["0%", "-50%"] }}
        transition={{
          duration: type === "elephant" ? 35 : 30,
          ease: "linear",
          repeat: Infinity,
        }}
      >
        {items.map((_, i) => (
          <motion.div
            key={i}
            animate={{ y: [0, i % 2 === 0 ? -3 : 3, 0] }}
            transition={{ duration: 2, repeat: Infinity, ease: "easeInOut", delay: i * 0.3 }}
          >
            {type === "elephant" ? <Elephant /> : <Peacock />}
          </motion.div>
        ))}
        {items.map((_, i) => (
          <motion.div
            key={`dup-${i}`}
            animate={{ y: [0, i % 2 === 0 ? -3 : 3, 0] }}
            transition={{ duration: 2, repeat: Infinity, ease: "easeInOut", delay: i * 0.3 }}
          >
            {type === "elephant" ? <Elephant /> : <Peacock />}
          </motion.div>
        ))}
      </motion.div>
    </div>
  );
}
