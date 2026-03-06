# MA-Pilot 環境変数ガイド

このドキュメントでは、MA-Pilotの開発環境と本番環境で必要な環境変数を詳しく説明します。

## 目次

1. [環境変数一覧](#環境変数一覧)
2. [フロントエンド環境変数](#フロントエンド環境変数)
3. [バックエンド環境変数](#バックエンド環境変数)
4. [設定方法](#設定方法)
5. [トラブルシューティング](#トラブルシューティング)

---

## 環境変数一覧

### フロントエンド（Vercel）

| 変数名 | 必須 | 説明 | 例 |
|--------|------|------|-----|
| `VITE_SUPABASE_URL` | ✅ | SupabaseプロジェクトURL | `https://xyz.supabase.co` |
| `VITE_SUPABASE_ANON_KEY` | ✅ | Supabase匿名公開キー | `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...` |
| `VITE_BACKEND_URL` | ✅ | バックエンドAPIのURL | 開発: `http://localhost:8432`<br>本番: `https://ma-pilot-backend.onrender.com` |

### バックエンド（Render.com）

| 変数名 | 必須 | 説明 | 例 |
|--------|------|------|-----|
| `PYTHON_VERSION` | ✅ | Pythonバージョン | `3.12` |
| `SUPABASE_URL` | ✅ | SupabaseプロジェクトURL | `https://xyz.supabase.co` |
| `SUPABASE_KEY` | ✅ | Supabase Service Role Key（秘密） | `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...` |
| `ENVIRONMENT` | ✅ | 実行環境 | 開発: `development`<br>本番: `production` |
| `FRONTEND_URL` | ✅ | フロントエンドURL（CORS用） | 開発: `http://localhost:3247`<br>本番: `https://ma-pilot.vercel.app` |
| `PORT` | ⚠️ | APIサーバーポート | 開発: `8432`<br>本番: `$PORT`（Render自動設定） |
| `HOST` | ⚠️ | APIサーバーホスト | 開発: `localhost`<br>本番: `0.0.0.0` |
| `LOG_LEVEL` | - | ログレベル | 開発: `DEBUG`<br>本番: `WARNING` |

---

## フロントエンド環境変数

### 開発環境（.env.local）

フロントエンドディレクトリに `.env.local` を作成:

```bash
# Supabase設定
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key-here

# バックエンドURL（ローカル開発）
VITE_BACKEND_URL=http://localhost:8432
```

### 本番環境（Vercel）

Vercelダッシュボード > Settings > Environment Variables で設定:

1. `VITE_SUPABASE_URL`
   - **Value**: `https://your-project.supabase.co`
   - **Environment**: Production, Preview

2. `VITE_SUPABASE_ANON_KEY`
   - **Value**: Supabaseのanon/public key
   - **Environment**: Production, Preview

3. `VITE_BACKEND_URL`
   - **Value**: `https://ma-pilot-backend.onrender.com`
   - **Environment**: Production, Preview

### 取得方法

**Supabase認証情報**:
1. https://app.supabase.com にログイン
2. プロジェクトを選択
3. Settings > API に移動
4. 以下をコピー:
   - **Project URL**: `VITE_SUPABASE_URL` に使用
   - **anon/public key**: `VITE_SUPABASE_ANON_KEY` に使用

---

## バックエンド環境変数

### 開発環境（.env）

バックエンドディレクトリに `.env` を作成:

```bash
# Supabase設定（service_role keyを使用）
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_KEY=your-service-role-key-here

# 環境設定
ENVIRONMENT=development

# サーバー設定
PORT=8432
HOST=localhost

# CORS設定
FRONTEND_URL=http://localhost:3247

# ログレベル
LOG_LEVEL=DEBUG
```

### 本番環境（Render.com）

Render.comダッシュボード > Environment で設定:

1. `PYTHON_VERSION`
   - **Value**: `3.12`

2. `SUPABASE_URL`
   - **Value**: `https://your-project.supabase.co`

3. `SUPABASE_KEY`
   - **Value**: Supabaseのservice_role key（秘密）
   - ⚠️ **重要**: anon keyではなく、service_role keyを使用

4. `ENVIRONMENT`
   - **Value**: `production`

5. `FRONTEND_URL`
   - **Value**: `https://ma-pilot.vercel.app`

6. `LOG_LEVEL`
   - **Value**: `WARNING`

### 取得方法

**Supabase Service Role Key**:
1. https://app.supabase.com にログイン
2. プロジェクトを選択
3. Settings > API に移動
4. **service_role key** をコピー（"Reveal" をクリック）
5. ⚠️ **注意**: このキーは絶対に公開しないこと

---

## 設定方法

### ローカル開発環境

#### フロントエンド

```bash
# フロントエンドディレクトリに移動
cd frontend

# .env.local作成
cat > .env.local << 'EOF'
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key
VITE_BACKEND_URL=http://localhost:8432
EOF

# 開発サーバー起動
npm run dev
```

#### バックエンド

```bash
# バックエンドディレクトリに移動
cd backend

# .env作成
cat > .env << 'EOF'
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_KEY=your-service-role-key
ENVIRONMENT=development
PORT=8432
HOST=localhost
FRONTEND_URL=http://localhost:3247
LOG_LEVEL=DEBUG
EOF

# 仮想環境有効化
source venv/bin/activate

# 開発サーバー起動
uvicorn main:app --reload --host localhost --port 8432
```

### 本番環境

#### Vercel（フロントエンド）

1. Vercelダッシュボードにログイン
2. プロジェクトを選択
3. Settings > Environment Variables に移動
4. 以下を追加:

```
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
VITE_BACKEND_URL=https://ma-pilot-backend.onrender.com
```

5. Save
6. Deployments > Redeploy を実行

#### Render.com（バックエンド）

1. Render.comダッシュボードにログイン
2. Web Serviceを選択
3. Environment タブに移動
4. 以下を追加:

```
PYTHON_VERSION=3.12
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...（service_role）
ENVIRONMENT=production
FRONTEND_URL=https://ma-pilot.vercel.app
LOG_LEVEL=WARNING
```

5. Save Changes（自動的に再デプロイされます）

---

## GitHub Secrets（CI/CD用）

GitHub Actions で使用するSecretを設定:

1. GitHubリポジトリに移動
2. Settings > Secrets and variables > Actions
3. "New repository secret" をクリック
4. 以下を追加:

| Secret名 | 値 | 用途 |
|---------|-----|------|
| `VERCEL_TOKEN` | Vercelアクセストークン | Vercelデプロイ |
| `VERCEL_ORG_ID` | Vercel組織ID | Vercelデプロイ |
| `VERCEL_PROJECT_ID` | VercelプロジェクトID | Vercelデプロイ |
| `RENDER_DEPLOY_HOOK` | Render.comデプロイフックURL | Render.comデプロイ |
| `BACKEND_URL` | バックエンドURL | ヘルスチェック |
| `VITE_SUPABASE_URL` | SupabaseプロジェクトURL | ビルド時 |
| `VITE_SUPABASE_ANON_KEY` | Supabase anon key | ビルド時 |
| `VITE_BACKEND_URL` | バックエンドURL | ビルド時 |

---

## トラブルシューティング

### 問題: 環境変数が読み込まれない

**フロントエンド**:
- ✅ 環境変数名が `VITE_` で始まっているか確認
- ✅ `.env.local` がフロントエンドディレクトリ直下にあるか確認
- ✅ 開発サーバーを再起動（環境変数変更後は必須）

**バックエンド**:
- ✅ `.env` がバックエンドディレクトリ直下にあるか確認
- ✅ `python-dotenv` がインストールされているか確認
- ✅ サーバーを再起動

### 問題: CORS エラー

**原因**: `FRONTEND_URL` が正しく設定されていない

**解決策**:
```bash
# バックエンドの.envまたはRender.com環境変数を確認
FRONTEND_URL=http://localhost:3247  # 開発環境
FRONTEND_URL=https://ma-pilot.vercel.app  # 本番環境
```

### 問題: Supabase接続エラー

**フロントエンド**:
- ✅ `VITE_SUPABASE_URL` と `VITE_SUPABASE_ANON_KEY` を確認
- ✅ anon key（公開キー）を使用しているか確認

**バックエンド**:
- ✅ `SUPABASE_URL` と `SUPABASE_KEY` を確認
- ✅ service_role key（秘密キー）を使用しているか確認

### 問題: 本番環境で404エラー

**Vercel**:
- ✅ `vercel.json` に rewrites設定があるか確認
- ✅ ビルドが成功しているか確認

**Render.com**:
- ✅ 環境変数がすべて設定されているか確認
- ✅ `/health` エンドポイントが正常か確認:
  ```bash
  curl https://ma-pilot-backend.onrender.com/health
  ```

---

## セキュリティベストプラクティス

### ✅ やるべきこと

- 環境変数ファイル（.env, .env.local）を `.gitignore` に追加
- Service Role Key は本番環境のバックエンドのみで使用
- Anon Key はフロントエンドで使用
- 本番環境の環境変数は暗号化されたSecretsで管理

### ❌ やってはいけないこと

- 環境変数をコードにハードコード
- Service Role Key をフロントエンドで使用
- 環境変数をGitにコミット
- 環境変数をSlack等で共有（暗号化されたツールを使用）

---

## 環境変数チェックリスト

### 開発環境

#### フロントエンド
- [ ] `.env.local` が作成されている
- [ ] `VITE_SUPABASE_URL` が設定されている
- [ ] `VITE_SUPABASE_ANON_KEY` が設定されている
- [ ] `VITE_BACKEND_URL=http://localhost:8432` が設定されている

#### バックエンド
- [ ] `.env` が作成されている
- [ ] `SUPABASE_URL` が設定されている
- [ ] `SUPABASE_KEY`（service_role）が設定されている
- [ ] `ENVIRONMENT=development` が設定されている
- [ ] `FRONTEND_URL=http://localhost:3247` が設定されている

### 本番環境

#### Vercel
- [ ] `VITE_SUPABASE_URL` が設定されている
- [ ] `VITE_SUPABASE_ANON_KEY` が設定されている
- [ ] `VITE_BACKEND_URL` が本番URLに設定されている

#### Render.com
- [ ] `PYTHON_VERSION=3.12` が設定されている
- [ ] `SUPABASE_URL` が設定されている
- [ ] `SUPABASE_KEY`（service_role）が設定されている
- [ ] `ENVIRONMENT=production` が設定されている
- [ ] `FRONTEND_URL` がVercel URLに設定されている

#### GitHub Secrets
- [ ] `VERCEL_TOKEN` が設定されている
- [ ] `VERCEL_ORG_ID` が設定されている
- [ ] `VERCEL_PROJECT_ID` が設定されている
- [ ] `RENDER_DEPLOY_HOOK` が設定されている
- [ ] `BACKEND_URL` が設定されている
- [ ] `VITE_SUPABASE_URL` が設定されている
- [ ] `VITE_SUPABASE_ANON_KEY` が設定されている
- [ ] `VITE_BACKEND_URL` が設定されている

---

## 参考リンク

- [Vite環境変数ドキュメント](https://vitejs.dev/guide/env-and-mode.html)
- [Vercel環境変数ガイド](https://vercel.com/docs/concepts/projects/environment-variables)
- [Render.com環境変数ガイド](https://render.com/docs/environment-variables)
- [Supabase認証情報ガイド](https://supabase.com/docs/guides/api#api-url-and-keys)
