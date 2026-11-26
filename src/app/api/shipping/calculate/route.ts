import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { calculateShippingRates, calculateGST, isValidPinCode } from '@/lib/shipping';
import { checkApiRateLimit } from '@/lib/ratelimit';

// Checkout-only quote endpoint. SEC-05: requires a signed-in user (checkout
// needs one anyway), is rate limited per user because every call spends a
// courier API request, validates the PIN code, and returns generic errors.
const MAX_ITEMS = 50;

export async function POST(request: Request) {
  try {
    const supabase = await createClient();
    const { data: userData } = await supabase.auth.getUser();
    if (!userData?.user) {
      return NextResponse.json({ error: 'Sign in required' }, { status: 401 });
    }
    if (!(await checkApiRateLimit(`shipping-quote:${userData.user.id}`))) {
      return NextResponse.json({ error: 'Too many requests' }, { status: 429 });
    }

    const body = await request.json().catch(() => null);
    const items = body?.items;
    const pinCode = typeof body?.pinCode === 'string' ? body.pinCode.trim() : '';
    const state = typeof body?.state === 'string' ? body.state.trim().slice(0, 64) : '';

    if (!Array.isArray(items) || items.length === 0 || items.length > MAX_ITEMS || !state) {
      return NextResponse.json({ error: 'Missing parameters' }, { status: 400 });
    }
    if (!isValidPinCode(pinCode)) {
      return NextResponse.json({ error: 'Invalid PIN code' }, { status: 400 });
    }

    const lines = items
      .map((i: any) => ({
        id: typeof (i?.id ?? i?.variant_id) === 'string' ? (i.id ?? i.variant_id) : null,
        quantity: Number(i?.quantity),
      }))
      .filter((i: { id: string | null; quantity: number }) =>
        i.id && Number.isFinite(i.quantity) && i.quantity > 0 && i.quantity <= 1000);
    if (lines.length === 0) {
      return NextResponse.json({ error: 'Missing parameters' }, { status: 400 });
    }

    // Weight, price and GST rate come from the database, never the client.
    let totalWeightGrams = 0;
    let baseAmount = 0;
    const { data: variants } = await supabase
      .from('product_variants')
      .select('id, weight_grams, price, products(gst_rate)')
      .in('id', lines.map((l: { id: string }) => l.id));

    let totalGst = 0;
    let totalIgst = 0;
    let totalCgst = 0;
    let totalSgst = 0;

    if (variants) {
      for (const item of lines) {
        const variant = variants.find(v => v.id === item.id);
        if (variant) {
          totalWeightGrams += (variant.weight_grams || 200) * item.quantity;

          const lineBaseAmount = (variant.price || 0) * item.quantity;
          baseAmount += lineBaseAmount;

          const gstRate = (variant.products as any)?.gst_rate || 5; // default to 5% if not set
          const taxInfo = calculateGST(state, lineBaseAmount, Number(gstRate));

          totalGst += taxInfo.totalTax;
          totalIgst += taxInfo.igst;
          totalCgst += taxInfo.cgst;
          totalSgst += taxInfo.sgst;
        }
      }
    }

    const weightKg = totalWeightGrams / 1000;
    const shipRes = await calculateShippingRates(pinCode, weightKg > 0 ? weightKg : 0.2);

    return NextResponse.json({
      shippingAmount: shipRes.rate,
      totalGst,
      breakdown: {
        igst: totalIgst,
        cgst: totalCgst,
        sgst: totalSgst
      },
      courierId: shipRes.courierId ?? null,
      baseAmount
    });
  } catch (err) {
    console.error('Shipping calculation error:', err instanceof Error ? err.message : err);
    return NextResponse.json({ error: 'Could not calculate shipping' }, { status: 500 });
  }
}
