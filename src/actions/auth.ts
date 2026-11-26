'use server'

import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { headers } from 'next/headers'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'

import { sendSecurityAlertEmail } from '@/lib/email'
import { passwordError } from '@/lib/password'
import { safeNextPath } from '@/lib/safe-next'

// FormData values can be File objects; keep only bounded strings (SEC-12).
function formString(formData: FormData, key: string, max: number): string {
  const v = formData.get(key)
  return typeof v === 'string' && v.length <= max ? v : ''
}

export async function login(prevState: unknown, formData: FormData) {
  const supabase = await createClient()
  const email = formString(formData, 'email', 254).trim()
  const password = formString(formData, 'password', 256)
  const nextPath = safeNextPath(formData.get('next'))

  if (!email || !password) {
    return { error: 'Email and password are required' }
  }

  // The lockout functions are EXECUTE-able by service_role only (migration 0042):
  // with the public anon key anyone could otherwise lock any account or clear
  // the counter between password guesses. Threshold and lock length are fixed
  // inside the database.
  const lockout = createAdminClient()
  const { data: locked } = await lockout.rpc('auth_attempt_is_locked', { p_email: email })
  if (locked === true) {
    return { error: 'Account temporarily locked due to multiple failed attempts. Please try again later.' }
  }

  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password,
  })

  if (error || !data.user) {
    const { data: res } = await lockout.rpc('auth_attempt_record_failure', { p_email: email })

    if (res?.justLocked) {
      await sendSecurityAlertEmail(email)
      return { error: 'Account temporarily locked due to multiple failed attempts. A security alert has been sent to your email.' }
    }
    if (res?.locked) {
      return { error: 'Account temporarily locked due to multiple failed attempts. Please try again later.' }
    }
    return { error: error?.message || 'Failed to login' }
  }

  // On success, clear the failure counter.
  await lockout.rpc('auth_attempt_clear', { p_email: email })

  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', data.user.id)
    .single()

  revalidatePath('/', 'layout')

  if (profile?.role === 'admin') {
    redirect('/admin/dashboard')
  } else {
    redirect(nextPath)
  }
}

export async function register(prevState: unknown, formData: FormData) {
  const supabase = await createClient()
  const email = formString(formData, 'email', 254).trim()
  const password = formString(formData, 'password', 256)
  const fullName = formString(formData, 'fullName', 100).trim()
  const nextPath = safeNextPath(formData.get('next'))

  if (!email || !password) {
    return { error: 'Email and password are required' }
  }

  // Enforce the shared password policy (see src/lib/password.ts)
  const pwError = passwordError(password)
  if (pwError) {
    return { error: pwError }
  }

  const headersList = await headers()
  const host = headersList.get('host')
  const protocol = headersList.get('x-forwarded-proto') || 'https'
  
  const origin = host 
    ? `${protocol}://${host}`
    : process.env.NEXT_PUBLIC_SITE_URL 
      ? process.env.NEXT_PUBLIC_SITE_URL 
      : process.env.VERCEL_URL 
        ? `https://${process.env.VERCEL_URL}` 
        : 'http://localhost:3000'
  
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: {
        full_name: fullName,
      },
      emailRedirectTo: `${origin}/api/auth/callback?next=${encodeURIComponent(nextPath)}`,
    },
  })

  if (error || !data.user) {
    return { error: error?.message || 'Failed to register' }
  }

  // When email confirmation is enabled, signUp returns a user but NO session.
  // Redirecting into a protected route here would just bounce the user back to
  // /login via the proxy, so prompt them to confirm their email instead.
  if (!data.session) {
    return {
      success: 'Account created. Please check your email to confirm your address before signing in.',
    }
  }

  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', data.user.id)
    .single()

  revalidatePath('/', 'layout')

  if (profile?.role === 'admin') {
    redirect('/admin/dashboard')
  } else {
    redirect(nextPath)
  }
}

export async function logout() {
  const supabase = await createClient()
  await supabase.auth.signOut()
  revalidatePath('/', 'layout')
  redirect('/')
}

export async function signInWithGoogle(formData: FormData) {
  const supabase = await createClient()
  const headersList = await headers()
  const host = headersList.get('host')
  const protocol = headersList.get('x-forwarded-proto') || 'https'
  
  const origin = host 
    ? `${protocol}://${host}`
    : process.env.NEXT_PUBLIC_SITE_URL 
      ? process.env.NEXT_PUBLIC_SITE_URL 
      : process.env.VERCEL_URL 
        ? `https://${process.env.VERCEL_URL}` 
        : 'http://localhost:3000'
  const nextPath = safeNextPath(formData.get('next'))
  
  const { data, error } = await supabase.auth.signInWithOAuth({
    provider: 'google',
    options: {
      redirectTo: `${origin}/api/auth/callback?next=${encodeURIComponent(nextPath)}`,
    },
  })

  if (data.url) {
    redirect(data.url)
  }
}

