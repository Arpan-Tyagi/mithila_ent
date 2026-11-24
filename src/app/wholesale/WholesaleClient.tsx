"use client";

import React, { useState } from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import BackgroundPattern from '@/components/vectors/BackgroundPattern';

export default function WholesaleClient() {
  const [formState, setFormState] = useState({
    businessName: '',
    taxId: '',
    email: '',
    requirements: ''
  });
  const [submitted, setSubmitted] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError('');
    try {
      const res = await fetch('/api/wholesale', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formState),
      });
      if (res.ok) {
        setSubmitted(true);
      } else {
        const data = await res.json();
        setError(data.error || 'Failed to submit application.');
      }
    } catch (err) {
      setError('An error occurred. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <main className="flex-grow w-full bg-transparent text-[var(--charcoal-ink)] pt-32 pb-24 font-sans relative overflow-hidden">
      <BackgroundPattern className="opacity-40" />
      <div className="container mx-auto px-6 max-w-5xl relative z-10">
        
        {/* Page Header */}
        <div className="text-center max-w-2xl mx-auto mb-16 space-y-3">
          <motion.span 
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-[var(--madder-red)] font-sans text-xs uppercase tracking-wider font-semibold"
          >
            B2B Procurement
          </motion.span>
          <motion.h1 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="font-serif italic text-4xl md:text-5xl font-bold"
          >
            Wholesale Accounts
          </motion.h1>
          <motion.p 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="font-sans text-sm md:text-base text-zinc-700 leading-relaxed"
          >
            We supply premium, structurally engineered yardage to domestic artisans and premier design houses.
          </motion.p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-stretch mt-8">
          
          {/* Left Column: Requirements & Details */}
          <motion.div 
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.2 }}
            className="sonic-bento-card p-8 md:p-12 flex flex-col justify-between bg-[var(--charcoal-ink)]/5 border border-[var(--charcoal-ink)]/10 backdrop-blur-sm"
          >
            <div className="space-y-8">
              <div>
                <span className="text-[var(--madder-red)] font-sans uppercase text-[10px] tracking-wider font-bold">Criteria</span>
                <h3 className="font-serif text-2xl italic font-bold mt-2 text-zinc-950">Account Requirements</h3>
                <p className="font-sans text-xs text-zinc-700 leading-relaxed mt-2 text-justify">
                  Wholesale accounts are strictly reserved for registered businesses and independent designers requiring bulk yardage. Approval grants access to our tiered volume pricing and direct liaison with our master weavers for custom dye runs.
                </p>
              </div>

              <ul className="space-y-4 font-sans text-sm text-[var(--charcoal-ink)] opacity-80">
                <li className="flex items-start">
                  <span className="text-[var(--madder-red)] mr-3 font-bold opacity-100">01.</span>
                  A valid Tax Identification Number or equivalent business registration is mandatory.
                </li>
                <li className="flex items-start">
                  <span className="text-[var(--madder-red)] mr-3 font-bold opacity-100">02.</span>
                  The Minimum Order Quantity (MOQ) is 50 yards per specific textile variant.
                </li>
                <li className="flex items-start">
                  <span className="text-[var(--madder-red)] mr-3 font-bold opacity-100">03.</span>
                  Custom dye runs require a separate consultation and a 100-yard MOQ.
                </li>
              </ul>
            </div>

            <div className="pt-6 border-t border-zinc-200 mt-8">
              <h4 className="font-sans font-bold text-xs uppercase text-zinc-800">Logistics & Freight</h4>
              <p className="font-sans text-xs text-zinc-700 mt-2 leading-relaxed text-justify">
                Heavyweight orders exceeding 100 yards are palletized and shipped via dedicated freight. Standard transit times for domestic freight range from 5 to 7 business days. We ensure all fabric rolls are securely wrapped in climate-resistant casing to prevent moisture penetration during transit.
              </p>
            </div>
          </motion.div>

          {/* Right Column: Application Form */}
          <motion.div 
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.3 }}
            className="sonic-bento-card p-8 md:p-12 bg-[var(--charcoal-ink)]/5 border border-[var(--charcoal-ink)]/10 backdrop-blur-sm flex flex-col justify-between"
          >
            <div className="space-y-6 w-full">
              <h3 className="font-serif text-2xl italic font-bold text-zinc-950">Submit Inquiry</h3>
              {submitted ? (
                <div className="bg-green-50 text-green-800 p-6 rounded-lg text-sm">
                  <h4 className="font-bold mb-2">Application Received</h4>
                  <p>Your wholesale application has been successfully submitted. Our team will review your requirements and reach out to you within 1-2 business days.</p>
                </div>
              ) : (
                <form className="space-y-4" onSubmit={handleSubmit}>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-1">
                      <label className="block font-sans text-[10px] uppercase font-bold text-zinc-800">Business Name</label>
                      <input 
                        type="text" 
                        className="sonic-input" 
                        placeholder="e.g. Atelier Studios"
                        value={formState.businessName}
                        onChange={(e) => setFormState(s => ({...s, businessName: e.target.value}))}
                        required
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="block font-sans text-[10px] uppercase font-bold text-zinc-800">Tax ID / GST</label>
                      <input 
                        type="text" 
                        className="sonic-input" 
                        placeholder="Registration Number"
                        value={formState.taxId}
                        onChange={(e) => setFormState(s => ({...s, taxId: e.target.value}))}
                      />
                    </div>
                  </div>

                  <div className="space-y-1">
                    <label className="block font-sans text-[10px] uppercase font-bold text-zinc-800">Contact Email</label>
                    <input 
                      type="email" 
                      className="sonic-input" 
                      placeholder="purchasing@domain.com"
                      value={formState.email}
                      onChange={(e) => setFormState(s => ({...s, email: e.target.value}))}
                      required
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="block font-sans text-[10px] uppercase font-bold text-zinc-800">Fabric Requirements & Estimated Volume</label>
                    <textarea 
                      rows={4} 
                      className="sonic-input resize-none" 
                      placeholder="Detail your specific textile needs, weight requirements, and expected monthly yardage."
                      value={formState.requirements}
                      onChange={(e) => setFormState(s => ({...s, requirements: e.target.value}))}
                      required
                    ></textarea>
                  </div>

                  {error && <p className="text-red-500 text-xs font-bold font-sans">{error}</p>}
                  <button type="submit" disabled={isSubmitting} className="sonic-btn-primary w-full text-xs">
                    {isSubmitting ? 'Submitting...' : 'Submit Application'}
                  </button>
                </form>
              )}
            </div>
          </motion.div>

        </div>

        {/* Specialized B2B Material Catalogs & Roll Sourcing */}
        <div className="mt-20 pt-12 border-t border-[var(--charcoal-ink)]/15">
          <div className="text-center max-w-2xl mx-auto mb-10 space-y-2">
            <span className="text-[var(--madder-red)] font-sans uppercase text-[10px] tracking-wider font-bold">
              Specialized B2B Sourcing Hubs
            </span>
            <h3 className="font-serif italic text-3xl font-bold text-[var(--charcoal-ink)]">
              Direct Mill Fabric Catalogs
            </h3>
            <p className="font-sans text-xs md:text-sm text-zinc-600">
              Explore technical specifications, volume discount tiers, and continuous bolt availability by material category.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <Link
              href="/wholesale/linen-fabric"
              className="p-6 bg-white border-2 border-[var(--charcoal-ink)] shadow-[4px_4px_0_var(--charcoal-ink)] rounded-sm hover:-translate-y-1 transition-all group"
            >
              <div className="flex justify-between items-center mb-3">
                <span className="text-[10px] font-bold uppercase tracking-wider text-[var(--madder-red)]">
                  Pure Flax Bast Fiber
                </span>
                <span className="text-xs font-mono font-bold text-zinc-500">MOQ 50m</span>
              </div>
              <h4 className="font-serif italic text-xl font-bold text-[var(--charcoal-ink)] group-hover:text-[var(--madder-red)] transition-colors">
                Pure Linen Fabric Rolls &rarr;
              </h4>
              <p className="font-sans text-xs text-zinc-600 mt-2 leading-relaxed">
                40, 60, and 80 Lea shirting and trouser rolls. European and Indian flax bast fibers with continuous single-bolt continuity.
              </p>
            </Link>

            <Link
              href="/wholesale/cotton-fabric"
              className="p-6 bg-white border-2 border-[var(--charcoal-ink)] shadow-[4px_4px_0_var(--charcoal-ink)] rounded-sm hover:-translate-y-1 transition-all group"
            >
              <div className="flex justify-between items-center mb-3">
                <span className="text-[10px] font-bold uppercase tracking-wider text-[var(--madder-red)]">
                  Combed &amp; Handloom
                </span>
                <span className="text-xs font-mono font-bold text-zinc-500">MOQ 50m</span>
              </div>
              <h4 className="font-serif italic text-xl font-bold text-[var(--charcoal-ink)] group-hover:text-[var(--madder-red)] transition-colors">
                Cotton Fabric Wholesale Delhi &rarr;
              </h4>
              <p className="font-sans text-xs text-zinc-600 mt-2 leading-relaxed">
                Long-staple combed cotton, high-density twill, poplin, and artisanal handlooms. Gandhi Nagar pricing with Okhla lab standards.
              </p>
            </Link>

            <Link
              href="/wholesale/organic-cotton"
              className="p-6 bg-white border-2 border-[var(--charcoal-ink)] shadow-[4px_4px_0_var(--charcoal-ink)] rounded-sm hover:-translate-y-1 transition-all group"
            >
              <div className="flex justify-between items-center mb-3">
                <span className="text-[10px] font-bold uppercase tracking-wider text-[var(--madder-red)]">
                  GOTS Certified
                </span>
                <span className="text-xs font-mono font-bold text-zinc-500">MOQ 50m</span>
              </div>
              <h4 className="font-serif italic text-xl font-bold text-[var(--charcoal-ink)] group-hover:text-[var(--madder-red)] transition-colors">
                GOTS Organic Cotton Bulk &rarr;
              </h4>
              <p className="font-sans text-xs text-zinc-600 mt-2 leading-relaxed">
                Pesticide-free, export-compliant certified organic cotton textiles. Transaction certificates (TC) available for conscious labels.
              </p>
            </Link>

            <Link
              href="/wholesale/corduroy-fabric"
              className="p-6 bg-white border-2 border-[var(--charcoal-ink)] shadow-[4px_4px_0_var(--charcoal-ink)] rounded-sm hover:-translate-y-1 transition-all group"
            >
              <div className="flex justify-between items-center mb-3">
                <span className="text-[10px] font-bold uppercase tracking-wider text-[var(--madder-red)]">
                  Heavy Outerwear Pile
                </span>
                <span className="text-xs font-mono font-bold text-zinc-500">MOQ 50m</span>
              </div>
              <h4 className="font-serif italic text-xl font-bold text-[var(--charcoal-ink)] group-hover:text-[var(--madder-red)] transition-colors">
                Corduroy Fabric Wholesale &rarr;
              </h4>
              <p className="font-sans text-xs text-zinc-600 mt-2 leading-relaxed">
                100% cotton pinwale (14-wale) and chunky wide-wale (6-wale) rolls for winter jackets, trousers, and streetwear.
              </p>
            </Link>

            <Link
              href="/wholesale/delhi-sourcing"
              className="p-6 bg-white border-2 border-[var(--charcoal-ink)] shadow-[4px_4px_0_var(--charcoal-ink)] rounded-sm hover:-translate-y-1 transition-all group md:col-span-2"
            >
              <div className="flex justify-between items-center mb-3">
                <span className="text-[10px] font-bold uppercase tracking-wider text-[var(--madder-red)]">
                  Delhi Cluster Guide
                </span>
                <span className="text-xs font-mono font-bold text-zinc-500">F-12 Okhla Phase-II</span>
              </div>
              <h4 className="font-serif italic text-xl font-bold text-[var(--charcoal-ink)] group-hover:text-[var(--madder-red)] transition-colors">
                Delhi Textile Sourcing: Okhla Atelier &amp; Warehouse &rarr;
              </h4>
              <p className="font-sans text-xs text-zinc-600 mt-2 leading-relaxed">
                Skip the congestion of Gandhi Nagar and Nehru Place. Inspect continuous master rolls in person with proper parking, loading bays, lab test data, and GST 2.0 invoicing.
              </p>
            </Link>
          </div>
        </div>
      </div>
    </main>
  );
}
