"use client";

import EntranceAnimator from "@/components/EntranceAnimator";
import HeroSection from "@/components/HeroSection";
import ProductGrid from "@/components/ProductGrid";
import ScrollingDividers from "@/components/ScrollingDividers";
import FooterRiver from "@/components/FooterRiver";

export default function Home() {
  return (
    <EntranceAnimator>
      <div className="flex flex-col gap-16 py-8">
        <HeroSection />
        <ScrollingDividers type="elephant" />
        <ProductGrid title="Sarees" />
        <ScrollingDividers type="peacock" />
        <ProductGrid title="Tunics" />
        <ScrollingDividers type="elephant" />
        <ProductGrid title="Yardage" />
      </div>
      <FooterRiver />
    </EntranceAnimator>
  );
}
