"use client";

import { useEffect, useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import { Auth } from '@supabase/auth-ui-react';
import { ThemeSupa } from '@supabase/auth-ui-shared';
import { X } from 'lucide-react';
import { MotionDiv } from './Motion';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
  title?: string;
}

export default function AuthModal({ isOpen, onClose, onSuccess, title = "Sign In" }: AuthModalProps) {
  const [supabase] = useState(() => createClient());
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    // Listen for auth state changes to close modal automatically
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === 'SIGNED_IN' && session) {
        if (onSuccess) onSuccess();
        onClose();
      }
    });
    return () => subscription.unsubscribe();
  }, [supabase.auth, onClose, onSuccess]);

  if (!mounted || !isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
      <MotionDiv
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95 }}
        className="w-full max-w-md bg-[var(--unbleached-cotton)] rounded-xl shadow-2xl overflow-hidden relative border border-[var(--charcoal-ink)]/10"
      >
        <div className="flex justify-between items-center p-6 border-b border-zinc-200 bg-white">
          <h2 className="font-serif italic text-2xl font-bold text-[var(--charcoal-ink)]">{title}</h2>
          <button 
            onClick={onClose}
            className="text-zinc-400 hover:text-[var(--madder-red)] transition-colors p-1"
            aria-label="Close"
          >
            <X size={20} />
          </button>
        </div>
        
        <div className="p-6 sm:p-8 bg-zinc-50">
          <Auth
            supabaseClient={supabase}
            appearance={{
              theme: ThemeSupa,
              variables: {
                default: {
                  colors: {
                    brand: 'var(--charcoal-ink)',
                    brandAccent: 'var(--madder-red)',
                    inputBackground: 'transparent',
                    inputText: 'var(--charcoal-ink)',
                    inputBorder: 'rgba(0,0,0,0.2)',
                    inputBorderFocus: 'var(--turmeric)',
                    inputBorderHover: 'var(--charcoal-ink)',
                  },
                  fonts: {
                    bodyFontFamily: 'var(--font-sans)',
                    buttonFontFamily: 'var(--font-sans)',
                    inputFontFamily: 'var(--font-sans)',
                    labelFontFamily: 'var(--font-sans)',
                  },
                  radii: {
                    borderRadiusButton: '4px',
                    buttonBorderRadius: '4px',
                    inputBorderRadius: '4px',
                  }
                }
              },
              className: {
                container: 'font-sans',
                button: 'sonic-btn-primary w-full text-sm font-bold',
                input: 'sonic-input text-sm',
                label: 'text-[10px] uppercase tracking-widest font-bold opacity-60 mb-1',
                anchor: 'text-xs text-[var(--madder-red)] hover:underline',
              }
            }}
            providers={['google']}
            magicLink={true}
            showLinks={true}
            view="sign_in"
          />
          <p className="text-[10px] text-center uppercase tracking-widest mt-6 opacity-40">
            Secure connection via Supabase Auth
          </p>
        </div>
      </MotionDiv>
    </div>
  );
}
