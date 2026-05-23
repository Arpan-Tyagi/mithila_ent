"use client";

import { motion, useMotionValue, useTransform } from "framer-motion";
import { useState, useEffect } from "react";
import { BloomingMandala, SvgTwigDraw } from "./EntranceAnimator";

export default function HeroSection() {
  const x = useMotionValue(0);
  const y = useMotionValue(0);

  const handleMouseMove = (e: React.MouseEvent) => {
    // Calculate relative to window center
    const rx = (e.clientX - window.innerWidth / 2) / 20;
    const ry = (e.clientY - window.innerHeight / 2) / 20;
    x.set(rx);
    y.set(ry);
  };

  const invertedX = useTransform(x, (value) => -value);
  const invertedY = useTransform(y, (value) => -value);

  return (
    <section
      className="flex flex-col md:flex-row items-center justify-between w-full max-w-6xl mx-auto min-h-[70vh] gap-12 px-4"
      onMouseMove={handleMouseMove}
    >
      {/* Left: Portrait with Parallax and Hover-Rotating Frame */}
      <div className="flex-1 flex justify-center relative w-full h-[500px]">
        {/* The Frame (SVG Placeholder) */}
        <motion.div
          className="absolute inset-0 z-10 flex items-center justify-center"
          whileHover={{ rotate: 360 }}
          transition={{ duration: 20, ease: "linear", repeat: Infinity }}
        >
          <div className="w-[400px] h-[400px] absolute">
            <SvgTwigDraw>
              <circle cx="200" cy="200" r="190" stroke="var(--ink-black)" strokeWidth="6" fill="none" strokeDasharray="10 5" />
              <circle cx="200" cy="200" r="180" stroke="var(--ink-black)" strokeWidth="2" fill="none" />
              {/* Mandala placeholder inside frame */}
              <path d="M200 10 L210 30 L200 50 L190 30 Z" stroke="var(--ink-black)" strokeWidth="2" fill="none" />
              <path d="M200 390 L210 370 L200 350 L190 370 Z" stroke="var(--ink-black)" strokeWidth="2" fill="none" />
              <path d="M10 200 L30 190 L50 200 L30 210 Z" stroke="var(--ink-black)" strokeWidth="2" fill="none" />
              <path d="M390 200 L370 190 L350 200 L370 210 Z" stroke="var(--ink-black)" strokeWidth="2" fill="none" />
            </SvgTwigDraw>
          </div>
        </motion.div>

        {/* The Portrait (Parallax) */}
        <BloomingMandala delay={0.5}>
          <motion.div
            style={{ x: invertedX, y: invertedY }}
            className="w-[380px] h-[380px] mt-2 rounded-full overflow-hidden border-wobble bg-dye-yellow/20 relative z-0 flex items-center justify-center"
          >
            {/* Placeholder for actual image */}
            <span className="font-yatra text-ink-black/50 text-xl text-center px-8">Portrait Image<br/>(Parallax)</span>
          </motion.div>
        </BloomingMandala>
      </div>

      {/* Right: H1 and CTA */}
      <div className="flex-1 flex flex-col justify-center items-start space-y-8 z-20">
        <BloomingMandala delay={1}>
          <h1 className="font-yatra text-5xl md:text-7xl leading-tight text-ink-black">
            Loomed by Hand,<br />
            Loved by <span className="text-dye-red">Heart</span>
          </h1>
        </BloomingMandala>

        <motion.button
          whileHover={{
            scale: 1.05,
            backgroundImage: "url('data:image/svg+xml,%3Csvg viewBox=\"0 0 200 200\" xmlns=\"http://www.w3.org/2000/svg\"%3E%3Cfilter id=\"noise\"%3E%3CfeTurbulence type=\"fractalNoise\" baseFrequency=\"0.8\" numOctaves=\"4\" stitchTiles=\"stitch\"/%3E%3C/filter%3E%3Crect width=\"100%25\" height=\"100%25\" filter=\"url(%23noise)\" opacity=\"0.5\"/%3E%3C/svg%3E')",
            backgroundColor: "var(--dye-yellow)"
          }}
          whileTap={{ scale: 0.95 }}
          className="border-wobble bg-dye-red text-cotton font-yatra text-2xl px-8 py-4 transition-colors duration-500 cursor-none"
        >
          Shop the Collection
        </motion.button>
      </div>
    </section>
  );
}
