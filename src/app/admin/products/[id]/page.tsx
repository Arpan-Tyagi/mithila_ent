import { createClient } from '@/lib/supabase/server';
import { requireAdminPage } from '@/lib/dal/session';
import { notFound } from 'next/navigation';
import EditProductForm from './EditProductForm';

export const dynamic = 'force-dynamic';

export default async function EditProductPage({ params }: { params: Promise<{ id: string }> }) {
  await requireAdminPage();
  const { id } = await params;
  const supabase = await createClient();

  const { data: product } = await supabase
    .from('products')
    .select('*, product_variants(*), product_collections(collection_id)')
    .eq('id', id)
    .single();

  if (!product) {
    notFound();
  }

  const { data: categories } = await supabase
    .from('categories')
    .select('id, name')
    .order('name');

  const { data: collections } = await supabase
    .from('collections')
    .select('id, title')
    .order('title');

  const collectionIds = (product.product_collections || []).map((pc: any) => pc.collection_id);

  return <EditProductForm product={product} categories={categories || []} collections={collections || []} initialCollectionIds={collectionIds} />;
}
