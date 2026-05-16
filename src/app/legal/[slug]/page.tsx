import { notFound } from 'next/navigation';

const legalContent: Record<string, { title: string; content: string }> = {
  'terms': { title: 'Terms & Conditions', content: 'These are the terms and conditions...' },
  'privacy': { title: 'Privacy Policy', content: 'Your privacy is important to us...' },
  'returns': { title: 'Return Policy', content: 'We accept returns within 30 days...' },
};

export function generateStaticParams() {
  return [{ slug: 'terms' }, { slug: 'privacy' }, { slug: 'returns' }];
}

export default function LegalPage({ params }: { params: { slug: string } }) {
  const data = legalContent[params.slug];
  if (!data) return notFound();

  return (
    <main className="flex-grow max-w-3xl mx-auto px-4 py-16 w-full">
      <h1 className="font-serif text-3xl font-bold text-[var(--charcoal-ink)] mb-8">{data.title}</h1>
      <article className="prose font-sans text-[var(--charcoal-ink)] opacity-80">
        <p>{data.content}</p>
      </article>
    </main>
  );
}
