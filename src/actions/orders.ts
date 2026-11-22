'use server';

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'
import { createAdminClient } from '@/lib/supabase/admin'
import { enqueueOrderEmail, processEmailRow } from '@/lib/email'
import { calculateShippingRates } from '@/lib/shipping'
import { checkApiRateLimit } from '@/lib/ratelimit'

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

  // Each order holds stock until it is paid or expires, so placement is
  // throttled per account (the database also caps unpaid orders, migration 0043).
  if (!(await checkApiRateLimit(`create-order:${userData.user.id}`))) {
    return { success: false, error: 'Too many order attempts. Please wait a minute and try again.' }
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

  // --- Courier quote (the only money input the DB takes from us) ---------
  // Weight comes from the database, never from the client cart. Prices, GST
  // and discounts are all computed inside create_order_atomic.
  let totalWeightGrams = 0;
  const itemIds = items.map(i => i.variant_id);
  const { data: variants } = await supabase.from('product_variants').select('id, weight_grams').in('id', itemIds);
  if (variants) {
    for (const item of items) {
      const variant = variants.find(v => v.id === item.variant_id);
      if (variant) totalWeightGrams += (variant.weight_grams || 200) * item.quantity;
    }
  }

  const weightKg = totalWeightGrams / 1000;
  let validatedShippingAmount = 50;
  if (weightKg > 0 && shippingAddress?.pinCode) {
    const shipRes = await calculateShippingRates(shippingAddress.pinCode, weightKg);
    if (shipRes && !shipRes.error && Number.isFinite(shipRes.rate) && shipRes.rate >= 0) {
      validatedShippingAmount = shipRes.rate;
    }
  }
  // -------------------------------------------------------------------

  // Create the order atomically on the DB: unit prices, GST (products.gst_rate)
  // and discounts are computed there, stock rows are locked FOR UPDATE, and the
  // whole thing is one transaction. The RPC is executable by service_role only
  // (migration 0040), so the user id is passed from the verified session above.
  const admin = createAdminClient()
  const { data: orderId, error } = await admin.rpc('create_order_atomic', {
    p_user_id: userData.user.id,
    p_items: items,
    p_shipping: shippingAddress ?? {},
    p_shipping_amount: validatedShippingAmount,
    p_discount_code: discountCode && discountCode.trim() ? discountCode.trim() : null,
    p_idempotency_key: idempotencyKey || null,
  })

  if (error || !orderId) {
    const msg = error?.message || ''
    if (msg.includes('INSUFFICIENT_STOCK')) {
      return { success: false, error: 'Sorry, one or more items just went out of stock.' }
    }
    if (msg.includes('VARIANT_NOT_FOUND')) {
      return { success: false, error: 'One or more items in your cart are no longer available.' }
    }
    if (msg.includes('BELOW_MOQ')) {
      return { success: false, error: 'One or more items are below the minimum order quantity.' }
    }
    if (msg.includes('INVALID_QUANTITY') || msg.includes('TOO_MANY_ITEMS')) {
      return { success: false, error: 'Your cart has an invalid item. Please refresh and try again.' }
    }
    if (msg.includes('INVALID_SHIPPING')) {
      return { success: false, error: 'We could not calculate shipping for this address.' }
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
    if (msg.includes('TOO_MANY_PENDING_ORDERS')) {
      return { success: false, error: 'You already have several unpaid orders. Unpaid orders are cancelled after an hour, so please try again then.' }
    }
    if (msg.includes('TOO_MANY_UNPAID_ORDERS')) {
      return { success: false, error: 'Several of your recent orders were not paid, so new orders are paused for now. Please try again later or contact us.' }
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
    if (error) throw new Error('Failed to cancel order')
    // The orders status trigger logs order.status_changed; this records why.
    const { error: eventErr } = await admin.from('order_events').insert({
      order_id: orderId,
      event: 'order.cancelled',
      to_status: 'cancelled',
      note: 'Cancelled by admin; no restock (shrinkage)',
    })
    if (eventErr) console.error('cancelOrder: order_events insert failed:', eventErr)
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
    const { error: eventErr } = await admin.from('order_events').insert({
      order_id: orderId,
      event: 'order_item.cancelled',
      note: `Line item cancelled. Refunded ₹${refundAmount.toFixed(2)} (inc. tax ₹${taxRefund.toFixed(2)})${restock ? ' (Restocked)' : ' (Shrinkage)'}`,
    })
    if (eventErr) console.error('partialCancelOrderItem: order_events insert failed:', eventErr)
  }

  revalidatePath('/admin/orders')
  revalidatePath(`/admin/orders/${orderId}`)
  return { success: true }
}
