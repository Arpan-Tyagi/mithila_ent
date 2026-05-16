export default function StructuredData({ product }: { product?: any }) {
  const storeLd = {
    '@context': 'https://schema.org',
    '@type': 'Store',
    name: 'Mithila Enterprises',
    url: 'https://mithilaenterprises.com',
    logo: 'https://mithilaenterprises.com/icon-512x512.png',
    description: 'Premium wholesale cotton and linen fabrics inspired by Madhubani art.',
  };

  const breadcrumbsLd = {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: [
      { '@type': 'ListItem', position: 1, name: 'Home', item: 'https://mithilaenterprises.com' },
      { '@type': 'ListItem', position: 2, name: 'Shop', item: 'https://mithilaenterprises.com/shop' },
    ],
  };

  const productLd = product ? {
    '@context': 'https://schema.org',
    '@type': 'Product',
    name: product.title,
    description: product.description,
    material: product.weave,
    pattern: 'Madhubani Inspired',
  } : null;

  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(storeLd) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbsLd) }} />
      {productLd && <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(productLd) }} />}
    </>
  );
}
