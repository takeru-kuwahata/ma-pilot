# パフォーマンス最適化ガイド

## 目次

1. [概要](#概要)
2. [フロントエンド最適化](#フロントエンド最適化)
3. [バックエンド最適化](#バックエンド最適化)
4. [データベース最適化](#データベース最適化)
5. [計測と監視](#計測と監視)
6. [ベストプラクティス](#ベストプラクティス)

---

## 概要

MA-Pilotシステムのパフォーマンス最適化戦略をまとめたドキュメントです。
高速で快適なユーザー体験を提供するための実装方針と具体的な手法を記載しています。

### パフォーマンス目標

- **ページ読み込み時間**: 2秒以内
- **APIレスポンス時間**: 500ms以内
- **Lighthouseスコア**: 90以上（全カテゴリ）
- **バンドルサイズ**: 1MB以内（gzip圧縮後）

---

## フロントエンド最適化

### 1. コード分割（Code Splitting）

**実装場所**: `frontend/src/App.tsx`

```typescript
// 遅延ロード（Lazy Loading）
const Dashboard = lazy(() => import('./pages/Dashboard').then(m => ({ default: m.Dashboard })));
```

**効果**:
- 初回読み込み時間の短縮
- 必要なコードのみ読み込み
- バンドルサイズの削減

### 2. React Query最適化

**実装場所**: `frontend/src/hooks/useOptimizedQuery.ts`

```typescript
export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 5,  // 5分間キャッシュ利用
      gcTime: 1000 * 60 * 10,     // 10分間キャッシュ保持
      refetchOnWindowFocus: false,
    },
  },
});
```

**効果**:
- 不要なAPIリクエストの削減
- キャッシュによる高速化
- サーバー負荷の軽減

#### カスタムフック一覧

| フック名 | 用途 | キャッシュ戦略 |
|---------|------|--------------|
| `useClinicData` | 医院データ取得 | 静的（30分） |
| `useDashboardData` | ダッシュボードデータ | 動的（2分） |
| `useMonthlyData` | 月次データ取得 | 標準（5分） |
| `useSimulations` | シミュレーション一覧 | 標準（5分） |
| `useMarketAnalysis` | 診療圏分析 | 静的（30分） |
| `useReports` | レポート一覧 | 標準（5分） |
| `useStaffList` | スタッフ一覧 | 標準（5分） |

#### Mutationフック（データ更新）

```typescript
// 月次データ更新
const mutation = useUpdateMonthlyData();
mutation.mutate(data);

// シミュレーション作成
const createSim = useCreateSimulation();
createSim.mutate(simData);

// レポート生成
const genReport = useGenerateReport();
genReport.mutate(reportData);
```

**自動的にキャッシュを無効化**:
- データ更新後、関連するクエリが自動再フェッチ
- ユーザーは常に最新データを参照できる

### 3. バンドル最適化

**実装場所**: `frontend/vite.config.ts`

```typescript
rollupOptions: {
  output: {
    manualChunks: {
      'vendor-react': ['react', 'react-dom', 'react-router-dom'],
      'vendor-mui': ['@mui/material', '@mui/icons-material'],
      'vendor-charts': ['recharts'],
    },
  },
},
```

**効果**:
- ベンダーライブラリのチャンク分割
- ブラウザキャッシュの最適化
- 変更時の再ダウンロード量削減

### 4. Web Vitals計測

**実装場所**: `frontend/src/utils/webVitals.ts`

```typescript
reportWebVitals();
```

**計測指標**:
- **LCP (Largest Contentful Paint)**: 2.5秒以下
- **FID (First Input Delay)**: 100ms以下
- **CLS (Cumulative Layout Shift)**: 0.1以下
- **FCP (First Contentful Paint)**: 1.8秒以下
- **TTFB (Time to First Byte)**: 800ms以下

---

## バックエンド最適化

### 1. レスポンス圧縮（Gzip）

**実装場所**: `backend/main.py`

```python
app.add_middleware(GZipMiddleware, minimum_size=1000)
```

**効果**:
- レスポンスサイズの削減（約70%）
- 転送時間の短縮
- 帯域幅の節約

### 2. パフォーマンス計測ミドルウェア

**実装場所**: `backend/src/middleware/performance.py`

```python
class PerformanceMiddleware(BaseHTTPMiddleware):
    async def dispatch(self, request: Request, call_next):
        start_time = time.time()
        response = await call_next(request)
        process_time = time.time() - start_time
        response.headers['X-Process-Time'] = f'{process_time:.3f}'
        return response
```

**効果**:
- リクエスト処理時間の可視化
- 遅いエンドポイントの特定
- パフォーマンスボトルネックの発見

### 3. キャッシュ戦略

**実装場所**: `backend/src/utils/cache.py`

```python
# 価格マスタキャッシュ（1時間TTL）
price_cache = TTLCache(ttl_seconds=3600, max_size=500)

# 設定情報キャッシュ（30分TTL）
settings_cache = TTLCache(ttl_seconds=1800, max_size=100)
```

**キャッシュ対象**:
- 価格マスタ（更新頻度: 低）
- 設定情報（更新頻度: 低）
- 診療圏分析結果（計算コスト: 高）

---

## データベース最適化

### 1. インデックス設計

**実装場所**: `supabase/migrations/20251226_performance_indexes.sql`

#### 主要インデックス

```sql
-- 医院ID + 年月での検索（最頻出クエリ）
CREATE INDEX idx_monthly_data_clinic_year_month
ON monthly_data(clinic_id, year_month);

-- 医院ID + 作成日時での検索
CREATE INDEX idx_simulations_clinic_created
ON simulations(clinic_id, created_at DESC);
```

#### インデックス戦略

| テーブル | インデックス | 目的 |
|---------|------------|------|
| monthly_data | (clinic_id, year_month) | 月次データ取得 |
| simulations | (clinic_id, created_at) | 最新シミュレーション取得 |
| reports | (clinic_id, created_at) | 最新レポート取得 |
| print_orders | (email, created_at) | 受注履歴取得 |

### 2. クエリ最適化

**ベストプラクティス**:

```sql
-- 悪い例: SELECT *
SELECT * FROM monthly_data WHERE clinic_id = 'xxx';

-- 良い例: 必要なカラムのみ
SELECT id, year_month, total_revenue, total_cost
FROM monthly_data
WHERE clinic_id = 'xxx'
ORDER BY year_month DESC
LIMIT 12;
```

### 3. インデックスメンテナンス

```sql
-- インデックスサイズ確認
SELECT
    tablename,
    indexname,
    pg_size_pretty(pg_relation_size(indexname::regclass)) AS index_size
FROM pg_indexes
WHERE schemaname = 'public'
ORDER BY pg_relation_size(indexname::regclass) DESC;

-- インデックス使用状況確認
SELECT
    schemaname,
    tablename,
    indexname,
    idx_scan,
    idx_tup_read
FROM pg_stat_user_indexes
WHERE schemaname = 'public'
ORDER BY idx_scan DESC;
```

---

## 計測と監視

### 1. フロントエンド計測

#### Web Vitals

開発環境では自動的にコンソールに出力されます。

```javascript
[Web Vitals] LCP: 1245.3
[Web Vitals] FID: 8.2
[Web Vitals] CLS: 0.05
```

#### バンドルサイズ分析

```bash
cd frontend
npm run build:analyze
```

ブラウザで `dist/stats.html` が開き、バンドル構成を可視化できます。

### 2. バックエンド計測

#### APIレスポンス時間

全てのAPIレスポンスに `X-Process-Time` ヘッダーが付与されます。

```
X-Process-Time: 0.123
```

#### 遅いリクエストの警告

1秒以上かかるリクエストは自動的に警告ログに記録されます。

```
WARNING: SLOW REQUEST: GET /api/monthly-data took 1.234s
```

### 3. Lighthouse CI

プルリクエスト時に自動実行され、パフォーマンススコアを計測します。

```yaml
# .github/workflows/lighthouse.yml
```

目標スコア:
- Performance: 90以上
- Accessibility: 90以上
- Best Practices: 90以上
- SEO: 90以上

---

## ベストプラクティス

### フロントエンド

1. **コンポーネントのメモ化（React.memo）**
   ```typescript
   export const KPICard = memo(({ title, value, growthRate }) => {
     // propsが変更されない限り再レンダリングされない
     return <Card>...</Card>;
   });
   ```

2. **計算のメモ化（useMemo）**
   ```typescript
   const chartData = useMemo(() =>
     data.map(item => ({
       month: item.yearMonth.substring(5),
       売上: item.totalRevenue / 10000,
     })),
     [data]
   );
   ```

3. **コールバックのメモ化（useCallback）**
   ```typescript
   const handleSubmit = useCallback((e: React.FormEvent) => {
     e.preventDefault();
     onSubmit({ ...formData });
   }, [formData, onSubmit]);
   ```

4. **遅延ロード（React.lazy）**
   ```typescript
   const Dashboard = lazy(() => import('./pages/Dashboard'));

   <Suspense fallback={<LoadingFallback />}>
     <Dashboard />
   </Suspense>
   ```

5. **React Query DevTools（開発環境のみ）**
   ```typescript
   {import.meta.env.DEV && <ReactQueryDevtools initialIsOpen={false} />}
   ```
   - キャッシュ状態の可視化
   - クエリの監視・デバッグ
   - 手動での無効化・再フェッチ

### バックエンド

1. **N+1クエリの回避**
   ```python
   # 悪い例
   for clinic in clinics:
       data = fetch_monthly_data(clinic.id)

   # 良い例
   clinic_ids = [c.id for c in clinics]
   all_data = fetch_monthly_data_bulk(clinic_ids)
   ```

2. **キャッシュの活用**
   ```python
   cached = price_cache.get(key)
   if cached is None:
       cached = expensive_operation()
       price_cache.set(key, cached)
   ```

3. **非同期処理**
   ```python
   background_tasks.add_task(heavy_operation, data)
   ```

### データベース

1. **適切なインデックス**
   - WHERE句で使用するカラム
   - ORDER BYで使用するカラム
   - 複合インデックスは使用頻度の高い順

2. **SELECT句の最適化**
   - 必要なカラムのみ取得
   - SELECT * は避ける

3. **LIMITの使用**
   - 大量データの取得は避ける
   - ページネーション実装

---

## トラブルシューティング

### パフォーマンス低下時のチェックリスト

- [ ] Web Vitalsスコアの確認
- [ ] バンドルサイズの確認
- [ ] APIレスポンス時間の確認
- [ ] データベースクエリの確認
- [ ] インデックスの使用状況確認
- [ ] キャッシュヒット率の確認
- [ ] ネットワークタブでの検証

### よくある問題と解決策

#### 問題: 初回読み込みが遅い

**原因**:
- バンドルサイズが大きい
- コード分割が不十分

**解決策**:
- `npm run build:analyze` でバンドルを分析
- 不要な依存関係を削除
- コード分割を追加

#### 問題: APIレスポンスが遅い

**原因**:
- N+1クエリ
- インデックス未設定
- キャッシュ未使用

**解決策**:
- クエリを最適化
- 適切なインデックスを追加
- キャッシュを実装

---

## 参考資料

- [Web Vitals](https://web.dev/vitals/)
- [React Performance Optimization](https://react.dev/learn/render-and-commit)
- [FastAPI Performance](https://fastapi.tiangolo.com/advanced/performance/)
- [PostgreSQL Indexes](https://www.postgresql.org/docs/current/indexes.html)
- [Lighthouse CI](https://github.com/GoogleChrome/lighthouse-ci)
