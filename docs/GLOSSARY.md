# MA-Pilot 用語集

プロジェクト固有の用語と略語を説明します。

---

## A

### Anon Key（Anonキー）
Supabaseの公開APIキー。フロントエンドから安全に使用できる。`sb_publishable_`で開始する新形式が標準。

### API
Application Programming Interface。フロントエンドとバックエンド間の通信インターフェース。

---

## C

### clinic_id
医院を一意に識別するUUID。RLS（Row Level Security）でデータ分離に使用。

### CORS
Cross-Origin Resource Sharing。異なるオリジン間でのリソース共有を制御するセキュリティ機能。

### CSV
Comma-Separated Values。PILOTからの月次データ取込に使用。

---

## D

### Dashboard（ダッシュボード）
経営データを可視化する画面。KPI、グラフ、アラートを表示。

---

## E

### e-Stat API
政府統計データを提供するAPI。人口統計データの取得に使用。

---

## F

### FastAPI
Pythonの高速Webフレームワーク。バックエンドAPIの実装に使用。

---

## J

### JWT
JSON Web Token。認証トークン。ユーザーのログイン状態を保持。

---

## K

### KPI
Key Performance Indicator（重要業績評価指標）。売上、患者数、利益率等。

---

## M

### MA-Pilot
Medical Analysis Pilotの略。本プロジェクトの正式名称。

### MUI
Material-UI v6。ReactのUIコンポーネントライブラリ。

### MVP
Minimum Viable Product（最小実用製品）。必要最小限の機能で市場投入する開発手法。

---

## P

### PILOT
歯科医院向け顧客管理システム。MA-Pilotと連携してデータを取込。

### PostgreSQL
オープンソースのリレーショナルデータベース。Supabaseの基盤。

---

## R

### React Query
サーバー状態管理ライブラリ。APIデータのキャッシングと再取得を担当。

### RESAS API
地域経済分析システムAPI。商圏データ、産業構造データの取得に使用。

### RLS
Row Level Security。PostgreSQLの機能。clinic_idベースでデータを分離。

---

## S

### SaaS
Software as a Service。クラウド型ソフトウェア提供モデル。

### Supabase
PostgreSQL + Auth + Storageを提供するBaaS（Backend as a Service）。

### Service Role Key
Supabaseの管理用APIキー。バックエンドのみで使用。フロントエンドでは絶対に使用しない。

---

## T

### TypeScript
JavaScriptに型を追加したプログラミング言語。フロントエンド開発に使用。

---

## U

### UUID
Universally Unique Identifier。データベースの主キーに使用。

---

## V

### Vercel
フロントエンドホスティングサービス。Next.js、Viteに最適化。

### Vite
高速フロントエンドビルドツール。Reactプロジェクトのバンドラー。

---

## W

### WeasyPrint
PythonのPDF生成ライブラリ。レポート生成に使用。

---

## Z

### Zustand
軽量なReact状態管理ライブラリ。認証情報、UIステートの管理に使用。

---

## 医療・歯科業界固有用語

### 新患
新規患者。初めて来院した患者数。

### 再診
再診患者。2回目以降の来院患者数。

### 保険診療
公的医療保険が適用される診療。診療報酬が固定。

### 自費診療
保険適用外の診療。医院が自由に価格設定可能。

### 患者単価
平均診療単価。総売上 ÷ 総患者数。

### チェア
歯科診療台。ユニットとも呼ばれる。医院の生産能力を示す指標。

### 診療圏
医院の集患エリア。一般的に半径1〜3km圏内。

---

## 技術用語（略語）

### API
Application Programming Interface

### CRUD
Create（作成）、Read（読取）、Update（更新）、Delete（削除）

### CI/CD
Continuous Integration / Continuous Deployment（継続的インテグレーション/デプロイ）

### ER図
Entity Relationship Diagram（エンティティ関連図）

### JWT
JSON Web Token

### PDF
Portable Document Format

### RLS
Row Level Security

### SQL
Structured Query Language

### UUID
Universally Unique Identifier

---

**最終更新**: 2025年12月26日
