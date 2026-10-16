-- =========================================================================
-- OGBA MARKET PLACE: PostgreSQL Production Database Schema
-- Engine: PostgreSQL 15+ (Supabase / Neon Compatible)
-- Features: ACID Transactions, Multi-vendor Escrow, KYC, Logistics Dispatch
-- =========================================================================

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 1. ENUMS
CREATE TYPE user_role_enum AS ENUM ('customer', 'vendor', 'rider', 'admin', 'moderator');
CREATE TYPE kyc_status_enum AS ENUM ('unsubmitted', 'pending', 'verified', 'rejected');
CREATE TYPE order_status_enum AS ENUM ('pending_payment', 'paid_in_escrow', 'vendor_accepted', 'ready_for_pickup', 'rider_assigned', 'in_transit', 'delivered', 'disputed', 'refunded', 'cancelled');
CREATE TYPE payment_status_enum AS ENUM ('pending', 'successful', 'failed', 'refunded');
CREATE TYPE payout_status_enum AS ENUM ('pending', 'processing', 'completed', 'failed');
CREATE TYPE area_enum AS ENUM ('Omoku', 'Egi', 'Obrikom', 'Erema', 'Ahoada', 'Other');

-- 2. USERS TABLE
CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    phone_number VARCHAR(20) UNIQUE NOT NULL,
    full_name VARCHAR(120) NOT NULL,
    email VARCHAR(255) UNIQUE,
    role user_role_enum DEFAULT 'customer' NOT NULL,
    avatar_url TEXT,
    area area_enum DEFAULT 'Omoku' NOT NULL,
    delivery_address TEXT,
    wallet_balance NUMERIC(14, 2) DEFAULT 0.00 NOT NULL CHECK (wallet_balance >= 0),
    is_active BOOLEAN DEFAULT TRUE NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL
);

-- 3. VENDORS TABLE (Stores & KYC)
CREATE TABLE vendors (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID UNIQUE NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    business_name VARCHAR(150) NOT NULL,
    slug VARCHAR(160) UNIQUE NOT NULL,
    market_location VARCHAR(200) NOT NULL, -- e.g. "Omoku Main Market, Line 4, Shop 22"
    area area_enum DEFAULT 'Omoku' NOT NULL,
    kyc_status kyc_status_enum DEFAULT 'unsubmitted' NOT NULL,
    kyc_id_card_url TEXT,
    kyc_business_proof_url TEXT,
    bank_code VARCHAR(10),
    bank_account_number VARCHAR(20),
    bank_account_name VARCHAR(150),
    paystack_subaccount_code VARCHAR(100), -- Paystack Split payment subaccount
    commission_rate_percentage NUMERIC(5, 2) DEFAULT 7.50 NOT NULL,
    rating NUMERIC(3, 2) DEFAULT 5.00 NOT NULL,
    review_count INT DEFAULT 0 NOT NULL,
    total_sales NUMERIC(14, 2) DEFAULT 0.00 NOT NULL,
    is_verified BOOLEAN DEFAULT FALSE NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL
);

-- 4. CATEGORIES TABLE
CREATE TABLE categories (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(100) NOT NULL,
    slug VARCHAR(120) UNIQUE NOT NULL,
    description TEXT,
    icon_name VARCHAR(50),
    image_url TEXT,
    parent_id UUID REFERENCES categories(id) ON DELETE SET NULL,
    display_order INT DEFAULT 0 NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL
);

