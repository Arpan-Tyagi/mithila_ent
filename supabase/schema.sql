-- ============================================================
-- Mithila Enterprises — Supabase Database Schema
-- Run this in: Supabase Dashboard → SQL Editor → New Query
-- ============================================================

-- 1. CATEGORIES
CREATE TABLE IF NOT EXISTS categories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  slug TEXT UNIQUE NOT NULL,
  name TEXT NOT NULL,
  description TEXT,
  image_url TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- 2. PRODUCTS
CREATE TABLE IF NOT EXISTS products (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  category_id UUID REFERENCES categories(id) ON DELETE SET NULL,
  slug TEXT UNIQUE NOT NULL,
  title TEXT NOT NULL,
  description TEXT,
  weave TEXT,
  gsm INTEGER,
  is_featured BOOLEAN DEFAULT false,
  tags TEXT[] DEFAULT '{}',
  status TEXT DEFAULT 'active' CHECK (status IN ('active', 'draft', 'archived')),
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- 3. PRODUCT VARIANTS
CREATE TABLE IF NOT EXISTS product_variants (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  sku TEXT UNIQUE NOT NULL,
  color TEXT NOT NULL,
  price NUMERIC(10, 2) NOT NULL,
  stock_quantity INTEGER DEFAULT 0,
  images TEXT[] DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT now()
);

-- 4. PROFILES (extends Supabase auth.users)
CREATE TABLE IF NOT EXISTS profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name TEXT,
  phone TEXT,
  role TEXT DEFAULT 'customer' CHECK (role IN ('customer', 'admin')),
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Auto-create profile on signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, full_name)
  VALUES (NEW.id, NEW.raw_user_meta_data->>'full_name');
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- 5. ORDERS
CREATE TABLE IF NOT EXISTS orders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'paid', 'shipped', 'delivered', 'cancelled')),
  total_amount NUMERIC(10, 2) NOT NULL,
  is_paid BOOLEAN DEFAULT false,
  shipping_address JSONB,
  tracking_status TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- 6. ORDER ITEMS
CREATE TABLE IF NOT EXISTS order_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id UUID NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
  variant_id UUID NOT NULL REFERENCES product_variants(id),
  quantity INTEGER NOT NULL DEFAULT 1,
  unit_price NUMERIC(10, 2) NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- 7. DISCOUNTS
CREATE TABLE IF NOT EXISTS discounts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  code TEXT UNIQUE,
  type TEXT DEFAULT 'percentage' CHECK (type IN ('percentage', 'fixed')),
  value NUMERIC(10, 2) NOT NULL,
  min_order_amount NUMERIC(10, 2) DEFAULT 0,
  max_uses INTEGER,
  current_uses INTEGER DEFAULT 0,
  is_active BOOLEAN DEFAULT true,
  expires_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- ============================================================
-- ROW LEVEL SECURITY (RLS) POLICIES
-- ============================================================

-- Categories: public read
ALTER TABLE categories ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public read categories" ON categories FOR SELECT USING (true);
CREATE POLICY "Admin manage categories" ON categories FOR ALL
  USING (EXISTS (SELECT 1 FROM profiles WHERE profiles.id = auth.uid() AND profiles.role = 'admin'));

-- Products: public read
ALTER TABLE products ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public read active products" ON products FOR SELECT USING (status = 'active');
CREATE POLICY "Admin manage products" ON products FOR ALL
  USING (EXISTS (SELECT 1 FROM profiles WHERE profiles.id = auth.uid() AND profiles.role = 'admin'));

-- Product variants: public read
ALTER TABLE product_variants ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public read variants" ON product_variants FOR SELECT USING (true);
CREATE POLICY "Admin manage variants" ON product_variants FOR ALL
  USING (EXISTS (SELECT 1 FROM profiles WHERE profiles.id = auth.uid() AND profiles.role = 'admin'));

-- Profiles: users see own, admins see all
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users read own profile" ON profiles FOR SELECT USING (auth.uid() = id);
CREATE POLICY "Users update own profile" ON profiles FOR UPDATE USING (auth.uid() = id);
CREATE POLICY "Admin read all profiles" ON profiles FOR SELECT
  USING (EXISTS (SELECT 1 FROM profiles p WHERE p.id = auth.uid() AND p.role = 'admin'));

-- Orders: users see own, admins see all
ALTER TABLE orders ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users read own orders" ON orders FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users create orders" ON orders FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Admin manage orders" ON orders FOR ALL
  USING (EXISTS (SELECT 1 FROM profiles WHERE profiles.id = auth.uid() AND profiles.role = 'admin'));

