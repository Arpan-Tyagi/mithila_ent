'use client';

import { useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';

export default function AuthCallbackCatcher() {
  const searchParams = useSearchParams();
  const router = useRouter();

  useEffect(() => {
    // If Supabase redirects to the root site URL instead of the specific callback API route
    // (which happens if the exact callback URL isn't whitelisted in Supabase Dashboard),
    // we catch the code here and forward it to the real API handler.
    const code = searchParams.get('code');
    const nextPath = searchParams.get('next') || '/account';

    if (code) {
      router.replace(`/api/auth/callback?code=${code}&next=${nextPath}`);
    }
  }, [searchParams, router]);

  return null;
}
