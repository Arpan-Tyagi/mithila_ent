-- FULL DATABASE SETUP for a FRESH Supabase project.
-- Paste the entire file into Supabase -> SQL Editor -> Run.
-- Safe order: all migrations 0000 -> 0023 concatenated.


-- ============================================================
-- 0000_initial_schema.sql
-- ============================================================
-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ENUMS
CREATE TYPE user_role AS ENUM ('admin', 'retail');
CREATE TYPE product_status AS ENUM ('draft', 'active', 'archived');
CREATE TYPE discount_type AS ENUM ('percentage', 'fixed_amount', 'free_shipping');
CREATE TYPE discount_target AS ENUM ('all', 'category', 'product');
CREATE TYPE order_status AS ENUM ('pending', 'paid', 'shipped', 'delivered', 'cancelled');

-- USERS (Extends auth.users)
-- Note: auth.users is handled by Supabase. We link our profiles to it.
CREATE TABLE profiles (
    id UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
    full_name TEXT,
    phone TEXT,
    saved_addresses JSONB DEFAULT '[]'::jsonb,
    role user_role DEFAULT 'retail',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- CATEGORIES
CREATE TABLE categories (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    slug TEXT UNIQUE NOT NULL,
    name TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- PRODUCTS
CREATE TABLE products (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    category_id UUID REFERENCES categories(id) ON DELETE SET NULL,
    slug TEXT UNIQUE NOT NULL,
    title TEXT NOT NULL,
    description TEXT,
    weave TEXT,
    gsm INTEGER,
    is_featured BOOLEAN DEFAULT false,
    tags TEXT[] DEFAULT '{}',
    status product_status DEFAULT 'draft',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- PRODUCT VARIANTS
CREATE TABLE product_variants (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    product_id UUID REFERENCES products(id) ON DELETE CASCADE NOT NULL,
    sku TEXT UNIQUE NOT NULL,
    color TEXT NOT NULL,
    price DECIMAL(10,2) NOT NULL,
    stock_quantity INTEGER NOT NULL DEFAULT 0,
    images TEXT[] DEFAULT '{}',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- CARTS
CREATE TABLE carts (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    session_id TEXT UNIQUE,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- CART ITEMS
CREATE TABLE cart_items (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    cart_id UUID REFERENCES carts(id) ON DELETE CASCADE NOT NULL,
    variant_id UUID REFERENCES product_variants(id) ON DELETE CASCADE NOT NULL,
    quantity INTEGER NOT NULL DEFAULT 1,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    UNIQUE(cart_id, variant_id)
);

-- DISCOUNTS
CREATE TABLE discounts (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    code TEXT UNIQUE,
    type discount_type NOT NULL,
    value DECIMAL(10,2) NOT NULL,
    target_type discount_target NOT NULL DEFAULT 'all',
    target_ids UUID[] DEFAULT '{}',
    min_order_value DECIMAL(10,2),
    max_uses INTEGER,
    current_uses INTEGER DEFAULT 0,
    max_uses_per_user INTEGER DEFAULT 1,
    is_active BOOLEAN DEFAULT true,
    starts_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    ends_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- ORDERS
CREATE TABLE orders (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    status order_status DEFAULT 'pending',
    tracking_status TEXT,
    subtotal DECIMAL(10,2) NOT NULL,
    tax_amount DECIMAL(10,2) NOT NULL DEFAULT 0,
    shipping_amount DECIMAL(10,2) NOT NULL DEFAULT 0,
    discount_applied DECIMAL(10,2) NOT NULL DEFAULT 0,
    applied_discount_id UUID REFERENCES discounts(id) ON DELETE SET NULL,
    total_amount DECIMAL(10,2) NOT NULL,
    shipping_address JSONB NOT NULL,
    payment_intent_id TEXT,
    is_paid BOOLEAN DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- ORDER ITEMS
CREATE TABLE order_items (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    order_id UUID REFERENCES orders(id) ON DELETE CASCADE NOT NULL,
    variant_id UUID REFERENCES product_variants(id) ON DELETE SET NULL,
    quantity INTEGER NOT NULL,
    unit_price DECIMAL(10,2) NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- RLS POLICIES (Strict Row Level Security)
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE products ENABLE ROW LEVEL SECURITY;
ALTER TABLE product_variants ENABLE ROW LEVEL SECURITY;
ALTER TABLE carts ENABLE ROW LEVEL SECURITY;
ALTER TABLE cart_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE discounts ENABLE ROW LEVEL SECURITY;
ALTER TABLE orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE order_items ENABLE ROW LEVEL SECURITY;

-- Helper to check if user is admin
CREATE OR REPLACE FUNCTION is_admin() RETURNS BOOLEAN AS $$
  SELECT EXISTS (
    SELECT 1 FROM profiles 
    WHERE id = auth.uid() AND role = 'admin'
  );
$$ LANGUAGE sql SECURITY DEFINER;

-- Profiles: Users can read/update own. Admins can read all.
CREATE POLICY "Users view own profile" ON profiles FOR SELECT USING (auth.uid() = id OR is_admin());
CREATE POLICY "Users update own profile" ON profiles FOR UPDATE USING (auth.uid() = id);

-- Categories/Products/Variants: Public read, Admin write
CREATE POLICY "Public read categories" ON categories FOR SELECT USING (true);
CREATE POLICY "Admin write categories" ON categories FOR ALL USING (is_admin());

CREATE POLICY "Public read products" ON products FOR SELECT USING (status = 'active' OR is_admin());
CREATE POLICY "Admin write products" ON products FOR ALL USING (is_admin());

CREATE POLICY "Public read variants" ON product_variants FOR SELECT USING (true);
CREATE POLICY "Admin write variants" ON product_variants FOR ALL USING (is_admin());

-- Carts/Cart Items: Users view own cart, session_id for guests.
CREATE POLICY "Users/Guests view own cart" ON carts FOR SELECT USING (auth.uid() = user_id OR session_id = current_setting('request.jwt.claims', true)::json->>'session_id');
CREATE POLICY "Users/Guests insert own cart" ON carts FOR INSERT WITH CHECK (auth.uid() = user_id OR session_id = current_setting('request.jwt.claims', true)::json->>'session_id');
CREATE POLICY "Users/Guests update own cart" ON carts FOR UPDATE USING (auth.uid() = user_id OR session_id = current_setting('request.jwt.claims', true)::json->>'session_id');

CREATE POLICY "Users/Guests view own cart items" ON cart_items FOR SELECT USING (cart_id IN (SELECT id FROM carts WHERE auth.uid() = user_id OR session_id = current_setting('request.jwt.claims', true)::json->>'session_id'));
CREATE POLICY "Users/Guests insert own cart items" ON cart_items FOR INSERT WITH CHECK (cart_id IN (SELECT id FROM carts WHERE auth.uid() = user_id OR session_id = current_setting('request.jwt.claims', true)::json->>'session_id'));
CREATE POLICY "Users/Guests update own cart items" ON cart_items FOR UPDATE USING (cart_id IN (SELECT id FROM carts WHERE auth.uid() = user_id OR session_id = current_setting('request.jwt.claims', true)::json->>'session_id'));
CREATE POLICY "Users/Guests delete own cart items" ON cart_items FOR DELETE USING (cart_id IN (SELECT id FROM carts WHERE auth.uid() = user_id OR session_id = current_setting('request.jwt.claims', true)::json->>'session_id'));

-- Orders: Users view own, Admin views all
CREATE POLICY "Users view own orders" ON orders FOR SELECT USING (auth.uid() = user_id OR is_admin());
CREATE POLICY "Users insert own orders" ON orders FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Admin update orders" ON orders FOR UPDATE USING (is_admin());

CREATE POLICY "Users view own order items" ON order_items FOR SELECT USING (order_id IN (SELECT id FROM orders WHERE auth.uid() = user_id) OR is_admin());
CREATE POLICY "Users insert own order items" ON order_items FOR INSERT WITH CHECK (order_id IN (SELECT id FROM orders WHERE auth.uid() = user_id));

-- Realtime Replica Identity
ALTER TABLE product_variants REPLICA IDENTITY FULL;


-- ============================================================
-- 0001_checkout_processor.sql
-- ============================================================
-- supabase/migrations/0001_checkout_processor.sql
CREATE OR REPLACE FUNCTION checkout_processor(
    p_user_id UUID,
    p_cart_id UUID,
    p_shipping_address JSONB,
    p_payment_intent_id TEXT
) RETURNS UUID AS $$
DECLARE
    v_order_id UUID;
    v_subtotal DECIMAL(10,2) := 0;
    v_total DECIMAL(10,2) := 0;
    v_item RECORD;
BEGIN
    -- 1. Create Order Draft
    INSERT INTO orders (user_id, status, subtotal, total_amount, shipping_address, payment_intent_id)
    VALUES (p_user_id, 'pending', 0, 0, p_shipping_address, p_payment_intent_id)
    RETURNING id INTO v_order_id;

    -- 2. Move items from cart to order and calculate totals
    FOR v_item IN (SELECT ci.variant_id, ci.quantity, pv.price 
                   FROM cart_items ci 
                   JOIN product_variants pv ON ci.variant_id = pv.id 
                   WHERE ci.cart_id = p_cart_id) 
    LOOP
        -- Check stock
        IF (SELECT stock_quantity FROM product_variants WHERE id = v_item.variant_id) < v_item.quantity THEN
            RAISE EXCEPTION 'Insufficient stock for variant %', v_item.variant_id;
        END IF;

        -- Deduct stock
        UPDATE product_variants 
        SET stock_quantity = stock_quantity - v_item.quantity 
        WHERE id = v_item.variant_id;

        -- Add to order items
        INSERT INTO order_items (order_id, variant_id, quantity, unit_price)
        VALUES (v_order_id, v_item.variant_id, v_item.quantity, v_item.price);

        v_subtotal := v_subtotal + (v_item.price * v_item.quantity);
    END LOOP;

    -- 3. Update Order Total
    UPDATE orders 
    SET subtotal = v_subtotal, total_amount = v_subtotal 
    WHERE id = v_order_id;

    -- 4. Clear Cart
    DELETE FROM cart_items WHERE cart_id = p_cart_id;

    RETURN v_order_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;


-- ============================================================
-- 0002_add_product_details.sql
-- ============================================================
-- Add technical detail columns to the products table
ALTER TABLE products 
ADD COLUMN width TEXT DEFAULT '54 inches / 137 cm',
ADD COLUMN stretch TEXT DEFAULT '0% Mechanical Stretch',
ADD COLUMN origin TEXT DEFAULT 'Mithila Artisanal Cluster, India',
ADD COLUMN best_suited_for TEXT[] DEFAULT ARRAY['Tailored overcoats', 'Unlined summer blazers', 'Dense upholstery'];


-- ============================================================
-- 0003_seed_categories.sql
-- ============================================================
-- Seed script to populate all core fabric categories
INSERT INTO categories (name, slug) VALUES 
('Pure Linen', 'linen'),
('Woven Cotton', 'cotton'),
('Fluid Viscose', 'viscose'),
('Brushed Flannel', 'flannel'),
('Wale Corduroy', 'corduroy'),
('Diagonal Twill', 'twill'),
('Faux Suede', 'suede'),
('Pile Velvet', 'velvet'),
('Virgin Wool', 'wool'),
('Thermal Fleece', 'fleece'),
('Heritage Tweed', 'tweed')
ON CONFLICT (slug) DO NOTHING;


-- ============================================================
-- 0004_auth_attempts.sql
-- ============================================================
-- AUTH ATTEMPTS
CREATE TABLE auth_attempts (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    email TEXT NOT NULL,
    attempts INTEGER DEFAULT 1,
    last_attempt TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    locked_until TIMESTAMP WITH TIME ZONE
);

CREATE INDEX idx_auth_attempts_email ON auth_attempts(email);


-- ============================================================
-- 0005_auth_attempts_rls.sql
-- ============================================================
ALTER TABLE auth_attempts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow public insert and update on auth_attempts" 
ON auth_attempts FOR ALL USING (true) WITH CHECK (true);


-- ============================================================
-- 0006_atomic_inventory.sql
-- ============================================================
-- Atomic Inventory Deduction to prevent Race Conditions
CREATE OR REPLACE FUNCTION decrement_inventory_atomic(variant_id UUID, quantity_to_deduct INTEGER)
RETURNS BOOLEAN
LANGUAGE plpgsql
AS $$
DECLARE
  current_stock INTEGER;
BEGIN
  -- Lock the row for update
  SELECT stock_quantity INTO current_stock
  FROM product_variants
  WHERE id = variant_id
  FOR UPDATE;

  -- Check if enough stock exists
  IF current_stock >= quantity_to_deduct THEN
    -- Deduct
    UPDATE product_variants
    SET stock_quantity = stock_quantity - quantity_to_deduct
    WHERE id = variant_id;
    
    RETURN TRUE;
  ELSE
    RETURN FALSE;
  END IF;
END;
$$;


-- ============================================================
-- 0007_create_order_atomic.sql
-- ============================================================
-- Atomic order creation from a client-side (Zustand) cart.
--
-- The cart lives in the browser, not in the `cart_items` table, so the items are
-- passed in as JSONB: [{ "variant_id": "<uuid>", "quantity": 2 }, ...].
--
-- SECURITY DEFINER is required because `product_variants` is admin-write under RLS
-- (see 0000_initial_schema.sql), so a retail customer cannot deduct stock directly.
-- The function is still safe because it:
--   * derives the buyer from auth.uid() (the client cannot spoof another user),
--   * reads price + stock from the DB (never trusts client-supplied prices),
--   * locks each variant row FOR UPDATE to prevent overselling under concurrency,
--   * runs as a single transaction, so any failure rolls back the whole order
--     (no partial inventory deduction, no orphaned order rows).

CREATE OR REPLACE FUNCTION create_order_atomic(
    p_items JSONB,
    p_shipping JSONB,
    p_tax_rate NUMERIC DEFAULT 0.18,
    p_shipping_amount NUMERIC DEFAULT 50
) RETURNS UUID AS $$
DECLARE
    v_user_id UUID := auth.uid();
    v_order_id UUID;
    v_subtotal NUMERIC(10,2) := 0;
    v_tax NUMERIC(10,2) := 0;
    v_total NUMERIC(10,2) := 0;
    v_item JSONB;
    v_variant_id UUID;
    v_quantity INTEGER;
    v_price NUMERIC(10,2);
    v_stock INTEGER;
BEGIN
    IF v_user_id IS NULL THEN
        RAISE EXCEPTION 'AUTH_REQUIRED';
    END IF;

    IF p_items IS NULL OR jsonb_typeof(p_items) <> 'array' OR jsonb_array_length(p_items) = 0 THEN
        RAISE EXCEPTION 'EMPTY_CART';
    END IF;

    -- 1. Create the order draft (totals are filled in after pricing the items).
    INSERT INTO orders (user_id, status, subtotal, tax_amount, shipping_amount, total_amount, shipping_address)
    VALUES (v_user_id, 'pending', 0, 0, p_shipping_amount, 0, COALESCE(p_shipping, '{}'::jsonb))
    RETURNING id INTO v_order_id;

    -- 2. Price each item against the DB, lock its row, validate stock, deduct, record it.
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

    -- 3. Finalize totals (tax + flat shipping).
    v_tax := ROUND(v_subtotal * p_tax_rate, 2);
    v_total := v_subtotal + v_tax + p_shipping_amount;

    UPDATE orders
    SET subtotal = v_subtotal, tax_amount = v_tax, total_amount = v_total
    WHERE id = v_order_id;

    RETURN v_order_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Only signed-in users may create orders; anon is rejected.
REVOKE ALL ON FUNCTION create_order_atomic(JSONB, JSONB, NUMERIC, NUMERIC) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION create_order_atomic(JSONB, JSONB, NUMERIC, NUMERIC) TO authenticated;


-- ============================================================
-- 0008_discounts_rls.sql
-- ============================================================
-- RLS policies for the discounts table.
--
-- 0000_initial_schema.sql enabled RLS on `discounts` but never defined any
-- policy, so the default-deny applied and NOBODY (not even admins) could read
-- or write discounts. This restores the intended behaviour:
--   * admins have full control (create / edit / delete),
--   * active discount codes are publicly readable so checkout can validate them.

DROP POLICY IF EXISTS "Admin manage discounts" ON discounts;
DROP POLICY IF EXISTS "Public read active discounts" ON discounts;

CREATE POLICY "Admin manage discounts" ON discounts
  FOR ALL USING (is_admin()) WITH CHECK (is_admin());

CREATE POLICY "Public read active discounts" ON discounts
  FOR SELECT USING (is_active = true);


-- ============================================================
-- 0009_store_settings.sql
-- ============================================================
-- Persistent store settings (singleton row).
-- A single-row table keyed by a boolean PK so there is always exactly one row.

CREATE TABLE IF NOT EXISTS store_settings (
  id BOOLEAN PRIMARY KEY DEFAULT true,
  store_name TEXT NOT NULL DEFAULT 'Mithila Enterprises',
  support_email TEXT NOT NULL DEFAULT 'support@mithilaenterprises.com',
  support_phone TEXT,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  CONSTRAINT store_settings_singleton CHECK (id)
);

-- Seed the singleton row.
INSERT INTO store_settings (id) VALUES (true) ON CONFLICT (id) DO NOTHING;

ALTER TABLE store_settings ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Public read settings" ON store_settings;
DROP POLICY IF EXISTS "Admin manage settings" ON store_settings;

-- Store name / contact are public (used by the storefront); only admins can edit.
CREATE POLICY "Public read settings" ON store_settings
  FOR SELECT USING (true);

CREATE POLICY "Admin manage settings" ON store_settings
  FOR ALL USING (is_admin()) WITH CHECK (is_admin());


-- ============================================================
-- 0010_order_discounts.sql
-- ============================================================
-- Discount-aware atomic order creation (supersedes 0007).
-- Adds optional p_discount_code: validated + applied inside the same transaction,
-- recording discount_applied / applied_discount_id and incrementing the coupon's usage.

DROP FUNCTION IF EXISTS create_order_atomic(JSONB, JSONB, NUMERIC, NUMERIC);

CREATE OR REPLACE FUNCTION create_order_atomic(
    p_items JSONB,
    p_shipping JSONB,
    p_discount_code TEXT DEFAULT NULL,
    p_tax_rate NUMERIC DEFAULT 0.18,
    p_shipping_amount NUMERIC DEFAULT 50
) RETURNS UUID AS $$
DECLARE
    v_user_id UUID := auth.uid();
    v_order_id UUID;
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

    INSERT INTO orders (user_id, status, subtotal, tax_amount, shipping_amount, total_amount, shipping_address)
    VALUES (v_user_id, 'pending', 0, 0, p_shipping_amount, 0, COALESCE(p_shipping, '{}'::jsonb))
    RETURNING id INTO v_order_id;

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
$$ LANGUAGE plpgsql SECURITY DEFINER;

REVOKE ALL ON FUNCTION create_order_atomic(JSONB, JSONB, TEXT, NUMERIC, NUMERIC) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION create_order_atomic(JSONB, JSONB, TEXT, NUMERIC, NUMERIC) TO authenticated;


-- ============================================================
-- 0011_performance_indexes.sql
-- ============================================================
-- Performance indexes.
-- Postgres does NOT auto-index foreign keys; these back the joins, filters and
-- ORDER BYs the app actually runs (shop, product pages, account/admin orders,
-- dashboard KPIs).

-- Product catalog
CREATE INDEX IF NOT EXISTS idx_products_category_id ON products(category_id);
CREATE INDEX IF NOT EXISTS idx_products_status ON products(status);
CREATE INDEX IF NOT EXISTS idx_product_variants_product_id ON product_variants(product_id);

-- Orders & items
CREATE INDEX IF NOT EXISTS idx_orders_user_id ON orders(user_id);
CREATE INDEX IF NOT EXISTS idx_orders_status ON orders(status);
CREATE INDEX IF NOT EXISTS idx_orders_created_at ON orders(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_orders_applied_discount_id ON orders(applied_discount_id);
CREATE INDEX IF NOT EXISTS idx_order_items_order_id ON order_items(order_id);
CREATE INDEX IF NOT EXISTS idx_order_items_variant_id ON order_items(variant_id);

-- Carts (server-side cart tables)
CREATE INDEX IF NOT EXISTS idx_carts_user_id ON carts(user_id);
CREATE INDEX IF NOT EXISTS idx_cart_items_cart_id ON cart_items(cart_id);
CREATE INDEX IF NOT EXISTS idx_cart_items_variant_id ON cart_items(variant_id);


-- ============================================================
-- 0012_security_hardening.sql
-- ============================================================
-- Security hardening.

-- 1) Auto-create a profile row for every new auth user, and backfill existing
--    ones. Without this, profiles stay empty: role lookups fail and admins
--    cannot see customer names on orders.
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (id, full_name)
  VALUES (NEW.id, NEW.raw_user_meta_data->>'full_name')
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION handle_new_user();

INSERT INTO public.profiles (id)
SELECT id FROM auth.users
ON CONFLICT (id) DO NOTHING;

-- 2) Let admins read all profiles (is_admin() is SECURITY DEFINER, so no RLS
--    recursion). Combined with the existing "own profile" policy.
DROP POLICY IF EXISTS "Admins read all profiles" ON profiles;
CREATE POLICY "Admins read all profiles" ON profiles
  FOR SELECT USING (is_admin());

-- 3) Pin search_path on SECURITY DEFINER functions (prevents search_path
--    hijacking). Wrapped so a missing function never fails the migration.
DO $$ BEGIN
  ALTER FUNCTION create_order_atomic(jsonb, jsonb, text, numeric, numeric) SET search_path = public;
EXCEPTION WHEN undefined_function THEN NULL; END $$;

DO $$ BEGIN
  ALTER FUNCTION decrement_inventory_atomic(uuid, integer) SET search_path = public;
EXCEPTION WHEN undefined_function THEN NULL; END $$;

DO $$ BEGIN
  ALTER FUNCTION checkout_processor(uuid, uuid, jsonb, text) SET search_path = public;
EXCEPTION WHEN undefined_function THEN NULL; END $$;

-- 4) Stop discount-code enumeration. The previous "public read active discounts"
--    policy let anyone SELECT every active coupon. Remove it and validate codes
--    through a SECURITY DEFINER function that only ever reveals the one code asked for.
DROP POLICY IF EXISTS "Public read active discounts" ON discounts;

CREATE OR REPLACE FUNCTION validate_discount(p_code TEXT, p_subtotal NUMERIC)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_code TEXT := NULLIF(upper(trim(COALESCE(p_code, ''))), '');
  d RECORD;
  v_amount NUMERIC(10,2) := 0;
BEGIN
  IF v_code IS NULL THEN
    RETURN jsonb_build_object('valid', false, 'error', 'Enter a discount code.');
  END IF;

  SELECT * INTO d FROM discounts
   WHERE code = v_code
     AND is_active = true
     AND (starts_at IS NULL OR starts_at <= now())
     AND (ends_at IS NULL OR ends_at >= now())
     AND (max_uses IS NULL OR current_uses < max_uses);

  IF NOT FOUND THEN
    RETURN jsonb_build_object('valid', false, 'error', 'Invalid or inactive code.');
  END IF;

  IF d.min_order_value IS NOT NULL AND p_subtotal < d.min_order_value THEN
    RETURN jsonb_build_object('valid', false, 'error',
      'Requires a minimum order of ₹' || floor(d.min_order_value)::text || '.');
  END IF;

  IF d.type = 'percentage' THEN
    v_amount := round(p_subtotal * d.value / 100, 2);
  ELSIF d.type = 'fixed_amount' THEN
    v_amount := LEAST(d.value, p_subtotal);
  ELSIF d.type = 'free_shipping' THEN
    v_amount := 50;
  END IF;

  RETURN jsonb_build_object(
    'valid', true,
    'code', v_code,
    'type', d.type,
    'value', d.value,
    'discountAmount', v_amount
  );
END;
$$;

REVOKE ALL ON FUNCTION validate_discount(TEXT, NUMERIC) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION validate_discount(TEXT, NUMERIC) TO anon, authenticated;


-- ============================================================
-- 0013_auth_attempts_hardening.sql
-- ============================================================
-- Lock down auth_attempts.
-- The login flow is unauthenticated, so the table previously had a fully public
-- RLS policy (anyone could read/alter every row). Replace that with SECURITY
-- DEFINER functions: the table becomes default-deny for direct access, and the
-- login action only ever touches it through these vetted functions.

DROP POLICY IF EXISTS "Allow public insert and update on auth_attempts" ON auth_attempts;
-- RLS stays ENABLED with no policies => no direct client access.

-- Is this email currently locked out?
CREATE OR REPLACE FUNCTION auth_attempt_is_locked(p_email TEXT)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_locked_until TIMESTAMPTZ;
BEGIN
  SELECT locked_until INTO v_locked_until
  FROM auth_attempts
  WHERE email = lower(trim(p_email))
  ORDER BY last_attempt DESC
  LIMIT 1;

  RETURN v_locked_until IS NOT NULL AND v_locked_until > now();
END;
$$;

-- Record a failed attempt; lock for p_lock_minutes once attempts reach p_max.
-- Returns { attempts, locked, justLocked } so the caller can send one alert email.
CREATE OR REPLACE FUNCTION auth_attempt_record_failure(
  p_email TEXT,
  p_max INTEGER DEFAULT 5,
  p_lock_minutes INTEGER DEFAULT 15
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_email TEXT := lower(trim(p_email));
  v_id UUID;
  v_attempts INTEGER;
  v_locked BOOLEAN := false;
  v_just_locked BOOLEAN := false;
BEGIN
  SELECT id, attempts INTO v_id, v_attempts
  FROM auth_attempts
  WHERE email = v_email
  ORDER BY last_attempt DESC
  LIMIT 1;

  IF v_id IS NULL THEN
    INSERT INTO auth_attempts (email, attempts, last_attempt)
    VALUES (v_email, 1, now());
    v_attempts := 1;
  ELSE
    v_attempts := v_attempts + 1;
    UPDATE auth_attempts SET attempts = v_attempts, last_attempt = now() WHERE id = v_id;
  END IF;

  IF v_attempts >= p_max THEN
    v_locked := true;
    v_just_locked := (v_attempts = p_max);
    UPDATE auth_attempts
       SET locked_until = now() + make_interval(mins => p_lock_minutes)
     WHERE id = v_id;
  END IF;

  RETURN jsonb_build_object('attempts', v_attempts, 'locked', v_locked, 'justLocked', v_just_locked);
END;
$$;

-- Clear the failure counter on a successful login.
CREATE OR REPLACE FUNCTION auth_attempt_clear(p_email TEXT)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  DELETE FROM auth_attempts WHERE email = lower(trim(p_email));
END;
$$;

REVOKE ALL ON FUNCTION auth_attempt_is_locked(TEXT) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION auth_attempt_is_locked(TEXT) TO anon, authenticated;
REVOKE ALL ON FUNCTION auth_attempt_record_failure(TEXT, INTEGER, INTEGER) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION auth_attempt_record_failure(TEXT, INTEGER, INTEGER) TO anon, authenticated;
REVOKE ALL ON FUNCTION auth_attempt_clear(TEXT) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION auth_attempt_clear(TEXT) TO anon, authenticated;


-- ============================================================
-- 0014_products_add_count_construction.sql
-- ============================================================
-- Add the two product spec columns the app already collects (admin new-product
-- form + AI extractor) and displays (product detail page), but which were never
-- in the schema. Without them, count/construction were silently dropped.

ALTER TABLE products
  ADD COLUMN IF NOT EXISTS count TEXT,
  ADD COLUMN IF NOT EXISTS construction TEXT;


-- ============================================================
-- 0015_payments_and_audit.sql
-- ============================================================
-- Payments + order audit log: every order lifecycle change and every payment is
-- recorded in the database.

-- Payment lifecycle status.
DO $$ BEGIN
  CREATE TYPE payment_status AS ENUM ('created', 'authorized', 'captured', 'failed', 'refunded');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- Append-only payment audit trail.
CREATE TABLE IF NOT EXISTS payments (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  order_id UUID REFERENCES orders(id) ON DELETE CASCADE NOT NULL,
  provider TEXT NOT NULL DEFAULT 'pending',
  provider_payment_id TEXT,
  amount DECIMAL(10,2) NOT NULL,
  currency TEXT NOT NULL DEFAULT 'INR',
  status payment_status NOT NULL DEFAULT 'created',
  method TEXT,
  raw JSONB,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_payments_order_id ON payments(order_id);
CREATE INDEX IF NOT EXISTS idx_payments_provider_payment_id ON payments(provider_payment_id);

ALTER TABLE payments ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Users view own payments" ON payments;
CREATE POLICY "Users view own payments" ON payments
  FOR SELECT USING (
    order_id IN (SELECT id FROM orders WHERE auth.uid() = user_id) OR is_admin()
  );
-- No INSERT/UPDATE policy: payments are written only by SECURITY DEFINER functions.

-- Order lifecycle audit log.
CREATE TABLE IF NOT EXISTS order_events (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  order_id UUID REFERENCES orders(id) ON DELETE CASCADE NOT NULL,
  event TEXT NOT NULL,
  from_status TEXT,
  to_status TEXT,
  note TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_order_events_order_id ON order_events(order_id);

ALTER TABLE order_events ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Users view own order events" ON order_events;
CREATE POLICY "Users view own order events" ON order_events
  FOR SELECT USING (
    order_id IN (SELECT id FROM orders WHERE auth.uid() = user_id) OR is_admin()
  );

-- Auto-log order creation, status changes, payment flag and tracking updates.
CREATE OR REPLACE FUNCTION log_order_event()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    INSERT INTO order_events (order_id, event, to_status, note)
    VALUES (NEW.id, 'order.created', NEW.status::text, 'Order placed');
  ELSIF TG_OP = 'UPDATE' THEN
    IF NEW.status IS DISTINCT FROM OLD.status THEN
      INSERT INTO order_events (order_id, event, from_status, to_status)
      VALUES (NEW.id, 'order.status_changed', OLD.status::text, NEW.status::text);
    END IF;
    IF NEW.is_paid IS DISTINCT FROM OLD.is_paid AND NEW.is_paid THEN
      INSERT INTO order_events (order_id, event, to_status, note)
      VALUES (NEW.id, 'order.paid', NEW.status::text, 'Payment captured');
    END IF;
    IF NEW.tracking_status IS DISTINCT FROM OLD.tracking_status AND NEW.tracking_status IS NOT NULL THEN
      INSERT INTO order_events (order_id, event, note)
      VALUES (NEW.id, 'order.tracking_updated', 'Tracking: ' || NEW.tracking_status);
    END IF;
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_log_order_event ON orders;
CREATE TRIGGER trg_log_order_event
  AFTER INSERT OR UPDATE ON orders
  FOR EACH ROW EXECUTE FUNCTION log_order_event();

-- Log a payment "intent" for an order the caller owns (called right after checkout).
CREATE OR REPLACE FUNCTION log_payment_intent(p_order_id UUID)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_user_id UUID := auth.uid();
  v_total NUMERIC(10,2);
  v_owner UUID;
  v_payment_id UUID;
BEGIN
  SELECT total_amount, user_id INTO v_total, v_owner FROM orders WHERE id = p_order_id;
  IF NOT FOUND THEN RAISE EXCEPTION 'ORDER_NOT_FOUND'; END IF;
  IF v_owner IS DISTINCT FROM v_user_id THEN RAISE EXCEPTION 'FORBIDDEN'; END IF;

  SELECT id INTO v_payment_id FROM payments
   WHERE order_id = p_order_id AND status = 'created' LIMIT 1;
  IF FOUND THEN
    RETURN v_payment_id;
  END IF;

  INSERT INTO payments (order_id, provider, amount, currency, status)
  VALUES (p_order_id, 'pending', v_total, 'INR', 'created')
  RETURNING id INTO v_payment_id;

  RETURN v_payment_id;
END;
$$;

REVOKE ALL ON FUNCTION log_payment_intent(UUID) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION log_payment_intent(UUID) TO authenticated;

-- Record a payment result (called from the payment-gateway webhook). Marks the
-- order paid on capture. Server-side only.
CREATE OR REPLACE FUNCTION record_payment(
  p_order_id UUID,
  p_provider TEXT,
  p_provider_payment_id TEXT,
  p_amount NUMERIC,
  p_status TEXT DEFAULT 'captured',
  p_method TEXT DEFAULT NULL,
  p_currency TEXT DEFAULT 'INR',
  p_raw JSONB DEFAULT NULL
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_payment_id UUID;
BEGIN
  IF NOT EXISTS (SELECT 1 FROM orders WHERE id = p_order_id) THEN
    RAISE EXCEPTION 'ORDER_NOT_FOUND';
  END IF;

  INSERT INTO payments (order_id, provider, provider_payment_id, amount, currency, status, method, raw)
  VALUES (p_order_id, p_provider, p_provider_payment_id, p_amount, p_currency, p_status::payment_status, p_method, p_raw)
  RETURNING id INTO v_payment_id;

  IF p_status = 'captured' THEN
    UPDATE orders
       SET is_paid = true,
           status = CASE WHEN status = 'pending' THEN 'paid'::order_status ELSE status END,
           payment_intent_id = COALESCE(p_provider_payment_id, payment_intent_id)
     WHERE id = p_order_id;
  ELSIF p_status = 'failed' THEN
    INSERT INTO order_events (order_id, event, note)
    VALUES (p_order_id, 'payment.failed', COALESCE(p_provider, 'gateway') || ' payment failed');
  ELSIF p_status = 'refunded' THEN
    INSERT INTO order_events (order_id, event, note)
    VALUES (p_order_id, 'payment.refunded', 'Payment refunded');
  END IF;

  RETURN v_payment_id;
END;
$$;

REVOKE ALL ON FUNCTION record_payment(UUID, TEXT, TEXT, NUMERIC, TEXT, TEXT, TEXT, JSONB) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION record_payment(UUID, TEXT, TEXT, NUMERIC, TEXT, TEXT, TEXT, JSONB) TO service_role;


-- ============================================================
-- 0016_cms_content.sql
-- ============================================================
-- CMS: editable site content + featured categories.

-- Featured flag for categories (admin can highlight collections).
ALTER TABLE categories ADD COLUMN IF NOT EXISTS is_featured BOOLEAN DEFAULT false;

-- Editable content blocks: legal pages, about, homepage hero, announcement bar.
CREATE TABLE IF NOT EXISTS site_content (
  key TEXT PRIMARY KEY,
  title TEXT,
  body TEXT,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

ALTER TABLE site_content ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Public read site content" ON site_content;
DROP POLICY IF EXISTS "Admin manage site content" ON site_content;
CREATE POLICY "Public read site content" ON site_content FOR SELECT USING (true);
CREATE POLICY "Admin manage site content" ON site_content FOR ALL USING (is_admin()) WITH CHECK (is_admin());

-- Seed the editable blocks (empty body => storefront falls back to built-in copy).
INSERT INTO site_content (key, title, body) VALUES
  ('legal_privacy-policy', 'Privacy Policy', ''),
  ('legal_terms-of-service', 'Terms of Service', ''),
  ('legal_shipping-returns', 'Shipping & Returns', ''),
  ('about_intro', '', ''),
  ('home_hero', '', ''),
  ('announcement', '', '')
ON CONFLICT (key) DO NOTHING;


-- ============================================================
-- 0017_order_cancellation.sql
-- ============================================================
-- Order cancellation: customer requests, admin cancels + restocks inventory.
ALTER TABLE orders ADD COLUMN IF NOT EXISTS cancellation_requested BOOLEAN DEFAULT false;

-- Customer requests cancellation of their OWN order (only while pending/paid).
CREATE OR REPLACE FUNCTION request_order_cancellation(p_order_id UUID)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_uid UUID := auth.uid();
  o RECORD;
BEGIN
  IF v_uid IS NULL THEN
    RETURN jsonb_build_object('ok', false, 'error', 'AUTH_REQUIRED');
  END IF;

  SELECT id, user_id, status, cancellation_requested INTO o FROM orders WHERE id = p_order_id;
  IF NOT FOUND THEN
    RETURN jsonb_build_object('ok', false, 'error', 'NOT_FOUND');
  END IF;
  IF o.user_id IS DISTINCT FROM v_uid THEN
    RETURN jsonb_build_object('ok', false, 'error', 'FORBIDDEN');
  END IF;
  IF o.status NOT IN ('pending', 'paid') THEN
    RETURN jsonb_build_object('ok', false, 'error', 'NOT_CANCELLABLE');
  END IF;
  IF o.cancellation_requested THEN
    RETURN jsonb_build_object('ok', true);
  END IF;

  UPDATE orders SET cancellation_requested = true WHERE id = p_order_id;
  INSERT INTO order_events (order_id, event, note)
  VALUES (p_order_id, 'cancellation.requested', 'Customer requested cancellation');

  RETURN jsonb_build_object('ok', true);
END;
$$;

REVOKE ALL ON FUNCTION request_order_cancellation(UUID) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION request_order_cancellation(UUID) TO authenticated;

-- Admin cancels an order: restock each line item, mark cancelled (atomic).
CREATE OR REPLACE FUNCTION cancel_order_restock(p_order_id UUID)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  o RECORD;
  it RECORD;
BEGIN
  IF NOT is_admin() THEN
    RETURN jsonb_build_object('ok', false, 'error', 'FORBIDDEN');
  END IF;

  SELECT id, status INTO o FROM orders WHERE id = p_order_id;
  IF NOT FOUND THEN
    RETURN jsonb_build_object('ok', false, 'error', 'NOT_FOUND');
  END IF;
  IF o.status = 'cancelled' THEN
    RETURN jsonb_build_object('ok', true);
  END IF;

  FOR it IN SELECT variant_id, quantity FROM order_items WHERE order_id = p_order_id AND variant_id IS NOT NULL
  LOOP
    UPDATE product_variants SET stock_quantity = stock_quantity + it.quantity WHERE id = it.variant_id;
  END LOOP;

  UPDATE orders SET status = 'cancelled', cancellation_requested = false WHERE id = p_order_id;
  INSERT INTO order_events (order_id, event, note)
  VALUES (p_order_id, 'order.cancelled', 'Cancelled by admin; inventory restocked');

  RETURN jsonb_build_object('ok', true);
END;
$$;

REVOKE ALL ON FUNCTION cancel_order_restock(UUID) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION cancel_order_restock(UUID) TO authenticated;


-- ============================================================
-- 0018_payment_idempotency.sql
-- ============================================================
-- Make record_payment idempotent: the verify callback AND the webhook can both
-- fire for the same capture. Dedupe by (provider_payment_id, status).
CREATE OR REPLACE FUNCTION record_payment(
  p_order_id UUID,
  p_provider TEXT,
  p_provider_payment_id TEXT,
  p_amount NUMERIC,
  p_status TEXT DEFAULT 'captured',
  p_method TEXT DEFAULT NULL,
  p_currency TEXT DEFAULT 'INR',
  p_raw JSONB DEFAULT NULL
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_payment_id UUID;
BEGIN
  IF NOT EXISTS (SELECT 1 FROM orders WHERE id = p_order_id) THEN
    RAISE EXCEPTION 'ORDER_NOT_FOUND';
  END IF;

  -- Idempotency: same gateway payment id + status already recorded.
  IF p_provider_payment_id IS NOT NULL THEN
    SELECT id INTO v_payment_id FROM payments
     WHERE provider_payment_id = p_provider_payment_id
       AND status = p_status::payment_status
     LIMIT 1;
    IF FOUND THEN
      RETURN v_payment_id;
    END IF;
  END IF;

  INSERT INTO payments (order_id, provider, provider_payment_id, amount, currency, status, method, raw)
  VALUES (p_order_id, p_provider, p_provider_payment_id, p_amount, p_currency, p_status::payment_status, p_method, p_raw)
  RETURNING id INTO v_payment_id;

  IF p_status = 'captured' THEN
    UPDATE orders
       SET is_paid = true,
           status = CASE WHEN status = 'pending' THEN 'paid'::order_status ELSE status END,
           payment_intent_id = COALESCE(p_provider_payment_id, payment_intent_id)
     WHERE id = p_order_id;
  ELSIF p_status = 'failed' THEN
    INSERT INTO order_events (order_id, event, note)
    VALUES (p_order_id, 'payment.failed', COALESCE(p_provider, 'gateway') || ' payment failed');
  ELSIF p_status = 'refunded' THEN
    INSERT INTO order_events (order_id, event, note)
    VALUES (p_order_id, 'payment.refunded', 'Payment refunded');
  END IF;

  RETURN v_payment_id;
END;
$$;

REVOKE ALL ON FUNCTION record_payment(UUID, TEXT, TEXT, NUMERIC, TEXT, TEXT, TEXT, JSONB) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION record_payment(UUID, TEXT, TEXT, NUMERIC, TEXT, TEXT, TEXT, JSONB) TO service_role;


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

