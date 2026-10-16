-- =========================================================================
-- OGBA MARKET PLACE: USERS & COMMUNITIES DATABASE SETUP
-- Run this in your Supabase SQL Editor
-- =========================================================================

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 1. USERS TABLE (Supports Phone, Email, Address, Community Area)
CREATE TABLE IF NOT EXISTS public.users (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    phone_number VARCHAR(30) UNIQUE NOT NULL,
    full_name VARCHAR(150) NOT NULL,
    email VARCHAR(255) UNIQUE,
    role VARCHAR(50) DEFAULT 'customer' NOT NULL,
    avatar_url TEXT,
    area VARCHAR(100) DEFAULT 'Omoku' NOT NULL,
    delivery_address TEXT,
    wallet_balance NUMERIC(14, 2) DEFAULT 0.00 NOT NULL,
    is_active BOOLEAN DEFAULT TRUE NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL
);

-- Ensure area column is VARCHAR(120) so any community from DB is accepted
ALTER TABLE public.users ALTER COLUMN area TYPE VARCHAR(120);
ALTER TABLE public.vendors ALTER COLUMN area TYPE VARCHAR(120);

-- Enable RLS and add public access policies
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Allow public select on users" ON public.users;
DROP POLICY IF EXISTS "Allow public insert on users" ON public.users;
DROP POLICY IF EXISTS "Allow public update on users" ON public.users;

CREATE POLICY "Allow public select on users" ON public.users FOR SELECT USING (true);
CREATE POLICY "Allow public insert on users" ON public.users FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow public update on users" ON public.users FOR UPDATE USING (true) WITH CHECK (true);

-- 2. COMMUNITIES TABLE (100% DB-driven, dynamically managed by Admin)
CREATE TABLE IF NOT EXISTS public.communities (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(120) UNIQUE NOT NULL,
    lga VARCHAR(120) DEFAULT 'Ogba/Egbema/Ndoni' NOT NULL,
    is_active BOOLEAN DEFAULT TRUE NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL
);

ALTER TABLE public.communities ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Allow all on communities" ON public.communities;
CREATE POLICY "Allow all on communities" ON public.communities FOR ALL USING (true) WITH CHECK (true);

-- 3. PLATFORM SETTINGS TABLE (To store Brevo API Key, etc. in DB)
CREATE TABLE IF NOT EXISTS public.platform_settings (
    key VARCHAR(100) PRIMARY KEY,
    value TEXT NOT NULL,
    description TEXT,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL
);

ALTER TABLE public.platform_settings ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Allow all on platform_settings" ON public.platform_settings;
CREATE POLICY "Allow all on platform_settings" ON public.platform_settings FOR ALL USING (true) WITH CHECK (true);

-- 4. Initial Communities in Database
INSERT INTO public.communities (name, lga) VALUES 
  ('Omoku', 'Ogba/Egbema/Ndoni'),
  ('Egi', 'Ogba/Egbema/Ndoni'),
  ('Obrikom', 'Ogba/Egbema/Ndoni'),
  ('Erema', 'Ogba/Egbema/Ndoni'),
  ('Ahoada', 'Ahoada East'),
  ('Kreigani', 'Ogba/Egbema/Ndoni'),
  ('Obite', 'Ogba/Egbema/Ndoni')
ON CONFLICT (name) DO NOTHING;
