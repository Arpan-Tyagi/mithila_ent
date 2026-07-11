import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { calculateShippingRates, calculateGST } from '@/lib/shipping';

export async function POST(request: Request) {
  try {
    const { items, pinCode, state } = await request.json();

    if (!items || !pinCode || !state) {
      return NextResponse.json({ error: 'Missing parameters' }, { status: 400 });
    }

    const supabase = await createClient();
    
    // Calculate total weight and base amount for GST calculation
    let totalWeightGrams = 0;
    let baseAmount = 0;
    
    // We fetch the weight from db for security and accuracy
    const itemIds = items.map((i: any) => i.id || i.variant_id);
    const { data: variants } = await supabase
      .from('product_variants')
      .select('id, weight_grams, price, products(gst_rate)')
      .in('id', itemIds);

    let totalGst = 0;
    let totalIgst = 0;
    let totalCgst = 0;
    let totalSgst = 0;

    if (variants) {
      for (const item of items) {
        const variant = variants.find(v => v.id === (item.id || item.variant_id));
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
    
    // Default fallback rate
    let shippingAmount = 50; 
    let courierId = null;

    if (weightKg > 0) {
      const shipRes = await calculateShippingRates(pinCode, weightKg);
      if (shipRes && !shipRes.error) {
        shippingAmount = shipRes.rate;
        courierId = shipRes.courierId;
      }
    }

    return NextResponse.json({
      shippingAmount,
      totalGst,
      breakdown: {
        igst: totalIgst,
        cgst: totalCgst,
        sgst: totalSgst
      },
      courierId,
      baseAmount
    });
  } catch (err) {
    console.error('Shipping calculation error:', err);
    return NextResponse.json({ error: (err as Error).message }, { status: 500 });
  }
}
