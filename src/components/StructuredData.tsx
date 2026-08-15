export default function StructuredData() {
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

  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(storeLd) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbsLd) }} />
    </>
  );
}
