# 親アカウント（システム管理者）セットアップ手順

## アカウント情報

```yaml
メール: kuwahata@idw-japan.net
パスワード: advance2026
権限: system_admin
  - 全機能へのアクセス
  - ユーザー招待・管理
  - 全医院データの閲覧・編集
  - システム設定の変更
```

## セットアップ手順

### 手順1: Supabase Dashboardで新規ユーザーを作成

1. **Supabase Dashboardにアクセス**
   - https://supabase.com/dashboard
   - MA-Pilotプロジェクトを選択

2. **Authentication → Users に移動**

3. **「Add user」ボタンをクリック**

4. **ユーザー情報を入力**
   ```
   Email: kuwahata@idw-japan.net
   Password: advance2026
   Auto Confirm User: ✓ チェックを入れる
   ```

5. **「Create user」をクリック**

### 手順2: SQL Editorで管理者権限を設定

1. **SQL Editorを開く**
   - 左サイドバー → 「SQL Editor」

2. **新しいクエリを作成**
   - 「+ New query」をクリック

3. **以下のSQLを貼り付けて実行**

```sql
-- 管理者権限を設定
INSERT INTO user_metadata (user_id, clinic_id, role)
SELECT
  id,
  NULL,
  'system_admin'
FROM auth.users
WHERE email = 'kuwahata@idw-japan.net'
ON CONFLICT (user_id) DO UPDATE SET
  clinic_id = EXCLUDED.clinic_id,
  role = EXCLUDED.role,
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

4. **「Run」をクリック**

5. **結果を確認**
   ```
   role: system_admin
   email_confirmed_at: (日時が表示されていればOK)
   ```

### 手順3: ログイン確認

1. **フロントエンドにアクセス**
   - https://ma-pilot.vercel.app

2. **ログイン**
   ```
   メール: kuwahata@idw-japan.net
   パスワード: advance2026
   ```

3. **管理ダッシュボードに遷移することを確認**
   - URL: `/admin`
   - システム管理者専用画面が表示されればOK

### 手順4: 旧アカウントの削除（オプション）

**注意**: 新しいアカウントでログイン確認後に実行してください

1. **Supabase Dashboard → Authentication → Users**

2. **旧アカウント（admin@ma-pilot.local）を探す**

3. **ユーザー行の「...」メニュー → 「Delete user」**

4. **確認ダイアログで「Delete」をクリック**

## ユーザー招待機能の使い方

親アカウントでログイン後、以下の手順で他のユーザーを招待できます：

### 1. 管理ダッシュボードから招待

1. **管理ダッシュボード（/admin）にアクセス**

2. **「医院アカウント管理」タブをクリック**

3. **対象の医院を選択**

4. **「スタッフを招待」ボタンをクリック**

5. **招待情報を入力**
   ```
   メールアドレス: 招待する人のメールアドレス
   権限:
     - clinic_owner: 医院オーナー（全操作可能）
     - clinic_editor: 医院編集者（データ編集可能）
     - clinic_viewer: 医院閲覧者（閲覧のみ）
   ```

6. **「招待メールを送信」をクリック**

7. **招待された人がメールのリンクからアカウント作成**

### 2. Supabase Dashboardから直接追加

より高度な設定が必要な場合：

1. **Supabase Dashboard → Authentication → Users → Add user**

2. **ユーザー作成後、SQL Editorで以下を実行**

```sql
-- 例: clinic_ownerとして追加
INSERT INTO user_metadata (user_id, clinic_id, role)
SELECT
  id,
  'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11'::uuid,  -- 医院ID
  'clinic_owner'
FROM auth.users
WHERE email = '新しいユーザーのメールアドレス'
ON CONFLICT (user_id) DO UPDATE SET
  clinic_id = EXCLUDED.clinic_id,
  role = EXCLUDED.role,
  updated_at = now();
```

## ユーザー権限一覧

| 権限 | 説明 | できること |
|------|------|-----------|
| `system_admin` | システム管理者（親アカウント） | ・全医院データへのアクセス<br>・ユーザー招待・管理<br>・システム設定の変更 |
| `clinic_owner` | 医院オーナー | ・自医院データの全操作<br>・スタッフの招待・管理<br>・レポート生成 |
| `clinic_editor` | 医院編集者 | ・自医院データの閲覧・編集<br>・レポート生成 |
| `clinic_viewer` | 医院閲覧者 | ・自医院データの閲覧のみ |

## トラブルシューティング

### ログイン後に403エラー

**原因**: user_metadataテーブルにレコードがない

**解決策**: 手順2のSQLを再実行

### 「Invalid credentials」エラー

**原因**: パスワードが正しくない、またはメール確認が未完了

**解決策**:
1. パスワードを再確認（`advance2026`）
2. Supabase Dashboardでメール確認状態を確認
3. 必要なら「...」メニュー → 「Confirm email」

### ユーザー招待機能が表示されない

**原因**: roleが`system_admin`または`clinic_owner`ではない

**解決策**: user_metadataテーブルのroleを確認

```sql
SELECT
  u.email,
  um.role,
  um.clinic_id
FROM auth.users u
LEFT JOIN user_metadata um ON u.id = um.user_id
WHERE u.email = 'kuwahata@idw-japan.net';
```

## セキュリティに関する注意事項

### パスワード管理

- このパスワードは本番環境用です
- 定期的な変更を推奨（3ヶ月ごと）
- 他人と共有しないこと

### 親アカウントの管理

- 全データへのアクセス権があるため、慎重に管理
- 不要になった旧アカウントは必ず削除
- ログイン履歴を定期的に確認

### ユーザー招待時の注意

- 適切な権限レベルを設定
- 退職者のアカウントは速やかに削除
- 定期的にユーザーリストを見直し

## 次のステップ

1. ✅ 親アカウントのセットアップ完了
2. 医院データの作成（clinicsテーブル）
3. 医院オーナーの招待
4. 月次データの入力開始

詳細は `docs/USER_MANAGEMENT_GUIDE.md` を参照してください。
