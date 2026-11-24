import { createClient } from '@/lib/supabase/server';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import Image from 'next/image';
import type { Metadata } from 'next';
import { fabricData } from '@/lib/fabric-data';
import { getSiteUrl } from '@/lib/site-url';

export const revalidate = 3600;

export function generateStaticParams() {
  return Object.keys(fabricData).map((slug) => ({ slug }));
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const fabric = fabricData[slug];
  const name = fabric?.name || slug.charAt(0).toUpperCase() + slug.slice(1).replace(/-/g, ' ');
  const title = `Buy ${name} Fabric Online by the Meter | Wholesale & Retail Delhi`;
  const description =
    fabric?.heroDescription ||
    `Order premium ${name} fabric by the meter in India. Fractional 0.5m cuts, single-bolt continuous yardage, and tiered wholesale roll pricing from Mithila Enterprises.`;
  const siteUrl = getSiteUrl();
  const url = `${siteUrl}/category/${slug}`;

  return {
    title,
    description,
    keywords: [
      `buy ${name.toLowerCase()} fabric online india`,
      `${name.toLowerCase()} fabric per meter`,
      `wholesale ${name.toLowerCase()} fabric suppliers delhi`,
      `bulk ${name.toLowerCase()} fabric rolls`,
      `unstitched ${name.toLowerCase()} shirting fabric`,
      `${name.toLowerCase()} fabric swatches online`,
    ],
    alternates: {
      canonical: url,
    },
    openGraph: {
      title: `${title} | Mithila Enterprises`,
      description,
      url,
      images: [{ url: `/images/fabrics/${slug}.png`, alt: `${name} Fabric` }],
    },
    twitter: {
      card: 'summary_large_image',
      title: `${title} | Mithila Enterprises`,
      description,
      images: [`/images/fabrics/${slug}.png`],
    },
  };
}

