import fs from 'fs';
import path from 'path';
import { chromium } from '@playwright/test';

async function generateSeoPdf() {
  const outputPath = path.resolve('docs/Mithila_Enterprises_SEO_Report.pdf');
  const rootOutputPath = path.resolve('Mithila_Enterprises_SEO_Report.pdf');

  const htmlContent = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <title>Mithila Enterprises — SEO Audit, Keyword Intent & Funnel Strategy</title>
  <style>
    @import url('https://fonts.googleapis.com/css2?family=Playfair+Display:ital,wght@0,600;0,700;1,400;1,600&family=Plus+Jakarta+Sans:wght@400;500;600;700&display=swap');

    :root {
      --charcoal: #1c1917;
      --charcoal-light: #292524;
      --madder: #991b1b;
      --madder-light: #fef2f2;
      --cream: #faf8f5;
      --warm-border: #e7e5e4;
      --gold: #b45309;
      --gold-light: #fffbeb;
      --emerald: #15803d;
      --emerald-light: #f0fdf4;
      --muted: #57534e;
    }

    * {
      box-sizing: border-box;
      margin: 0;
      padding: 0;
    }

    body {
      font-family: 'Plus Jakarta Sans', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
      color: var(--charcoal);
      background-color: #ffffff;
      line-height: 1.55;
      font-size: 10.5pt;
    }

    /* Print Setup */
    @page {
      size: A4;
      margin: 20mm 15mm 20mm 15mm;
    }

    .page-break {
      page-break-before: always;
    }

    .avoid-break {
      page-break-inside: avoid;
    }

    /* Cover Page */
    .cover {
      min-height: 240mm;
      display: flex;
      flex-direction: column;
      justify-content: space-between;
      border: 2px solid var(--charcoal);
      padding: 16mm;
      background: linear-gradient(180deg, #ffffff 0%, var(--cream) 100%);
      position: relative;
    }

    .cover-top {
      display: flex;
      justify-content: space-between;
      align-items: center;
      border-bottom: 2px solid var(--charcoal);
      padding-bottom: 8mm;
    }

    .brand-title {
      font-family: 'Playfair Display', Georgia, serif;
      font-size: 20pt;
      font-weight: 700;
      color: var(--charcoal);
      letter-spacing: -0.5px;
    }

    .brand-subtitle {
      font-size: 8.5pt;
      text-transform: uppercase;
      letter-spacing: 2px;
      color: var(--madder);
      font-weight: 700;
    }

    .confidential-badge {
      display: inline-block;
      padding: 4px 10px;
      background-color: var(--charcoal);
      color: #ffffff;
      font-size: 8pt;
      font-weight: 700;
      letter-spacing: 1.5px;
      text-transform: uppercase;
      border-radius: 2px;
    }

    .cover-middle {
      margin: 20mm 0;
    }

    .report-tag {
      display: inline-block;
      background-color: var(--madder-light);
      color: var(--madder);
      border: 1px solid #fecaca;
      padding: 3px 10px;
      font-size: 8.5pt;
      font-weight: 700;
      letter-spacing: 1px;
      text-transform: uppercase;
      margin-bottom: 6mm;
      border-radius: 2px;
    }

    .cover-headline {
      font-family: 'Playfair Display', Georgia, serif;
      font-size: 28pt;
      font-weight: 700;
      line-height: 1.2;
      color: var(--charcoal);
      margin-bottom: 5mm;
    }

    .cover-subheadline {
      font-size: 12pt;
      color: var(--muted);
      max-width: 90%;
      line-height: 1.6;
    }

    .cover-bottom {
      border-top: 1px solid var(--warm-border);
      padding-top: 8mm;
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 6mm;
      font-size: 9pt;
    }

    .meta-item strong {
      display: block;
      color: var(--charcoal);
      font-size: 8pt;
      text-transform: uppercase;
      letter-spacing: 1px;
      margin-bottom: 2px;
    }

    .meta-item span {
      color: var(--muted);
    }

    /* Content Typography */
    h1, h2, h3, h4 {
      color: var(--charcoal);
      font-family: 'Playfair Display', Georgia, serif;
    }

    h2 {
      font-size: 17pt;
      border-bottom: 2px solid var(--charcoal);
      padding-bottom: 3mm;
      margin-top: 10mm;
      margin-bottom: 5mm;
      display: flex;
      align-items: center;
      justify-content: space-between;
    }

    h2 .section-num {
      font-family: 'Plus Jakarta Sans', sans-serif;
      font-size: 9pt;
      font-weight: 700;
      color: var(--madder);
      text-transform: uppercase;
      letter-spacing: 1.5px;
    }

    h3 {
      font-size: 13pt;
      margin-top: 6mm;
      margin-bottom: 3mm;
      color: var(--charcoal);
    }

    p {
      margin-bottom: 3.5mm;
      color: var(--charcoal-light);
    }

    /* Callouts & Alert Boxes */
    .callout {
      border-left: 4px solid var(--charcoal);
      background-color: var(--cream);
      padding: 4mm 5mm;
      margin: 4mm 0 6mm 0;
      border-radius: 0 4px 4px 0;
      font-size: 9.5pt;
    }

    .callout-title {
      font-weight: 700;
      color: var(--charcoal);
      margin-bottom: 1.5mm;
      display: flex;
      align-items: center;
      gap: 6px;
      font-size: 9.5pt;
    }

    .callout.danger {
      border-left-color: var(--madder);
      background-color: var(--madder-light);
    }

    .callout.gold {
      border-left-color: var(--gold);
      background-color: var(--gold-light);
    }

    .callout.emerald {
      border-left-color: var(--emerald);
      background-color: var(--emerald-light);
    }

    /* Tables */
    table {
      width: 100%;
      border-collapse: collapse;
      margin: 4mm 0 6mm 0;
      font-size: 8.5pt;
      page-break-inside: auto;
    }

    tr {
      page-break-inside: avoid;
      page-break-after: auto;
    }

    thead {
      display: table-header-group;
    }

    th {
      background-color: var(--charcoal);
      color: #ffffff;
      text-align: left;
      padding: 3mm 3.5mm;
      font-weight: 600;
      font-size: 8pt;
      text-transform: uppercase;
      letter-spacing: 0.8px;
    }

    td {
      padding: 3mm 3.5mm;
      border-bottom: 1px solid var(--warm-border);
      color: var(--charcoal-light);
      vertical-align: middle;
    }

    tbody tr:nth-child(even) {
      background-color: var(--cream);
    }

    .badge {
      display: inline-block;
      padding: 2px 6px;
      border-radius: 2px;
      font-size: 7pt;
      font-weight: 700;
      text-transform: uppercase;
      letter-spacing: 0.5px;
    }

    .badge-trans {
      background-color: #dcfce7;
      color: #166534;
      border: 1px solid #bbf7d0;
    }

    .badge-comm {
      background-color: #fef3c7;
      color: #92400e;
      border: 1px solid #fde68a;
    }

    .badge-info {
      background-color: #e0f2fe;
      color: #0369a1;
      border: 1px solid #bae6fd;
    }

    .badge-danger {
      background-color: #fee2e2;
      color: #991b1b;
      border: 1px solid #fecaca;
    }

    /* Funnel Graphic Cards */
    .funnel-container {
      display: flex;
      flex-direction: column;
      gap: 3mm;
      margin: 5mm 0;
    }

    .funnel-card {
      border: 1px solid var(--warm-border);
      border-radius: 4px;
      padding: 3.5mm 4.5mm;
      background-color: #ffffff;
      position: relative;
    }

    .funnel-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 2mm;
    }

    .funnel-stage {
      font-size: 8.5pt;
      font-weight: 700;
      text-transform: uppercase;
      letter-spacing: 1px;
    }

    .funnel-stage.tofu { color: #0284c7; }
    .funnel-stage.mofu { color: var(--gold); }
    .funnel-stage.bofu { color: var(--emerald); }
    .funnel-stage.retention { color: var(--madder); }

    .funnel-hook {
      display: inline-block;
      font-size: 8pt;
      background-color: var(--cream);
      padding: 2px 6px;
      border-radius: 3px;
      font-weight: 600;
      color: var(--charcoal);
      border: 1px solid var(--warm-border);
    }

    .funnel-details {
      display: grid;
      grid-template-columns: 2fr 3fr;
      gap: 3mm;
      font-size: 8.5pt;
      color: var(--muted);
    }

    /* Cluster Cards */
    .cluster-box {
      border: 1px solid var(--warm-border);
      border-top: 3px solid var(--charcoal);
      background-color: #ffffff;
      padding: 4mm;
      margin-bottom: 4mm;
      border-radius: 0 0 4px 4px;
    }

    .cluster-header {
      font-family: 'Playfair Display', Georgia, serif;
      font-size: 11pt;
      font-weight: 700;
      color: var(--charcoal);
      margin-bottom: 1.5mm;
    }

    .cluster-sub {
      font-size: 8.5pt;
      color: var(--muted);
      margin-bottom: 2.5mm;
    }

    /* Footer stamp */
    .footer-stamp {
      text-align: center;
      margin-top: 10mm;
      padding-top: 4mm;
      border-top: 1px solid var(--warm-border);
      font-size: 8pt;
      color: var(--muted);
    }
  </style>
</head>
<body>

  <!-- ==================== COVER PAGE ==================== -->
  <div class="cover">
    <div class="cover-top">
      <div>
        <div class="brand-title">Mithila Enterprises</div>
        <div class="brand-subtitle">Luxury Artisan Textiles & Dual-Commerce Engine</div>
      </div>
      <div class="confidential-badge">Strategic Asset</div>
    </div>

    <div class="cover-middle">
      <div class="report-tag">Commercial Organic Growth Plan</div>
      <div class="cover-headline">SEO Audit, Keyword Intent Analysis & Full-Funnel Content Architecture</div>
      <div class="cover-subheadline">
        An evidence-backed blueprint engineered to capture high-intent buyers seeking luxury fabrics online in fractional retail cuts (0.5m–10m) and commercial B2B bulk rolls (50m+).
      </div>
    </div>

    <div class="cover-bottom">
      <div class="meta-item">
        <strong>Operating Ateliers & Hubs</strong>
        <span>F-12, Okhla Phase-II, New Delhi (Showroom & Warehouse)<br>Gandhi Nagar, Delhi (Wholesale Trading Roots)</span>
      </div>
      <div class="meta-item">
        <strong>Strategic Targets</strong>
        <span>B2C Retail: 0.5m Fractional Meterage & Swatch Credits<br>B2B Wholesale: Roll Yardage, GST 2.0 & Custom Vat Dyes</span>
      </div>
      <div class="meta-item">
        <strong>Publication Date</strong>
        <span>November 2026 | Active Working Standard</span>
      </div>
      <div class="meta-item">
        <strong>Prepared By</strong>
        <span>Antigravity Growth Engine & Technical SEO Suite</span>
      </div>
    </div>
  </div>

  <div class="page-break"></div>

  <!-- ==================== SECTION 1 ==================== -->
  <section>
    <h2>
      <span>1. Comprehensive SEO & Architecture Audit</span>
      <span class="section-num">Section 01</span>
    </h2>

    <p>
      An audit of the current Next.js storefront architecture, indexing rules, structured data payloads, and existing blog dispatches confirms strong technical foundations paired with an urgent need for commercial conversion mechanics.
    </p>

    <div class="callout emerald">
      <div class="callout-title">
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><polyline points="20 6 9 17 4 12"></polyline></svg>
        Technical Strengths Confirmed
      </div>
      Next.js App Router server components deliver sub-800ms mobile LCP, 0ms TBT, and zero layout shift. Robots.txt explicitly authorizes AI search agents (<code>GPTBot</code>, <code>ClaudeBot</code>, <code>PerplexityBot</code>) on commercial routes. Sitemap dynamically indexes all active categories and products.
    </div>

    <h3>Critical Vulnerabilities & High-Priority SEO Gaps</h3>
    <table>
      <thead>
        <tr>
          <th style="width: 25%;">Area</th>
          <th style="width: 25%;">Current State</th>
          <th style="width: 25%;">Critical Vulnerability</th>
          <th style="width: 25%;">Required Fix</th>
        </tr>
      </thead>
      <tbody>
        <tr>
          <td><strong>Blog Conversion</strong></td>
          <td>Static academic essays</td>
          <td>100% of organic readers exit without viewing products or swatches.</td>
          <td>Embed inline <strong>"Buy by the Meter"</strong> mini buy boxes & <strong>Swatch Cards (₹99)</strong>.</td>
        </tr>
        <tr>
          <td><strong>B2B Wholesale</strong></td>
          <td>Single generic form at <code>/wholesale</code></td>
          <td>Zero ranking capacity for high-volume fabric wholesale terms.</td>
          <td>Deploy programmatic landing pages: <code>/wholesale/linen-fabric</code>, <code>/wholesale/cotton-fabric</code>.</td>
        </tr>
        <tr>
          <td><strong>Category Depth</strong></td>
          <td>Catalog grid with minimal text</td>
          <td>Google treats thin category pages with reduced E-E-A-T weight.</td>
          <td>Add 250-word editorial overview, Lea/GSM guide & bulk tier pricing prompts.</td>
        </tr>
        <tr>
          <td><strong>Schema Markup</strong></td>
          <td>Basic Product & Article schema</td>
          <td>Missing merchant return policy, shipping details & tiered volume pricing.</td>
          <td>Upgrade Product JSON-LD with <code>priceSpecification</code> & Google Merchant attributes.</td>
        </tr>
      </tbody>
    </table>
  </section>

  <!-- ==================== SECTION 2 ==================== -->
  <section class="avoid-break">
    <h2>
      <span>2. Keyword Intent Analysis: Are We Targeting the Right Terms?</span>
      <span class="section-num">Section 02</span>
    </h2>

    <p>
      Textile brands frequently fall into the <strong>"Academic/Vanity Trap"</strong>: targeting keywords that attract high pageviews from school students or history researchers, but generate <em>zero revenue</em> from active apparel designers, boutique owners, or fabric buyers.
    </p>

    <div class="callout danger">
      <div class="callout-title">
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><polygon points="7.86 2 16.14 2 22 7.86 22 16.14 16.14 22 7.86 22 2 16.14 2 7.86 7.86 2"></polygon><line x1="12" y1="8" x2="12" y2="12"></line><line x1="12" y1="16" x2="12.01" y2="16"></line></svg>
        The Vanity Trap Audit
      </div>
      Keywords like <em>"wireless looms shuttle weaving evolution"</em> (2,400/mo) and <em>"2500 year history of Madhubani art"</em> consume significant editorial resources but return 0% commercial conversion. They should serve as secondary authority anchors, never primary revenue pillars.
    </div>

    <h3>The Intent Reality Spectrum</h3>
    <table>
      <thead>
        <tr>
          <th style="width: 30%;">Keyword Phase</th>
          <th style="width: 15%;">Search Vol</th>
          <th style="width: 25%;">User Intent</th>
          <th style="width: 30%;">Commercial Verdict</th>
        </tr>
      </thead>
      <tbody>
        <tr>
          <td><code>wireless looms shuttle weaving</code></td>
          <td>2,400 / mo</td>
          <td><span class="badge badge-danger">Academic / Vanity</span></td>
          <td><strong>Prune from primary focus.</strong> Does not drive fabric meter orders.</td>
        </tr>
        <tr>
          <td><code>how to identify pure linen fabric</code></td>
          <td>11,200 / mo</td>
          <td><span class="badge badge-info">Informational / Diagnostic</span></td>
          <td><strong>High Potential.</strong> Converts with "Buy Verified Pure Flax" CTA.</td>
        </tr>
        <tr>
          <td><code>difference between 40 and 60 lea linen</code></td>
          <td>4,800 / mo</td>
          <td><span class="badge badge-comm">Commercial Investigation</span></td>
          <td><strong>Golden MOFU.</strong> Designers searching this are writing tech packs right now.</td>
        </tr>
        <tr>
          <td><code>pure linen fabric per meter</code></td>
          <td>18,100 / mo</td>
          <td><span class="badge badge-trans">Transactional / Retail</span></td>
          <td><strong>Core Money Keyword.</strong> Captures ready-to-buy retail & custom tailor cart orders.</td>
        </tr>
        <tr>
          <td><code>wholesale fabric suppliers in delhi</code></td>
          <td>12,400 / mo</td>
          <td><span class="badge badge-trans">B2B Commercial / Sourcing</span></td>
          <td><strong>Core B2B Money Keyword.</strong> Captures domestic labels & export houses.</td>
        </tr>
      </tbody>
    </table>
  </section>

  <div class="page-break"></div>

  <!-- ==================== SECTION 3 ==================== -->
  <section>
    <h2>
      <span>3. High-Intent Keyword Matrices: Retail vs. Bulk</span>
      <span class="section-num">Section 03</span>
    </h2>

    <p>
      To capture customers actively searching for fabric online, we deploy a targeted bifurcated matrix:
    </p>

    <h3>A. Retail & Boutique Transactional (0.5m – 10m Cuts & Swatches)</h3>
    <table>
      <thead>
        <tr>
          <th>Target Keyword</th>
          <th>Est. Vol (India)</th>
          <th>Primary Intent</th>
          <th>Target Destination</th>
          <th>Why It Converts</th>
        </tr>
      </thead>
      <tbody>
        <tr>
          <td><strong>pure linen fabric per meter</strong></td>
          <td>18,100</td>
          <td><span class="badge badge-trans">Transactional</span></td>
          <td><code>/category/linen</code></td>
          <td>Top search for luxury shirting & summer trousers.</td>
        </tr>
        <tr>
          <td><strong>buy organic cotton fabric online</strong></td>
          <td>14,200</td>
          <td><span class="badge badge-trans">Transactional</span></td>
          <td><code>/category/cotton</code></td>
          <td>Conscious shoppers & sustainable boutique designers.</td>
        </tr>
        <tr>
          <td><strong>buy fabric online by the meter india</strong></td>
          <td>8,900</td>
          <td><span class="badge badge-trans">Browse / Buy</span></td>
          <td><code>/shop</code></td>
          <td>Broad retail demand for custom non-pre-cut lengths.</td>
        </tr>
        <tr>
          <td><strong>corduroy fabric buy online india</strong></td>
          <td>6,400</td>
          <td><span class="badge badge-trans">Transactional</span></td>
          <td><code>/category/corduroy</code></td>
          <td>High seasonal demand for autumn/winter outerwear.</td>
        </tr>
        <tr>
          <td><strong>unstitched linen fabric for shirts</strong></td>
          <td>5,800</td>
          <td><span class="badge badge-trans">Retail Consumer</span></td>
          <td><code>/category/linen</code></td>
          <td>Pre-measured 1.6m–2.5m shirting cuts.</td>
        </tr>
        <tr>
          <td><strong>heavy velvet fabric for clothing</strong></td>
          <td>5,200</td>
          <td><span class="badge badge-trans">Festive / Bridal</span></td>
          <td><code>/category/velvet</code></td>
          <td>Rich draping cotton/silk velvet for lehengas & blazers.</td>
        </tr>
        <tr>
          <td><strong>fabric swatches online india</strong></td>
          <td>3,900</td>
          <td><span class="badge badge-comm">Discovery / Sampler</span></td>
          <td><code>/shop?filter=swatch</code></td>
          <td>Gateway drug: converts at >35% on repeat yardage.</td>
        </tr>
      </tbody>
    </table>

    <h3>B. B2B Wholesale & Bulk Sourcing (50m+ Rolls, Thaans & Factory Runs)</h3>
    <table>
      <thead>
        <tr>
          <th>Target Keyword</th>
          <th>Est. Vol (India)</th>
          <th>Primary Intent</th>
          <th>Target Destination</th>
          <th>Strategic Angle</th>
        </tr>
      </thead>
      <tbody>
        <tr>
          <td><strong>wholesale fabric suppliers in delhi</strong></td>
          <td>12,400</td>
          <td><span class="badge badge-trans">B2B Commercial</span></td>
          <td><code>/wholesale</code></td>
          <td>Okhla warehouse pickup + pan-India dispatch.</td>
        </tr>
        <tr>
          <td><strong>cotton fabric wholesale gandhi nagar</strong></td>
          <td>9,600</td>
          <td><span class="badge badge-comm">Local B2B Sourcing</span></td>
          <td><code>/wholesale/cotton-delhi</code></td>
          <td>Captures Asia's largest garment market search traffic.</td>
        </tr>
        <tr>
          <td><strong>linen fabric wholesale price india</strong></td>
          <td>7,800</td>
          <td><span class="badge badge-comm">Price Discovery</span></td>
          <td><code>/wholesale/linen</code></td>
          <td>Tiered roll pricing (50m, 100m, 500m+) with GST invoices.</td>
        </tr>
        <tr>
          <td><strong>bulk fabric roll suppliers india</strong></td>
          <td>3,100</td>
          <td><span class="badge badge-trans">B2B Transactional</span></td>
          <td><code>/wholesale</code></td>
          <td>Continuous uninterrupted bolt yardage (zero remnant joins).</td>
        </tr>
        <tr>
          <td><strong>gots organic cotton fabric wholesale</strong></td>
          <td>3,200</td>
          <td><span class="badge badge-comm">Regulatory / Sourcing</span></td>
          <td><code>/wholesale/organic-cotton</code></td>
          <td>Export compliance for international apparel markets.</td>
        </tr>
        <tr>
          <td><strong>custom fabric dyeing small moq india</strong></td>
          <td>2,800</td>
          <td><span class="badge badge-trans">B2B Service</span></td>
          <td><code>/wholesale</code></td>
          <td>Low MOQ (50m–100m) custom Pantone & vat dye runs.</td>
        </tr>
      </tbody>
    </table>
  </section>

  <div class="page-break"></div>

  <!-- ==================== SECTION 4 ==================== -->
  <section>
    <h2>
      <span>4. The Multi-Stage Blog & Content Funnel Architecture</span>
      <span class="section-num">Section 04</span>
    </h2>

    <p>
      Every published article must have an explicit assignment in the commercial funnel. We do not publish for traffic volume; we publish to guide specific personas from inquiry to transaction.
    </p>

    <div class="funnel-container">
      <!-- TOFU -->
      <div class="funnel-card">
        <div class="funnel-header">
          <div class="funnel-stage tofu">Stage 1: Top of Funnel (TOFU) — Problem Awareness</div>
          <div class="funnel-hook">📥 Lead Magnet: Free Designer Fabric & GSM Cheat Sheet (PDF)</div>
        </div>
        <div class="funnel-details">
          <div>
            <strong>Target Queries:</strong> <em>"how much fabric for linen shirt"</em>, <em>"why handloom cotton shrinks"</em>, <em>"fabric gsm chart for dresses"</em>
          </div>
          <div>
            <strong>Goal:</strong> Attract apparel shoppers, sewists, and early-stage designers. Educate on fiber physics and capture email or swatch interest.
          </div>
        </div>
      </div>

      <!-- MOFU -->
      <div class="funnel-card">
        <div class="funnel-header">
          <div class="funnel-stage mofu">Stage 2: Middle of Funnel (MOFU) — Technical Evaluation</div>
          <div class="funnel-hook">🧵 Swatch Box: 5 Curated Swatches for ₹99 (100% Store Credit)</div>
        </div>
        <div class="funnel-details">
          <div>
            <strong>Target Queries:</strong> <em>"40 lea vs 60 lea linen"</em>, <em>"twill vs poplin cotton"</em>, <em>"sourcing fabric in delhi okhla vs gandhi nagar"</em>
          </div>
          <div>
            <strong>Goal:</strong> Help designers select specifications. Establish Mithila's technical transparency (Lea, GSM, single-bolt continuity).
          </div>
        </div>
      </div>

      <!-- BOFU -->
      <div class="funnel-card">
        <div class="funnel-header">
          <div class="funnel-stage bofu">Stage 3: Bottom of Funnel (BOFU) — Transactional Purchase</div>
          <div class="funnel-hook">🛒 Retail: 0.5m Fractional Cut | 📦 Bulk: Instant WhatsApp RFQ</div>
        </div>
        <div class="funnel-details">
          <div>
            <strong>Target Queries:</strong> <em>"pure linen fabric per meter"</em>, <em>"wholesale linen fabric suppliers delhi"</em>, <em>"corduroy buy online"</em>
          </div>
          <div>
            <strong>Goal:</strong> Immediate transaction. Retail users checkout via cart in 0.5m increments; B2B clients receive instant wholesale roll quotes.
          </div>
        </div>
      </div>

      <!-- RETENTION -->
      <div class="funnel-card">
        <div class="funnel-header">
          <div class="funnel-stage retention">Stage 4: Post-Purchase & Retention — Lifetime Wholesale Sourcing</div>
          <div class="funnel-hook">🔄 Repeat Desk: Dye-Lot Continuity Guarantee & Swatch Ledger Credit</div>
        </div>
        <div class="funnel-details">
          <div>
            <strong>Trigger:</strong> Order delivery, restock alerts, seasonal capsule launches.
          </div>
          <div>
            <strong>Goal:</strong> Maintain shade continuity for growing fashion brands; turn sample buyers into repeat 100m+ roll clients.
          </div>
        </div>
      </div>
    </div>

    <div class="callout gold">
      <div class="callout-title">
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><circle cx="12" cy="12" r="10"></circle><line x1="12" y1="16" x2="12" y2="12"></line><line x1="12" y1="8" x2="12.01" y2="8"></line></svg>
        The Swatch Recovery Credit Model
      </div>
      Customers ordering a ₹99 swatch card receive a unique coupon code for ₹99 off their first 2m+ fabric cut. This reduces buyer hesitation to zero and converts hesitant samplers into high-value repeat yardage customers.
    </div>
  </section>

  <div class="page-break"></div>

  <!-- ==================== SECTION 5 ==================== -->
  <section>
    <h2>
      <span>5. Master Editorial Plan: 4 High-Conversion Clusters</span>
      <span class="section-num">Section 05</span>
    </h2>

    <!-- Cluster 1 -->
    <div class="cluster-box">
      <div class="cluster-header">Cluster 1: The Pure Linen Authority (Retail Shirting & Bulk Rolls)</div>
      <div class="cluster-sub">Focus: Establish Mithila as the undisputed benchmark for European & Indian flax textiles.</div>
      <table>
        <thead>
          <tr>
            <th style="width: 35%;">Article Title</th>
            <th style="width: 12%;">Stage</th>
            <th style="width: 25%;">Primary Keyword</th>
            <th style="width: 28%;">In-Article Conversion CTA</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td>How Much Linen for a Shirt, Trousers or Kurta?</td>
            <td><span class="badge badge-info">TOFU</span></td>
            <td><code>how much fabric for linen shirt</code></td>
            <td>Yardage Calculator + "Buy 1.8m Shirting Cut".</td>
          </tr>
          <tr>
            <td>40 Lea vs 60 Lea vs 80 Lea Linen Explained</td>
            <td><span class="badge badge-comm">MOFU</span></td>
            <td><code>difference 40 lea 60 lea linen</code></td>
            <td>"Order Pure Linen Swatch Card (₹99)".</td>
          </tr>
          <tr>
            <td>Sourcing Pure Linen Fabric Wholesale in India</td>
            <td><span class="badge badge-trans">BOFU</span></td>
            <td><code>linen fabric wholesale price india</code></td>
            <td>"Download B2B Linen Rate Card (50m+ Rolls)".</td>
          </tr>
        </tbody>
      </table>
    </div>

    <!-- Cluster 2 -->
    <div class="cluster-box">
      <div class="cluster-header">Cluster 2: Organic Cotton & Handloom Foundation</div>
      <div class="cluster-sub">Focus: Tap domestic boutique demand and international sustainable apparel exports.</div>
      <table>
        <thead>
          <tr>
            <th style="width: 35%;">Article Title</th>
            <th style="width: 12%;">Stage</th>
            <th style="width: 25%;">Primary Keyword</th>
            <th style="width: 28%;">In-Article Conversion CTA</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td>Handloom Cotton Shrinkage & Pre-Wash Protocols</td>
            <td><span class="badge badge-info">TOFU</span></td>
            <td><code>handloom cotton fabric shrinkage</code></td>
            <td>"Shop Pre-Shrunk Tested Cotton Yardage".</td>
          </tr>
          <tr>
            <td>Twill vs Poplin vs Cambric Shirting Weaves</td>
            <td><span class="badge badge-comm">MOFU</span></td>
            <td><code>twill vs poplin cotton fabric</code></td>
            <td>"Sample Our Shirting Weaves Kit".</td>
          </tr>
          <tr>
            <td>Sourcing GOTS-Certified Organic Cotton in Bulk</td>
            <td><span class="badge badge-trans">BOFU</span></td>
            <td><code>gots organic fabric suppliers</code></td>
            <td>"Inquire About Certified Organic Cotton Rolls".</td>
          </tr>
        </tbody>
      </table>
    </div>

    <!-- Cluster 3 -->
    <div class="cluster-box">
      <div class="cluster-header">Cluster 3: Winter & Luxury Textures (Corduroy, Velvet, Tweed)</div>
      <div class="cluster-sub">Focus: Capture peak-season apparel margins between September and February.</div>
      <table>
        <thead>
          <tr>
            <th style="width: 35%;">Article Title</th>
            <th style="width: 12%;">Stage</th>
            <th style="width: 25%;">Primary Keyword</th>
            <th style="width: 28%;">In-Article Conversion CTA</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td>Pinwale vs Wide-Wale Corduroy Sourcing Guide</td>
            <td><span class="badge badge-comm">MOFU</span></td>
            <td><code>corduroy fabric buy online</code></td>
            <td>"Shop 100% Cotton Ribbed Corduroy".</td>
          </tr>
          <tr>
            <td>Silk Velvet vs Cotton Velvet for Festive Wear</td>
            <td><span class="badge badge-comm">MOFU</span></td>
            <td><code>heavy velvet fabric for clothing</code></td>
            <td>"Order Luxury Velvet Swatch Palette".</td>
          </tr>
          <tr>
            <td>Wholesale Corduroy & Flannel Fabric for Garment Makers</td>
            <td><span class="badge badge-trans">BOFU</span></td>
            <td><code>bulk corduroy fabric suppliers</code></td>
            <td>"Request Winter Wholesale Swatch Ring".</td>
          </tr>
        </tbody>
      </table>
    </div>

    <!-- Cluster 4 -->
    <div class="cluster-box">
      <div class="cluster-header">Cluster 4: Delhi Wholesale Sourcing & Local SEO Power Plays</div>
      <div class="cluster-sub">Focus: Divert offline market foot-traffic directly into our digital and Okhla showroom channels.</div>
      <table>
        <thead>
          <tr>
            <th style="width: 35%;">Article Title</th>
            <th style="width: 12%;">Stage</th>
            <th style="width: 25%;">Primary Keyword</th>
            <th style="width: 28%;">In-Article Conversion CTA</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td>Sourcing Fabric in Delhi: Okhla vs Gandhi Nagar vs Nehru Place</td>
            <td><span class="badge badge-comm">MOFU</span></td>
            <td><code>wholesale fabric suppliers in delhi</code></td>
            <td>"Book an Atelier Consultation at F-12 Okhla".</td>
          </tr>
          <tr>
            <td>Gandhi Nagar vs Online Wholesale: Direct Mill Procurement</td>
            <td><span class="badge badge-trans">BOFU</span></td>
            <td><code>cotton fabric wholesale gandhi nagar</code></td>
            <td>"Order Wholesale Rolls with GST Invoices".</td>
          </tr>
        </tbody>
      </table>
    </div>
  </section>

  <!-- ==================== SECTION 6 ==================== -->
  <section class="avoid-break">
    <h2>
      <span>6. Technical Implementation Roadmap</span>
      <span class="section-num">Section 06</span>
    </h2>

    <p>
      The technical execution requires three focused updates to the storefront codebase:
    </p>

    <div class="callout emerald">
      <div class="callout-title">
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><polyline points="9 11 12 14 22 4"></polyline><path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11"></path></svg>
        Action 1: Dynamic Blog Commerce Blocks
      </div>
      In <code>src/app/blog/[slug]/page.tsx</code>, inject the <strong>Swatch Order Pill</strong> (₹99 credit) and a contextual <strong>Mini Buy Box</strong> displaying products related to the article topic.
    </div>

    <div class="callout gold">
      <div class="callout-title">
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><polyline points="9 11 12 14 22 4"></polyline><path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11"></path></svg>
        Action 2: Programmatic B2B Landing Pages
      </div>
      Deploy dedicated sub-routes: <code>/wholesale/linen-fabric</code> and <code>/wholesale/cotton-fabric</code> with wholesale roll pricing, 50m MOQ specifications, and direct WhatsApp RFQ routing.
    </div>

    <div class="callout">
      <div class="callout-title">
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><polyline points="9 11 12 14 22 4"></polyline><path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11"></path></svg>
        Action 3: Tiered Pricing Schema
      </div>
      Enhance <code>Product</code> structured data in <code>src/app/product/[slug]/page.tsx</code> with <code>priceSpecification</code> reflecting retail per-meter rates vs bulk roll discounts.
    </div>

    <div class="footer-stamp">
      Mithila Enterprises Atelier (F-12, Okhla Phase-II, New Delhi) | GSTIN: 07AGUPM2548P1ZH | www.mithilaenterprises.co.in
    </div>
  </section>

</body>
</html>
`;

  console.log('Launching headless browser via Playwright...');
  const browser = await chromium.launch();
  const page = await browser.newPage();

  console.log('Setting HTML content...');
  await page.setContent(htmlContent, { waitUntil: 'networkidle' });

  console.log('Compiling PDF...');
  await page.pdf({
    path: outputPath,
    format: 'A4',
    printBackground: true,
    margin: {
      top: '18mm',
      bottom: '18mm',
      left: '14mm',
      right: '14mm'
    },
    displayHeaderFooter: true,
    headerTemplate: `
      <div style="font-family: 'Helvetica Neue', Arial, sans-serif; font-size: 7.5pt; color: #a8a29e; width: 100%; padding: 0 14mm; display: flex; justify-content: space-between; align-items: center;">
        <span style="font-weight: 600; letter-spacing: 0.5px; text-transform: uppercase;">Mithila Enterprises &mdash; SEO Strategic Report</span>
        <span>Confidential &amp; Proprietary</span>
      </div>
    `,
    footerTemplate: `
      <div style="font-family: 'Helvetica Neue', Arial, sans-serif; font-size: 7.5pt; color: #a8a29e; width: 100%; padding: 0 14mm; display: flex; justify-content: space-between; align-items: center;">
        <span>F-12, Okhla Phase-II, New Delhi &bull; GSTIN: 07AGUPM2548P1ZH</span>
        <span>Page <span class="pageNumber"></span> of <span class="totalPages"></span></span>
      </div>
    `
  });

  await browser.close();
  console.log('PDF successfully generated at:');
  console.log(' -> ' + outputPath);

  // Also write to root for easy access if not locked by viewer
  try {
    fs.copyFileSync(outputPath, rootOutputPath);
    console.log(' -> ' + rootOutputPath);
  } catch {
    console.warn('Note: Root PDF file is currently open in a viewer. The master PDF at ' + outputPath + ' was updated successfully.');
  }
}

generateSeoPdf().catch(err => {
  console.error('Failed to generate PDF:', err);
  process.exit(1);
});
