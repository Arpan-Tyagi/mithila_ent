import 'server-only';
import { cache } from 'react';
import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';

// Data Access Layer: the one place that answers "who is calling, and are they
// allowed?" (CLAUDE.md invariant 1, SEC-12). Proxy redirects are routing only;
// every Server Component, Server Action and Route Handler that needs a user or
// an admin calls one of these. They return small DTOs, never the raw session.

export interface SessionUser {
  id: string;
  email: string | null;
}

export class AuthError extends Error {
  constructor(public readonly code: 'UNAUTHENTICATED' | 'FORBIDDEN') {
    super(code === 'UNAUTHENTICATED' ? 'Unauthorized' : 'Forbidden');
    this.name = 'AuthError';
  }
}

/** The verified user for this request, or null. Cached per request. */
export const getSessionUser = cache(async (): Promise<SessionUser | null> => {
  const supabase = await createClient();
  const { data, error } = await supabase.auth.getUser();
  if (error || !data?.user) return null;
  return { id: data.user.id, email: data.user.email ?? null };
});

/**
 * Whether the caller is an admin. Asks the database (public.is_admin(), which
 * reads public.user_roles, migration 0047), so it cannot drift from what RLS
 * enforces. Cached per request.
 */
export const isAdmin = cache(async (): Promise<boolean> => {
  const user = await getSessionUser();
  if (!user) return false;
  const supabase = await createClient();
  const { data, error } = await supabase.rpc('is_admin');
  if (error) {
    console.error('isAdmin check failed:', error.message);
    return false;
  }
  return data === true;
});

export async function requireUser(): Promise<SessionUser> {
  const user = await getSessionUser();
  if (!user) throw new AuthError('UNAUTHENTICATED');
  return user;
}

export async function requireAdmin(): Promise<SessionUser> {
  const user = await requireUser();
  if (!(await isAdmin())) throw new AuthError('FORBIDDEN');
  return user;
}

/**
 * For Server Component pages and layouts: redirects instead of throwing.
 * Signed out -> /login; signed in but not an admin -> home page.
 */
export async function requireAdminPage(): Promise<SessionUser> {
  const user = await getSessionUser();
  if (!user) redirect('/login?next=/admin/dashboard');
  if (!(await isAdmin())) redirect('/');
  return user;
}

/** For customer pages: signed out -> /login, then back to `next`. */
export async function requireUserPage(next = '/account'): Promise<SessionUser> {
  const user = await getSessionUser();
  if (!user) redirect(`/login?next=${encodeURIComponent(next)}`);
  return user;
}