export default async function CategoryPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const siteUrl = getSiteUrl();
  const supabase = await createClient();
  
  // First find category
  const { data: category } = await supabase
    .from('categories')
    .select('*')
    .eq('slug', slug)
    .single();

  if (!category) {
    notFound();
  }

  // Then fetch products
  const { data: variants } = await supabase
    .from('product_variants')
    .select('*, products!inner(title, slug, weave, is_featured, category_id)')
    .eq('products.category_id', category.id);

  // Safely get fabric data (returns undefined if not present yet)
  const fabricInfo = fabricData ? fabricData[slug] : undefined;

  const collectionLd = {
    '@context': 'https://schema.org',
    '@type': 'CollectionPage',
    name: `${category.name} Fabrics`,
    description: fabricInfo?.heroDescription || `Explore premium ${category.name} fabrics.`,
    url: `${siteUrl}/category/${slug}`,
  };

  const breadcrumbsLd = {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: [
      { '@type': 'ListItem', position: 1, name: 'Home', item: siteUrl },
      { '@type': 'ListItem', position: 2, name: 'Shop', item: `${siteUrl}/shop` },
      { '@type': 'ListItem', position: 3, name: category.name, item: `${siteUrl}/category/${slug}` },
    ],
  };

  return (
    <main className="flex-grow bg-transparent">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(collectionLd) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbsLd) }}
      />
      {/* 1. EDITORIAL HERO SECTION */}
      <section className="w-full relative min-h-[60vh] md:min-h-[75vh] flex items-center pt-32 pb-24 overflow-hidden">
        <div className="container mx-auto px-6 md:px-8 relative z-10">
          <div className="flex flex-col md:flex-row items-center gap-16 lg:gap-24">
            
            {/* Text Content */}
            <div className="flex-1 w-full max-w-2xl">
              <div className="flex items-center gap-4 mb-8">
                <div className="h-[2px] w-12 bg-[var(--turmeric)]" />
                <span className="text-[var(--charcoal-ink)]/90 font-sans uppercase text-xs tracking-[0.4em] font-bold">
                  The Material Archive
                </span>
              </div>
              
              <h1 className="font-serif italic text-6xl md:text-8xl lg:text-[7.5rem] text-[var(--charcoal-ink)] mb-8 tracking-tight leading-[0.9]">
                {category.name}
              </h1>
              
              <p className="font-sans text-lg md:text-xl text-zinc-700 leading-relaxed font-light max-w-xl">
                {fabricInfo ? fabricInfo.heroDescription : `Explore our premium collection of ${category.name.toLowerCase()} fabrics, woven with care and inspired by heritage.`}
              </p>
            </div>

            {/* Featured Image */}
            <div className="flex-1 w-full flex justify-center md:justify-end">
              <div className="relative w-full max-w-lg aspect-[4/5] rounded-t-full rounded-b-xl overflow-hidden shadow-2xl shadow-[var(--charcoal-ink)]/20 border-8 border-white/40">
                <Image 
                  src={`/images/fabrics/${slug}.png`} 
                  alt={category.name} 
                  fill 
                  className="object-cover hover:scale-110 transition-transform duration-[2000ms] ease-out" 
                  sizes="(max-width: 768px) 100vw, 50vw" 
                  priority
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent" />
                <div className="absolute inset-0 border border-white/20 rounded-t-full rounded-b-xl pointer-events-none" />
              </div>
            </div>
            
          </div>
        </div>
      </section>

      {/* 2. ENCYCLOPEDIA CONTENT */}
      {fabricInfo && (
        <section className="py-24 border-t border-[var(--charcoal-ink)]/10">
          <div className="container mx-auto px-6 md:px-8">
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-16 lg:gap-24">
              
              {/* Left Column: Fast Facts */}
              <div className="lg:col-span-4 space-y-12">
                <div className="sonic-bento-card bg-[var(--charcoal-ink)]/5 p-8 border-l-4 border-[var(--charcoal-ink)] shadow-md">
                  <h4 className="font-serif italic font-bold text-2xl text-[var(--charcoal-ink)] mb-4">Origins</h4>
                  <p className="font-sans text-sm text-[var(--charcoal-ink)]/90 leading-relaxed text-justify">
                    {fabricInfo.whereItsMade}
                  </p>
                </div>

                <div className="space-y-6">
                  <h4 className="font-sans font-bold text-sm uppercase tracking-[0.2em] text-[var(--charcoal-ink)] border-b border-[var(--charcoal-ink)]/10 pb-4">Key Benefits</h4>
                  <ul className="space-y-5">
                    {fabricInfo.benefits.map((benefit, idx) => (
                      <li key={idx} className="flex items-start gap-4 group">
                        <span className="text-[var(--madder-red)] mt-0.5 group-hover:rotate-90 transition-transform duration-300">✦</span>
                        <span className="font-sans text-sm font-bold text-[var(--charcoal-ink)] leading-snug">{benefit}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                <div className="space-y-6">
                  <h4 className="font-sans font-bold text-sm uppercase tracking-[0.2em] text-[var(--charcoal-ink)] border-b border-[var(--charcoal-ink)]/10 pb-4">Applications</h4>
                  <div className="flex flex-wrap gap-2">
                    {fabricInfo.useCases.map((useCase, idx) => (
                      <span key={idx} className="px-4 py-2 bg-[var(--charcoal-ink)]/5 border border-[var(--charcoal-ink)]/10 text-[var(--charcoal-ink)] text-xs font-bold uppercase tracking-wider rounded shadow-sm">
                        {useCase}
                      </span>
                    ))}
                  </div>
                </div>
              </div>

              {/* Right Column: Deep Dive */}
              <div className="lg:col-span-8 max-w-3xl">
                
                {/* E-E-A-T Author Block */}
                <div className="flex items-center gap-4 p-5 mb-10 bg-[var(--charcoal-ink)]/5 border border-[var(--charcoal-ink)]/10 rounded-2xl">
                  <div className="w-12 h-12 rounded-full bg-[var(--turmeric)] flex items-center justify-center text-[var(--charcoal-ink)] font-serif italic font-bold text-xl">
                    S
                  </div>
                  <div>
                    <p className="font-sans font-bold text-sm text-[var(--charcoal-ink)]">Expertly Curated</p>
                    <p className="font-sans text-xs text-[var(--charcoal-ink)]/90">Fact-checked by Senior Textile Specialists at Mithila Enterprises</p>
                  </div>
                </div>
                
                <h2 className="text-3xl md:text-4xl font-serif italic font-bold text-[var(--charcoal-ink)] border-b border-[var(--charcoal-ink)]/10 pb-6 mb-8">A Brief History</h2>
                <p className="font-sans text-lg text-[var(--charcoal-ink)]/90 leading-relaxed text-justify mb-16 first-letter:text-6xl first-letter:font-serif first-letter:italic first-letter:mr-2 first-letter:float-left first-letter:text-[var(--charcoal-ink)]">
                  {fabricInfo.history}
                </p>

                <h2 className="text-3xl md:text-4xl font-serif italic font-bold text-[var(--charcoal-ink)] border-b border-[var(--charcoal-ink)]/10 pb-6 mb-8">Crafting the Cloth</h2>
                <p className="font-sans text-lg text-[var(--charcoal-ink)]/90 leading-relaxed text-justify mb-20">
                  {fabricInfo.howItsMade}
                </p>

                <div className="bg-[#1c1917] text-[#f7f3cc] p-10 md:p-16 rounded-[2rem] shadow-2xl relative overflow-hidden">
                  <div className="absolute top-0 right-0 w-64 h-64 bg-[#f59e0b]/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/4" />
                  <div className="absolute bottom-0 left-0 w-48 h-48 bg-[#dc2626]/10 rounded-full blur-3xl translate-y-1/3 -translate-x-1/3" />
                  <span className="text-[#f59e0b] font-sans uppercase text-[10px] tracking-[0.3em] font-bold block mb-4 relative z-10">The Market View</span>
                  <h2 className="text-3xl md:text-4xl font-serif italic font-bold text-[#f7f3cc] mb-8 relative z-10 leading-tight">Modern Fashion Trends</h2>
                  <p className="font-sans text-[#f7f3cc]/90 text-lg md:text-xl leading-relaxed text-justify relative z-10">
                    {fabricInfo.fashionTrends}
                  </p>
                </div>

              </div>
            </div>
          </div>
        </section>
      )}
      {/* 2.5 FABRIC TYPES / VARIATIONS */}
      {fabricInfo && fabricInfo.types && fabricInfo.types.length > 0 && (
        <section className="py-24 border-t border-[var(--charcoal-ink)]/10 bg-[var(--unbleached-cotton)] relative">
          <div className="absolute inset-0 bg-white/40" />
          <div className="container mx-auto px-6 md:px-8 relative z-10">
            <div className="max-w-3xl mb-16 text-center mx-auto">
              <span className="text-[var(--madder-red)] font-sans uppercase text-xs tracking-[0.2em] font-bold block mb-4">Category Variations</span>
              <h2 className="text-3xl md:text-5xl font-serif italic font-bold text-[var(--charcoal-ink)]">Types of {category.name}</h2>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {fabricInfo.types.map((type, idx) => (
                <div key={idx} className="bg-white p-8 rounded-[2rem] border border-[var(--charcoal-ink)]/5 shadow-xl shadow-[var(--charcoal-ink)]/5 hover:shadow-2xl hover:-translate-y-2 transition-all duration-500 flex flex-col h-full group">
                  <div className="flex items-center gap-4 mb-6">
                    <span className="text-[var(--turmeric)] text-2xl group-hover:rotate-180 transition-transform duration-700">✦</span>
                    <h3 className="font-serif italic text-2xl font-bold text-[var(--charcoal-ink)]">{type.name}</h3>
                  </div>
                  <p className="font-sans text-zinc-800 text-[15px] leading-relaxed mb-8 flex-grow font-light">{type.description}</p>
                  <div className="pt-6 border-t border-[var(--charcoal-ink)]/5">
                    <span className="block text-[10px] font-sans uppercase tracking-[0.25em] font-bold text-[var(--charcoal-ink)]/90 mb-3">Primary Usage</span>
                    <p className="font-sans font-semibold text-sm text-[var(--charcoal-ink)]">{type.usage}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* 3. PRODUCT GRID */}
      <section className="py-24 bg-[var(--charcoal-ink)]/5 border-t border-[var(--charcoal-ink)]/10">
        <div className="container mx-auto px-6 md:px-8">
          <div className="flex justify-between items-end mb-12">
            <div>
              <span className="text-[var(--madder-red)] font-sans uppercase text-xs tracking-[0.2em] font-bold block mb-2">Available Inventory</span>
              <h2 className="font-serif italic text-3xl md:text-4xl font-bold text-[var(--charcoal-ink)]">Shop {category.name}</h2>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 lg:gap-10">
            {variants && variants.length > 0 ? (
              variants.map((variant) => (
                <Link key={variant.id} href={`/product/${variant.products?.slug}`} className="polaroid-card group flex flex-col w-full bg-[var(--unbleached-cotton)] border border-[var(--charcoal-ink)]/10 shadow-sm hover:shadow-[4px_4px_0_var(--charcoal-ink)] transition-shadow">
                  <div className="aspect-[3/4] bg-neutral-200 mb-4 overflow-hidden rounded-md relative border border-[var(--charcoal-ink)]/5">
                    {variant.images && variant.images[0] ? (
                      <Image src={variant.images[0]} fill alt={variant.products?.title || 'Product'} className="object-cover group-hover:scale-105 transition-transform duration-700" sizes="(max-width: 768px) 100vw, 25vw" />
                    ) : (
                      <div className="w-full h-full bg-neutral-300"></div>
                    )}
                    {variant.products?.is_featured && (
                      <span className="absolute top-4 left-4 bg-[var(--madder-red)] text-white text-[9px] font-bold px-3 py-1.5 uppercase tracking-wider rounded-md shadow-sm">
                        Featured
                      </span>
                    )}
                  </div>
                  <div className="px-2 pb-2">
                    <span className="text-[9px] uppercase font-bold tracking-wider text-zinc-700">{variant.products?.weave} Weave</span>
                    <h3 className="font-serif font-bold text-lg text-[var(--charcoal-ink)] mt-1 group-hover:text-[var(--madder-red)] transition-colors">{variant.products?.title}</h3>
                    <p className="font-sans text-xs opacity-70 mt-1">{variant.color} colorway</p>
                    <p className="font-sans font-bold text-[var(--charcoal-ink)] mt-3">₹{variant.price} / meter</p>
                  </div>
                </Link>
              ))
            ) : (
              <div className="col-span-full py-24 text-center sonic-bento-card bg-[var(--unbleached-cotton)] border border-[var(--charcoal-ink)]/10 shadow-lg">
                <div className="w-16 h-16 mx-auto relative mb-6">
                  <Image src="/images/logo.png" alt="Mithila Enterprises Logo" fill className="object-contain" />
                </div>
                 <p className="font-serif italic text-4xl font-bold text-[var(--charcoal-ink)] mb-4">Curating {category.name}</p>
                 <p className="font-sans text-lg text-[var(--charcoal-ink)]/90 max-w-lg mx-auto leading-relaxed">Our weavers are currently preparing the newest collection of {category.name.toLowerCase()} fabrics. Check back soon for fresh inventory.</p>
              </div>
            )}
          </div>
        </div>
      </section>

      {/* 4. TECHNICAL SOURCING & PATTERN-MAKER SPECIFICATIONS */}
      <section className="py-20 border-t border-[var(--charcoal-ink)]/10 bg-white">
        <div className="container mx-auto px-6 md:px-8 max-w-7xl">
          <div className="max-w-3xl mb-12 space-y-2">
            <span className="text-[var(--madder-red)] font-sans uppercase text-xs tracking-widest font-bold">
              Atelier Standard
            </span>
            <h2 className="text-3xl md:text-4xl font-serif italic font-bold text-[var(--charcoal-ink)]">
              {category.name} Cutting &amp; Sourcing Specifications
            </h2>
            <p className="font-sans text-sm text-zinc-600">
              Every meter of {category.name.toLowerCase()} dispatched from our Delhi warehouse complies with strict atelier inspection standards.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="p-6 bg-[var(--unbleached-cotton)] border-2 border-[var(--charcoal-ink)] shadow-[4px_4px_0_var(--charcoal-ink)] rounded-sm space-y-3">
              <div className="flex items-center gap-2">
                <span className="text-[var(--madder-red)] font-bold text-lg">01</span>
                <h3 className="font-serif italic font-bold text-lg text-[var(--charcoal-ink)]">
                  Fractional Continuous Meterage
                </h3>
              </div>
              <p className="font-sans text-xs text-zinc-700 leading-relaxed text-justify">
                Order custom yardage in 0.5-meter increments starting at 1 meter. We guarantee that orders for 3, 5, or 10 meters are cut as one single, continuous, uninterrupted length off the master bolt — zero stitched scraps or surprise remnant breaks.
              </p>
            </div>

            <div className="p-6 bg-[var(--unbleached-cotton)] border-2 border-[var(--charcoal-ink)] shadow-[4px_4px_0_var(--charcoal-ink)] rounded-sm space-y-3">
              <div className="flex items-center gap-2">
                <span className="text-[var(--madder-red)] font-bold text-lg">02</span>
                <h3 className="font-serif italic font-bold text-lg text-[var(--charcoal-ink)]">
                  Calibrated GSM &amp; Shrinkage
                </h3>
              </div>
              <p className="font-sans text-xs text-zinc-700 leading-relaxed text-justify">
                Natural artisanal textiles naturally relax when first immersed in water. Our {category.name.toLowerCase()} carries an expected relaxation shrinkage of 3% to 5% lengthwise. We recommend pre-washing uncut yardage in cold water before laying pattern pieces.
              </p>
            </div>

            <div className="p-6 bg-[var(--unbleached-cotton)] border-2 border-[var(--charcoal-ink)] shadow-[4px_4px_0_var(--charcoal-ink)] rounded-sm space-y-3">
              <div className="flex items-center gap-2">
                <span className="text-[var(--madder-red)] font-bold text-lg">03</span>
                <h3 className="font-serif italic font-bold text-lg text-[var(--charcoal-ink)]">
                  Swatch Recovery Credit
                </h3>
              </div>
              <p className="font-sans text-xs text-zinc-700 leading-relaxed text-justify">
                Unsure about hand-feel or color matching? Order our curated fabric sample card for ₹99. Every single rupee spent on sampling is 100% credited back to your account towards your first meterage order.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* 5. B2B WHOLESALE & ROLL SOURCING DESK */}
      <section className="py-20 border-t border-[var(--charcoal-ink)]/10 bg-[var(--charcoal-ink)] text-[var(--unbleached-cotton)]">
        <div className="container mx-auto px-6 md:px-8 max-w-7xl">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
            <div className="lg:col-span-8 space-y-4">
              <div className="flex items-center gap-2">
                <span className="px-3 py-1 bg-[#f59e0b] text-zinc-950 font-bold text-[10px] uppercase tracking-wider rounded-sm">
                  B2B Commercial Procurement
                </span>
                <span className="text-xs text-zinc-400 font-mono">MOQ 50 Meters</span>
              </div>
              <h2 className="font-serif italic text-3xl md:text-5xl font-bold text-white">
                Sourcing {category.name} in Bulk Rolls (Thaans)?
              </h2>
              <p className="font-sans text-sm md:text-base text-zinc-300 max-w-2xl leading-relaxed">
                We supply garment export houses, boutique fashion labels, and bespoke tailoring houses across India with wholesale roll pricing, certified dye-lot continuity, and statutory GST 2.0 invoices (CGST Rule 46) directly from our Okhla warehouse.
              </p>
              <div className="flex flex-wrap gap-6 pt-2 font-sans text-xs text-zinc-300">
                <div className="flex items-center gap-2">
                  <span className="text-[#f59e0b]">✓</span>
                  <span>50m+ Single Bolt Continuous Rolls</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-[#f59e0b]">✓</span>
                  <span>100m Custom Vat Dyeing Available</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-[#f59e0b]">✓</span>
                  <span>Pan-India Pallet Freight from Okhla Phase-II</span>
                </div>
              </div>
            </div>

            <div className="lg:col-span-4 flex flex-col gap-3">
              <a
                href={`https://wa.me/919818555220?text=${encodeURIComponent(
                  `Hi Mithila Enterprises, I am inquiring about B2B wholesale roll pricing for ${category.name} (MOQ 50m).`
                )}`}
                target="_blank"
                rel="noopener noreferrer"
                className="w-full py-4 px-6 bg-[#25D366] text-white text-xs font-bold uppercase tracking-wider rounded-sm hover:bg-[#20ba59] transition-all shadow-md text-center"
              >
                WhatsApp Wholesale RFQ &rarr;
              </a>
              <Link
                href="/wholesale"
                className="w-full py-3.5 px-6 bg-white/10 text-white text-xs font-bold uppercase tracking-wider rounded-sm hover:bg-white/20 transition-all text-center border border-white/20"
              >
                Explore B2B Wholesale Portal
              </Link>
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}
