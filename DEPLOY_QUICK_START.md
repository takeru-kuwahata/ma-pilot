# MA-Pilot デプロイクイックスタート

このガイドは、MA-Pilotを最速で本番環境にデプロイする手順をまとめたものです。

## 🚀 デプロイの流れ（3ステップ）

```
Step 1: Supabase → Step 2: Vercel → Step 3: Render.com
         ↓                ↓                ↓
    (5分)          (3分)          (3分)
```

**合計所要時間**: 約15分

---

## 📋 事前準備

以下のアカウントを作成してください（すべて無料プラン可）：

- [ ] [Supabase](https://supabase.com) - データベース
- [ ] [Vercel](https://vercel.com) - フロントエンド
- [ ] [Render.com](https://render.com) - バックエンド
- [ ] [GitHub](https://github.com) - コード管理（既存）

---

## Step 1: Supabase セットアップ（5分）

### 1-1. プロジェクト作成

1. https://app.supabase.com にアクセス
2. "New Project" をクリック
3. 以下を入力:
   - **Name**: `ma-pilot-production`
   - **Database Password**: 強力なパスワード（保存必須）
   - **Region**: `Northeast Asia (Tokyo)`
4. "Create new project" をクリック（2-3分待つ）

### 1-2. データベーススキーマ設定

1. 左メニュー > **SQL Editor** をクリック
2. `backend/supabase_schema.sql` の内容を**全部コピー**
3. SQL Editorに貼り付け
4. **"Run"** ボタンをクリック
5. 緑色チェックマークが表示されればOK

### 1-3. 認証情報を取得

1. 左メニュー > **Settings** > **API** をクリック
2. 以下をメモ（後で使います）:
   - **Project URL**: `https://xyz.supabase.co`
   - **anon public**: `eyJhbGc...`（長いキー）
   - **service_role**: `eyJhbGc...`（別の長いキー）

**⚠️ 重要**: `service_role` キーは絶対に公開しないでください

---

## Step 2: Vercel デプロイ（3分）

### 2-1. プロジェクト作成

1. https://vercel.com/new にアクセス
2. "Import Git Repository" を選択
3. GitHubリポジトリ `ma-pilot` を選択
4. 以下を設定:
   - **Framework Preset**: Vite
   - **Root Directory**: `frontend`
   - **Build Command**: `npm run build`（自動設定）
   - **Output Directory**: `dist`（自動設定）

### 2-2. 環境変数設定

"Environment Variables" セクションで以下を追加:

| Name | Value |
|------|-------|
| `VITE_SUPABASE_URL` | （Step 1-3のProject URL） |
| `VITE_SUPABASE_ANON_KEY` | （Step 1-3のanon public） |
| `VITE_BACKEND_URL` | `https://ma-pilot-backend.onrender.com` |

**⚠️ 注意**: `VITE_BACKEND_URL` は後で修正します（Step 3完了後）

### 2-3. デプロイ実行

1. "Deploy" ボタンをクリック
2. 2-3分待つ
3. デプロイ完了後、URLをメモ（例: `https://ma-pilot-xyz.vercel.app`）

---

## Step 3: Render.com デプロイ（3分）

### 3-1. Web Service作成

1. https://dashboard.render.com にアクセス
2. "New +" > "Web Service" をクリック
3. GitHubリポジトリを接続
4. 以下を設定:
   - **Name**: `ma-pilot-backend`
   - **Region**: `Singapore`（東京リージョンなし）
   - **Branch**: `main`
   - **Root Directory**: `backend`
   - **Runtime**: `Python 3`
   - **Build Command**: `pip install -r requirements.txt`
   - **Start Command**: `uvicorn main:app --host 0.0.0.0 --port $PORT`
   - **Instance Type**: `Free`

### 3-2. 環境変数設定

"Environment" タブで以下を追加:

| Key | Value |
|-----|-------|
| `PYTHON_VERSION` | `3.12` |
| `SUPABASE_URL` | （Step 1-3のProject URL） |
| `SUPABASE_KEY` | （Step 1-3の**service_role**） |
| `ENVIRONMENT` | `production` |
| `FRONTEND_URL` | （Step 2-3のVercel URL） |
| `LOG_LEVEL` | `WARNING` |

### 3-3. Health Check設定

"Settings" > "Health & Alerts":
- **Health Check Path**: `/health`

### 3-4. デプロイ実行

1. "Create Web Service" をクリック
2. 3-5分待つ
3. デプロイ完了後、URLをメモ（例: `https://ma-pilot-backend.onrender.com`）

---

## Step 4: Vercel環境変数を修正（1分）

### 4-1. バックエンドURLを更新

1. Vercelダッシュボード > Settings > Environment Variables
2. `VITE_BACKEND_URL` を見つけて "Edit" をクリック
3. 値を Step 3-4のRender.com URL に変更
4. "Save" をクリック

### 4-2. 再デプロイ

1. Deployments タブに移動
2. 最新のデプロイの右側メニュー（...）> "Redeploy"
3. 1-2分待つ

---

## ✅ 動作確認

### バックエンド確認

```bash
curl https://ma-pilot-backend.onrender.com/health
```

期待される応答:
```json
{
  "status": "healthy",
  "environment": "production",
  "version": "1.0.0"
}
```

### フロントエンド確認

1. ブラウザで Vercel URL（例: `https://ma-pilot-xyz.vercel.app`）にアクセス
2. ログイン画面が表示されればOK

---

## 🔄 以降のデプロイ（自動化）

デプロイ設定は完了しました。以降は **Git Push だけ** でデプロイされます：

```bash
git add .
git commit -m "update: 新機能追加"
git push origin main
```

**自動実行される内容**:
1. GitHub Actionsでテスト実行
2. Vercelにフロントエンド自動デプロイ
3. Render.comにバックエンド自動デプロイ

進捗は GitHub > Actions タブで確認できます。

---

## 🛠️ 便利なコマンド

### ローカル開発環境セットアップ

```bash
# 自動セットアップスクリプト
./deploy-setup.sh
```

### ローカル起動

```bash
# フロントエンド
cd frontend
npm install
npm run dev  # http://localhost:3247

# バックエンド（別ターミナル）
cd backend
source venv/bin/activate
pip install -r requirements.txt
uvicorn main:app --reload --port 8432  # http://localhost:8432
```

---

## 📚 詳細ドキュメント

さらに詳しい情報は以下を参照:

- [完全版デプロイガイド](docs/DEPLOYMENT_GUIDE.md)
- [デプロイチェックリスト](docs/DEPLOYMENT_CHECKLIST.md)
- [環境変数ガイド](docs/ENVIRONMENT_VARIABLES.md)
- [トラブルシューティング](docs/TROUBLESHOOTING.md)

---

## ❓ よくある質問

### Q1: デプロイが失敗した

**A**: GitHub > Actions タブでエラーログを確認してください。主な原因：
- 環境変数の設定ミス
- Supabaseスキーマ未実行
- ビルドエラー（ローカルで `npm run build` を実行して確認）

### Q2: Render.comが起動しない

**A**: Render.com > Logs を確認してください。無料プランは15分間アクセスなしで自動スリープします。初回アクセス時は1-2分待ってください。

### Q3: CORS エラーが出る

**A**: 環境変数を確認してください:
- Vercel: `VITE_BACKEND_URL` がRender.comのURLと一致しているか
- Render.com: `FRONTEND_URL` がVercelのURLと一致しているか

### Q4: Supabaseに接続できない

**A**: 環境変数を確認してください:
- Vercel: `VITE_SUPABASE_URL` と `VITE_SUPABASE_ANON_KEY`（anon key使用）
- Render.com: `SUPABASE_URL` と `SUPABASE_KEY`（service_role key使用）

---

## 🎉 デプロイ完了！

おめでとうございます！MA-Pilotが本番環境で稼働しています。

**本番URL**:
- フロントエンド: `https://your-project.vercel.app`
- バックエンド: `https://ma-pilot-backend.onrender.com`

今後は `git push origin main` だけでデプロイされます。
