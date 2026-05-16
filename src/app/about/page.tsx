export default function AboutPage() {
  return (
    <main className="flex-grow max-w-3xl mx-auto px-4 py-16 w-full">
      <h1 className="font-serif text-4xl font-bold text-[var(--charcoal-ink)] mb-6">Our Heritage</h1>
      <div className="w-full h-64 bg-[var(--charcoal-ink)] opacity-10 mb-8 kachni-border"></div>
      <article className="prose prose-lg font-sans text-[var(--charcoal-ink)]">
        <p>
          Mithila Enterprises was born from a deep reverence for the ancient art of Madhubani. 
          For generations, our artisans have woven stories of nature, mythology, and daily life into 
          intricate patterns, originally painted on mud walls and floors.
        </p>
        <p>
          Today, we bring this rich cultural tapestry to the world through premium, sustainably 
          sourced cotton and linen fabrics. Each thread carries the legacy of Mithila, blending 
          traditional motifs with modern elegance.
        </p>
      </article>
    </main>
  );
}
