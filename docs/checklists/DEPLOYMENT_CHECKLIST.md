# MA-Pilot デプロイ前チェックリスト

このチェックリストは、MA-Pilotを本番環境にデプロイする前に確認すべき項目をまとめたものです。

## 目次

1. [環境変数設定](#環境変数設定)
2. [Supabaseセットアップ](#supabaseセットアップ)
3. [フロントエンド準備](#フロントエンド準備)
4. [バックエンド準備](#バックエンド準備)
5. [デプロイ実行](#デプロイ実行)
6. [デプロイ後確認](#デプロイ後確認)
7. [セキュリティチェック](#セキュリティチェック)

---

## 環境変数設定

### フロントエンド（Vercel）

- [ ] `VITE_SUPABASE_URL` が設定されている
- [ ] `VITE_SUPABASE_ANON_KEY` が設定されている（anon key使用）
- [ ] `VITE_BACKEND_URL` が本番バックエンドURLに設定されている
- [ ] 環境変数が Production と Preview の両方に適用されている

### バックエンド（Render.com）

- [ ] `PYTHON_VERSION=3.12` が設定されている
- [ ] `SUPABASE_URL` が設定されている
- [ ] `SUPABASE_KEY` が設定されている（service_role key使用）
- [ ] `ENVIRONMENT=production` が設定されている
- [ ] `FRONTEND_URL` が本番フロントエンドURLに設定されている
- [ ] `LOG_LEVEL=WARNING` が設定されている

### GitHub Secrets（CI/CD）

- [ ] `VERCEL_TOKEN` が設定されている
- [ ] `VERCEL_ORG_ID` が設定されている
- [ ] `VERCEL_PROJECT_ID` が設定されている
- [ ] `RENDER_DEPLOY_HOOK` が設定されている
- [ ] `BACKEND_URL` が設定されている
- [ ] `VITE_SUPABASE_URL` が設定されている
- [ ] `VITE_SUPABASE_ANON_KEY` が設定されている
- [ ] `VITE_BACKEND_URL` が設定されている

---

## Supabaseセットアップ

### プロジェクト設定

- [ ] Supabaseプロジェクトが作成されている
- [ ] データベーススキーマ（`backend/supabase_schema.sql`）が実行済み
- [ ] Row Level Security（RLS）がすべてのテーブルで有効化されている
- [ ] 認証設定（Email認証）が有効化されている

### RLS確認

```sql
-- 以下のSQLを実行して確認
SELECT tablename, rowsecurity
FROM pg_tables
WHERE schemaname = 'public';
```

すべてのテーブルで `rowsecurity = true` であることを確認。

### 認証情報取得

- [ ] Project URL（`https://xyz.supabase.co`）を取得済み
- [ ] anon/public key（フロントエンド用）を取得済み
- [ ] service_role key（バックエンド用）を取得済み
- [ ] service_role key を絶対に公開しない

---

## フロントエンド準備

### ローカルビルド確認

```bash
cd frontend

# 依存関係インストール
npm ci

# 型チェック
npm run type-check

# リンティング
npm run lint

# ビルド
npm run build

# プレビュー
npm run preview
```

- [ ] すべてのコマンドがエラーなく完了する
- [ ] ビルド成果物（`dist/`）が生成される
- [ ] プレビューで画面が正常に表示される

### ファイル確認

- [ ] `vercel.json` が存在し、正しく設定されている
- [ ] `.vercelignore` が存在し、不要ファイルを除外している
- [ ] `package.json` の `build` スクリプトが正しい
- [ ] 環境変数が `.env.local` に設定されている（開発用）
- [ ] `.env` ファイルが `.gitignore` に含まれている

### Vercel設定

- [ ] プロジェクトがVercelに接続されている
- [ ] Root Directory が `frontend` に設定されている
- [ ] Build Command が `npm run build` に設定されている
- [ ] Output Directory が `dist` に設定されている
- [ ] Framework Preset が `Vite` に設定されている

---

## バックエンド準備

### ローカル起動確認

```bash
cd backend

# 仮想環境有効化
source venv/bin/activate

# 依存関係インストール
pip install -r requirements.txt

# リンティング
flake8 . --count --select=E9,F63,F7,F82 --show-source --statistics

# テスト実行
pytest --cov=. --cov-report=term

# サーバー起動
uvicorn main:app --host 0.0.0.0 --port 8432
```

- [ ] すべてのコマンドがエラーなく完了する
- [ ] テストが通る（一部失敗は許容、重要なものが通ればOK）
- [ ] サーバーが正常に起動する

### ヘルスチェック確認

```bash
# 別のターミナルで実行
curl http://localhost:8432/health
```

期待される応答:
```json
{
  "status": "healthy",
  "environment": "development",
  "version": "1.0.0"
}
```

- [ ] ヘルスチェックエンドポイントが正常に応答する

### ファイル確認

- [ ] `render.yaml` が存在し、正しく設定されている
- [ ] `.renderignore` が存在し、不要ファイルを除外している
- [ ] `requirements.txt` がすべての依存関係を含んでいる
- [ ] `main.py` にヘルスチェックエンドポイント（`/health`）が存在する
- [ ] 環境変数が `.env` に設定されている（開発用）
- [ ] `.env` ファイルが `.gitignore` に含まれている

### Render.com設定

- [ ] Web Serviceが作成されている
- [ ] Root Directory が `backend` に設定されている
- [ ] Build Command が `pip install -r requirements.txt` に設定されている
- [ ] Start Command が `uvicorn main:app --host 0.0.0.0 --port $PORT` に設定されている
- [ ] Health Check Path が `/health` に設定されている
- [ ] Auto-Deploy が有効化されている

---

## デプロイ実行

### GitHub Actions確認

- [ ] `.github/workflows/deploy.yml` が存在する
- [ ] ワークフローが正しく設定されている
- [ ] GitHub Secretsがすべて設定されている

### 初回デプロイ

```bash
# 最新のmainブランチに移動
git checkout main
git pull origin main

# 変更をコミット（もしあれば）
git add .
git commit -m "chore: 本番デプロイ準備完了"
git push origin main
```

- [ ] GitHub Actionsが自動的に起動する
- [ ] すべてのジョブが成功する（緑色チェックマーク）

### デプロイ監視

#### GitHub Actions

1. GitHubリポジトリ > Actions タブ
2. 最新のワークフロー実行を確認
3. 各ジョブのログを確認:
   - [ ] `test-backend` が成功
   - [ ] `test-frontend` が成功
   - [ ] `deploy-frontend` が成功
   - [ ] `deploy-backend` が成功

#### Vercel

1. Vercelダッシュボード > Deployments
2. 最新のデプロイを確認:
   - [ ] ステータスが "Ready"
   - [ ] ビルドログにエラーがない

#### Render.com

1. Render.comダッシュボード > Events
2. 最新のデプロイを確認:
   - [ ] ステータスが "Live"
   - [ ] ビルドログにエラーがない

---

## デプロイ後確認

### フロントエンド確認

```bash
# 本番URLにアクセス
https://your-project.vercel.app
```

- [ ] ログイン画面が表示される
- [ ] スタイルが正しく適用されている
- [ ] JavaScriptエラーがない（ブラウザDevToolsで確認）
- [ ] ネットワークエラーがない

### バックエンド確認

```bash
# ヘルスチェック
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

- [ ] ヘルスチェックが正常に応答する
- [ ] レスポンスタイムが妥当（1秒以内）

### API接続確認

1. フロントエンドからログイン試行
2. ブラウザDevTools > Network タブを確認:
   - [ ] `/api/*` へのリクエストが成功（200 OK）
   - [ ] CORSエラーがない
   - [ ] レスポンスが正常

### データベース確認

1. Supabase > Table Editor に移動
2. テーブルが正しく作成されているか確認:
   - [ ] `clinics` テーブルが存在
   - [ ] `monthly_data` テーブルが存在
   - [ ] `simulations` テーブルが存在
   - [ ] `reports` テーブルが存在

### 認証確認

1. フロントエンドで新規ユーザー登録
2. Supabase > Authentication > Users で確認:
   - [ ] 新規ユーザーが作成される
   - [ ] メール確認が送信される

---

## セキュリティチェック

### 環境変数

- [ ] 環境変数ファイル（.env, .env.local）がGitにコミットされていない
- [ ] Service Role Key がバックエンドのみで使用されている
- [ ] Anon Key がフロントエンドで使用されている
- [ ] APIキーがハードコードされていない

### Supabase

- [ ] Row Level Security（RLS）がすべてのテーブルで有効化されている
- [ ] RLSポリシーが正しく設定されている
- [ ] 認証なしでデータにアクセスできないことを確認

### CORS

- [ ] バックエンドのCORS設定が本番URLのみを許可している
- [ ] `allow_origins` に `*` が含まれていない

### HTTPS

- [ ] フロントエンドがHTTPSで配信されている（Vercel自動）
- [ ] バックエンドがHTTPSで配信されている（Render.com自動）
- [ ] 本番環境でHTTP→HTTPSリダイレクトが機能している

### セキュリティヘッダー

バックエンドのレスポンスヘッダーを確認:

```bash
curl -I https://ma-pilot-backend.onrender.com/health
```

以下のヘッダーが存在することを確認:
- [ ] `X-Content-Type-Options: nosniff`
- [ ] `X-Frame-Options: DENY`
- [ ] `X-XSS-Protection: 1; mode=block`
- [ ] `Strict-Transport-Security`（本番のみ）
- [ ] `Content-Security-Policy`

---

## パフォーマンス確認

### フロントエンド

1. Lighthouse（Chrome DevTools）を実行:
   - [ ] Performance > 90
   - [ ] Accessibility > 90
   - [ ] Best Practices > 90
   - [ ] SEO > 80

2. Vercel Analytics で確認:
   - [ ] Web Vitals が緑色（Good）

### バックエンド

1. レスポンスタイム確認:
   ```bash
   curl -w "\nTime: %{time_total}s\n" https://ma-pilot-backend.onrender.com/health
   ```
   - [ ] 1秒以内にレスポンス

2. Render.com Metrics で確認:
   - [ ] CPU使用率が妥当（< 50%）
   - [ ] メモリ使用率が妥当（< 80%）

---

## モニタリング設定

### Vercel

- [ ] Vercel Analytics が有効化されている
- [ ] エラーアラートが設定されている（オプション）

### Render.com

- [ ] Health Check が設定されている（`/health`）
- [ ] Auto-Deploy が有効化されている
- [ ] アラート通知が設定されている（オプション）

### Supabase

- [ ] Database Health を確認
- [ ] APIリクエスト数を確認
- [ ] ストレージ使用量を確認

---

## ロールバック準備

### Vercel

- [ ] 以前のデプロイが保存されている
- [ ] ロールバック手順を理解している:
  ```bash
  vercel rollback
  # または Deployments > 以前のデプロイ > Promote to Production
  ```

### Render.com

- [ ] 以前のデプロイが保存されている
- [ ] ロールバック手順を理解している:
  - Events > 以前のデプロイ > Redeploy

### データベース

- [ ] データベースバックアップが有効化されている（Supabase自動）
- [ ] 重要なデータは手動でエクスポート済み

---

## ドキュメント確認

- [ ] `docs/DEPLOYMENT_GUIDE.md` が最新
- [ ] `docs/ENVIRONMENT_VARIABLES.md` が最新
- [ ] `README.md` が最新
- [ ] API仕様書が最新（もしあれば）

---

## デプロイ完了後の作業

### ユーザーへの通知

- [ ] 本番環境URLを共有
- [ ] ログイン方法を説明
- [ ] 既知の問題を共有（もしあれば）

### チーム内共有

- [ ] デプロイ日時を記録
- [ ] デプロイしたバージョンを記録
- [ ] 変更内容を共有

### 継続的監視

- [ ] 初日は頻繁にログを確認（1時間ごと）
- [ ] エラーログを監視
- [ ] ユーザーからのフィードバックを収集

---

## トラブルシューティング

デプロイ時に問題が発生した場合:

1. **GitHub Actionsが失敗**:
   - ログを確認してエラー原因を特定
   - ローカルで再現できるか確認
   - 修正後、再度push

2. **Vercelビルドエラー**:
   - ローカルで `npm run build` を実行
   - エラーを修正してpush
   - 環境変数が設定されているか確認

3. **Render.comデプロイエラー**:
   - Logsを確認
   - 環境変数が正しく設定されているか確認
   - `requirements.txt` が最新か確認

4. **ヘルスチェック失敗**:
   - Render.com Logsでエラーを確認
   - Supabase接続を確認
   - 環境変数を再確認

5. **CORSエラー**:
   - バックエンドの `FRONTEND_URL` を確認
   - `main.py` のCORS設定を確認
   - Render.comを再デプロイ

---

## 最終確認

すべてのチェック項目が完了したら:

- [ ] 本番環境が正常に動作している
- [ ] セキュリティが確保されている
- [ ] パフォーマンスが妥当
- [ ] モニタリングが設定されている
- [ ] ロールバック準備ができている
- [ ] ドキュメントが最新

**おめでとうございます！デプロイが完了しました。**

---

## 参考リンク

- [DEPLOYMENT_GUIDE.md](./DEPLOYMENT_GUIDE.md) - 詳細なデプロイ手順
- [ENVIRONMENT_VARIABLES.md](./ENVIRONMENT_VARIABLES.md) - 環境変数ガイド
- [Vercel Documentation](https://vercel.com/docs)
- [Render.com Documentation](https://render.com/docs)
- [Supabase Documentation](https://supabase.com/docs)
