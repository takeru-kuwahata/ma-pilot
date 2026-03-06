# MA-Pilot セキュリティポリシー

## 概要

MA-Pilotは歯科医院経営分析システムとして、医療機関の機密情報を扱います。そのため、セキュリティを最優先事項として設計・実装されています。

## セキュリティ原則

### 1. 多層防御（Defense in Depth）

- フロントエンド、バックエンド、データベースの各層でセキュリティ対策を実施
- 単一障害点（Single Point of Failure）を排除

### 2. 最小権限の原則（Principle of Least Privilege）

- ユーザーは業務に必要な最小限の権限のみ付与
- ロールベースアクセス制御（RBAC）を実装

### 3. デフォルトで安全（Secure by Default）

- 本番環境ではHTTPS必須
- APIドキュメントは開発環境のみ公開
- すべてのテーブルでRow Level Security（RLS）を有効化

### 4. ゼロトラスト

- すべてのリクエストを信頼せず、認証・認可を必須化
- IPアドレス、ユーザーエージェント等を記録

## 認証・認可

### 認証方式

- **Supabase Auth** によるJWTトークンベース認証
- トークンは HTTP-only Cookie に保存（XSS対策）
- セッション有効期限: 24時間（設定変更可能）

### ユーザーロール

| ロール | 権限 | 用途 |
|--------|------|------|
| `system_admin` | 全医院データへのアクセス、システム設定変更 | システム管理者 |
| `clinic_owner` | 自医院データの全操作、スタッフ管理 | 医院オーナー |
| `clinic_editor` | 自医院データの閲覧・編集 | 事務スタッフ |
| `clinic_viewer` | 自医院データの閲覧のみ | 閲覧専用アカウント |

### ロールベースアクセス制御（RBAC）

```python
# 例: クリニック編集者以上のみアクセス可能
@router.put('/api/monthly-data/{id}')
async def update_monthly_data(
    id: str,
    user_context: UserContext = Depends(require_role('clinic_editor', 'clinic_owner', 'system_admin'))
):
    # 処理
```

## データベースセキュリティ

### Row Level Security（RLS）

全テーブルでRLSを有効化し、PostgreSQL レベルでアクセス制御を実施。

#### clinicsテーブル

- **SELECT**: 自医院またはシステム管理者のみ
- **INSERT**: システム管理者のみ
- **UPDATE**: クリニックオーナー以上
- **DELETE**: システム管理者のみ

#### monthly_data、simulations、reports、market_analysesテーブル

- **SELECT**: 自医院データのみ
- **INSERT**: クリニック編集者以上
- **UPDATE**: クリニック編集者以上
- **DELETE**: システム管理者のみ（一部テーブル）

#### user_metadataテーブル

- **SELECT**: 自分自身、同クリニックユーザー、システム管理者
- **INSERT/UPDATE**: システム管理者、クリニックオーナー（自クリニックのみ）
- **DELETE**: システム管理者のみ

#### 公開テーブル（print_orders、price_tables）

- **SELECT**: 全ユーザー可能（公開フォーム対応）
- **INSERT**: 全ユーザー可能（print_ordersのみ）
- **UPDATE/DELETE**: システム管理者のみ

詳細: `/supabase/rls_policies.sql`

### SQL Injection対策

- Supabase SDK（postgrest）を使用し、プリペアドステートメントで自動エスケープ
- 生SQLの実行は禁止

### データ暗号化

- **通信**: TLS 1.2以上（HTTPS）
- **保管**: Supabaseのデフォルト暗号化（AES-256）
- **パスワード**: bcryptハッシュ化（Supabase Authのデフォルト）

## APIセキュリティ

### レート制限

| エンドポイント種別 | 制限 |
|-------------------|------|
| 認証エンドポイント | 5回/分 |
| 読み取り専用 | 100回/分 |
| 書き込み | 30回/分 |
| 重い処理（PDF生成等） | 5回/分 |
| 公開エンドポイント | 200回/分 |

実装: `/backend/src/middleware/rate_limit.py`

### セキュリティヘッダー

以下のHTTPセキュリティヘッダーを設定:

- `X-Content-Type-Options: nosniff` - MIMEタイプスニッフィング防止
- `X-Frame-Options: DENY` - クリックジャッキング防止
- `X-XSS-Protection: 1; mode=block` - XSS攻撃防止
- `Strict-Transport-Security` - HTTPS強制（本番環境のみ）
- `Content-Security-Policy` - CSP設定
- `Referrer-Policy: strict-origin-when-cross-origin` - リファラ制御

実装: `/backend/main.py`

### CORS設定

許可されたオリジンのみアクセス可能:
- 開発環境: `http://localhost:3247`, `http://localhost:3248`
- 本番環境: `https://ma-pilot.vercel.app`

### 信頼できるホスト制限

TrustedHostMiddlewareで許可されたホスト以外からのアクセスを拒否。

