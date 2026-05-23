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

  // Generate an array of 36 dense petals with internal hatching for the mandala border
  const generatePetals = () => {
    let petals = [];
    const count = 36;
    const step = 360 / count;

    for (let i = 0; i < count; i++) {
      const angle = (i * step * Math.PI) / 180;
      const angleNext = ((i + 1) * step * Math.PI) / 180;
      const angleMid = ((i + 0.5) * step * Math.PI) / 180;

      const rInner = 165;
      const rOuter = 190;

      const x1 = 200 + Math.cos(angle) * rInner;
      const y1 = 200 + Math.sin(angle) * rInner;
      const x2 = 200 + Math.cos(angleNext) * rInner;
      const y2 = 200 + Math.sin(angleNext) * rInner;
      const xTip = 200 + Math.cos(angleMid) * rOuter;
      const yTip = 200 + Math.sin(angleMid) * rOuter;

      // Base petal
      petals.push(
        <path
          key={`petal-base-${i}`}
          d={`M ${x1} ${y1} Q ${xTip} ${yTip} ${x2} ${y2}`}
          fill={i % 2 === 0 ? "var(--dye-red)" : "var(--dye-yellow)"}
          stroke="var(--ink-black)"
          strokeWidth="1.5"
        />
      );

      // Inner dense Kachni (hatching)
      for (let j = 1; j <= 3; j++) {
        const rHatch = rInner + (rOuter - rInner) * (j / 4);
        const xHatchTip = 200 + Math.cos(angleMid) * rHatch;
        const yHatchTip = 200 + Math.sin(angleMid) * rHatch;
        petals.push(
          <path
            key={`petal-hatch-${i}-${j}`}
            d={`M ${(x1 + x2)/2} ${(y1 + y2)/2} L ${xHatchTip} ${yHatchTip}`}
            fill="none"
            stroke="var(--ink-black)"
            strokeWidth="0.5"
          />
        );
      }
    }
    return petals;
  };

  return (
    <section
      className="flex flex-col md:flex-row items-center justify-between w-full max-w-6xl mx-auto min-h-[70vh] gap-12 px-4"
      onMouseMove={handleMouseMove}
    >
      <div className="flex-1 flex justify-center relative w-full h-[500px]">
        {/* The Frame (Intricate Mandala SVG) */}
        <motion.div
          className="absolute inset-0 z-10 flex items-center justify-center"
          whileHover={{ rotate: 360 }}
          transition={{ duration: 40, ease: "linear", repeat: Infinity }}
        >
          <div className="w-[450px] h-[450px] absolute">
            <SvgTwigDraw>
              {/* Outer thick double border simulating hand-drawn wobble */}
              <path d="M 20 200 A 180 180 0 1 1 380 200 A 180 180 0 1 1 20 200" stroke="var(--ink-black)" strokeWidth="4" fill="none" />
              <path d="M 25 200 A 175 175 0 1 1 375 200 A 175 175 0 1 1 25 200" stroke="var(--ink-black)" strokeWidth="1.5" fill="none" />

              {/* Dense zig-zag border */}
              <circle cx="200" cy="200" r="195" stroke="var(--dye-yellow)" strokeWidth="6" strokeDasharray="5 5" fill="none" />
              <circle cx="200" cy="200" r="195" stroke="var(--ink-black)" strokeWidth="1" strokeDasharray="5 5" strokeDashoffset="2.5" fill="none" />

              {/* The Lotus Petals */}
              {generatePetals()}

              {/* Inner frame containing the portrait */}
              <circle cx="200" cy="200" r="160" stroke="var(--ink-black)" strokeWidth="3" fill="var(--cotton)" />
              <circle cx="200" cy="200" r="155" stroke="var(--ink-black)" strokeWidth="1" fill="none" />
              {/* Inner decorative dots */}
              <circle cx="200" cy="200" r="150" stroke="var(--dye-red)" strokeWidth="4" strokeDasharray="1 8" fill="none" strokeLinecap="round" />
            </SvgTwigDraw>
          </div>
        </motion.div>

        {/* The Portrait (Parallax) */}
        <BloomingMandala delay={0.5}>
          <motion.div
            style={{ x: invertedX, y: invertedY }}
            className="w-[300px] h-[300px] mt-12 rounded-full overflow-hidden bg-dye-yellow/10 relative z-20 flex items-center justify-center border-4 border-ink-black"
          >
            {/* Highly stylized inner face with Madhubani motifs */}
            <svg viewBox="0 0 100 100" className="w-full h-full opacity-90" stroke="var(--ink-black)" strokeWidth="0.8" fill="none">
              {/* Background texture vines */}
              <path d="M 10 10 Q 30 30 10 50 T 10 90 M 90 10 Q 70 30 90 50 T 90 90" strokeWidth="0.5" opacity="0.3" strokeDasharray="2 2" />

              {/* Profile silhouette */}
              <path d="M 50 5 C 20 5, 10 40, 20 75 C 25 90, 45 95, 60 90 C 80 80, 85 40, 50 5 Z" fill="var(--cotton)" strokeWidth="1.5" />

              {/* Signature Madhubani Almond Eye */}
              <path d="M 35 45 C 45 30, 65 35, 75 45 C 60 55, 45 55, 35 45 Z" fill="var(--cotton)" strokeWidth="1.5" />
              <circle cx="55" cy="45" r="7" fill="var(--ink-black)" />
              <circle cx="57" cy="43" r="2" fill="var(--cotton)" stroke="none" /> {/* Eye highlight */}

              {/* Sharp, curved Eyebrow */}
              <path d="M 30 35 C 50 20, 75 30, 80 35" strokeWidth="2.5" />

              {/* Nose and Nath (Nose Ring) */}
              <path d="M 75 45 Q 85 60, 70 70" strokeWidth="1.5" />
              <circle cx="75" cy="65" r="10" strokeWidth="1" strokeDasharray="1 1" fill="none" />
              <circle cx="75" cy="55" r="2" fill="var(--dye-red)" />

              {/* Lips */}
              <path d="M 60 80 Q 70 75, 65 85 Q 55 85, 60 80 Z" fill="var(--dye-red)" strokeWidth="1" />

              {/* Hair/Crown styling */}
              <path d="M 50 5 C 60 10, 70 5, 80 15 C 70 20, 60 15, 50 25 Z" fill="var(--ink-black)" />
              <path d="M 50 5 C 40 10, 30 5, 20 15 C 30 20, 40 15, 50 25 Z" fill="var(--ink-black)" />
            </svg>
          </motion.div>
        </BloomingMandala>
      </div>

      {/* Right: H1 and CTA */}
      <div className="flex-1 flex flex-col justify-center items-start space-y-8 z-30">
        <BloomingMandala delay={1}>
          <h1 className="font-yatra text-5xl md:text-7xl leading-tight text-ink-black relative">
            <span className="relative z-10">Loomed by Hand,<br />Loved by <span className="text-dye-red">Heart</span></span>
          </h1>
        </BloomingMandala>

        <motion.button
          whileHover={{
            scale: 1.05,
            backgroundColor: "var(--dye-yellow)"
          }}
          whileTap={{ scale: 0.95 }}
          className="border-wobble bg-dye-red text-cotton font-yatra text-2xl px-8 py-4 transition-colors duration-500 cursor-none relative overflow-hidden group"
        >
          <span className="relative z-10">Shop the Collection</span>
          {/* Dense kachni border for the button on hover */}
          <div className="absolute inset-2 border-[3px] border-dotted border-ink-black opacity-0 group-hover:opacity-60 transition-opacity"></div>
        </motion.button>
      </div>
    </section>
  );
}
