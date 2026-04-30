-- ============================================================
-- MA-Pilot 経営コンサルテーション・ゲーミフィケーション
-- Supabase マイグレーション SQL
-- Supabase Dashboard > SQL Editor で実行してください
-- ============================================================

-- 1. 提携企業マスター
CREATE TABLE IF NOT EXISTS partner_companies (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(100) NOT NULL,
  description TEXT,
  logo_url VARCHAR(500),
  is_active BOOLEAN NOT NULL DEFAULT true,
  display_priority INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 2. 提携サービス・プロダクト
CREATE TABLE IF NOT EXISTS partner_services (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID NOT NULL REFERENCES partner_companies(id) ON DELETE CASCADE,
  service_name VARCHAR(100) NOT NULL,
  catchcopy VARCHAR(50),
  description TEXT,
  price_range VARCHAR(100),       -- 例: "月額3万円〜"
  service_url VARCHAR(500),
  coupon_code VARCHAR(100),
  coupon_detail TEXT,
  apply_method TEXT,              -- 申し込み方法
  display_priority INTEGER NOT NULL DEFAULT 0,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 3. サービスと課題タグの紐づけ（多対多）
CREATE TABLE IF NOT EXISTS service_problem_tags (
  service_id UUID NOT NULL REFERENCES partner_services(id) ON DELETE CASCADE,
  problem_tag VARCHAR(50) NOT NULL,
  PRIMARY KEY (service_id, problem_tag)
);

-- 4. レコメンド表示・クリックログ
CREATE TABLE IF NOT EXISTS recommendation_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  clinic_id UUID NOT NULL REFERENCES clinics(id) ON DELETE CASCADE,
  service_id UUID NOT NULL REFERENCES partner_services(id) ON DELETE CASCADE,
  problem_tag VARCHAR(50),
  shown_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  clicked_at TIMESTAMPTZ,
  converted_at TIMESTAMPTZ        -- 成約確認日（手動更新）
);

-- 5. 医院ゲーミフィケーション状態
CREATE TABLE IF NOT EXISTS clinic_gamification (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  clinic_id UUID NOT NULL REFERENCES clinics(id) ON DELETE CASCADE UNIQUE,
  -- ランク
  current_rank VARCHAR(20) NOT NULL DEFAULT 'bronze',  -- bronze/silver/gold/platinum/diamond
  total_score INTEGER NOT NULL DEFAULT 0,
  -- 能力パラメーター（0-100）
  param_acquisition INTEGER NOT NULL DEFAULT 0,   -- 集患力
  param_revenue INTEGER NOT NULL DEFAULT 0,       -- 収益力
  param_stability INTEGER NOT NULL DEFAULT 0,     -- 経営安定性
  param_growth INTEGER NOT NULL DEFAULT 0,        -- 成長性
  param_market INTEGER NOT NULL DEFAULT 0,        -- 診療圏競争力
  -- 継続記録
  consecutive_months INTEGER NOT NULL DEFAULT 0,  -- 連続入力月数
  total_input_months INTEGER NOT NULL DEFAULT 0,  -- 累計入力月数
  last_input_month VARCHAR(7),                    -- 最終入力年月 YYYY-MM
  -- 節目フラグ（表示済み管理）
  milestone_flags JSONB NOT NULL DEFAULT '{}',    -- {"first_input": true, "3months": true, ...}
  -- 選択キャラクター
  character_type VARCHAR(20) NOT NULL DEFAULT 'advanbi',  -- advanbi/assistant/doctor
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================================
-- インデックス
-- ============================================================
CREATE INDEX IF NOT EXISTS idx_partner_services_company ON partner_services(company_id);
CREATE INDEX IF NOT EXISTS idx_partner_services_active ON partner_services(is_active, display_priority DESC);
CREATE INDEX IF NOT EXISTS idx_service_problem_tags_tag ON service_problem_tags(problem_tag);
CREATE INDEX IF NOT EXISTS idx_recommendation_logs_clinic ON recommendation_logs(clinic_id, shown_at DESC);
CREATE INDEX IF NOT EXISTS idx_clinic_gamification_clinic ON clinic_gamification(clinic_id);

-- ============================================================
-- RLS (Row Level Security)
-- ============================================================
ALTER TABLE partner_companies ENABLE ROW LEVEL SECURITY;
ALTER TABLE partner_services ENABLE ROW LEVEL SECURITY;
ALTER TABLE service_problem_tags ENABLE ROW LEVEL SECURITY;
ALTER TABLE recommendation_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE clinic_gamification ENABLE ROW LEVEL SECURITY;

-- partner_companies: 全認証ユーザーが読める、書き込みはサービスロール（バックエンド）のみ
CREATE POLICY "partner_companies_read" ON partner_companies
  FOR SELECT TO authenticated USING (true);

-- partner_services: 全認証ユーザーが読める
CREATE POLICY "partner_services_read" ON partner_services
  FOR SELECT TO authenticated USING (is_active = true);

-- service_problem_tags: 全認証ユーザーが読める
CREATE POLICY "service_problem_tags_read" ON service_problem_tags
  FOR SELECT TO authenticated USING (true);

-- recommendation_logs: 自分の医院のみ読める
CREATE POLICY "recommendation_logs_read" ON recommendation_logs
  FOR SELECT TO authenticated
  USING (clinic_id IN (
    SELECT clinic_id FROM user_metadata WHERE user_id = auth.uid()
  ));

CREATE POLICY "recommendation_logs_insert" ON recommendation_logs
  FOR INSERT TO authenticated WITH CHECK (true);

CREATE POLICY "recommendation_logs_update" ON recommendation_logs
  FOR UPDATE TO authenticated
  USING (clinic_id IN (
    SELECT clinic_id FROM user_metadata WHERE user_id = auth.uid()
  ));

-- clinic_gamification: 自分の医院のみ読める
CREATE POLICY "clinic_gamification_read" ON clinic_gamification
  FOR SELECT TO authenticated
  USING (clinic_id IN (
    SELECT clinic_id FROM user_metadata WHERE user_id = auth.uid()
  ));

-- ============================================================
-- サンプルデータ（テスト用）
-- ============================================================
INSERT INTO partner_companies (name, description, display_priority) VALUES
  ('サンプル歯科マーケ株式会社', 'Web集患・MEO対策専門会社', 10),
  ('デンタルスタッフ研修センター', '歯科スタッフ向け自費提案研修', 9),
  ('歯科向けリコールシステム社', 'LINE連携リコール自動化システム', 8)
ON CONFLICT DO NOTHING;
