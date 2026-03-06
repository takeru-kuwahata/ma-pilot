# MA-Pilot モニタリング設定ガイド

本番環境のMA-Pilotシステムを監視するためのモニタリング設定とヘルスチェック手順をまとめています。

## 目次

1. [ヘルスチェックエンドポイント](#ヘルスチェックエンドポイント)
2. [Vercelモニタリング](#vercelモニタリング)
3. [Render.comモニタリング](#rendercomモニタリング)
4. [Supabaseモニタリング](#supabaseモニタリング)
5. [外部監視サービス](#外部監視サービス)
6. [アラート設定](#アラート設定)
7. [ログ管理](#ログ管理)

---

## ヘルスチェックエンドポイント

### バックエンド ヘルスチェック

#### エンドポイント
```
GET /health
```

#### レスポンス例
```json
{
  "status": "healthy",
  "environment": "production",
  "version": "1.0.0"
}
```

#### ステータスコード
- `200 OK`: システム正常
- `500 Internal Server Error`: システム異常

#### 手動確認
```bash
# 本番環境
curl https://ma-pilot-backend.onrender.com/health

# 期待されるレスポンス
# {"status":"healthy","environment":"production","version":"1.0.0"}
```

#### 自動監視設定（Render.com）

Render.comの設定:
- **Health Check Path**: `/health`
- **Health Check Interval**: 60秒
- **Health Check Timeout**: 30秒
- **Failure Threshold**: 3回連続失敗でアラート

設定手順:
1. Render.comダッシュボード > Web Service
2. Settings > Health & Alerts
3. 上記の値を入力して保存

---

## Vercelモニタリング

### Vercel Analytics

Vercel Analyticsでフロントエンドのパフォーマンスとトラフィックを監視します。

#### 有効化手順
1. Vercelダッシュボード > プロジェクトを選択
2. Analytics タブに移動
3. Enable Analytics をクリック

#### 監視指標

##### Web Vitals
- **LCP (Largest Contentful Paint)**: 最大コンテンツの描画時間
  - 目標: < 2.5秒
- **FID (First Input Delay)**: 初回入力遅延
  - 目標: < 100ms
- **CLS (Cumulative Layout Shift)**: レイアウトシフト累積
  - 目標: < 0.1

##### トラフィック
- ページビュー数
- ユニークビジター数
- リファラー
- デバイス・ブラウザ情報

##### エラー
- JavaScriptエラー数
- エラー率
- エラースタックトレース

#### アクセス方法
```
Vercelダッシュボード > プロジェクト > Analytics
```

### デプロイメント監視

#### デプロイステータス
- **Building**: ビルド中
- **Ready**: デプロイ成功
- **Error**: デプロイ失敗

#### アクセス方法
```
Vercelダッシュボード > プロジェクト > Deployments
```

#### GitHub統合
GitHub ActionsとVercelが連携し、プルリクエストごとにプレビューデプロイを作成。

---

## Render.comモニタリング

### Metrics（メトリクス）

Render.comダッシュボードで以下のメトリクスを確認できます。

#### CPU使用率
- 目標: < 80%
- アラート: > 90%で通知

#### メモリ使用率
- 目標: < 512MB（無料プラン）
- アラート: > 450MBで通知

#### レスポンスタイム
- 目標: < 500ms（平均）
- アラート: > 1秒（平均）で通知

#### リクエスト数
- リクエスト/秒
- エラー率

#### アクセス方法
```
Render.comダッシュボード > Web Service > Metrics
```

### ログ監視

#### リアルタイムログ
```
Render.comダッシュボード > Web Service > Logs
```

#### ログレベル
- **INFO**: 通常の動作ログ
- **WARNING**: 警告（要注意）
- **ERROR**: エラー（要対応）
- **CRITICAL**: 致命的エラー（即座に対応）

#### ログ出力設定（backend）

`main.py` でログレベルを設定:
```python
import logging

# 本番環境ではWARNING以上のみ出力
log_level = os.getenv("LOG_LEVEL", "WARNING")
logging.basicConfig(level=log_level)
```

### Events（イベント）

デプロイ履歴、サービス再起動、スケーリングイベントを確認できます。

```
Render.comダッシュボード > Web Service > Events
```

---

## Supabaseモニタリング

### Dashboard

Supabaseダッシュボードで以下を監視します。

#### APIリクエスト数
- 日次・週次・月次のリクエスト数
- 無料プランの制限: 50,000 MAU（Monthly Active Users）

#### データベースサイズ
- 使用容量
- 無料プランの制限: 500MB

#### ストレージサイズ
- ファイル保存容量
- 無料プランの制限: 1GB

#### アクティブユーザー数
- 認証済みユーザー数
- 直近のログイン数

#### アクセス方法
```
Supabase > プロジェクト > Dashboard
```

### Database Performance

#### クエリパフォーマンス
```
Supabase > Database > Query Performance
```

遅いクエリを特定し、インデックス追加などで最適化。

#### テーブルサイズ
```sql
SELECT
  schemaname,
  tablename,
  pg_size_pretty(pg_total_relation_size(schemaname||'.'||tablename)) AS size
FROM pg_tables
WHERE schemaname = 'public'
ORDER BY pg_total_relation_size(schemaname||'.'||tablename) DESC;
```

### Auth Logs

認証関連のログを確認:
```
Supabase > Authentication > Logs
```

- ログイン成功/失敗
- パスワードリセット
- メール確認

---

## 外部監視サービス

### UptimeRobot（推奨）

無料の外部監視サービスで、サイトダウン時にメール通知を受け取れます。

#### 設定手順

1. https://uptimerobot.com にアクセス
2. アカウント作成（無料プラン: 50モニターまで）
3. "Add New Monitor" をクリック

#### バックエンド監視設定
- **Monitor Type**: HTTP(s)
- **Friendly Name**: MA-Pilot Backend
- **URL**: `https://ma-pilot-backend.onrender.com/health`
- **Monitoring Interval**: 5分
- **Alert Contacts**: メールアドレス

#### フロントエンド監視設定
- **Monitor Type**: HTTP(s)
- **Friendly Name**: MA-Pilot Frontend
- **URL**: `https://your-project.vercel.app`
- **Monitoring Interval**: 5分
- **Alert Contacts**: メールアドレス

#### Render.comスリープ対策

Render.comの無料プランは15分間アクセスなしで自動スリープします。UptimeRobotで5分間隔で監視することで、常時起動状態を保てます。

### その他の監視サービス

#### Pingdom
- 有料（$10/月〜）
- 詳細なパフォーマンス分析

#### StatusCake
- 無料プランあり
- 複数地域からの監視

#### Datadog
- 有料（$15/月〜）
- 包括的な監視・分析

---

## アラート設定

### Vercel

#### ビルド失敗アラート
Vercel > Settings > Notifications で以下を有効化:
- Deployment Failed
- Deployment Succeeded（オプション）

通知先:
- Email
- Slack（Webhook設定）

### Render.com

#### サービスダウンアラート
Render.com > Settings > Notifications で以下を有効化:
- Service Down
- Deploy Failed

通知先:
- Email

### Supabase

#### 使用量アラート
Supabase > Settings > Billing で以下を有効化:
- Database size approaching limit
- API requests approaching limit
- Storage approaching limit

通知先:
- Email

---

## ログ管理

### フロントエンドログ

#### ブラウザコンソール
本番環境では `console.log` を削除し、エラーのみ記録。

```typescript
// エラーログのみ
console.error('API request failed:', error);
```

#### エラートラッキング（オプション）

Sentry等のエラートラッキングサービスを導入:
```bash
npm install @sentry/react
```

```typescript
import * as Sentry from '@sentry/react';

Sentry.init({
  dsn: process.env.VITE_SENTRY_DSN,
  environment: 'production',
});
```

### バックエンドログ

#### Render.comログ
```
Render.comダッシュボード > Web Service > Logs
```

#### ログレベル設定
```bash
# .env.production
LOG_LEVEL=WARNING
```

#### ログフォーマット
```python
import logging

logging.basicConfig(
    level=logging.WARNING,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
```

### Supabaseログ

#### API Logs
```
Supabase > Logs > API
```

APIリクエストのログを確認。

#### Database Logs
```
Supabase > Logs > Database
```

データベースクエリのログを確認。

---

## 定期チェック項目

### 毎日
- [ ] Render.com `/health` エンドポイント確認
- [ ] UptimeRobotステータス確認
- [ ] エラーログ確認（Vercel/Render.com）

### 毎週
- [ ] Vercel Analyticsレビュー（トラフィック、エラー率）
- [ ] Render.com Metricsレビュー（CPU、メモリ、レスポンスタイム）
- [ ] Supabase使用量確認（DB、ストレージ、API）

### 毎月
- [ ] パフォーマンステスト実施
- [ ] コスト確認（無料枠の使用状況）
- [ ] セキュリティアラート確認
- [ ] データベースバックアップ確認

---

## トラブルシューティング

### フロントエンドが遅い

1. Vercel Analytics > Web Vitalsを確認
2. LCP > 2.5秒の場合:
   - 画像最適化（WebP形式）
   - Code Splitting導入
   - 不要な依存関係削除

### バックエンドが遅い

1. Render.com > Metricsを確認
2. レスポンスタイム > 1秒の場合:
   - データベースクエリ最適化
   - インデックス追加
   - キャッシュ導入検討

### データベースが遅い

1. Supabase > Database > Query Performanceを確認
2. 遅いクエリに対して:
   - インデックス追加
   - N+1クエリ解消
   - クエリ最適化

### サービスダウン

1. Render.com > Logsを確認
2. エラーメッセージに応じて対応:
   - メモリ不足: 有料プランへアップグレード
   - クラッシュ: コード修正してデプロイ
   - Supabase接続エラー: 環境変数確認

---

## まとめ

本番環境の監視には以下の3つのダッシュボードを定期的に確認してください:

1. **Vercel**: フロントエンドのパフォーマンス・エラー
2. **Render.com**: バックエンドのパフォーマンス・ログ
3. **Supabase**: データベース・認証・ストレージ

外部監視サービス（UptimeRobot等）を導入することで、ダウンタイムを最小限に抑えられます。