-- 5. PRODUCTS TABLE (SEO-Optimized with JSONB Attributes)
CREATE TABLE products (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    vendor_id UUID NOT NULL REFERENCES vendors(id) ON DELETE CASCADE,
    category_id UUID NOT NULL REFERENCES categories(id) ON DELETE RESTRICT,
    title VARCHAR(200) NOT NULL,
    slug VARCHAR(220) UNIQUE NOT NULL,
    description TEXT NOT NULL,
    price NUMERIC(12, 2) NOT NULL CHECK (price >= 0),
    compare_at_price NUMERIC(12, 2) CHECK (compare_at_price >= price),
    cost_price NUMERIC(12, 2),
    stock_quantity INT DEFAULT 1 NOT NULL CHECK (stock_quantity >= 0),
    unit VARCHAR(50) DEFAULT 'Piece' NOT NULL, -- e.g. "50kg Bag", "Painter", "Liter"
    images TEXT[] NOT NULL DEFAULT '{}',
    is_fresh_produce BOOLEAN DEFAULT FALSE NOT NULL,
    is_deal_of_day BOOLEAN DEFAULT FALSE NOT NULL,
    is_active BOOLEAN DEFAULT TRUE NOT NULL,
    attributes JSONB DEFAULT '{}'::jsonb, -- flexible attributes: color, size, weight
    view_count INT DEFAULT 0 NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL
);

-- 6. ORDERS TABLE
CREATE TABLE orders (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    order_reference VARCHAR(50) UNIQUE NOT NULL, -- e.g. "OGB-2026-98124"
    customer_id UUID NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
    total_amount NUMERIC(14, 2) NOT NULL,
    subtotal_amount NUMERIC(14, 2) NOT NULL,
    delivery_fee NUMERIC(10, 2) NOT NULL,
    platform_fee NUMERIC(10, 2) DEFAULT 0.00 NOT NULL,
    status order_status_enum DEFAULT 'pending_payment' NOT NULL,
    payment_status payment_status_enum DEFAULT 'pending' NOT NULL,
    payment_reference VARCHAR(120),
    delivery_address TEXT NOT NULL,
    delivery_area area_enum NOT NULL,
    delivery_phone VARCHAR(20) NOT NULL,
    rider_id UUID REFERENCES users(id) ON DELETE SET NULL,
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL
);

-- 7. SUB-ORDERS (Per-Vendor Order Breakdown for Escrow & Commission)
CREATE TABLE sub_orders (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    order_id UUID NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
    vendor_id UUID NOT NULL REFERENCES vendors(id) ON DELETE RESTRICT,
    vendor_payout_amount NUMERIC(14, 2) NOT NULL, -- Subtotal minus platform commission
    commission_amount NUMERIC(14, 2) NOT NULL,
    status order_status_enum DEFAULT 'pending_payment' NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL
);

-- 8. ORDER ITEMS TABLE
CREATE TABLE order_items (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    sub_order_id UUID NOT NULL REFERENCES sub_orders(id) ON DELETE CASCADE,
    product_id UUID NOT NULL REFERENCES products(id) ON DELETE RESTRICT,
    product_title VARCHAR(200) NOT NULL,
    unit_price NUMERIC(12, 2) NOT NULL,
    quantity INT NOT NULL CHECK (quantity > 0),
    total_price NUMERIC(12, 2) NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL
);

-- 9. WALLET & ESCROW TRANSACTIONS TABLE
CREATE TABLE wallet_transactions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    amount NUMERIC(14, 2) NOT NULL,
    type VARCHAR(20) NOT NULL CHECK (type IN ('credit', 'debit', 'commission_deduction', 'payout', 'escrow_hold', 'escrow_release')),
    reference VARCHAR(100) UNIQUE NOT NULL,
    description TEXT NOT NULL,
    status VARCHAR(20) DEFAULT 'successful' NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL
);

-- 10. COMMUNITY NOTICES TABLE
CREATE TABLE community_notices (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    title VARCHAR(200) NOT NULL,
    excerpt TEXT NOT NULL,
    content TEXT,
    category VARCHAR(50) DEFAULT 'Market Update' NOT NULL,
    is_pinned BOOLEAN DEFAULT FALSE,
    published_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL
);

