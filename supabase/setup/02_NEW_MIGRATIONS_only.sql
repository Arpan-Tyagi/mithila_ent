-- NEW MIGRATIONS ONLY (idempotent — safe to run on a DB that already has the app).
-- Paste into Supabase -> SQL Editor -> Run. Includes the owner-admin grant (0023).


-- ============================================================
-- 0019_order_idempotency.sql
-- ============================================================
-- Idempotent order creation: a double-submit / retry returns the SAME order
-- instead of creating a duplicate (with a duplicate stock decrement).
ALTER TABLE orders ADD COLUMN IF NOT EXISTS idempotency_key TEXT;
CREATE UNIQUE INDEX IF NOT EXISTS uq_orders_idempotency
  ON orders(user_id, idempotency_key) WHERE idempotency_key IS NOT NULL;

DROP FUNCTION IF EXISTS create_order_atomic(JSONB, JSONB, TEXT, NUMERIC, NUMERIC);

CREATE OR REPLACE FUNCTION create_order_atomic(
    p_items JSONB,
    p_shipping JSONB,
    p_discount_code TEXT DEFAULT NULL,
    p_idempotency_key TEXT DEFAULT NULL,
    p_tax_rate NUMERIC DEFAULT 0.18,
    p_shipping_amount NUMERIC DEFAULT 50
) RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_user_id UUID := auth.uid();
    v_order_id UUID;
    v_existing UUID;
    v_subtotal NUMERIC(10,2) := 0;
    v_tax NUMERIC(10,2) := 0;
    v_ship NUMERIC(10,2) := p_shipping_amount;
    v_reduce NUMERIC(10,2) := 0;
    v_total NUMERIC(10,2) := 0;
    v_item JSONB;
    v_variant_id UUID;
    v_quantity INTEGER;
    v_price NUMERIC(10,2);
    v_stock INTEGER;
    v_code TEXT;
    v_discount RECORD;
    v_discount_amount NUMERIC(10,2) := 0;
    v_discount_id UUID := NULL;
