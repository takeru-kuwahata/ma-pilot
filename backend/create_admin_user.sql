-- MA-Pilot 親アカウント作成SQL
-- Supabase SQL Editorで実行してください
--
-- アカウント情報:
--   メール: kuwahata@idw-japan.net
--   パスワード: advance2026
--   権限: system_admin

-- ============================================
-- ステップ1: 既存ユーザーの確認
-- ============================================

SELECT
  id,
  email,
  email_confirmed_at,
  created_at,
  encrypted_password IS NOT NULL as has_password
FROM auth.users
WHERE email = 'kuwahata@idw-japan.net';

-- 結果が0件の場合: ユーザーが存在しません → Supabase Dashboardから作成してください
-- 結果が1件の場合: ユーザーは存在します → ステップ2へ

-- ============================================
-- ステップ2: user_metadataの確認と作成
-- ============================================

-- 既存のuser_metadataを確認
SELECT
  um.user_id,
  um.role,
  um.clinic_id,
  u.email
FROM user_metadata um
JOIN auth.users u ON u.id = um.user_id
WHERE u.email = 'kuwahata@idw-japan.net';

-- user_metadataが存在しない場合、以下を実行:
INSERT INTO user_metadata (user_id, clinic_id, role)
SELECT
  id,
  NULL,
  'system_admin'
FROM auth.users
WHERE email = 'kuwahata@idw-japan.net'
ON CONFLICT (user_id) DO UPDATE SET
  role = EXCLUDED.role,
  clinic_id = EXCLUDED.clinic_id,
  updated_at = now();

-- ============================================
-- ステップ3: パスワードリセット（必要な場合）
-- ============================================

-- 注意: SQLから直接パスワードを設定することは推奨されません
-- Supabase Dashboard → Authentication → Users → ユーザー選択 → "..." → "Reset Password"
-- から設定してください

-- または、bcryptハッシュを使用して直接設定:
-- UPDATE auth.users
-- SET encrypted_password = crypt('advance2026', gen_salt('bf')),
--     email_confirmed_at = now()
-- WHERE email = 'kuwahata@idw-japan.net';

-- ============================================
-- ステップ4: 確認クエリ
-- ============================================

-- 完全な情報を確認
SELECT
  u.id,
  u.email,
  u.email_confirmed_at,
  um.role,
  um.clinic_id,
  u.created_at
FROM auth.users u
LEFT JOIN user_metadata um ON u.id = um.user_id
WHERE u.email = 'kuwahata@idw-japan.net';

-- 期待される結果:
-- email: kuwahata@idw-japan.net
-- email_confirmed_at: (日時が表示されていればOK、NULLの場合はメール未確認)
-- role: system_admin
-- clinic_id: NULL（system_adminはclinic不要）
