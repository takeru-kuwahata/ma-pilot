# MA-Pilot - 要件定義書

## 要件定義の作成原則

- **「あったらいいな」は絶対に作らない**
- **拡張可能性のための余分な要素は一切追加しない**
- **将来の「もしかして」のための準備は禁止**
- **今、ここで必要な最小限の要素のみ**

---

## 1. プロジェクト概要

### 1.1 成果目標

開業歯科医院がPILOT経由で経営数値を入力・自動取得し、リアルタイムな可視化・目標達成シミュレーション・戦略レポート生成を実現。データ駆動の経営判断と有料プランへの自然な転換を促す。

### 1.2 成功指標

#### 定量的指標

1. 導入医院数: リリース後6ヶ月以内に30医院以上が利用開始
2. データ入力完了率: 初回利用時に70%以上のユーザーが必須項目（売上、固定費、ユニット数等）を入力完了
3. PILOT連携成功率: 95%以上のユーザーでPILOTからのCSVデータ取込が正常動作
4. シミュレーション実行率: 月1回以上シミュレーション機能を使用するユーザーが60%以上
5. レポートDL率: 月1回以上レポートをダウンロード（PDF/CSV）するユーザーが50%以上

#### 定性的指標

1. 意思決定の自信: 「このツールのおかげで経営判断に自信が持てた」と80%以上が回答
2. 入力の手軽さ: 「PILOTデータが自動で入り、追加入力も迷わずできた」と評価
3. シミュレーションの実用性: 「提案された戦略（ユニット増設、採用計画等）が具体的で実践しやすい」と評価
4. レポートの価値: 「生成されたレポートを経営会議や銀行提出に活用できた」と評価

---

## 2. システム全体像

### 2.1 主要機能一覧

- **認証・権限管理**: メール+パスワード認証、4段階の権限管理（システム管理者、医院オーナー、医院編集者、医院閲覧者）
- **経営データ管理**: 売上、固定費、患者数、スタッフ情報等の入力・編集・一括取込
- **PILOT連携**: CSVデータ取込によるPILOT顧客データ活用
- **診療圏分析**: 人口統計・商圏データ取得、競合医院検索、地図表示
- **経営シミュレーション**: 目標逆算、戦略提案、複数シナリオ比較
- **レポート生成**: PDF/CSV形式での経営レポート自動生成
- **管理機能**: 全医院管理、アカウント管理、システム設定

### 2.2 ユーザーロールと権限

#### ゲスト

- ログイン画面のみアクセス可能

#### 医院閲覧者

- 自医院データの閲覧
- レポートダウンロード
- シミュレーション結果閲覧

#### 医院編集者

- 医院閲覧者の権限 +
- 自医院データの入力・編集
- シミュレーション実行
- PILOTデータ取込

#### 医院オーナー

- 医院編集者の権限 +
- 自医院データの削除
- スタッフアカウント管理（招待、権限変更、削除）
- 医院基本情報編集

#### システム管理者

- 全医院データの閲覧・分析
- 医院アカウント管理（有効化・無効化）
- 全医院の集計データ閲覧
- システム設定管理
- サポート対応（医院データの閲覧・修正支援）

### 2.3 認証・認可要件

#### 認証方式

- メール + パスワード認証（Supabase Auth）
- パスワードリセット機能
- 招待メール機能（オーナーが新規スタッフを招待）

#### セキュリティレベル

- 扱うデータ: 医院の経営数値（売上、利益、患者数等）
- セキュリティ分類: 機密情報（社外秘相当）
- 対応策:
  - SSL/TLS通信必須
  - Supabase Row Level Security（RLS）で医院単位のデータ分離
  - パスワードポリシー（8文字以上、英数字混在推奨）
  - セッション管理（一定期間で自動ログアウト）

#### 管理機能

- 必要性: 必須
- 具体的な機能:
  - 医院アカウント一覧・詳細閲覧
  - 医院の有効化・無効化（契約終了時）
  - 全医院の集計データ閲覧（ベンチマーク分析用）
  - サポート対応（医院データの閲覧・修正支援）
  - システム設定（通知メール設定、マスタデータ管理等）

---

## 3. ページ詳細仕様

**✅ 全ページ実装完了（2025-12-26）**

- **コアシステム**: 11ページ（ログイン、ダッシュボード、基礎データ管理、診療圏分析、シミュレーション、レポート、医院設定、スタッフ管理、管理者3ページ）
- **印刷物受注システム**: 3ページ（価格表管理、発注フォーム、発注履歴）
- **Phase 6（ヒアリングシート機能）**: ⏸️ 未実装

**実装詳細**: コードを参照（`frontend/src/pages/`, `backend/src/api/`）

---

## 4. データ設計

**✅ 実装完了（2025-12-26）**

- **データベース**: 8テーブル（clinics, monthly_data, simulations, reports, market_analysis, staff_members, price_tables, print_orders）
- **型定義**: 40+型（User, Clinic, MonthlyData, Simulation, Report, MarketAnalysis, PrintOrder等）

**実装詳細**: コードを参照（`frontend/src/types/index.ts`, `backend/supabase_schema.sql`）

