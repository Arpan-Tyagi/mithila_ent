import { createClient } from '@/lib/supabase/server';
import Link from 'next/link';
import { Button } from '@/components/ui/Button';

export const revalidate = 3600; // ISR cache for 1 hour

export default async function ShopPage() {
  const supabase = await createClient();
  
  const { data: variants, error } = await supabase
    .from('product_variants')
    .select('*, products(title, slug, weave, is_featured, tags)');
    
  if (error) {
    console.error(error);
  }

  return (
    <main className="flex-grow bg-[var(--unbleached-cotton)] py-16">
      <div className="container mx-auto px-4 md:px-8">
        <h1 className="font-serif text-4xl md:text-5xl font-bold text-[var(--charcoal-ink)] mb-12">
          All Fabrics
        </h1>
        
        {/* Placeholder for Filters */}
        <div className="flex flex-wrap gap-4 mb-12">
          <Button variant="outline" className="text-sm py-2">Cotton</Button>
          <Button variant="outline" className="text-sm py-2">Linen</Button>
          <Button variant="outline" className="text-sm py-2">Silk Blends</Button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-8">
          {variants && variants.length > 0 ? (
            variants.map((variant) => (
              <Link key={variant.id} href={`/product/${variant.products?.slug}`} className="group block">
                <div className="aspect-[4/5] bg-neutral-200 mb-4 overflow-hidden rounded-sm relative border-2 border-transparent group-hover:border-[var(--charcoal-ink)] transition-colors">
                  {variant.images && variant.images[0] ? (
                    <img src={variant.images[0]} alt={variant.products?.title || 'Product'} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700" />
                  ) : (
                    <div className="w-full h-full bg-neutral-300"></div>
                  )}
                  {variant.products?.is_featured && (
                    <span className="absolute top-4 left-4 bg-[var(--turmeric)] text-[var(--charcoal-ink)] text-xs font-bold px-3 py-1 uppercase tracking-widest rounded-sm">
                      Featured
                    </span>
                  )}
                </div>
                <h3 className="font-serif font-bold text-xl text-[var(--charcoal-ink)]">{variant.products?.title}</h3>
                <p className="font-sans text-sm opacity-70 mt-1">{variant.color} • {variant.products?.weave}</p>
                <p className="font-sans font-bold text-[var(--madder-red)] mt-2">₹{variant.price}</p>
              </Link>
            ))
          ) : (
            <div className="col-span-full py-24 text-center opacity-70">
               <p className="font-serif text-2xl">No fabrics found.</p>
               <p className="font-sans mt-2">Our artisans are weaving new creations.</p>
            </div>
          )}
        </div>
      </div>
    </main>
  );
}