BEGIN
    IF v_user_id IS NULL THEN
        RAISE EXCEPTION 'AUTH_REQUIRED';
    END IF;
    IF p_items IS NULL OR jsonb_typeof(p_items) <> 'array' OR jsonb_array_length(p_items) = 0 THEN
        RAISE EXCEPTION 'EMPTY_CART';
    END IF;

    -- Idempotency: an already-seen key returns the original order.
    IF p_idempotency_key IS NOT NULL THEN
        SELECT id INTO v_existing FROM orders
         WHERE user_id = v_user_id AND idempotency_key = p_idempotency_key LIMIT 1;
        IF v_existing IS NOT NULL THEN
            RETURN v_existing;
        END IF;
    END IF;

    -- Create the order draft. A concurrent duplicate trips the unique index;
    -- return the winning order instead of erroring.
    BEGIN
        INSERT INTO orders (user_id, status, subtotal, tax_amount, shipping_amount, total_amount, shipping_address, idempotency_key)
        VALUES (v_user_id, 'pending', 0, 0, p_shipping_amount, 0, COALESCE(p_shipping, '{}'::jsonb), p_idempotency_key)
        RETURNING id INTO v_order_id;
    EXCEPTION WHEN unique_violation THEN
        SELECT id INTO v_existing FROM orders
         WHERE user_id = v_user_id AND idempotency_key = p_idempotency_key LIMIT 1;
        IF v_existing IS NOT NULL THEN
            RETURN v_existing;
        END IF;
        RAISE;
    END;

    FOR v_item IN SELECT * FROM jsonb_array_elements(p_items)
    LOOP
        v_variant_id := (v_item->>'variant_id')::UUID;
        v_quantity := GREATEST(COALESCE((v_item->>'quantity')::INTEGER, 0), 0);
        IF v_quantity = 0 THEN
            CONTINUE;
        END IF;

        SELECT price, stock_quantity INTO v_price, v_stock
        FROM product_variants
        WHERE id = v_variant_id
        FOR UPDATE;

        IF NOT FOUND THEN
            RAISE EXCEPTION 'VARIANT_NOT_FOUND:%', v_variant_id;
        END IF;
        IF v_stock < v_quantity THEN
            RAISE EXCEPTION 'INSUFFICIENT_STOCK:%', v_variant_id;
        END IF;

        UPDATE product_variants
        SET stock_quantity = stock_quantity - v_quantity
        WHERE id = v_variant_id;

        INSERT INTO order_items (order_id, variant_id, quantity, unit_price)
        VALUES (v_order_id, v_variant_id, v_quantity, v_price);

        v_subtotal := v_subtotal + (v_price * v_quantity);
    END LOOP;

    IF v_subtotal = 0 THEN
        RAISE EXCEPTION 'EMPTY_CART';
    END IF;

    v_tax := ROUND(v_subtotal * p_tax_rate, 2);

    v_code := NULLIF(upper(trim(COALESCE(p_discount_code, ''))), '');
    IF v_code IS NOT NULL THEN
        SELECT * INTO v_discount
        FROM discounts
        WHERE code = v_code
          AND is_active = true
          AND (starts_at IS NULL OR starts_at <= now())
          AND (ends_at IS NULL OR ends_at >= now())
          AND (max_uses IS NULL OR current_uses < max_uses)
          AND (min_order_value IS NULL OR v_subtotal >= min_order_value)
        FOR UPDATE;

        IF NOT FOUND THEN
            RAISE EXCEPTION 'INVALID_DISCOUNT';
        END IF;

        v_discount_id := v_discount.id;
        IF v_discount.type = 'percentage' THEN
            v_discount_amount := ROUND(v_subtotal * v_discount.value / 100, 2);
            v_reduce := v_discount_amount;
        ELSIF v_discount.type = 'fixed_amount' THEN
            v_discount_amount := LEAST(v_discount.value, v_subtotal);
            v_reduce := v_discount_amount;
        ELSIF v_discount.type = 'free_shipping' THEN
            v_discount_amount := v_ship;
            v_ship := 0;
            v_reduce := 0;
        END IF;

        UPDATE discounts SET current_uses = current_uses + 1 WHERE id = v_discount.id;
    END IF;

    v_total := GREATEST(v_subtotal + v_tax + v_ship - v_reduce, 0);

    UPDATE orders
    SET subtotal = v_subtotal,
        tax_amount = v_tax,
        shipping_amount = v_ship,
        discount_applied = v_discount_amount,
        applied_discount_id = v_discount_id,
        total_amount = v_total
    WHERE id = v_order_id;

    RETURN v_order_id;
END;
$$;

REVOKE ALL ON FUNCTION create_order_atomic(JSONB, JSONB, TEXT, TEXT, NUMERIC, NUMERIC) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION create_order_atomic(JSONB, JSONB, TEXT, TEXT, NUMERIC, NUMERIC) TO authenticated;


