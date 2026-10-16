-- =========================================================================
-- CONTROL-ADMIN DATABASE TABLE
-- Dedicated table for Marketplace Control Owners & Supervisors (Separate from regular users)
-- =========================================================================

CREATE TABLE IF NOT EXISTS control_admin (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    email VARCHAR(255) UNIQUE NOT NULL,
    full_name VARCHAR(150) NOT NULL,
    password_hash TEXT NOT NULL,
    role VARCHAR(50) DEFAULT 'super_admin' NOT NULL, -- 'super_admin', 'operations_manager', 'support_agent'
    is_active BOOLEAN DEFAULT TRUE NOT NULL,
    last_login TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL
);

-- Enable RLS
ALTER TABLE control_admin ENABLE ROW LEVEL SECURITY;

-- Allow select/insert/update for authenticated sessions or via server actions
CREATE POLICY "Allow server access to control_admin" ON control_admin FOR ALL USING (true) WITH CHECK (true);

-- Seed Default Master Admin
-- Password hash for 'Orekeemmanuel' with SHA-256 + Salt
INSERT INTO control_admin (id, email, full_name, password_hash, role, is_active)
VALUES (
    '99999999-9999-9999-9999-999999999999',
    'pookietechdigitals@gmail.com',
    'Emmanuel Oreke',
    'e77864f1cbe8d29ff70a5c4ec4dcf2bc736a6f6c99c55d04586d5e744f6fdf39',
    'super_admin',
    true
)
ON CONFLICT (email) DO UPDATE SET
    full_name = EXCLUDED.full_name,
    password_hash = EXCLUDED.password_hash,
    role = EXCLUDED.role,
    is_active = EXCLUDED.is_active;
