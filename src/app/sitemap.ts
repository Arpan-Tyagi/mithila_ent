import { MetadataRoute } from 'next';
import { createClient } from '@/lib/supabase/server';

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const baseUrl = 'https://mithilaenterprises.com';

  let productUrls: MetadataRoute.Sitemap = [];
  let categoryUrls: MetadataRoute.Sitemap = [];

  try {
    const supabase = await createClient();
    const { data: products } = await supabase.from('products').select('slug, created_at').eq('status', 'active');
    const { data: categories } = await supabase.from('categories').select('slug, created_at');

    productUrls = (products || []).map((product) => ({
      url: `${baseUrl}/product/${product.slug}`,
      lastModified: new Date(product.created_at),
      changeFrequency: 'weekly' as const,
      priority: 0.8,
    }));

    categoryUrls = (categories || []).map((category) => ({
      url: `${baseUrl}/category/${category.slug}`,
      lastModified: new Date(category.created_at),
      changeFrequency: 'weekly' as const,
      priority: 0.9,
    }));
  } catch {
    // Graceful fallback if DB is unreachable
  }

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
