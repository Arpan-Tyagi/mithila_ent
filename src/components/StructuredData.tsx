import { getSiteUrl } from "@/lib/site-url";
import { jsonLd } from '@/lib/json-ld';

export default function StructuredData() {
  const siteUrl = getSiteUrl();

  const organizationLd = {
    '@context': 'https://schema.org',
    '@type': 'Organization',
    '@id': `${siteUrl}/#organization`,
    name: 'Mithila Enterprises',
    url: siteUrl,
    logo: `${siteUrl}/images/logo.png`,
    description:
      'India’s premier artisan fabric wholesaler and luxury textile house. Specializing in pure linen, organic cotton, viscose, velvet, and handwoven textiles inspired by Madhubani cultural art.',
    telephone: '+91-9818555220',
    email: 'mithlaenterprises11@gmail.com',
    address: {
      '@type': 'PostalAddress',
      streetAddress: 'TA-106, Okhla Estate Marg, Tughlakabad Extension, Alaknanda',
      addressLocality: 'New Delhi',
      addressRegion: 'Delhi',
      postalCode: '110019',
      addressCountry: 'IN',
    },
    taxID: '07AGUPM2548P1ZH',
    vatID: '07AGUPM2548P1ZH',
    sameAs: [
      'https://www.instagram.com/mithilaenterprises',
      'https://www.linkedin.com/company/mithila-enterprises',
      'https://www.facebook.com/mithilaenterprises',
      'https://twitter.com/mithilaent',
      'https://www.pinterest.com/mithilaenterprises',
    ],
  };

  const websiteLd = {
    '@context': 'https://schema.org',
    '@type': 'WebSite',
    '@id': `${siteUrl}/#website`,
    url: siteUrl,
    name: 'Mithila Enterprises',
    publisher: {
      '@id': `${siteUrl}/#organization`,
    },
    potentialAction: {
      '@type': 'SearchAction',
      target: {
        '@type': 'EntryPoint',
        urlTemplate: `${siteUrl}/search?q={search_term_string}`,
      },
      'query-input': 'required name=search_term_string',
    },
  };

  const storeLd = {
    '@context': 'https://schema.org',
    '@type': 'WholesaleStore',
    '@id': `${siteUrl}/#store`,
    name: 'Mithila Enterprises',
    url: siteUrl,
    logo: `${siteUrl}/images/logo.png`,
    image: `${siteUrl}/images/logo.png`,
    description:
      'Premium wholesale cotton and linen fabrics inspired by Madhubani art. Fractional meterage cuts and bulk bolt yardage for designers.',
    telephone: '+91-9818555220',
    priceRange: '₹₹',
    address: {
      '@type': 'PostalAddress',
      streetAddress: 'TA-106, Okhla Estate Marg, Tughlakabad Extension, Alaknanda',
      addressLocality: 'New Delhi',
      addressRegion: 'Delhi',
      postalCode: '110019',
      addressCountry: 'IN',
    },
    geo: {
      '@type': 'GeoCoordinates',
      latitude: 28.5284,
      longitude: 77.2608,
    },
    openingHoursSpecification: [
      {
        '@type': 'OpeningHoursSpecification',
        dayOfWeek: [
          'Monday',
          'Tuesday',
          'Wednesday',
          'Thursday',
          'Friday',
          'Saturday',
        ],
        opens: '10:00',
        closes: '19:00',
      },
    ],
  };

  const breadcrumbsLd = {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: [
      {
        '@type': 'ListItem',
        position: 1,
        name: 'Home',
        item: siteUrl,
      },
      {
        '@type': 'ListItem',
        position: 2,
        name: 'Shop Fabrics',
        item: `${siteUrl}/shop`,
      },
    ],
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: jsonLd(organizationLd) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: jsonLd(websiteLd) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: jsonLd(storeLd) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: jsonLd(breadcrumbsLd) }}
      />
    </>
  );
}