-- ============================================================
-- 0020_email_queue.sql
-- ============================================================
-- Durable email queue. Confirmation/invoice and status emails are enqueued here
-- and sent by a service-role worker (instant best-effort inline + cron retries),
-- so a transient Resend/PDF failure no longer silently loses the email.
CREATE TABLE IF NOT EXISTS pending_emails (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id UUID REFERENCES orders(id) ON DELETE CASCADE,
  recipient TEXT NOT NULL,
  kind TEXT NOT NULL,                       -- order_confirmation | order_shipped | order_delivered | order_cancelled
  payload JSONB NOT NULL DEFAULT '{}'::jsonb,
  status TEXT NOT NULL DEFAULT 'pending',   -- pending | sending | sent | failed
  attempts INT NOT NULL DEFAULT 0,
  max_attempts INT NOT NULL DEFAULT 5,
  last_error TEXT,
  next_attempt_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  sent_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_pending_emails_due
  ON pending_emails(next_attempt_at)
  WHERE status = 'pending';

ALTER TABLE pending_emails ENABLE ROW LEVEL SECURITY;
-- No policies on purpose: only the service-role worker (bypasses RLS) touches this
-- table. anon/authenticated are denied by default — no client can read recipients.
REVOKE ALL ON pending_emails FROM anon, authenticated;


-- ============================================================
-- 0021_transactional_integrity.sql
-- ============================================================
-- supabase/migrations/0020_transactional_integrity.sql

-- Justification: We use Read Committed (Postgres default) because it provides adequate consistency 
-- for row-level operations (like decrementing stock) without the severe locking overhead of Serializable, 
-- allowing the dashboard to render quickly for concurrent users.

CREATE OR REPLACE FUNCTION process_logistics_order(
  p_user_id UUID,
  p_product_id UUID,
  p_quantity INT,
  p_total_price DECIMAL
) RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- 1. Initialize Transaction block implicitly begins here
  
  -- 2. Verify constraints and execute first dependent operation (Inventory)
  UPDATE product_variants
  SET stock = stock - p_quantity
  WHERE id = p_product_id AND stock >= p_quantity;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Insufficient inventory for product %', p_product_id;
  END IF;

  -- 3. Execute second dependent operation (Order Creation)
  INSERT INTO orders (user_id, status, total_amount)
  VALUES (p_user_id, 'processing', p_total_price);

  -- 4. Explicit Commit (Implicit at end of successful PL/pgSQL block)
  RETURN true;

EXCEPTION WHEN OTHERS THEN
  -- 5. Failure Handling: Explicit Rollback and secure logging
  -- The transaction is automatically rolled back upon raising an exception
  -- We log a sanitized error (SQLSTATE) rather than the raw payload
  RAISE NOTICE 'Transaction failed and rolled back. State: %', SQLSTATE;
  RETURN false;
END;
$$;


-- ============================================================
-- 0022_product_images_storage.sql
-- ============================================================
-- Public Storage bucket for product imagery (replaces base64-in-DB).
insert into storage.buckets (id, name, public)
values ('product-images', 'product-images', true)
on conflict (id) do nothing;

-- Anyone can read product images; only admins can write/replace/delete.
-- (The app uploads via the service-role client, which bypasses RLS; these
-- policies enforce least-privilege for any anon/authenticated access too.)
drop policy if exists "product-images public read" on storage.objects;
create policy "product-images public read"
  on storage.objects for select
  using (bucket_id = 'product-images');

drop policy if exists "product-images admin write" on storage.objects;
create policy "product-images admin write"
  on storage.objects for all
  using (bucket_id = 'product-images' and public.is_admin())
  with check (bucket_id = 'product-images' and public.is_admin());


-- ============================================================
-- 0023_owner_admin.sql
-- ============================================================
-- Designate the store owner. arpantyagi88@gmail.com is always an admin:
--   (a) the new-user trigger grants admin the moment that email signs up, and
--   (b) the upsert below promotes the account if it already exists.
-- Everyone else keeps the default 'retail' role.

CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (id, full_name, role)
  VALUES (
    NEW.id,
    NEW.raw_user_meta_data->>'full_name',
    CASE WHEN lower(NEW.email) = 'arpantyagi88@gmail.com'
         THEN 'admin'::user_role ELSE 'retail'::user_role END
  )
  ON CONFLICT (id) DO UPDATE
    SET role = CASE WHEN lower(NEW.email) = 'arpantyagi88@gmail.com'
                    THEN 'admin'::user_role ELSE public.profiles.role END;
  RETURN NEW;
END;
$$;

-- Trigger already exists (migration 0012); CREATE OR REPLACE above is enough.

-- Promote the owner now if the account already exists (and create the profile
-- row if the trigger never ran for it).
INSERT INTO public.profiles (id, role)
SELECT id, 'admin'::user_role FROM auth.users WHERE lower(email) = 'arpantyagi88@gmail.com'
ON CONFLICT (id) DO UPDATE SET role = 'admin'::user_role;