## 監査ログ

### 記録対象イベント

すべての重要なセキュリティイベントを `security_audit_logs` テーブルに記録:

- ログイン/ログアウト
- 認証失敗
- データアクセス（重要なエンドポイント）
- データ変更
- 権限変更
- アカウント作成・削除
- パスワードリセット
- 不審なアクティビティ

### ログ項目

- `user_id` - ユーザーID
- `event_type` - イベントタイプ
- `table_name` - 操作対象テーブル
- `record_id` - 操作対象レコードID
- `details` - 追加詳細（JSON形式）
- `ip_address` - IPアドレス
- `user_agent` - ユーザーエージェント
- `created_at` - 発生日時

実装: `/backend/src/utils/logger.py`

### ログの閲覧権限

- システム管理者のみ閲覧可能（RLSで制御）

## 脆弱性対策

### XSS（Cross-Site Scripting）対策

- Reactのデフォルトエスケープ機能を活用
- `dangerouslySetInnerHTML`の使用を禁止
- Content Security Policy（CSP）設定

### CSRF（Cross-Site Request Forgery）対策

- トークンベース認証（ステートレス）でCSRFリスクを低減
- SameSite Cookie属性設定

### SQL Injection対策

- ORMライブラリ（Supabase SDK）の使用
- プリペアドステートメント

### SSRF（Server-Side Request Forgery）対策

- 外部APIへのリクエストURLをホワイトリスト化
- プライベートIPアドレスへのアクセスを禁止

### 認証情報の保護

- `.env`ファイルはGit管理対象外（`.gitignore`に追加）
- GitHub Secretsで環境変数を管理
- 本番環境ではSupabase Service Keyを使用（Anon Keyは非推奨）

## セキュリティスキャン

### 自動スキャン（GitHub Actions）

毎プッシュ、毎PR、毎週月曜日に自動実行:

- **Bandit** - Pythonコードのセキュリティスキャン
- **npm audit** - JavaScriptパッケージの脆弱性スキャン
- **CodeQL** - コード品質・セキュリティ解析
- **GitGuardian** - 秘密情報漏洩スキャン
- **Dependency Review** - 依存関係の脆弱性チェック

設定: `/.github/workflows/security.yml`

### 手動スキャン

```bash
# Pythonセキュリティスキャン
cd backend
bandit -r src

# npmパッケージ脆弱性スキャン
cd frontend
npm audit
```

## インシデント対応

### 脆弱性報告

セキュリティ上の問題を発見した場合:

1. **報告先**: [セキュリティ担当者メールアドレス（要設定）]
2. **報告内容**:
   - 脆弱性の詳細
   - 再現手順
   - 影響範囲
   - 発見日時

### 対応フロー

1. **受領確認** - 24時間以内
2. **トリアージ** - 48時間以内に重大度評価
3. **修正** - 重大度に応じて対応
   - Critical: 24時間以内
   - High: 72時間以内
   - Medium: 1週間以内
   - Low: 次回リリース
4. **通知** - 影響を受けるユーザーへの通知
5. **公開** - 修正後、脆弱性情報を公開

## コンプライアンス

### データ保護法

- **個人情報保護法（日本）**: 準拠
- **GDPR**: 将来対応予定（EU展開時）

### 医療情報セキュリティガイドライン

- 厚生労働省「医療情報システムの安全管理に関するガイドライン」を参考に設計

## セキュリティベストプラクティス

### 開発者向け

1. **環境変数の管理**
   - `.env`ファイルは絶対にコミットしない
   - サンプルは`.env.example`として提供

2. **依存関係の更新**
   - 定期的に`npm audit`、`pip-audit`を実行
   - セキュリティアップデートは最優先で適用

3. **コードレビュー**
   - すべてのPRでセキュリティレビューを実施
   - 認証・認可ロジックは特に注意

4. **テスト**
   - セキュリティテストを必須化
   - ロール別のアクセステストを実施

### 運用者向け

1. **パスワードポリシー**
   - 最低8文字、英数字+記号の組み合わせ
   - 定期的なパスワード変更を推奨

2. **アクセスログ監視**
   - 異常なアクセスパターンを検知
   - 不審なIPアドレスをブロック

3. **バックアップ**
   - データベースの日次バックアップ
   - バックアップデータの暗号化

## 更新履歴

| 日付 | バージョン | 変更内容 |
|------|-----------|---------|
| 2025-12-26 | 1.0.0 | 初版作成 |

## 参考資料

- [OWASP Top 10](https://owasp.org/www-project-top-ten/)
- [Supabase Security Best Practices](https://supabase.com/docs/guides/auth/security)
- [FastAPI Security](https://fastapi.tiangolo.com/tutorial/security/)
- [厚生労働省 医療情報システムの安全管理に関するガイドライン](https://www.mhlw.go.jp/stf/shingi/0000516275.html)
