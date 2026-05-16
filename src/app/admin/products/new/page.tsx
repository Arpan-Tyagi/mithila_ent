"use client";

import { useState } from 'react';
import { Button } from '@/components/ui/Button';
import { UploadCloud, Sparkles } from 'lucide-react';

export default function AIProductIngestion() {
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);

  const handleGenerate = (e: React.FormEvent) => {
    e.preventDefault();
    setIsGenerating(true);
    // Simulate Gemini API call
    setTimeout(() => {
      setIsGenerating(false);
      alert('AI Generation Complete! Product saved as DRAFT.');
    }, 2500);
  };

  return (
    <div className="space-y-8">
      <h1 className="font-serif text-3xl font-bold text-[var(--charcoal-ink)]">AI Product Ingestion</h1>
      
      <div className="max-w-2xl bg-white border-2 border-[var(--charcoal-ink)] p-8 rounded-sm">
        <form onSubmit={handleGenerate} className="space-y-6">
          
          <div>
            <label className="block font-sans text-xs font-bold uppercase tracking-widest text-[var(--charcoal-ink)] mb-2">Upload Fabric Image</label>
            <div className="border-2 border-dashed border-[var(--charcoal-ink)] p-12 text-center rounded-sm hover:bg-[var(--unbleached-cotton)] transition-colors cursor-pointer flex flex-col items-center justify-center">
               <UploadCloud size={32} className="text-[var(--charcoal-ink)] opacity-50 mb-4" />
               <p className="font-sans text-sm opacity-70">Drag and drop or click to upload</p>
               <input type="file" className="hidden" accept="image/*" onChange={(e) => setImageFile(e.target.files?.[0] || null)} />
            </div>
            {imageFile && <p className="mt-2 text-sm text-[var(--madder-red)] font-bold">{imageFile.name}</p>}
          </div>

          <div>
            <label className="block font-sans text-xs font-bold uppercase tracking-widest text-[var(--charcoal-ink)] mb-2">Base Name (Optional)</label>
            <input type="text" placeholder="e.g. Mithila Handloom..." className="w-full border-2 border-[var(--charcoal-ink)] bg-transparent p-3 font-sans focus:outline-none focus:border-[var(--madder-red)] transition-colors" />
          </div>

          <div className="bg-[var(--unbleached-cotton)] p-4 border-2 border-[var(--charcoal-ink)]/20 text-sm opacity-80 font-sans">
            <p className="font-bold flex items-center gap-2 mb-2 text-[var(--turmeric)]"><Sparkles size={16} /> Gemini 1.5 Pro Analysis</p>
            <p>Our AI will automatically scan the image texture to determine the weave, generate an SEO-optimized description, and extract primary color variants. The product will be strictly saved as a <strong>DRAFT</strong>.</p>
          </div>

          <Button type="submit" disabled={isGenerating} className="w-full flex items-center justify-center gap-2 bg-[var(--charcoal-ink)] text-[var(--unbleached-cotton)] hover:bg-[var(--turmeric)] hover:text-[var(--charcoal-ink)]">
            {isGenerating ? 'Analyzing Fabric...' : 'Generate Product Listing'}
          </Button>

        </form>
      </div>
    </div>
  );
}
