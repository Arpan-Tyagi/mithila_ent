import Link from 'next/link';
import { Button } from '@/components/ui/Button';

export default function Home() {
  return (
    <main className="flex-grow">
      {/* HERO SECTION */}
      <section className="relative w-full min-h-[85vh] flex items-center bg-[var(--charcoal-ink)] text-[var(--unbleached-cotton)] overflow-hidden">
        {/* Abstract Background Pattern mimicking Bharni */}
        <div className="absolute inset-0 opacity-10 pointer-events-none" style={{ backgroundImage: 'radial-gradient(circle at 70% 30%, var(--madder-red) 0%, transparent 40%), radial-gradient(circle at 30% 80%, var(--turmeric) 0%, transparent 40%)' }}></div>
        
        <div className="container mx-auto px-4 md:px-8 relative z-10 flex flex-col items-center text-center">
          <span className="font-sans font-bold tracking-[0.3em] text-[var(--turmeric)] mb-6">HERITAGE WOVEN</span>
          <h1 className="font-serif text-5xl md:text-7xl lg:text-8xl font-black max-w-5xl leading-tight mb-8">
            The Canvas of <span className="text-[var(--madder-red)]">Mithila</span>
          </h1>
          <p className="font-sans text-lg md:text-xl max-w-2xl opacity-80 mb-12 leading-relaxed">
            Premium wholesale cotton and linen fabrics, bringing the intricate geometric perfection and earthy tones of Madhubani art to your wardrobe.
          </p>
          <div className="flex flex-col sm:flex-row gap-6">
            <Link href="/shop">
              <Button className="bg-[var(--turmeric)] text-[var(--charcoal-ink)] border-[var(--turmeric)] hover:bg-[var(--madder-red)] hover:text-[var(--unbleached-cotton)] hover:border-[var(--madder-red)]">
                Explore Fabrics
              </Button>
            </Link>
            <Link href="/about">
              <Button variant="outline" className="border-[var(--unbleached-cotton)] text-[var(--unbleached-cotton)] hover:bg-[var(--unbleached-cotton)] hover:text-[var(--charcoal-ink)] hover:border-[var(--unbleached-cotton)]">
                Our Story
              </Button>
            </Link>
          </div>
        </div>
        
        {/* Bottom decorative border */}
        <div className="absolute bottom-0 w-full h-8 kachni-border bg-[var(--unbleached-cotton)]"></div>
      </section>

      {/* FEATURED CATEGORIES SECTION */}
      <section className="py-24 bg-[var(--unbleached-cotton)]">
        <div className="container mx-auto px-4 md:px-8">
          <div className="flex items-center justify-between mb-16">
            <h2 className="font-serif text-4xl md:text-5xl font-bold text-[var(--charcoal-ink)]">Curated Weaves</h2>
            <Link href="/shop" className="hidden md:flex font-sans font-bold tracking-widest text-[var(--madder-red)] hover:text-[var(--turmeric)] transition-colors">
              VIEW ALL
            </Link>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {/* Category Card Placeholder 1 */}
            <Link href="/category/cotton" className="group relative aspect-[4/5] overflow-hidden rounded-sm border-2 border-[var(--charcoal-ink)] bg-white flex flex-col">
              <div className="flex-grow bg-gray-100 flex items-center justify-center relative overflow-hidden">
                {/* Image placeholder */}
                <div className="absolute inset-0 bg-neutral-200 group-hover:scale-105 transition-transform duration-700"></div>
              </div>
              <div className="p-6 border-t-2 border-[var(--charcoal-ink)] bg-[var(--unbleached-cotton)] group-hover:bg-[var(--madder-red)] transition-colors duration-300">
                <h3 className="font-serif text-2xl font-bold text-[var(--charcoal-ink)] group-hover:text-[var(--unbleached-cotton)]">Pure Cotton</h3>
                <p className="font-sans text-sm mt-2 text-[var(--charcoal-ink)] opacity-70 group-hover:text-[var(--unbleached-cotton)]">Breathable everyday weaves.</p>
              </div>
            </Link>
            
            {/* Category Card Placeholder 2 */}
            <Link href="/category/linen" className="group relative aspect-[4/5] overflow-hidden rounded-sm border-2 border-[var(--charcoal-ink)] bg-white flex flex-col">
              <div className="flex-grow bg-gray-100 flex items-center justify-center relative overflow-hidden">
                <div className="absolute inset-0 bg-neutral-300 group-hover:scale-105 transition-transform duration-700"></div>
              </div>
              <div className="p-6 border-t-2 border-[var(--charcoal-ink)] bg-[var(--unbleached-cotton)] group-hover:bg-[var(--turmeric)] transition-colors duration-300">
                <h3 className="font-serif text-2xl font-bold text-[var(--charcoal-ink)] group-hover:text-[var(--charcoal-ink)]">Fine Linen</h3>
                <p className="font-sans text-sm mt-2 text-[var(--charcoal-ink)] opacity-70 group-hover:text-[var(--charcoal-ink)]">Structured, elegant drapes.</p>
              </div>
            </Link>

             {/* Category Card Placeholder 3 */}
             <Link href="/category/blends" className="group relative aspect-[4/5] overflow-hidden rounded-sm border-2 border-[var(--charcoal-ink)] bg-white flex flex-col">
              <div className="flex-grow bg-gray-100 flex items-center justify-center relative overflow-hidden">
                <div className="absolute inset-0 bg-neutral-400 group-hover:scale-105 transition-transform duration-700"></div>
              </div>
              <div className="p-6 border-t-2 border-[var(--charcoal-ink)] bg-[var(--unbleached-cotton)] group-hover:bg-[var(--indigo-dye)] transition-colors duration-300">
                <h3 className="font-serif text-2xl font-bold text-[var(--charcoal-ink)] group-hover:text-[var(--unbleached-cotton)]">Heritage Blends</h3>
                <p className="font-sans text-sm mt-2 text-[var(--charcoal-ink)] opacity-70 group-hover:text-[var(--unbleached-cotton)]">Complex textures and strength.</p>
              </div>
            </Link>
          </div>
        </div>
      </section>
    </main>
  );
}
