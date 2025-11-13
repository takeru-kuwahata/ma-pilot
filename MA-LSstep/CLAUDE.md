# プロジェクト設定

## 基本設定
```yaml
プロジェクト名: Lステップ連動 経営管理・戦略シミュレーション機能
開始日: 2025-11-06
技術スタック:
  frontend:
    - React 18
    - TypeScript 5
    - MUI v6
    - Zustand
    - React Query
    - Vite 5
  backend:
    - Python 3.11+
    - FastAPI
    - Supabase SDK
    - WeasyPrint
    - Pandas
  database:
    - Supabase (PostgreSQL 15 + Auth + Storage)
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
    # Supabase
    - SUPABASE_URL
    - SUPABASE_ANON_KEY

    # 外部API
    - GOOGLE_MAPS_API_KEY
    - E_STAT_API_KEY
    - RESAS_API_KEY

    # フロントエンド（Vite）
    - VITE_SUPABASE_URL
    - VITE_SUPABASE_ANON_KEY
    - VITE_GOOGLE_MAPS_API_KEY
```

## テスト認証情報
```yaml
開発用アカウント:
  # システム管理者
  admin:
    email: admin@ma-lstep.local
    password: AdminTest2025!

  # テスト医院オーナー
  clinic_owner:
    email: owner@testclinic.local
    password: OwnerTest2025!

  # テスト医院編集者
  clinic_editor:
    email: editor@testclinic.local
    password: EditorTest2025!

外部サービス:
  Supabase: プロジェクト作成後に接続情報を設定
  Google Maps API: APIキー取得後に設定
  e-Stat API: APIキー取得後に設定
  RESAS API: APIキー取得後に設定
```

## コーディング規約

### 命名規則
```yaml
ファイル名:
  - コンポーネント: PascalCase.tsx (例: Dashboard.tsx, ClinicSettings.tsx)
  - ページ: PascalCase.tsx (例: LoginPage.tsx, DataManagementPage.tsx)
  - ユーティリティ: camelCase.ts (例: formatCurrency.ts, calculateKPI.ts)
  - 定数: UPPER_SNAKE_CASE.ts (例: API_ENDPOINTS.ts, ERROR_MESSAGES.ts)
  - 型定義: PascalCase.ts (例: Clinic.ts, MonthlyData.ts)

変数・関数:
  - 変数: camelCase (例: clinicData, monthlyRevenue)
  - 関数: camelCase (例: fetchClinicData, calculateProfitRate)
  - 定数: UPPER_SNAKE_CASE (例: MAX_UPLOAD_SIZE, DEFAULT_PAGE_SIZE)
  - 型/インターフェース: PascalCase (例: Clinic, MonthlyData, User)
  - Enum: PascalCase (例: UserRole, ReportType)
```

### コード品質
```yaml
必須ルール:
  - TypeScript: strictモード有効
  - 未使用の変数/import禁止
  - console.log本番環境禁止（開発時はconsole.debugを使用、本番ビルド時に自動削除）
  - エラーハンドリング必須（try-catch、エラーバウンダリ）
  - 非同期処理は必ずasync/awaitまたはPromiseチェーン

フォーマット:
  - インデント: スペース2つ
  - セミコロン: あり
  - クォート: シングル
  - 行末カンマ: あり（trailing comma）
  - 最大行長: 100文字
```

### コミットメッセージ
```yaml
形式: [type]: [description]

type:
  - feat: 新機能
  - fix: バグ修正
  - docs: ドキュメント
  - style: フォーマット（コード動作に影響しない変更）
  - refactor: リファクタリング
  - test: テスト
  - chore: その他（ビルド設定、依存関係等）

例:
  - "feat: 経営ダッシュボードのKPI表示機能を追加"
  - "fix: シミュレーション計算ロジックの不具合を修正"
  - "docs: 診療圏分析APIの使用方法を追記"
```

## プロジェクト固有ルール

### APIエンドポイント
```yaml
命名規則:
  - RESTful形式を厳守
  - 複数形を使用 (/clinics, /monthly-data, /simulations)
  - ケバブケース使用 (/market-analysis, /user-permissions)

エンドポイント例:
  認証:
    - POST /api/auth/login
    - POST /api/auth/logout
    - POST /api/auth/reset-password

  医院管理:
    - GET /api/clinics
    - POST /api/clinics
    - GET /api/clinics/{clinic_id}
    - PUT /api/clinics/{clinic_id}
    - DELETE /api/clinics/{clinic_id}

  月次データ:
    - GET /api/monthly-data?clinic_id={id}
    - POST /api/monthly-data
    - PUT /api/monthly-data/{data_id}
    - DELETE /api/monthly-data/{data_id}

  シミュレーション:
    - POST /api/simulations
    - GET /api/simulations?clinic_id={id}
    - GET /api/simulations/{simulation_id}

  レポート:
    - POST /api/reports/generate
    - GET /api/reports?clinic_id={id}
    - GET /api/reports/{report_id}/download
```

