# 親アカウント作成手順（ステップバイステップ）

## 401エラーの原因

ユーザーが存在しないか、パスワードが正しく設定されていません。

## 作業手順

### ステップ1: Supabase Dashboardでユーザーを作成

#### 1-1. Supabase Dashboardにアクセス
- https://supabase.com/dashboard
- MA-Pilotプロジェクトを選択

#### 1-2. Authentication → Users に移動
- 左サイドバー → **Authentication**
- **Users** タブをクリック

#### 1-3. 既存ユーザーを確認
- 検索ボックスに `kuwahata@idw-japan.net` を入力
- ユーザーが表示される場合 → **ステップ2へ**
- ユーザーが表示されない場合 → **1-4へ**

#### 1-4. 新規ユーザーを作成（ユーザーが存在しない場合のみ）
1. 右上の **"Add user"** ボタンをクリック
2. 以下を入力：
   ```
   Email: kuwahata@idw-japan.net
   Password: advance2026
   Auto Confirm User: ✓ チェックを入れる
   ```
3. **"Create user"** をクリック

---

### ステップ2: SQL Editorでuser_metadataを作成

#### 2-1. SQL Editorを開く
- 左サイドバー → **SQL Editor**
- **"+ New query"** をクリック

#### 2-2. 以下のSQLを実行

```sql
-- user_metadataを作成（管理者権限を付与）
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

-- 確認クエリ
SELECT
  u.id,
  u.email,
  u.email_confirmed_at,
  um.role,
  um.clinic_id
FROM auth.users u
LEFT JOIN user_metadata um ON u.id = um.user_id
WHERE u.email = 'kuwahata@idw-japan.net';
```

#### 2-3. 「Run」をクリック

#### 2-4. 結果を確認
以下のように表示されればOK：
```
email: kuwahata@idw-japan.net
email_confirmed_at: 2026-01-26 20:30:00 (日時が表示されている)
role: system_admin
clinic_id: NULL
```

**重要**: `email_confirmed_at` が `NULL` の場合は、メール確認が未完了です。次のステップへ。

---

### ステップ3: メール確認（email_confirmed_atがNULLの場合のみ）

#### 3-1. Usersページに戻る
- 左サイドバー → **Authentication** → **Users**

#### 3-2. ユーザーを選択
- `kuwahata@idw-japan.net` の行をクリック

#### 3-3. メール確認を実行
1. 右側のパネルで **"..."（三点メニュー）** をクリック
2. **"Confirm email"** を選択

---

### ステップ4: パスワードを再設定（ログインできない場合のみ）

#### 4-1. Usersページでユーザーを選択
- `kuwahata@idw-japan.net` をクリック

#### 4-2. パスワードをリセット
1. 右側のパネルで **"..."（三点メニュー）** をクリック
2. **"Reset password"** を選択
3. 新しいパスワードを入力: `advance2026`
4. **"Update password"** をクリック

---

### ステップ5: ログイン確認

#### 5-1. フロントエンドにアクセス
- https://ma-pilot.vercel.app

#### 5-2. ログイン
```
メール: kuwahata@idw-japan.net
パスワード: advance2026
```

#### 5-3. 成功確認
- 管理ダッシュボード（`/admin`）にリダイレクトされればOK
- エラーが表示される場合は次のトラブルシューティングへ

---

## トラブルシューティング

### 401エラーが継続する場合

#### 確認1: ユーザーが存在するか
SQL Editorで実行：
```sql
SELECT id, email, email_confirmed_at FROM auth.users WHERE email = 'kuwahata@idw-japan.net';
```
- 結果が0件 → ステップ1からやり直し
- 結果が1件 → 次へ

#### 確認2: メール確認が完了しているか
上記クエリの結果で `email_confirmed_at` を確認：
- `NULL` → ステップ3を実行
- 日時が表示されている → 次へ

#### 確認3: user_metadataが存在するか
SQL Editorで実行：
```sql
SELECT user_id, role FROM user_metadata
WHERE user_id IN (SELECT id FROM auth.users WHERE email = 'kuwahata@idw-japan.net');
```
- 結果が0件 → ステップ2を再実行
- 結果が1件かつ `role = 'system_admin'` → 次へ

#### 確認4: パスワードが正しいか
- ステップ4を実行してパスワードを再設定
- ログインを再試行

### それでもログインできない場合

#### バックエンドログを確認
Render.comのログを確認してエラーの詳細を見る：
1. https://dashboard.render.com
2. MA-Pilotバックエンドサービスを選択
3. **Logs** タブを開く
4. ログイン試行時のエラーメッセージを確認

よくあるエラー：
- `Invalid login credentials` → パスワードが違う（ステップ4を実行）
- `User not found` → ユーザーが存在しない（ステップ1を実行）
- `Email not confirmed` → メール未確認（ステップ3を実行）

---

## スクリーンショットで確認する箇所

### ステップ1-3: ユーザー一覧画面
- `kuwahata@idw-japan.net` が表示されている
- 右端に緑色の確認マークがある（メール確認済み）

### ステップ2-4: SQL実行結果
```
| id                                   | email                    | email_confirmed_at      | role         | clinic_id |
|--------------------------------------|--------------------------|-------------------------|--------------|-----------|
| xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx | kuwahata@idw-japan.net   | 2026-01-26 20:30:00+00  | system_admin | NULL      |
```

### ステップ5-3: ログイン成功
- URL: `https://ma-pilot.vercel.app/admin`
- 画面: 管理ダッシュボードが表示される

---

## 完了チェックリスト

- [ ] ステップ1: ユーザーが作成されている
- [ ] ステップ2: user_metadataが作成されている（role = system_admin）
- [ ] ステップ3: メール確認が完了している（email_confirmed_at が NULL でない）
- [ ] ステップ4: パスワードが設定されている（必要な場合）
- [ ] ステップ5: ログインが成功する

全て完了したら、親アカウントのセットアップ完了です！
