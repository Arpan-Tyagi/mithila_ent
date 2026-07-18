-- Add parent_id to categories to support subcategories
ALTER TABLE categories ADD COLUMN IF NOT EXISTS parent_id UUID REFERENCES categories(id) ON DELETE CASCADE;

-- Add subcategory_id to products
ALTER TABLE products ADD COLUMN IF NOT EXISTS subcategory_id UUID REFERENCES categories(id) ON DELETE SET NULL;
