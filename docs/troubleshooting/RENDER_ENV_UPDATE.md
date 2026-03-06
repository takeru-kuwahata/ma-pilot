# Render.com 環境変数更新手順

## 必要な環境変数（バックエンド）

Render.comダッシュボードで以下の環境変数を設定してください：

### Supabase Configuration

```
SUPABASE_URL=https://ecdzttcnpykmqikdlkai.supabase.co
SUPABASE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImVjZHp0dGNucHlrbXFpa2Rsa2FpIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2MzE0Nzk0OCwiZXhwIjoyMDc4NzIzOTQ4fQ.UV8vcoLgmiMDJaA2ltxbj1TWwiCIDKlP5TSa_v3-TSw
```

⚠️ **重要**: `SUPABASE_KEY`は**Service Role Key**です。Admin API（スタッフ招待など）に必要です。

### Server Configuration

```
PORT=8432
HOST=0.0.0.0
ENVIRONMENT=production
```

### CORS Configuration

```
FRONTEND_URL=https://ma-pilot.vercel.app
```

### External API Keys

```
GOOGLE_MAPS_API_KEY=AIzaSyDbipuFtqbS98KOU5ew2deNKvtOvtpz3-I
E_STAT_API_KEY=28c650e8b52ddcf0462c130da2d80861f92630e2
RESAS_API_KEY=
```

## 設定手順

1. Render.comダッシュボードにログイン
2. **ma-pilot** サービスを選択
3. **Environment** タブをクリック
4. 以下の環境変数を確認・更新：
   - `SUPABASE_KEY` が Service Role Key になっているか確認
   - 他の環境変数も上記の値と一致しているか確認
5. 変更後、**Save Changes** をクリック
6. サービスが自動的に再デプロイされます

## 確認方法

環境変数更新後、スタッフ招待機能をテストしてください：

1. https://ma-pilot.vercel.app/clinic/{clinic-slug}/staff にアクセス
2. 「スタッフを招待」ボタンをクリック
3. メールアドレスと権限を入力
4. 「招待する」をクリック
5. 成功メッセージが表示され、招待メールが送信されることを確認

## トラブルシューティング

### エラー: "User not allowed"
- `SUPABASE_KEY` が Service Role Key ではなく Anon Key になっている
- Supabaseダッシュボード → Settings → API → service_role key を使用

### エラー: "Invalid API key"
- `SUPABASE_KEY` の値が正しくコピーされていない
- 先頭・末尾にスペースが入っていないか確認

## 参考リンク

- Render.com Dashboard: https://dashboard.render.com/
- Supabase Dashboard: https://supabase.com/dashboard/project/ecdzttcnpykmqikdlkai
