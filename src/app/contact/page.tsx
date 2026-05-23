"use client";

import { Button } from '@/components/ui/Button';
import { useState } from 'react';

export default function ContactPage() {
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitted(true);
    // In production, this would send to an API endpoint or email service
  };

  return (
    <main className="flex-grow max-w-4xl mx-auto px-4 py-16 w-full grid md:grid-cols-2 gap-12">
      <div>
        <h1 className="font-serif text-4xl font-bold text-[var(--charcoal-ink)] mb-6">Contact Us</h1>
        <p className="font-sans text-lg opacity-80 mb-8">
          We would love to hear from you. For wholesale inquiries or support, please drop us a message.
        </p>
        <div className="space-y-4 font-sans text-sm font-bold">
          <p>📍 123 Weaver's Lane, Bihar, India</p>
          <p>📞 +91-9876543210</p>
          <p>✉️ support@mithilaenterprises.com</p>
        </div>
      </div>
      <div className="bg-white p-8 border-2 border-[var(--charcoal-ink)] shadow-[4px_4px_0_var(--charcoal-ink)]">
        {submitted ? (
          <div className="flex flex-col items-center justify-center h-full text-center py-8">
            <div className="w-16 h-16 bg-[var(--turmeric)] rounded-full flex items-center justify-center mb-4">
              <span className="text-2xl">✓</span>
            </div>
            <h2 className="font-serif text-2xl font-bold text-[var(--charcoal-ink)] mb-2">Message Sent!</h2>
            <p className="font-sans text-sm opacity-70">We'll get back to you within 24 hours.</p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4 font-sans">
            <input type="text" placeholder="Name" className="w-full border-2 border-[var(--charcoal-ink)] p-3 focus:outline-none focus:border-[var(--madder-red)] transition-colors" required />
            <input type="email" placeholder="Email" className="w-full border-2 border-[var(--charcoal-ink)] p-3 focus:outline-none focus:border-[var(--madder-red)] transition-colors" required />
            <textarea placeholder="Your Message" rows={4} className="w-full border-2 border-[var(--charcoal-ink)] p-3 focus:outline-none focus:border-[var(--madder-red)] transition-colors" required></textarea>
            <Button type="submit" className="w-full">Send Message</Button>
          </form>
        )}
      </div>
    </main>
  );
}
