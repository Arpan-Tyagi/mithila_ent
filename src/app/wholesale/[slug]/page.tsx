import React from 'react';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import type { Metadata } from 'next';
import { getAllWholesaleSlugs, getWholesaleCategory } from '@/lib/wholesale-data';
import BackgroundPattern from '@/components/vectors/BackgroundPattern';
import { getSiteUrl } from '@/lib/site-url';
import WholesaleClientForm from './WholesaleClientForm';

export function generateStaticParams() {
  return getAllWholesaleSlugs().map((slug) => ({ slug }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const category = getWholesaleCategory(slug);
  if (!category) return { title: 'Wholesale Category Not Found' };

  const siteUrl = getSiteUrl();
  const url = `${siteUrl}/wholesale/${slug}`;

  return {
    title: category.metaTitle,
    description: category.metaDescription,
    keywords: category.targetKeywords,
    alternates: {
      canonical: url,
    },
    openGraph: {
      title: category.metaTitle,
      description: category.metaDescription,
      url,
      type: 'website',
      images: [
        {
          url: `${siteUrl}/images/logo.png`,
          width: 800,
          height: 600,
          alt: category.title,
        },
      ],
    },
    twitter: {
      card: 'summary_large_image',
      title: category.metaTitle,
      description: category.metaDescription,
      images: [`${siteUrl}/images/logo.png`],
    },
  };
}

export default async function WholesaleCategoryPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const category = getWholesaleCategory(slug);
  if (!category) notFound();

  const siteUrl = getSiteUrl();

  const breadcrumbsLd = {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: [
      { '@type': 'ListItem', position: 1, name: 'Home', item: siteUrl },
      { '@type': 'ListItem', position: 2, name: 'Wholesale Accounts', item: `${siteUrl}/wholesale` },
      { '@type': 'ListItem', position: 3, name: category.name, item: `${siteUrl}/wholesale/${slug}` },
    ],
  };

  const wholesaleStoreLd = {
    '@context': 'https://schema.org',
    '@type': 'WholesaleStore',
    name: `Mithila Enterprises — ${category.name} Wholesale Desk`,
    url: `${siteUrl}/wholesale/${slug}`,
    description: category.heroSummary,
    telephone: '+91-9818555220',
    address: {
      '@type': 'PostalAddress',
      streetAddress: 'F-12, Okhla Phase-II',
      addressLocality: 'New Delhi',
      addressRegion: 'Delhi',
      postalCode: '110020',
      addressCountry: 'IN',
    },
    geo: {
      '@type': 'GeoCoordinates',
      latitude: 28.5284,
      longitude: 77.2608,
    },
    priceRange: '₹₹₹',
  };

  const whatsappMessage = encodeURIComponent(
    `Hi Mithila Enterprises, I am inquiring about B2B wholesale roll pricing & specs for ${category.name} (${category.moq}). Please share your current wholesale rate card.`
  );

  return (
    <main className="flex-grow w-full bg-transparent text-[var(--charcoal-ink)] pt-24 md:pt-32 pb-24 font-sans relative overflow-hidden">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbsLd) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(wholesaleStoreLd) }}
      />

      <BackgroundPattern className="opacity-30" />

      <div className="container mx-auto px-6 max-w-6xl relative z-10">
        {/* Breadcrumb Navigation */}
        <nav className="font-sans text-xs opacity-75 mb-6 tracking-widest font-bold text-[var(--madder-red)]">
          <Link href="/" className="hover:underline">HOME</Link> /{' '}
          <Link href="/wholesale" className="hover:underline">WHOLESALE</Link> /{' '}
          <span className="text-[var(--charcoal-ink)]">{category.name.toUpperCase()}</span>
        </nav>

        {/* Hero Header */}
        <header className="mb-14 space-y-4 max-w-4xl">
          <div className="flex flex-wrap items-center gap-2 text-[10px] font-bold uppercase tracking-wider">
            <span className="px-3 py-1 bg-[var(--madder-red)] text-white rounded-sm">
              B2B Roll Procurement
            </span>
            <span className="px-3 py-1 bg-[var(--charcoal-ink)] text-white rounded-sm">
              Atelier: F-12 Okhla Phase-II, New Delhi
            </span>
            <span className="px-3 py-1 bg-neutral-200 text-zinc-800 rounded-sm">
              GSTIN: 07AGUPM2548P1ZH
            </span>
          </div>

          <h1 className="font-serif italic text-3xl sm:text-4xl md:text-5xl font-bold leading-[1.15] text-[var(--charcoal-ink)]">
            {category.title}
          </h1>

          <p className="font-sans text-sm md:text-base text-zinc-700 leading-relaxed text-justify">
            {category.heroSummary}
          </p>

          <div className="flex flex-wrap items-center gap-3 pt-2">
            <a
              href={`https://wa.me/919818555220?text=${whatsappMessage}`}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 px-6 py-3 bg-[#25D366] text-white text-xs font-bold uppercase tracking-wider rounded-sm hover:bg-[#20ba59] transition-all shadow-sm"
            >
              <span>Instant WhatsApp Rate Card</span>
              <span aria-hidden="true">&rarr;</span>
            </a>
            <Link
              href={`/category/${category.relatedCategorySlug}`}
              className="inline-flex items-center gap-2 px-6 py-3 bg-white border-2 border-[var(--charcoal-ink)] text-[var(--charcoal-ink)] text-xs font-bold uppercase tracking-wider rounded-sm hover:bg-neutral-100 transition-all"
            >
              Order Sample / Retail Meterage &rarr;
            </Link>
          </div>
        </header>

        {/* Fast Specs Matrix */}
        <section className="mb-14 grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="p-5 bg-white border-2 border-[var(--charcoal-ink)] shadow-[3px_3px_0_var(--charcoal-ink)] rounded-sm">
            <span className="block text-[10px] font-bold uppercase tracking-wider text-zinc-500 mb-1">
              Minimum Order Qty
            </span>
            <span className="font-serif font-bold text-lg text-[var(--charcoal-ink)]">
              50 Meters
            </span>
            <span className="block text-[10px] text-zinc-600 mt-1">Continuous Bolt Thaan</span>
          </div>

          <div className="p-5 bg-white border-2 border-[var(--charcoal-ink)] shadow-[3px_3px_0_var(--charcoal-ink)] rounded-sm">
            <span className="block text-[10px] font-bold uppercase tracking-wider text-zinc-500 mb-1">
              Roll Usable Width
            </span>
            <span className="font-serif font-bold text-lg text-[var(--charcoal-ink)]">
              {category.width}
            </span>
            <span className="block text-[10px] text-zinc-600 mt-1">Calibrated Selvage</span>
          </div>

          <div className="p-5 bg-white border-2 border-[var(--charcoal-ink)] shadow-[3px_3px_0_var(--charcoal-ink)] rounded-sm">
            <span className="block text-[10px] font-bold uppercase tracking-wider text-zinc-500 mb-1">
              Calibrated Weight
            </span>
            <span className="font-serif font-bold text-lg text-[var(--charcoal-ink)]">
              {category.gsmRange}
            </span>
            <span className="block text-[10px] text-zinc-600 mt-1">Laboratory Certified</span>
          </div>

          <div className="p-5 bg-white border-2 border-[var(--charcoal-ink)] shadow-[3px_3px_0_var(--charcoal-ink)] rounded-sm">
            <span className="block text-[10px] font-bold uppercase tracking-wider text-zinc-500 mb-1">
              Statutory Tax Rate
            </span>
            <span className="font-serif font-bold text-lg text-[var(--madder-red)]">
              GST 5% (Ch. 50-60)
            </span>
            <span className="block text-[10px] text-zinc-600 mt-1">CGST Rule 46 Invoicing</span>
          </div>
        </section>

        {/* Tiered Pricing Matrix Table */}
        <section className="mb-14 p-6 md:p-8 bg-[var(--unbleached-cotton)] border-2 border-[var(--charcoal-ink)] shadow-[5px_5px_0_var(--charcoal-ink)] rounded-sm">
          <div className="mb-6 space-y-1">
            <span className="text-[10px] font-bold uppercase tracking-widest text-[var(--madder-red)]">
              Volume Sourcing Economics
            </span>
            <h2 className="font-serif italic text-2xl md:text-3xl font-bold text-[var(--charcoal-ink)]">
              Tiered Wholesale Roll Pricing
            </h2>
            <p className="font-sans text-xs md:text-sm text-zinc-700">
              Transparent tier structures for independent ateliers, fashion houses, and export garment factories.
            </p>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left font-sans text-xs md:text-sm border-collapse">
              <thead>
                <tr className="border-b-2 border-[var(--charcoal-ink)]">
                  <th className="py-3 px-4 font-bold uppercase text-[11px] tracking-wider text-[var(--charcoal-ink)]">Tier Classification</th>
                  <th className="py-3 px-4 font-bold uppercase text-[11px] tracking-wider text-[var(--charcoal-ink)]">Volume Order</th>
                  <th className="py-3 px-4 font-bold uppercase text-[11px] tracking-wider text-[var(--charcoal-ink)]">Discount Advantage</th>
                  <th className="py-3 px-4 font-bold uppercase text-[11px] tracking-wider text-[var(--charcoal-ink)]">Fulfillment Scope</th>
                </tr>
              </thead>
              <tbody>
                {category.pricingTiers.map((tier, idx) => (
                  <tr key={idx} className="border-b border-[var(--charcoal-ink)]/15 hover:bg-white/60 transition-colors">
                    <td className="py-3.5 px-4 font-bold text-[var(--charcoal-ink)]">{tier.tier}</td>
                    <td className="py-3.5 px-4 font-mono font-bold text-zinc-800">{tier.volume}</td>
                    <td className="py-3.5 px-4 font-bold text-[var(--madder-red)]">{tier.discount}</td>
                    <td className="py-3.5 px-4 text-zinc-700">{tier.description}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>

        {/* Technical Specification Matrix & Lead Form */}
        <section className="grid grid-cols-1 lg:grid-cols-12 gap-10 items-start mb-16">
          {/* Left Column: Full Technical Specifications */}
          <div className="lg:col-span-7 space-y-6">
            <div className="p-6 md:p-8 bg-white border-2 border-[var(--charcoal-ink)] shadow-[4px_4px_0_var(--charcoal-ink)] rounded-sm space-y-4">
              <h3 className="font-serif italic text-2xl font-bold text-[var(--charcoal-ink)] border-b pb-3">
                Technical Specifications &amp; Quality Parameters
              </h3>
              <dl className="divide-y divide-neutral-100 font-sans text-xs md:text-sm">
                {category.specifications.map((spec, idx) => (
                  <div key={idx} className="py-2.5 flex flex-col sm:flex-row sm:justify-between gap-1">
                    <dt className="font-bold text-zinc-800 sm:w-1/3">{spec.label}</dt>
                    <dd className="text-zinc-700 sm:w-2/3 sm:text-right">{spec.value}</dd>
                  </div>
                ))}
              </dl>
            </div>

            {/* Applications & Dyeing Capabilities */}
            <div className="p-6 md:p-8 bg-neutral-50 border-2 border-[var(--charcoal-ink)]/20 rounded-sm space-y-4">
              <h4 className="font-serif italic text-xl font-bold text-[var(--charcoal-ink)]">
                Recommended Apparel Applications
              </h4>
              <div className="flex flex-wrap gap-2">
                {category.applications.map((app, idx) => (
                  <span
                    key={idx}
                    className="px-3 py-1.5 bg-white border border-[var(--charcoal-ink)]/15 text-[var(--charcoal-ink)] text-xs font-bold rounded-sm shadow-2xs"
                  >
                    ✦ {app}
                  </span>
                ))}
              </div>
              <div className="pt-4 border-t border-neutral-200 text-xs text-zinc-600 leading-relaxed">
                <strong>Color Continuity:</strong> {category.colorways}. {category.dyeCapabilities}
              </div>
            </div>
          </div>

          {/* Right Column: Direct Wholesale Lead Capture Form */}
          <div className="lg:col-span-5">
            <WholesaleClientForm
              categoryName={category.name}
              categorySlug={category.slug}
              moq={category.moq}
            />
          </div>
        </section>

        {/* Local Sourcing Note & Showroom Invitation */}
        <footer className="p-6 md:p-8 bg-[var(--charcoal-ink)] text-[var(--unbleached-cotton)] rounded-sm flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="space-y-1 text-center md:text-left">
            <span className="text-[10px] font-bold uppercase tracking-widest text-[#f59e0b]">
              Showroom &amp; Warehouse Inspection
            </span>
            <h4 className="font-serif italic text-xl font-bold text-white">
              Visiting Delhi Fabric Markets?
            </h4>
            <p className="font-sans text-xs text-zinc-300 max-w-xl">
              Inspect our master bolts in person. We welcome apparel sourcing agents, designers, and manufacturing teams at our Okhla atelier (Mon–Sat, 10 AM to 7 PM). Dedicated loading docks and parking available.
            </p>
          </div>
          <a
            href="https://maps.google.com/?q=Okhla+Phase+II+New+Delhi"
            target="_blank"
            rel="noopener noreferrer"
            className="px-6 py-3 bg-white text-[var(--charcoal-ink)] text-xs font-bold uppercase tracking-wider rounded-sm hover:bg-neutral-100 transition-colors shrink-0"
          >
            Get Atelier Directions &rarr;
          </a>
        </footer>
      </div>
    </main>
  );
}