---

## 5. 制約事項

### 外部API制限

- **Google Maps API**: 月10,000リクエストまで無料、超過時は従量課金
- **e-Stat API**: レート制限あり（詳細は要確認）
- **RESAS API**: レート制限あり（詳細は要確認）
- **PILOT**: MVP版では手動CSVエクスポート運用（完全自動化には月額5,500円のWebhook転送機能が必要）

### 技術的制約

- **Supabase無料枠**: DB容量500MB、ストレージ1GB（超過時はProプラン移行必要）
- **Render.com無料枠**: 15分間アクセスなしで自動スリープ、初回アクセス時に起動時間が発生
- **PDF生成**: WeasyPrintはJavaScript実行不可（グラフは事前に画像化が必要）
- **CSV取込**: 1ファイル最大10,000行まで推奨（パフォーマンス考慮）

---

## 6. バックエンドAPI・サービス

**✅ 実装完了（2025-12-26）**

- **APIルーター**: 10個（auth, clinics, monthly_data, dashboard, simulations, reports, market_analysis, staff, admin, print_orders）
- **エンドポイント**: 38個（コア30 + 印刷物受注8）
- **サービス**: 10個（auth_service, clinic_service, dashboard_service, email_service, market_analysis_service, monthly_data_service, pdf_service, print_order_service, report_service, simulation_service）

**実装詳細**: コードを参照（`backend/src/api/`, `backend/src/services/`, `backend/main.py`）

---

## 7. 技術スタック

### フロントエンド

```yaml
言語・フレームワーク:
  - React 18
  - TypeScript 5
  - Vite 5

UIライブラリ:
  - MUI v6（Material-UI）

状態管理:
  - Zustand（グローバル状態）
  - React Query（サーバー状態、キャッシング）

ルーティング:
  - React Router v6

グラフ・チャート:
  - Recharts

フォーム管理:
  - React Hook Form

CSV処理:
  - PapaParse
```

### バックエンド

```yaml
言語・フレームワーク:
  - Python 3.11+
  - FastAPI

データベースSDK:
  - Supabase SDK（PostgreSQL接続、認証）

PDF生成:
  - WeasyPrint

データ分析:
  - Pandas（集計、ベンチマーク分析）

外部API連携:
  - Requests（HTTP通信）

テンプレートエンジン:
  - Jinja2（PDFテンプレート）
```

### データベース・認証

```yaml
サービス:
  - Supabase（PostgreSQL + Auth + Storage）

データベース:
  - PostgreSQL 15

認証:
  - Supabase Auth（メール+パスワード）

ストレージ:
  - Supabase Storage（レポートPDF保存）

リアルタイム:
  - Supabase Realtime（ダッシュボード自動更新）
```

### 外部API

```yaml
必須API（無料）:
  - e-Stat API（人口統計）
  - RESAS API（商圏データ）
  - Community Geocoder（ジオコーディング）
  - Google Maps API（地図、競合検索）

データ連携:
  - PILOT（手動CSVエクスポート）
```

### インフラ

```yaml
フロントエンド:
  - Vercel（無料枠）

バックエンド:
  - Render.com（無料枠）または Railway

CI/CD:
  - GitHub Actions（無料枠）
```

---

## 8. 必要な外部サービス・アカウント

### 必須サービス（無料）

| サービス名 | 用途 | 取得先 | 備考 |
|-----------|------|--------|------|
| Supabase | データベース・認証・ストレージ | https://supabase.com | 無料枠: DB 500MB、5万MAU |
| e-Stat API | 人口統計データ取得 | https://www.e-stat.go.jp/api/ | 政府統計、完全無料 |
| RESAS API | 商圏データ・産業構造 | https://opendata.resas-portal.go.jp/ | 地域経済分析、無料 |
| Google Maps Platform | 地図表示・競合検索 | https://console.cloud.google.com | 無料枠: 月10,000リクエスト |
| Vercel | フロントエンドホスティング | https://vercel.com | 無料枠: 帯域100GB/月 |
| Render.com | バックエンドホスティング | https://render.com | 無料枠: 750時間/月 |

### オプションサービス（次フェーズ）

| サービス名 | 用途 | 取得先 | 備考 |
|-----------|------|--------|------|
| PILOT Webhook転送機能 | リアルタイム顧客データ連携 | PILOT管理画面 | 月額5,500円 |
| MAP-STAR Web | 歯科医院特化診療圏分析 | https://www.medicalark.co.jp/ | 月額17,000円〜 |
| Supabase Pro | DB容量拡大・優先サポート | https://supabase.com | 月額$25 |

---

## 9. 今後の拡張予定

**原則**: 拡張予定があっても、必要最小限の実装のみを行う

- 「あったらいいな」は実装しない
- 拡張可能性のための余分な要素は追加しない
- 将来の「もしかして」のための準備は禁止
- 今、ここで必要な最小限の要素のみを実装

拡張が必要になった時点で、Phase 11: 機能拡張オーケストレーターを使用して追加実装を行います。

### Phase 2: 自動化・高度化