-- Order items: users see own, admins see all
ALTER TABLE order_items ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users read own order items" ON order_items FOR SELECT
  USING (EXISTS (SELECT 1 FROM orders WHERE orders.id = order_items.order_id AND orders.user_id = auth.uid()));
CREATE POLICY "Users create order items" ON order_items FOR INSERT
  WITH CHECK (EXISTS (SELECT 1 FROM orders WHERE orders.id = order_items.order_id AND orders.user_id = auth.uid()));
CREATE POLICY "Admin manage order items" ON order_items FOR ALL
  USING (EXISTS (SELECT 1 FROM profiles WHERE profiles.id = auth.uid() AND profiles.role = 'admin'));

-- Discounts: public read active
ALTER TABLE discounts ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public read active discounts" ON discounts FOR SELECT USING (is_active = true);
CREATE POLICY "Admin manage discounts" ON discounts FOR ALL
  USING (EXISTS (SELECT 1 FROM profiles WHERE profiles.id = auth.uid() AND profiles.role = 'admin'));

-- ============================================================
-- INDEXES
-- ============================================================
CREATE INDEX IF NOT EXISTS idx_products_category ON products(category_id);
CREATE INDEX IF NOT EXISTS idx_products_slug ON products(slug);
CREATE INDEX IF NOT EXISTS idx_products_status ON products(status);
CREATE INDEX IF NOT EXISTS idx_variants_product ON product_variants(product_id);
CREATE INDEX IF NOT EXISTS idx_orders_user ON orders(user_id);
CREATE INDEX IF NOT EXISTS idx_order_items_order ON order_items(order_id);

-- ============================================================
-- SEED DATA
-- ============================================================

-- Categories
INSERT INTO categories (id, slug, name, description) VALUES
  ('a1000000-0000-0000-0000-000000000001', 'cotton', 'Pure Cotton', 'Breathable everyday weaves crafted from the finest cotton.'),
  ('a1000000-0000-0000-0000-000000000002', 'linen', 'Fine Linen', 'Structured, elegant drapes with a premium linen finish.'),
  ('a1000000-0000-0000-0000-000000000003', 'blends', 'Heritage Blends', 'Complex textures combining cotton, linen, and silk.')
ON CONFLICT (slug) DO NOTHING;

-- Products
INSERT INTO products (id, category_id, slug, title, description, weave, gsm, is_featured, tags, status) VALUES
  ('b1000000-0000-0000-0000-000000000001', 'a1000000-0000-0000-0000-000000000001', 'saree-peacock', 'Madhubani Peacock Saree', 'A beautiful silk saree with intricate peacock motifs inspired by Madhubani art. Each piece is handcrafted by skilled artisans from the Mithila region.', 'Handwoven', 120, true, ARRAY['saree', 'peacock'], 'active'),
  ('b1000000-0000-0000-0000-000000000002', 'a1000000-0000-0000-0000-000000000001', 'dupatta-lotus', 'Lotus Motif Dupatta', 'Luxurious cotton dupatta scarf featuring sacred lotus motifs. Soft hand-feel with vibrant natural dyes.', 'Cotton', 80, true, ARRAY['dupatta', 'lotus'], 'active'),
  ('b1000000-0000-0000-0000-000000000003', 'a1000000-0000-0000-0000-000000000002', 'wall-art-tree', 'Tree of Life Wall Art', 'Traditional Madhubani wall painting depicting the sacred tree of life. Canvas-printed for lasting quality.', 'Canvas', 300, false, ARRAY['art', 'decor'], 'active'),
  ('b1000000-0000-0000-0000-000000000004', 'a1000000-0000-0000-0000-000000000003', 'tote-elephant', 'Elephant Canvas Tote Bag', 'Stylish canvas tote bag featuring an intricate elephant motif. Perfect for daily use or gifting.', 'Canvas', 250, true, ARRAY['bag', 'accessories'], 'active'),
  ('b1000000-0000-0000-0000-000000000005', 'a1000000-0000-0000-0000-000000000002', 'coaster-set', 'Wooden Coaster Set', 'Set of 4 wooden coasters with hand-painted Madhubani floral patterns. Lacquered for durability.', 'Wood', 0, false, ARRAY['home', 'decor'], 'active'),
  ('b1000000-0000-0000-0000-000000000006', 'a1000000-0000-0000-0000-000000000001', 'cushion-cover', 'Peacock Cushion Cover', 'Square decorative cushion cover featuring vibrant peacock motifs in traditional Mithila style.', 'Cotton', 150, false, ARRAY['home', 'decor'], 'active'),
  ('b1000000-0000-0000-0000-000000000007', 'a1000000-0000-0000-0000-000000000003', 'diary-cover', 'Handcrafted Leather Diary', 'Premium leather diary with a hand-painted Madhubani cover. 200 pages of acid-free paper.', 'Leather', 0, false, ARRAY['stationery'], 'active'),
  ('b1000000-0000-0000-0000-000000000008', 'a1000000-0000-0000-0000-000000000002', 'shawl-pashmina', 'Pashmina Shawl', 'Luxurious pashmina shawl with delicate Madhubani embroidery along the borders.', 'Pashmina', 200, true, ARRAY['apparel', 'shawl'], 'active'),
  ('b1000000-0000-0000-0000-000000000009', 'a1000000-0000-0000-0000-000000000001', 'kurti-tunic', 'Cotton Kurti Tunic', 'Beautiful A-line cotton kurti with hand-block-printed Madhubani floral motifs.', 'Cotton', 110, false, ARRAY['apparel', 'kurti'], 'active'),
  ('b1000000-0000-0000-0000-000000000010', 'a1000000-0000-0000-0000-000000000003', 'lamp-shade', 'Madhubani Lamp Shade', 'Cylindrical table lamp shade hand-painted with fish and peacock motifs. Creates a warm ambiance.', 'Paper/Canvas', 100, false, ARRAY['home', 'decor'], 'active')
