-- MA-Pilot Database Schema (Safe Version - 既存環境対応)
-- 既存のテーブル・ポリシーがある場合でも安全に実行可能

-- ============================================
-- 1. Clinics Table
-- ============================================
CREATE TABLE IF NOT EXISTS clinics (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  postal_code TEXT NOT NULL,
  address TEXT NOT NULL,
  phone_number TEXT NOT NULL,
  latitude NUMERIC(10, 7) NOT NULL,
  longitude NUMERIC(10, 7) NOT NULL,
  owner_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Index for performance
CREATE INDEX IF NOT EXISTS idx_clinics_owner_id ON clinics(owner_id);
CREATE INDEX IF NOT EXISTS idx_clinics_is_active ON clinics(is_active);

-- ============================================
-- 2. Monthly Data Table
-- ============================================
CREATE TABLE IF NOT EXISTS monthly_data (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  clinic_id UUID NOT NULL REFERENCES clinics(id) ON DELETE CASCADE,
  year_month TEXT NOT NULL, -- YYYY-MM format

  -- Revenue
  total_revenue NUMERIC(12, 2) NOT NULL DEFAULT 0,
  insurance_revenue NUMERIC(12, 2) NOT NULL DEFAULT 0,
  self_pay_revenue NUMERIC(12, 2) NOT NULL DEFAULT 0,

  -- Costs
  personnel_cost NUMERIC(12, 2) NOT NULL DEFAULT 0,
  material_cost NUMERIC(12, 2) NOT NULL DEFAULT 0,
  fixed_cost NUMERIC(12, 2) NOT NULL DEFAULT 0,
  other_cost NUMERIC(12, 2) NOT NULL DEFAULT 0,

  -- Patients
  new_patients INTEGER NOT NULL DEFAULT 0,
  returning_patients INTEGER NOT NULL DEFAULT 0,
  total_patients INTEGER NOT NULL DEFAULT 0,

  -- Treatments
  treatment_count INTEGER NOT NULL DEFAULT 0,
  average_revenue_per_patient NUMERIC(10, 2) NOT NULL DEFAULT 0,

  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now(),

  UNIQUE(clinic_id, year_month)
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_monthly_data_clinic_id ON monthly_data(clinic_id);
CREATE INDEX IF NOT EXISTS idx_monthly_data_year_month ON monthly_data(year_month);

-- ============================================
-- 3. Simulations Table
-- ============================================
CREATE TABLE IF NOT EXISTS simulations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  clinic_id UUID NOT NULL REFERENCES clinics(id) ON DELETE CASCADE,
  title TEXT NOT NULL,

  -- Input parameters (stored as JSONB)
  input JSONB NOT NULL,

  -- Result data (stored as JSONB)
  result JSONB NOT NULL,

  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Index for performance
CREATE INDEX IF NOT EXISTS idx_simulations_clinic_id ON simulations(clinic_id);

-- ============================================
-- 4. Reports Table
-- ============================================
CREATE TABLE IF NOT EXISTS reports (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  clinic_id UUID NOT NULL REFERENCES clinics(id) ON DELETE CASCADE,
  type TEXT NOT NULL CHECK (type IN ('monthly', 'quarterly', 'annual', 'simulation', 'market_analysis')),
  format TEXT NOT NULL CHECK (format IN ('pdf', 'csv')),
  title TEXT NOT NULL,
  generated_at TIMESTAMP WITH TIME ZONE NOT NULL,
  file_url TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Index for performance
CREATE INDEX IF NOT EXISTS idx_reports_clinic_id ON reports(clinic_id);
CREATE INDEX IF NOT EXISTS idx_reports_type ON reports(type);

-- ============================================
-- 5. Market Analyses Table
-- ============================================
CREATE TABLE IF NOT EXISTS market_analyses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  clinic_id UUID NOT NULL REFERENCES clinics(id) ON DELETE CASCADE,
  radius_km NUMERIC(5, 2) NOT NULL,

  -- Population data (stored as JSONB)
  population_data JSONB NOT NULL,

  -- Competitors (stored as JSONB array)
  competitors JSONB NOT NULL DEFAULT '[]',

  estimated_potential_patients INTEGER NOT NULL DEFAULT 0,
  market_share NUMERIC(5, 2) NOT NULL DEFAULT 0,
  analysis_date TIMESTAMP WITH TIME ZONE NOT NULL,

  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Index for performance
CREATE INDEX IF NOT EXISTS idx_market_analyses_clinic_id ON market_analyses(clinic_id);

-- ============================================
-- 6. User Metadata Table (extends Supabase auth.users)
-- ============================================
CREATE TABLE IF NOT EXISTS user_metadata (
  user_id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  role TEXT NOT NULL CHECK (role IN ('system_admin', 'clinic_owner', 'clinic_editor', 'clinic_viewer')),
  clinic_id UUID REFERENCES clinics(id) ON DELETE SET NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Index for performance
CREATE INDEX IF NOT EXISTS idx_user_metadata_clinic_id ON user_metadata(clinic_id);
CREATE INDEX IF NOT EXISTS idx_user_metadata_role ON user_metadata(role);

-- ============================================
-- 7. Price Tables (Print Order System)
-- ============================================
CREATE TABLE IF NOT EXISTS price_tables (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  category TEXT NOT NULL,
  item_name TEXT NOT NULL,
  unit_price NUMERIC(10, 2) NOT NULL,
  min_quantity INTEGER DEFAULT 1,
  description TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Index for performance
CREATE INDEX IF NOT EXISTS idx_price_tables_category ON price_tables(category);

-- ============================================
-- 8. Print Orders (Print Order System)
-- ============================================
CREATE TABLE IF NOT EXISTS print_orders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  clinic_id UUID NOT NULL REFERENCES clinics(id) ON DELETE CASCADE,
  order_type TEXT NOT NULL CHECK (order_type IN ('consultation', 'reorder')),
  items JSONB NOT NULL,
  total_amount NUMERIC(12, 2),
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'processing', 'completed', 'cancelled')),
  contact_info JSONB,
  memo TEXT,
  approved_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Index for performance
CREATE INDEX IF NOT EXISTS idx_print_orders_clinic_id ON print_orders(clinic_id);
CREATE INDEX IF NOT EXISTS idx_print_orders_status ON print_orders(status);

-- ============================================
-- Row Level Security (RLS) Policies
-- ============================================

-- Enable RLS on all tables
ALTER TABLE clinics ENABLE ROW LEVEL SECURITY;
ALTER TABLE monthly_data ENABLE ROW LEVEL SECURITY;
ALTER TABLE simulations ENABLE ROW LEVEL SECURITY;
ALTER TABLE reports ENABLE ROW LEVEL SECURITY;
ALTER TABLE market_analyses ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_metadata ENABLE ROW LEVEL SECURITY;
ALTER TABLE price_tables ENABLE ROW LEVEL SECURITY;
ALTER TABLE print_orders ENABLE ROW LEVEL SECURITY;

-- ============================================
-- Drop existing policies (if any)
-- ============================================
DO $$
BEGIN
  -- Clinics policies
  DROP POLICY IF EXISTS "Users can view their own clinic" ON clinics;
  DROP POLICY IF EXISTS "Clinic owners can update their clinic" ON clinics;
  DROP POLICY IF EXISTS "System admins can insert clinics" ON clinics;

  -- Monthly Data policies
  DROP POLICY IF EXISTS "Users can view monthly data for their clinic" ON monthly_data;
  DROP POLICY IF EXISTS "Editors can modify monthly data" ON monthly_data;

  -- Simulations policies
  DROP POLICY IF EXISTS "Users can view simulations for their clinic" ON simulations;
  DROP POLICY IF EXISTS "Editors can create simulations" ON simulations;

  -- Reports policies
  DROP POLICY IF EXISTS "Users can view reports for their clinic" ON reports;
  DROP POLICY IF EXISTS "Users can create reports for their clinic" ON reports;

  -- Market Analyses policies
  DROP POLICY IF EXISTS "Users can view market analyses for their clinic" ON market_analyses;
  DROP POLICY IF EXISTS "Editors can create market analyses" ON market_analyses;

  -- User Metadata policies
  DROP POLICY IF EXISTS "Users can view their own metadata" ON user_metadata;
  DROP POLICY IF EXISTS "System admins and clinic owners can manage user metadata" ON user_metadata;

  -- Price Tables policies
  DROP POLICY IF EXISTS "Anyone can view price tables" ON price_tables;
  DROP POLICY IF EXISTS "System admins can manage price tables" ON price_tables;

  -- Print Orders policies
  DROP POLICY IF EXISTS "Users can view their clinic's print orders" ON print_orders;
  DROP POLICY IF EXISTS "Users can create print orders for their clinic" ON print_orders;
  DROP POLICY IF EXISTS "System admins can manage all print orders" ON print_orders;
END $$;

-- ============================================
-- Create new policies
-- ============================================

-- Clinics RLS Policies
CREATE POLICY "Users can view their own clinic"
  ON clinics FOR SELECT
  USING (
    owner_id = auth.uid() OR
    id IN (SELECT clinic_id FROM user_metadata WHERE user_id = auth.uid()) OR
    EXISTS (SELECT 1 FROM user_metadata WHERE user_id = auth.uid() AND role = 'system_admin')
  );

CREATE POLICY "Clinic owners can update their clinic"
  ON clinics FOR UPDATE
  USING (
    owner_id = auth.uid() OR
    EXISTS (SELECT 1 FROM user_metadata WHERE user_id = auth.uid() AND clinic_id = id AND role IN ('clinic_owner'))
  );

CREATE POLICY "System admins can insert clinics"
  ON clinics FOR INSERT
  WITH CHECK (
    EXISTS (SELECT 1 FROM user_metadata WHERE user_id = auth.uid() AND role = 'system_admin')
  );

-- Monthly Data RLS Policies
CREATE POLICY "Users can view monthly data for their clinic"
  ON monthly_data FOR SELECT
  USING (
    clinic_id IN (SELECT id FROM clinics WHERE owner_id = auth.uid()) OR
    clinic_id IN (SELECT clinic_id FROM user_metadata WHERE user_id = auth.uid()) OR
    EXISTS (SELECT 1 FROM user_metadata WHERE user_id = auth.uid() AND role = 'system_admin')
  );

CREATE POLICY "Editors can modify monthly data"
  ON monthly_data FOR ALL
  USING (
    clinic_id IN (SELECT id FROM clinics WHERE owner_id = auth.uid()) OR
    clinic_id IN (SELECT clinic_id FROM user_metadata WHERE user_id = auth.uid() AND role IN ('clinic_owner', 'clinic_editor')) OR
    EXISTS (SELECT 1 FROM user_metadata WHERE user_id = auth.uid() AND role = 'system_admin')
  );

-- Simulations RLS Policies
CREATE POLICY "Users can view simulations for their clinic"
  ON simulations FOR SELECT
  USING (
    clinic_id IN (SELECT id FROM clinics WHERE owner_id = auth.uid()) OR
    clinic_id IN (SELECT clinic_id FROM user_metadata WHERE user_id = auth.uid()) OR
    EXISTS (SELECT 1 FROM user_metadata WHERE user_id = auth.uid() AND role = 'system_admin')
  );

CREATE POLICY "Editors can create simulations"
  ON simulations FOR INSERT
  WITH CHECK (
    clinic_id IN (SELECT id FROM clinics WHERE owner_id = auth.uid()) OR
    clinic_id IN (SELECT clinic_id FROM user_metadata WHERE user_id = auth.uid() AND role IN ('clinic_owner', 'clinic_editor'))
  );

-- Reports RLS Policies
CREATE POLICY "Users can view reports for their clinic"
  ON reports FOR SELECT
  USING (
    clinic_id IN (SELECT id FROM clinics WHERE owner_id = auth.uid()) OR
    clinic_id IN (SELECT clinic_id FROM user_metadata WHERE user_id = auth.uid()) OR
    EXISTS (SELECT 1 FROM user_metadata WHERE user_id = auth.uid() AND role = 'system_admin')
  );

CREATE POLICY "Users can create reports for their clinic"
  ON reports FOR INSERT
  WITH CHECK (
    clinic_id IN (SELECT id FROM clinics WHERE owner_id = auth.uid()) OR
    clinic_id IN (SELECT clinic_id FROM user_metadata WHERE user_id = auth.uid())
  );

-- Market Analyses RLS Policies
CREATE POLICY "Users can view market analyses for their clinic"
  ON market_analyses FOR SELECT
  USING (
    clinic_id IN (SELECT id FROM clinics WHERE owner_id = auth.uid()) OR
    clinic_id IN (SELECT clinic_id FROM user_metadata WHERE user_id = auth.uid()) OR
    EXISTS (SELECT 1 FROM user_metadata WHERE user_id = auth.uid() AND role = 'system_admin')
  );

CREATE POLICY "Editors can create market analyses"
  ON market_analyses FOR INSERT
  WITH CHECK (
    clinic_id IN (SELECT id FROM clinics WHERE owner_id = auth.uid()) OR
    clinic_id IN (SELECT clinic_id FROM user_metadata WHERE user_id = auth.uid() AND role IN ('clinic_owner', 'clinic_editor'))
  );

-- User Metadata RLS Policies
CREATE POLICY "Users can view their own metadata"
  ON user_metadata FOR SELECT
  USING (
    user_id = auth.uid() OR
    EXISTS (SELECT 1 FROM user_metadata WHERE user_id = auth.uid() AND role = 'system_admin')
  );

CREATE POLICY "System admins and clinic owners can manage user metadata"
  ON user_metadata FOR ALL
  USING (
    EXISTS (SELECT 1 FROM user_metadata WHERE user_id = auth.uid() AND (
      role = 'system_admin' OR
      (role = 'clinic_owner' AND clinic_id = user_metadata.clinic_id)
    ))
  );

-- Price Tables RLS Policies (全員が閲覧可能)
CREATE POLICY "Anyone can view price tables"
  ON price_tables FOR SELECT
  USING (true);

CREATE POLICY "System admins can manage price tables"
  ON price_tables FOR ALL
  USING (
    EXISTS (SELECT 1 FROM user_metadata WHERE user_id = auth.uid() AND role = 'system_admin')
  );

-- Print Orders RLS Policies
CREATE POLICY "Users can view their clinic's print orders"
  ON print_orders FOR SELECT
  USING (
    clinic_id IN (SELECT id FROM clinics WHERE owner_id = auth.uid()) OR
    clinic_id IN (SELECT clinic_id FROM user_metadata WHERE user_id = auth.uid()) OR
    EXISTS (SELECT 1 FROM user_metadata WHERE user_id = auth.uid() AND role = 'system_admin')
  );

CREATE POLICY "Users can create print orders for their clinic"
  ON print_orders FOR INSERT
  WITH CHECK (
    clinic_id IN (SELECT id FROM clinics WHERE owner_id = auth.uid()) OR
    clinic_id IN (SELECT clinic_id FROM user_metadata WHERE user_id = auth.uid())
  );

CREATE POLICY "System admins can manage all print orders"
  ON print_orders FOR UPDATE
  USING (
    EXISTS (SELECT 1 FROM user_metadata WHERE user_id = auth.uid() AND role = 'system_admin')
  );

-- ============================================
-- Functions and Triggers
-- ============================================

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ language 'plpgsql';

-- Drop existing triggers (if any)
DROP TRIGGER IF EXISTS update_clinics_updated_at ON clinics;
DROP TRIGGER IF EXISTS update_monthly_data_updated_at ON monthly_data;
DROP TRIGGER IF EXISTS update_simulations_updated_at ON simulations;
DROP TRIGGER IF EXISTS update_market_analyses_updated_at ON market_analyses;
DROP TRIGGER IF EXISTS update_user_metadata_updated_at ON user_metadata;
DROP TRIGGER IF EXISTS update_price_tables_updated_at ON price_tables;
DROP TRIGGER IF EXISTS update_print_orders_updated_at ON print_orders;

-- Triggers for updated_at
CREATE TRIGGER update_clinics_updated_at BEFORE UPDATE ON clinics
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_monthly_data_updated_at BEFORE UPDATE ON monthly_data
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_simulations_updated_at BEFORE UPDATE ON simulations
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_market_analyses_updated_at BEFORE UPDATE ON market_analyses
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_user_metadata_updated_at BEFORE UPDATE ON user_metadata
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_price_tables_updated_at BEFORE UPDATE ON price_tables
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_print_orders_updated_at BEFORE UPDATE ON print_orders
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
