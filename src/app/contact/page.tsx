"use client";

import React, { useState } from 'react';
import { motion } from 'framer-motion';

export default function ContactPage() {
  const [formState, setFormState] = useState({
    firstName: '',
    lastName: '',
    email: '',
    location: '',
    message: ''
  });
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitted(true);
  };

  return (
    <main className="flex-grow w-full bg-[#fafafa] text-zinc-900 pt-32 pb-24 font-sans">
      <div className="container mx-auto px-6 max-w-6xl">
        
        {/* Page Header */}
        <div className="text-center max-w-2xl mx-auto mb-16 space-y-3">
          <motion.span 
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-purple-600 font-sans text-xs uppercase tracking-wider font-semibold"
          >
            Connect With Us
          </motion.span>
          <motion.h1 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="font-serif italic text-4xl md:text-5xl font-bold"
          >
            Contact Our Artisans
          </motion.h1>
          <motion.p 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="font-sans text-sm md:text-base text-zinc-500 leading-relaxed"
          >
            You can contact us via email, phone, or by filling out the form on this page. We strive to respond promptly and look forward to connecting with you soon!
          </motion.p>
        </div>

        {/* Dual-column content */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-stretch mt-8">
          
          {/* Left Column: Info Card */}
          <motion.div 
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.2 }}
            className="sonic-bento-card p-8 md:p-12 flex flex-col justify-between bg-white"
          >
            <div className="space-y-8">
              <div>
                <span className="text-purple-600 font-sans uppercase text-[10px] tracking-wider font-bold">Inquiries</span>
                <h3 className="font-serif text-2xl italic font-bold mt-2 text-zinc-950">Write Us</h3>
                <p className="font-sans text-xs text-zinc-500 leading-relaxed mt-2">
                  Have questions about fabric weights, bulk orders, or custom loom settings? Our textile experts are here to assist.
                </p>
              </div>

              <div className="space-y-4 font-sans text-sm">
                <div>
                  <span className="block font-bold text-[10px] uppercase opacity-40">Email Address</span>
                  <a href="mailto:arpan@mithilaent.com" className="text-base text-zinc-900 hover:text-purple-600 transition-colors font-medium">
                    arpan@mithilaent.com
                  </a>
                </div>
                <div>
                  <span className="block font-bold text-[10px] uppercase opacity-40">Call / WhatsApp</span>
                  <a href="tel:+919999988888" className="text-base text-zinc-900 hover:text-purple-600 transition-colors font-medium">
                    +91-99999-88888
                  </a>
                </div>
                <div>
                  <span className="block font-bold text-[10px] uppercase opacity-40">Artisan Workshop</span>
                  <p className="text-zinc-600">Madhubani Village, Mithila Region, Bihar, India</p>
                </div>
              </div>
            </div>

            <div className="pt-6 border-t border-zinc-100 mt-8">
              <h4 className="font-sans font-bold text-xs uppercase text-zinc-800">24/7 Available</h4>
              <p className="font-sans text-xs text-zinc-400 mt-1">We respond to email inquiries within 24 hours.</p>
            </div>
          </motion.div>

          {/* Right Column: Interactive Form */}
          <motion.div 
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.2 }}
            className="sonic-bento-card p-8 md:p-12 bg-white flex flex-col justify-between"
          >
            <div className="space-y-6 w-full">
              <h3 className="font-serif text-2xl italic font-bold text-zinc-950">We’d love to hear from you!</h3>
              
              {submitted ? (
                <motion.div 
                  initial={{ opacity: 0, scale: 0.98 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="p-8 text-center bg-zinc-50 border border-zinc-200 rounded-xl space-y-3"
                >
                  <span className="text-3xl">✉️</span>
                  <h4 className="font-sans text-base font-bold text-zinc-900">Message Received!</h4>
                  <p className="font-sans text-xs text-zinc-500 leading-relaxed">
                    Thank you, {formState.firstName}. Our representative will follow up with you at {formState.email} shortly.
                  </p>
                </motion.div>
              ) : (
                <form onSubmit={handleSubmit} className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-1">
                      <label className="block font-sans text-[10px] uppercase font-bold text-zinc-400">First Name</label>
                      <input 
                        type="text" 
                        required
                        value={formState.firstName}
                        onChange={(e) => setFormState({...formState, firstName: e.target.value})}
                        className="sonic-input"
                        placeholder="Arpan"
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="block font-sans text-[10px] uppercase font-bold text-zinc-400">Last Name</label>
                      <input 
                        type="text" 
                        required
                        value={formState.lastName}
                        onChange={(e) => setFormState({...formState, lastName: e.target.value})}
                        className="sonic-input"
                        placeholder="Tyagi"
                      />
                    </div>
                  </div>

                  <div className="space-y-1">
                    <label className="block font-sans text-[10px] uppercase font-bold text-zinc-400">Email Address</label>
                    <input 
                      type="email" 
                      required
                      value={formState.email}
                      onChange={(e) => setFormState({...formState, email: e.target.value})}
                      className="sonic-input"
                      placeholder="example@gmail.com"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="block font-sans text-[10px] uppercase font-bold text-zinc-400">Location / City</label>
                    <input 
                      type="text" 
                      required
                      value={formState.location}
                      onChange={(e) => setFormState({...formState, location: e.target.value})}
                      className="sonic-input"
                      placeholder="New Delhi, India"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="block font-sans text-[10px] uppercase font-bold text-zinc-400">Inquiry Details</label>
                    <textarea 
                      required
                      rows={3}
                      value={formState.message}
                      onChange={(e) => setFormState({...formState, message: e.target.value})}
                      className="sonic-input resize-none"
                      placeholder="Details about your fabric customization, weaving specifications, or quantities..."
                    />
                  </div>

                  <button 
                    type="submit" 
                    className="sonic-btn-primary w-full text-xs"
                  >
                    Submit Request
                  </button>
                </form>
              )}
            </div>
          </motion.div>

        </div>

      </div>
    </main>
  );
}
