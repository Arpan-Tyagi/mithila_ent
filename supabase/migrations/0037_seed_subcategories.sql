DO $$
DECLARE
    linen_id UUID;
    cotton_id UUID;
    viscose_id UUID;
    flannel_id UUID;
    corduroy_id UUID;
    twill_id UUID;
    suede_id UUID;
    velvet_id UUID;
    wool_id UUID;
    fleece_id UUID;
    tweed_id UUID;
BEGIN
    SELECT id INTO linen_id FROM categories WHERE slug = 'linen';
    SELECT id INTO cotton_id FROM categories WHERE slug = 'cotton';
    SELECT id INTO viscose_id FROM categories WHERE slug = 'viscose';
    SELECT id INTO flannel_id FROM categories WHERE slug = 'flannel';
    SELECT id INTO corduroy_id FROM categories WHERE slug = 'corduroy';
    SELECT id INTO twill_id FROM categories WHERE slug = 'twill';
    SELECT id INTO suede_id FROM categories WHERE slug = 'suede';
    SELECT id INTO velvet_id FROM categories WHERE slug = 'velvet';
    SELECT id INTO wool_id FROM categories WHERE slug = 'wool';
    SELECT id INTO fleece_id FROM categories WHERE slug = 'fleece';
    SELECT id INTO tweed_id FROM categories WHERE slug = 'tweed';

    -- Linen Subcategories
    IF linen_id IS NOT NULL THEN
        INSERT INTO categories (name, slug, parent_id) VALUES
        ('Irish Linen', 'irish-linen', linen_id),
        ('Belgian Linen', 'belgian-linen', linen_id),
        ('Linen Blends', 'linen-blends', linen_id)
        ON CONFLICT (slug) DO NOTHING;
    END IF;

    -- Cotton Subcategories
    IF cotton_id IS NOT NULL THEN
        INSERT INTO categories (name, slug, parent_id) VALUES
        ('Organic Cotton', 'organic-cotton', cotton_id),
        ('Egyptian Cotton', 'egyptian-cotton', cotton_id),
        ('Pima Cotton', 'pima-cotton', cotton_id),
        ('Cambric', 'cambric', cotton_id),
        ('Poplin', 'poplin', cotton_id)
        ON CONFLICT (slug) DO NOTHING;
    END IF;

    -- Viscose Subcategories
    IF viscose_id IS NOT NULL THEN
        INSERT INTO categories (name, slug, parent_id) VALUES
        ('Rayon Viscose', 'rayon-viscose', viscose_id),
        ('Modal', 'modal', viscose_id),
        ('Lyocell / Tencel', 'lyocell-tencel', viscose_id)
        ON CONFLICT (slug) DO NOTHING;
    END IF;

    -- Flannel Subcategories
    IF flannel_id IS NOT NULL THEN
        INSERT INTO categories (name, slug, parent_id) VALUES
        ('Cotton Flannel', 'cotton-flannel', flannel_id),
        ('Wool Flannel', 'wool-flannel', flannel_id),
        ('Brushed Cotton', 'brushed-cotton', flannel_id)
        ON CONFLICT (slug) DO NOTHING;
    END IF;

    -- Corduroy Subcategories
    IF corduroy_id IS NOT NULL THEN
        INSERT INTO categories (name, slug, parent_id) VALUES
        ('Pinwale (Fine)', 'pinwale', corduroy_id),
        ('Standard Wale', 'standard-wale', corduroy_id),
        ('Wide Wale', 'wide-wale', corduroy_id)
        ON CONFLICT (slug) DO NOTHING;
    END IF;

    -- Twill Subcategories
    IF twill_id IS NOT NULL THEN
        INSERT INTO categories (name, slug, parent_id) VALUES
        ('Denim', 'denim', twill_id),
        ('Chino', 'chino', twill_id),
        ('Gabardine', 'gabardine', twill_id)
        ON CONFLICT (slug) DO NOTHING;
    END IF;

    -- Suede Subcategories
    IF suede_id IS NOT NULL THEN
        INSERT INTO categories (name, slug, parent_id) VALUES
        ('Microsuede', 'microsuede', suede_id),
        ('Ultrasuede', 'ultrasuede', suede_id)
        ON CONFLICT (slug) DO NOTHING;
    END IF;

    -- Velvet Subcategories
    IF velvet_id IS NOT NULL THEN
        INSERT INTO categories (name, slug, parent_id) VALUES
        ('Silk Velvet', 'silk-velvet', velvet_id),
        ('Cotton Velvet', 'cotton-velvet', velvet_id),
        ('Crushed Velvet', 'crushed-velvet', velvet_id)
        ON CONFLICT (slug) DO NOTHING;
    END IF;

    -- Wool Subcategories
    IF wool_id IS NOT NULL THEN
        INSERT INTO categories (name, slug, parent_id) VALUES
        ('Merino Wool', 'merino-wool', wool_id),
        ('Worsted Wool', 'worsted-wool', wool_id),
        ('Boiled Wool', 'boiled-wool', wool_id),
        ('Cashmere Blend', 'cashmere-blend', wool_id)
        ON CONFLICT (slug) DO NOTHING;
    END IF;

    -- Fleece Subcategories
    IF fleece_id IS NOT NULL THEN
        INSERT INTO categories (name, slug, parent_id) VALUES
        ('Polar Fleece', 'polar-fleece', fleece_id),
        ('Microfleece', 'microfleece', fleece_id),
        ('Sherpa Fleece', 'sherpa-fleece', fleece_id)
        ON CONFLICT (slug) DO NOTHING;
    END IF;

    -- Tweed Subcategories
    IF tweed_id IS NOT NULL THEN
        INSERT INTO categories (name, slug, parent_id) VALUES
        ('Harris Tweed', 'harris-tweed', tweed_id),
        ('Donegal Tweed', 'donegal-tweed', tweed_id),
        ('Herringbone Tweed', 'herringbone-tweed', tweed_id)
        ON CONFLICT (slug) DO NOTHING;
    END IF;
END $$;
