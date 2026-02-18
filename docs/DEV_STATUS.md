# MA-Pilot 開発状況・残課題メモ（開発者向け）

最終更新：2026-02-18

---

## 現在の構成

| 項目 | 内容 |
|------|------|
| フロントエンド | Vercel（GitHub push で自動デプロイ） |
| バックエンド | Render.com 無料プラン（GitHub push → GitHub Actions → Deploy Hook で自動デプロイ） |
| DB / Auth | Supabase |
| フロントURL | Vercel で確認 |
| バックエンドURL | https://ma-pilot.onrender.com |

**注意：Render 無料プランは15分間アクセスがないとスリープする。初回リクエストに最大50秒かかる。**

---

## 既知の問題・未解決事項

### 高優先度

| # | 内容 | 場所 |
|---|------|------|
| ~~B-1~~ | ✅ **修正済み（2026-02-18）** TypeScript 型をスネークケースに統一。`getRaw()` ヘルパー削除。全15ファイル対応 | |
| B-2 | Supabase Python SDK の `auth.admin.get_user_by_id()` が Render 環境で動作しないため、operators エンドポイントは httpx で直接 REST API を叩いている。原因未特定 | `backend/src/api/admin.py` |
| ~~B-3~~ | ✅ **修正済み（2026-02-18）** `display_name` 変更後に `localStorage` も更新するよう修正。リロード後も反映される | |

### 中優先度

| # | 内容 | 場所 |
|---|------|------|
| M-1 | 診療圏分析ページのデータが実APIと繋がっていない可能性あり（e-Stat / RESAS API キーが未設定のため） | `MarketAnalysis.tsx` |
| M-2 | AdminSettings ページの設定保存がプレースホルダー実装（DBに保存されない） | `backend/src/api/admin.py` |
| M-3 | レポート生成（PDF）が実際に動作するか未確認（WeasyPrint の Render 環境での動作要確認） | `backend/src/api/reports.py` |
| ~~M-4~~ | ✅ **修正済み（2026-02-18）** `ClinicMySettings.tsx` 作成、`/clinic/my-settings` ルート追加、MainLayout にリンク追加 | |

### 低優先度

| # | 内容 |
|---|------|
| L-1 | GitHub Actions の `VERCEL_TOKEN` / `VERCEL_ORG_ID` / `VERCEL_PROJECT_ID` が未設定（Vercel は GitHub App 連携で動いているため現状問題なし） |
| L-2 | E2E テストが多数失敗している（`test-results/` に大量のエラーファイルあり） |
| L-3 | `admin@ma-pilot.local` のような開発用ダミーアカウントが残っている可能性 |

---

## 運営者アカウント一覧（2026-02-18 登録済み）

| 氏名 | メール | 初期PW |
|------|--------|--------|
| 桑畑健 | kuwahata@idw-japan.net | advance2026 |
| 本多裕樹 | honda_hiroki@medical-advance.com | advance2026 |
| 本多理沙 | honda_risa@medical-advance.com | advance2026 |
| 安堂由香 | ando_yuka@medical-advance.com | advance2026 |
| 松井 | matsui@medical-advance.com | advance2026 |
| 畑中 | hatanaka@medical-advance.com | advance2026 |
| 横田 | yokota@medical-advance.com | advance2026 |

---

## 直近の主な変更履歴

| 日付 | 内容 |
|------|------|
| 2026-02-18 | 運営者アカウント管理ページ実装（一覧・追加・削除） |
| 2026-02-18 | マイページ設定実装（表示名・パスワード変更） |
| 2026-02-18 | B-1: TypeScript型をスネークケースに統一（全15ファイル、TypeScriptエラー0件確認） |
| 2026-02-18 | B-3: display_name変更後にlocalStorageも更新（リロード後も反映） |
| 2026-02-18 | M-4: 医院モードのマイページ設定実装（ClinicMySettings.tsx + /clinic/my-settings ルート） |
| 2026-02-18 | AdminLayout 右上アイコン削除、display_name をヘッダーに表示 |
| 2026-02-18 | Render 自動デプロイ設定（GitHub Actions + Deploy Hook） |
| 2026-02-18 | AdminClinics に医院削除・並び替え・件数切り替えを実装 |
| 2026-02-18 | AdminDashboard の is_active / created_at スネークケース修正 |

---

## 次のフェーズで検討すべき機能

- 医院ユーザー側のマイページ（パスワード変更）
- レポートPDF生成の実環境テスト
- e-Stat / RESAS APIキーの設定・診療圏分析の実データ接続
- Render を有料プランへアップグレード（スリープ解消）