ON CONFLICT (slug) DO NOTHING;

-- Product Variants
INSERT INTO product_variants (id, product_id, sku, color, price, stock_quantity, images) VALUES
  ('c1000000-0000-0000-0000-000000000001', 'b1000000-0000-0000-0000-000000000001', 'SAR-PEA-01', 'Lotus Pink', 120.00, 15, ARRAY['/images/products/saree_peacock_1779396777053.png']),
  ('c1000000-0000-0000-0000-000000000002', 'b1000000-0000-0000-0000-000000000002', 'DUP-LOT-01', 'Yellow/Green', 45.00, 30, ARRAY['/images/products/dupatta_lotus_1779396789937.png']),
  ('c1000000-0000-0000-0000-000000000003', 'b1000000-0000-0000-0000-000000000003', 'ART-TRE-01', 'Multicolor', 85.00, 10, ARRAY['/images/products/wall_art_tree_1779396805244.png']),
  ('c1000000-0000-0000-0000-000000000004', 'b1000000-0000-0000-0000-000000000004', 'TOT-ELE-01', 'Turmeric Yellow', 35.00, 50, ARRAY['/images/products/tote_elephant_1779396820360.png']),
  ('c1000000-0000-0000-0000-000000000005', 'b1000000-0000-0000-0000-000000000005', 'COA-SET-01', 'Red/Blue', 25.00, 40, ARRAY['/images/products/coaster_set_1779396834556.png']),
  ('c1000000-0000-0000-0000-000000000006', 'b1000000-0000-0000-0000-000000000006', 'CUS-COV-01', 'Vibrant', 20.00, 25, ARRAY['/images/products/cushion_cover_1779396858959.png']),
  ('c1000000-0000-0000-0000-000000000007', 'b1000000-0000-0000-0000-000000000007', 'DIA-COV-01', 'Brown/Painted', 40.00, 20, ARRAY['/images/products/diary_cover_1779396871270.png']),
  ('c1000000-0000-0000-0000-000000000008', 'b1000000-0000-0000-0000-000000000008', 'SHA-PAS-01', 'Cream/Embroidery', 150.00, 12, ARRAY['/images/products/shawl_pashmina_1779396885634.png']),
  ('c1000000-0000-0000-0000-000000000009', 'b1000000-0000-0000-0000-000000000009', 'KUR-TUN-01', 'White/Floral', 65.00, 35, ARRAY['/images/products/kurti_tunic_1779396899827.png']),
  ('c1000000-0000-0000-0000-000000000010', 'b1000000-0000-0000-0000-000000000010', 'LAM-SHA-01', 'Warm Colors', 55.00, 8, ARRAY['/images/products/lamp_shade_1779396914228.png'])
ON CONFLICT (sku) DO NOTHING;

-- Discounts
INSERT INTO discounts (code, type, value, max_uses, current_uses, is_active) VALUES
  ('FESTIVAL20', 'percentage', 20, 100, 45, true),
  ('WELCOME10', 'percentage', 10, NULL, 890, true)
ON CONFLICT (code) DO NOTHING;
