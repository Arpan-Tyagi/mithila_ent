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

  // Hyper-detailed 48-petal mandala with intermediate leaf motifs
  const generatePetals = () => {
    let petals = [];
    const count = 48;
    const step = 360 / count;

    for (let i = 0; i < count; i++) {
      const angle = (i * step * Math.PI) / 180;
      const angleNext = ((i + 1) * step * Math.PI) / 180;
      const angleMid = ((i + 0.5) * step * Math.PI) / 180;

      const rInner = 150;
      const rOuter = i % 2 === 0 ? 190 : 175; // Alternating petal lengths

      const x1 = 200 + Math.cos(angle) * rInner;
      const y1 = 200 + Math.sin(angle) * rInner;
      const x2 = 200 + Math.cos(angleNext) * rInner;
      const y2 = 200 + Math.sin(angleNext) * rInner;
      const xTip = 200 + Math.cos(angleMid) * rOuter;
      const yTip = 200 + Math.sin(angleMid) * rOuter;

      // Base petal (Bharni)
      petals.push(
        <path
          key={`petal-base-${i}`}
          d={`M ${x1} ${y1} Q ${xTip} ${yTip} ${x2} ${y2}`}
          fill={i % 2 === 0 ? "var(--dye-red)" : "var(--dye-yellow)"}
          stroke="var(--ink-black)"
          strokeWidth="1.5"
        />
      );

      // Extreme Kachni (hatching)
      for (let j = 1; j <= 5; j++) {
        const rHatch = rInner + (rOuter - rInner) * (j / 6);
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
        {/* Intricate Mandala SVG */}
        <motion.div
          className="absolute inset-0 z-10 flex items-center justify-center"
          whileHover={{ rotate: 360 }}
          transition={{ duration: 60, ease: "linear", repeat: Infinity }}
        >
          <div className="w-[480px] h-[480px] absolute">
            <SvgTwigDraw>
              {/* Extreme outer multi-ring border */}
              <circle cx="200" cy="200" r="210" stroke="var(--ink-black)" strokeWidth="6" fill="none" />
              <circle cx="200" cy="200" r="202" stroke="var(--ink-black)" strokeWidth="1" fill="none" strokeDasharray="3 3" />
              <circle cx="200" cy="200" r="198" stroke="var(--dye-green)" strokeWidth="3" fill="none" />
              <circle cx="200" cy="200" r="195" stroke="var(--ink-black)" strokeWidth="1.5" fill="none" />

              {/* Dense zig-zag with dots */}
              <circle cx="200" cy="200" r="190" stroke="var(--dye-yellow)" strokeWidth="8" strokeDasharray="6 6" fill="none" />
              <circle cx="200" cy="200" r="190" stroke="var(--ink-black)" strokeWidth="1.5" strokeDasharray="6 6" strokeDashoffset="3" fill="none" />

              {/* The Lotus Petals */}
              {generatePetals()}

              {/* Inner geometric rings */}
              <circle cx="200" cy="200" r="148" stroke="var(--ink-black)" strokeWidth="4" fill="var(--cotton)" />
              <circle cx="200" cy="200" r="142" stroke="var(--dye-indigo)" strokeWidth="6" strokeDasharray="8 8" fill="none" />
              <circle cx="200" cy="200" r="142" stroke="var(--ink-black)" strokeWidth="1" strokeDasharray="8 8" fill="none" />
              <circle cx="200" cy="200" r="136" stroke="var(--ink-black)" strokeWidth="2" fill="none" />
              <circle cx="200" cy="200" r="130" stroke="var(--ink-black)" strokeWidth="1" fill="none" strokeDasharray="2 6" strokeLinecap="round" />
            </SvgTwigDraw>
          </div>
        </motion.div>

        {/* The Portrait (Parallax) */}
        <BloomingMandala delay={0.5}>
          <motion.div
            style={{ x: invertedX, y: invertedY }}
            className="w-[260px] h-[260px] mt-16 rounded-full overflow-hidden bg-dye-yellow/20 relative z-20 flex items-center justify-center border-4 border-ink-black shadow-none"
          >
            {/* Hyper-detailed inner face */}
            <svg viewBox="0 0 100 100" className="w-full h-full opacity-100" stroke="var(--ink-black)" strokeWidth="0.8" fill="none">
              {/* Heavy background foliage (Kachni filler) */}
              <path d="M 5 20 Q 20 10, 30 30 T 15 50 T 25 70 T 5 90" strokeWidth="0.5" strokeDasharray="1 1" />
              <path d="M 95 10 Q 75 20, 85 40 T 70 60 T 90 80 T 80 95" strokeWidth="0.5" strokeDasharray="1 1" />

              {/* Complex Hair (Dense Hatching) */}
              <path d="M 45 5 C 70 5, 85 10, 95 30 C 85 20, 70 15, 45 15 Z" fill="var(--ink-black)" />
              <path d="M 45 15 C 70 15, 80 20, 90 35 C 80 25, 70 20, 45 25 Z" fill="var(--ink-black)" />
              <path d="M 45 25 C 65 25, 75 30, 85 45 C 75 35, 65 30, 45 35 Z" fill="var(--ink-black)" />

              {/* Profile silhouette */}
              <path d="M 45 5 C 20 10, 10 35, 20 70 C 25 85, 45 95, 60 90 C 80 85, 90 40, 45 5 Z" fill="var(--cotton)" strokeWidth="1.5" />

              {/* The Eye (Extremely detailed) */}
              <path d="M 32 45 C 45 30, 68 35, 78 45 C 62 58, 45 55, 32 45 Z" fill="var(--cotton)" strokeWidth="1.5" />
              <circle cx="55" cy="45" r="8" fill="var(--ink-black)" />
              <circle cx="57" cy="43" r="2.5" fill="var(--cotton)" stroke="none" />
              <circle cx="53" cy="46" r="1" fill="var(--cotton)" stroke="none" />

              {/* Eyelashes */}
              <path d="M 40 37 L 38 33 M 50 35 L 50 30 M 60 36 L 64 32 M 70 40 L 75 37" strokeWidth="1" />

              {/* Eyebrow */}
              <path d="M 28 35 C 48 18, 78 28, 85 35" strokeWidth="3" />

              {/* Elaborate Nath (Nose Ring) with pearls */}
              <path d="M 75 45 Q 88 62, 70 72" strokeWidth="1.5" />
              <circle cx="75" cy="65" r="12" strokeWidth="1" fill="none" />
              <circle cx="87" cy="65" r="2" fill="var(--dye-red)" />
              <circle cx="85" cy="58" r="1.5" fill="var(--dye-yellow)" />
              <circle cx="85" cy="72" r="1.5" fill="var(--dye-yellow)" />
              <circle cx="75" cy="53" r="2" fill="var(--dye-green)" />

              {/* Lips with division line */}
              <path d="M 58 80 Q 70 75, 65 85 Q 55 85, 58 80 Z" fill="var(--dye-red)" strokeWidth="1" />
              <path d="M 58 80 Q 64 82, 65 85" strokeWidth="1" stroke="var(--ink-black)" />

              {/* Elaborate Jewelry (Earring / Jhumka) */}
              <circle cx="35" cy="60" r="3" fill="var(--dye-red)" strokeWidth="1" />
              <path d="M 35 63 L 30 75 Q 35 78, 40 75 Z" fill="var(--dye-yellow)" strokeWidth="1" />
              <path d="M 30 75 L 30 80 M 35 77 L 35 82 M 40 75 L 40 80" strokeWidth="0.5" />

              {/* Necklace */}
              <path d="M 20 70 Q 30 85, 45 85" strokeWidth="2" stroke="var(--dye-green)" />
              <path d="M 18 75 Q 30 92, 48 92" strokeWidth="2" stroke="var(--dye-yellow)" strokeDasharray="2 2" />
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
          <div className="absolute inset-2 border-[3px] border-dotted border-ink-black opacity-0 group-hover:opacity-60 transition-opacity"></div>
        </motion.button>
      </div>
    </section>
  );
}
