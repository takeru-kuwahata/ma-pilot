-- MA-Pilot 管理者パスワードリセットSQL
-- Supabase SQL Editorで実行してください
--
-- 注意: このSQLは管理者パスワードを「DevAdmin2025A」にリセットします

-- ============================================
-- 方法1: Supabase Admin APIを使う（推奨）
-- ============================================
--
-- Supabase Dashboard で以下の手順を実行してください:
-- 1. Authentication → Users
-- 2. admin@ma-pilot.local ユーザーを選択
-- 3. 「Send password reset email」をクリック
-- 4. メールのリンクからパスワードを「DevAdmin2025A」に変更

-- ============================================
-- 方法2: SQL経由でパスワードハッシュを直接更新（非推奨）
-- ============================================
--
-- 警告: この方法は推奨されません。Supabase Authの内部実装に依存します。
-- 必ず方法1を使用してください。

-- 以下のコマンドをローカルで実行してパスワードハッシュを生成:
-- python3 -c "from passlib.hash import bcrypt; print(bcrypt.hash('DevAdmin2025A'))"

-- その後、以下のクエリでパスワードハッシュを更新:
-- UPDATE auth.users
-- SET encrypted_password = '[生成されたハッシュ]'
-- WHERE email = 'admin@ma-pilot.local';

-- ============================================
-- 確認クエリ
-- ============================================

-- 管理者ユーザーの存在確認
SELECT id, email, email_confirmed_at, created_at
FROM auth.users
WHERE email = 'admin@ma-pilot.local';
