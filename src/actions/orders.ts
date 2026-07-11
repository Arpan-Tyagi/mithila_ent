'use server';

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'
import { createAdminClient } from '@/lib/supabase/admin'
import { enqueueOrderEmail, processEmailRow } from '@/lib/email'
import { calculateShippingRates, calculateGST } from '@/lib/shipping'

export async function updateOrderStatus(orderId: string, status: string, trackingNumber?: string) {
  const supabase = await createClient()

  // Verify Admin
  const { data: userData } = await supabase.auth.getUser()
  if (!userData?.user) throw new Error('Unauthorized')
  const { data: profile } = await supabase.from('profiles').select('role').eq('id', userData.user.id).single()
  if (profile?.role !== 'admin') throw new Error('Forbidden')

  const updateData: any = { status }
  if (trackingNumber) {
    updateData.tracking_status = trackingNumber
  }

  const { error } = await supabase
    .from('orders')
    .update(updateData)
    .eq('id', orderId)

  if (error) throw new Error(error.message)

  // Notify the customer on shipment / delivery (durable queue + instant best-effort).
  if (status === 'shipped' || status === 'delivered') {
    try {
      const admin = createAdminClient()
      const { data: ord } = await admin
        .from('orders')
        .select('id, shipping_address, user_id')
        .eq('id', orderId)
        .single()
      let recipient: string | undefined = (ord?.shipping_address as any)?.email
      if (!recipient && ord?.user_id) {
        const { data: u } = await admin.auth.admin.getUserById(ord.user_id)
        recipient = u?.user?.email || undefined
      }
      if (recipient) {
        const row = await enqueueOrderEmail(admin, {
          orderId,
          recipient,
          kind: status === 'shipped' ? 'order_shipped' : 'order_delivered',
        })
        if (row) {
          try {
            await processEmailRow(admin, row)
          } catch (sendErr) {
            console.error('inline status send failed (will retry via cron):', sendErr)
          }
        }
      }
    } catch (statusEmailErr) {
      console.error('Failed to queue status email:', statusEmailErr)
    }
  }

  revalidatePath('/admin/orders')
  revalidatePath('/account/orders')
  return { success: true }
}