- PILOT Webhook転送機能導入（リアルタイム自動連携）
- LINE Messaging API統合（友だち数自動取得）
- ベンチマーク機能実装（多医院データ比較）

### Phase 3: 高度な分析

- MAP-STAR Web連携（歯科医院特化診療圏分析）
- AIによる経営アドバイス生成
- 予測モデル（将来の売上・患者数予測）

### Phase 4: スケーリング

- Supabase Pro移行（医院数増加対応）
- Redis導入（キャッシュ、セッション管理）
- Celery導入（非同期タスク処理、大量レポート生成）

---

**作成日**: 2025年11月13日
**バージョン**: 1.0（MVP版）

---

## 🆕 Phase 6: ヒアリングシート機能（未実装）

**目的**: クリニックの経営状況を定性的にヒアリングし、AI分析で課題を抽出、適切な企業をレコメンド

**実装時期**: Phase 1-5完了後（デプロイ後に検討）

**主要機能**: ヒアリングフォーム、AI分析、企業レコメンド、Lstep連携

**実装時の詳細設計**: `docs_archive/PHASE6_*.md`を参照

---

## 10. 印刷物受注システム

**✅ 実装完了（2025-12-26）**

**概要**: 診察券、名刺、リコールハガキ等の印刷物注文システム（シカレッジ連携医院向け）

**実装規模**: 3ページ、8エンドポイント、2テーブル

**実装詳細**: コードを参照（`backend/src/api/print_orders.py`, `frontend/src/pages/PrintOrder*.tsx`）

---

## 🆕 機能拡張要件 - UI構造リファクタリング

### 概要
- **目的**: 運営者・医院管理者・医院スタッフの3つのエリアを明確に分離し、権限による適切なアクセス制御を実装
- **ビジネス価値**: ユーザーサポート向上、セキュリティ強化、保守性向上

### 機能要件

#### 1. 3つのエリア分離
- **運営者エリア** (`/admin/*`): system_admin専用
- **医院エリア** (`/clinic/*`): 全スタッフ + system_admin
- **公開エリア** (`/login`): 未認証ユーザー

#### 2. 権限による自動ルーティング
- ログイン後、権限に応じて自動リダイレクト
  - system_admin → `/admin/dashboard`
  - clinic系 → `/clinic/dashboard`
- 旧URL (`/dashboard`等) → `/clinic/*` へ自動リダイレクト

#### 3. system_adminのモード切替
- ヘッダー右上に「運営者モード ⇄ 医院モード」ボタン
- 医院モード時:
  - ヘッダーにクリニック選択ドロップダウン表示
  - 全クリニックを切り替えて表示可能（ユーザーサポート用）
  - 選択状態はページ移動しても保持
  - 全ての医院機能にアクセス可能（clinic_owner相当）

#### 4. 権限別メニュー表示
- **clinic_viewer（閲覧者）**:
  - 表示: ダッシュボード、診療圏分析、レポート管理、印刷物発注、発注履歴
  - 非表示: 基礎データ管理、経営シミュレーション、医院設定、スタッフ管理

- **clinic_editor（編集者）**:
  - 上記 + 基礎データ管理、経営シミュレーション
  - 非表示: 医院設定、スタッフ管理

- **clinic_owner（オーナー）**:
  - 全ての医院機能

- **system_admin（医院モード）**:
  - 全ての医院機能（clinic_owner相当）

#### 5. 印刷物発注機能の配置
- **医院側**: `/clinic/print-order`（発注フォーム）、`/clinic/print-order-history`（発注履歴）
- **運営側**: `/admin/print-orders`（全医院の発注一覧 + ステータス管理）

### 非機能要件
- **セキュリティ**: ルートレベルでの認証・権限チェック
- **保守性**: メニュー定義の単一化、ルーティング構造の階層化
- **UX**: 権限に応じた適切なメニュー表示、クリニック名の明示

### 型定義（TDL）
```typescript
// MenuItemConfig型
interface MenuItemConfig {
  path: string;
  label: string;
  icon: React.ReactNode;
  roles?: UserRole[]; // 未指定 = 全ロール
}

// LayoutMode型
type LayoutMode = 'admin' | 'clinic' | 'public';

// authStore拡張
interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  selectedClinicId: string | null; // system_admin用
  setSelectedClinic: (clinicId: string) => void;
}
```

### 設計判断

#### なぜページごとのuseLayoutを廃止するのか
- **理由**: ルーティング構造とレイアウト選択が分離しており、保守性が低い
- **解決**: ルーターレベルで `/clinic/*` → MainLayout、`/admin/*` → AdminLayout に固定

#### なぜメニュー定義を集約するのか
- **理由**: 現在はMainLayout、AdminLayoutにメニューがハードコード、権限別フィルタリング不可
- **解決**: menuConfig.tsに全メニュー定義 → 権限でフィルタリング

#### なぜAdminModeWrapperが必要か
- **理由**: system_adminが医院モードで操作する際、全クリニックを切り替えて表示する必要がある（ユーザーサポート用）
- **解決**: AdminModeWrapperでクリニック選択UI実装 → 以降のページで選択されたクリニックIDを使用

---
