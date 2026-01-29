-- MA-Pilot user_metadata RLS修正SQL
-- 無限再帰エラーを解決するため、正しいRLSポリシーを作成
-- Supabase SQL Editorで実行してください

-- ============================================
-- 既存ポリシーを削除
-- ============================================

DROP POLICY IF EXISTS "Users can view their own metadata" ON user_metadata;
DROP POLICY IF EXISTS "System admins and clinic owners can manage user metadata" ON user_metadata;
DROP POLICY IF EXISTS "Users can view own metadata" ON user_metadata;
DROP POLICY IF EXISTS "Users can update own metadata" ON user_metadata;
DROP POLICY IF EXISTS "System admins can view all metadata" ON user_metadata;
DROP POLICY IF EXISTS "System admins can manage all metadata" ON user_metadata;

-- ============================================
-- 新しいポリシーを作成（無限再帰を回避）
-- ============================================

-- ポリシー1: ユーザーは自分のメタデータを閲覧可能
-- 重要: user_metadataテーブル自体を参照しないため、無限再帰を回避
CREATE POLICY "Users can view their own metadata"
  ON user_metadata
  FOR SELECT
  USING (user_id = auth.uid());

-- ポリシー2: ユーザーは自分のメタデータを更新可能（通常は不要だが念のため）
CREATE POLICY "Users can update their own metadata"
  ON user_metadata
  FOR UPDATE
  USING (user_id = auth.uid());

-- ポリシー3: サービスロールは全てのメタデータにアクセス可能
-- 注意: これはバックエンドからのアクセス用（Service Role Key使用時）
-- フロントエンドからは使用不可

-- ============================================
-- RLS有効化確認
-- ============================================

ALTER TABLE user_metadata ENABLE ROW LEVEL SECURITY;

-- ============================================
-- 確認クエリ
-- ============================================

-- ポリシー一覧を確認
SELECT
  schemaname,
  tablename,
  policyname,
  permissive,
  roles,
  cmd,
  qual
FROM pg_policies
WHERE tablename = 'user_metadata';

-- user_metadataテーブルのRLS状態を確認
SELECT
  tablename,
  rowsecurity
FROM pg_tables
WHERE tablename = 'user_metadata';

-- ============================================
-- テスト（オプション）
-- ============================================

-- 現在のユーザーのメタデータを取得できるか確認
SELECT * FROM user_metadata WHERE user_id = auth.uid();
