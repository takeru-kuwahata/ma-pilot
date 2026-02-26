-- ============================================
-- price_tables RLSポリシー修正
-- ============================================

-- 既存のポリシーを削除
DROP POLICY IF EXISTS "価格マスタは認証済みユーザーが閲覧可能" ON price_tables;
DROP POLICY IF EXISTS "価格マスタはシステム管理者のみ編集可能" ON price_tables;

-- 読み取りポリシー（anonユーザーも含む全ユーザーが読み取り可能）
CREATE POLICY "価格マスタは全ユーザーが閲覧可能"
  ON price_tables
  FOR SELECT
  USING (true);

-- 挿入・更新・削除ポリシー（system_adminのみ）
CREATE POLICY "価格マスタはシステム管理者のみ編集可能"
  ON price_tables
  FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM user_metadata
      WHERE user_id = auth.uid()
      AND role = 'system_admin'
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM user_metadata
      WHERE user_id = auth.uid()
      AND role = 'system_admin'
    )
  );

-- 確認クエリ
SELECT
  schemaname,
  tablename,
  policyname,
  permissive,
  roles,
  cmd,
  qual,
  with_check
FROM pg_policies
WHERE tablename = 'price_tables';
