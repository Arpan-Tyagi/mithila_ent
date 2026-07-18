-- Seed script to populate all core fabric categories
INSERT INTO categories (name, slug) VALUES 
('Linen', 'linen'),
('Cotton', 'cotton'),
('Viscose', 'viscose'),
('Brushed Flannel', 'flannel'),
('Corduroy', 'corduroy'),
('Diagonal Twill', 'twill'),
('Suede', 'suede'),
('Velvet', 'velvet'),
('Wool', 'wool'),
('Fleece', 'fleece'),
('Tweed', 'tweed')
ON CONFLICT (slug) DO NOTHING;
