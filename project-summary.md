# プロジェクト要約

## 基本情報
- サービス名：MA-Pilot（歯科医院経営分析システム）
- 事業体：医療DW社
- 開発フェーズ：要件定義完了

## ビジネス
- ターゲット：開業歯科医院（PILOT利用医院を優先）
- 価格設定：無料体験版→有料プラン転換モデル
- ビジネスモデル：SaaS型経営分析ツール。PILOT連携でデータ入力の手間削減、リアルタイム可視化・シミュレーション・戦略レポート生成を提供。データ駆動の経営判断を支援。

## 技術
- フロントエンド：React 18、TypeScript、Vite、MUI v6、Zustand、React Query、Recharts
- バックエンド：Python 3.11+、FastAPI、Pandas、WeasyPrint（PDF生成）、Jinja2
- インフラ：Supabase（PostgreSQL + Auth + Storage）、Vercel（フロント）、Render.com（バックエンド）
- 主要な外部連携：PILOT（CSV取込）、e-Stat API（人口統計）、RESAS API（商圏データ）、Google Maps API（競合医院検索）

## 連携
- 関連プロジェクト：PILOT（歯科医院顧客管理システム）
- 共通ターゲット：PILOT利用中の開業歯科医院
