import type { Metadata } from 'next';
import WholesaleClient from './WholesaleClient';
import { getSiteUrl } from '@/lib/site-url';

export const metadata: Metadata = {
  title: 'Wholesale Fabric Accounts & B2B Bulk Textile Sourcing',
  description:
    'Apply for a B2B wholesale fabric account with Mithila Enterprises. Tiered pricing for domestic artisans, fashion houses, and garment manufacturers on pure linen, organic cotton, corduroy, and wool yardage.',
  alternates: {
    canonical: `${getSiteUrl()}/wholesale`,
  },
  openGraph: {
    title: 'Wholesale Fabric Accounts & B2B Bulk Textile Sourcing | Mithila Enterprises',
    description:
      'Apply for a B2B wholesale fabric account with Mithila Enterprises. Tiered pricing for designers and manufacturers on premium linen and cotton yardage.',
    url: `${getSiteUrl()}/wholesale`,
  },
};

export default function WholesalePage() {
  return <WholesaleClient />;
}
