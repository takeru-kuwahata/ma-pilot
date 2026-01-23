# プロジェクト設定

## 基本設定

```yaml
プロジェクト名: MA-Pilot（歯科医院経営分析システム）
開始日: 2025-11-13
最終更新日: 2025-12-26

実装状況:
  ✅ フロントエンド: 完全実装済み（全10ページ、TypeScriptエラー0件）
  ✅ バックエンド: 完全実装済み（30エンドポイント、セキュリティ実装済み）
  ✅ API統合: 完了（全サービス実API接続済み）
  ✅ コード品質: ESLintエラー0件、ビルド成功
  ⏳ デプロイ: 準備完了、実施中

技術スタック:
  frontend:
    - React 18
    - TypeScript 5
    - Vite 5
    - MUI v6
    - Zustand（状態管理）
    - React Query（サーバー状態）
    - React Router v6
    - Recharts（グラフ）
    - React Hook Form（フォーム）
    - PapaParse（CSV処理）

  backend: ✅ 完全実装済み
    - Python 3.11+
    - FastAPI（main.py 161行、完全実装）
    - Supabase SDK
    - WeasyPrint（PDF生成）
    - Pandas（データ分析）
    - Jinja2（テンプレート）
    - 10個のAPIルーター（30エンドポイント）
    - セキュリティ実装（CORS、レート制限、セキュリティヘッダー）

  database:
    - Supabase（PostgreSQL 15 + Auth + Storage）
    - 8テーブル作成済み + RLS設定完了
```

## 開発環境

```yaml
ポート設定:
  # 複数プロジェクト並行開発のため、一般的でないポートを使用
  frontend: 3247
  backend: 8432
  database: 5433

環境変数:
  設定ファイル: .env.local（ルートディレクトリ）
  必須項目:
    - VITE_SUPABASE_URL=https://your-project.supabase.co
    - VITE_SUPABASE_ANON_KEY=your-anon-key
    - DATABASE_URL=postgresql://...
    - BACKEND_URL=http://localhost:8432
    - E_STAT_API_KEY=your-e-stat-key
    - RESAS_API_KEY=your-resas-key
    - GOOGLE_MAPS_API_KEY=your-google-maps-key
```

## テスト認証情報

```yaml
開発用アカウント:
  システム管理者:
    email: admin@ma-pilot.local
    password: DevAdmin2025!

  テスト医院オーナー:
    email: owner@test-clinic.local
    password: TestOwner2025!

  テスト医院編集者:
    email: editor@test-clinic.local
    password: TestEditor2025!

外部サービス:
  Supabase: 無料枠（DB 500MB、5万MAU）
  e-Stat API: 完全無料（政府統計）
  RESAS API: 完全無料（地域経済分析）
  Google Maps API: 月10,000リクエストまで無料
  Vercel: フロントエンドホスティング（無料枠: 帯域100GB/月）
  Render.com: バックエンドホスティング（無料枠: 750時間/月）
```

## コーディング規約

### 命名規則

```yaml
ファイル名:
  - コンポーネント: PascalCase.tsx（例: DashboardCard.tsx）
  - ページ: PascalCase.tsx（例: ClinicDashboard.tsx）
  - ユーティリティ: camelCase.ts（例: formatCurrency.ts）
  - 定数: UPPER_SNAKE_CASE.ts（例: API_ENDPOINTS.ts）
  - 型定義: types/index.ts（フロントエンド・バックエンド共通）

変数・関数:
  - 変数: camelCase（例: clinicData, totalRevenue）
  - 関数: camelCase（例: calculateProfit, fetchClinicData）
  - 定数: UPPER_SNAKE_CASE（例: MAX_FILE_SIZE, DEFAULT_RADIUS）
  - 型/インターフェース: PascalCase（例: Clinic, MonthlyData, UserRole）
  - Enumや型: PascalCase（例: UserRole, ReportType）

データベーステーブル名:
  - スネークケース、複数形（例: clinics, monthly_data, simulations）
```

### コード品質

```yaml
必須ルール:
  - TypeScript: strictモード有効
  - 未使用の変数/import禁止
  - console.log本番環境禁止（開発環境のみ使用可）
  - エラーハンドリング必須（try-catch、エラー境界）
  - 環境変数は必ず.env.localに記載、コミット禁止

フォーマット:
  - インデント: スペース2つ
  - セミコロン: あり
  - クォート: シングル
  - 行の長さ: 最大120文字推奨

セキュリティ:
  - APIキーは環境変数で管理
  - Supabase RLS（Row Level Security）必須
  - パスワードは必ずハッシュ化
  - XSS対策（React標準のエスケープ機能を活用）
  - SQL Injection対策（Supabase SDK使用、生SQLは禁止）
```

