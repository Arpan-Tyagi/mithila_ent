import { createClient } from '@/lib/supabase/server';
import ProductCard from '@/components/ProductCard';

export default async function SearchPage({ searchParams }: { searchParams: { q?: string } }) {
  const query = searchParams.q || '';
  const supabase = await createClient();

  const { data: products } = await supabase
    .from('products')
    .select('*, product_variants(price, images)')
    .ilike('title', `%${query}%`)
    .eq('status', 'active');

  return (
    <main className="flex-grow max-w-7xl mx-auto px-4 py-16 w-full">
      <h1 className="font-serif text-3xl font-bold text-[var(--charcoal-ink)] mb-2">Search Results</h1>
      <p className="font-sans text-sm opacity-70 mb-8">Showing results for: <span className="font-bold">"{query}"</span></p>

      {products && products.length > 0 ? (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
          {products.map((product) => (
            <ProductCard key={product.id} product={product} />
          ))}
        </div>
      ) : (
        <div className="text-center py-16 border-2 border-dashed border-[var(--charcoal-ink)] opacity-50">
          <p className="font-sans">No fabrics found matching your search.</p>
        </div>
      )}
    </main>
  );
}
