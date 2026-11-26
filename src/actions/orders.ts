'use server';

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'
import { createAdminClient } from '@/lib/supabase/admin'
import { enqueueOrderEmail, processEmailRow } from '@/lib/email'
import { calculateShippingRates, fallbackShippingRate, isValidPinCode } from '@/lib/shipping'
import { checkApiRateLimit } from '@/lib/ratelimit'
import { requireAdmin, requireUser } from '@/lib/dal/session'
import { parseOrThrow, uuid } from '@/lib/validation/common'
import { addressSchema, cartItemsSchema, discountCodeSchema, idempotencyKeySchema } from '@/lib/validation/customer'

const ORDER_STATUSES = new Set(['pending', 'paid', 'shipped', 'delivered', 'cancelled'])

export async function updateOrderStatus(orderId: string, status: string, trackingNumber?: string) {
  await requireAdmin()
  orderId = parseOrThrow(uuid, orderId, 'Invalid order')
  if (typeof status !== 'string' || !ORDER_STATUSES.has(status)) throw new Error('Invalid status')
  const tracking = typeof trackingNumber === 'string' ? trackingNumber.trim().slice(0, 200) : ''
  const supabase = await createClient()

  const updateData: { status: string; tracking_status?: string } = { status }
  if (tracking) {
    updateData.tracking_status = tracking
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

export async function createOrder(cartItems: unknown, shippingAddressInput: unknown, discountCodeInput?: unknown, idempotencyKeyInput?: unknown) {
  let user
  try {
    user = await requireUser()
  } catch {
    return { success: false, error: 'Please sign in to complete your order.' }
  }

  // Each order holds stock until it is paid or expires, so placement is
  // throttled per account (the database also caps unpaid orders, migration 0043).
  if (!(await checkApiRateLimit(`create-order:${user.id}`))) {
    return { success: false, error: 'Too many order attempts. Please wait a minute and try again.' }
  }

  // SEC-12: every input is parsed before use. Cart lines accept `variant_id`
  // or `id` (the Zustand cart's name for the variant id).
  const parsedItems = cartItemsSchema.safeParse(cartItems)
  if (!parsedItems.success) {
    return { success: false, error: parsedItems.error.issues[0]?.message === 'Too many items in the cart.'
      ? 'Too many items in the cart.' : 'Your cart is empty.' }
  }
  const items = parsedItems.data as { variant_id: string; quantity: number }[]

  // SEC-05: the PIN code goes into the courier query and the order row, so it
  // must be exactly six digits (the orders table enforces the same rule).
  const parsedAddress = addressSchema.safeParse(shippingAddressInput)
  if (!parsedAddress.success) {
    const pinIssue = parsedAddress.error.issues.some((i) => i.path[0] === 'pinCode')
    return { success: false, error: pinIssue ? 'Please enter a valid 6-digit PIN code.' : 'Please check your shipping address.' }
  }
  const shippingAddress = parsedAddress.data
  const pinCode = shippingAddress.pinCode
  const discountCode = discountCodeSchema.safeParse(discountCodeInput).data ?? null
  const idempotencyKey = idempotencyKeySchema.safeParse(idempotencyKeyInput).data ?? null

  const supabase = await createClient()

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
  // calculateShippingRates returns the live courier quote, or a weight-band
  // fallback (never a flat amount) when the quote is unavailable.
  const shipRes = await calculateShippingRates(pinCode, weightKg > 0 ? weightKg : 0.2);
  const validatedShippingAmount =
    Number.isFinite(shipRes.rate) && shipRes.rate >= 0 ? shipRes.rate : fallbackShippingRate(weightKg);
  // -------------------------------------------------------------------

  // Create the order atomically on the DB: unit prices, GST (products.gst_rate)
  // and discounts are computed there, stock rows are locked FOR UPDATE, and the
  // whole thing is one transaction. The RPC is executable by service_role only
  // (migration 0040), so the user id is passed from the verified session above.
  const admin = createAdminClient()
  const { data: orderId, error } = await admin.rpc('create_order_atomic', {
    p_user_id: user.id,
    p_items: items,
    p_shipping: shippingAddress,
    p_shipping_amount: validatedShippingAmount,
    p_discount_code: discountCode,
    p_idempotency_key: idempotencyKey,
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
    if (user.email) {
      const customerName =
        [shippingAddress.firstName, shippingAddress.lastName].filter(Boolean).join(' ') || 'Customer'
      const row = await enqueueOrderEmail(admin, {
        orderId: orderIdStr,
        recipient: user.email,
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
  const c = typeof code === 'string' ? code.trim().slice(0, 50) : ''
  const sub = Number(subtotal)
  if (!c || !Number.isFinite(sub) || sub < 0 || sub > 100_000_000) {
    return { valid: false as const, error: 'Invalid code.' }
  }
  const supabase = await createClient()
  const { data, error } = await supabase.rpc('validate_discount', {
    p_code: c,
    p_subtotal: sub,
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
  try {
    await requireUser()
  } catch {
    return { success: false, error: 'Please sign in.' }
  }
  if (!uuid.safeParse(orderId).success) return { success: false, error: 'Could not request cancellation.' }
  const supabase = await createClient()

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
  const me = await requireAdmin()
  orderId = parseOrThrow(uuid, orderId, 'Invalid order')

  const admin = createAdminClient()

  // One transaction in public.cancel_order_restock (migration 0046): locks the
  // order and its lines, restocks only still-active lines when restock=true
  // (shrinkage otherwise), returns the coupon use and logs order.cancelled.
  // Idempotent: a second call on a cancelled order changes nothing.
  const { data, error } = await admin.rpc('cancel_order_restock', {
    p_order_id: orderId,
    p_restock: restock === true,
    p_actor: me.id,
  })
  if (error || !(data as { ok?: boolean } | null)?.ok) {
    console.error('cancelOrder: rpc failed:', error?.message ?? data)
    throw new Error('Failed to cancel order')
  }

  revalidatePath('/admin/orders')
  revalidatePath(`/admin/orders/${orderId}`)
  revalidatePath('/account/orders')
  return { success: true }
}

export async function partialCancelOrderItem(orderId: string, orderItemId: string, restock: boolean) {
  const me = await requireAdmin()
  orderId = parseOrThrow(uuid, orderId, 'Invalid order')
  orderItemId = parseOrThrow(uuid, orderItemId, 'Invalid order item')

  // Lock, cancel, restock, refund maths, order totals and audit event all run in
  // one transaction in public.partial_cancel_order_item (migration 0045).
  const admin = createAdminClient()
  const { data, error } = await admin.rpc('partial_cancel_order_item', {
    p_order_id: orderId,
    p_order_item_id: orderItemId,
    p_restock: restock === true,
    p_actor: me.id,
  })
  if (error) {
    if (error.message.includes('ITEM_ALREADY_CANCELLED')) throw new Error('Item is already cancelled')
    if (error.message.includes('ORDER_ALREADY_CANCELLED')) throw new Error('Order is already cancelled')
    if (error.message.includes('NOT_FOUND')) throw new Error('Order item not found')
    console.error('partialCancelOrderItem: rpc failed:', error)
    throw new Error('Failed to cancel order item')
  }

  revalidatePath('/admin/orders')
  revalidatePath(`/admin/orders/${orderId}`)
  revalidatePath('/account/orders')
  return { success: true, refund: data }
}
