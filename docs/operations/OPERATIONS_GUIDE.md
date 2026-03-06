# MA-Pilot 運用ガイド

## デプロイ手順

### Vercel（フロントエンド）

#### 初回デプロイ

1. Vercelアカウントにログイン
2. 「New Project」をクリック
3. GitHubリポジトリ連携
4. プロジェクト設定:
   - **Framework Preset**: Vite
   - **Root Directory**: `frontend`
   - **Build Command**: `npm run build`
   - **Output Directory**: `dist`

5. 環境変数設定:
   ```
   VITE_SUPABASE_URL=https://your-project.supabase.co
   VITE_SUPABASE_ANON_KEY=your-anon-key
   VITE_BACKEND_URL=https://your-backend.onrender.com
   ```

6. 「Deploy」をクリック

#### 更新デプロイ

```bash
git push origin main  # 自動デプロイ
```

---

### Render.com（バックエンド）

#### 初回デプロイ

1. Render.comアカウントにログイン
2. 「New Web Service」をクリック
3. GitHubリポジトリ連携
4. サービス設定:
   - **Name**: ma-pilot-backend
   - **Root Directory**: `backend`
   - **Environment**: Python 3
   - **Build Command**: `pip install -r requirements.txt`
   - **Start Command**: `uvicorn main:app --host 0.0.0.0 --port 8432`

5. 環境変数設定（`.env.production`参照）:
   ```
   SUPABASE_URL=https://your-project.supabase.co
   SUPABASE_KEY=your-service-role-key
   DATABASE_URL=postgresql://...
   ENVIRONMENT=production
   HOST=0.0.0.0
   PORT=8432
   FRONTEND_URL=https://your-frontend.vercel.app
   ```

6. 「Create Web Service」をクリック

#### 更新デプロイ

```bash
git push origin main  # 自動デプロイ
```

---

## 環境変数設定

### フロントエンド（.env.local）

```env
# Supabase
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key

# Backend
VITE_BACKEND_URL=http://localhost:8432  # 開発環境
# VITE_BACKEND_URL=https://your-backend.onrender.com  # 本番環境
```

### バックエンド（.env）

```env
# Supabase
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_KEY=your-service-role-key
DATABASE_URL=postgresql://user:password@host:5432/database

# Application
ENVIRONMENT=development
HOST=0.0.0.0
PORT=8432
FRONTEND_URL=http://localhost:3247  # 開発環境
# FRONTEND_URL=https://your-frontend.vercel.app  # 本番環境

# External APIs
E_STAT_API_KEY=your-e-stat-key
RESAS_API_KEY=your-resas-key
GOOGLE_MAPS_API_KEY=your-google-maps-key
```

---

## ログ確認方法

### Vercel

1. Vercelダッシュボード→プロジェクト選択
2. 「Deployments」タブ→デプロイ選択
3. 「Functions」タブでログ確認

### Render.com

1. Render.comダッシュボード→サービス選択
2. 「Logs」タブでリアルタイムログ確認
3. 「Events」タブでデプロイ履歴確認

### Supabase

1. Supabaseダッシュボード→プロジェクト選択
2. 「Logs」→「Postgres Logs」でSQL実行履歴確認
3. 「Logs」→「Functions Logs」でエラーログ確認

---

## モニタリング

### フロントエンド

- **Vercel Analytics**: ページビュー、ユーザー数
- **Web Vitals**: Core Web Vitals（LCP、FID、CLS）

### バックエンド

- **Render.com Metrics**: CPU、メモリ使用率
- **Uptime Monitor**: ヘルスチェック監視

### データベース

- **Supabase Dashboard**: テーブルサイズ、接続数

---

## バックアップ・リストア

### データベースバックアップ

#### 自動バックアップ

- Supabaseが毎日自動バックアップ（無料プラン: 7日間保持）

#### 手動バックアップ

```bash
# Supabase CLIでダンプ
supabase db dump -f backup_$(date +%Y%m%d).sql

# S3にアップロード（オプション）
aws s3 cp backup_$(date +%Y%m%d).sql s3://your-bucket/backups/
```

### リストア手順

1. Supabaseダッシュボード→プロジェクト選択
2. 「Database」→「Backups」
3. バックアップ選択→「Restore」

---

## スケールアウト

### フロントエンド

- Vercel CDNが自動スケール（追加設定不要）

### バックエンド

#### Render.com

1. ダッシュボード→サービス選択
2. 「Settings」→「Instance Type」
3. インスタンスサイズ変更（Starter→Pro）

#### 水平スケール

1. 「Settings」→「Auto Scaling」
2. 最小・最大インスタンス数設定

### データベース

#### Supabase

1. ダッシュボード→プロジェクト選択
2. 「Settings」→「Billing」
3. ProプランまたはTeamプランへアップグレード

---

## ロールバック手順

### フロントエンド（Vercel）

1. Vercelダッシュボード→プロジェクト選択
2. 「Deployments」タブ
3. 前回のデプロイ選択→「Promote to Production」

### バックエンド（Render.com）

1. Render.comダッシュボード→サービス選択
2. 「Events」タブ
3. 前回のデプロイ選択→「Redeploy」

### データベース

1. Supabaseダッシュボード→「Database」→「Backups」
2. ロールバック先のバックアップ選択→「Restore」

---

## インシデント対応

### レベル1: サービス停止

1. **検知**: Uptime Monitorアラート、Slackチャンネル通知
2. **初動対応**:
   - Vercel/Render.comステータスページ確認
   - ログ確認（エラーメッセージ特定）
3. **復旧作業**:
   - 直前のデプロイをロールバック
   - データベース接続確認
4. **報告**: ユーザー通知、インシデントレポート作成

### レベル2: パフォーマンス低下

1. **検知**: Web Vitalsスコア低下、レスポンス時間増加
2. **原因調査**:
   - CPU/メモリ使用率確認
   - スロークエリ確認（Supabase Logs）
3. **対処**:
   - インデックス追加
   - キャッシュ設定見直し
   - スケールアップ

### レベル3: データ不整合

1. **検知**: ユーザー報告、データ検証エラー
2. **影響範囲調査**:
   - SQL実行履歴確認
   - 影響を受けたレコード数確認
3. **復旧**:
   - バックアップからリストア
   - スクリプトで手動修正

---

## セキュリティ

### 定期メンテナンス

#### 毎週

- [ ] 依存パッケージ脆弱性チェック（`npm audit`, `pip-audit`）
- [ ] ログ確認（不審なアクセスパターン）

#### 毎月

- [ ] アクセスログ分析
- [ ] RLSポリシー見直し
- [ ] 環境変数ローテーション

#### 四半期ごと

- [ ] ペネトレーションテスト
- [ ] セキュリティ監査

---

## アラート設定

### Uptime Monitor

- **ツール**: UptimeRobot（無料プラン）
- **監視対象**:
  - フロントエンド: `https://your-frontend.vercel.app/health`
  - バックエンド: `https://your-backend.onrender.com/health`
- **通知先**: Slackチャンネル

### Slack通知設定

```yaml
# Vercel
Webhookをプロジェクト設定に追加

# Render.com
Notificationsで「Slack」を選択
```

---

**最終更新**: 2025年12月26日
