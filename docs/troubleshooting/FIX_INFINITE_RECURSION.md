# 無限再帰エラー修正手順

## エラー内容

```
Login failed: {'message': 'infinite recursion detected in policy for relation "user_metadata"', 'code': '42P17'}
```

## 原因

`user_metadata` テーブルのRLS（Row Level Security）ポリシーが正しく設定されていないため、無限再帰が発生しています。

## 修正方法（2つの選択肢）

### 方法1: RLSポリシーを修正（推奨）

#### 手順1: Supabase SQL Editorを開く
1. https://supabase.com/dashboard にアクセス
2. 左サイドバー → **SQL Editor**
3. **"+ New query"** をクリック

#### 手順2: 以下のSQLを実行

```sql
-- 既存ポリシーを削除
DROP POLICY IF EXISTS "Users can view their own metadata" ON user_metadata;
DROP POLICY IF EXISTS "System admins and clinic owners can manage user metadata" ON user_metadata;
DROP POLICY IF EXISTS "Users can view own metadata" ON user_metadata;
DROP POLICY IF EXISTS "Users can update own metadata" ON user_metadata;
DROP POLICY IF EXISTS "System admins can view all metadata" ON user_metadata;
DROP POLICY IF EXISTS "System admins can manage all metadata" ON user_metadata;

-- 新しいポリシーを作成（無限再帰を回避）
CREATE POLICY "Users can view their own metadata"
  ON user_metadata
  FOR SELECT
  USING (user_id = auth.uid());

CREATE POLICY "Users can update their own metadata"
  ON user_metadata
  FOR UPDATE
  USING (user_id = auth.uid());

-- RLS有効化
ALTER TABLE user_metadata ENABLE ROW LEVEL SECURITY;
```

#### 手順3: 「Run」をクリック

#### 手順4: ログイン再試行
- URL: https://ma-pilot.vercel.app
- メール: `kuwahata@idw-japan.net`
- パスワード: `advance2026`

---

### 方法2: バックエンドでService Role Keyを使用（簡単だが注意が必要）

この方法はRLSを完全にバイパスします。セキュリティ上の理由から、方法1を推奨します。

#### 手順1: Supabase DashboardでService Role Keyを取得

1. https://supabase.com/dashboard
2. **Settings** → **API**
3. **"service_role"** のキーをコピー（`eyJ...` で始まる長い文字列）

#### 手順2: Render.comの環境変数を更新

1. https://dashboard.render.com
2. MA-Pilotのバックエンドサービスを選択
3. **Environment** タブ
4. `SUPABASE_KEY` を探す
5. 値を **Service Role Key** に変更
6. **Save Changes**

#### 手順3: サービスを再起動

Render.comが自動的に再デプロイします（約2-3分）。

#### 手順4: ログイン再試行

---

## トラブルシューティング

### 方法1実行後もエラーが継続

**確認事項**:
```sql
-- ポリシー一覧を確認
SELECT policyname, cmd FROM pg_policies WHERE tablename = 'user_metadata';
```

**期待される結果**:
```
policyname                           | cmd
-------------------------------------|--------
Users can view their own metadata    | SELECT
Users can update their own metadata  | UPDATE
```

ポリシーが正しく作成されていない場合は、SQLを再実行してください。

### 方法2実行後もエラーが継続

**確認事項**:
1. Service Role Keyが正しくコピーされているか
2. 環境変数 `SUPABASE_KEY` が更新されているか
3. サービスが再起動されているか（Render.comのLogsタブで確認）

### それでもログインできない

以下を確認してください：

1. **ユーザーが作成されているか**
   ```sql
   SELECT id, email, email_confirmed_at FROM auth.users WHERE email = 'kuwahata@idw-japan.net';
   ```

2. **user_metadataにレコードがあるか**
   ```sql
   SELECT user_id, role, clinic_id FROM user_metadata
   WHERE user_id IN (SELECT id FROM auth.users WHERE email = 'kuwahata@idw-japan.net');
   ```

3. **メール確認が完了しているか**
   - `email_confirmed_at` が `NULL` の場合は未確認
   - Supabase Dashboard → Authentication → Users → ユーザー選択 → "..." → "Confirm email"

---

## セキュリティに関する注意

### Service Role Keyの取り扱い

- **絶対に公開しないこと**（GitHubなど）
- フロントエンドでは使用しない（バックエンドのみ）
- RLSを完全にバイパスするため、慎重に管理

### RLSポリシーの重要性

- データ保護の最後の砦
- 方法1（RLSポリシー修正）を強く推奨
- 方法2は開発環境やテスト環境でのみ使用を推奨

---

## 完了確認

✅ ログインが成功する
✅ 管理ダッシュボード（/admin）に遷移する
✅ エラーログに「infinite recursion」が出ない

修正完了です！
