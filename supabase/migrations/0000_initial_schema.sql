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
