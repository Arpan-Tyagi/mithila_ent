import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { safeNextPath } from '@/lib/safe-next'

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url)
  const code = searchParams.get('code')
  // SEC-04: only same-origin relative paths are honoured; anything else
  // (absolute URL, //host, /\host) falls back to /account.
  const next = safeNextPath(searchParams.get('next'))

  if (code) {
    const supabase = await createClient()
    const { error } = await supabase.auth.exchangeCodeForSession(code)
    if (!error) {
      return NextResponse.redirect(new URL(next, origin))
    } else {
      console.error('Auth callback error:', error.message)
    }
  }

  // if no code or error, redirect back to login
  return NextResponse.redirect(new URL('/login?error=Invalid_or_expired_link', origin))
}
