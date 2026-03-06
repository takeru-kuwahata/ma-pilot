# 管理者パスワードリセット手順

## 問題の概要

- ログイン時に422エラー（JSON decode error）が発生
- 原因: パスワード「`DevAdmin2025!`」の「`!`」がJSON parsingでエラー
- 解決策: 親アカウント（`kuwahata@idw-japan.net` / `advance2026`）に変更

## パスワードリセット手順

### 方法1: Supabase Dashboard（推奨）

1. **Supabase Dashboardにアクセス**
   - https://supabase.com/dashboard にログイン
   - MA-Pilotプロジェクトを選択

2. **Authentication → Users に移動**
   - 左サイドバーから「Authentication」をクリック
   - 「Users」タブを選択

3. **管理者ユーザーを探す**
   - メールアドレス「`kuwahata@idw-japan.net`」を検索
   - ユーザーが存在しない場合は、`docs/ADMIN_ACCOUNT_SETUP.md` を参照

4. **パスワードをリセット**
   - ユーザー行の右端の「...」メニューをクリック
   - 「Reset Password」を選択
   - **新しいパスワード**: `advance2026`
   - 「Update Password」をクリック

5. **メール確認をスキップ**
   - ユーザー詳細画面で「Email Confirmed」が `true` になっていることを確認
   - `false` の場合は、「...」メニューから「Confirm Email」を選択

### 方法2: Pythonスクリプト（環境変数設定済みの場合）

1. **環境変数を設定**
   ```bash
   # .env.localファイルに追加
   SUPABASE_URL=https://your-project.supabase.co
   SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
   ```

2. **スクリプトを実行**
   ```bash
   cd backend
   python reset_password.py
   ```

3. **完了確認**
   - 「✅ 完了！」メッセージが表示されればOK

### 方法3: SQL Editor（非推奨）

Supabase Authの内部実装に依存するため、推奨されません。
方法1または方法2を使用してください。

## 新規ユーザー作成（ユーザーが存在しない場合）

1. **Supabase Dashboard → Authentication → Users**

2. **「Add User」ボタンをクリック**

3. **ユーザー情報を入力**
   - **Email**: `admin@ma-pilot.local`
   - **Password**: `DevAdmin2025A`
   - **Auto Confirm User**: チェックを入れる（メール確認をスキップ）

4. **「Create User」をクリック**

5. **user_metadataテーブルに情報を追加**
   - Supabase Dashboard → SQL Editor
   - 以下のSQLを実行:

   ```sql
   INSERT INTO user_metadata (user_id, clinic_id, role)
   SELECT
     id,
     'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11'::uuid,
     'system_admin'
   FROM auth.users
   WHERE email = 'admin@ma-pilot.local'
   ON CONFLICT (user_id) DO UPDATE SET
     clinic_id = EXCLUDED.clinic_id,
     role = EXCLUDED.role,
     updated_at = now();
   ```

## 動作確認

1. **フロントエンドにアクセス**
   - https://ma-pilot.vercel.app

2. **ログイン**
   - メール: `admin@ma-pilot.local`
   - パスワード: `DevAdmin2025A`

3. **成功確認**
   - 管理ダッシュボード（/admin）にリダイレクトされればOK

## トラブルシューティング

### 「Invalid credentials」エラー

- パスワードが正しく設定されていない
  → Supabase Dashboardでパスワードを再設定

### 「User not found in user_metadata」エラー

- user_metadataテーブルにレコードがない
  → 上記のSQLを実行

### 422エラー（JSON decode error）が継続

- まだ古いパスワード（`!`含む）を使用している
  → 新しいパスワード「`DevAdmin2025A`」を使用

### ログイン後に403エラー

- ユーザーのroleが正しく設定されていない
  → user_metadataテーブルで `role = 'system_admin'` を確認

## 更新されたドキュメント

以下のファイルでパスワードが更新されました：

- `CLAUDE.md`
- `README.md`
- `docs/FAQ.md`
- `DEPLOY.md`

## 注意事項

### なぜ「!」がエラーの原因だったのか？

1. JSON仕様上、「`!`」はエスケープ不要
2. しかし、特定の環境（シェル、プロキシ等）で「`\!`」として送信される場合がある
3. 「`\!`」は不正なエスケープシーケンスのため、JSON parserがエラーを返す

### 今後のパスワードポリシー

- **推奨**: 英数字のみ（大文字・小文字・数字）
- **避ける**: 特殊記号（`!@#$%^&*()`等）
- **理由**: JSON parsingやURL encodingでエラーが起きる可能性

セキュリティを保ちつつ、以下のようなパスワードを推奨：
- `SecurePass2025A`
- `MyStrongPwd123`
- `AdminPass2025B`
