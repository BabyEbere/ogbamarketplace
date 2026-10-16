-- =========================================================================
-- OGBA MARKET PLACE: BRAND REQUESTS & PRODUCT APPROVAL WORKFLOW SCHEMA
-- Run this in your Supabase SQL Editor
-- =========================================================================

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 1. BRAND REQUESTS TABLE (Allows merchants to request brand additions)
CREATE TABLE IF NOT EXISTS public.brand_requests (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    vendor_id UUID REFERENCES public.vendors(id) ON DELETE CASCADE,
    brand_name VARCHAR(150) NOT NULL,
    category_id UUID REFERENCES public.categories(id) ON DELETE SET NULL,
    website_url TEXT,
    logo_url TEXT,
    description TEXT,
    status VARCHAR(20) DEFAULT 'pending' NOT NULL, -- 'pending', 'approved', 'declined'
    rejection_reason TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL
);

-- Enable RLS on brand_requests
ALTER TABLE public.brand_requests ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Allow all on brand_requests" ON public.brand_requests;
CREATE POLICY "Allow all on brand_requests" ON public.brand_requests FOR ALL USING (true) WITH CHECK (true);

-- 2. PRODUCTS APPROVAL STATUS COLUMNS (Defaults to 'pending' for review before going live)
ALTER TABLE public.products ADD COLUMN IF NOT EXISTS approval_status VARCHAR(30) DEFAULT 'pending' NOT NULL;
ALTER TABLE public.products ADD COLUMN IF NOT EXISTS rejection_reason TEXT;

-- Explicitly ensure default for approval_status is 'pending' and is_active is false
ALTER TABLE public.products ALTER COLUMN approval_status SET DEFAULT 'pending';
ALTER TABLE public.products ALTER COLUMN is_active SET DEFAULT false;

-- Keep already existing live catalog items active & approved
UPDATE public.products SET approval_status = 'approved', is_active = true WHERE approval_status IS NULL;

-- Index for speedy review querying
CREATE INDEX IF NOT EXISTS idx_products_approval_status ON public.products(approval_status);
CREATE INDEX IF NOT EXISTS idx_brand_requests_status ON public.brand_requests(status);

-- 3. PAYOUT BANKS TABLE (Allows admin to upload and manage banks they disburse to)
CREATE TABLE IF NOT EXISTS public.payout_banks (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(150) NOT NULL UNIQUE,
    code VARCHAR(20),
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL
);

-- Enable RLS on payout_banks
ALTER TABLE public.payout_banks ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Allow all on payout_banks" ON public.payout_banks;
CREATE POLICY "Allow all on payout_banks" ON public.payout_banks FOR ALL USING (true) WITH CHECK (true);

-- 4. ENSURE PRODUCTS TABLE HAS FULL RLS POLICIES FOR INSERT, UPDATE, DELETE
DROP POLICY IF EXISTS "Public can view active products" ON public.products;
CREATE POLICY "Public can view active products" ON public.products FOR SELECT USING (true);

DROP POLICY IF EXISTS "Allow insert on products" ON public.products;
CREATE POLICY "Allow insert on products" ON public.products FOR INSERT WITH CHECK (true);

DROP POLICY IF EXISTS "Allow update on products" ON public.products;
CREATE POLICY "Allow update on products" ON public.products FOR UPDATE USING (true);

DROP POLICY IF EXISTS "Allow delete on products" ON public.products;
CREATE POLICY "Allow delete on products" ON public.products FOR DELETE USING (true);

