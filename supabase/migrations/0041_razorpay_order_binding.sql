-- 0041: Bind payments to our order, and take payment/stock functions away from clients.
--
-- A) orders.razorpay_order_id
--    /api/payment/razorpay/create-order now stores the Razorpay order id it
--    created for our order. /api/payment/razorpay/verify only accepts a payment
--    whose razorpay_order_id matches the stored one, and it reads the captured
--    amount from Razorpay's API instead of from our own DB. Before this, a valid
--    signature for a ₹1 Razorpay order could be replayed against any orderId.
--
-- B) Function EXECUTE grants
--    On Supabase, `REVOKE ... FROM PUBLIC` does not remove the explicit EXECUTE
--    grants that the platform's default privileges give anon and authenticated
--    on every new function in public. So record_payment (0015:166 "service_role
--    only") is in fact callable through /rest/v1/rpc/record_payment with the
--    public anon key, which marks any order as paid. Revoke explicitly by role.
--    The app calls all of these only with the service-role client:
--      record_payment               - verify route + webhooks
--      cancel_order_restock         - src/actions/orders.ts (admin client)
--      cancel_expired_pending_orders- src/app/api/cron/timeouts (admin client)
--    and these are not called by the app at all:
--      checkout_processor, process_logistics_order
--    Trigger functions are never meant to be called directly.

-- A) ------------------------------------------------------------------------------
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS razorpay_order_id text;
CREATE UNIQUE INDEX IF NOT EXISTS uq_orders_razorpay_order_id
  ON public.orders (razorpay_order_id) WHERE razorpay_order_id IS NOT NULL;

-- B) ------------------------------------------------------------------------------
REVOKE ALL ON FUNCTION public.record_payment(uuid, text, text, numeric, text, text, text, jsonb)
  FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.record_payment(uuid, text, text, numeric, text, text, text, jsonb)
  TO service_role;

REVOKE ALL ON FUNCTION public.cancel_order_restock(uuid) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.cancel_order_restock(uuid) TO service_role;

REVOKE ALL ON FUNCTION public.cancel_expired_pending_orders() FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.cancel_expired_pending_orders() TO service_role;

REVOKE ALL ON FUNCTION public.checkout_processor(uuid, uuid, jsonb, text) FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.process_logistics_order(uuid, uuid, integer, numeric) FROM PUBLIC, anon, authenticated;

REVOKE ALL ON FUNCTION public.handle_new_user() FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.log_order_event() FROM PUBLIC, anon, authenticated;

-- Customer-facing RPCs that check ownership via auth.uid(): signed-in users only.
REVOKE ALL ON FUNCTION public.log_payment_intent(uuid) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.log_payment_intent(uuid) TO authenticated, service_role;
REVOKE ALL ON FUNCTION public.request_order_cancellation(uuid) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.request_order_cancellation(uuid) TO authenticated, service_role;
