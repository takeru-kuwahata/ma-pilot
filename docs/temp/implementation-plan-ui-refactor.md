# UI構造リファクタリング実装計画

## 📊 既存コード調査結果

**調査日時**: 2026-02-12
**調査ファイル数**: 17ファイル
**修正で対応**: 10件
**新規作成必要**: 7件
**削除推奨**: 2件

---

## 🔍 既存コード状況まとめ

### 現在の問題点
1. **フラットなルーティング**: `/admin/*`, `/clinic/*` の階層構造なし
2. **ページレベルでのレイアウト選択**: Dashboard.tsx等でuseLayoutを使用
3. **権限チェック不在**: ルートレベルでの権限保護がない
4. **重複したレイアウト**: 医院機能がAdminLayoutとMainLayoutで重複
5. **モード切替機能なし**: system_adminの医院モード/運営モード切替不可

### 使用中のレイアウト
- **MainLayout** (279行): 医院側メニュー（Dashboard、基礎データ管理等）
- **AdminLayout** (351行): 運営側メニュー（管理ダッシュボード、医院管理等） + 医院側メニュー重複
- **PublicLayout** (32行): ログイン画面用
- **Layout.tsx** (143行): 未使用の旧レイアウト（削除対象）

### 使用中のフック・Store
- **useLayout** (21行): ロールに応じてレイアウトを切り替え（今回廃止）
- **authStore** (37行): 認証状態管理（拡張必要）

---

## 📝 修正するファイル（10件）

| ファイル | 変更内容 | 理由 | 影響範囲 | 行数 |
|---------|---------|------|---------|------|
| **App.tsx** | ネストルート実装、権限別ルート保護追加 | `/admin/*`, `/clinic/*` 階層化 | 全ルート | 88 |
| **authStore.ts** | モード切替状態追加（systemAdminMode: 'admin' \| 'clinic'） | 管理者の医院/運営モード切替 | 全認証機能 | 37 |
| **types/index.ts** | MenuItemConfig型追加、LayoutMode型追加 | 権限別メニュー定義 | 型定義 | 346 |
| **MainLayout.tsx** | メニュー動的生成、権限フィルタリング、クリニック名固定表示 | 権限別メニュー、医院名表示 | 医院エリア全体 | 279 |
| **AdminLayout.tsx** | モード切替UI追加、医院モード時のクリニック名表示 | system_adminのモード切替 | 運営エリア全体 | 351 |
| **Dashboard.tsx** | useLayout削除、レイアウト選択ロジック削除 | ルーターがレイアウト制御 | 1ページ | 345 |
| **DataManagement.tsx** | useLayout削除、レイアウト選択ロジック削除 | ルーターがレイアウト制御 | 1ページ | 推定250行 |
| **MarketAnalysis.tsx** | useLayout削除、レイアウト選択ロジック削除 | ルーターがレイアウト制御 | 1ページ | 推定200行 |
| **Simulation.tsx** | useLayout削除、レイアウト選択ロジック削除 | ルーターがレイアウト制御 | 1ページ | 推定200行 |
| **Reports.tsx** | useLayout削除、レイアウト選択ロジック削除 | ルーターがレイアウト制御 | 1ページ | 推定200行 |

**修正理由**: ページごとにレイアウトを選択する現行方式は、ルーティング構造と一致せず、権限チェックも不十分。ルーターレベルでレイアウトを制御する方が保守性・安全性が高い。

---

## 🆕 新規作成するファイル（7件）

| ファイル | 内容 | 理由 | 行数見積 |
|---------|------|------|---------|
| **components/routing/PrivateRoute.tsx** | 認証チェック、ルート保護 | 未ログイン時の自動リダイレクト | 40行 |
| **components/routing/RoleRoute.tsx** | 権限チェック、ルート保護 | 不正アクセス時の403エラー表示 | 60行 |
| **components/routing/AdminModeWrapper.tsx** | system_admin用、医院モード時のクリニック選択 | 医院モード時のクリニック固定 | 80行 |
| **constants/menuConfig.ts** | 権限別メニュー項目定義 | メニュー定義の単一化 | 150行 |
| **utils/menuFilter.ts** | 権限によるメニューフィルタリング | 動的メニュー生成ロジック | 50行 |
| **hooks/useCurrentClinic.ts** | 現在の医院情報取得 | 医院名表示・データ取得 | 70行 |
| **pages/Forbidden.tsx** | 403エラーページ | 権限不足時の表示 | 60行 |

