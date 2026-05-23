import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function POST(request: Request) {
  try {
    const payload = await request.json();
    // Verify logistics provider signature here in production
    
    const { order_id, tracking_status } = payload;

    if (!order_id || !tracking_status) {
      return NextResponse.json({ error: 'Missing order_id or tracking_status' }, { status: 400 });
    }

    const supabase = await createClient();

    const { error } = await supabase
      .from('orders')
      .update({ tracking_status, updated_at: new Date().toISOString() })
      .eq('id', order_id);

    if (error) throw error;

    return NextResponse.json({ success: true });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || 'Internal server error' }, { status: 400 });
  }
}
