# Changelog

このプロジェクトの変更履歴を記録しています。

フォーマットは[Keep a Changelog](https://keepachangelog.com/ja/1.0.0/)に準拠し、
バージョニングは[Semantic Versioning](https://semver.org/lang/ja/)に従います。

---

## [Unreleased]

### 予定

- Stripe決済連携実装
- ヒアリングシート機能実装（Phase 6）
- PILOT Webhook転送機能連携
- MAP-STAR Web連携

---

## [1.0.0] - 2025-12-26

### Added

#### Phase 7: 印刷物受注システム
- 印刷物注文フォーム実装（相談パターン・再注文パターン）
- 自動見積もりロジック実装
- 価格表マスタ管理機能
- 見積もりPDF生成機能（WeasyPrint）
- メール送信機能（MVP版: ログ出力）
- 注文履歴一覧ページ
- 価格表CSV一括登録機能
- `print_orders`テーブル、`price_tables`テーブル追加
- PrintOrderService、PdfService、EmailService実装

#### Phase 5: バックエンドAPI実装
- FastAPIバックエンド基盤構築
- 認証API（login、logout）
- 医院データAPI（GET/PUT /api/clinics）
- 月次データAPI（CRUD、CSV取込）
- ダッシュボードAPI（KPI計算）
- シミュレーションAPI（逆算ロジック）
- レポートAPI（PDF生成）
- 診療圏分析API（e-Stat、Google Maps統合）
- スタッフ管理API（招待メール）
- 管理者API（全医院集計）
- Supabaseデータベース統合
- RLS（Row Level Security）設定
- 30エンドポイント実装完了

#### セキュリティ強化
- Supabase RLS実装（clinic_idベースのデータ分離）
- 認証ミドルウェア実装
- 環境変数セキュリティ強化
- APIキー形式対応（`sb_publishable_`）

#### テスト・品質改善
- Pytest自動テストコード生成
- TypeScript型チェック強化
- ESLint設定最適化
- コードカバレッジ向上

#### CI/CDパイプライン
- GitHub Actionsワークフロー構築
- Vercel自動デプロイ設定
- Render.com自動デプロイ設定

### Changed

- フロントエンドコード品質改善
- 型定義の強化（frontend/src/types/index.ts）
- プロジェクト名を「MA-Lstep」から「MA-Pilot」に統一
- ポート設定変更（フロントエンド: 3247、バックエンド: 8432）

### Fixed

- Supabase API key形式対応（`sb_publishable_`）
- ログイン時の型エラー修正
- 各種バグ修正

---

## [0.4.0] - 2024-12-24

### Added

#### Phase 4: ページ実装完了
- P-001: ログイン/アカウント作成ページ
- P-002: 経営ダッシュボードページ
- P-003: 基礎データ管理ページ
- P-004: 診療圏分析ページ
- P-005: 経営シミュレーションページ
- P-006: レポート生成・管理ページ
- P-007-1: 医院設定ページ
- P-007-2: スタッフ管理ページ
- A-001: 管理ダッシュボードページ
- A-002: 医院アカウント管理ページ
- A-003: システム設定ページ

### Changed

- Vercelデプロイ完了（https://ma-pilot.vercel.app）
- モックサービス実装（フロントエンド開発用）

---

## [0.3.0] - 2024-11-15

### Added

#### Phase 3: フロントエンド基盤構築
- React 18 + TypeScript 5 + Vite 5基盤
- MUI v6テーマ設定（清潔感のあるブルー系）
- Zustand状態管理
- React Query（サーバー状態管理）
- React Router v6ルーティング
- Supabaseクライアント設定
- 型定義（src/types/index.ts）
- 環境変数設定（.env.local、.env.example）

### Changed

- 依存パッケージインストール完了（306パッケージ）
- 開発サーバー起動確認（http://localhost:3247）

---

## [0.2.0] - 2024-11-14

### Added

#### Phase 2: Git/GitHub管理
- .gitignore設定（機密情報保護）
- Gitリポジトリ初期化
- GitHubリモートリポジトリ設定
- 初回コミット・プッシュ完了
- GitHub URL: https://github.com/takeru-kuwahata/ma-pilot

---

## [0.1.0] - 2024-11-13

### Added

#### Phase 1: 要件定義
- 要件定義書作成（docs/requirements.md）
- プロジェクト設定ファイル作成（CLAUDE.md）
- 進捗管理表作成（docs/SCOPE_PROGRESS.md）
- プロジェクト開始

---

## リリースノート規則

### バージョン番号

- **MAJOR**: 互換性のない変更
- **MINOR**: 後方互換性のある機能追加
- **PATCH**: 後方互換性のあるバグ修正

### カテゴリ

- **Added**: 新機能
- **Changed**: 既存機能の変更
- **Deprecated**: 非推奨機能（将来削除予定）
- **Removed**: 削除された機能
- **Fixed**: バグ修正
- **Security**: セキュリティ関連

---

**最終更新**: 2025年12月26日
