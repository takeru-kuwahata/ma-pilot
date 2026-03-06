# プロジェクトリファクタリング計画

## 目的
- 古くて使わないドキュメントを削除
- トラブルシューティング系をディレクトリに整理
- クリーンアーキテクチャの状態を維持
- 開発者が必要な情報にすぐアクセスできるようにする

## 現状分析

### ドキュメント構成（50ファイル）
- 実装済み機能の詳細設計（古い）
- Phase 6未実装機能の設計（将来用）
- トラブルシューティングガイド（散在）
- SQLマイグレーションファイル（散在）
- 一時ファイル（temp/）
- 進捗管理・チェックリスト
- 運用ガイド

### 問題点
1. 実装完了済みの詳細設計が残っている（コードが真実源なのに重複）
2. トラブルシューティング系が散在（TROUBLESHOOTING.md, FIX_*.md等）
3. SQLファイルがdocs/直下に散在
4. 一時ファイルが残っている（temp/）
5. Phase 6未実装機能の設計が混在

## リファクタリング実施計画

### 1. ディレクトリ構造の整理

```
docs/
├── README.md                          # ドキュメント索引（新規作成）
├── SCOPE_PROGRESS.md                  # 進捗管理（維持）
├── RECENT_UPDATES.md                  # 最近の更新（新規作成）
├── requirements.md                    # 要件定義（維持）
├── troubleshooting/                   # トラブルシューティング（新規ディレクトリ）
│   ├── README.md                      # トラブルシューティング索引
│   ├── TROUBLESHOOTING.md             # 移動
│   ├── FIX_INFINITE_RECURSION.md      # 移動
│   ├── PASSWORD_RESET_GUIDE.md        # 移動
│   └── DEPLOYMENT_GUIDE.md            # 移動
├── operations/                        # 運用ガイド（新規ディレクトリ）
│   ├── OPERATIONS_GUIDE.md            # 移動
│   ├── USER_MANUAL.md                 # 移動
│   ├── FAQ.md                         # 移動
│   └── GLOSSARY.md                    # 移動
├── migrations/                        # SQLマイグレーション（新規ディレクトリ）
│   ├── README.md                      # マイグレーション索引
│   ├── 001_*.sql                      # 既存SQLファイルをナンバリング
│   └── ...
├── checklists/                        # チェックリスト（新規ディレクトリ）
│   ├── PRODUCTION_CHECKLIST.md        # 移動
│   ├── SECURITY_CHECKLIST.md          # 移動
│   ├── CLIENT_CHECKLIST.md            # 移動
│   └── CLIENT_ACTION_ITEMS.md         # 移動
└── archive/                           # アーカイブ（ローカルのみ、Git管理外）
    ├── phase6/                        # Phase 6設計（将来実装時に参照）
    ├── status/                        # 各機能のステータス（実装完了済み）
    └── temp/                          # 一時ファイル

```

### 2. 削除対象ファイル

#### 実装完了済みの機能ステータス（コードが真実源）
- `CLINIC_SETTINGS_STATUS.md` → アーカイブ
- `DATA_MANAGEMENT_STATUS.md` → アーカイブ
- `PRINT_ORDER_STATUS.md` → アーカイブ
- `SIMULATION_STATUS.md` → アーカイブ
- `ADMIN_SETTINGS_STATUS.md` → アーカイブ
- `CLINIC_SETTINGS_IMPLEMENTATION_SUMMARY.md` → アーカイブ

#### 古いSQLファイル（実行済み、Supabaseに反映済み）
- 最新のマイグレーション以外は `migrations/archive/` へ移動
- 実行履歴を `migrations/README.md` に記録

#### 一時ファイル
- `docs/temp/` 配下すべて → アーカイブまたは削除

#### Phase 6関連（未実装）
- `PHASE6_IMPLEMENTATION_PLAN.md` → `archive/phase6/`

### 3. 移動・整理対象

#### トラブルシューティング系 → `troubleshooting/`
- TROUBLESHOOTING.md
- FIX_INFINITE_RECURSION.md
- PASSWORD_RESET_GUIDE.md
- DEPLOYMENT_GUIDE.md
- RENDER_ENV_UPDATE.md
- API_KEYS_TODO.md

#### 運用ガイド → `operations/`
- OPERATIONS_GUIDE.md
- USER_MANUAL.md
- FAQ.md
- GLOSSARY.md

#### チェックリスト → `checklists/`
- PRODUCTION_CHECKLIST.md
- SECURITY_CHECKLIST.md
- CLIENT_CHECKLIST.md
- CLIENT_ACTION_ITEMS.md

#### SQLマイグレーション → `migrations/`
すべての.sqlファイルを日付順にナンバリング:
```
001_PHASE1_PRINT_ORDER_MIGRATION_FIXED.sql
002_PHASE2_ADD_PRINT_ORDER_ITEMS.sql
003_RECREATE_PRINT_ORDERS_TABLE.sql
004_INSERT_ALL_PRODUCT_TYPES.sql
005_INSERT_NEW_PRODUCT_TYPES.sql
006_FIX_PRICE_TABLES_RLS.sql
007_CREATE_SYSTEM_SETTINGS.sql
008_ADD_CLINIC_ID_TO_PRINT_ORDERS.sql
```

### 4. 維持するファイル（docs/直下）

- **README.md** - ドキュメント索引（新規作成）
- **SCOPE_PROGRESS.md** - 進捗管理
- **RECENT_UPDATES.md** - 最近の更新履歴（新規作成）
- **requirements.md** - 要件定義
- **NEXT_STEPS.md** - 次のステップ
- **DEV_STATUS.md** - 開発ステータス
- **PHASE1-5_DELIVERY_REPORT.md** - 納品レポート
- **印刷物複数注文_UI設計案.md** - 進行中の設計

### 5. 新規作成ファイル

#### docs/README.md（ドキュメント索引）
プロジェクトのドキュメント構造を一覧化し、必要な情報へのクイックアクセスを提供

#### docs/troubleshooting/README.md
トラブルシューティングガイドの索引

#### docs/migrations/README.md
SQLマイグレーションの実行履歴と順序を記録

## 実施手順

1. ✅ RECENT_UPDATES.md 作成（完了）
2. ⏳ 新規ディレクトリ作成
3. ⏳ ファイル移動・リネーム
4. ⏳ アーカイブディレクトリ作成とファイル移動
5. ⏳ README.md ファイル作成（各ディレクトリ）
6. ⏳ docs/README.md 作成（メインドキュメント索引）
7. ⏳ .gitignore 更新（archiveディレクトリ除外）
8. ⏳ コミット・プッシュ

## 期待される効果

1. **可読性向上**: 必要な情報がすぐ見つかる
2. **保守性向上**: 古いドキュメントとの混同がなくなる
3. **クリーンアーキテクチャ**: 機能別に整理され、責任が明確
4. **新規参加者の学習コスト削減**: ドキュメント構造が明確
5. **Git履歴のクリーン化**: 不要なファイルが除外される
