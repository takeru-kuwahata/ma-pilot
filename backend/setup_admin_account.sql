-- MA-Pilot 親アカウント（システム管理者）セットアップSQL
-- Supabase SQL Editorで実行してください
--
-- 対象アカウント:
--   メール: kuwahata@idw-japan.net
--   パスワード: advance2026
--   権限: system_admin（全機能アクセス + ユーザー管理）

-- ============================================
-- ステップ1: 既存ユーザーのパスワード更新 または 新規ユーザー作成
-- ============================================

-- 方法A: 既存ユーザー（admin@ma-pilot.local）のメールアドレスとパスワードを変更
-- 注意: この方法は既存データを保持しますが、メールアドレスの変更は推奨されません

-- 方法B: 新規ユーザーを作成（推奨）
-- Supabase Dashboard → Authentication → Users → "Add user" で以下を入力:
--   Email: kuwahata@idw-japan.net
--   Password: advance2026
--   Auto Confirm User: チェックを入れる

-- 以下のSQLは方法Bの後に実行してください

-- ============================================
-- ステップ2: user_metadataテーブルに管理者権限を設定
-- ============================================

-- 新規ユーザー（kuwahata@idw-japan.net）のIDを取得してuser_metadataに追加
INSERT INTO user_metadata (user_id, clinic_id, role)
SELECT
  id,
  NULL,  -- system_adminはclinic_id不要
  'system_admin'
FROM auth.users
WHERE email = 'kuwahata@idw-japan.net'
ON CONFLICT (user_id) DO UPDATE SET
  clinic_id = EXCLUDED.clinic_id,
  role = EXCLUDED.role,
  updated_at = now();

-- ============================================
-- ステップ3: 旧管理者アカウント（admin@ma-pilot.local）を削除（オプション）
-- ============================================

-- 注意: 新しいアカウントでログイン確認後に実行してください

-- user_metadataから削除
DELETE FROM user_metadata
WHERE user_id IN (
  SELECT id FROM auth.users WHERE email = 'admin@ma-pilot.local'
);

-- auth.usersから削除
-- 注意: Supabase Dashboardから削除することを推奨
-- DELETE FROM auth.users WHERE email = 'admin@ma-pilot.local';

-- ============================================
-- 確認クエリ
-- ============================================

-- 新しい管理者アカウントの確認
SELECT
  u.id,
  u.email,
  u.email_confirmed_at,
  um.role,
  um.clinic_id
FROM auth.users u
LEFT JOIN user_metadata um ON u.id = um.user_id
WHERE u.email = 'kuwahata@idw-japan.net';

-- すべてのユーザー一覧
SELECT
  u.id,
  u.email,
  um.role,
  um.clinic_id,
  u.created_at
FROM auth.users u
LEFT JOIN user_metadata um ON u.id = um.user_id
ORDER BY u.created_at DESC;
