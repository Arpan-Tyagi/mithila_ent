'use client';

import { useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Button } from '@/components/ui/Button';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const router = useRouter();
  const supabase = createClient();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setMessage('');
    const { data, error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) {
      setMessage(error.message);
      setLoading(false);
    } else {
      const { data: profile } = await supabase.from('profiles').select('role').eq('id', data.user.id).single();
      if (profile?.role === 'admin') {
        router.push('/admin/dashboard');
      } else {
        router.push('/');
      }
      router.refresh();
    }
  };

  return (
    <main className="flex-grow bg-[var(--unbleached-cotton)] py-24 flex items-center justify-center px-4">
      <div className="w-full max-w-md bg-white border-2 border-[var(--charcoal-ink)] p-8 rounded-sm shadow-2xl relative">
        {/* Decorative corner */}
        <div className="absolute top-0 left-0 w-8 h-8 bg-[var(--madder-red)] border-b-2 border-r-2 border-[var(--charcoal-ink)]"></div>
        
        <h1 className="font-serif text-3xl font-bold text-[var(--charcoal-ink)] mb-2 mt-4 text-center">Welcome Back</h1>
        <p className="font-sans text-sm opacity-70 text-center mb-8">Enter your details to access your portal.</p>
        
        <form onSubmit={handleLogin} className="space-y-6">
          <div>
            <label className="block font-sans text-xs font-bold uppercase tracking-widest text-[var(--charcoal-ink)] mb-2">Email</label>
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full border-2 border-[var(--charcoal-ink)] bg-transparent p-3 font-sans focus:outline-none focus:border-[var(--madder-red)] transition-colors"
            />
          </div>
          <div>
            <label className="block font-sans text-xs font-bold uppercase tracking-widest text-[var(--charcoal-ink)] mb-2">Password</label>
            <input
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full border-2 border-[var(--charcoal-ink)] bg-transparent p-3 font-sans focus:outline-none focus:border-[var(--madder-red)] transition-colors"
            />
          </div>
          
          <div className="flex items-center justify-between">
            <label className="flex items-center gap-2 font-sans text-sm cursor-pointer">
              <input type="checkbox" className="accent-[var(--madder-red)]" />
              Remember me
            </label>
            <Link href="/forgot-password" className="font-sans text-sm text-[var(--madder-red)] hover:underline">Forgot password?</Link>
          </div>

          {message && (
            <p className="font-sans text-sm text-[var(--madder-red)] text-center">{message}</p>
          )}

          <Button type="submit" disabled={loading} className="w-full">
            {loading ? 'Signing in...' : 'Sign In'}
          </Button>
        </form>

        <p className="font-sans text-sm text-center mt-8">
          Don't have an account? <Link href="/signup" className="font-bold text-[var(--madder-red)] hover:underline">Sign up</Link>
        </p>
      </div>
    </main>
  );
}
