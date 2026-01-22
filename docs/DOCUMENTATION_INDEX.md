# MA-Pilot ドキュメント索引

MA-Pilotプロジェクトの全ドキュメントを一覧化しています。目的に応じて適切なドキュメントを参照してください。

**最終更新**: 2025年12月26日

---

## 📋 目次

- [クイックスタート](#クイックスタート)
- [プロジェクト管理](#プロジェクト管理)
- [開発者向け](#開発者向け)
- [デプロイ・運用](#デプロイ運用)
- [セキュリティ](#セキュリティ)
- [品質・パフォーマンス](#品質パフォーマンス)
- [ユーザー向け](#ユーザー向け)
- [Phase 6: 印刷物受注システム](#phase-6-印刷物受注システム)

---

## クイックスタート

### 🚀 初めての方へ

1. **[README.md](../README.md)** - プロジェクト概要・セットアップ手順
2. **[プロジェクト要約](../project-summary.md)** - ビジネス・技術の簡易サマリー
3. **[開発者ガイド](DEVELOPER_GUIDE.md)** - コーディング規約・開発フロー

### 🎯 目的別スタートガイド

| 目的 | ドキュメント |
|------|------------|
| **環境構築** | [README.md](../README.md) → [環境変数設定](ENVIRONMENT_VARIABLES.md) |
| **機能開発** | [開発者ガイド](DEVELOPER_GUIDE.md) → [API仕様書](API_REFERENCE.md) |
| **デプロイ** | [デプロイガイド](DEPLOYMENT_GUIDE.md) → [本番チェックリスト](PRODUCTION_CHECKLIST.md) |
| **運用・保守** | [運用ガイド](OPERATIONS_GUIDE.md) → [モニタリング](MONITORING.md) |

---

## プロジェクト管理

### 要件・計画

| ドキュメント | 説明 | 対象者 |
|------------|------|--------|
| [requirements.md](requirements.md) | 要件定義書（機能仕様・画面設計） | 全員 |
| [SCOPE_PROGRESS.md](SCOPE_PROGRESS.md) | 実装進捗・タスク管理 | PM、開発者 |
| [ROADMAP.md](ROADMAP.md) | 今後の開発計画・機能拡張ロードマップ | PM、経営者 |

### 変更管理

| ドキュメント | 説明 | 対象者 |
|------------|------|--------|
| [CHANGELOG.md](../CHANGELOG.md) | バージョン履歴・変更記録 | 全員 |
| [CONTRIBUTING.md](../CONTRIBUTING.md) | プロジェクト貢献方法・コミット規約 | 開発者 |

### 参考資料

| ドキュメント | 説明 | 対象者 |
|------------|------|--------|
| [GLOSSARY.md](GLOSSARY.md) | プロジェクト固有用語集 | 全員 |
| [FAQ.md](FAQ.md) | よくある質問 | 全員 |
| [MARKET_RESEARCH_REPORT.md](MARKET_RESEARCH_REPORT.md) | 市場調査レポート | 経営者、PM |

---

## 開発者向け

### 必須ドキュメント

| ドキュメント | 説明 | 重要度 |
|------------|------|--------|
| [DEVELOPER_GUIDE.md](DEVELOPER_GUIDE.md) | コーディング規約・開発フロー | ⭐️⭐️⭐️ |
| [API_REFERENCE.md](API_REFERENCE.md) | 全37エンドポイントの詳細仕様 | ⭐️⭐️⭐️ |
| [DATABASE_SCHEMA.md](DATABASE_SCHEMA.md) | テーブル定義・ER図・RLS設定 | ⭐️⭐️⭐️ |
| [ARCHITECTURE.md](ARCHITECTURE.md) | システム構成・データフロー | ⭐️⭐️ |

### 環境構築

| ドキュメント | 説明 |
|------------|------|
| [ENVIRONMENT_SETUP_SUMMARY.md](ENVIRONMENT_SETUP_SUMMARY.md) | 環境構築サマリー |
| [ENVIRONMENT_VARIABLES.md](ENVIRONMENT_VARIABLES.md) | 環境変数一覧・設定方法 |

### テスト・品質

| ドキュメント | 説明 |
|------------|------|
| [TESTING_GUIDE.md](TESTING_GUIDE.md) | テスト方法・カバレッジ要件 |
| [FRONTEND_CODE_QUALITY_REPORT.md](FRONTEND_CODE_QUALITY_REPORT.md) | フロントエンドコード品質レポート |

### デザイン

| ドキュメント | 説明 |
|------------|------|
| [design-guidelines.md](design-guidelines.md) | UIデザイン規約 |
| [I18N_GUIDE.md](I18N_GUIDE.md) | 多言語化実装ガイド |

---

## デプロイ・運用

### デプロイ手順

| ドキュメント | 説明 | 対象環境 |
|------------|------|---------|
| [DEPLOYMENT_GUIDE.md](DEPLOYMENT_GUIDE.md) | 完全デプロイ手順（Vercel/Render.com） | 本番 |
| [DEPLOYMENT_README.md](../DEPLOYMENT_README.md) | デプロイ設定の完了報告 | 本番 |
| [DEPLOYMENT_CHECKLIST.md](DEPLOYMENT_CHECKLIST.md) | デプロイ前チェックリスト | 本番 |

### 運用・保守

| ドキュメント | 説明 |
|------------|------|
| [OPERATIONS_GUIDE.md](OPERATIONS_GUIDE.md) | 日常運用・保守手順 |
| [MONITORING.md](MONITORING.md) | 監視・アラート設定・ログ管理 |
| [PRODUCTION_CHECKLIST.md](PRODUCTION_CHECKLIST.md) | 本番環境チェックリスト |
| [DOMAIN_SSL_SETUP.md](DOMAIN_SSL_SETUP.md) | カスタムドメイン・SSL設定 |
| [TROUBLESHOOTING.md](TROUBLESHOOTING.md) | トラブルシューティング・問題解決 |

---

## セキュリティ

### セキュリティポリシー

| ドキュメント | 説明 | 対象者 |
|------------|------|--------|
| [SECURITY.md](../SECURITY.md) | 脆弱性報告・対応フロー | 全員 |
| [SECURITY.md (docs)](SECURITY.md) | セキュリティ設計・対策 | 開発者 |
| [SECURITY_CHECKLIST.md](SECURITY_CHECKLIST.md) | セキュリティ確認項目 | 開発者、運用者 |
| [SECURITY_IMPLEMENTATION_SUMMARY.md](SECURITY_IMPLEMENTATION_SUMMARY.md) | セキュリティ実装サマリー | PM |

---

## 品質・パフォーマンス

### アクセシビリティ

| ドキュメント | 説明 |
|------------|------|
| [README_ACCESSIBILITY.md](../README_ACCESSIBILITY.md) | アクセシビリティ・多言語化実装の概要 |
| [ACCESSIBILITY.md](ACCESSIBILITY.md) | WCAG 2.1対応ガイドライン |
| [ACCESSIBILITY_CHECKLIST.md](ACCESSIBILITY_CHECKLIST.md) | アクセシビリティチェックリスト |
| [ACCESSIBILITY_QUICK_REFERENCE.md](ACCESSIBILITY_QUICK_REFERENCE.md) | 実装例・クイックリファレンス |
| [ACCESSIBILITY_IMPLEMENTATION_SUMMARY.md](ACCESSIBILITY_IMPLEMENTATION_SUMMARY.md) | 実装サマリー |

### パフォーマンス

| ドキュメント | 説明 |
|------------|------|
| [PERFORMANCE_GUIDE.md](PERFORMANCE_GUIDE.md) | パフォーマンス最適化手法 |
| [PERFORMANCE_CHECKLIST.md](PERFORMANCE_CHECKLIST.md) | パフォーマンスチェックリスト |

---

## ユーザー向け

| ドキュメント | 説明 | 対象者 |
|------------|------|--------|
| [USER_MANUAL.md](USER_MANUAL.md) | 画面操作方法・機能説明 | エンドユーザー |
| [FAQ.md](FAQ.md) | よくある質問 | エンドユーザー |
| [TROUBLESHOOTING.md](TROUBLESHOOTING.md) | 問題解決方法 | エンドユーザー |

---

## Phase 6: 印刷物受注システム

### 企画・要件

| ドキュメント | 説明 |
|------------|------|
| [PHASE6_HEARING_REQUIREMENTS.md](PHASE6_HEARING_REQUIREMENTS.md) | ヒアリング要件 |
| [PHASE6_IMPLEMENTATION_PLAN.md](PHASE6_IMPLEMENTATION_PLAN.md) | 実装計画 |

### 設計

| ドキュメント | 説明 |
|------------|------|
| [PHASE6_DATABASE_DESIGN.md](PHASE6_DATABASE_DESIGN.md) | データベース設計 |
| [PHASE6_API_DESIGN.md](PHASE6_API_DESIGN.md) | API設計 |
| [PHASE6_COMPONENT_DESIGN.md](PHASE6_COMPONENT_DESIGN.md) | コンポーネント設計 |
| [PHASE6_AI_INTEGRATION.md](PHASE6_AI_INTEGRATION.md) | AI統合設計 |

### データフォーマット

| ドキュメント | 説明 |
|------------|------|
| [PHASE6_COMPANY_CSV_FORMAT.md](PHASE6_COMPANY_CSV_FORMAT.md) | CSV形式定義 |
| [price_table_sample.csv](price_table_sample.csv) | 価格表サンプルデータ |

### 外部連携調査

| ドキュメント | 説明 |
|------------|------|
| [KINTONE_API_RESEARCH_REPORT.md](KINTONE_API_RESEARCH_REPORT.md) | kintone API調査レポート |

---

## ドキュメント統計

### 総数

- **ルートディレクトリ**: 9ファイル
- **docs/ディレクトリ**: 41ファイル
- **合計**: 50ファイル

### カテゴリ別

| カテゴリ | ファイル数 |
|---------|----------|
| プロジェクト管理 | 6 |
| 開発者向け | 12 |
| デプロイ・運用 | 8 |
| セキュリティ | 4 |
| アクセシビリティ | 5 |
| パフォーマンス | 2 |
| ユーザー向け | 3 |
| Phase 6関連 | 10 |

### メンテナンス状況

| ステータス | 説明 |
|----------|------|
| ✅ **最新** | すべてのドキュメントが2025年12月26日時点で最新化済み |
| 🔄 **継続更新** | SCOPE_PROGRESS.md、requirements.mdは開発に伴い継続更新 |
| 📦 **アーカイブ** | PHASE6関連は実装完了後、参照用として保持 |

---

## ドキュメント作成ガイドライン

### 新規ドキュメント作成時

1. **命名規則**: UPPERCASE_SNAKE_CASE.md
2. **配置場所**: docs/ディレクトリ
3. **必須セクション**:
   - タイトル（# で始まる）
   - 概要
   - 目次（長文の場合）
   - 最終更新日
4. **クロスリンク**: 関連ドキュメントへのリンクを含める
5. **索引更新**: このファイル（DOCUMENTATION_INDEX.md）を更新

### 既存ドキュメント更新時

1. **最終更新日**を更新
2. **CHANGELOG.md**に変更内容を記録
3. 破壊的変更がある場合は**README.md**にも反映

---

## 貢献

ドキュメントの改善提案は[CONTRIBUTING.md](../CONTRIBUTING.md)を参照してください。

---

**このドキュメント索引により、MA-Pilotプロジェクトの全50ドキュメントに簡単にアクセスできます。**
