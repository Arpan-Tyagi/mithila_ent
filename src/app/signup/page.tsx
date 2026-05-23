'use client';

import { useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import Link from 'next/link';
import { Button } from '@/components/ui/Button';
import { useRouter } from 'next/navigation';

export default function SignupPage() {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [message, setMessage] = useState('');
  const [isSuccess, setIsSuccess] = useState(false);
  const [loading, setLoading] = useState(false);
  const supabase = createClient();
  const router = useRouter();

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setMessage('');
    setIsSuccess(false);
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: { data: { full_name: name } },
    });
    if (error) {
      setMessage(error.message);
    } else {
      if (data.session) {
        router.push('/');
        router.refresh();
      } else {
        setIsSuccess(true);
        setMessage('Check your email for verification link.');
      }
    }
    setLoading(false);
  };

  return (
    <main className="flex-grow bg-[var(--unbleached-cotton)] py-24 flex items-center justify-center px-4">
      <div className="w-full max-w-md bg-white border-2 border-[var(--charcoal-ink)] p-8 rounded-sm shadow-2xl relative">
        <div className="absolute top-0 right-0 w-8 h-8 bg-[var(--turmeric)] border-b-2 border-l-2 border-[var(--charcoal-ink)]"></div>
        
        <h1 className="font-serif text-3xl font-bold text-[var(--charcoal-ink)] mb-2 mt-4 text-center">Join Mithila</h1>
        <p className="font-sans text-sm opacity-70 text-center mb-8">Create an account to track orders and save details.</p>
        
        <form onSubmit={handleSignup} className="space-y-6">
          <div>
            <label className="block font-sans text-xs font-bold uppercase tracking-widest text-[var(--charcoal-ink)] mb-2">Full Name</label>
            <input
              type="text"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full border-2 border-[var(--charcoal-ink)] bg-transparent p-3 font-sans focus:outline-none focus:border-[var(--turmeric)] transition-colors"
            />
          </div>
          <div>
            <label className="block font-sans text-xs font-bold uppercase tracking-widest text-[var(--charcoal-ink)] mb-2">Email</label>
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full border-2 border-[var(--charcoal-ink)] bg-transparent p-3 font-sans focus:outline-none focus:border-[var(--turmeric)] transition-colors"
            />
          </div>
          <div>
            <label className="block font-sans text-xs font-bold uppercase tracking-widest text-[var(--charcoal-ink)] mb-2">Password</label>
            <input
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full border-2 border-[var(--charcoal-ink)] bg-transparent p-3 font-sans focus:outline-none focus:border-[var(--turmeric)] transition-colors"
            />
          </div>

          {message && (
            <p className={`font-sans text-sm text-center ${isSuccess ? 'text-green-700' : 'text-[var(--madder-red)]'}`}>
              {message}
            </p>
          )}

          <Button
            type="submit"
            disabled={loading}
            className="w-full bg-[var(--turmeric)] border-[var(--turmeric)] hover:border-[var(--charcoal-ink)] hover:bg-[var(--charcoal-ink)] text-[var(--charcoal-ink)] hover:text-[var(--unbleached-cotton)]"
          >
            {loading ? 'Creating Account...' : 'Create Account'}
          </Button>
        </form>

        <p className="font-sans text-sm text-center mt-8">
          Already have an account? <Link href="/login" className="font-bold text-[var(--turmeric)] hover:underline">Log in</Link>
        </p>
      </div>
    </main>
  );
}
