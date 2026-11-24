import { MetadataRoute } from 'next';
import { getSiteUrl } from '@/lib/site-url';

export default function robots(): MetadataRoute.Robots {
  const baseUrl = getSiteUrl();
  return {
    rules: [
      {
        userAgent: '*',
        allow: '/',
        disallow: ['/admin/', '/account/', '/checkout/', '/api/'],
      },
      {
        userAgent: 'GPTBot',
        allow: ['/', '/shop', '/category/', '/product/', '/blog/', '/about', '/wholesale'],
        disallow: ['/admin/', '/account/', '/checkout/', '/api/'],
      },
      {
        userAgent: 'ClaudeBot',
        allow: ['/', '/shop', '/category/', '/product/', '/blog/', '/about', '/wholesale'],
        disallow: ['/admin/', '/account/', '/checkout/', '/api/'],
      },
      {
        userAgent: 'PerplexityBot',
        allow: ['/', '/shop', '/category/', '/product/', '/blog/', '/about', '/wholesale'],
        disallow: ['/admin/', '/account/', '/checkout/', '/api/'],
      },
    ],
    sitemap: `${baseUrl}/sitemap.xml`,
  };
}