**新規作成理由**: 既存コードには認証・権限チェック、メニュー定義の集約、モード切替UIが存在しないため、新規作成が必要。

---

## 🗑️ 削除するファイル（2件）

| ファイル | 理由 | 削除タイミング | 現行使用箇所 |
|---------|------|--------------|-------------|
| **components/Layout.tsx** | 未使用の旧レイアウト | 即座に削除可 | なし（インポートなし） |
| **hooks/useLayout.tsx** | 新しいルーティング構造で不要 | ページ修正後に削除 | Dashboard、DataManagement等5ページ |

**削除理由**: Layout.tsxは未使用。useLayoutはページレベルでレイアウトを切り替える旧設計のため、新しいルーティング構造では不要。

---

## 📊 実装順序（Phase制）

### Phase 1: 基盤整備（認証・型定義）
**目的**: 権限チェックとメニュー定義の基盤を構築

1. **types/index.ts** - 型定義追加（MenuItemConfig、LayoutMode、systemAdminMode）
2. **authStore.ts** - モード切替状態追加
3. **constants/menuConfig.ts** - 権限別メニュー定義（新規作成）
4. **utils/menuFilter.ts** - メニューフィルタリングロジック（新規作成）

**成果物**: 型定義、状態管理、メニュー定義の完成

---

### Phase 2: ルーティング保護機能
**目的**: 認証・権限チェックを実装

1. **components/routing/PrivateRoute.tsx** - 認証チェック（新規作成）
2. **components/routing/RoleRoute.tsx** - 権限チェック（新規作成）
3. **pages/Forbidden.tsx** - 403エラーページ（新規作成）

**成果物**: ルート保護機能の完成

**依存関係**: Phase 1の型定義・authStoreが必須

---

### Phase 3: ルーティング構造変更
**目的**: `/admin/*`, `/clinic/*` の階層化

1. **App.tsx** - ネストルート実装、権限チェック追加
2. **components/routing/AdminModeWrapper.tsx** - 医院モード時のクリニック選択（新規作成）

**成果物**: 階層化されたルーティング構造

**依存関係**: Phase 2のルート保護機能が必須

---

### Phase 4: レイアウト改修
**目的**: 動的メニュー生成とモード切替UI

1. **hooks/useCurrentClinic.ts** - 現在の医院情報取得（新規作成）
2. **MainLayout.tsx** - 動的メニュー生成、クリニック名固定表示
3. **AdminLayout.tsx** - モード切替UI追加、医院モード時のクリニック名表示

**成果物**: 権限別動的メニュー、モード切替機能

**依存関係**: Phase 1のmenuConfig、Phase 3のルーティング構造が必須

---

### Phase 5: ページ修正（useLayout削除）
**目的**: 各ページからuseLayoutを削除

1. **Dashboard.tsx** - useLayout削除、レイアウト選択ロジック削除
2. **DataManagement.tsx** - useLayout削除、レイアウト選択ロジック削除
3. **MarketAnalysis.tsx** - useLayout削除、レイアウト選択ロジック削除
4. **Simulation.tsx** - useLayout削除、レイアウト選択ロジック削除
5. **Reports.tsx** - useLayout削除、レイアウト選択ロジック削除
6. **ClinicSettings.tsx** - useLayout削除、レイアウト選択ロジック削除
7. **StaffManagement.tsx** - useLayout削除、レイアウト選択ロジック削除
8. **PrintOrderForm.tsx** - useLayout削除、レイアウト選択ロジック削除
9. **PrintOrderHistory.tsx** - useLayout削除、レイアウト選択ロジック削除

**成果物**: 全ページからuseLayout削除完了

**依存関係**: Phase 4のレイアウト改修が必須

---

### Phase 6: 不要ファイル削除
**目的**: 旧コードのクリーンアップ

1. **components/Layout.tsx** - 削除（未使用）
2. **hooks/useLayout.tsx** - 削除（Phase 5でページ修正後）

**成果物**: 不要コードの削除完了

**依存関係**: Phase 5のページ修正が必須

---

## 🎯 承認チェックリスト

