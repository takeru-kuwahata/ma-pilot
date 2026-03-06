-- price_tablesテーブルのRLS設定を修正
-- 実行場所: Supabase SQL Editor

-- RLSを有効化（既に有効な場合はスキップされる）
ALTER TABLE price_tables ENABLE ROW LEVEL SECURITY;

-- 既存のポリシーを削除
DROP POLICY IF EXISTS "Public read access for price_tables" ON price_tables;
DROP POLICY IF EXISTS "Anyone can read price tables" ON price_tables;

-- 新しいポリシー: 全ユーザー（認証済み・未認証含む）が価格表を閲覧可能
CREATE POLICY "Public read access for price_tables"
  ON price_tables
  FOR SELECT
  USING (true);

-- システム管理者のみが価格表を更新可能
CREATE POLICY "System admins can manage price tables"
  ON price_tables
  FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM user_metadata
      WHERE user_id = auth.uid()
      AND role = 'system_admin'
    )
  );

-- 確認
SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual, with_check
FROM pg_policies
WHERE tablename = 'price_tables';