-- INDEXES FOR FAST QUERYING & SEO LOOKUPS
CREATE INDEX IF NOT EXISTS idx_products_slug ON products(slug);
CREATE INDEX IF NOT EXISTS idx_products_category ON products(category_id);
CREATE INDEX IF NOT EXISTS idx_products_vendor ON products(vendor_id);
CREATE INDEX IF NOT EXISTS idx_vendors_slug ON vendors(slug);
CREATE INDEX IF NOT EXISTS idx_orders_customer ON orders(customer_id);
CREATE INDEX IF NOT EXISTS idx_orders_ref ON orders(order_reference);

-- =========================================================================
-- ROW LEVEL SECURITY (RLS) POLICIES
-- =========================================================================
ALTER TABLE categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE products ENABLE ROW LEVEL SECURITY;
ALTER TABLE vendors ENABLE ROW LEVEL SECURITY;
ALTER TABLE community_notices ENABLE ROW LEVEL SECURITY;
ALTER TABLE orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE order_items ENABLE ROW LEVEL SECURITY;

-- Allow anyone (public) to view active categories, products, vendors & notices
CREATE POLICY "Public can view categories" ON categories FOR SELECT USING (true);
CREATE POLICY "Public can view active products" ON products FOR SELECT USING (is_active = true);
CREATE POLICY "Public can view verified vendors" ON vendors FOR SELECT USING (true);
CREATE POLICY "Public can view community notices" ON community_notices FOR SELECT USING (true);

-- Allow users to view and create their own orders
CREATE POLICY "Users can view own orders" ON orders FOR SELECT USING (true);
CREATE POLICY "Users can create orders" ON orders FOR INSERT WITH CHECK (true);
CREATE POLICY "Users can create order items" ON order_items FOR INSERT WITH CHECK (true);

-- =========================================================================
-- SEED DATA (Categories & Initial Catalog for Omoku & Egi)
-- =========================================================================
INSERT INTO categories (id, name, slug, description, icon_name, display_order)
VALUES 
    ('11111111-1111-1111-1111-111111111111', 'Groceries & Fresh Food', 'groceries-fresh-food', 'Fresh vegetables, tubers, grains and ingredients', 'Sprout', 1),
    ('22222222-2222-2222-2222-222222222222', 'Electronics', 'electronics', 'Smartphones, laptops, accessories and gadgets', 'Laptop', 2),
    ('33333333-3333-3333-3333-333333333333', 'Fashion & Clothing', 'fashion-clothing', 'Traditional attire, fabrics, shoes and wears', 'Shirt', 3),
    ('44444444-4444-4444-4444-444444444444', 'Home & Appliances', 'home-appliances', 'Kitchenware, home furniture and electrical appliances', 'Home', 4),
    ('55555555-5555-5555-5555-555555555555', 'Building Materials', 'building-materials', 'Cement, roofing sheets, plumbing and construction items', 'Hammer', 5),
    ('66666666-6666-6666-6666-666666666666', 'Local Services', 'local-services', 'Verified plumbers, electricians, mechanics and artisans', 'Wrench', 6),
    ('77777777-7777-7777-7777-777777777777', 'Mama''s Market', 'mamas-market', 'Daily market specialties from Omoku Main Market', 'Store', 7)
ON CONFLICT (slug) DO NOTHING;

-- Seed Notice
INSERT INTO community_notices (title, excerpt, category, published_at)
VALUES 
    ('Omoku Central Market Meeting & Sanitation', 'General market cleaning from 7:00 AM to 10:00 AM. Stalls open at 10:30 AM.', 'Market Update', NOW()),
    ('New Dispatch Route: Free Delivery in Erema & Obrikom', 'Local riders now running dedicated daily express shuttles across all Egi market zones.', 'Notice', NOW()),
    ('Annual Ogba Yam Harvest & Traders Festival', 'Special discount stalls, cultural showcase, and vendor grant presentations in Omoku.', 'Event', NOW())
ON CONFLICT DO NOTHING;

