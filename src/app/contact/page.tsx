import type { Metadata } from 'next';
import ContactClient from './ContactClient';
import { getSiteUrl } from '@/lib/site-url';

export const metadata: Metadata = {
  title: 'Contact Us | Textile Consultations & Fabric Inquiries',
  description:
    'Contact Mithila Enterprises for custom fabric cuts, wholesale bolt inquiries, handloom specifications, GSM swatches, and order support. Warehoused in Okhla, New Delhi.',
  alternates: {
    canonical: `${getSiteUrl()}/contact`,
  },
  openGraph: {
    title: 'Contact Us | Textile Consultations & Fabric Inquiries | Mithila Enterprises',
    description:
      'Contact Mithila Enterprises for custom fabric cuts, wholesale bolt inquiries, handloom specifications, GSM swatches, and order support.',
    url: `${getSiteUrl()}/contact`,
  },
};

export default function ContactPage() {
  return <ContactClient />;
}
