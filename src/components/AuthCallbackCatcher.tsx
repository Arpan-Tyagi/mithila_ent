'use client';

import { useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';

export default function AuthCallbackCatcher() {
  const searchParams = useSearchParams();
  const router = useRouter();

  useEffect(() => {
    // 1. Handle PKCE flow where Supabase drops a ?code= on the homepage
    const code = searchParams.get('code');
    const nextPath = searchParams.get('next') || '/account';

    if (code) {
      router.replace(`/api/auth/callback?code=${code}&next=${nextPath}`);
      return;
    }

    // 2. Handle Implicit Grant flow where Supabase drops #access_token= on the homepage
    if (typeof window !== 'undefined' && window.location.hash.includes('access_token=')) {
      import('@/lib/supabase/client').then(({ createClient }) => {
        const supabase = createClient();
        supabase.auth.getSession().then(() => {
          // The browser client automatically parses the hash, establishes the session, 
          // and sets the cookies. We just need to refresh the router to update the UI.
          router.push(nextPath);
          router.refresh();
        });
      });
    }
  }, [searchParams, router]);

  return null;
}
