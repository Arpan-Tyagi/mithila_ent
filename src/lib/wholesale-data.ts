export interface WholesaleCategory {
  slug: string;
  name: string;
  title: string;
  metaTitle: string;
  metaDescription: string;
  heroHeadline: string;
  heroSummary: string;
  targetKeywords: string[];
  moq: string;
  rollLength: string;
  width: string;
  gsmRange: string;
  yarnSpec: string;
  pricingTiers: {
    tier: string;
    volume: string;
    discount: string;
    description: string;
  }[];
  specifications: {
    label: string;
    value: string;
  }[];
  applications: string[];
  colorways: string;
  dyeCapabilities: string;
  relatedCategorySlug: string;
}

export const wholesaleData: Record<string, WholesaleCategory> = {
  'linen-fabric': {
    slug: 'linen-fabric',
    name: 'Pure Flax Linen',
    title: 'Pure Linen Fabric Wholesale Suppliers Delhi | Bulk Rolls (Thaans)',
    metaTitle: 'Pure Linen Fabric Wholesale Price India | 40, 60, 80 Lea Rolls | Mithila Enterprises',
    metaDescription: 'Direct mill & artisan pure flax linen fabric wholesale suppliers in Delhi. Sourcing 40, 60, and 80 Lea continuous rolls for apparel manufacturers & designers. MOQ 50m. GST statutory invoicing.',
    heroHeadline: 'Wholesale Pure Linen Fabric Rolls (40, 60 & 80 Lea)',
    heroSummary: 'Engineered for luxury apparel houses, resortwear labels, and garment export factories. Direct single-bolt continuous thaans with zero synthetic blending, verified Lea counts, and calibrated GSM.',
    targetKeywords: [
      'pure linen fabric wholesale price india',
      'wholesale fabric suppliers in delhi',
      'linen fabric wholesale rolls',
      '60 lea linen wholesale delhi',
      'pure flax fabric roll suppliers'
    ],
    moq: '50 Meters per shade (Stock Rolls) | 100 Meters (Custom Vat Dye)',
    rollLength: '50m to 60m continuous single-bolt yardage',
    width: '56 inches (142 cm) to 58 inches (147 cm)',
    gsmRange: '140 GSM (60 Lea) to 215 GSM (40 Lea)',
    yarnSpec: '100% European & Indian Flax Bast Fibers (Wet-Spun)',
    pricingTiers: [
      { tier: 'Sampling Cut', volume: '1m – 10m', discount: 'Retail Benchmark', description: 'Fractional cuts for designer sampling & proto-making.' },
      { tier: 'Single Bolt', volume: '50m – 99m', discount: '20% Volume Off', description: 'Continuous single-bolt thaan with roll label & dye-lot certificate.' },
      { tier: 'Production Run', volume: '100m – 499m', discount: '28% Wholesale Off', description: 'Full roll packs for collection manufacturing with shade continuity.' },
      { tier: 'Enterprise / Mill', volume: '500m+', discount: 'Direct Mill Contract', description: 'Custom pantone dye runs with priority loom scheduling.' }
    ],
    specifications: [
      { label: 'Fiber Purity', value: '100% Pure Flax Linen (Zero Polyester/Viscose Blending)' },
      { label: 'Weave Type', value: 'Balanced Plain Weave with Natural Micro-Slubs' },
      { label: 'Shrinkage Allowance', value: '3% to 4% Warp Relaxation (Pre-washed specs available)' },
      { label: 'Colorfastness', value: 'Grade 4+ to Light & Washing (OEKO-TEX compliant reactive & vat dyes)' },
      { label: 'GST Statutory Code', value: 'HSN 5309 (Flat 5% GST under CGST Rule 46)' },
      { label: 'Fulfillment Hub', value: 'F-12, Okhla Phase-II, New Delhi (Pan-India Pallet Freight)' }
    ],
    applications: ['Luxury Men’s & Women’s Shirting', 'Pleated Trousers & Safari Overshirts', 'Flowing Resortwear & Tunics', 'Bespoke Bandhgalas & Kurtas'],
    colorways: '32 Active In-Stock Shades (Ready for Immediate Dispatch)',
    dyeCapabilities: 'Custom lab-dip approvals within 4 business days for 100m+ orders.',
    relatedCategorySlug: 'linen'
  },
  'cotton-fabric': {
    slug: 'cotton-fabric',
    name: 'Handloom & Combed Cotton',
    title: 'Cotton Fabric Wholesale Gandhi Nagar & Delhi NCR | Factory Rolls',
    metaTitle: 'Cotton Fabric Wholesale Suppliers Delhi | Gandhi Nagar & Okhla | Mithila Enterprises',
    metaDescription: 'Wholesale cotton fabric suppliers in Delhi. Combed long-staple cotton, handloom yardage, twill, and poplin shirting in bulk 50m+ rolls. Fast delivery from Okhla warehouse.',
    heroHeadline: 'Wholesale Cotton Fabric & Handloom Yardage in Delhi',
    heroSummary: 'Bypassing the friction of traditional markets with export-grade testing, continuous single-bolt yardage, and formal GST tax invoicing for garment manufacturers.',
    targetKeywords: [
      'cotton fabric wholesale gandhi nagar',
      'wholesale fabric suppliers in delhi',
      'cotton shirting fabric bulk rolls',
      'handloom cotton fabric wholesale india',
      'bulk cotton fabric manufacturers delhi'
    ],
    moq: '50 Meters per variant | 100 Meters (Custom Weave/Print)',
    rollLength: '50m to 70m continuous rolls',
    width: '44 inches to 58 inches',
    gsmRange: '110 GSM (Cambric/Poplin) to 240 GSM (Heavy Drill Twill)',
    yarnSpec: 'Combed Long-Staple Cotton (Suvin, Shankar-6) 40s to 80s Count',
    pricingTiers: [
      { tier: 'Sampling Cut', volume: '1m – 10m', discount: 'Retail Benchmark', description: 'Proto-samples and designer fit tests.' },
      { tier: 'Single Bolt', volume: '50m – 99m', discount: '18% Volume Off', description: 'Continuous bolt for boutique capsule production.' },
      { tier: 'Garment Roll', volume: '100m – 499m', discount: '26% Wholesale Off', description: 'Volume shirting and dressmaking rolls with consistent EPI/PPI.' },
      { tier: 'Factory Lot', volume: '500m+', discount: 'Direct Mill Contract', description: 'Bulk factory rolls with customized finish (mercerized/sanforized).' }
    ],
    specifications: [
      { label: 'Staple Quality', value: 'Long-Staple Combed Cotton (Zero Trash / Immature Neps)' },
      { label: 'Weave Varieties', value: 'Plain Poplin, High-Density Twill, Lightweight Cambric, Khadi Handloom' },
      { label: 'Tensile Strength', value: 'High Tear-Resistance Engineered for Industrial Cutting Tables' },
      { label: 'Chemical Safety', value: 'Azo-Free, Low-Impact Certified Textile Dyes' },
      { label: 'GST Statutory Code', value: 'HSN 5208 / 5209 (Flat 5% GST)' },
      { label: 'Warehouse Dispatch', value: 'F-12, Okhla Phase-II (Same-Day Delhi NCR / 3-5 Days Pan-India)' }
    ],
    applications: ['Executive Business Shirts', 'Boutique Everyday Kurtis & Dresses', 'Casual Chinos & Utility Overshirts', 'Garment Pocketing & Linings'],
    colorways: '45+ Solid Shades & Heritage Natural Unbleached Whites',
    dyeCapabilities: 'Mill reactive & vat dyeing with strict delta-E shade tolerance under 0.8.',
    relatedCategorySlug: 'cotton'
  },
  'organic-cotton': {
    slug: 'organic-cotton',
    name: 'GOTS Certified Organic Cotton',
    title: 'GOTS Certified Organic Cotton Fabric Wholesale Suppliers India',
    metaTitle: 'GOTS Organic Cotton Fabric Wholesale India | Certified Bulk Rolls | Mithila Enterprises',
    metaDescription: 'Wholesale GOTS certified organic cotton fabric suppliers in India. 100% pesticide-free, chemical-free processed shirting, jersey, and canvas. Export certification provided.',
    heroHeadline: 'GOTS Certified Organic Cotton Bulk Sourcing',
    heroSummary: 'Fully documented, pesticide-free organic cotton yardage for conscious fashion labels, export brands, and ethical apparel manufacturers. Transaction Certificates (TC) provided on qualifying orders.',
    targetKeywords: [
      'gots certified organic fabric suppliers',
      'organic cotton fabric wholesale india',
      'sustainable textile manufacturers india',
      'bulk organic cotton shirting',
      'eco friendly fabric wholesale delhi'
    ],
    moq: '50 Meters per weave',
    rollLength: '50m continuous rolls',
    width: '44 inches to 58 inches',
    gsmRange: '115 GSM to 280 GSM',
    yarnSpec: '100% Certified Organic Cotton (Non-GMO, Rain-Fed)',
    pricingTiers: [
      { tier: 'Sampling', volume: '1m – 10m', discount: 'Retail Benchmark', description: 'Sustainable capsule development.' },
      { tier: 'Bolt Pack', volume: '50m – 99m', discount: '15% Volume Off', description: 'Verified organic bolt with certified pedigree.' },
      { tier: 'Brand Lot', volume: '100m – 499m', discount: '24% Wholesale Off', description: 'Full collection runs with traceability documentation.' },
      { tier: 'Export Tier', volume: '500m+', discount: 'Direct Mill Contract', description: 'Complete TC documentation for European and US export compliance.' }
    ],
    specifications: [
      { label: 'Organic Standard', value: 'GOTS (Global Organic Textile Standard) Certified Cotton' },
      { label: 'Auxiliary Chemicals', value: 'Zero Heavy Metals, Formaldehyde, or Toxic Chlorinated Solvents' },
      { label: 'Biodegradability', value: '100% Circular & Biodegradable at End of Garment Life' },
      { label: 'Skin Feel', value: 'Hypoallergenic & Ultra-Soft Natural Breathability' },
      { label: 'GST Statutory Code', value: 'HSN 5208 (Flat 5% GST)' },
      { label: 'Traceability', value: 'Farm-to-Bolt Complete Audit Trail' }
    ],
    applications: ['Conscious Fashion Capsules', 'Newborn & Children’s Apparel', 'Organic Lounge & Sleepwear', 'Sustainable Bedding & Table Linens'],
    colorways: 'Natural Raw Ecru (Unbleached) & Low-Impact Organic Dyes',
    dyeCapabilities: 'Botanical and non-toxic mineral dyes available on request.',
    relatedCategorySlug: 'cotton'
  },
  'corduroy-fabric': {
    slug: 'corduroy-fabric',
    name: 'Ribbed Cotton Corduroy',
    title: 'Corduroy Fabric Wholesale Suppliers Delhi | Pinwale & Wide-Wale',
    metaTitle: 'Wholesale Corduroy Fabric India | Bulk Pinwale & Wide-Wale Rolls | Mithila Enterprises',
    metaDescription: 'Wholesale corduroy fabric suppliers in Delhi. 100% cotton pinwale (14-wale) and wide-wale (6-wale) heavy fabric rolls for trousers, jackets, and winter apparel.',
    heroHeadline: 'Wholesale Ribbed Cotton Corduroy Rolls',
    heroSummary: 'Richly textured, high-pile cotton corduroy engineered for autumn/winter outerwear, tailored trousers, and chore jackets. Sourced directly from premier finishing mills.',
    targetKeywords: [
      'bulk corduroy fabric suppliers india',
      'corduroy fabric buy online wholesale',
      'wide wale corduroy wholesale delhi',
      'pinwale cotton corduroy roll price',
      'winter apparel fabric suppliers delhi'
    ],
    moq: '50 Meters per wale count & shade',
    rollLength: '45m to 55m rolls',
    width: '56 inches (142 cm)',
    gsmRange: '280 GSM (Pinwale) to 340 GSM (Wide-Wale)',
    yarnSpec: '100% Dense Combed Cotton Pile',
    pricingTiers: [
      { tier: 'Sampling Cut', volume: '1m – 10m', discount: 'Retail Benchmark', description: 'Outerwear prototypes & tailor samples.' },
      { tier: 'Single Bolt', volume: '50m – 99m', discount: '18% Volume Off', description: 'Continuous bolt yardage for winter collections.' },
      { tier: 'Garment Run', volume: '100m – 499m', discount: '25% Wholesale Off', description: 'Volume production for trousers, jackets, and pinafores.' },
      { tier: 'Factory Contract', volume: '500m+', discount: 'Direct Mill Contract', description: 'Custom wale configurations and specialized garment wash-dyes.' }
    ],
    specifications: [
      { label: 'Wale Structure', value: '6-Wale (Chunky Wide-Wale) & 14-Wale (Fine Baby Cord / Needlecord)' },
      { label: 'Abrasion Resistance', value: 'Heavy Duty (>30,000 Martindale Rub Cycles)' },
      { label: 'Hand-Feel', value: 'Plush, Velvety Texture with Vintage Aesthetic & Natural Give' },
      { label: 'Thermal Profile', value: 'Dense Pile Structure Providing Superior Cold-Weather Insulation' },
      { label: 'GST Statutory Code', value: 'HSN 5801 (Flat 5% GST)' },
      { label: 'Warehouse Hub', value: 'F-12, Okhla Phase-II, New Delhi' }
    ],
    applications: ['Tailored Winter Trousers & Chinos', 'Oversized Chore Coats & Trucker Jackets', 'Contemporary Streetwear & Pinafores', 'Heavy Cushioning & Luxury Upholstery'],
    colorways: 'Rich Autumn Earth Tones (Tobacco Brown, Forest Olive, Deep Navy, Rust Terracotta)',
    dyeCapabilities: 'Reactive piece-dyed with rich shade penetration across the pile.',
    relatedCategorySlug: 'corduroy'
  },
  'delhi-sourcing': {
    slug: 'delhi-sourcing',
    name: 'Delhi Textile Cluster Procurement',
    title: 'Wholesale Fabric Suppliers in Delhi | Okhla & Gandhi Nagar Sourcing',
    metaTitle: 'Wholesale Fabric Suppliers in Delhi | Okhla Phase 2 Atelier | Mithila Enterprises',
    metaDescription: 'Looking for wholesale fabric suppliers in Delhi? Visit Mithila Enterprises at F-12, Okhla Phase-II. Direct-to-mill pure linen, organic cotton, corduroy, and silk yardage with GST invoices.',
    heroHeadline: 'Delhi Fabric Procurement: Okhla Atelier & Warehouse',
    heroSummary: 'Bypassing the chaos of traditional crowded bazaars. Mithila Enterprises offers export-grade testing, continuous single-bolt cuts, transparent pricing, and parking-friendly warehouse inspection in South Delhi.',
    targetKeywords: [
      'wholesale fabric suppliers in delhi',
      'fabric suppliers okhla phase 2',
      'cotton fabric wholesale gandhi nagar',
      'delhi textile wholesale market',
      'export surplus fabric suppliers delhi'
    ],
    moq: '50 Meters (Bulk Rolls) | 0.5m (Sampling Cuts)',
    rollLength: '50m to 100m continuous yardage',
    width: '44 to 58 inches depending on material',
    gsmRange: '80 GSM to 380 GSM across all fabric classifications',
    yarnSpec: 'Certified Natural Fibers (Linen, Cotton, Silk, Wool, Corduroy)',
    pricingTiers: [
      { tier: 'Designer Sample', volume: '0.5m – 10m', discount: 'Retail Benchmark', description: 'Fractional meterage for sampling & bespoke fittings.' },
      { tier: 'Boutique Roll', volume: '50m – 99m', discount: '20% Off Retail', description: 'Single continuous bolt with GST tax invoice.' },
      { tier: 'Manufacturer Batch', volume: '100m – 499m', discount: '28% Off Retail', description: 'Multi-roll collection supply with laboratory test data.' },
      { tier: 'Institutional / Export', volume: '500m+', discount: 'Direct Mill Contract', description: 'Mill-direct container and truckload consignments.' }
    ],
    specifications: [
      { label: 'Physical Showroom', value: 'F-12, Okhla Phase-II, New Delhi (Mon–Sat, 10 AM to 7 PM)' },
      { label: 'Trading Heritage', value: 'Gandhi Nagar (Raghubar Pura-2), East Delhi Wholesale Roots' },
      { label: 'GST Compliance', value: 'GSTIN: 07AGUPM2548P1ZH (Full CGST Rule 46 Tax Invoicing)' },
      { label: 'Logistics', value: 'Loading Bay Access, Palletized Shipping, Same-Day NCR Delivery' },
      { label: 'Payment Options', value: 'Bank Transfer (NEFT/RTGS), Razorpay Corporate, Net 30 for Verified Accounts' },
      { label: 'Fabric Coverage', value: 'Linen, Organic Cotton, Twill, Corduroy, Velvet, Tweed, Viscose' }
    ],
    applications: ['Export Garment Manufacturers', 'Boutique Fashion Labels', 'Bespoke Tailoring Houses', 'Luxury Interior Furnishers'],
    colorways: 'Full Access to 200+ Master Roll Colorways Across All Categories',
    dyeCapabilities: 'In-house color matching & master vat dye partnerships.',
    relatedCategorySlug: 'linen'
  }
};

export function getAllWholesaleSlugs(): string[] {
  return Object.keys(wholesaleData);
}

export function getWholesaleCategory(slug: string): WholesaleCategory | undefined {
  return wholesaleData[slug];
}
