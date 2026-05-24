import { createClient } from '@/lib/supabase/server';
import { notFound } from 'next/navigation';
import AddToCartButton from './AddToCartButton';
import { Metadata } from 'next';
import { MOCK_PRODUCTS } from '@/lib/mock-data';

export const revalidate = 3600;

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const supabase = await createClient();
  const { data: dbProduct } = await supabase
    .from('products')
    .select('title, description')
    .eq('slug', slug)
    .single();

  const product = dbProduct || MOCK_PRODUCTS.find(p => p.slug === slug);

  if (!product) return { title: 'Product Not Found' };

  return {
    title: `${product.title} | Mithila Enterprises`,
    description: product.description,
  };
}

export default async function ProductPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const supabase = await createClient();
  
  // Fetch product and its variants
  const { data: dbProduct } = await supabase
    .from('products')
    .select('*, product_variants(*), categories(name)')
    .eq('slug', slug)
    .single();

  const product = dbProduct || MOCK_PRODUCTS.find(p => p.slug === slug);

  if (!product) {
    notFound();
  }

  // For simplicity, we auto-select the first variant if there's no complex variant switcher built yet
  const defaultVariant = product.product_variants[0];

  if (!defaultVariant) {
    return <div className="py-24 text-center">Product is unavailable.</div>;
  }

  const cartItem = {
    id: defaultVariant.id,
    product_id: product.id,
    title: product.title,
    color: defaultVariant.color,
    price: defaultVariant.price,
    quantity: 1,
    image: defaultVariant.images[0] || '',
  };

  return (
    <main className="flex-grow bg-[var(--unbleached-cotton)] pt-32 pb-24 relative overflow-hidden">
      <div className="container mx-auto px-4 md:px-8 max-w-7xl relative z-10">
        {/* Breadcrumb */}
        <div className="font-sans text-xs opacity-70 mb-12 tracking-widest font-bold text-[var(--madder-red)]">
          HOME / SHOP / {(product.categories?.name || product.tags?.[0] || 'FABRIC').toUpperCase()} / {product.title.toUpperCase()}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-start">
          {/* Images */}
          <div className="space-y-4 sticky top-32">
            <div className="aspect-[3/4] bg-neutral-100 rounded-lg overflow-hidden relative shadow-sm border border-zinc-100">
               {defaultVariant.images[0] ? (
                  <img src={defaultVariant.images[0]} alt={product.title} className="w-full h-full object-cover" />
               ) : (
                  <div className="w-full h-full bg-neutral-200"></div>
               )}
            </div>
            {/* Thumbnail Gallery Placeholder */}
            {defaultVariant.images.length > 1 && (
              <div className="flex gap-4">
                {defaultVariant.images.slice(1).map((img: string, idx: number) => (
                   <div key={idx} className="w-24 h-32 bg-neutral-100 rounded-md overflow-hidden border border-zinc-100 cursor-pointer hover:opacity-80 transition-opacity">
                      <img src={img} alt="Thumbnail" className="w-full h-full object-cover" />
                   </div>
                ))}
              </div>
            )}
          </div>

          {/* Details */}
          <div className="flex flex-col justify-center">
            <h1 className="font-serif italic text-4xl md:text-6xl font-bold text-[var(--charcoal-ink)] mb-4 leading-tight">
              {product.title}
            </h1>
            <p className="font-sans text-2xl text-[var(--charcoal-ink)] font-bold mb-8">
              ₹{defaultVariant.price} <span className="text-sm font-normal opacity-60">/ meter</span>
            </p>

            <div className="space-y-8 text-[var(--charcoal-ink)] opacity-90 font-sans">
              <p className="leading-relaxed text-sm opacity-80">
                {product.description || 'Premium heritage fabric, woven with ancestral techniques and inspired by Mithila artwork.'}
              </p>

              <div className="grid grid-cols-2 gap-y-8 gap-x-4 py-8 border-y border-zinc-200">
                <div>
                  <p className="text-[10px] uppercase font-bold tracking-widest text-zinc-400 mb-1">Weave</p>
                  <p className="font-bold text-sm">{product.weave || 'Standard'}</p>
                </div>
                <div>
                  <p className="text-[10px] uppercase font-bold tracking-widest text-zinc-400 mb-1">Color</p>
                  <p className="font-bold text-sm">{defaultVariant.color}</p>
                </div>
                <div>
                  <p className="text-[10px] uppercase font-bold tracking-widest text-zinc-400 mb-1">GSM</p>
                  <p className="font-bold text-sm">{product.gsm ? `${product.gsm} g/m²` : 'Medium Weight'}</p>
                </div>
                <div>
                  <p className="text-[10px] uppercase font-bold tracking-widest text-zinc-400 mb-1">Availability</p>
                  <p className="font-bold text-sm text-green-700">{defaultVariant.stock_quantity > 0 ? 'In Stock' : 'Out of Stock'}</p>
                </div>
              </div>
            </div>

            <div className="mt-8">
              <AddToCartButton item={cartItem} />
            </div>

            {/* Accordion Placeholders for Details */}
            <div className="mt-12">
              <details className="group border-b border-zinc-200 py-5 cursor-pointer">
                <summary className="font-sans text-sm font-bold uppercase tracking-wider flex justify-between items-center text-zinc-800 outline-none">
                  Care Instructions
                  <span className="group-open:rotate-180 transition-transform">▼</span>
                </summary>
                <div className="pt-4 font-sans text-xs opacity-70 leading-relaxed text-justify">
                  Gentle hand wash in cold water. Do not bleach. Dry in shade to maintain the vibrancy of natural dyes. Iron on reverse. Handloom fabrics soften naturally with every wash.
                </div>
              </details>
              <details className="group border-b border-zinc-200 py-5 cursor-pointer">
                <summary className="font-sans text-sm font-bold uppercase tracking-wider flex justify-between items-center text-zinc-800 outline-none">
                  Shipping & Returns
                  <span className="group-open:rotate-180 transition-transform">▼</span>
                </summary>
                <div className="pt-4 font-sans text-xs opacity-70 leading-relaxed text-justify">
                  Dispatch within 48 hours. Returns accepted within 7 days of delivery if the fabric is uncut and unwashed. Custom Jamdani orders may take up to 3 weeks for dispatch.
                </div>
              </details>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}
