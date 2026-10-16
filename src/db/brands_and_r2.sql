-- =========================================================================
-- OGBA MARKET PLACE: BRANDS & CATEGORY ASSOCIATION SCHEMA
-- Run this in your Supabase SQL Editor
-- =========================================================================

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 0. CATEGORIES RLS POLICY (Ensure admin can create, update, and manage categories)
ALTER TABLE public.categories ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Public can view categories" ON public.categories;
DROP POLICY IF EXISTS "Allow all on categories" ON public.categories;
CREATE POLICY "Allow all on categories" ON public.categories FOR ALL USING (true) WITH CHECK (true);

-- 1. BRANDS TABLE
CREATE TABLE IF NOT EXISTS public.brands (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(120) NOT NULL,
    slug VARCHAR(150) UNIQUE NOT NULL,
    logo_url TEXT,
    website_url TEXT,
    description TEXT,
    is_active BOOLEAN DEFAULT TRUE NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL
);

-- Enable RLS on brands
ALTER TABLE public.brands ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Allow public select on brands" ON public.brands;
DROP POLICY IF EXISTS "Allow all on brands" ON public.brands;

CREATE POLICY "Allow public select on brands" ON public.brands FOR SELECT USING (true);
CREATE POLICY "Allow all on brands" ON public.brands FOR ALL USING (true) WITH CHECK (true);

-- 2. BRAND_CATEGORIES (Many-to-Many Association: Brands can belong to Multiple Categories)
CREATE TABLE IF NOT EXISTS public.brand_categories (
    brand_id UUID NOT NULL REFERENCES public.brands(id) ON DELETE CASCADE,
    category_id UUID NOT NULL REFERENCES public.categories(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
    PRIMARY KEY (brand_id, category_id)
);

-- Enable RLS on brand_categories
ALTER TABLE public.brand_categories ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Allow public select on brand_categories" ON public.brand_categories;
DROP POLICY IF EXISTS "Allow all on brand_categories" ON public.brand_categories;

CREATE POLICY "Allow public select on brand_categories" ON public.brand_categories FOR SELECT USING (true);
CREATE POLICY "Allow all on brand_categories" ON public.brand_categories FOR ALL USING (true) WITH CHECK (true);

-- 3. LINK PRODUCTS TO BRANDS
ALTER TABLE public.products ADD COLUMN IF NOT EXISTS brand_id UUID REFERENCES public.brands(id) ON DELETE SET NULL;
ALTER TABLE public.products ADD COLUMN IF NOT EXISTS brand_name VARCHAR(120);

-- 4. SEED POPULAR COMMERCIAL BRANDS
INSERT INTO public.brands (id, name, slug, logo_url, is_active)
VALUES 
    ('10000000-0000-0000-0000-000000000001', 'Apple', 'apple', 'https://upload.wikimedia.org/wikipedia/commons/f/fa/Apple_logo_black.svg', true),
    ('10000000-0000-0000-0000-000000000002', 'Samsung', 'samsung', 'https://upload.wikimedia.org/wikipedia/commons/2/24/Samsung_Logo.svg', true),
    ('10000000-0000-0000-0000-000000000003', 'Tecno', 'tecno', 'https://upload.wikimedia.org/wikipedia/commons/5/52/Tecno_Mobile_logo.svg', true),
    ('10000000-0000-0000-0000-000000000004', 'Infinix', 'infinix', 'https://upload.wikimedia.org/wikipedia/commons/2/2a/Infinix_logo.svg', true),
    ('10000000-0000-0000-0000-000000000005', 'Xiaomi', 'xiaomi', 'https://upload.wikimedia.org/wikipedia/commons/a/ae/Xiaomi_logo_%282021-%29.svg', true),
    ('10000000-0000-0000-0000-000000000006', 'Dangote', 'dangote', 'https://upload.wikimedia.org/wikipedia/commons/3/36/Dangote_Group_Logo.svg', true),
    ('10000000-0000-0000-0000-000000000007', 'Golden Penny', 'golden-penny', 'https://fmnplc.com/wp-content/uploads/2021/04/golden-penny-logo.png', true),
    ('10000000-0000-0000-0000-000000000008', 'Mama Gold', 'mama-gold', 'https://upload.wikimedia.org/wikipedia/commons/thumb/c/c5/Mama_Gold_Rice.png/220px-Mama_Gold_Rice.png', true)
ON CONFLICT (slug) DO UPDATE SET
    name = EXCLUDED.name,
    logo_url = EXCLUDED.logo_url,
    is_active = EXCLUDED.is_active;

-- 5. ASSOCIATE BRANDS WITH DEPARTMENTS / CATEGORIES
-- Electronics & Phones ('22222222-2222-2222-2222-222222222222')
INSERT INTO public.brand_categories (brand_id, category_id)
VALUES
    ('10000000-0000-0000-0000-000000000001', '22222222-2222-2222-2222-222222222222'),
    ('10000000-0000-0000-0000-000000000002', '22222222-2222-2222-2222-222222222222'),
    ('10000000-0000-0000-0000-000000000003', '22222222-2222-2222-2222-222222222222'),
    ('10000000-0000-0000-0000-000000000004', '22222222-2222-2222-2222-222222222222'),
    ('10000000-0000-0000-0000-000000000005', '22222222-2222-2222-2222-222222222222')
ON CONFLICT DO NOTHING;

-- Building & Tools ('55555555-5555-5555-5555-555555555555')
INSERT INTO public.brand_categories (brand_id, category_id)
VALUES
    ('10000000-0000-0000-0000-000000000006', '55555555-5555-5555-5555-555555555555')
ON CONFLICT DO NOTHING;

-- Groceries & Fresh Food ('11111111-1111-1111-1111-111111111111')
INSERT INTO public.brand_categories (brand_id, category_id)
VALUES
    ('10000000-0000-0000-0000-000000000007', '11111111-1111-1111-1111-111111111111'),
    ('10000000-0000-0000-0000-000000000008', '11111111-1111-1111-1111-111111111111')
ON CONFLICT DO NOTHING;

-- 6. PLATFORM SETTINGS (for Cloudflare R2 and Brevo credentials)
CREATE TABLE IF NOT EXISTS public.platform_settings (
    key VARCHAR(100) PRIMARY KEY,
    value TEXT NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL
);

ALTER TABLE public.platform_settings ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Allow all on platform_settings" ON public.platform_settings;
CREATE POLICY "Allow all on platform_settings" ON public.platform_settings FOR ALL USING (true) WITH CHECK (true);

