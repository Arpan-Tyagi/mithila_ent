-- 0045: atomic, idempotent partial (line-item) cancellation.
--
-- Replaces the multi-call logic in partialCancelOrderItem (src/actions/orders.ts),
-- which:
--   - selected orders.total_discount (no such column; it is discount_applied),
--     so the lookup failed and the refund block never ran;
--   - read order_items.price (the column is unit_price);
--   - restocked with read-then-write of stock_quantity (lost update);
--   - wrote item status, stock and order totals in separate, unchecked calls.
--
-- CLAUDE.md invariant 3: the whole path now runs in one transaction inside
-- PostgreSQL, rows locked with SELECT ... FOR UPDATE, stock changed with a
-- relative UPDATE, and a DB-level UNIQUE key (order_item_cancellations PK)
-- makes a second cancellation of the same line impossible.

-- ---------------------------------------------------------------------------
-- A) Refund ledger: one row per cancelled line (idempotency key + audit of the
--    amounts used for the Section 34 credit note).
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.order_item_cancellations (
  order_item_id   uuid PRIMARY KEY REFERENCES public.order_items(id) ON DELETE CASCADE,
  order_id        uuid NOT NULL REFERENCES public.orders(id) ON DELETE CASCADE,
  variant_id      uuid,
  quantity        integer NOT NULL,
  restocked       boolean NOT NULL,
  line_subtotal   numeric(10,2) NOT NULL,
  discount_share  numeric(10,2) NOT NULL,
  gst_rate        numeric(5,2) NOT NULL,
  cgst            numeric(10,2) NOT NULL,
  sgst            numeric(10,2) NOT NULL,
  igst            numeric(10,2) NOT NULL,
  tax_refund      numeric(10,2) NOT NULL,
  refund_amount   numeric(10,2) NOT NULL,
  cancelled_by    uuid,
  created_at      timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_order_item_cancellations_order_id
  ON public.order_item_cancellations (order_id);

-- Server-only table: RLS on, no policies, no API-role grants.
ALTER TABLE public.order_item_cancellations ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON public.order_item_cancellations FROM PUBLIC, anon, authenticated;
GRANT SELECT, INSERT ON public.order_item_cancellations TO service_role;

-- ---------------------------------------------------------------------------
-- B) partial_cancel_order_item
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.partial_cancel_order_item(
  p_order_id      uuid,
  p_order_item_id uuid,
  p_restock       boolean,
  p_actor         uuid DEFAULT NULL
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  -- Mirrors WAREHOUSE_STATE in src/lib/shipping.ts:5 (calculateGST).
  c_warehouse_state constant text := 'Delhi';

  v_order          record;
  v_item           record;
  v_gst            numeric;
  v_line           numeric;
  v_share          numeric;
  v_tax            numeric;
  v_cgst           numeric := 0;
  v_sgst           numeric := 0;
  v_igst           numeric := 0;
  v_refund         numeric;
  v_state          text;
  v_others_active  integer;
  v_restocked      boolean := false;
  v_rows           integer;
BEGIN
  IF p_order_id IS NULL OR p_order_item_id IS NULL OR p_restock IS NULL THEN
    RAISE EXCEPTION 'INVALID_ARGUMENT';
  END IF;

  -- 1. Lock the order, then the line (always in this order).
  SELECT o.id, o.status, o.subtotal, o.tax_amount, o.discount_applied,
         o.total_amount, o.shipping_address
    INTO v_order
    FROM public.orders o
   WHERE o.id = p_order_id
     FOR UPDATE;
  IF NOT FOUND THEN
    RAISE EXCEPTION 'ORDER_NOT_FOUND';
  END IF;

  SELECT i.id, i.variant_id, i.quantity, i.unit_price, i.status
    INTO v_item
    FROM public.order_items i
   WHERE i.id = p_order_item_id
     AND i.order_id = p_order_id
     FOR UPDATE;
  IF NOT FOUND THEN
    RAISE EXCEPTION 'ORDER_ITEM_NOT_FOUND';
  END IF;

  -- 2. Reject a line that is already cancelled or refunded (idempotency).
  IF v_item.status IN ('cancelled', 'refunded')
     OR EXISTS (SELECT 1 FROM public.order_item_cancellations c
                 WHERE c.order_item_id = p_order_item_id) THEN
    RAISE EXCEPTION 'ITEM_ALREADY_CANCELLED';
  END IF;
  IF v_order.status = 'cancelled' THEN
    RAISE EXCEPTION 'ORDER_ALREADY_CANCELLED';
  END IF;

  -- 5. Refund. Checkout (0043 create_order_atomic) charges GST on the
  --    pre-discount line (line * gst_rate / 100) and spreads one order-level
  --    discount over the subtotal, so the refund mirrors that:
  --      line - proportional share of discount_applied + GST on the line.
  --    The last active line takes whatever discount and tax remain, so the
  --    order never keeps a rounding residue.
  SELECT COALESCE(p.gst_rate, 5.00)
    INTO v_gst
    FROM public.product_variants pv
    JOIN public.products p ON p.id = pv.product_id
   WHERE pv.id = v_item.variant_id;
  v_gst := COALESCE(v_gst, 5.00);

  v_line := round(v_item.unit_price * v_item.quantity, 2);

  SELECT count(*) INTO v_others_active
    FROM public.order_items i
   WHERE i.order_id = p_order_id
     AND i.id <> p_order_item_id
     AND i.status NOT IN ('cancelled', 'refunded');

  IF v_others_active = 0 THEN
    v_share := GREATEST(v_order.discount_applied, 0);
    v_tax   := GREATEST(v_order.tax_amount, 0);
  ELSE
    IF v_order.subtotal > 0 AND v_order.discount_applied > 0 THEN
      v_share := LEAST(round(v_line * v_order.discount_applied / v_order.subtotal, 2),
                       v_order.discount_applied);
    ELSE
      v_share := 0;
    END IF;
    v_tax := LEAST(round(v_line * v_gst / 100, 2), GREATEST(v_order.tax_amount, 0));
  END IF;

  -- CGST+SGST inside the warehouse state, IGST otherwise (calculateGST).
  v_state := COALESCE(NULLIF(btrim(v_order.shipping_address ->> 'state'), ''), c_warehouse_state);
  IF lower(v_state) = lower(c_warehouse_state) THEN
    v_cgst := round(v_tax / 2, 2);
    v_sgst := v_tax - v_cgst;
  ELSE
    v_igst := v_tax;
  END IF;

  v_refund := GREATEST(v_line - v_share, 0) + v_tax;

  -- Idempotency key: the PK makes a concurrent or repeated cancel fail here.
  BEGIN
    INSERT INTO public.order_item_cancellations
      (order_item_id, order_id, variant_id, quantity, restocked, line_subtotal,
       discount_share, gst_rate, cgst, sgst, igst, tax_refund, refund_amount, cancelled_by)
    VALUES
      (p_order_item_id, p_order_id, v_item.variant_id, v_item.quantity, false, v_line,
       v_share, v_gst, v_cgst, v_sgst, v_igst, v_tax, v_refund, p_actor);
  EXCEPTION WHEN unique_violation THEN
    RAISE EXCEPTION 'ITEM_ALREADY_CANCELLED';
  END;

  -- 3. Mark the line cancelled (conditional: only from an active status).
  UPDATE public.order_items
     SET status = 'cancelled'
   WHERE id = p_order_item_id
     AND status NOT IN ('cancelled', 'refunded');
  GET DIAGNOSTICS v_rows = ROW_COUNT;
  IF v_rows <> 1 THEN
    RAISE EXCEPTION 'ITEM_ALREADY_CANCELLED';
  END IF;

  -- 4. Optional restock: relative update, no read-modify-write.
  IF p_restock AND v_item.variant_id IS NOT NULL THEN
    UPDATE public.product_variants
       SET stock_quantity = stock_quantity + v_item.quantity
     WHERE id = v_item.variant_id;
    GET DIAGNOSTICS v_rows = ROW_COUNT;
    v_restocked := (v_rows = 1);
    IF v_restocked THEN
      UPDATE public.order_item_cancellations
         SET restocked = true
       WHERE order_item_id = p_order_item_id;
    END IF;
  END IF;

  -- 6. Reduce the order totals. discount_applied and tax_amount go down with
  --    them so total = subtotal - discount + tax + shipping still holds and a
  --    later line's proportional share is computed on the remaining figures.
  UPDATE public.orders
     SET subtotal         = GREATEST(subtotal - v_line, 0),
         discount_applied = GREATEST(discount_applied - v_share, 0),
         tax_amount       = GREATEST(tax_amount - v_tax, 0),
         total_amount     = GREATEST(total_amount - v_refund, 0)
   WHERE id = p_order_id;

  -- 7. Audit trail.
  INSERT INTO public.order_events (order_id, event, note)
  VALUES (
    p_order_id,
    'order_item.cancelled',
    format('Line item %s cancelled. Refund ₹%s = line ₹%s - discount ₹%s + GST ₹%s (%s%%: CGST ₹%s, SGST ₹%s, IGST ₹%s). %s',
           p_order_item_id,
           to_char(v_refund, 'FM999999990.00'),
           to_char(v_line,   'FM999999990.00'),
           to_char(v_share,  'FM999999990.00'),
           to_char(v_tax,    'FM999999990.00'),
           to_char(v_gst,    'FM990.00'),
           to_char(v_cgst,   'FM999999990.00'),
           to_char(v_sgst,   'FM999999990.00'),
           to_char(v_igst,   'FM999999990.00'),
           CASE WHEN v_restocked THEN 'Restocked.'
                WHEN p_restock   THEN 'Restock requested but variant no longer exists.'
                ELSE 'Not restocked (shrinkage).' END)
  );

  RETURN jsonb_build_object(
    'ok', true,
    'order_item_id', p_order_item_id,
    'line_subtotal', v_line,
    'discount_share', v_share,
    'gst_rate', v_gst,
    'cgst', v_cgst,
    'sgst', v_sgst,
    'igst', v_igst,
    'tax_refund', v_tax,
    'refund_amount', v_refund,
    'restocked', v_restocked
  );
END;
$$;

REVOKE ALL ON FUNCTION public.partial_cancel_order_item(uuid, uuid, boolean, uuid)
  FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.partial_cancel_order_item(uuid, uuid, boolean, uuid)
  TO service_role;
