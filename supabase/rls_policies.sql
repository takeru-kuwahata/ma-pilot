-- ==========================================
-- MA-Pilot Row Level Security (RLS) Policies
-- 作成日: 2025-12-26
-- 目的: 全テーブルに対する包括的なRLSポリシー設定
-- ==========================================

-- ==========================================
-- 前提条件:
-- - auth.users テーブルにユーザーが存在すること
-- - user_metadata テーブルに role と clinic_id が設定されていること
-- ==========================================

-- ==========================================
-- ヘルパー関数: 現在のユーザーのロール取得
-- ==========================================
CREATE OR REPLACE FUNCTION get_user_role()
RETURNS TEXT AS $$
BEGIN
  RETURN (SELECT role FROM user_metadata WHERE user_id = auth.uid());
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ==========================================
-- ヘルパー関数: 現在のユーザーのクリニックID取得
-- ==========================================
CREATE OR REPLACE FUNCTION get_user_clinic_id()
RETURNS UUID AS $$
BEGIN
  RETURN (SELECT clinic_id FROM user_metadata WHERE user_id = auth.uid());
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ==========================================
-- ヘルパー関数: システム管理者かどうか
-- ==========================================
CREATE OR REPLACE FUNCTION is_system_admin()
RETURNS BOOLEAN AS $$
BEGIN
  RETURN (SELECT role = 'system_admin' FROM user_metadata WHERE user_id = auth.uid());
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ==========================================
-- ヘルパー関数: クリニックオーナーかどうか
-- ==========================================
CREATE OR REPLACE FUNCTION is_clinic_owner(target_clinic_id UUID)
RETURNS BOOLEAN AS $$
BEGIN
  RETURN (
    SELECT role = 'clinic_owner' AND clinic_id = target_clinic_id
    FROM user_metadata
    WHERE user_id = auth.uid()
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ==========================================
-- ヘルパー関数: クリニック編集者以上かどうか
-- ==========================================
CREATE OR REPLACE FUNCTION is_clinic_editor_or_above(target_clinic_id UUID)
RETURNS BOOLEAN AS $$
BEGIN
  RETURN (
    SELECT role IN ('clinic_owner', 'clinic_editor') AND clinic_id = target_clinic_id
    FROM user_metadata
    WHERE user_id = auth.uid()
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ==========================================
-- ヘルパー関数: クリニックへのアクセス権限があるか
-- ==========================================
CREATE OR REPLACE FUNCTION has_clinic_access(target_clinic_id UUID)
RETURNS BOOLEAN AS $$
BEGIN
  RETURN (
    SELECT clinic_id = target_clinic_id OR role = 'system_admin'
    FROM user_metadata
    WHERE user_id = auth.uid()
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ==========================================
-- 1. clinics テーブル - RLS有効化
-- ==========================================
ALTER TABLE clinics ENABLE ROW LEVEL SECURITY;

-- 既存のポリシーを削除（再実行に対応）
DROP POLICY IF EXISTS "clinic_select_policy" ON clinics;
DROP POLICY IF EXISTS "clinic_insert_policy" ON clinics;
DROP POLICY IF EXISTS "clinic_update_policy" ON clinics;
DROP POLICY IF EXISTS "clinic_delete_policy" ON clinics;

-- SELECT: 自クリニックまたはシステム管理者のみ閲覧可能
CREATE POLICY "clinic_select_policy"
  ON clinics FOR SELECT
  USING (
    has_clinic_access(id) OR
    owner_id = auth.uid()
  );

-- INSERT: システム管理者のみ
CREATE POLICY "clinic_insert_policy"
  ON clinics FOR INSERT
  WITH CHECK (is_system_admin());

-- UPDATE: クリニックオーナー以上またはシステム管理者
CREATE POLICY "clinic_update_policy"
  ON clinics FOR UPDATE
  USING (
    is_clinic_owner(id) OR
    is_system_admin() OR
    owner_id = auth.uid()
  );

-- DELETE: システム管理者のみ
CREATE POLICY "clinic_delete_policy"
  ON clinics FOR DELETE
  USING (is_system_admin());

-- ==========================================
-- 2. monthly_data テーブル - RLS有効化
-- ==========================================
ALTER TABLE monthly_data ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "monthly_data_select_policy" ON monthly_data;
DROP POLICY IF EXISTS "monthly_data_insert_policy" ON monthly_data;
DROP POLICY IF EXISTS "monthly_data_update_policy" ON monthly_data;
DROP POLICY IF EXISTS "monthly_data_delete_policy" ON monthly_data;

-- SELECT: 自クリニックのデータのみ
CREATE POLICY "monthly_data_select_policy"
  ON monthly_data FOR SELECT
  USING (has_clinic_access(clinic_id));

-- INSERT: クリニック編集者以上
CREATE POLICY "monthly_data_insert_policy"
  ON monthly_data FOR INSERT
  WITH CHECK (
    is_clinic_editor_or_above(clinic_id) OR
    is_system_admin()
  );

-- UPDATE: クリニック編集者以上
CREATE POLICY "monthly_data_update_policy"
  ON monthly_data FOR UPDATE
  USING (
    is_clinic_editor_or_above(clinic_id) OR
    is_system_admin()
  );

-- DELETE: クリニック編集者以上
CREATE POLICY "monthly_data_delete_policy"
  ON monthly_data FOR DELETE
  USING (
    is_clinic_editor_or_above(clinic_id) OR
    is_system_admin()
  );

-- ==========================================
-- 3. simulations テーブル - RLS有効化
-- ==========================================
ALTER TABLE simulations ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "simulations_select_policy" ON simulations;
DROP POLICY IF EXISTS "simulations_insert_policy" ON simulations;
DROP POLICY IF EXISTS "simulations_update_policy" ON simulations;
DROP POLICY IF EXISTS "simulations_delete_policy" ON simulations;

-- SELECT: 自クリニックのデータのみ
CREATE POLICY "simulations_select_policy"
  ON simulations FOR SELECT
  USING (has_clinic_access(clinic_id));

-- INSERT: クリニック編集者以上
CREATE POLICY "simulations_insert_policy"
  ON simulations FOR INSERT
  WITH CHECK (
    is_clinic_editor_or_above(clinic_id) OR
    is_system_admin()
  );

-- UPDATE: クリニック編集者以上（自クリニックのみ）
CREATE POLICY "simulations_update_policy"
  ON simulations FOR UPDATE
  USING (
    is_clinic_editor_or_above(clinic_id) OR
    is_system_admin()
  );

-- DELETE: クリニック編集者以上（自クリニックのみ）
CREATE POLICY "simulations_delete_policy"
  ON simulations FOR DELETE
  USING (
    is_clinic_editor_or_above(clinic_id) OR
    is_system_admin()
  );

-- ==========================================
-- 4. reports テーブル - RLS有効化
-- ==========================================
ALTER TABLE reports ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "reports_select_policy" ON reports;
DROP POLICY IF EXISTS "reports_insert_policy" ON reports;
DROP POLICY IF EXISTS "reports_update_policy" ON reports;
DROP POLICY IF EXISTS "reports_delete_policy" ON reports;

-- SELECT: 自クリニックのデータのみ
CREATE POLICY "reports_select_policy"
  ON reports FOR SELECT
  USING (has_clinic_access(clinic_id));

-- INSERT: クリニック編集者以上
CREATE POLICY "reports_insert_policy"
  ON reports FOR INSERT
  WITH CHECK (
    is_clinic_editor_or_above(clinic_id) OR
    is_system_admin()
  );

-- UPDATE: システム管理者のみ
CREATE POLICY "reports_update_policy"
  ON reports FOR UPDATE
  USING (is_system_admin());

-- DELETE: システム管理者のみ
CREATE POLICY "reports_delete_policy"
  ON reports FOR DELETE
  USING (is_system_admin());

-- ==========================================
-- 5. market_analyses テーブル - RLS有効化
-- ==========================================
ALTER TABLE market_analyses ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "market_analyses_select_policy" ON market_analyses;
DROP POLICY IF EXISTS "market_analyses_insert_policy" ON market_analyses;
DROP POLICY IF EXISTS "market_analyses_update_policy" ON market_analyses;
DROP POLICY IF EXISTS "market_analyses_delete_policy" ON market_analyses;

-- SELECT: 自クリニックのデータのみ
CREATE POLICY "market_analyses_select_policy"
  ON market_analyses FOR SELECT
  USING (has_clinic_access(clinic_id));

-- INSERT: クリニック編集者以上
CREATE POLICY "market_analyses_insert_policy"
  ON market_analyses FOR INSERT
  WITH CHECK (
    is_clinic_editor_or_above(clinic_id) OR
    is_system_admin()
  );

-- UPDATE: クリニック編集者以上
CREATE POLICY "market_analyses_update_policy"
  ON market_analyses FOR UPDATE
  USING (
    is_clinic_editor_or_above(clinic_id) OR
    is_system_admin()
  );

-- DELETE: システム管理者のみ
CREATE POLICY "market_analyses_delete_policy"
  ON market_analyses FOR DELETE
  USING (is_system_admin());

-- ==========================================
-- 6. user_metadata テーブル - RLS有効化
-- ==========================================
ALTER TABLE user_metadata ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "user_metadata_select_policy" ON user_metadata;
DROP POLICY IF EXISTS "user_metadata_insert_policy" ON user_metadata;
DROP POLICY IF EXISTS "user_metadata_update_policy" ON user_metadata;
DROP POLICY IF EXISTS "user_metadata_delete_policy" ON user_metadata;

-- SELECT: 自分自身、同じクリニックのユーザー、システム管理者
CREATE POLICY "user_metadata_select_policy"
  ON user_metadata FOR SELECT
  USING (
    user_id = auth.uid() OR
    (clinic_id = get_user_clinic_id() AND get_user_role() IN ('clinic_owner', 'system_admin')) OR
    is_system_admin()
  );

-- INSERT: システム管理者またはクリニックオーナー（自クリニックのみ）
CREATE POLICY "user_metadata_insert_policy"
  ON user_metadata FOR INSERT
  WITH CHECK (
    is_system_admin() OR
    (is_clinic_owner(clinic_id) AND role IN ('clinic_editor', 'clinic_viewer'))
  );

-- UPDATE: システム管理者またはクリニックオーナー（自クリニックのみ）
CREATE POLICY "user_metadata_update_policy"
  ON user_metadata FOR UPDATE
  USING (
    is_system_admin() OR
    (is_clinic_owner(clinic_id) AND role IN ('clinic_editor', 'clinic_viewer'))
  );

-- DELETE: システム管理者のみ
CREATE POLICY "user_metadata_delete_policy"
  ON user_metadata FOR DELETE
  USING (is_system_admin());

-- ==========================================
-- 7. print_orders テーブル - RLS有効化
-- ==========================================
ALTER TABLE print_orders ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "print_orders_select_policy" ON print_orders;
DROP POLICY IF EXISTS "print_orders_insert_policy" ON print_orders;
DROP POLICY IF EXISTS "print_orders_update_policy" ON print_orders;
DROP POLICY IF EXISTS "print_orders_delete_policy" ON print_orders;

-- SELECT: 全ユーザー可能（公開フォーム、MVP版暫定）
-- 本番環境では、自分のメールアドレスで登録したもののみに制限すべき
CREATE POLICY "print_orders_select_policy"
  ON print_orders FOR SELECT
  USING (true);

-- INSERT: 全ユーザー可能（公開受注フォーム）
CREATE POLICY "print_orders_insert_policy"
  ON print_orders FOR INSERT
  WITH CHECK (true);

-- UPDATE: システム管理者のみ（注文ステータス変更等）
CREATE POLICY "print_orders_update_policy"
  ON print_orders FOR UPDATE
  USING (is_system_admin());

-- DELETE: システム管理者のみ
CREATE POLICY "print_orders_delete_policy"
  ON print_orders FOR DELETE
  USING (is_system_admin());

-- ==========================================
-- 8. price_tables テーブル - RLS有効化
-- ==========================================
ALTER TABLE price_tables ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "price_tables_select_policy" ON price_tables;
DROP POLICY IF EXISTS "price_tables_insert_policy" ON price_tables;
DROP POLICY IF EXISTS "price_tables_update_policy" ON price_tables;
DROP POLICY IF EXISTS "price_tables_delete_policy" ON price_tables;

-- SELECT: 全ユーザー可能（公開価格表）
CREATE POLICY "price_tables_select_policy"
  ON price_tables FOR SELECT
  USING (true);

-- INSERT: システム管理者のみ
CREATE POLICY "price_tables_insert_policy"
  ON price_tables FOR INSERT
  WITH CHECK (is_system_admin());

-- UPDATE: システム管理者のみ
CREATE POLICY "price_tables_update_policy"
  ON price_tables FOR UPDATE
  USING (is_system_admin());

-- DELETE: システム管理者のみ
CREATE POLICY "price_tables_delete_policy"
  ON price_tables FOR DELETE
  USING (is_system_admin());

-- ==========================================
-- 9. セキュリティ監査ログテーブル（新規作成）
-- ==========================================
CREATE TABLE IF NOT EXISTS security_audit_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  event_type TEXT NOT NULL, -- 'login', 'logout', 'data_access', 'data_modification', 'permission_change', 'failed_auth'
  table_name TEXT, -- 操作対象のテーブル名
  record_id UUID, -- 操作対象のレコードID
  details JSONB, -- 追加詳細情報
  ip_address INET, -- IPアドレス
  user_agent TEXT, -- ユーザーエージェント
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- インデックス作成
CREATE INDEX IF NOT EXISTS idx_security_audit_logs_user_id ON security_audit_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_security_audit_logs_event_type ON security_audit_logs(event_type);
CREATE INDEX IF NOT EXISTS idx_security_audit_logs_created_at ON security_audit_logs(created_at DESC);

-- RLS有効化（システム管理者のみ閲覧可能）
ALTER TABLE security_audit_logs ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "security_audit_logs_select_policy" ON security_audit_logs;
DROP POLICY IF EXISTS "security_audit_logs_insert_policy" ON security_audit_logs;

-- SELECT: システム管理者のみ
CREATE POLICY "security_audit_logs_select_policy"
  ON security_audit_logs FOR SELECT
  USING (is_system_admin());

-- INSERT: 全ユーザー可能（アプリケーションから自動記録）
CREATE POLICY "security_audit_logs_insert_policy"
  ON security_audit_logs FOR INSERT
  WITH CHECK (true);

-- ==========================================
-- 完了通知
-- ==========================================
DO $$
BEGIN
  RAISE NOTICE 'RLSポリシーの設定が完了しました。';
  RAISE NOTICE '全テーブルでRow Level Securityが有効化されています。';
  RAISE NOTICE '各ロールに応じたアクセス制御が適用されました。';
END $$;
