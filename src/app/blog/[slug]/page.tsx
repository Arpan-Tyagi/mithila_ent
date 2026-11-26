import React from 'react';
import { jsonLd } from '@/lib/json-ld';
import Image from 'next/image';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { getPostBySlug, getAllPosts } from '@/lib/blog-data';
import BackgroundPattern from '@/components/vectors/BackgroundPattern';
import type { Metadata } from 'next';
import { getSiteUrl } from '@/lib/site-url';

/* ── Static Params ── */
export function generateStaticParams() {
  return getAllPosts().map((post) => ({ slug: post.slug }));
}

/* ── Dynamic Metadata ── */
export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const post = getPostBySlug(slug);
  if (!post) return { title: 'Post Not Found' };

  const siteUrl = getSiteUrl();
  const url = `${siteUrl}/blog/${slug}`;
  const title = `${post.title} | The Weaver's Journal`;
  const description = post.excerpt;
  const imageUrl = post.coverImage.startsWith('http')
    ? post.coverImage
    : `${siteUrl}${post.coverImage}`;

  return {
    title,
    description,
    alternates: {
      canonical: url,
    },
    openGraph: {
      title,
      description,
      url,
      type: 'article',
      images: [
        {
          url: imageUrl,
          alt: post.title,
        },
      ],
    },
    twitter: {
      card: 'summary_large_image',
      title,
      description,
      images: [imageUrl],
    },
  };
}

