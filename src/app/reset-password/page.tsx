"use client";

import { useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import { Button } from '@/components/ui/Button';

export default function ResetPassword() {
  const [password, setPassword] = useState('');
  const [message, setMessage] = useState('');
  const supabase = createClient();

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    const { error } = await supabase.auth.updateUser({ password });
    if (error) setMessage(error.message);
    else setMessage('Password updated successfully. You can now log in.');
  };

  return (
    <main className="flex-grow flex items-center justify-center py-16 bg-[var(--unbleached-cotton)]">
      <div className="max-w-md w-full bg-white p-8 border-2 border-[var(--charcoal-ink)] shadow-[4px_4px_0_var(--charcoal-ink)]">
        <h1 className="font-serif text-2xl font-bold mb-4">New Password</h1>
        <form onSubmit={handleUpdate} className="space-y-4">
          <input 
            type="password" 
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="Enter new password" 
            required 
            className="w-full border-2 border-[var(--charcoal-ink)] p-3 font-sans focus:outline-none"
          />
          <Button type="submit" className="w-full">Update Password</Button>
        </form>
        {message && <p className="mt-4 text-sm font-sans font-bold text-[var(--charcoal-ink)]">{message}</p>}
      </div>
    </main>
  );
}
