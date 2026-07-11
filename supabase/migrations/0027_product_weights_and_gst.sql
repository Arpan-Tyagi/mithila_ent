-- Migration to add weight and gst_rate

ALTER TABLE product_variants
ADD COLUMN weight_grams INTEGER DEFAULT 200;

ALTER TABLE products
ADD COLUMN gst_rate DECIMAL(5,2) DEFAULT 5.00;
