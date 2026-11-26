import { NextRequest, NextResponse } from 'next/server'
import { secretMatches } from '@/lib/secure-compare'
import { retryPendingWebhookEvents } from '@/lib/payments/razorpay-webhook'

// Re-runs Razorpay webhook events that were stored but not processed (a
// transient database or network failure after the 200 was sent). SEC-07.
export const dynamic = 'force-dynamic'

async function run(request: NextRequest) {
  const secret = process.env.CRON_SECRET
  if (!secret) {
    return NextResponse.json({ error: 'CRON_SECRET not configured' }, { status: 503 })
  }
  const auth = request.headers.get('authorization') || ''
  const token = auth.startsWith('Bearer ') ? auth.slice(7) : ''
  if (!secretMatches(secret, token)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }
  try {
    const result = await retryPendingWebhookEvents(50)
    return NextResponse.json({ ok: true, ...result })
  } catch (err) {
    console.error('webhook-retry cron failed:', (err as Error).message)
    return NextResponse.json({ error: 'failed' }, { status: 500 })
  }
}

export async function GET(request: NextRequest) {
  return run(request)
}
export async function POST(request: NextRequest) {
  return run(request)
}