## プロジェクト固有ルール

### APIエンドポイント

```yaml
命名規則:
  - RESTful形式を厳守
  - 複数形を使用（/clinics, /simulations, /reports）
  - ケバブケース使用（/monthly-data, /market-analysis）

エンドポイント例:
  認証:
    - POST /auth/login
    - POST /auth/logout
    - POST /auth/reset-password

  医院データ:
    - GET /api/clinics/{clinic_id}
    - PUT /api/clinics/{clinic_id}
    - POST /api/clinics

  月次データ:
    - GET /api/monthly-data?clinic_id={id}&year_month={YYYY-MM}
    - POST /api/monthly-data
    - PUT /api/monthly-data/{id}
    - DELETE /api/monthly-data/{id}

  シミュレーション:
    - GET /api/simulations?clinic_id={id}
    - POST /api/simulations
    - GET /api/simulations/{id}

  レポート:
    - POST /api/reports/generate
    - GET /api/reports?clinic_id={id}
    - GET /api/reports/{id}/download

  診療圏分析:
    - GET /api/market-analysis/{clinic_id}
    - POST /api/market-analysis

  管理者専用:
    - GET /api/admin/dashboard
    - GET /api/admin/clinics
    - POST /api/admin/clinics
    - PUT /api/admin/clinics/{id}/activate
    - PUT /api/admin/clinics/{id}/deactivate
```

### 型定義

```yaml
配置:
  frontend: src/types/index.ts
  backend: src/types/index.ts

同期ルール:
  - 両ファイルは常に同一内容を保つ
  - 片方を更新したら即座にもう片方も更新
  - API Request/Responseの型は必ず定義

主要な型:
  - UserRole: system_admin | clinic_owner | clinic_editor | clinic_viewer
  - Clinic: 医院基本情報
  - MonthlyData: 月次経営データ
  - Simulation: シミュレーション結果
  - Report: レポート情報
  - MarketAnalysis: 診療圏分析結果
```

### データバリデーション

```yaml
フロントエンド:
  - React Hook Formでバリデーション
  - 必須項目、数値範囲、メール形式等をチェック
  - エラーメッセージは日本語で分かりやすく

バックエンド:
  - Pydantic（FastAPI）でバリデーション
  - フロントエンドと同じルールを適用（二重チェック）
  - データベース制約（NOT NULL、CHECK制約）も設定
```

### 権限チェック

```yaml
実装箇所:
  - フロントエンド: ルーティングレベル、コンポーネントレベル
  - バックエンド: 各APIエンドポイントで必ずチェック

権限マトリックス:
  ゲスト: ログイン画面のみ
  医院閲覧者: 自医院データの閲覧のみ
  医院編集者: 自医院データの閲覧・編集
  医院オーナー: 自医院データの全操作 + スタッフ管理
  システム管理者: 全医院データへのアクセス + システム設定
```

## 🆕 最新技術情報（知識カットオフ対応）

```yaml
# Web検索で解決した破壊的変更を記録

MUI v6:
  - 注意点: v5からの破壊的変更あり、移行ガイド参照必須
  - ThemeProvider使用時、CssBaselineを必ず配置

React Router v6:
  - Switch → Routes
  - useHistory → useNavigate
  - exact属性は不要

Supabase:
  - Row Level Security（RLS）は必須で有効化
  - clinic_idでのデータ分離を実装
  - Auth HookでユーザーロールとClinic IDを取得

WeasyPrint:
  - JavaScript実行不可
  - グラフはmatplotlibでPNG生成→Base64エンコード→HTML埋め込み
```

## 開発フロー

```yaml
Phase 1: 要件定義（完了）
Phase 2: Git/GitHub管理（推奨）
Phase 3: フロントエンド基盤
Phase 4: ページ実装
  - P-001: ログイン/アカウント作成
  - P-002: 経営ダッシュボード
  - P-003: 基礎データ管理
  - P-004: 診療圏分析
  - P-005: 経営シミュレーション
  - P-006: レポート生成・管理
  - P-007: 医院設定・スタッフ管理
  - A-001: 管理ダッシュボード
  - A-002: 医院アカウント管理
  - A-003: システム設定
Phase 5-10: バックエンド・統合・テスト
Phase 11: 機能拡張
```

## 外部API設定メモ

```yaml
e-Stat API:
  - 取得先: https://www.e-stat.go.jp/api/
  - 用途: 人口統計データ取得（小地域別）
  - 制約: レート制限あり（要確認）

RESAS API:
  - 取得先: https://opendata.resas-portal.go.jp/
  - 用途: 商圏データ、産業構造、人口動態
  - 制約: レート制限あり（要確認）

Google Maps API:
  - 取得先: https://console.cloud.google.com
  - 用途: 地図表示、競合歯科医院検索
  - 制約: 月10,000リクエストまで無料

Community Geocoder:
  - 用途: 住所→緯度経度変換
  - 無料、レート制限なし
```

