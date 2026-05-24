import { createClient } from '@/lib/supabase/server';
import Link from 'next/link';
import { MOCK_VARIANTS } from '@/lib/mock-data';

export const revalidate = 3600; // ISR cache for 1 hour

export default async function ShopPage({ searchParams }: { searchParams: Promise<{ category?: string }> }) {
  const params = await searchParams;
  const category = params.category?.toLowerCase();
  
  const supabase = await createClient();
  const { data: dbVariants, error } = await supabase
    .from('product_variants')
    .select('*, products(title, slug, weave, is_featured, tags)');
    
  if (error) {
    console.error(error);
  }

  // Use mock data if database is empty to ensure a fully working prototype
  let variants = dbVariants && dbVariants.length > 0 ? dbVariants : MOCK_VARIANTS;

  // Apply category filtering
  if (category) {
    variants = variants.filter(v => v.products?.tags?.includes(category));
  }

  return (
    <main className="flex-grow bg-[var(--unbleached-cotton)] pt-32 pb-24 relative overflow-hidden">
      <div className="container mx-auto px-4 md:px-8 max-w-7xl relative z-10">
        
        {/* Page Header */}
        <div className="mb-12 space-y-4">
          <span className="text-xs uppercase font-bold tracking-widest text-[var(--madder-red)]">Premium Collections</span>
          <h1 className="font-serif italic text-4xl md:text-5xl font-bold text-[var(--charcoal-ink)]">
            {category ? `${category.charAt(0).toUpperCase() + category.slice(1)} Registry` : 'Our Fabric Registry'}
          </h1>
          <p className="font-sans text-sm opacity-80 max-w-md leading-relaxed">
            Browse through our organically loomed fabric swatches. Each swatch is hand-selected and dyed in natural plant pigments.
          </p>
        </div>
        
        {/* Clean Filter Sidebar/Header */}
        <div className="flex flex-wrap gap-3 mb-16 border-b border-zinc-100 pb-6 font-sans text-xs">
          <Link href="/shop" className={`px-5 py-2.5 uppercase font-bold tracking-wider rounded-lg shadow-sm transition-colors ${!category ? 'bg-black text-white' : 'border border-zinc-200 hover:border-zinc-400 text-zinc-700 bg-white'}`}>
            All Fabrics
          </Link>
          <Link href="/shop?category=cotton" className={`px-5 py-2.5 uppercase font-bold tracking-wider rounded-lg transition-colors ${category === 'cotton' ? 'bg-black text-white shadow-sm' : 'border border-zinc-200 hover:border-zinc-400 text-zinc-700 bg-white'}`}>
            Cotton Weaves
          </Link>
          <Link href="/shop?category=linen" className={`px-5 py-2.5 uppercase font-bold tracking-wider rounded-lg transition-colors ${category === 'linen' ? 'bg-black text-white shadow-sm' : 'border border-zinc-200 hover:border-zinc-400 text-zinc-700 bg-white'}`}>
            Pure Linen
          </Link>
          <Link href="/shop?category=stitched" className={`px-5 py-2.5 uppercase font-bold tracking-wider rounded-lg transition-colors ${category === 'stitched' ? 'bg-black text-white shadow-sm' : 'border border-zinc-200 hover:border-zinc-400 text-zinc-700 bg-white'}`}>
            Stitched Tunic Wear
          </Link>
        </div>

        {/* Polaroid Card Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8 md:gap-10">
          {variants.length > 0 ? (
            variants.map((variant) => (
              <Link key={variant.id} href={`/product/${variant.products?.slug}`} className="polaroid-card group flex flex-col w-full max-w-sm mx-auto bg-white">
                <div className="aspect-[3/4] bg-neutral-100 rounded-lg overflow-hidden border border-zinc-100 relative mb-4">
                  {variant.images && variant.images[0] ? (
                    <img src={variant.images[0]} alt={variant.products?.title || 'Product'} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                  ) : (
                    <div className="w-full h-full bg-neutral-200"></div>
                  )}
                  {variant.products?.is_featured && (
                    <span className="absolute top-4 left-4 bg-purple-600 text-white text-[9px] font-bold px-3 py-1.5 uppercase tracking-wider rounded-md shadow-sm">
                      Featured
                    </span>
                  )}
                </div>
                
                <div className="px-1 space-y-1">
                  <span className="text-[9px] uppercase font-bold tracking-wider text-zinc-400">{variant.products?.weave} Weave</span>
                  <h3 className="font-serif italic font-bold text-lg text-zinc-950 mt-1">{variant.products?.title}</h3>
                  <p className="font-sans text-xs text-zinc-500">{variant.color} colorway</p>
                  <p className="font-sans font-bold text-sm text-purple-600 mt-2">₹{variant.price} / meter</p>
                </div>
              </Link>
            ))
          ) : (
            <div className="col-span-full py-24 text-center opacity-70 sonic-bento-card bg-white p-8">
               <p className="font-serif italic text-2xl font-bold">No Fabrics Found</p>
               <p className="font-sans mt-2 text-sm">Our weavers are operating the looms to restore these swatches soon.</p>
            </div>
          )}
        </div>
      </div>
    </main>
  );
}

