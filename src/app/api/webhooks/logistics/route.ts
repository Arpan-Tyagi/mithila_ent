import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function POST(request: Request) {
  try {
    const payload = await request.json();
    // Verify logistics provider signature here in production
    
    const { order_id, tracking_status } = payload;
    const supabase = await createClient();

    const { error } = await supabase
      .from('orders')
      .update({ tracking_status })
      .eq('id', order_id);

    if (error) throw error;

    return NextResponse.json({ success: true });
  } catch (err) {
    return NextResponse.json({ error: (err as Error).message }, { status: 400 });
  }
}
