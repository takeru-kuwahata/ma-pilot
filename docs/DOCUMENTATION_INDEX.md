# MA-Pilot ドキュメント索引

MA-Pilotプロジェクトの現役ドキュメントを一覧化しています。目的に応じて適切なドキュメントを参照してください。

**最終更新**: 2026-01-23（大規模アーカイブ実施後）

---

## 📋 ドキュメント構成

- **現役ドキュメント（docs/）**: 17ファイル、196KB
- **アーカイブ（docs_archive/）**: 34ファイル、552KB（参照不要）

---

## 🎯 目的別クイックガイド

| 目的 | ドキュメント |
|------|------------|
| **プロジェクト概要を知りたい** | [requirements.md](requirements.md) |
| **進捗を確認したい** | [SCOPE_PROGRESS.md](SCOPE_PROGRESS.md) |
| **デプロイしたい** | [DEPLOYMENT_GUIDE.md](DEPLOYMENT_GUIDE.md) → [DEPLOYMENT_CHECKLIST.md](DEPLOYMENT_CHECKLIST.md) |
| **本番環境設定** | [DOMAIN_SSL_SETUP.md](DOMAIN_SSL_SETUP.md) → [ENVIRONMENT_VARIABLES.md](ENVIRONMENT_VARIABLES.md) |
| **トラブル対応** | [TROUBLESHOOTING.md](TROUBLESHOOTING.md) → [FAQ.md](FAQ.md) |
| **セキュリティ確認** | [SECURITY.md](SECURITY.md) → [SECURITY_CHECKLIST.md](SECURITY_CHECKLIST.md) |
| **運用・監視** | [OPERATIONS_GUIDE.md](OPERATIONS_GUIDE.md) → [MONITORING.md](MONITORING.md) |
| **エンドユーザー向け** | [USER_MANUAL.md](USER_MANUAL.md) |

---

## 📂 カテゴリ別ドキュメント一覧

### 1. プロジェクト管理（3ファイル）

| ドキュメント | 行数 | 説明 | 対象者 |
|------------|------|------|--------|
| [requirements.md](requirements.md) | 418 | 要件定義書（未実装機能含む） | 全員 |
| [SCOPE_PROGRESS.md](SCOPE_PROGRESS.md) | 105 | 実装進捗・タスク管理 | PM、開発者 |
| [ROADMAP.md](ROADMAP.md) | 276 | 今後の開発計画・機能拡張ロードマップ | PM、経営者 |

---

### 2. デプロイ・本番環境（6ファイル）

| ドキュメント | 行数 | 説明 | 重要度 |
|------------|------|------|--------|
| [DEPLOYMENT_GUIDE.md](DEPLOYMENT_GUIDE.md) | 464 | Vercel/Render.comへのデプロイ手順 | ⭐️⭐️⭐️ |
| [DEPLOYMENT_CHECKLIST.md](DEPLOYMENT_CHECKLIST.md) | 496 | デプロイ前チェックリスト | ⭐️⭐️⭐️ |
| [DOMAIN_SSL_SETUP.md](DOMAIN_SSL_SETUP.md) | 519 | ドメイン・SSL証明書設定 | ⭐️⭐️⭐️ |
| [PRODUCTION_CHECKLIST.md](PRODUCTION_CHECKLIST.md) | 287 | 本番環境チェックリスト | ⭐️⭐️⭐️ |
| [ENVIRONMENT_VARIABLES.md](ENVIRONMENT_VARIABLES.md) | 363 | 環境変数一覧・設定方法 | ⭐️⭐️⭐️ |
| [TROUBLESHOOTING.md](TROUBLESHOOTING.md) | 312 | トラブルシューティングガイド | ⭐️⭐️ |

**デプロイ手順**:
1. [DEPLOYMENT_CHECKLIST.md](DEPLOYMENT_CHECKLIST.md)で事前確認
2. [DEPLOYMENT_GUIDE.md](DEPLOYMENT_GUIDE.md)の手順に従ってデプロイ
3. [DOMAIN_SSL_SETUP.md](DOMAIN_SSL_SETUP.md)でドメイン・SSL設定
4. [PRODUCTION_CHECKLIST.md](PRODUCTION_CHECKLIST.md)で本番確認

---