/* ── Page Component ── */
export default async function BlogPostPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const post = getPostBySlug(slug);
  if (!post) notFound();

  const siteUrl = getSiteUrl();
  const allPosts = getAllPosts();
  const relatedPosts = allPosts
    .filter((p) => p.slug !== post.slug)
    .slice(0, 3);

  const paragraphs = post.content.split('\n\n');

  // Detect relevant category for commercial conversion targeting
  const getTargetCategory = (s: string) => {
    if (s.includes('linen')) return { slug: 'linen', name: 'Pure Linen' };
    if (s.includes('cotton') || s.includes('handloom') || s.includes('indigo'))
      return { slug: 'cotton', name: 'Organic & Handloom Cotton' };
    if (s.includes('twill') || s.includes('shirting'))
      return { slug: 'twill', name: 'Cotton Twill' };
    if (s.includes('corduroy'))
      return { slug: 'corduroy', name: 'Ribbed Corduroy' };
    if (s.includes('velvet'))
      return { slug: 'velvet', name: 'Luxury Velvet' };
    if (s.includes('tweed') || s.includes('wool'))
      return { slug: 'tweed', name: 'Wool Tweed' };
    return { slug: 'linen', name: 'Artisan Textiles' };
  };

  const targetCategory = getTargetCategory(post.slug);

  const articleLd = {
    '@context': 'https://schema.org',
    '@type': 'Article',
    headline: post.title,
    description: post.excerpt,
    image: post.coverImage.startsWith('http') ? post.coverImage : `${siteUrl}${post.coverImage}`,
    author: {
      '@type': 'Organization',
      name: post.author || 'Mithila Enterprises',
      url: siteUrl,
    },
    publisher: {
      '@type': 'Organization',
      name: 'Mithila Enterprises',
      logo: {
        '@type': 'ImageObject',
        url: `${siteUrl}/images/logo.png`,
      },
    },
    mainEntityOfPage: {
      '@type': 'WebPage',
      '@id': `${siteUrl}/blog/${post.slug}`,
    },
  };

  const breadcrumbsLd = {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: [
      { '@type': 'ListItem', position: 1, name: 'Home', item: siteUrl },
      { '@type': 'ListItem', position: 2, name: "The Weaver's Journal", item: `${siteUrl}/blog` },
      { '@type': 'ListItem', position: 3, name: post.title, item: `${siteUrl}/blog/${post.slug}` },
    ],
  };

  return (
    <main className="flex-grow w-full bg-transparent text-[var(--charcoal-ink)] pt-24 md:pt-28 pb-24 font-sans overflow-x-hidden relative">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: jsonLd(articleLd) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: jsonLd(breadcrumbsLd) }}
      />
      {/* ── Hero Cover Image ── */}
      <section className="relative w-full max-w-7xl mx-auto px-6">
        <div className="relative w-full aspect-[21/9] overflow-hidden rounded-sm border-2 border-[var(--charcoal-ink)] shadow-[6px_6px_0_var(--charcoal-ink)]">
          <Image
            src={post.coverImage}
            alt={post.title}
            fill
            sizes="100vw"
            className="object-cover"
            priority
          />
          {/* Gradient overlay for legibility */}
          <div className="absolute inset-0 bg-gradient-to-t from-[var(--charcoal-ink)]/60 via-transparent to-transparent" />
        </div>
      </section>

      {/* ── Article Header ── */}
      <section className="relative w-full max-w-4xl mx-auto px-6 mt-10 md:mt-14">
        <BackgroundPattern className="opacity-20" />

        <div className="relative z-10 space-y-5">
          {/* Category · Date · Author */}
          <div className="flex flex-wrap items-center gap-3 text-xs font-sans">
            <span className="inline-block px-3 py-1 bg-[var(--charcoal-ink)] text-[var(--unbleached-cotton)] font-bold uppercase tracking-widest rounded-sm">
              {post.category}
            </span>
            <span className="text-zinc-800 font-semibold uppercase tracking-wider">
              {post.date}
            </span>
            <span className="text-zinc-800">·</span>
            <span className="text-zinc-700 font-medium">{post.author}</span>
          </div>

          {/* Title */}
          <h1 className="font-serif italic text-3xl sm:text-4xl lg:text-5xl font-bold leading-[1.15] text-[var(--charcoal-ink)]">
            {post.title}
          </h1>

          {/* Decorative divider */}
          <div className="flex items-center gap-3 pt-2">
            <span className="block w-16 h-px bg-[var(--madder-red)]" />
            <svg
              width="14"
              height="14"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.5"
              className="text-[var(--madder-red)]"
            >
              <path d="M12 2L2 12l10 10 10-10L12 2z" />
              <circle cx="12" cy="12" r="1.5" fill="currentColor" />
            </svg>
            <span className="block w-16 h-px bg-[var(--madder-red)]" />
          </div>
        </div>
      </section>

      {/* ── Article Body ── */}
      <article className="relative w-full max-w-4xl mx-auto px-6 mt-10 md:mt-14">
        <div className="space-y-6">
          {paragraphs.map((paragraph, idx) => (
            <React.Fragment key={idx}>
              <p className="font-sans text-sm md:text-base text-zinc-700 leading-[1.85] text-justify">
                {paragraph}
              </p>

              {/* ── Mid-Article Swatch Card Hook (Appears after 2nd paragraph) ── */}
              {idx === 1 && (
                <aside className="my-8 p-6 md:p-8 bg-[var(--unbleached-cotton)] border-2 border-[var(--charcoal-ink)] shadow-[5px_5px_0_var(--charcoal-ink)] rounded-sm">
                  <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                    <div className="space-y-2">
                      <div className="flex items-center gap-2">
                        <span className="inline-block px-2.5 py-0.5 bg-[var(--madder-red)] text-white text-[10px] font-bold uppercase tracking-widest rounded-sm">
                          Designer Sample Kit
                        </span>
                        <span className="text-[10px] font-bold uppercase tracking-wider text-zinc-600">
                          100% Refundable
                        </span>
                      </div>
                      <h3 className="font-serif italic text-xl md:text-2xl font-bold text-[var(--charcoal-ink)]">
                        Touch &amp; Feel Before You Cut: Order Swatch Card for ₹99
                      </h3>
                      <p className="font-sans text-xs md:text-sm text-zinc-700 max-w-xl leading-relaxed">
                        Evaluate the true yarn count (Lea), exact GSM weight, and hand-feel on your cutting table.
                        <strong className="text-[var(--charcoal-ink)]"> Every rupee spent on swatches is 100% credited back</strong> toward your first meterage order.
                      </p>
                    </div>
                    <div className="flex flex-col sm:flex-row md:flex-col gap-2.5 shrink-0">
                      <Link
                        href={`/category/${targetCategory.slug}`}
                        className="inline-flex items-center justify-center px-5 py-2.5 bg-[var(--charcoal-ink)] text-[var(--unbleached-cotton)] text-xs font-bold uppercase tracking-wider rounded-sm hover:bg-[var(--madder-red)] transition-colors shadow-sm text-center"
                      >
                        Shop {targetCategory.name} by Meter &rarr;
                      </Link>
                      <Link
                        href="/shop"
                        className="inline-flex items-center justify-center px-5 py-2.5 bg-white border-2 border-[var(--charcoal-ink)] text-[var(--charcoal-ink)] text-xs font-bold uppercase tracking-wider rounded-sm hover:bg-neutral-100 transition-colors text-center"
                      >
                        Order Swatch Kit (₹99)
                      </Link>
                    </div>
                  </div>
                </aside>
              )}
            </React.Fragment>
          ))}
        </div>

        {/* ── End-of-Article Dual-Track Commerce Section (Retail & B2B) ── */}
        <section className="mt-14 pt-10 border-t-2 border-[var(--charcoal-ink)]/15">
          <div className="text-center max-w-xl mx-auto mb-8 space-y-2">
            <span className="text-[var(--madder-red)] font-sans text-xs uppercase tracking-widest font-bold">
              Direct Sourcing
            </span>
            <h3 className="font-serif italic text-2xl md:text-3xl font-bold text-[var(--charcoal-ink)]">
              Source {targetCategory.name} Online
            </h3>
            <p className="font-sans text-xs md:text-sm text-zinc-600">
              Whether you need 2 meters for bespoke tailoring or 200 meters for collection manufacturing.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Retail Track */}
            <div className="p-6 md:p-8 bg-white border-2 border-[var(--charcoal-ink)] shadow-[4px_4px_0_var(--charcoal-ink)] rounded-sm flex flex-col justify-between">
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-bold uppercase tracking-widest text-[var(--madder-red)]">
                    Retail &amp; Bespoke
                  </span>
                  <span className="text-xs font-bold bg-neutral-100 text-zinc-800 px-2.5 py-0.5 rounded border border-neutral-200">
                    From 0.5m Cuts
                  </span>
                </div>
                <h4 className="font-serif italic text-xl font-bold text-[var(--charcoal-ink)]">
                  Buy by the Meter Online
                </h4>
                <p className="font-sans text-xs text-zinc-600 leading-relaxed">
                  Continuous fractional meterage cut directly from single bolts. Zero remnant splices, verified Lea/GSM specifications, and fast dispatch across India within 24 hours.
                </p>
              </div>
              <div className="pt-6 mt-4 border-t border-neutral-100">
                <Link
                  href={`/category/${targetCategory.slug}`}
                  className="block w-full py-3 text-center bg-[var(--charcoal-ink)] text-[var(--unbleached-cotton)] text-xs font-bold uppercase tracking-wider hover:bg-[var(--madder-red)] transition-colors rounded-sm"
                >
                  Order {targetCategory.name} by the Meter &rarr;
                </Link>
              </div>
            </div>

            {/* B2B Wholesale Track */}
            <div className="p-6 md:p-8 bg-[var(--charcoal-ink)] text-[var(--unbleached-cotton)] border-2 border-[var(--charcoal-ink)] shadow-[4px_4px_0_var(--madder-red)] rounded-sm flex flex-col justify-between">
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-bold uppercase tracking-widest text-[#f59e0b]">
                    B2B &amp; Factory Supply
                  </span>
                  <span className="text-xs font-bold bg-white/10 text-white px-2.5 py-0.5 rounded border border-white/20">
                    50m+ Roll MOQ
                  </span>
                </div>
                <h4 className="font-serif italic text-xl font-bold text-white">
                  Wholesale Rolls &amp; Custom Dyes
                </h4>
                <p className="font-sans text-xs text-zinc-300 leading-relaxed">
                  Supplying garment export houses, fashion labels, and boutique studios with certified single-bolt thaans, custom vat dye lots, and GST 2.0 compliant invoices from our Okhla warehouse.
                </p>
              </div>
              <div className="pt-6 mt-4 border-t border-white/10 flex flex-col sm:flex-row gap-2.5">
                <a
                  href={`https://wa.me/919818555220?text=${encodeURIComponent(
                    `Hi Mithila Enterprises, I am inquiring about wholesale bulk roll pricing for ${post.title}.`
                  )}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex-1 py-3 text-center bg-[#25D366] text-white text-xs font-bold uppercase tracking-wider hover:bg-[#20ba59] transition-colors rounded-sm shadow-sm"
                >
                  WhatsApp Bulk RFQ
                </a>
                <Link
                  href="/wholesale"
                  className="flex-1 py-3 text-center bg-white/10 text-white text-xs font-bold uppercase tracking-wider hover:bg-white/20 transition-colors rounded-sm"
                >
                  Wholesale Portal
                </Link>
              </div>
            </div>
          </div>
        </section>
      </article>

      {/* ── Back Link ── */}
      <section className="w-full max-w-4xl mx-auto px-6 mt-16 md:mt-20">
        <div className="border-t-2 border-[var(--charcoal-ink)]/10 pt-8">
          <Link
            href="/blog"
            className="inline-flex items-center gap-2 text-xs font-bold text-[var(--madder-red)] uppercase tracking-widest hover:text-[var(--charcoal-ink)] transition-colors"
          >
            <span aria-hidden="true">&larr;</span>
            Back to All Articles
          </Link>
        </div>
      </section>

      {/* ── Related Articles ── */}
      {relatedPosts.length > 0 && (
        <section className="w-full max-w-7xl mx-auto px-6 mt-16 md:mt-24">
          <div className="text-center mb-12 space-y-3">
            <span className="text-[var(--madder-red)] font-sans text-xs uppercase tracking-widest font-semibold">
              Keep Reading
            </span>
            <h2 className="font-serif italic text-2xl md:text-3xl font-bold text-[var(--charcoal-ink)]">
              Related Articles
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {relatedPosts.map((related) => (
              <Link
                key={related.slug}
                href={`/blog/${related.slug}`}
                className="group block"
              >
                <article className="flex flex-col h-full border-2 border-[var(--charcoal-ink)] shadow-[4px_4px_0_var(--charcoal-ink)] bg-[var(--unbleached-cotton)] hover:shadow-[6px_6px_0_var(--madder-red)] hover:border-[var(--madder-red)] transition-all duration-300 rounded-sm overflow-hidden">
                  {/* Image */}
                  <div className="relative aspect-[4/3] w-full overflow-hidden bg-neutral-100">
                    <Image
                      src={related.coverImage}
                      alt={related.title}
                      fill
                      sizes="(max-width: 768px) 100vw, 33vw"
                      className="object-cover transition-transform duration-700 group-hover:scale-105"
                    />
                    <span className="absolute top-3 left-3 inline-block px-3 py-1 bg-[var(--charcoal-ink)] text-[var(--unbleached-cotton)] text-[10px] font-bold uppercase tracking-widest rounded-sm">
                      {related.category}
                    </span>
                  </div>

                  {/* Body */}
                  <div className="flex flex-col flex-grow p-6 space-y-3">
                    <span className="text-[10px] uppercase font-bold tracking-wider text-zinc-800">
                      {related.date}
                    </span>
                    <h3 className="font-serif italic font-bold text-lg leading-snug text-[var(--charcoal-ink)] group-hover:text-[var(--madder-red)] transition-colors line-clamp-2">
                      {related.title}
                    </h3>
                    <p className="font-sans text-xs text-zinc-700 leading-relaxed line-clamp-3 flex-grow">
                      {related.excerpt}
                    </p>
                    <span className="inline-flex items-center gap-1 text-xs font-bold text-[var(--madder-red)] uppercase tracking-wider pt-3 border-t border-[var(--charcoal-ink)]/10 group-hover:gap-2 transition-all">
                      Read Article
                      <span aria-hidden="true">&rarr;</span>
                    </span>
                  </div>
                </article>
              </Link>
            ))}
          </div>
        </section>
      )}
    </main>
  );
}
