# MA-Pilot デプロイメントガイド

このガイドでは、MA-Pilotをフロントエンド（Vercel）とバックエンド（Render.com）に本番デプロイする手順を説明します。

## 目次

1. [前提条件](#前提条件)
2. [Supabaseセットアップ](#supabaseセットアップ)
3. [フロントエンドデプロイ（Vercel）](#フロントエンドデプロイvercel)
4. [バックエンドデプロイ（Rendercom）](#バックエンドデプロイrendercom)
5. [GitHub Actions CI/CD設定](#github-actions-cicd設定)
6. [動作確認](#動作確認)
7. [トラブルシューティング](#トラブルシューティング)

---

## 前提条件

以下のアカウントを事前に作成してください：

- [x] GitHubアカウント
- [x] Supabaseアカウント（https://supabase.com）
- [x] Vercelアカウント（https://vercel.com）
- [x] Render.comアカウント（https://render.com）

---

## Supabaseセットアップ

### 1. プロジェクト作成

1. https://app.supabase.com にアクセス
2. "New Project" をクリック
3. 以下を入力:
   - **Name**: `ma-pilot-production`
   - **Database Password**: 強力なパスワード（必ず保存）
   - **Region**: `Northeast Asia (Tokyo)` 推奨
4. "Create new project" をクリック（数分かかります）

### 2. データベーススキーマ設定

1. SQL Editor に移動
2. `backend/supabase_schema.sql` の内容を貼り付け
3. "Run" をクリック

### 3. Row Level Security（RLS）有効化

```sql
-- すべてのテーブルでRLSを有効化
ALTER TABLE clinics ENABLE ROW LEVEL SECURITY;
ALTER TABLE monthly_data ENABLE ROW LEVEL SECURITY;
ALTER TABLE simulations ENABLE ROW LEVEL SECURITY;
ALTER TABLE reports ENABLE ROW LEVEL SECURITY;
ALTER TABLE market_analyses ENABLE ROW LEVEL SECURITY;
```

### 4. 認証設定

1. Authentication > Providers に移動
2. Email を有効化
3. Settings:
   - Enable email confirmations: ON
   - Secure email change: ON

### 5. API認証情報取得

1. Settings > API に移動
2. 以下をメモ:
   - **Project URL**: `https://xyz.supabase.co`
   - **anon/public key**: `eyJhbGc...`（フロントエンド用）
   - **service_role key**: `eyJhbGc...`（バックエンド用、秘密情報）

---

## フロントエンドデプロイ（Vercel）

### 1. Vercelプロジェクト作成

#### 方法A: Vercel CLI（推奨）

```bash
# Vercel CLIインストール
npm i -g vercel

# ログイン
vercel login

# フロントエンドディレクトリに移動
cd frontend

# デプロイ
vercel

# 本番環境デプロイ
vercel --prod
```

#### 方法B: Vercelダッシュボード

1. https://vercel.com/new にアクセス
2. "Import Git Repository" を選択
3. GitHubリポジトリを選択
4. 以下を設定:
   - **Framework Preset**: Vite
   - **Root Directory**: `frontend`
   - **Build Command**: `npm run build`
   - **Output Directory**: `dist`

### 2. 環境変数設定

Vercelダッシュボード > Settings > Environment Variables で以下を追加:

| 変数名 | 値 | Environment |
|-------|-----|------------|
| `VITE_SUPABASE_URL` | `https://xyz.supabase.co` | Production |
| `VITE_SUPABASE_ANON_KEY` | `eyJhbGc...` | Production |
| `VITE_BACKEND_URL` | `https://ma-pilot-backend.onrender.com` | Production |

### 3. ドメイン設定（オプション）

1. Settings > Domains に移動
2. カスタムドメインを追加（例: `ma-pilot.yourdomain.com`）
3. DNSレコードを設定:
   ```
   Type: CNAME
   Name: ma-pilot
   Value: cname.vercel-dns.com
   ```

### 4. デプロイ確認

```bash
# デプロイされたURLにアクセス
https://your-project.vercel.app
```

---

## バックエンドデプロイ（Render.com）

### 1. Web Service作成

1. https://dashboard.render.com にアクセス
2. "New +" > "Web Service" をクリック
3. GitHubリポジトリを接続
4. 以下を設定:
   - **Name**: `ma-pilot-backend`
   - **Region**: `Singapore` 推奨（東京リージョンなし）
   - **Branch**: `main`
   - **Root Directory**: `backend`
   - **Runtime**: `Python 3`
   - **Build Command**: `pip install -r requirements.txt`
   - **Start Command**: `uvicorn main:app --host 0.0.0.0 --port $PORT`

### 2. 環境変数設定

Environment タブで以下を追加:

| 変数名 | 値 |
|-------|-----|
| `PYTHON_VERSION` | `3.12` |
| `SUPABASE_URL` | `https://xyz.supabase.co` |
| `SUPABASE_KEY` | `eyJhbGc...`（service_role key） |
| `ENVIRONMENT` | `production` |
| `FRONTEND_URL` | `https://your-project.vercel.app` |
| `LOG_LEVEL` | `WARNING` |

### 3. ヘルスチェック設定

1. Settings > Health & Alerts に移動
2. 以下を設定:
   - **Health Check Path**: `/health`
   - **Health Check Interval**: `60 seconds`

### 4. Auto-Deploy設定

1. Settings > Build & Deploy に移動
2. **Auto-Deploy**: `Yes` を選択
3. mainブランチへのpush時に自動デプロイされます

### 5. デプロイ確認

```bash
# ヘルスチェック
curl https://ma-pilot-backend.onrender.com/health

# レスポンス例
{
  "status": "healthy",
  "environment": "production",
  "version": "1.0.0"
}
```

### 6. バックエンドURLをフロントエンドに設定

Render.comで生成されたURL（例: `https://ma-pilot-backend.onrender.com`）を、Vercelの環境変数 `VITE_BACKEND_URL` に設定:

1. Vercelダッシュボード > Settings > Environment Variables
2. `VITE_BACKEND_URL` を編集
3. 値を `https://ma-pilot-backend.onrender.com` に変更
4. Save
5. Deployments > Redeploy を実行

---

## GitHub Actions CI/CD設定

### 1. GitHub Secrets設定

リポジトリの Settings > Secrets and variables > Actions で以下を追加:

| Secret名 | 値の取得方法 |
|---------|------------|
| `VERCEL_TOKEN` | Vercel > Settings > Tokens |
| `VERCEL_ORG_ID` | Vercel Project > Settings > General |
| `VERCEL_PROJECT_ID` | Vercel Project > Settings > General |
| `RENDER_DEPLOY_HOOK` | Render.com > Settings > Deploy Hook |
| `BACKEND_URL` | Render.comデプロイURL |
| `VITE_SUPABASE_URL` | Supabase Project URL |
| `VITE_SUPABASE_ANON_KEY` | Supabase Anon Key |

詳細は `.github/SECRET_SETUP.md` を参照してください。

### 2. ワークフロー確認

`.github/workflows/deploy.yml` が以下を自動実行します:

- **プルリクエスト時**:
  - TypeScript型チェック
  - ESLint
  - テスト実行

- **mainブランチマージ時**:
  - 上記すべて + 本番デプロイ（Vercel + Render.com）

### 3. 初回デプロイ実行

```bash
# mainブランチにpush
git add .
git commit -m "chore: デプロイ設定完了"
git push origin main
```

GitHub Actionsが自動的に:
1. テスト実行
2. Vercelにフロントエンドデプロイ
3. Render.comにバックエンドデプロイ

---

## 動作確認

### 1. バックエンドヘルスチェック

```bash
curl https://ma-pilot-backend.onrender.com/health
```

**期待される応答**:
```json
{
  "status": "healthy",
  "environment": "production",
  "version": "1.0.0"
}
```

### 2. フロントエンドアクセス

```
https://your-project.vercel.app
```

ログイン画面が表示されることを確認。

### 3. API接続確認

1. フロントエンドからログイン試行
2. ブラウザDevToolsでネットワークタブを確認
3. `/api/*` へのリクエストが成功（200 OK）することを確認

### 4. Supabase接続確認

1. ユーザー登録を試行
2. Supabase > Authentication > Users で新規ユーザーが作成されることを確認

---

## ロールバック手順

### フロントエンド（Vercel）

```bash
# Vercel CLI
vercel rollback

# または、ダッシュボード
# Deployments > 以前のデプロイを選択 > Promote to Production
```

### バックエンド（Render.com）

1. Render.comダッシュボード > Events
2. 以前のデプロイを選択
3. "Redeploy" をクリック

### GitHub Actions

```bash
# 以前のコミットに戻す
git revert <commit-hash>
git push origin main
```

---

## カスタムドメイン設定

### フロントエンド（Vercel）

1. Vercel > Settings > Domains
2. カスタムドメインを追加（例: `app.yourdomain.com`）
3. DNSプロバイダーでCNAMEレコードを追加:
   ```
   Type: CNAME
   Name: app
   Value: cname.vercel-dns.com
   ```

### バックエンド（Render.com）

1. Render.com > Settings > Custom Domains
2. カスタムドメインを追加（例: `api.yourdomain.com`）
3. DNSプロバイダーでCNAMEレコードを追加:
   ```
   Type: CNAME
   Name: api
   Value: <your-service>.onrender.com
   ```

### SSL証明書

- **Vercel**: 自動的にLet's Encrypt証明書を発行
- **Render.com**: 自動的にLet's Encrypt証明書を発行

---

## トラブルシューティング

### フロントエンドビルドエラー

**問題**: Vercelデプロイ時にビルドエラー

**解決策**:
```bash
# ローカルでビルドテスト
cd frontend
npm run build

# エラーがある場合は修正してpush
```

### バックエンド起動エラー

**問題**: Render.comでアプリが起動しない

**解決策**:
1. Render.com > Logs を確認
2. 環境変数が正しく設定されているか確認
3. `requirements.txt` の依存関係を確認

### CORS エラー

**問題**: フロントエンドからAPIにアクセスできない

**解決策**:
1. バックエンドの `FRONTEND_URL` 環境変数を確認
2. `main.py` のCORS設定を確認:
   ```python
   allow_origins=[settings.frontend_url]
   ```

### Supabase接続エラー

**問題**: データベースに接続できない

**解決策**:
1. `SUPABASE_URL` と `SUPABASE_KEY` が正しいか確認
2. Supabase > Settings > API で認証情報を再確認
3. RLSポリシーが正しく設定されているか確認

### Render.com スリープ問題

**問題**: 15分間アクセスなしで自動スリープ（無料プラン）

**解決策**:
- **一時的**: 外部サービス（UptimeRobot等）で5分ごとにヘルスチェック
- **恒久的**: 有料プラン（$7/月）にアップグレード

### デプロイ時間が長い

**問題**: GitHub Actionsのデプロイが遅い

**解決策**:
- 依存関係のキャッシュを活用（設定済み）
- テストを並列実行（設定済み）
- 不要なテストを削除

---

## パフォーマンス最適化

### フロントエンド

- **Code Splitting**: React Router lazy loadingを活用
- **Image Optimization**: Vercel Image Optimizationを活用
- **Caching**: ビルド成果物は自動的にCDNにキャッシュ

### バックエンド

- **Connection Pooling**: Supabase SDKが自動管理
- **Response Caching**: 必要に応じてRedis導入検討
- **Database Indexing**: 頻繁にクエリされるカラムにインデックス作成

---

## セキュリティチェックリスト

- [x] Supabase RLS有効化
- [x] 環境変数を.gitignoreに追加
- [x] HTTPS Only（Vercel/Render.comデフォルト）
- [x] CORS設定を本番URLのみに制限
- [x] API Keyをハードコードしない
- [x] Supabase Service Role Keyをバックエンドのみで使用

---

## モニタリング

### Vercel Analytics

1. Vercel > Analytics に移動
2. Web Vitals、トラフィック、エラーを確認

### Render.com Metrics

1. Render.com > Metrics に移動
2. CPU、メモリ、レスポンスタイムを確認

### Supabase Dashboard

1. Supabase > Dashboard
2. APIリクエスト数、データベースサイズを確認

---

## 参考リンク

- [Vercel Documentation](https://vercel.com/docs)
- [Render.com Documentation](https://render.com/docs)
- [Supabase Documentation](https://supabase.com/docs)
- [GitHub Actions Documentation](https://docs.github.com/en/actions)