## PDF生成の注意点

```yaml
技術スタック:
  - WeasyPrint（Python）
  - Jinja2テンプレート
  - matplotlib（グラフ画像生成）

制約:
  - JavaScriptは実行不可
  - グラフは事前にPNG画像化が必要

手順:
  1. matplotlibでグラフ生成（PNG）
  2. Base64エンコード
  3. Jinja2テンプレートにデータ埋め込み
  4. WeasyPrintでPDF生成
  5. Supabase Storageに保存
```

## CSV取込の注意点

```yaml
制約:
  - 1ファイル最大10,000行まで推奨
  - フォーマット: UTF-8 BOM付き推奨（Excel互換）

PILOTデータ取込:
  - MVP版: 手動CSVエクスポート運用
  - 将来版: Webhook転送機能導入（月額5,500円）

処理フロー:
  1. CSVファイルアップロード
  2. PapaParse（フロントエンド）またはPython csv（バックエンド）でパース
  3. バリデーション（必須項目、数値範囲）
  4. エラー行をスキップ、成功行のみInsert/Update
  5. 結果サマリー表示（成功XX件、エラーXX件）
```

## デプロイ設定

```yaml
フロントエンド（Vercel）:
  - ビルドコマンド: npm run build
  - 出力ディレクトリ: dist
  - 環境変数: Vercelダッシュボードで設定

バックエンド（Render.com）:
  - ビルドコマンド: pip install -r requirements.txt
  - 起動コマンド: uvicorn main:app --host 0.0.0.0 --port 8432
  - 環境変数: Renderダッシュボードで設定
  - 注意: 15分間アクセスなしで自動スリープ

CI/CD（GitHub Actions）:
  - プルリクエスト時: Lint + 型チェック + テスト
  - mainマージ時: 自動デプロイ（Vercel + Render）
```

## ドキュメント管理ルール

```yaml
ドキュメント配置:
  現役ドキュメント（docs/）:
    - requirements.md: 現在の要件定義（未実装機能含む）
    - SCOPE_PROGRESS.md: 進捗管理
    - デプロイ手順書・トラブルシューティング等の運用ドキュメント
    - 開発中・参照中のドキュメント

  アーカイブ（docs_archive/）:
    - 実装完了済みの詳細設計（コードが真実源となったもの）
    - Phase 6未実装機能の詳細設計（実装時に最新化して再作成）
    - 調査資料・事例研究（企画段階で使用、実装フェーズでは不要）

管理方針:
  - 実装完了後は詳細設計をdocs_archiveへ移動
  - コードを真実源として、ドキュメントは参照用のみ
  - アーカイブは削除せず、ローカル保管（必要時に参照可能）
  - docs_archiveはGit管理外（.gitignore）、Claude Code読み込み対象外（.claudeignore）

アーカイブ済みファイル（2026-01-23時点）:
  実装完了済み詳細設計:
    - API_REFERENCE.md (1,161行) - 全30エンドポイント実装済み
    - DATABASE_SCHEMA.md (568行) - Supabaseスキーマ実装済み
    - BACKEND_IMPLEMENTATION.md (451行) - バックエンド実装完了

  Phase 6 未実装機能の詳細設計:
    - PHASE6_API_DESIGN.md (682行)
    - PHASE6_DATABASE_DESIGN.md (686行)
    - PHASE6_COMPONENT_DESIGN.md (708行)
    - PHASE6_AI_INTEGRATION.md (604行)
    - PHASE6_HEARING_REQUIREMENTS.md
    - PHASE6_IMPLEMENTATION_PLAN.md
    - PHASE6_COMPANY_CSV_FORMAT.md

  調査資料:
    - SHIKA_COLLEGE_GLOBAL_CASE_STUDIES.md (883行)
```

## プロジェクト原則

```yaml
最小限の実装:
  - 「あったらいいな」は実装しない
  - 拡張可能性のための余分な要素は追加しない
  - 将来の「もしかして」のための準備は禁止
  - 今、ここで必要な最小限の要素のみ

拡張は後から:
  - Phase 11: 機能拡張オーケストレーターで追加実装
  - MVP完成後に追加機能を検討

ドキュメント管理:
  - 実装完了後は詳細設計をdocs_archiveへ移動
  - コードを真実源とし、重複ドキュメントは作成しない
  - Claude Codeフリーズ防止のため、不要なドキュメントはアーカイブ
```
