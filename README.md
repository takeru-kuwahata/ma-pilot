# MA-Pilot

歯科医院経営分析システム - データ駆動の経営判断を支援するSaaSプラットフォーム

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](LICENSE)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.3-blue)](https://www.typescriptlang.org/)
[![React](https://img.shields.io/badge/React-18.2-blue)](https://reactjs.org/)
[![FastAPI](https://img.shields.io/badge/FastAPI-0.115-green)](https://fastapi.tiangolo.com/)
[![Python](https://img.shields.io/badge/Python-3.11+-green)](https://www.python.org/)

## 概要

MA-Pilotは、開業歯科医院向けの経営分析システムです。PILOT（顧客管理システム）との連携により、月次経営データの自動取得・可視化・シミュレーション・レポート生成を実現し、データに基づいた経営判断を支援します。

### 主要機能

- **経営ダッシュボード**: KPI可視化、グラフ表示、アラート通知
- **基礎データ管理**: 月次データ入力、CSV一括取込
- **診療圏分析**: 人口統計、競合検索、商圏レポート
- **経営シミュレーション**: 目標逆算、戦略提案、複数シナリオ比較
- **レポート生成**: PDF/CSV形式での経営レポート自動生成
- **印刷物受注システム**: 診察券・名刺等の簡易注文管理
- **スタッフ管理**: 招待・権限管理・アカウント制御
- **管理者機能**: 全医院統計、アカウント管理、システム設定

## 技術スタック

### フロントエンド

- **React 18** - UIライブラリ
- **TypeScript 5** - 型安全な開発
- **Vite 5** - 高速ビルドツール
- **MUI v6** - Material Design UIコンポーネント
- **Zustand** - 状態管理
- **React Query** - サーバー状態管理・キャッシング
- **React Router v6** - ルーティング
- **Recharts** - グラフ・チャート描画
- **React Hook Form** - フォーム管理・バリデーション
- **PapaParse** - CSV処理

### バックエンド

- **Python 3.11+** - プログラミング言語
- **FastAPI** - 高速Webフレームワーク
- **Supabase SDK** - PostgreSQL接続・認証
- **WeasyPrint** - PDF生成
- **Pandas** - データ分析・集計
- **Jinja2** - テンプレートエンジン

### インフラ・データベース

- **Supabase** - PostgreSQL 15 + Auth + Storage
- **Vercel** - フロントエンドホスティング
- **Render.com** - バックエンドホスティング
- **GitHub Actions** - CI/CD

### 外部API連携

- **e-Stat API** - 政府統計データ（人口統計）
- **RESAS API** - 地域経済分析データ
- **Google Maps API** - 地図表示・競合検索
- **Community Geocoder** - 住所→緯度経度変換

## ディレクトリ構成

```
MA-Lstep/
├── frontend/               # フロントエンド（React + TypeScript）
│   ├── src/
│   │   ├── pages/         # ページコンポーネント
│   │   ├── components/    # 共通コンポーネント
│   │   ├── services/      # API通信サービス
│   │   ├── stores/        # Zustand状態管理
│   │   ├── types/         # TypeScript型定義
│   │   ├── theme/         # MUIテーマ設定
│   │   └── utils/         # ユーティリティ関数
│   ├── package.json
│   └── vite.config.ts
│
├── backend/               # ✅ バックエンド（Python + FastAPI）【完全実装済み】
│   ├── src/
│   │   ├── api/          # 10個のAPIルーター実装済み（30エンドポイント）
│   │   ├── core/         # 設定管理、データベース接続
│   │   ├── middleware/   # レート制限、パフォーマンス計測
│   │   ├── models/       # Pydanticモデル12個
│   │   ├── services/     # ビジネスロジック14サービス
│   │   └── utils/        # ユーティリティ関数
│   ├── templates/        # PDF生成テンプレート（Jinja2）
│   ├── tests/            # テストコード15ファイル（pytest）
│   ├── main.py           # FastAPIエントリーポイント（161行）
│   ├── requirements.txt  # 依存関係40パッケージ
│   ├── render.yaml       # Render.comデプロイ設定
│   └── .env.production   # 本番環境変数テンプレート
│
├── docs/                  # ドキュメント
│   ├── requirements.md   # 要件定義書
│   ├── API_REFERENCE.md  # API仕様書
│   ├── DATABASE_SCHEMA.md # データベーススキーマ
│   ├── ARCHITECTURE.md   # アーキテクチャ設計
│   ├── DEVELOPER_GUIDE.md # 開発者ガイド
│   ├── OPERATIONS_GUIDE.md # 運用ガイド
│   └── USER_MANUAL.md    # ユーザーマニュアル
│
├── CLAUDE.md             # プロジェクト設定
├── README.md             # このファイル
├── CHANGELOG.md          # 変更履歴
├── CONTRIBUTING.md       # コントリビューションガイド
├── SECURITY.md           # セキュリティポリシー
└── LICENSE               # ライセンス

```

## セットアップ手順

### 前提条件

- **Node.js**: 18.x以上
- **Python**: 3.11以上
- **Git**: 最新版推奨
- **Supabaseアカウント**: 無料プランでOK

### 1. リポジトリのクローン

```bash
git clone https://github.com/takeru-kuwahata/ma-pilot.git
cd ma-pilot
```

### 2. フロントエンドのセットアップ

```bash
cd frontend
npm install
```

#### 環境変数設定

`frontend/.env.local` を作成:

```env
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key
VITE_BACKEND_URL=http://localhost:8432
```

#### 開発サーバー起動

```bash
npm run dev
```

ブラウザで `http://localhost:3247` にアクセス

### 3. バックエンドのセットアップ

```bash
cd backend
python -m venv venv
source venv/bin/activate  # Windows: venv\Scripts\activate
pip install -r requirements.txt
```

#### 環境変数設定

`backend/.env` を作成:

```env
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_KEY=your-service-role-key
DATABASE_URL=postgresql://user:password@host:5432/database
ENVIRONMENT=development
HOST=0.0.0.0
PORT=8432
FRONTEND_URL=http://localhost:3247
```

#### データベースマイグレーション

```bash
# Supabase SQL Editorで以下のファイルを実行
# backend/supabase_schema.sql
```

#### 開発サーバー起動

```bash
python main.py
```

APIドキュメント: `http://localhost:8432/docs`

### 4. テストデータ投入（オプション）

```bash
# 価格表サンプルデータ投入
cd docs
# price_table_sample.csv をSupabaseに手動インポート
```

## 起動方法

### 開発環境

**フロントエンド**:
```bash
cd frontend
npm run dev
```

**バックエンド**:
```bash
cd backend
source venv/bin/activate  # Windows: venv\Scripts\activate
python main.py
```

### 本番環境

**デプロイ先**:
- フロントエンド: Vercel (https://ma-pilot.vercel.app)
- バックエンド: Render.com

**デプロイ方法**: GitHubへのpushで自動デプロイ（CI/CD）

## テスト実行方法

### フロントエンド

```bash
cd frontend
npm run type-check  # TypeScript型チェック
npm run lint        # ESLint
```

### バックエンド

```bash
cd backend
source venv/bin/activate
pytest                    # 全テスト実行
pytest --cov=src         # カバレッジ付き
pytest tests/api/        # APIテストのみ
```

## デプロイ方法

### 🚀 クイックスタート（15分でデプロイ）

**初回セットアップスクリプトを実行**:
```bash
./deploy-setup.sh
```

**詳細手順**: [DEPLOY_QUICK_START.md](DEPLOY_QUICK_START.md) を参照

### 3ステップデプロイ

1. **Supabase**: プロジェクト作成 → SQL実行（5分）
2. **Vercel**: GitHubリポジトリ連携 → 環境変数設定（3分）
3. **Render.com**: Web Service作成 → 環境変数設定（3分）

### 自動デプロイ（2回目以降）

初回セットアップ後は、Git Pushだけで自動デプロイ:

```bash
git add .
git commit -m "update: 新機能追加"
git push origin main
```

GitHub Actionsが自動的に:
- ✅ テスト実行
- ✅ Vercelにフロントエンドデプロイ
- ✅ Render.comにバックエンドデプロイ

### 詳細ドキュメント

- [デプロイクイックスタート](DEPLOY_QUICK_START.md) - 15分でデプロイ
- [デプロイガイド](docs/DEPLOYMENT_GUIDE.md) - 完全版手順
- [デプロイチェックリスト](docs/DEPLOYMENT_CHECKLIST.md) - 確認項目
- [環境変数ガイド](docs/ENVIRONMENT_VARIABLES.md) - 設定方法

## ドキュメント

**[📖 完全なドキュメント索引はこちら](docs/DOCUMENTATION_INDEX.md)** - 全50ドキュメントの一覧と目的別ガイド

### 📘 プロジェクト管理

- [要件定義書](docs/requirements.md) - プロジェクト要件・仕様
- [進捗管理表](docs/SCOPE_PROGRESS.md) - 実装進捗・タスク管理
- [変更履歴](CHANGELOG.md) - バージョン履歴・変更記録
- [ロードマップ](docs/ROADMAP.md) - 今後の開発計画
- [用語集](docs/GLOSSARY.md) - プロジェクト固有用語

### 🔧 開発者向け

- [開発者ガイド](docs/DEVELOPER_GUIDE.md) - コーディング規約・開発フロー
- [API仕様書](docs/API_REFERENCE.md) - 全エンドポイント詳細
- [データベーススキーマ](docs/DATABASE_SCHEMA.md) - テーブル定義・ER図
- [アーキテクチャ設計](docs/ARCHITECTURE.md) - システム構成・フロー
- [テストガイド](docs/TESTING_GUIDE.md) - テスト方法・品質管理
- [コントリビューションガイド](CONTRIBUTING.md) - プロジェクト貢献方法

### 🚀 デプロイ・運用

- [デプロイガイド](docs/DEPLOYMENT_GUIDE.md) - Vercel/Render.comデプロイ手順
- [運用ガイド](docs/OPERATIONS_GUIDE.md) - 日常運用・保守手順
- [モニタリング](docs/MONITORING.md) - 監視・アラート設定
- [本番環境チェックリスト](docs/PRODUCTION_CHECKLIST.md) - デプロイ前確認項目
- [ドメイン・SSL設定](docs/DOMAIN_SSL_SETUP.md) - カスタムドメイン設定

### 🔒 セキュリティ

- [セキュリティポリシー](SECURITY.md) - 脆弱性報告・対応フロー
- [セキュリティガイド](docs/SECURITY.md) - セキュリティ設計・対策
- [セキュリティチェックリスト](docs/SECURITY_CHECKLIST.md) - セキュリティ確認項目

### ♿️ アクセシビリティ

- [アクセシビリティREADME](README_ACCESSIBILITY.md) - アクセシビリティ・多言語化実装の概要
- [アクセシビリティガイド](docs/ACCESSIBILITY.md) - WCAG 2.1対応
- [アクセシビリティチェックリスト](docs/ACCESSIBILITY_CHECKLIST.md) - 確認項目
- [アクセシビリティクイックリファレンス](docs/ACCESSIBILITY_QUICK_REFERENCE.md) - 実装例

### ⚡️ パフォーマンス

- [パフォーマンスガイド](docs/PERFORMANCE_GUIDE.md) - 最適化手法
- [パフォーマンスチェックリスト](docs/PERFORMANCE_CHECKLIST.md) - 確認項目

### 📖 ユーザー向け

- [ユーザーマニュアル](docs/USER_MANUAL.md) - 画面操作方法
- [FAQ](docs/FAQ.md) - よくある質問
- [トラブルシューティング](docs/TROUBLESHOOTING.md) - 問題解決方法

### 🎨 デザイン

- [デザインガイドライン](docs/design-guidelines.md) - UIデザイン規約
- [国際化ガイド](docs/I18N_GUIDE.md) - 多言語対応

## テスト認証情報（開発環境）

```yaml
システム管理者:
  email: admin@ma-pilot.local
  email: kuwahata@idw-japan.net
  password: advance2026

テスト医院オーナー:
  email: owner@test-clinic.local
  password: TestOwner2025!

テスト医院編集者:
  email: editor@test-clinic.local
  password: TestEditor2025!
```

**注意**: 本番環境では使用しないでください

## ライセンス

このプロジェクトは [MIT License](LICENSE) の下でライセンスされています。

## コントリビューション

バグ報告・機能提案・プルリクエストを歓迎します。
詳細は [CONTRIBUTING.md](CONTRIBUTING.md) をご覧ください。

## セキュリティ

セキュリティ上の問題を発見した場合は、[SECURITY.md](SECURITY.md) の手順に従って報告してください。

## サポート

- **Issue報告**: [GitHub Issues](https://github.com/takeru-kuwahata/ma-pilot/issues)
- **開発者**: 医療DW社
- **プロジェクト開始**: 2025年11月13日

## 関連リンク

- [本番環境](https://ma-pilot.vercel.app)
- [Supabase プロジェクト](https://supabase.com)
- [e-Stat API](https://www.e-stat.go.jp/api/)
- [RESAS API](https://opendata.resas-portal.go.jp/)

---

**最終更新**: 2026年01月26日
