import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { sendDueEmails } from '@/lib/email'
import { secretMatches } from '@/lib/secure-compare'

export const dynamic = 'force-dynamic'

async function run(request: NextRequest) {
  const secret = process.env.CRON_SECRET
  // Fail closed: without a configured secret the worker refuses to run, so it
  // can never be triggered anonymously. The inline send still delivers email.
  if (!secret) {
    return NextResponse.json({ error: 'CRON_SECRET not configured' }, { status: 503 })
  }
  const auth = request.headers.get('authorization') || ''
  if (!secretMatches(secret, auth.startsWith('Bearer ') ? auth.slice(7) : '')) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }
  try {
    const admin = createAdminClient()
    const result = await sendDueEmails(admin, 25)
    return NextResponse.json({ ok: true, ...result })
  } catch (err: any) {
    console.error('process-emails cron failed:', err)
    return NextResponse.json({ error: 'failed' }, { status: 500 })
  }
}

export async function GET(request: NextRequest) {
  return run(request)
}
export async function POST(request: NextRequest) {
  return run(request)
}
