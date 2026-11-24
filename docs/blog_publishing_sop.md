# Standard Operating Procedure (SOP): 2 Blogs Daily Publishing & Repurposing Engine

> The operational playbook for publishing 60 high-ranking, E-E-A-T compliant articles every month on **Mithila Enterprises**.

---

## 1. Daily Editorial Workflow & Timetable

```
08:30 AM IST  ──  Review Slot 1 Draft (Technical / Material Science)
09:30 AM IST  ──  PUBLISH Slot 1 Article on /blog
10:00 AM IST  ──  Distribute Slot 1: LinkedIn B2B Post + X (Twitter) Technical Breakdown
03:30 PM IST  ──  Review Slot 2 Draft (Heritage / Culture / Sustainability)
05:30 PM IST  ──  PUBLISH Slot 2 Article on /blog
06:30 PM IST  ──  Distribute Slot 2: Instagram Carousel/Reel + Pinterest Pin + GBP Update
```

---

## 2. Pre-Flight E-E-A-T Checklist (Must Pass 6/6 Before Publishing)

Before any draft goes live, verify:
- [ ] **First 80 Words Definition:** Contains a bolded, factual definition directly answering the target keyword (optimized for Google AI Overviews).
- [ ] **Technical Data Box:** Includes exact fiber specifications (Yarn count / Lea / GSM / Weave construction / Shrinkage %).
- [ ] **Zero AI Tells:** Inspected for banned AI vocabulary (*leverage, streamline, delve, harness, unlock, elevate, fundamentally*). Em dashes capped at max 1 per 100 words.
- [ ] **Minimum Word Count:** At least 1,200 words (pillar guides target 1,800+ words).
- [ ] **Internal Linking Triad:**
  1. Links upward to parent category (e.g. `/category/linen`).
  2. Links laterally to related cluster post.
  3. Links downward to `/shop` or `/wholesale` with actionable anchor text.
- [ ] **JSON-LD Verification:** Verifies `Article` schema, Open Graph image, and dynamic canonical URL.

---

## 3. The 1-to-5 Repurposing Multiplier

Every published blog post automatically spawns 5 cross-platform assets without starting from scratch:

```
                          ┌───────────────────────┐
                          │  1 PUBLISHED ARTICLE  │
                          └───────────┬───────────┘
                                      │
          ┌──────────────┬────────────┼────────────┬──────────────┐
          │              │            │            │              │
    ┌─────▼─────┐  ┌─────▼─────┐┌─────▼─────┐┌─────▼─────┐  ┌─────▼─────┐
    │ LINKEDIN  │  │ X THREAD  ││ INSTAGRAM ││ PINTEREST │  │ GOOGLE BP │
    │ B2B Post  │  │ 5-7 Tweets││ Carousel  ││ Rich Pin  │  │ Local Post│
    └───────────┘  └───────────┘└───────────┘└───────────┘  └───────────┘
```

1. **LinkedIn Post:** Extract the core business or sourcing lesson (e.g., *"Why 40 Lea linen solves drape issues for tailored trousers"*).
2. **X (Twitter) Thread:** Turn the article's H2 headings into a 5-tweet micro-thread with a provocative hook.
3. **Instagram Carousel:** Turn the article's core comparison into a 7-slide educational visual swipe file using the IG5 or IG6 formula.
4. **Pinterest Pin:** Pin high-res fabric photo linking directly to the blog slug.
5. **Google Business Profile (GBP):** Post a 100-word excerpt with a "Learn More" button linking to the article.

---

## 4. How to Add New Articles to the Codebase

Articles can be added directly to the static data repository in seconds:

1. Open `src/lib/blog-data.ts`.
2. Append a new `BlogPost` object to `blogPosts`:
   ```ts
   {
     slug: 'your-target-slug-from-calendar',
     title: 'Target H1 Title Matching Search Intent',
     date: 'Current Date, 2026',
     author: 'Mithila Enterprises Atelier',
     category: 'Material Science', // or 'Heritage' / 'Sustainability'
     excerpt: '1-2 sentence compelling summary with primary keyword.',
     coverImage: '/images/fabrics/linen.png',
     content: `Full markdown article text...`
   }
   ```
3. Run `npm run build` or push to GitHub — Next.js will automatically generate the SSG route, inject JSON-LD, update `sitemap.xml`, and update `/blog` instantly.
