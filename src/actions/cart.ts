'use server';

import { createClient } from '@/lib/supabase/server';

export async function syncCartVariants(variantIds: string[]) {
  if (!variantIds || variantIds.length === 0) return [];
  
  const supabase = await createClient();
  
  const { data, error } = await supabase
    .from('product_variants')
    .select('id, price, min_order_quantity')
    .in('id', variantIds);

  if (error) {
    console.error('Failed to sync cart variants:', error);
    return [];
  }

  return data;
}
