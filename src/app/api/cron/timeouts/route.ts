import { NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/admin';

export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
  try {
    // Fail closed: with CRON_SECRET unset, `Bearer ${undefined}` would match the
    // literal header "Bearer undefined".
    const secret = process.env.CRON_SECRET;
    if (!secret) {
      return NextResponse.json({ error: 'CRON_SECRET not configured' }, { status: 503 });
    }
    const authHeader = request.headers.get('authorization');
    if (authHeader !== `Bearer ${secret}`) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const admin = createAdminClient();
    const { data, error } = await admin.rpc('cancel_expired_pending_orders');

    if (error) {
      console.error('Failed to cancel expired orders:', error);
      return NextResponse.json({ error: 'Database error' }, { status: 500 });
    }

    return NextResponse.json({ success: true, cancelledCount: data });
  } catch (error: any) {
    console.error('Cron timeout error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