export async function createOrder(cartItems: any[], shippingAddress: any, discountCode?: string, idempotencyKey?: string) {
  const supabase = await createClient()

  const { data: userData } = await supabase.auth.getUser()
  if (!userData?.user) {
    return { success: false, error: 'Please sign in to complete your order.' }
  }

  // Normalize cart items. The Zustand cart stores the variant id as `id`
  // (see src/store/useCart.ts), so accept either `variant_id` or `id`.
  const items = (cartItems || [])
    .map((item) => ({
      variant_id: item?.variant_id ?? item?.id,
      quantity: Number(item?.quantity) || 0,
    }))
    .filter((item) => item.variant_id && item.quantity > 0)

  if (items.length === 0) {
    return { success: false, error: 'Your cart is empty.' }
  }

  // --- Dynamic Shipping & Tax Calculation (Server-side validation) ---
  let totalWeightGrams = 0;
  let baseAmount = 0;
  let totalGst = 0;
  
  const itemIds = items.map(i => i.variant_id);
  const { data: variants } = await supabase.from('product_variants').select('id, weight_grams, price, products(gst_rate)').in('id', itemIds);
  
  if (variants) {
    for (const item of items) {
      const variant = variants.find(v => v.id === item.variant_id);
      if (variant) {
        totalWeightGrams += (variant.weight_grams || 200) * item.quantity;
        const lineBaseAmount = (variant.price || 0) * item.quantity;
        baseAmount += lineBaseAmount;
        
        const gstRate = (variant.products as any)?.gst_rate || 5;
        const state = shippingAddress?.state || 'Delhi';
        const taxInfo = calculateGST(state, lineBaseAmount, Number(gstRate));
        totalGst += taxInfo.totalTax;
      }
    }
  }

  const weightKg = totalWeightGrams / 1000;
  let validatedShippingAmount = 50; 
  if (weightKg > 0 && shippingAddress?.pinCode) {
    const shipRes = await calculateShippingRates(shippingAddress.pinCode, weightKg);
    if (shipRes && !shipRes.error) {
      validatedShippingAmount = shipRes.rate;
    }
  }
  // -------------------------------------------------------------------

  // Create the order atomically on the DB: prices are read server-side, stock
  // rows are locked FOR UPDATE, and the whole thing is one transaction that
  // rolls back on any failure. See supabase/migrations/0007_create_order_atomic.sql.
  const { data: orderId, error } = await supabase.rpc('create_order_atomic', {
    p_items: items,
    p_shipping: shippingAddress ?? {},
    p_discount_code: discountCode && discountCode.trim() ? discountCode.trim() : null,
    p_idempotency_key: idempotencyKey || null,
    p_tax_amount_override: totalGst, // Assuming we modify SQL to accept absolute amount
    p_shipping_amount: validatedShippingAmount,
  })

  if (error || !orderId) {
    const msg = error?.message || ''
    if (msg.includes('INSUFFICIENT_STOCK')) {
      return { success: false, error: 'Sorry, one or more items just went out of stock.' }
    }
    if (msg.includes('VARIANT_NOT_FOUND')) {
      return { success: false, error: 'One or more items in your cart are no longer available.' }
    }
    if (msg.includes('AUTH_REQUIRED')) {
      return { success: false, error: 'Please sign in to complete your order.' }
    }
    if (msg.includes('EMPTY_CART')) {
      return { success: false, error: 'Your cart is empty.' }
    }
    if (msg.includes('INVALID_DISCOUNT')) {
      return { success: false, error: 'That discount code is not valid or has expired.' }
    }
    console.error('createOrder failed:', error)
    return { success: false, error: 'We could not process your order. Please try again.' }
  }

  const orderIdStr = String(orderId)

  // Record a payment intent so every order has an entry in the payment log.
  const { error: piErr } = await supabase.rpc('log_payment_intent', { p_order_id: orderIdStr })
  if (piErr) console.error('log_payment_intent failed:', piErr)

  // Queue the confirmation + invoice email durably, then try to send it right
  // away (best-effort). Anything not sent now is retried by the cron worker, so
  // a transient Resend/PDF failure no longer loses the email.
  try {
    if (userData.user.email) {
      const admin = createAdminClient()
      const customerName =
        shippingAddress?.fullName ||
        [shippingAddress?.firstName, shippingAddress?.lastName].filter(Boolean).join(' ') ||
        'Customer'
      const row = await enqueueOrderEmail(admin, {
        orderId: orderIdStr,
        recipient: userData.user.email,
        kind: 'order_confirmation',
        payload: { customerName },
      })
      if (row) {
        try {
          await processEmailRow(admin, row)
        } catch (sendErr) {
          console.error('inline confirmation send failed (will retry via cron):', sendErr)
        }
      }
    }
  } catch (emailErr) {
    console.error('Failed to queue invoice email:', emailErr)
    // Never block the order on email.
  }

  revalidatePath('/account/orders')
  revalidatePath('/admin/orders')
  return { success: true, orderId: orderIdStr }
}


export async function previewDiscount(code: string, subtotal: number) {
  const supabase = await createClient()
  const { data, error } = await supabase.rpc('validate_discount', {
    p_code: code || '',
    p_subtotal: subtotal,
  })

  if (error || !data) {
    return { valid: false as const, error: 'Could not validate code.' }
  }

  const res = data as any
  if (!res.valid) {
    return { valid: false as const, error: res.error || 'Invalid code.' }
  }

  let label = ''
  if (res.type === 'percentage') label = `${Number(res.value)}% off`
  else if (res.type === 'fixed_amount') label = `₹${Number(res.value)} off`
  else if (res.type === 'free_shipping') label = 'Free shipping'

  return {
    valid: true as const,
    code: String(res.code),
    type: String(res.type),
    discountAmount: Number(res.discountAmount),
    label,
  }
}


export async function requestCancellation(orderId: string) {
  const supabase = await createClient()
  const { data: userData } = await supabase.auth.getUser()
  if (!userData?.user) return { success: false, error: 'Please sign in.' }

  const { data, error } = await supabase.rpc('request_order_cancellation', { p_order_id: orderId })
  const res = data as any
  if (error || !res?.ok) {
    const code = res?.error || error?.message || ''
    if (code.includes('NOT_CANCELLABLE')) {
      return { success: false, error: 'This order can no longer be cancelled.' }
    }
    return { success: false, error: 'Could not request cancellation.' }
  }

  revalidatePath('/account/orders')
  revalidatePath('/admin/orders')
  return { success: true }
}

