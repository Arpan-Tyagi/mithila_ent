"use client";

import EntranceAnimator from "@/components/EntranceAnimator";
import HeroSection from "@/components/HeroSection";
import ProductGrid from "@/components/ProductGrid";
import ScrollingDividers from "@/components/ScrollingDividers";
import FooterRiver from "@/components/FooterRiver";
import FadeUpBlur from "@/components/FadeUpBlur";

export default function Home() {
  return (
    <EntranceAnimator>
      <div className="flex flex-col gap-16 py-8">
        {/* We add FadeUpBlur wrap for the initial load stagger */}
        <FadeUpBlur delay={4}>
          <HeroSection />
        </FadeUpBlur>

        <FadeUpBlur inView={true}>
          <ScrollingDividers type="elephant" />
        </FadeUpBlur>

        <ProductGrid title="Sarees" />

        <FadeUpBlur inView={true}>
          <ScrollingDividers type="peacock" />
        </FadeUpBlur>

        <ProductGrid title="Tunics" />

        <FadeUpBlur inView={true}>
          <ScrollingDividers type="elephant" />
        </FadeUpBlur>

        <ProductGrid title="Yardage" />
      </div>

      <FadeUpBlur inView={true}>
        <FooterRiver />
      </FadeUpBlur>
    </EntranceAnimator>
  );
}