### 3. セキュリティ（2ファイル）

| ドキュメント | 行数 | 説明 | 重要度 |
|------------|------|------|--------|
| [SECURITY.md](SECURITY.md) | 309 | セキュリティガイド・ベストプラクティス | ⭐️⭐️⭐️ |
| [SECURITY_CHECKLIST.md](SECURITY_CHECKLIST.md) | 231 | セキュリティチェックリスト | ⭐️⭐️⭐️ |

**セキュリティ対策**:
- Supabase RLS（Row Level Security）実装済み
- CORS、レート制限、セキュリティヘッダー実装済み
- 環境変数での機密情報管理

---

### 4. 運用・監視（2ファイル）

| ドキュメント | 行数 | 説明 | 重要度 |
|------------|------|------|--------|
| [OPERATIONS_GUIDE.md](OPERATIONS_GUIDE.md) | 303 | 運用ガイド（バックアップ、監視、障害対応） | ⭐️⭐️⭐️ |
| [MONITORING.md](MONITORING.md) | 453 | モニタリング設定・アラート設定 | ⭐️⭐️⭐️ |

**本番運用で必要**:
- サーバー監視（Render.com無料枠は15分でスリープ）
- エラー監視（Sentry等の導入推奨）
- バックアップ戦略（Supabase自動バックアップ）

---

### 5. リファレンス（3ファイル）

| ドキュメント | 行数 | 説明 | 対象者 |
|------------|------|------|--------|
| [GLOSSARY.md](GLOSSARY.md) | 208 | プロジェクト固有用語集 | 全員 |
| [FAQ.md](FAQ.md) | 249 | よくある質問 | 全員 |
| [USER_MANUAL.md](USER_MANUAL.md) | 276 | エンドユーザー向けマニュアル | 医院スタッフ |

---

### 6. その他（1ファイル）

| ドキュメント | 行数 | 説明 | 対象者 |
|------------|------|------|--------|
| [DOCUMENTATION_INDEX.md](DOCUMENTATION_INDEX.md) | 260 | このファイル（ドキュメント索引） | 全員 |

---

## 📦 アーカイブドキュメント

実装完了済み・参照不要なドキュメントは`docs_archive/`に移動しました（34ファイル、552KB）。

**アーカイブ内容**:
- 企画・調査資料（5ファイル）
- 実装完了済み詳細設計（API仕様、DB仕様、実装詳細等、11ファイル）
- 実装完了済みガイド（アクセシビリティ、国際化、パフォーマンス等、9ファイル）
- Phase 6未実装詳細設計（7ファイル）
- その他（2ファイル）

詳細は[docs_archive/README.md](../docs_archive/README.md)を参照してください。

**注意**: アーカイブは`.gitignore`および`.claudeignore`で除外されており、GitHubプッシュ対象外、Claude Code読み込み対象外です。

---

## 🔍 ドキュメント検索

### コマンドライン検索

```bash
# docsディレクトリ内を検索
grep -r "キーワード" docs/

# アーカイブも含めて検索
grep -r "キーワード" docs/ docs_archive/
```

### よく検索されるキーワード

| キーワード | 該当ドキュメント |
|-----------|--------------|
| デプロイ | DEPLOYMENT_GUIDE.md, DEPLOYMENT_CHECKLIST.md |
| 環境変数 | ENVIRONMENT_VARIABLES.md |
| エラー | TROUBLESHOOTING.md, FAQ.md |
| セキュリティ | SECURITY.md, SECURITY_CHECKLIST.md |
| 監視 | MONITORING.md, OPERATIONS_GUIDE.md |

---

## 📝 ドキュメント更新ルール

1. **実装完了後は詳細設計をアーカイブ**
   - コードが真実源となったドキュメントは`docs_archive/`へ移動

2. **運用ドキュメントは保持**
   - デプロイ手順書、トラブルシューティング等は`docs/`に保持

3. **索引の更新**
   - ドキュメント追加・削除時はこのファイルを更新

---

**ドキュメント削減効果**:
- Before: 51ファイル、744KB
- After: 17ファイル、196KB
- 削減率: **66.7%削減**（ファイル数）、**73.7%削減**（サイズ）

これにより、Claude Codeのフリーズリスクが大幅に低減しました。