export async function cancelOrder(orderId: string, restock: boolean = true) {
  const supabase = await createClient()
  const { data: userData } = await supabase.auth.getUser()
  if (!userData?.user) throw new Error('Unauthorized')
  const { data: profile } = await supabase.from('profiles').select('role').eq('id', userData.user.id).single()
  if (profile?.role !== 'admin') throw new Error('Forbidden')

  const admin = createAdminClient()

  if (restock) {
    const { data, error } = await admin.rpc('cancel_order_restock', { p_order_id: orderId })
    if (error || !(data as any)?.ok) throw new Error('Failed to cancel order')
  } else {
    // Refund Only (Shrinkage)
    const { error } = await admin.from('orders').update({ status: 'cancelled' }).eq('id', orderId)
    await admin.from('order_items').update({ status: 'cancelled' }).eq('order_id', orderId)
    await admin.from('order_events').insert({ order_id: orderId, status: 'cancelled', description: 'Order cancelled (No restock - Shrinkage)' })
    if (error) throw new Error('Failed to cancel order')
  }

  revalidatePath('/admin/orders')
  revalidatePath(`/admin/orders/${orderId}`)
  revalidatePath('/account/orders')
  return { success: true }
}

export async function partialCancelOrderItem(orderId: string, orderItemId: string, restock: boolean) {
  const supabase = await createClient()
  const { data: userData } = await supabase.auth.getUser()
  if (!userData?.user) throw new Error('Unauthorized')
  const { data: profile } = await supabase.from('profiles').select('role').eq('id', userData.user.id).single()
  if (profile?.role !== 'admin') throw new Error('Forbidden')

  const admin = createAdminClient()

  // 1. Get the order item
  const { data: item, error: itemErr } = await admin.from('order_items').select('*').eq('id', orderItemId).single()
  if (itemErr || !item) throw new Error('Order item not found')
  if (item.status === 'cancelled' || item.status === 'refunded') throw new Error('Item is already cancelled')

  // 2. Mark item as cancelled
  await admin.from('order_items').update({ status: 'cancelled' }).eq('id', orderItemId)

  // 3. Optional restock
  if (restock) {
    const { data: variant } = await admin.from('product_variants').select('stock_quantity').eq('id', item.variant_id).single()
    if (variant) {
      await admin.from('product_variants').update({ stock_quantity: variant.stock_quantity + item.quantity }).eq('id', item.variant_id)
    }
  }

  // 4. Refund calculation (Proportional discount and Tax)
  const { data: order } = await admin.from('orders').select('subtotal, total_discount, total_amount, shipping_address').eq('id', orderId).single()
  if (order) {
    const itemSubtotal = item.price * item.quantity
    let refundAmount = itemSubtotal
    if (order.total_discount > 0 && order.subtotal > 0) {
      const discountShare = (itemSubtotal / order.subtotal) * order.total_discount
      refundAmount = itemSubtotal - discountShare
    }
    
    // Calculate tax to refund
    let taxRefund = 0;
    const { data: variantData } = await admin.from('product_variants').select('products(gst_rate)').eq('id', item.variant_id).single()
    if ((variantData?.products as any)?.gst_rate) {
      const gstRate = Number((variantData?.products as any)?.gst_rate)
      const state = (order.shipping_address as any)?.state || 'Delhi'
      const { calculateGST } = await import('@/lib/shipping')
      const taxInfo = calculateGST(state, itemSubtotal, gstRate)
      taxRefund = taxInfo.totalTax
    }

    refundAmount += taxRefund;
    
    // Decrease totals on order
    const newSubtotal = Math.max(0, order.subtotal - itemSubtotal)
    const newTotal = Math.max(0, order.total_amount - refundAmount)
    
    await admin.from('orders').update({
      subtotal: newSubtotal,
      total_amount: newTotal
    }).eq('id', orderId)

    // Log the event
    await admin.from('order_events').insert({ 
      order_id: orderId, 
      status: 'refunded', 
      description: `Line item cancelled. Refunded ₹${refundAmount.toFixed(2)} (inc. tax ₹${taxRefund.toFixed(2)})${restock ? ' (Restocked)' : ' (Shrinkage)'}` 
    })
  }

  revalidatePath('/admin/orders')
  revalidatePath(`/admin/orders/${orderId}`)
  return { success: true }
}