### 型定義
```yaml
配置:
  frontend: src/types/index.ts
  backend: app/models/schemas.py

同期ルール:
  - フロントエンドとバックエンドの型定義は常に同一内容を保つ
  - バックエンドでPydanticモデルを定義したら、即座にフロントエンドのTypeScript型も更新
  - APIレスポンス形式は必ず型定義を作成

重要な型:
  - User
  - Clinic
  - MonthlyData
  - Simulation
  - Report
  - MarketAnalysis
  - UserRole (Enum)
  - ReportType (Enum)
```

### エラーハンドリング
```yaml
原則:
  - 全ての非同期処理はtry-catchで囲む
  - エラーメッセージはユーザーフレンドリーに
  - エラーログは詳細に（Sentryへの送信を想定）

エラーコード:
  400: Bad Request（入力エラー、バリデーションエラー）
  401: Unauthorized（認証エラー）
  403: Forbidden（権限エラー）
  404: Not Found（リソースが存在しない）
  409: Conflict（データ重複等）
  500: Internal Server Error（サーバー内部エラー）

フロントエンドでの処理:
  - React QueryのonErrorで統一的にエラーハンドリング
  - トースト通知でユーザーにエラーを表示
  - 必要に応じてエラーページにリダイレクト
```

## 🆕 最新技術情報（知識カットオフ対応）

```yaml
# Web検索で解決した破壊的変更を記録

MUI v6 (2024年):
  - 注意点: styled-componentsからEmotionへの移行
  - 対応: @mui/material/stylesを使用

React 18:
  - 注意点: StrictModeでuseEffectが2回実行される（開発環境のみ）
  - 対応: クリーンアップ関数を適切に実装

FastAPI + Pydantic v2:
  - 注意点: Pydantic v1からv2への破壊的変更
  - 対応: v2の新しいバリデーション記法を使用

Supabase Auth:
  - 注意点: session管理の変更（2024年）
  - 対応: supabase.auth.getSession()を使用（getUser()は非推奨）
```

## ⚠️ プロジェクト固有の注意事項

```yaml
MVP版の制約:
  - Lステップ連携は手動CSV運用（Webhook転送は次フェーズ）
  - 無料枠での運用を前提（Supabase 500MB、Google Maps月10,000リクエスト）
  - ベンチマーク機能は後回し（多医院データ蓄積後に実装）

外部API利用時の注意:
  - Google Maps APIは無料枠超過に注意（使用量アラート設定必須）
  - e-Stat、RESAS APIはレート制限を考慮（適切なキャッシング）
  - Community Geocoderは日本国内住所のみ対応

セキュリティ:
  - Row Level Security（RLS）を必ず実装（医院単位のデータ分離）
  - 環境変数は絶対にGitにコミットしない（.env.localは.gitignoreに追加済み）
  - パスワードは8文字以上、英数字混在を推奨

パフォーマンス:
  - PDF生成は重い処理のため、バックグラウンドタスク化を検討
  - CSV取込は1ファイル最大10,000行を推奨
  - ダッシュボードのKPI計算はキャッシング実装を検討
```

## 📝 作業ログ（最新5件）

```yaml
- 2025-11-06: 要件定義書作成完了（docs/requirements.md）
- 2025-11-06: SCOPE_PROGRESS作成完了（docs/SCOPE_PROGRESS.md）
- 2025-11-06: CLAUDE.md作成完了
- 2025-11-06: 技術スタック決定（React 18 + FastAPI + Supabase）
- 2025-11-06: 実現可能性調査完了（全機能実現可能、MVP版は完全無料構成）
```

---

## 📚 参考リソース

```yaml
公式ドキュメント:
  - React: https://react.dev/
  - TypeScript: https://www.typescriptlang.org/docs/
  - MUI: https://mui.com/material-ui/getting-started/
  - FastAPI: https://fastapi.tiangolo.com/
  - Supabase: https://supabase.com/docs
  - Vite: https://vitejs.dev/guide/

外部API:
  - e-Stat: https://www.e-stat.go.jp/api/
  - RESAS: https://opendata.resas-portal.go.jp/docs/api/v1/index.html
  - Google Maps: https://developers.google.com/maps/documentation

その他:
  - WeasyPrint: https://doc.courtbouillon.org/weasyprint/
  - PapaParse: https://www.papaparse.com/docs
```

---

**最終更新**: 2025年11月6日