- [ ] **新規 vs 修正の判断は適切か?**
  - ✅ ルーティング保護機能は既存になし → 新規作成
  - ✅ メニュー定義の集約は既存になし → 新規作成
  - ✅ レイアウト改修は既存を拡張 → 修正
  - ✅ ページ修正は最小限の変更 → 修正

- [ ] **削除対象は本当に不要か?**
  - ✅ Layout.tsx: Globで検索して使用箇所なし → 削除可
  - ✅ useLayout.tsx: Phase 5で全ページ修正後に不要 → 削除可

- [ ] **実装順序は妥当か?**
  - ✅ Phase 1→2→3→4→5→6の依存関係が明確
  - ✅ 型定義・状態管理を最初に実装（他の基盤）
  - ✅ ルート保護 → ルーティング構造 → レイアウト → ページの順序
  - ✅ 削除は最後（全修正完了後）

- [ ] **影響範囲の評価は適切か?**
  - ✅ App.tsx修正は全ルートに影響 → 最も重要
  - ✅ レイアウト修正は各エリア全体に影響 → 慎重に実施
  - ✅ ページ修正は個別に独立 → 並行実施可能

- [ ] **行数見積もりは妥当か?**
  - ✅ PrivateRoute: 40行（認証チェックのみ、シンプル）
  - ✅ RoleRoute: 60行（権限チェック + エラー表示）
  - ✅ menuConfig: 150行（全権限の全メニュー項目定義）
  - ✅ レイアウト修正: 既存行数+50行程度（動的メニュー生成）

---

## 📌 重要な設計判断

### 1. なぜページごとのuseLayoutを廃止するのか?
**理由**: ルーティング構造とレイアウト選択が分離しており、保守性が低い。
- 現行: 各ページで `const { Layout } = useLayout()` を呼び出し
- 問題: URLパス（例: `/dashboard`）とレイアウト選択（MainLayout/AdminLayout）が乖離
- 解決: ルーターレベルで `/clinic/*` → MainLayout、`/admin/*` → AdminLayoutに固定

### 2. なぜメニュー定義を集約するのか?
**理由**: 現在はMainLayout、AdminLayoutにメニューがハードコード。権限別フィルタリング不可。
- 現行: MainLayoutに医院メニュー、AdminLayoutに運営メニュー+医院メニュー（重複）
- 問題: clinic_viewerもclinic_editorも同じメニューが表示される
- 解決: menuConfig.tsに全メニュー定義 → 権限でフィルタリング

### 3. なぜAdminModeWrapperが必要か?
**理由**: system_adminが医院モードで操作する際、どの医院として操作するかを固定する必要がある。
- 現行: 医院選択の仕組みなし
- 問題: system_adminが医院データを操作する際、どの医院か不明
- 解決: AdminModeWrapperで医院選択 → 以降のページで固定された医院IDを使用

---

## 🚀 実装開始の準備

### 必要な確認事項
1. ✅ 全14ページがuseLayoutを使用しているか確認済み（調査結果: 9ページで使用）
2. ⏳ 印刷物受注ページ（PrintOrderForm、PrintOrderHistory）のルーティング確認
3. ⏳ 権限別のメニュー表示要件の再確認（clinic_viewer、clinic_editor、clinic_owner）
4. ⏳ system_adminの医院選択UIの詳細設計（ヘッダー右上のドロップダウン？）

### 次のステップ
1. **ユーザー承認**: 本計画の内容確認・承認
2. **Phase 1開始**: 型定義・状態管理の実装
3. **段階的リリース**: Phase 1→2→3→4→5→6の順に実装・テスト

---

## 📝 補足: 印刷物受注ページのルーティング

**確定要件**:
- 医院側: `/clinic/print-order`（発注フォーム）、`/clinic/print-order-history`（発注履歴）
- 運営側: `/admin/print-orders`（発注一覧・ステータス管理）

**現状**:
- `/print-order` → フラットなルート（要変更）
- `/print-order-history` → フラットなルート（要変更）
- `/admin/price-tables` → 価格表管理（既にadmin配下、OK）

**修正内容**:
- Phase 3で `/print-order` → `/clinic/print-order` に変更
- Phase 3で `/print-order-history` → `/clinic/print-order-history` に変更

---

**作成者**: BlueLampエージェント
**作成日**: 2026-02-12
**プロジェクト**: MA-Pilot
**対象範囲**: フロントエンドUI構造リファクタリング
