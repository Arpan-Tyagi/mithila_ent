import { MetadataRoute } from 'next';
import { createClient } from '@/lib/supabase/server';

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const supabase = await createClient();
  const baseUrl = 'https://mithilaenterprises.com';

  const { data: products } = await supabase.from('products').select('slug, created_at');
  const { data: categories } = await supabase.from('categories').select('slug, created_at');

  const productUrls = (products || []).map((product) => ({
    url: `${baseUrl}/product/${product.slug}`,
    lastModified: new Date(product.created_at),
    changeFrequency: 'weekly' as const,
    priority: 0.8,
  }));

  const categoryUrls = (categories || []).map((category) => ({
    url: `${baseUrl}/category/${category.slug}`,
    lastModified: new Date(category.created_at),
    changeFrequency: 'weekly' as const,
    priority: 0.9,
  }));

  return [
    {
      url: baseUrl,
      lastModified: new Date(),
      changeFrequency: 'daily',
      priority: 1,
    },
    {
      url: `${baseUrl}/shop`,
      lastModified: new Date(),
      changeFrequency: 'daily',
      priority: 0.9,
    },
    ...categoryUrls,
    ...productUrls,
  ];
}
