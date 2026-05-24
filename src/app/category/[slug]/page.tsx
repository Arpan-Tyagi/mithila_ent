import { createClient } from '@/lib/supabase/server';
import Link from 'next/link';
import { notFound } from 'next/navigation';

export const revalidate = 3600;

export default async function CategoryPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const supabase = await createClient();
  
  // First find category
  const { data: category } = await supabase
    .from('categories')
    .select('*')
    .eq('slug', slug)
    .single();

  if (!category) {
    notFound();
  }

  // Then fetch products
  const { data: variants } = await supabase
    .from('product_variants')
    .select('*, products!inner(title, slug, weave, is_featured, category_id)')
    .eq('products.category_id', category.id);

  return (
    <main className="flex-grow bg-[var(--unbleached-cotton)] py-16">
      <div className="container mx-auto px-4 md:px-8">
        <h1 className="font-serif text-4xl md:text-5xl font-bold text-[var(--charcoal-ink)] mb-4">
          {category.name}
        </h1>
        <p className="font-sans opacity-70 mb-12 max-w-2xl">
          Explore our collection of premium {category.name.toLowerCase()} fabrics, woven with care and inspired by heritage.
        </p>

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
                </div>
                <h3 className="font-serif font-bold text-xl text-[var(--charcoal-ink)]">{variant.products?.title}</h3>
                <p className="font-sans text-sm opacity-70 mt-1">{variant.color} • {variant.products?.weave}</p>
                <p className="font-sans font-bold text-[var(--madder-red)] mt-2">₹{variant.price}</p>
              </Link>
            ))
          ) : (
            <div className="col-span-full py-24 text-center opacity-70">
               <p className="font-serif text-2xl">No {category.name} fabrics found.</p>
            </div>
          )}
        </div>
      </div>
    </main>
  );
}
