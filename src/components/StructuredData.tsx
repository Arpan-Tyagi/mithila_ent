// eslint-disable-next-line @typescript-eslint/no-explicit-any
export default function StructuredData({ product }: { product?: any }) {
  const storeLd = {
    '@context': 'https://schema.org',
    '@type': 'WholesaleStore',
    name: 'Mithila Enterprises',
    url: 'https://www.mithilaenterprises.co.in',
    logo: 'https://www.mithilaenterprises.co.in/images/logo.png',
    image: 'https://www.mithilaenterprises.co.in/images/logo.png',
    description: 'Premium wholesale cotton and linen fabrics inspired by Madhubani art.',
    address: {
      '@type': 'PostalAddress',
      streetAddress: 'TA-106, Okhla Estate Marg, Tughlakabad Extension, Alaknanda',
      addressLocality: 'New Delhi',
      addressRegion: 'Delhi',
      postalCode: '110019',
      addressCountry: 'IN'
    }
  };

  const breadcrumbsLd = {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: [
      { '@type': 'ListItem', position: 1, name: 'Home', item: 'https://www.mithilaenterprises.co.in' },
      { '@type': 'ListItem', position: 2, name: 'Shop', item: 'https://www.mithilaenterprises.co.in/shop' },
    ],
  };

  const productLd = product ? {
    '@context': 'https://schema.org',
    '@type': 'Product',
    name: product.title,
    description: product.description,
    image: product.image_url ? [product.image_url] : undefined,
    sku: product.sku || product.id,
    brand: {
      '@type': 'Brand',
      name: 'Mithila Enterprises'
    },
    material: product.weave,
    pattern: 'Madhubani Inspired',
    offers: {
      '@type': 'Offer',
      url: `https://www.mithilaenterprises.co.in/product/${product.slug}`,
      priceCurrency: 'INR',
      price: product.price,
      availability: product.stock > 0 ? 'https://schema.org/InStock' : 'https://schema.org/OutOfStock',
      itemCondition: 'https://schema.org/NewCondition'
    }
  } : null;

  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(storeLd) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbsLd) }} />
      {productLd && <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(productLd) }} />}
    </>
  );
}
