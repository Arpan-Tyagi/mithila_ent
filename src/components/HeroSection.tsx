"use client";

import { motion, useMotionValue, useTransform } from "framer-motion";
import { BloomingMandala, SvgTwigDraw } from "./EntranceAnimator";

export default function HeroSection() {
  const x = useMotionValue(0);
  const y = useMotionValue(0);

  const handleMouseMove = (e: React.MouseEvent) => {
    const rx = (e.clientX - window.innerWidth / 2) / 20;
    const ry = (e.clientY - window.innerHeight / 2) / 20;
    x.set(rx);
    y.set(ry);
  };

  const invertedX = useTransform(x, (value) => -value);
  const invertedY = useTransform(y, (value) => -value);

  // Generate an array of 24 petals for the intricate mandala border
  const generatePetals = () => {
    let petals = [];
    for (let i = 0; i < 24; i++) {
      const angle = (i * 15 * Math.PI) / 180;
      const x1 = 200 + Math.cos(angle) * 160;
      const y1 = 200 + Math.sin(angle) * 160;
      const x2 = 200 + Math.cos(angle + (7.5 * Math.PI) / 180) * 190;
      const y2 = 200 + Math.sin(angle + (7.5 * Math.PI) / 180) * 190;
      const x3 = 200 + Math.cos(angle + (15 * Math.PI) / 180) * 160;
      const y3 = 200 + Math.sin(angle + (15 * Math.PI) / 180) * 160;

      petals.push(
        <g key={`petal-${i}`}>
          <path d={`M ${x1} ${y1} Q ${x2} ${y2} ${x3} ${y3}`} fill="none" stroke="var(--ink-black)" strokeWidth="2" />
          {/* Inner Kachni lines for the petal */}
          <path d={`M ${x1} ${y1} Q ${x2 * 0.95 + 10} ${y2 * 0.95 + 10} ${x3} ${y3}`} fill="none" stroke="var(--dye-red)" strokeWidth="1" />
          <path d={`M ${x1} ${y1} Q ${x2 * 0.9 + 20} ${y2 * 0.9 + 20} ${x3} ${y3}`} fill="none" stroke="var(--ink-black)" strokeWidth="1" />
        </g>
      );
    }
    return petals;
  };

  return (
    <section
      className="flex flex-col md:flex-row items-center justify-between w-full max-w-6xl mx-auto min-h-[70vh] gap-12 px-4"
      onMouseMove={handleMouseMove}
    >
      {/* Left: Portrait with Parallax and Hover-Rotating Frame */}
      <div className="flex-1 flex justify-center relative w-full h-[500px]">
        {/* The Frame (Intricate Mandala SVG) */}
        <motion.div
          className="absolute inset-0 z-10 flex items-center justify-center"
          whileHover={{ rotate: 360 }}
          transition={{ duration: 40, ease: "linear", repeat: Infinity }}
        >
          <div className="w-[450px] h-[450px] absolute">
            <SvgTwigDraw>
              {/* Outer double border */}
              <circle cx="200" cy="200" r="198" stroke="var(--ink-black)" strokeWidth="4" fill="none" />
              <circle cx="200" cy="200" r="190" stroke="var(--ink-black)" strokeWidth="2" fill="none" />

              {/* Geometric triangle border (repeating zig-zag) */}
              <path d="M 200 10 L 210 20 L 220 10 L 230 20 L 240 10 ... " stroke="var(--ink-black)" strokeWidth="2" fill="none" />
              {/* Generate a zig-zag using stroke-dasharray trick on a thick border */}
              <circle cx="200" cy="200" r="185" stroke="var(--dye-yellow)" strokeWidth="6" strokeDasharray="10 10" fill="none" />
              <circle cx="200" cy="200" r="185" stroke="var(--ink-black)" strokeWidth="2" strokeDasharray="10 10" strokeDashoffset="5" fill="none" />

              {/* Middle boundary */}
              <circle cx="200" cy="200" r="175" stroke="var(--ink-black)" strokeWidth="2" fill="none" />

              {/* The Lotus Petals */}
              {generatePetals()}

              {/* Inner frame for the image */}
              <circle cx="200" cy="200" r="155" stroke="var(--ink-black)" strokeWidth="4" fill="none" />
              <circle cx="200" cy="200" r="148" stroke="var(--ink-black)" strokeWidth="2" fill="none" strokeDasharray="4 4" />
              <circle cx="200" cy="200" r="142" stroke="var(--ink-black)" strokeWidth="2" fill="none" />
            </SvgTwigDraw>
          </div>
        </motion.div>

        {/* The Portrait (Parallax) */}
        <BloomingMandala delay={0.5}>
          <motion.div
            style={{ x: invertedX, y: invertedY }}
            className="w-[280px] h-[280px] mt-16 rounded-full overflow-hidden border-wobble bg-dye-yellow/20 relative z-0 flex items-center justify-center border-4 border-ink-black"
          >
            {/* Highly stylized inner face placeholder */}
            <svg viewBox="0 0 100 100" className="w-full h-full opacity-60" stroke="var(--ink-black)" strokeWidth="1" fill="none">
              {/* Profile silhouette */}
              <path d="M50 10 C 30 10, 20 40, 25 70 C 25 80, 40 95, 50 95 C 60 95, 75 80, 75 70 C 80 40, 70 10, 50 10" fill="var(--cotton)"/>
              {/* Large almond eye */}
              <path d="M35 45 Q 50 35, 65 45 Q 50 55, 35 45" strokeWidth="2"/>
              <circle cx="50" cy="45" r="5" fill="var(--ink-black)"/>
              {/* Eyebrow */}
              <path d="M30 35 Q 50 25, 70 35" strokeWidth="3"/>
              {/* Nose ring (Nath) */}
              <circle cx="65" cy="65" r="8" strokeWidth="1"/>
              <path d="M73 65 L 85 60" />
            </svg>
          </motion.div>
        </BloomingMandala>
      </div>

      {/* Right: H1 and CTA */}
      <div className="flex-1 flex flex-col justify-center items-start space-y-8 z-20">
        <BloomingMandala delay={1}>
          <h1 className="font-yatra text-5xl md:text-7xl leading-tight text-ink-black relative">
            <span className="relative z-10">Loomed by Hand,<br />Loved by <span className="text-dye-red">Heart</span></span>
            {/* Subtle brush stroke behind the text */}
            <svg className="absolute -z-10 -bottom-4 -left-4 w-[110%] h-[60px] opacity-20" viewBox="0 0 400 50" preserveAspectRatio="none">
              <path d="M 10 25 Q 100 5, 200 25 T 390 25" stroke="var(--dye-yellow)" strokeWidth="20" strokeLinecap="round" fill="none" />
            </svg>
          </h1>
        </BloomingMandala>

        <motion.button
          whileHover={{
            scale: 1.05,
            backgroundImage: "url('data:image/svg+xml,%3Csvg viewBox=\"0 0 200 200\" xmlns=\"http://www.w3.org/2000/svg\"%3E%3Cfilter id=\"noise\"%3E%3CfeTurbulence type=\"fractalNoise\" baseFrequency=\"0.8\" numOctaves=\"4\" stitchTiles=\"stitch\"/%3E%3C/filter%3E%3Crect width=\"100%25\" height=\"100%25\" filter=\"url(%23noise)\" opacity=\"0.5\"/%3E%3C/svg%3E')",
            backgroundColor: "var(--dye-yellow)"
          }}
          whileTap={{ scale: 0.95 }}
          className="border-wobble bg-dye-red text-cotton font-yatra text-2xl px-8 py-4 transition-colors duration-500 cursor-none relative overflow-hidden group"
        >
          <span className="relative z-10">Shop the Collection</span>
          {/* Inner detailed kachni border for the button on hover */}
          <div className="absolute inset-2 border-2 border-dashed border-ink-black opacity-0 group-hover:opacity-50 transition-opacity"></div>
        </motion.button>
      </div>
    </section>
  );
}
