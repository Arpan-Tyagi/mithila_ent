import { createClient } from '@/lib/supabase/server';
import { notFound } from 'next/navigation';
import AddToCartButton from './AddToCartButton';
import { Metadata } from 'next';

export const revalidate = 3600;

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const supabase = await createClient();
  const { data: product } = await supabase
    .from('products')
    .select('*, categories(*), product_variants(*)')
    .eq('slug', slug)
    .single();

  if (!product) return { title: 'Product Not Found' };

  return {
    title: `${product.title} | Mithila Enterprises`,
    description: product.description,
  };
}

export default async function ProductPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const supabase = await createClient();
  const { data: product } = await supabase
    .from('products')
    .select('*, categories(*), product_variants(*)')
    .eq('slug', slug)
    .single();

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
    <main className="flex-grow bg-[var(--unbleached-cotton)] py-12">
      <div className="container mx-auto px-4 md:px-8">
        {/* Breadcrumb */}
        <div className="font-sans text-sm opacity-70 mb-8 tracking-wide">
          HOME / SHOP / {product.categories?.name?.toUpperCase() || 'FABRIC'} / {product.title.toUpperCase()}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-16">
          {/* Images */}
          <div className="space-y-4">
            <div className="aspect-[3/4] bg-neutral-200 border-2 border-[var(--charcoal-ink)] rounded-sm overflow-hidden relative">
               {defaultVariant.images[0] ? (
                  <img src={defaultVariant.images[0]} alt={product.title} className="w-full h-full object-cover" />
               ) : (
                  <div className="w-full h-full bg-neutral-300"></div>
               )}
            </div>
            {/* Thumbnail Gallery Placeholder */}
            {defaultVariant.images.length > 1 && (
              <div className="flex gap-4">
                {defaultVariant.images.slice(1).map((img: string, idx: number) => (
                   <div key={idx} className="w-24 h-32 bg-neutral-200 border-2 border-[var(--charcoal-ink)] cursor-pointer">
                      <img src={img} alt="Thumbnail" className="w-full h-full object-cover" />
                   </div>
                ))}
              </div>
            )}
          </div>

          {/* Details */}
          <div className="flex flex-col justify-center">
            <h1 className="font-serif text-4xl md:text-6xl font-bold text-[var(--charcoal-ink)] mb-4 leading-tight">
              {product.title}
            </h1>
            <p className="font-sans text-xl text-[var(--madder-red)] font-bold mb-8">
              ₹{defaultVariant.price} / meter
            </p>

            <div className="space-y-6 text-[var(--charcoal-ink)] opacity-90 font-sans">
              <p className="leading-relaxed">
                {product.description || 'Premium heritage fabric, woven with ancestral techniques and inspired by Mithila artwork.'}
              </p>

              <div className="grid grid-cols-2 gap-4 py-6 border-y-2 border-[var(--charcoal-ink)]/20">
                <div>
                  <p className="text-xs uppercase tracking-widest opacity-60">Weave</p>
                  <p className="font-bold">{product.weave || 'Standard'}</p>
                </div>
                <div>
                  <p className="text-xs uppercase tracking-widest opacity-60">Color</p>
                  <p className="font-bold">{defaultVariant.color}</p>
                </div>
                <div>
                  <p className="text-xs uppercase tracking-widest opacity-60">GSM</p>
                  <p className="font-bold">{product.gsm ? `${product.gsm} g/m²` : 'Medium Weight'}</p>
                </div>
                <div>
                  <p className="text-xs uppercase tracking-widest opacity-60">Stock</p>
                  <p className="font-bold">{defaultVariant.stock_quantity > 0 ? 'In Stock' : 'Out of Stock'}</p>
                </div>
              </div>
            </div>

            <AddToCartButton item={cartItem} />

            {/* Accordion Placeholders for Details */}
            <div className="mt-12 border-t-2 border-[var(--charcoal-ink)]/20">
              <details className="group border-b-2 border-[var(--charcoal-ink)]/20 py-4 cursor-pointer">
                <summary className="font-sans font-bold uppercase tracking-widest flex justify-between items-center">
                  Care Instructions
                  <span className="group-open:rotate-180 transition-transform">▼</span>
                </summary>
                <div className="pt-4 font-sans text-sm opacity-80 leading-relaxed">
                  Gentle hand wash in cold water. Do not bleach. Dry in shade to maintain the vibrancy of natural dyes. Iron on reverse.
                </div>
              </details>
              <details className="group border-b-2 border-[var(--charcoal-ink)]/20 py-4 cursor-pointer">
                <summary className="font-sans font-bold uppercase tracking-widest flex justify-between items-center">
                  Shipping & Returns
                  <span className="group-open:rotate-180 transition-transform">▼</span>
                </summary>
                <div className="pt-4 font-sans text-sm opacity-80 leading-relaxed">
                  Dispatch within 48 hours. Returns accepted within 7 days of delivery if the fabric is uncut and unwashed.
                </div>
              </details>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}
